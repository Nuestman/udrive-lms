// Test database connection and verify data
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  database: process.env.DATABASE_NAME || 'udrive-from-bolt',
  user: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
});

async function testConnection() {
  try {
    console.log('🔌 Testing database connection...\n');
    
    const client = await pool.connect();
    
    // Test basic connection
    const timeResult = await client.query('SELECT NOW()');
    console.log('✅ Connected to database!');
    console.log('⏰ Server time:', timeResult.rows[0].now);
    console.log('');
    
    // Count tables
    const tablesResult = await client.query(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log('📊 Tables created:', tablesResult.rows[0].count);
    
    // Count users
    const usersResult = await client.query('SELECT COUNT(*) as count FROM users');
    console.log('👥 Users in database:', usersResult.rows[0].count);
    
    // Count courses
    const coursesResult = await client.query('SELECT COUNT(*) as count FROM courses');
    console.log('📚 Courses in database:', coursesResult.rows[0].count);
    
    // Show test users
    const testUsers = await client.query(`
      SELECT email, role, first_name, last_name 
      FROM users 
      ORDER BY role, email
    `);
    console.log('\n🔑 Test user accounts:');
    testUsers.rows.forEach(user => {
      console.log(`  ${user.email} - ${user.role} (${user.first_name} ${user.last_name})`);
    });
    
    // Show courses
    const courses = await client.query(`
      SELECT title, status, duration_weeks 
      FROM courses 
      ORDER BY title
    `);
    console.log('\n📖 Available courses:');
    courses.rows.forEach(course => {
      console.log(`  ${course.title} [${course.status}] - ${course.duration_weeks} weeks`);
    });
    
    console.log('\n✅ Database is ready!');
    console.log('🔐 Login credentials: Any user email + password: password123');
    
    client.release();
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    await pool.end();
    process.exit(1);
  }
}

testConnection();





