const fs = require('fs');
const path = require('path');

const sourcePath = '/mnt/c/Users/devin/Downloads/python_wheels (2).zip';
const destPath = path.join(__dirname, 'python_wheels (2).zip');

try {
  console.log(`Attempting to copy from: ${sourcePath}`);
  console.log(`Destination: ${destPath}`);

  if (!fs.existsSync(sourcePath)) {
    console.error(`❌ Source file not found: ${sourcePath}`);
    console.error('Make sure the file exists in your Downloads folder.');
    process.exit(1);
  }

  fs.copyFileSync(sourcePath, destPath);
  console.log(`✅ Successfully copied to ${destPath}`);

  const stats = fs.statSync(destPath);
  console.log(`📦 File size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
} catch (error) {
  console.error('❌ Error copying file:', error.message);
  console.error(error.stack);
  process.exit(1);
}
