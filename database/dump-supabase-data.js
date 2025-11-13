// Script to dump all data from Supabase to SQL format
// This exports all table data as INSERT statements for local development
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import { getDatabaseConfig } from '../server/config/database.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Force Supabase connection for dumping
const supabaseUrl = process.env.DATABASE_URL;
if (!supabaseUrl) {
  console.error('❌ DATABASE_URL must be set to dump Supabase data');
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

// Tables to export (in dependency order to maintain foreign key constraints)
const TABLES = [
  'tenants',
  'users',
  'user_profiles',
  'courses',
  'modules',
  'lessons',
  'quizzes',
  'quiz_questions',
  'enrollments',
  'lesson_progress',
  'quiz_attempts',
  'certificates',
  'assignments',
  'assignment_submissions',
  'media_files',
  'notifications',
  'reviews',
  'platform_feedback',
  'testimonials',
  'course_review_settings',
  'course_review_prompt_history',
  'contact_messages',
  'contact_message_replies',
  'announcements',
  'announcement_media',
  'announcement_reads',
  'course_support_questions',
  'course_support_replies',
  'course_support_attachments',
  'review_comments',
  'content_progress',
  'audit_log',
  'goals',
];

// Helper function to escape SQL strings
function escapeSQL(value, dataType, udtName = '') {
  if (value === null || value === undefined) {
    return 'NULL';
  }
  if (typeof value === 'boolean') {
    return value ? 'TRUE' : 'FALSE';
  }
  if (typeof value === 'number') {
    return value.toString();
  }
  if (value instanceof Date) {
    return `'${value.toISOString()}'`;
  }
  // Handle JSONB/JSON columns FIRST - before array check
  if (dataType === 'jsonb' || dataType === 'json') {
    // JSONB can contain arrays, objects, or primitives
    // Always stringify to JSON format, regardless of the value type
    let jsonStr;
    if (typeof value === 'string') {
      // If it's already a string, check if it's valid JSON
      try {
        // Validate it's valid JSON by parsing and re-stringifying
        const parsed = JSON.parse(value);
        jsonStr = JSON.stringify(parsed);
      } catch (e) {
        // Not valid JSON, treat as a string value
        jsonStr = JSON.stringify(value);
      }
    } else {
      // Object, array, or primitive - stringify it
      jsonStr = JSON.stringify(value);
    }
    return `'${jsonStr.replace(/'/g, "''")}'::jsonb`;
  }
  
  // Handle PostgreSQL array types (NOT JSONB arrays)
  if (dataType === 'ARRAY' || (dataType.includes('[]') && dataType !== 'jsonb[]')) {
    // Handle PostgreSQL array types - convert to proper array syntax
    if (Array.isArray(value)) {
      // Handle empty arrays - need to cast to the correct type
      if (value.length === 0) {
        // Determine the base type from udt_name or dataType
        let baseType = 'text'; // default
        if (udtName && udtName.endsWith('[]')) {
          // Extract base type from udt_name like '_text', '_uuid', etc.
          const match = udtName.match(/^_(\w+)$/);
          if (match) {
            const innerType = match[1];
            // Map PostgreSQL types
            if (innerType === 'uuid') baseType = 'uuid';
            else if (innerType === 'int4' || innerType === 'integer') baseType = 'integer';
            else if (innerType === 'int8' || innerType === 'bigint') baseType = 'bigint';
            else if (innerType === 'bool' || innerType === 'boolean') baseType = 'boolean';
            else if (innerType === 'text' || innerType === 'varchar') baseType = 'text';
            else baseType = 'text';
          } else {
            baseType = 'text';
          }
        } else if (dataType.includes('[]')) {
          baseType = dataType.replace('[]', '').toLowerCase();
          // Map common types
          if (baseType === 'uuid') baseType = 'uuid';
          else if (baseType === 'integer' || baseType === 'int4') baseType = 'integer';
          else if (baseType === 'bigint' || baseType === 'int8') baseType = 'bigint';
          else if (baseType === 'boolean' || baseType === 'bool') baseType = 'boolean';
          else baseType = 'text';
        }
        return `ARRAY[]::${baseType}[]`;
      }
      
      // Convert array to PostgreSQL array format: ARRAY['value1', 'value2']
      const arrayValues = value.map(v => {
        if (v === null || v === undefined) {
          return 'NULL';
        }
        if (typeof v === 'string') {
          return `'${v.replace(/'/g, "''")}'`;
        }
        if (typeof v === 'number' || typeof v === 'boolean') {
          return String(v);
        }
        // For objects, stringify them
        return `'${JSON.stringify(v).replace(/'/g, "''")}'`;
      }).join(', ');
      return `ARRAY[${arrayValues}]`;
    }
    // If it's a string representation of an array, try to parse it
    if (typeof value === 'string' && (value.startsWith('[') || value.startsWith('{'))) {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          const arrayValues = parsed.map(v => {
            if (typeof v === 'string') {
              return `'${v.replace(/'/g, "''")}'`;
            }
            return v;
          }).join(', ');
          return `ARRAY[${arrayValues}]`;
        }
      } catch (e) {
        // If parsing fails, treat as string
      }
    }
    // Fallback: treat as string
    return `'${String(value).replace(/'/g, "''")}'`;
  }
  // Escape single quotes in strings
  return `'${String(value).replace(/'/g, "''")}'`;
}

// Generate INSERT statement for a row
function generateInsert(tableName, row, columns, columnTypes) {
  const values = columns.map((col, idx) => {
    const colType = columnTypes[idx];
    const dataType = colType?.data_type || 'text';
    const udtName = colType?.udt_name || '';
    // Pass full column type info for better array handling
    return escapeSQL(row[col], dataType, udtName);
  });
  return `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${values.join(', ')}) ON CONFLICT DO NOTHING;`;
}

async function dumpTableData(tableName) {
  try {
    console.log(`  📦 Dumping ${tableName}...`);
    
    // Get column names and types (including array element types)
    const columnQuery = `
      SELECT 
        c.column_name, 
        c.data_type,
        c.udt_name,
        CASE 
          WHEN c.data_type = 'ARRAY' THEN 
            (SELECT t.typname FROM pg_type t WHERE t.oid = c.udt_name::regtype::oid)
          ELSE NULL
        END as array_element_type
      FROM information_schema.columns c
      WHERE c.table_schema = 'public' 
      AND c.table_name = $1 
      ORDER BY c.ordinal_position;
    `;
    const columnResult = await pool.query(columnQuery, [tableName]);
    
    if (columnResult.rows.length === 0) {
      console.log(`    ⚠️  Table ${tableName} does not exist, skipping...`);
      return '';
    }
    
    const columns = columnResult.rows.map(row => row.column_name);
    const columnTypes = columnResult.rows.map(row => ({ 
      data_type: row.data_type,
      udt_name: row.udt_name,
      array_element_type: row.array_element_type
    }));
    
    // Determine ordering - check what columns exist
    const hasCreatedAt = columns.includes('created_at');
    const hasId = columns.includes('id');
    const hasReadAt = columns.includes('read_at');
    const hasStartedAt = columns.includes('started_at');
    
    let orderBy = '';
    if (hasCreatedAt && hasId) {
      orderBy = 'ORDER BY created_at, id';
    } else if (hasCreatedAt) {
      // For tables with created_at but no id (like course_review_settings with course_id as PK)
      const pkColumn = columns.find(col => 
        columnResult.rows.find(r => r.column_name === col && r.data_type.includes('uuid'))
      ) || columns[0];
      orderBy = `ORDER BY created_at, ${pkColumn}`;
    } else if (hasReadAt) {
      // For announcement_reads
      orderBy = 'ORDER BY read_at';
    } else if (hasStartedAt && hasId) {
      // For content_progress
      orderBy = 'ORDER BY started_at, id';
    } else if (hasId) {
      orderBy = 'ORDER BY id';
    } else {
      // Use first column as fallback
      orderBy = `ORDER BY ${columns[0]}`;
    }
    
    // Get all data
    const dataResult = await pool.query(`SELECT * FROM ${tableName} ${orderBy};`);
    
    if (dataResult.rows.length === 0) {
      console.log(`    ℹ️  Table ${tableName} is empty`);
      return `-- Table: ${tableName} (empty)\n`;
    }
    
    console.log(`    ✓ Found ${dataResult.rows.length} rows`);
    
    // Generate INSERT statements
    let sql = `\n-- =============================================\n`;
    sql += `-- Table: ${tableName} (${dataResult.rows.length} rows)\n`;
    sql += `-- =============================================\n\n`;
    
    for (const row of dataResult.rows) {
      sql += generateInsert(tableName, row, columns, columnTypes) + '\n';
    }
    
    return sql;
  } catch (error) {
    console.error(`    ❌ Error dumping ${tableName}:`, error.message);
    return `-- Error dumping ${tableName}: ${error.message}\n`;
  }
}

async function dumpAllData() {
  const client = await pool.connect();
  
  try {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📤 Dumping Supabase data to SQL file...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Test connection
    await client.query('SELECT 1');
    console.log('✅ Connected to Supabase\n');
    
    let sqlDump = `-- =============================================\n`;
    sqlDump += `-- SunLMS Data Dump from Supabase\n`;
    sqlDump += `-- Generated: ${new Date().toISOString()}\n`;
    sqlDump += `-- =============================================\n\n`;
    sqlDump += `-- This file contains all data from Supabase\n`;
    sqlDump += `-- Use database/import-supabase-data.js to import into local PostgreSQL\n\n`;
    sqlDump += `BEGIN;\n\n`;
    
    // Disable foreign key checks temporarily (PostgreSQL doesn't have this, but we'll handle order)
    sqlDump += `-- Disable triggers temporarily for faster import\n`;
    sqlDump += `SET session_replication_role = 'replica';\n\n`;
    
    // Dump each table
    for (const table of TABLES) {
      const tableSQL = await dumpTableData(table);
      sqlDump += tableSQL;
    }
    
    // Re-enable foreign key checks
    sqlDump += `\n-- Re-enable triggers\n`;
    sqlDump += `SET session_replication_role = 'origin';\n\n`;
    sqlDump += `COMMIT;\n`;
    
    // Write to file
    const outputPath = path.join(__dirname, 'supabase-data-dump.sql');
    fs.writeFileSync(outputPath, sqlDump, 'utf8');
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ Data dump complete!`);
    console.log(`📁 Saved to: ${outputPath}`);
    console.log('\n💡 Next steps:');
    console.log('   1. Review the dump file if needed');
    console.log('   2. Import to local database:');
    console.log('      node database/import-supabase-data.js');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
  } catch (error) {
    console.error('❌ Error dumping data:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

dumpAllData();

