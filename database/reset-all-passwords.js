// Reset ALL user passwords to "password123" (for development)
import bcrypt from 'bcryptjs';
import { query, pool } from '../server/lib/db.js';
import dotenv from 'dotenv';

dotenv.config();

async function resetAllPasswords() {
  try {
    console.log('🔐 Resetting ALL user passwords to "password123"...\n');
    
    // Generate hash for "password123"
    const passwordHash = await bcrypt.hash('password123', 10);
    console.log('✅ Generated password hash\n');
    
    // Get all users first
    const users = await query('SELECT id, email, role FROM user_profiles ORDER BY role, email');
    
    console.log(`📋 Found ${users.rows.length} users\n`);
    
    // Update all users
    const result = await query(
      `UPDATE user_profiles 
       SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
       RETURNING email, role`,
      [passwordHash]
    );
    
    console.log(`✅ Updated ${result.rows.length} users:\n`);
    
    // Group by role
    const byRole = {
      super_admin: [],
      school_admin: [],
      instructor: [],
      student: []
    };
    
    result.rows.forEach(user => {
      if (byRole[user.role]) {
        byRole[user.role].push(user.email);
      }
    });
    
    if (byRole.super_admin.length > 0) {
      console.log('🔑 Super Admins:');
      byRole.super_admin.forEach(email => console.log(`   - ${email}`));
      console.log('');
    }
    
    if (byRole.school_admin.length > 0) {
      console.log('🏫 School Admins:');
      byRole.school_admin.forEach(email => console.log(`   - ${email}`));
      console.log('');
    }
    
    if (byRole.instructor.length > 0) {
      console.log('👨‍🏫 Instructors:');
      byRole.instructor.forEach(email => console.log(`   - ${email}`));
      console.log('');
    }
    
    if (byRole.student.length > 0) {
      console.log('👨‍🎓 Students:');
      byRole.student.forEach(email => console.log(`   - ${email}`));
      console.log('');
    }
    
    console.log('═'.repeat(60));
    console.log('🎉 ALL USERS CAN NOW LOGIN WITH PASSWORD: "password123"');
    console.log('═'.repeat(60));
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error resetting passwords:', error);
    await pool.end();
    process.exit(1);
  }
}

resetAllPasswords();

