// Script to run database seed data
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { getDatabaseConfig } from '../server/config/database.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use centralized database config
const config = getDatabaseConfig();
const pool = new Pool(config);

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
    const courses = await client.query('SELECT id, tenant_id, title, status, slug FROM courses');
    
    console.log('\n👥 Created users:');
    users.rows.forEach(user => {
      console.log(`  - ${user.email} (${user.role})`);
    });
    
    console.log('\n📚 Created courses:');
    // backfill slugs if missing
    function toSlug(title) {
      return title
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
    }
    for (const course of courses.rows) {
      if (!course.slug) {
        const base = toSlug(course.title);
        let slug = base;
        let i = 1;
        // ensure unique per tenant
        // eslint-disable-next-line no-constant-condition
        while (true) {
          const exists = await client.query('SELECT 1 FROM courses WHERE tenant_id = $1 AND slug = $2 AND id <> $3', [course.tenant_id, slug, course.id]);
          if (exists.rowCount === 0) break;
          i += 1;
          slug = `${base}-${i}`;
        }
        await client.query('UPDATE courses SET slug = $1 WHERE id = $2', [slug, course.id]);
        course.slug = slug;
      }
      console.log(`  - ${course.title} [${course.status}] slug=${course.slug}`);
    }
    
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

