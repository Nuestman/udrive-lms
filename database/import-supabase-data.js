// Script to import dumped Supabase data into local PostgreSQL
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import { getDatabaseConfig } from '../server/config/database.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use local database config (should NOT have DATABASE_URL set)
const config = getDatabaseConfig();

if (config.connectionString) {
  console.error('❌ DATABASE_URL is set. This script should use local PostgreSQL.');
  console.error('   Please comment out DATABASE_URL in your .env file');
  process.exit(1);
}

const pool = new Pool(config);
const dumpFile = path.join(__dirname, 'supabase-data-dump.sql');

async function importData() {
  const client = await pool.connect();
  
  try {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📥 Importing Supabase data to local PostgreSQL...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Check if dump file exists
    if (!fs.existsSync(dumpFile)) {
      console.error(`❌ Dump file not found: ${dumpFile}`);
      console.error('   Please run: node database/dump-supabase-data.js first');
      process.exit(1);
    }
    
    // Test connection
    await client.query('SELECT 1');
    console.log(`✅ Connected to local database: ${config.database}\n`);
    
    // Read dump file
    console.log('📖 Reading dump file...');
    const sqlDump = fs.readFileSync(dumpFile, 'utf8');
    console.log(`   ✓ File size: ${(sqlDump.length / 1024).toFixed(2)} KB\n`);
    
    // Execute the dump
    console.log('⚡ Importing data...');
    console.log('   This may take a few moments...\n');
    
    const startTime = Date.now();
    await client.query(sqlDump);
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    // Verify import
    console.log('\n📊 Verifying import...');
    const tablesResult = await client.query(`
      SELECT 
        schemaname,
        tablename,
        (SELECT COUNT(*) FROM information_schema.columns 
         WHERE table_schema = schemaname AND table_name = tablename) as column_count
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `);
    
    console.log(`\n✅ Import complete! (took ${duration}s)`);
    console.log(`\n📋 Imported ${tablesResult.rows.length} tables:\n`);
    
    // Count rows in each table
    for (const table of tablesResult.rows) {
      try {
        const countResult = await client.query(`SELECT COUNT(*) as count FROM ${table.tablename}`);
        const count = parseInt(countResult.rows[0].count);
        console.log(`   ${count > 0 ? '✓' : '○'} ${table.tablename}: ${count} rows`);
      } catch (err) {
        console.log(`   ⚠️  ${table.tablename}: Error counting rows`);
      }
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 Data import complete!');
    console.log('\n💡 Your local database now has all Supabase data.');
    console.log('   You can now start your development server:');
    console.log('   npm run dev');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
  } catch (error) {
    console.error('\n❌ Error importing data:', error.message);
    if (error.message.includes('duplicate key')) {
      console.error('\n💡 Tip: Some data may already exist. The script uses ON CONFLICT DO NOTHING');
      console.error('   You may need to clear tables first if you want a fresh import.');
    }
    console.error(error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

importData();

