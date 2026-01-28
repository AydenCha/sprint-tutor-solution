import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const DIST_DIR = path.join(__dirname, 'dist');

// Check if dist directory exists
if (!existsSync(DIST_DIR)) {
  console.error(`ERROR: dist directory not found at ${DIST_DIR}`);
  console.error('Please run "npm run build" first');
  process.exit(1);
}

console.log(`Starting server on port ${PORT}`);
console.log(`Serving files from ${DIST_DIR}`);

// Serve static files from the dist directory
app.use(express.static(DIST_DIR, {
  maxAge: '1d', // Cache static assets for 1 day
  etag: true,
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Handle SPA routing - all routes should return index.html
app.get('*', (req, res) => {
  console.log(`[SPA Routing] Requested path: ${req.path}`);
  const indexPath = path.join(DIST_DIR, 'index.html');
  if (!existsSync(indexPath)) {
    console.error(`ERROR: index.html not found at ${indexPath}`);
    res.status(500).send('Server configuration error: index.html not found');
    return;
  }
  console.log(`[SPA Routing] Serving index.html for path: ${req.path}`);
  res.sendFile(indexPath);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server is running on port ${PORT}`);
  console.log(`✅ Serving files from ${DIST_DIR}`);
  console.log(`✅ SPA routing enabled - all routes will return index.html`);
});
