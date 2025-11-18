// Script to drop, recreate, and set up local database with Supabase schema
import { Pool } from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDatabaseConfig } from '../server/config/database.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Connect to PostgreSQL server (not a specific database) to drop/create database
const adminPool = new Pool({
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  database: 'postgres', // Connect to default postgres database
  user: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
});

const dbName = process.env.DATABASE_NAME || 'sunlms';

async function recreateDatabase() {
  const adminClient = await adminPool.connect();
  
  try {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔄 Recreating local database...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Terminate existing connections
    console.log('🔌 Terminating existing connections...');
    try {
      await adminClient.query(`
        SELECT pg_terminate_backend(pid)
        FROM pg_stat_activity
        WHERE datname = $1 AND pid <> pg_backend_pid();
      `, [dbName]);
    } catch (error) {
      // Ignore if database doesn't exist
    }
    
    // Drop database if exists
    console.log(`🗑️  Dropping database "${dbName}" (if exists)...`);
    try {
      await adminClient.query(`DROP DATABASE IF EXISTS ${dbName};`);
      console.log(`   ✓ Database dropped\n`);
    } catch (error) {
      console.log(`   ⚠️  ${error.message}\n`);
    }
    
    // Create database
    console.log(`📦 Creating database "${dbName}"...`);
    await adminClient.query(`CREATE DATABASE ${dbName};`);
    console.log(`   ✓ Database created\n`);
    
    adminClient.release();
    await adminPool.end();
    
    // Now connect to the new database and run schema
    console.log('📊 Running schema...');
    const dbPool = new Pool({
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT || '5432'),
      database: dbName,
      user: process.env.DATABASE_USER || 'postgres',
      password: process.env.DATABASE_PASSWORD || 'postgres',
    });
    
    const dbClient = await dbPool.connect();
    
    try {
      // Read schema
      const schemaPath = path.join(__dirname, 'schema.sql');
      let schema = fs.readFileSync(schemaPath, 'utf8');
      
      console.log('⚡ Executing schema...');
      
      // Remove duplicate PRIMARY KEY ALTER TABLE statements (already in CREATE TABLE)
      schema = schema.replace(/ALTER TABLE[^;]*ADD CONSTRAINT[^;]*PRIMARY KEY[^;]+;/gi, '-- PRIMARY KEY already in CREATE TABLE\n');
      
      // Split SQL into individual statements, handling dollar-quoted strings
      const statements = [];
      let currentStatement = '';
      let inDollarQuote = false;
      let dollarTag = null;
      let i = 0;
      
      while (i < schema.length) {
        const char = schema[i];
        const remaining = schema.substring(i);
        
        // Check for dollar quote start/end
        if (char === '$') {
          const dollarMatch = remaining.match(/^\$(\w*)\$/);
          if (dollarMatch) {
            if (!inDollarQuote) {
              // Starting dollar quote
              inDollarQuote = true;
              dollarTag = dollarMatch[1];
              currentStatement += dollarMatch[0];
              i += dollarMatch[0].length;
              continue;
            } else if (dollarMatch[1] === dollarTag) {
              // Ending dollar quote
              inDollarQuote = false;
              dollarTag = null;
              currentStatement += dollarMatch[0];
              i += dollarMatch[0].length;
              continue;
            }
          }
        }
        
        // If we're in a dollar quote, just add the character
        if (inDollarQuote) {
          currentStatement += char;
          i++;
          continue;
        }
        
        // Check for semicolon (statement terminator)
        if (char === ';') {
          currentStatement += char;
          const trimmed = currentStatement.trim();
          if (trimmed && !trimmed.startsWith('--')) {
            statements.push(trimmed);
          }
          currentStatement = '';
          i++;
          continue;
        }
        
        currentStatement += char;
        i++;
      }
      
      // Add any remaining statement
      if (currentStatement.trim() && !currentStatement.trim().startsWith('--')) {
        statements.push(currentStatement.trim());
      }
      
      console.log(`   📝 Found ${statements.length} SQL statements\n`);
      
      // Execute statements one by one
      let executed = 0;
      let skipped = 0;
      let errors = [];
      
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i].trim();
        
        // Skip empty statements and comments
        if (!statement || statement.startsWith('--') || statement.length < 5) {
          skipped++;
          continue;
        }
        
        try {
          await dbClient.query(statement);
          executed++;
        } catch (error) {
          // Only skip truly non-critical errors
          if (error.code === '42P07' || // relation already exists
              error.code === '42710' || // duplicate object
              error.message.includes('already exists')) {
            skipped++;
            continue;
          }
          
          // Log actual errors
          errors.push({
            statement: statement.substring(0, 100),
            error: error.message,
            code: error.code
          });
          
          // Stop on critical errors that prevent further execution
          if (error.code === '42P01' && !error.message.includes('does not exist')) {
            // Relation does not exist - might be dependency issue, continue
            continue;
          }
        }
      }
      
      console.log(`   ✓ Executed ${executed} statements successfully`);
      if (skipped > 0) {
        console.log(`   ⏭️  Skipped ${skipped} statements (already exist)`);
      }
      if (errors.length > 0) {
        console.log(`   ⚠️  ${errors.length} errors encountered:`);
        errors.slice(0, 5).forEach((err, idx) => {
          console.log(`      ${idx + 1}. ${err.error.substring(0, 70)}...`);
        });
        if (errors.length > 5) {
          console.log(`      ... and ${errors.length - 5} more`);
        }
      }
      console.log('');
      
      // Verify tables were created
      const tablesResult = await dbClient.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name;
      `);
      
      console.log(`📋 Created ${tablesResult.rows.length} tables:\n`);
      tablesResult.rows.forEach(row => {
        console.log(`   ✓ ${row.table_name}`);
      });
      
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('✅ Database recreated successfully!');
      console.log('\n💡 Next step: Import Supabase data');
      console.log('   node database/import-supabase-data.js');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      
    } catch (error) {
      console.error('❌ Error running schema:', error.message);
      throw error;
    } finally {
      dbClient.release();
      await dbPool.end();
    }
    
  } catch (error) {
    console.error('❌ Error recreating database:', error.message);
    console.error(error);
    process.exit(1);
  }
}

recreateDatabase();

