// Quick connection test
import pg from 'pg';
const { Pool } = pg;

const correctUrl = 'postgresql://postgres:nN9D%26GE-%25-s5%24~M@db.zrwrdfkntrfqarbidtou.supabase.co:5432/postgres';

console.log('Testing CORRECT connection string...\n');

const pool = new Pool({
  connectionString: correctUrl,
  ssl: { rejectUnauthorized: false }
});

try {
  const client = await pool.connect();
  console.log('✅ CONNECTION SUCCESSFUL!\n');
  
  const result = await client.query('SELECT COUNT(*) FROM user_profiles');
  console.log(`Users in database: ${result.rows[0].count}`);
  
  const tenants = await client.query('SELECT COUNT(*) FROM tenants');
  console.log(`Tenants in database: ${tenants.rows[0].count}\n`);
  
  console.log('🎉 Your connection string is CORRECT!');
  console.log('Now update your .env file with this DATABASE_URL');
  
  client.release();
} catch (error) {
  console.error('❌ Connection failed:', error.message);
} finally {
  await pool.end();
  process.exit();
}

