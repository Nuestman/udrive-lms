// Script to run database seed data
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
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

async function runSeed() {
  try {
    console.log('🌱 Reading seed.sql...');
    const seedPath = path.join(__dirname, 'seed.sql');
    let seed = fs.readFileSync(seedPath, 'utf8');

    // Generate password hash for 'password123'
    console.log('🔐 Generating password hashes...');
    const passwordHash = await bcrypt.hash('password123', 10);
    
    // Replace placeholder with actual hash
    seed = seed.replace(/\$2a\$10\$YourBcryptHashHere/g, passwordHash);

    console.log('📊 Connecting to database...');
    const client = await pool.connect();

    console.log('⚡ Executing seed data...');
    await client.query(seed);

    console.log('✅ Seed data inserted successfully!');
    
    // Show what was created
    const users = await client.query('SELECT email, role FROM users ORDER BY role');
    const courses = await client.query('SELECT title, status FROM courses');
    
    console.log('\n👥 Created users:');
    users.rows.forEach(user => {
      console.log(`  - ${user.email} (${user.role})`);
    });
    
    console.log('\n📚 Created courses:');
    courses.rows.forEach(course => {
      console.log(`  - ${course.title} [${course.status}]`);
    });
    
    console.log('\n🔑 Test credentials:');
    console.log('  Email: admin@udrive.com');
    console.log('  Password: password123');
    console.log('');
    console.log('  Email: schooladmin@premier.com');
    console.log('  Password: password123');
    console.log('');
    console.log('  Email: instructor@premier.com');
    console.log('  Password: password123');
    console.log('');
    console.log('  Email: student1@example.com');
    console.log('  Password: password123');

    client.release();
    await pool.end();
    
    console.log('\n🎉 Database seeding complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error running seed:', error.message);
    console.error(error);
    await pool.end();
    process.exit(1);
  }
}

runSeed();

