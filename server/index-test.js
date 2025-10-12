// Test to see WHY the server exits
import express from 'express';
import { pool } from './lib/db.js';

console.log('1. Starting server...');

const app = express();
const PORT = 3000;

app.get('/api/health', (req, res) => {
  console.log('Health check hit');
  res.json({ ok: true });
});

console.log('2. About to call app.listen()...');

const server = app.listen(PORT, async () => {
  console.log('3. Inside listen callback');
  console.log(`Server on http://localhost:${PORT}`);
  
  try {
    console.log('4. Testing database...');
    await pool.query('SELECT NOW()');
    console.log('5. Database OK');
  } catch (err) {
    console.error('6. Database ERROR:', err.message);
  }
  
  console.log('7. Setup complete');
});

console.log('8. After app.listen() call');

// Explicitly prevent exit
setInterval(() => {
  // Keep alive
}, 1000);

process.on('exit', (code) => {
  console.log('❌ PROCESS EXITING WITH CODE:', code);
});

process.on('SIGTERM', () => {
  console.log('❌ SIGTERM received');
});

process.on('SIGINT', () => {
  console.log('❌ SIGINT received (Ctrl+C)');
  process.exit(0);
});

console.log('9. Script end');





