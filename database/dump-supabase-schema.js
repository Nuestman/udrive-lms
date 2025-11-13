// Script to dump the complete schema from Supabase and save it to schema.sql
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.DATABASE_URL;
if (!supabaseUrl) {
  console.error('❌ DATABASE_URL must be set to dump Supabase schema');
  console.error('   Please set DATABASE_URL in your .env file');
  process.exit(1);
}

const pool = new Pool({
  connectionString: supabaseUrl,
  ssl: {
    rejectUnauthorized: false
  },
  max: 5,
  connectionTimeoutMillis: 10000,
});

async function dumpSchema() {
  const client = await pool.connect();
  
  try {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📤 Dumping complete schema from Supabase...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Test connection
    await client.query('SELECT 1');
    console.log('✅ Connected to Supabase\n');
    
    // Use pg_dump equivalent approach - get all DDL statements
    console.log('📊 Generating schema dump...\n');
    
    // Store constraints and indexes to add after all tables are created
    const schemaData = {
      constraints: [],
      indexes: [],
      functions: [],
      triggers: []
    };
    
    let schemaSQL = `-- =============================================\n`;
    schemaSQL += `-- SunLMS Database Schema\n`;
    schemaSQL += `-- Dumped from Supabase: ${new Date().toISOString()}\n`;
    schemaSQL += `-- PostgreSQL Version: ${(await client.query('SELECT version()')).rows[0].version}\n`;
    schemaSQL += `-- =============================================\n\n`;
    
    // Enable extensions
    schemaSQL += `-- Enable necessary extensions\n`;
    schemaSQL += `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";\n`;
    schemaSQL += `CREATE EXTENSION IF NOT EXISTS "pgcrypto";\n\n`;
    
    // Get all tables
    const tablesResult = await client.query(`
      SELECT 
        t.table_name,
        t.table_schema
      FROM information_schema.tables t
      WHERE t.table_schema = 'public'
        AND t.table_type = 'BASE TABLE'
      ORDER BY t.table_name;
    `);
    
    console.log(`📋 Found ${tablesResult.rows.length} tables\n`);
    
    // Get foreign key dependencies to order tables correctly
    const fkDepsResult = await client.query(`
      SELECT
        tc.table_name AS child_table,
        ccu.table_name AS parent_table
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
        AND ccu.table_schema = 'public';
    `);
    
    // Build dependency map
    const dependencies = new Map();
    const allTables = tablesResult.rows.map(r => r.table_name);
    allTables.forEach(table => dependencies.set(table, new Set()));
    
    fkDepsResult.rows.forEach(row => {
      if (dependencies.has(row.child_table)) {
        dependencies.get(row.child_table).add(row.parent_table);
      }
    });
    
    // Topological sort to order tables by dependencies
    const sortedTables = [];
    const visited = new Set();
    const visiting = new Set();
    
    function visit(table) {
      if (visiting.has(table)) {
        // Circular dependency - just add it
        if (!visited.has(table)) {
          sortedTables.push(table);
          visited.add(table);
        }
        return;
      }
      if (visited.has(table)) return;
      
      visiting.add(table);
      const deps = dependencies.get(table) || new Set();
      deps.forEach(dep => {
        if (allTables.includes(dep)) {
          visit(dep);
        }
      });
      visiting.delete(table);
      
      if (!visited.has(table)) {
        sortedTables.push(table);
        visited.add(table);
      }
    }
    
    allTables.forEach(table => visit(table));
    
    console.log(`📊 Ordered ${sortedTables.length} tables by dependencies\n`);
    
    // Create a map for quick lookup
    const tableMap = new Map(tablesResult.rows.map(r => [r.table_name, r]));
    
    // For each table in dependency order, get the CREATE TABLE statement
    for (const tableName of sortedTables) {
      const table = tableMap.get(tableName);
      console.log(`  📦 Dumping ${tableName}...`);
      
      try {
        // Get table definition using pg_get_tabledef or manual construction
        // Since pg_get_tabledef might not be available, we'll build it manually
        
        // Get columns
        const columnsResult = await client.query(`
          SELECT 
            column_name,
            data_type,
            character_maximum_length,
            is_nullable,
            column_default,
            udt_name
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = $1
          ORDER BY ordinal_position;
        `, [tableName]);
        
        // Get constraints (primary keys, foreign keys, checks, unique)
        const constraintsResult = await client.query(`
          SELECT
            con.conname AS constraint_name,
            con.contype AS constraint_type,
            pg_get_constraintdef(con.oid) AS constraint_def
          FROM pg_constraint con
          JOIN pg_class rel ON rel.oid = con.conrelid
          JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
          WHERE nsp.nspname = 'public'
            AND rel.relname = $1
            AND con.contype IN ('p', 'f', 'c', 'u');
        `, [tableName]);
        
        // Get indexes
        const indexesResult = await client.query(`
          SELECT
            indexname,
            indexdef
          FROM pg_indexes
          WHERE schemaname = 'public'
            AND tablename = $1;
        `, [tableName]);
        
        // Build CREATE TABLE statement
        schemaSQL += `-- =============================================\n`;
        schemaSQL += `-- TABLE: ${tableName}\n`;
        schemaSQL += `-- =============================================\n`;
        schemaSQL += `CREATE TABLE IF NOT EXISTS ${tableName} (\n`;
        
        const columnDefs = [];
        const primaryKeyCols = [];
        const uniqueConstraints = [];
        const checkConstraints = [];
        const foreignKeys = [];
        
        // Get primary key columns
        const pkResult = await client.query(`
          SELECT a.attname
          FROM pg_index i
          JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
          WHERE i.indrelid = $1::regclass
            AND i.indisprimary;
        `, [`public.${tableName}`]);
        
        const pkColumns = pkResult.rows.map(r => r.attname);
        
        // Process columns
        for (const col of columnsResult.rows) {
          let colDef = `    ${col.column_name} `;
          
          // Map data type
          let dataType = col.udt_name;
          if (dataType === 'varchar' && col.character_maximum_length) {
            dataType = `VARCHAR(${col.character_maximum_length})`;
          } else if (dataType === 'bpchar') {
            dataType = 'CHAR';
          } else if (dataType === 'int4') {
            dataType = 'INTEGER';
          } else if (dataType === 'int8') {
            dataType = 'BIGINT';
          } else if (dataType === 'bool') {
            dataType = 'BOOLEAN';
          } else if (dataType === 'timestamptz') {
            dataType = 'TIMESTAMP WITH TIME ZONE';
          } else if (dataType === 'uuid') {
            dataType = 'UUID';
          } else if (dataType === 'text') {
            dataType = 'TEXT';
          } else if (dataType === 'jsonb') {
            dataType = 'JSONB';
          } else if (dataType.startsWith('_')) {
            // Array type
            dataType = dataType.substring(1).toUpperCase() + '[]';
          } else {
            dataType = dataType.toUpperCase();
          }
          
          colDef += dataType;
          
          // Add default
          if (col.column_default) {
            // Clean up default value
            let defaultValue = col.column_default;
            // Replace function calls with their equivalents
            defaultValue = defaultValue.replace(/::\w+/g, ''); // Remove type casts in default
            colDef += ` DEFAULT ${defaultValue}`;
          }
          
          // Add NOT NULL
          if (col.is_nullable === 'NO') {
            colDef += ' NOT NULL';
          }
          
          columnDefs.push(colDef);
        }
        
        schemaSQL += columnDefs.join(',\n');
        
        // Add PRIMARY KEY if single column
        if (pkColumns.length === 1) {
          schemaSQL += `,\n    PRIMARY KEY (${pkColumns[0]})`;
        } else if (pkColumns.length > 1) {
          schemaSQL += `,\n    PRIMARY KEY (${pkColumns.join(', ')})`;
        }
        
        schemaSQL += '\n);\n\n';
        
        // Store constraints and indexes for later (after all tables are created)
        const tableConstraints = [];
        const tableIndexes = [];
        
        // Collect constraints
        for (const constraint of constraintsResult.rows) {
          if (constraint.constraint_type === 'p') {
            // Primary key - already handled in CREATE TABLE, skip
            continue;
          } else if (constraint.constraint_type === 'f') {
            // Foreign key - store for later
            tableConstraints.push(`ALTER TABLE ${tableName} ADD CONSTRAINT ${constraint.constraint_name} ${constraint.constraint_def};`);
          } else if (constraint.constraint_type === 'c') {
            // Check constraint - store for later
            tableConstraints.push(`ALTER TABLE ${tableName} ADD CONSTRAINT ${constraint.constraint_name} ${constraint.constraint_def};`);
          } else if (constraint.constraint_type === 'u') {
            // Unique constraint - store for later
            tableConstraints.push(`ALTER TABLE ${tableName} ADD CONSTRAINT ${constraint.constraint_name} ${constraint.constraint_def};`);
          }
        }
        
        // Collect indexes (excluding primary key and unique indexes that are constraints)
        for (const idx of indexesResult.rows) {
          // Skip if it's a primary key or unique constraint index
          const isConstraintIndex = constraintsResult.rows.some(
            c => idx.indexname.includes(c.constraint_name)
          );
          if (!isConstraintIndex) {
            tableIndexes.push(`${idx.indexdef};`);
          }
        }
        
        // Store for later processing
        if (!schemaData.constraints) schemaData.constraints = [];
        if (!schemaData.indexes) schemaData.indexes = [];
        schemaData.constraints.push(...tableConstraints);
        schemaData.indexes.push(...tableIndexes);
        
      } catch (error) {
        console.error(`    ❌ Error dumping ${tableName}:`, error.message);
        schemaSQL += `-- Error dumping ${tableName}: ${error.message}\n\n`;
      }
    }
    
    // Now add all constraints after all tables are created
    if (schemaData.constraints && schemaData.constraints.length > 0) {
      schemaSQL += `-- =============================================\n`;
      schemaSQL += `-- CONSTRAINTS (Foreign Keys, Checks, Unique)\n`;
      schemaSQL += `-- =============================================\n\n`;
      
      for (const constraint of schemaData.constraints) {
        schemaSQL += `${constraint}\n`;
      }
      schemaSQL += '\n';
    }
    
    // Add all indexes
    if (schemaData.indexes && schemaData.indexes.length > 0) {
      schemaSQL += `-- =============================================\n`;
      schemaSQL += `-- INDEXES\n`;
      schemaSQL += `-- =============================================\n\n`;
      
      for (const index of schemaData.indexes) {
        schemaSQL += `${index}\n`;
      }
      schemaSQL += '\n';
    }
    
    // Get functions
    console.log('\n📦 Dumping functions...');
    const functionsResult = await client.query(`
      SELECT 
        p.proname AS function_name,
        pg_get_functiondef(p.oid) AS function_def
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public'
        AND p.prokind = 'f'
      ORDER BY p.proname;
    `);
    
    if (functionsResult.rows.length > 0) {
      schemaSQL += `-- =============================================\n`;
      schemaSQL += `-- FUNCTIONS\n`;
      schemaSQL += `-- =============================================\n\n`;
      
      for (const func of functionsResult.rows) {
        schemaSQL += `${func.function_def};\n\n`;
      }
    }
    
    // Get triggers
    console.log('📦 Dumping triggers...');
    const triggersResult = await client.query(`
      SELECT
        tgname AS trigger_name,
        pg_get_triggerdef(oid) AS trigger_def
      FROM pg_trigger
      WHERE tgisinternal = false
        AND tgrelid IN (
          SELECT oid FROM pg_class WHERE relnamespace = (
            SELECT oid FROM pg_namespace WHERE nspname = 'public'
          )
        )
      ORDER BY tgname;
    `);
    
    if (triggersResult.rows.length > 0) {
      schemaSQL += `-- =============================================\n`;
      schemaSQL += `-- TRIGGERS\n`;
      schemaSQL += `-- =============================================\n\n`;
      
      for (const trigger of triggersResult.rows) {
        schemaSQL += `${trigger.trigger_def};\n\n`;
      }
    }
    
    // Write to file
    const schemaPath = path.join(__dirname, 'schema.sql');
    const backupPath = path.join(__dirname, 'schema.sql.backup');
    
    // Backup existing schema
    if (fs.existsSync(schemaPath)) {
      fs.copyFileSync(schemaPath, backupPath);
      console.log(`\n💾 Backed up existing schema.sql to schema.sql.backup`);
    }
    
    fs.writeFileSync(schemaPath, schemaSQL, 'utf8');
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ Schema dump complete!`);
    console.log(`📁 Saved to: ${schemaPath}`);
    console.log('\n💡 Next steps:');
    console.log('   1. Drop and recreate your local database:');
    console.log('      DROP DATABASE sunlms;');
    console.log('      CREATE DATABASE sunlms;');
    console.log('   2. Run the new schema:');
    console.log('      node database/run-schema.js');
    console.log('   3. Import the data:');
    console.log('      node database/import-supabase-data.js');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
  } catch (error) {
    console.error('❌ Error dumping schema:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

dumpSchema();

