// Script to set up local PostgreSQL database for development
// This script creates the database, runs the schema, and optionally seeds data
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Connect to PostgreSQL server (not a specific database) to create the database
const adminPool = new Pool({
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  database: 'postgres', // Connect to default postgres database
  user: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
});

const dbName = process.env.DATABASE_NAME || 'sunlms';

async function setupLocalDatabase() {
  const client = await adminPool.connect();
  
  try {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔧 Setting up local PostgreSQL database...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Check if database exists
    const dbCheck = await client.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [dbName]
    );

    if (dbCheck.rows.length > 0) {
      console.log(`⚠️  Database "${dbName}" already exists.`);
      console.log('   Skipping database creation.\n');
    } else {
      // Create database
      console.log(`📦 Creating database "${dbName}"...`);
      await client.query(`CREATE DATABASE ${dbName}`);
      console.log(`✅ Database "${dbName}" created successfully!\n`);
    }

    client.release();
    await adminPool.end();

    // Now connect to the new database and run schema
    console.log('📊 Connecting to database and running schema...');
    const dbPool = new Pool({
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT || '5432'),
      database: dbName,
      user: process.env.DATABASE_USER || 'postgres',
      password: process.env.DATABASE_PASSWORD || 'postgres',
    });

    const dbClient = await dbPool.connect();

    try {
      // Read and execute schema
      const schemaPath = path.join(__dirname, 'schema.sql');
      const schema = fs.readFileSync(schemaPath, 'utf8');
      
      console.log('⚡ Executing schema...');
      await dbClient.query(schema);
      console.log('✅ Schema executed successfully!\n');

      // Verify tables were created
      const tablesResult = await dbClient.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name;
      `);
      
      console.log(`📋 Created ${tablesResult.rows.length} tables:`);
      tablesResult.rows.forEach(row => {
        console.log(`   ✓ ${row.table_name}`);
      });

      // Ask about seeding
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('💡 Next steps:');
      console.log('   1. Run seed data (optional):');
      console.log('      node database/run-seed.js');
      console.log('   2. Start your development server:');
      console.log('      npm run dev');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    } catch (error) {
      console.error('❌ Error running schema:', error.message);
      throw error;
    } finally {
      dbClient.release();
      await dbPool.end();
    }

    console.log('🎉 Local database setup complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error setting up database:', error.message);
    console.error(error);
    process.exit(1);
  }
}

setupLocalDatabase();

