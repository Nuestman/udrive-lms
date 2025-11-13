// Script to run database schema
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import { getDatabaseConfig } from '../server/config/database.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use centralized database config
const config = getDatabaseConfig();
const pool = new Pool(config);

async function runSchema() {
  try {
    console.log('🔧 Reading schema.sql...');
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    console.log('📊 Connecting to database...');
    const client = await pool.connect();

    console.log('⚡ Executing schema...');
    await client.query(schema);

    console.log('✅ Schema created successfully!');
    
    // Verify tables were created
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    console.log('\n📋 Created tables:');
    result.rows.forEach(row => {
      console.log('  -', row.table_name);
    });

    client.release();
    await pool.end();
    
    console.log('\n🎉 Database setup complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error running schema:', error.message);
    console.error(error);
    await pool.end();
    process.exit(1);
  }
}

runSchema();

