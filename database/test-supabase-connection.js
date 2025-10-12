// Test Supabase Database Connection
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

console.log('🔍 Testing Database Connection...\n');

// Check environment
const nodeEnv = process.env.NODE_ENV || 'development';
const hasConnectionString = !!process.env.DATABASE_URL;
const isSupabase = hasConnectionString && process.env.DATABASE_URL.includes('supabase');

console.log('📋 Environment Check:');
console.log(`   NODE_ENV: ${nodeEnv}`);
console.log(`   DATABASE_URL: ${hasConnectionString ? '✅ Set' : '❌ Not Set'}`);
console.log(`   Database Type: ${isSupabase ? '☁️  Supabase' : '💻 Local PostgreSQL'}`);
console.log('');

// Create connection config
const config = hasConnectionString
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: isSupabase ? { rejectUnauthorized: false } : false,
      max: 1,
      connectionTimeoutMillis: 10000,
    }
  : {
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT || '5432'),
      database: process.env.DATABASE_NAME || 'udrive-from-bolt',
      user: process.env.DATABASE_USER || 'postgres',
      password: process.env.DATABASE_PASSWORD || 'postgres',
      max: 1,
      connectionTimeoutMillis: 5000,
    };

const pool = new Pool(config);

async function testConnection() {
  try {
    console.log('🔌 Attempting to connect...');
    const client = await pool.connect();
    console.log('✅ Connection successful!\n');

    // Test query
    console.log('📊 Running test query...');
    const result = await client.query('SELECT version(), current_database(), current_user, now()');
    const row = result.rows[0];

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ DATABASE CONNECTION SUCCESSFUL');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Database: ${row.current_database}`);
    console.log(`User: ${row.current_user}`);
    console.log(`Server Time: ${row.now}`);
    console.log(`PostgreSQL Version: ${row.version.split(',')[0]}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Check for UDrive tables
    console.log('🔍 Checking for UDrive LMS tables...');
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    if (tablesResult.rows.length === 0) {
      console.log('⚠️  No tables found! Database schema may not be installed.');
      console.log('   Run: npm run setup:db\n');
    } else {
      console.log(`✅ Found ${tablesResult.rows.length} tables:\n`);
      
      const expectedTables = [
        'user_profiles',
        'courses',
        'modules',
        'lessons',
        'enrollments',
        'lesson_progress',
        'schools',
        'quiz_questions',
        'quiz_attempts'
      ];

      expectedTables.forEach(tableName => {
        const exists = tablesResult.rows.some(row => row.table_name === tableName);
        console.log(`   ${exists ? '✅' : '❌'} ${tableName}`);
      });

      console.log('');

      // Count records in key tables
      console.log('📊 Record Counts:');
      const counts = await Promise.all([
        client.query('SELECT COUNT(*) FROM user_profiles'),
        client.query('SELECT COUNT(*) FROM courses'),
        client.query('SELECT COUNT(*) FROM modules'),
        client.query('SELECT COUNT(*) FROM lessons'),
        client.query('SELECT COUNT(*) FROM enrollments'),
      ]);

      console.log(`   Users: ${counts[0].rows[0].count}`);
      console.log(`   Courses: ${counts[1].rows[0].count}`);
      console.log(`   Modules: ${counts[2].rows[0].count}`);
      console.log(`   Lessons: ${counts[3].rows[0].count}`);
      console.log(`   Enrollments: ${counts[4].rows[0].count}`);
      console.log('');
    }

    // Test write operation
    console.log('✍️  Testing write operation...');
    await client.query('CREATE TEMP TABLE test_connection (id SERIAL, created_at TIMESTAMP DEFAULT NOW())');
    await client.query('INSERT INTO test_connection DEFAULT VALUES');
    const writeTest = await client.query('SELECT * FROM test_connection');
    console.log(`✅ Write test successful! Record created at ${writeTest.rows[0].created_at}\n`);

    client.release();

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 ALL TESTS PASSED!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Your database is ready for UDrive LMS! 🚀\n');

  } catch (error) {
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('❌ DATABASE CONNECTION FAILED');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('Error:', error.message);
    console.error('');
    
    if (error.code === 'ENOTFOUND') {
      console.error('💡 Troubleshooting:');
      console.error('   - Check DATABASE_URL or DATABASE_HOST is correct');
      console.error('   - Ensure internet connection (for Supabase)');
      console.error('   - Verify Supabase project is active\n');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('💡 Troubleshooting:');
      console.error('   - Is PostgreSQL running?');
      console.error('   - Check port number (default: 5432)');
      console.error('   - For local: sudo service postgresql start\n');
    } else if (error.message.includes('password')) {
      console.error('💡 Troubleshooting:');
      console.error('   - Check DATABASE_PASSWORD is correct');
      console.error('   - Verify user has proper permissions\n');
    } else if (error.message.includes('SSL')) {
      console.error('💡 Troubleshooting:');
      console.error('   - SSL required for Supabase connections');
      console.error('   - Our db.js handles this automatically');
      console.error('   - Check DATABASE_URL includes your password\n');
    }

    console.error('📖 See: PRODUCTION_DEPLOYMENT.md for detailed setup\n');
  } finally {
    await pool.end();
    process.exit();
  }
}

// Run test
testConnection();

