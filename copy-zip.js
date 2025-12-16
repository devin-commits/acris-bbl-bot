const fs = require('fs');
const path = require('path');

// Source path in Windows (accessible via WSL /mnt/c)
const sourcePath = '/mnt/c/Users/devin/Downloads/python_wheels (2).zip';
const destPath = path.join(__dirname, 'python_wheels (2).zip');

try {
  console.log(`Attempting to copy from: ${sourcePath}`);
  console.log(`Destination: ${destPath}`);
  
  // Check if source exists
  if (!fs.existsSync(sourcePath)) {
    console.error(`❌ Source file not found: ${sourcePath}`);
    console.error('Make sure the file exists in your Downloads folder.');
    process.exit(1);
  }

  // Copy the file
  fs.copyFileSync(sourcePath, destPath);
  console.log(`✅ Successfully copied to ${destPath}`);
  
  // Verify the copy
  const stats = fs.statSync(destPath);
  console.log(`📦 File size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
} catch (error) {
  console.error('❌ Error copying file:', error.message);
  console.error(error.stack);
  process.exit(1);
}

