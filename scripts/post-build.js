import fs from 'fs';
import path from 'path';

const distDir = 'dist';
const indexHtml = fs.readFileSync(path.join(distDir, 'index.html'), 'utf-8');

// Vytvor fallback cesty pro SPA routing
const fallbackPaths = [
  'auth/reset-password',
  'auth/callback',
];

fallbackPaths.forEach(dir => {
  const fullPath = path.join(distDir, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
  fs.writeFileSync(path.join(fullPath, 'index.html'), indexHtml);
  console.log(`✓ Created fallback: ${dir}/index.html`);
});
