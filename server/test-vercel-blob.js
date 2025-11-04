/**
 * Test Vercel Blob Storage Connection
 * 
 * Run with: node server/test-vercel-blob.js
 */

import { put, list } from '@vercel/blob';
import dotenv from 'dotenv';

dotenv.config();

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🧪 VERCEL BLOB STORAGE CONNECTION TEST');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

async function testBlobConnection() {
  try {
    // 1. Check if token is configured
    console.log('1️⃣ Checking BLOB_READ_WRITE_TOKEN...');
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    
    if (!token) {
      console.error('❌ BLOB_READ_WRITE_TOKEN not found in environment variables');
      console.log('\n📝 To fix:');
      console.log('   1. Add BLOB_READ_WRITE_TOKEN to your .env file');
      console.log('   2. Get token from: https://vercel.com/dashboard → Storage → Blob');
      console.log('   3. Restart your server\n');
      process.exit(1);
    }
    
    if (token === 'your_vercel_blob_read_write_token_here') {
      console.error('❌ BLOB_READ_WRITE_TOKEN is still the placeholder value');
      console.log('\n📝 To fix:');
      console.log('   1. Replace with actual token from Vercel dashboard');
      console.log('   2. Visit: https://vercel.com/dashboard → Storage → Blob');
      console.log('   3. Restart your server\n');
      process.exit(1);
    }
    
    console.log('✅ Token found (length: ' + token.length + ' chars)');
    console.log('   Token preview: ' + token.substring(0, 20) + '...\n');
    
    // 2. Test upload
    console.log('2️⃣ Testing file upload...');
    const testData = Buffer.from('Hello from SunLMS! Test file.', 'utf-8');
    const testPath = `test/connection-test-${Date.now()}.txt`;
    
    const blob = await put(testPath, testData, {
      access: 'public',
      contentType: 'text/plain',
      addRandomSuffix: true // Prevent collisions
    });
    
    console.log('✅ Upload successful!');
    console.log('   URL: ' + blob.url);
    console.log('   Size: ' + blob.size + ' bytes');
    console.log('   Content-Type: ' + blob.contentType + '\n');
    
    // 3. Test listing
    console.log('3️⃣ Testing file listing...');
    const listResult = await list({ prefix: 'test/' });
    
    console.log('✅ Listing successful!');
    console.log('   Files found: ' + listResult.blobs.length);
    
    if (listResult.blobs.length > 0) {
      console.log('\n   Recent files:');
      listResult.blobs.slice(0, 5).forEach(file => {
        console.log('   - ' + file.pathname + ' (' + file.size + ' bytes)');
      });
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ ALL TESTS PASSED!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n🎉 Vercel Blob Storage is configured correctly!');
    console.log('   You can now upload files from your application.\n');
    
    process.exit(0);
  } catch (error) {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('❌ TEST FAILED');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.error('Error:', error.message);
    
    if (error.message.includes('Unauthorized') || error.message.includes('401')) {
      console.log('\n💡 This is likely an authentication issue:');
      console.log('   1. Check your BLOB_READ_WRITE_TOKEN is correct');
      console.log('   2. Make sure it has write permissions');
      console.log('   3. Token might be expired - generate a new one');
      console.log('   4. Visit: https://vercel.com/dashboard → Storage → Blob\n');
    } else if (error.message.includes('not found') || error.message.includes('404')) {
      console.log('\n💡 Blob store might not exist:');
      console.log('   1. Create a Blob store in Vercel dashboard');
      console.log('   2. Visit: https://vercel.com/dashboard → Storage → Blob');
      console.log('   3. Click "Create Store"\n');
    } else {
      console.log('\n💡 Check the error message above for details.');
      console.log('   Full error object:', error);
    }
    
    process.exit(1);
  }
}

// Run the test
testBlobConnection();

