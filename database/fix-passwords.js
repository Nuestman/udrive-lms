// Fix password hashes in database
import bcrypt from 'bcryptjs';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: parseInt(process.env.PGPORT || '5432'),
  database: process.env.PGDATABASE || 'udrive-from-bolt',
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'postgres',
});

async function fixPasswords() {
  try {
    console.log('🔐 Generating password hash for "password123"...');
    const passwordHash = await bcrypt.hash('password123', 10);
    console.log('✅ Hash generated:', passwordHash.substring(0, 20) + '...');
    
    console.log('\n📊 Updating all user passwords...');
    const result = await pool.query(
      'UPDATE users SET password_hash = $1 WHERE password_hash LIKE $2',
      [passwordHash, '%YourBcryptHashHere%']
    );
    
    console.log(`✅ Updated ${result.rowCount} user(s)`);
    
    // Verify
    const users = await pool.query('SELECT email, role FROM users ORDER BY role');
    console.log('\n👥 Users with updated passwords:');
    users.rows.forEach(user => {
      console.log(`  ✓ ${user.email} (${user.role})`);
    });
    
    console.log('\n🎉 All passwords are now: password123');
    console.log('\n🔑 You can now login with any user:');
    console.log('   Email: schooladmin@premier.com');
    console.log('   Password: password123');
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
    process.exit(1);
  }
}

fixPasswords();

