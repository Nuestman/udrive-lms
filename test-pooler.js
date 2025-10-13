// Test Transaction Pooler connection
import pg from 'pg';
const { Pool } = pg;

// Try Transaction Pooler (EU West 2)
const poolerUrl = 'postgresql://postgres.zrwrdfkntrfqarbidtou:uwykGPTyCQo8jRa9@aws-0-eu-west-2.pooler.supabase.com:5432/postgres';

console.log('Testing Transaction Pooler connection...\n');
console.log('Host: aws-0-eu-west-2.pooler.supabase.com');
console.log('Port: 5432\n');

const pool = new Pool({
  connectionString: poolerUrl,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 15000,
});

try {
  console.log('Connecting...');
  const client = await pool.connect();
  console.log('✅ CONNECTION SUCCESSFUL!\n');
  
  // Test queries
  const users = await client.query('SELECT COUNT(*) FROM user_profiles');
  console.log(`Users: ${users.rows[0].count}`);
  
  const tenants = await client.query('SELECT COUNT(*) FROM tenants');
  console.log(`Tenants: ${tenants.rows[0].count}`);
  
  const courses = await client.query('SELECT COUNT(*) FROM courses');
  console.log(`Courses: ${courses.rows[0].count}\n`);
  
  console.log('🎉 Transaction Pooler works!');
  console.log('\nUse this in your .env:');
  console.log('DATABASE_URL=' + poolerUrl);
  
  client.release();
} catch (error) {
  console.error('❌ Connection failed:', error.message);
  console.error('\nThis might mean:');
  console.error('1. Project is PAUSED - Check Supabase Dashboard');
  console.error('2. Billing issue - Project needs to be reactivated');
  console.error('3. Wrong region/hostname');
} finally {
  await pool.end();
  process.exit();
}

