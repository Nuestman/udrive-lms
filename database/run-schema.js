// Script to run database schema
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pool = new Pool({
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  database: process.env.DATABASE_NAME || 'udrive-from-bolt',
  user: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
});

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

