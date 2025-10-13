// Test the correct connection string
import pg from 'pg';
const { Pool } = pg;

// Try Direct Connection first
const directUrl = 'postgresql://postgres:uwykGPTyCQo8jRa9@db.zrwrdfkntrfqarbidtou.supabase.co:5432/postgres';

console.log('Testing Direct Connection to Supabase...\n');

const pool = new Pool({
  connectionString: directUrl,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10000,
});

try {
  const client = await pool.connect();
  console.log('✅ CONNECTION SUCCESSFUL!\n');
  
  // Test queries
  const version = await client.query('SELECT version()');
  console.log('PostgreSQL:', version.rows[0].version.split(',')[0]);
  
  const users = await client.query('SELECT COUNT(*) FROM user_profiles');
  console.log(`Users: ${users.rows[0].count}`);
  
  const tenants = await client.query('SELECT COUNT(*) FROM tenants');
  console.log(`Tenants: ${tenants.rows[0].count}`);
  
  const courses = await client.query('SELECT COUNT(*) FROM courses');
  console.log(`Courses: ${courses.rows[0].count}\n`);
  
  console.log('🎉 Your Supabase database is working perfectly!');
  console.log('Copy .env.CORRECT_FINAL to your .env file');
  
  client.release();
} catch (error) {
  console.error('❌ Connection failed:', error.message);
  console.error('\nTroubleshooting:');
  console.error('1. Check if Supabase project is active');
  console.error('2. Verify password is correct: uwykGPTyCQo8jRa9');
  console.error('3. Check if project paused due to billing');
} finally {
  await pool.end();
  process.exit();
}

