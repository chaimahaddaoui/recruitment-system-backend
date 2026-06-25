const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing all imports in src/...\n');

function walkDir(dir) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory() && !file.includes('node_modules')) {
      walkDir(fullPath);
    } else if (file.endsWith('.ts') && !file.includes('.spec.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      const originalContent = content;

      // Remplacer TOUS les imports 'src/'
      content = content.replace(/from ['"]src\//g, "from '../");

      if (content !== originalContent) {
        fs.writeFileSync(fullPath, content);
        const relativePath = fullPath.replace(process.cwd() + '/', '');
        console.log(`✓ Fixed: ${relativePath}`);
      }
    }
  });
}

walkDir('./src');
console.log('\n✅ All imports fixed!');