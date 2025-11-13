// Script to clean all data from Supabase production database
// WARNING: This will delete ALL data from Supabase!
// Only run this after you've successfully migrated data to local development
import { Pool } from 'pg';
import dotenv from 'dotenv';
import readline from 'readline';

dotenv.config();

const supabaseUrl = process.env.DATABASE_URL;
if (!supabaseUrl) {
  console.error('❌ DATABASE_URL must be set');
  process.exit(1);
}

const pool = new Pool({
  connectionString: supabaseUrl,
  ssl: {
    rejectUnauthorized: false
  },
  max: 5,
  connectionTimeoutMillis: 10000,
});

// Tables to clean (in reverse dependency order to avoid foreign key violations)
const TABLES = [
  'audit_log',
  'content_progress',
  'review_comments',
  'course_support_attachments',
  'course_support_replies',
  'course_support_questions',
  'announcement_reads',
  'announcement_media',
  'announcements',
  'contact_message_replies',
  'contact_messages',
  'course_review_prompt_history',
  'course_review_settings',
  'testimonials',
  'platform_feedback',
  'reviews',
  'notifications',
  'assignment_submissions',
  'assignments',
  'certificates',
  'quiz_attempts',
  'lesson_progress',
  'enrollments',
  'quiz_questions',
  'quizzes',
  'lessons',
  'modules',
  'courses',
  'goals',
  'media_files',
  'user_profiles',
  'users',
  'tenants',
];

function askConfirmation(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y');
    });
  });
}

async function cleanTable(tableName) {
  try {
    const result = await pool.query(`DELETE FROM ${tableName}`);
    return result.rowCount;
  } catch (error) {
    console.error(`    ❌ Error cleaning ${tableName}:`, error.message);
    return 0;
  }
}

async function cleanAllData() {
  const client = await pool.connect();
  
  try {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⚠️  WARNING: This will DELETE ALL DATA from Supabase!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Test connection
    await client.query('SELECT 1');
    console.log('✅ Connected to Supabase\n');
    
    // Count total rows before deletion
    console.log('📊 Counting existing data...\n');
    let totalRows = 0;
    for (const table of TABLES) {
      try {
        const result = await client.query(`SELECT COUNT(*) as count FROM ${table}`);
        const count = parseInt(result.rows[0].count);
        if (count > 0) {
          console.log(`   ${table}: ${count} rows`);
          totalRows += count;
        }
      } catch (error) {
        // Table might not exist, skip
      }
    }
    
    console.log(`\n📈 Total rows to delete: ${totalRows}\n`);
    
    if (totalRows === 0) {
      console.log('✅ Database is already empty. Nothing to clean.');
      return;
    }
    
    // Confirmation
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⚠️  FINAL WARNING: This action cannot be undone!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    const confirmed = await askConfirmation('Type "yes" to confirm deletion: ');
    
    if (!confirmed) {
      console.log('\n❌ Operation cancelled. No data was deleted.');
      return;
    }
    
    console.log('\n🗑️  Cleaning tables...\n');
    
    // Disable triggers temporarily
    await client.query(`SET session_replication_role = 'replica'`);
    
    let deletedRows = 0;
    for (const table of TABLES) {
      try {
        const count = await cleanTable(table);
        if (count > 0) {
          console.log(`   ✓ ${table}: deleted ${count} rows`);
          deletedRows += count;
        }
      } catch (error) {
        console.log(`   ⚠️  ${table}: ${error.message}`);
      }
    }
    
    // Re-enable triggers
    await client.query(`SET session_replication_role = 'origin'`);
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ Cleanup complete!`);
    console.log(`   Deleted ${deletedRows} rows from ${TABLES.length} tables`);
    console.log('\n💡 Supabase is now ready for production client data.');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
  } catch (error) {
    console.error('\n❌ Error cleaning data:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

cleanAllData();

