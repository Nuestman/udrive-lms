// Minimal Express server to test if it stays running
import express from 'express';

const app = express();
const PORT = 3000;

app.get('/api/health', (req, res) => {
  console.log('Health check received');
  res.json({ status: 'ok' });
});

const server = app.listen(PORT, () => {
  console.log('✅ Simple server running on http://localhost:3000');
  console.log('This should NOT exit. Press Ctrl+C to stop.');
});

// Prevent exit
process.stdin.resume();

// Log if server closes
server.on('close', () => {
  console.log('❌ Server closed!');
});

// Log any exits
process.on('beforeExit', (code) => {
  console.log('⚠️ Process about to exit with code:', code);
});

process.on('exit', (code) => {
  console.log('❌ Process exiting with code:', code);
});

console.log('📊 Event loop check - this should keep running...');





