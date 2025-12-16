#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('=== GitHub Authentication & Repository Status ===\n');

// Helper to run commands safely
function runCommand(cmd, defaultValue = 'Not set') {
  try {
    return execSync(cmd, { encoding: 'utf-8', stdio: 'pipe' }).trim();
  } catch (e) {
    return defaultValue;
  }
}

// Check if git is installed
try {
  execSync('git --version', { stdio: 'ignore' });
} catch (e) {
  console.log('❌ Git is not installed. Please install Git first.');
  process.exit(1);
}

console.log('📋 Git Configuration:');
console.log('-------------------');
console.log(`Global user.name: ${runCommand('git config --global user.name')}`);
console.log(`Global user.email: ${runCommand('git config --global user.email')}`);
console.log(`Local user.name: ${runCommand('git config --local user.name')}`);
console.log(`Local user.email: ${runCommand('git config --local user.email')}`);
console.log('');

// Check if this is a git repository
const gitDir = path.join(process.cwd(), '.git');
if (fs.existsSync(gitDir)) {
  console.log('✅ This is a Git repository\n');
  
  console.log('📡 Remote Repositories:');
  console.log('-------------------');
  const remotes = runCommand('git remote -v', 'No remotes configured');
  console.log(remotes);
  console.log('');
  
  console.log('🌿 Current Branch:');
  console.log('-------------------');
  const branch = runCommand('git branch --show-current', 'Unable to determine branch');
  console.log(branch);
  console.log('');
} else {
  console.log('⚠️  This directory is not a Git repository\n');
}

// Check GitHub CLI
console.log('🔐 GitHub CLI Status:');
console.log('-------------------');
try {
  execSync('gh --version', { stdio: 'ignore' });
  const ghStatus = runCommand('gh auth status', 'Not authenticated with GitHub CLI');
  console.log(ghStatus);
} catch (e) {
  console.log('GitHub CLI (gh) is not installed');
  console.log('Install it with: sudo apt-get install gh (or visit https://cli.github.com/)');
}
console.log('');

// Check credential helper
console.log('🔑 Credential Helper:');
console.log('-------------------');
const credentialHelper = runCommand('git config --global credential.helper', 'No credential helper configured');
console.log(credentialHelper);
console.log('');

console.log('=== Setup Instructions ===\n');
console.log('To set up GitHub authentication, you can:\n');
console.log('1. Set Git user info (if not already set):');
console.log("   git config --global user.name 'Your Name'");
console.log("   git config --global user.email 'your.email@example.com'");
console.log('');
console.log('2. Authenticate with GitHub CLI (recommended):');
console.log('   gh auth login');
console.log('');
console.log('3. Or use SSH keys:');
console.log("   - Generate SSH key: ssh-keygen -t ed25519 -C 'your.email@example.com'");
console.log('   - Add to GitHub: cat ~/.ssh/id_ed25519.pub');
console.log('   - Test: ssh -T git@github.com');
console.log('');
console.log('4. Or use Personal Access Token:');
console.log('   - Create token at: https://github.com/settings/tokens');
console.log('   - Use it when pushing/pulling');
console.log('');

