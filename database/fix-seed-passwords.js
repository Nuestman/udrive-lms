// Fix seed data passwords - Set all to "password123"
import bcrypt from 'bcryptjs';
import { query, pool } from '../server/lib/db.js';
import dotenv from 'dotenv';

dotenv.config();

async function fixSeedPasswords() {
  try {
    console.log('🔐 Fixing seed user passwords...');
    
    // Generate hash for "password123"
    const passwordHash = await bcrypt.hash('password123', 10);
    console.log('✅ Generated password hash');
    
    // Update all users with placeholder hashes
    const result = await query(
      `UPDATE users 
       SET password_hash = $1 
       WHERE password_hash LIKE '$2a$10$YourBcryptHashHere%'
       RETURNING email, role`,
      [passwordHash]
    );
    
    console.log(`\n✅ Updated ${result.rows.length} users:`);
    result.rows.forEach(user => {
      console.log(`   - ${user.email} (${user.role})`);
    });
    
    console.log('\n🎉 All seed users can now login with password: "password123"');
    console.log('\n📝 Test Accounts:');
    console.log('   Super Admin:  admin@udrive.com / password123');
    console.log('   School Admin: schooladmin@premier.com / password123');
    console.log('   Instructor:   instructor@premier.com / password123');
    console.log('   Student 1:    student1@example.com / password123');
    console.log('   Student 2:    student2@example.com / password123');
    console.log('   Student 3:    student3@example.com / password123');
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing passwords:', error);
    await pool.end();
    process.exit(1);
  }
}

fixSeedPasswords();

