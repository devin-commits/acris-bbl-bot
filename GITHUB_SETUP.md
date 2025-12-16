# GitHub Authentication Setup Guide

## Quick Check

Run this command to check your current GitHub authentication status:

```bash
npm run check:github
```

Or directly:
```bash
node check-github-auth.js
```

## Current Repository Status

Based on the files in this project:
- ✅ This appears to be a Git repository (`.gitignore` file exists)
- ⚠️ Need to verify if `.git` directory exists and if remotes are configured

## Setting Up GitHub Authentication

### Option 1: GitHub CLI (Recommended - Easiest)

1. **Install GitHub CLI** (if not already installed):
   ```bash
   # On Ubuntu/WSL
   sudo apt-get update
   sudo apt-get install gh
   
   # Or download from: https://cli.github.com/
   ```

2. **Authenticate**:
   ```bash
   gh auth login
   ```
   - Follow the prompts to choose:
     - GitHub.com
     - HTTPS or SSH
     - Authenticate via web browser (easiest) or token

3. **Verify**:
   ```bash
   gh auth status
   ```

### Option 2: SSH Keys (Most Secure)

1. **Generate SSH key** (if you don't have one):
   ```bash
   ssh-keygen -t ed25519 -C "your.email@example.com"
   ```
   - Press Enter to accept default location
   - Optionally set a passphrase

2. **Add SSH key to ssh-agent**:
   ```bash
   eval "$(ssh-agent -s)"
   ssh-add ~/.ssh/id_ed25519
   ```

3. **Copy public key**:
   ```bash
   cat ~/.ssh/id_ed25519.pub
   ```

4. **Add to GitHub**:
   - Go to: https://github.com/settings/keys
   - Click "New SSH key"
   - Paste your public key
   - Save

5. **Test connection**:
   ```bash
   ssh -T git@github.com
   ```
   You should see: "Hi username! You've successfully authenticated..."

6. **Update remote URL** (if needed):
   ```bash
   git remote set-url origin git@github.com:username/repo.git
   ```

### Option 3: Personal Access Token (PAT)

1. **Create a token**:
   - Go to: https://github.com/settings/tokens
   - Click "Generate new token" → "Generate new token (classic)"
   - Give it a name and select scopes (at minimum: `repo`)
   - Generate and **copy the token** (you won't see it again!)

2. **Use the token**:
   - When pushing/pulling, use the token as your password
   - Username: your GitHub username
   - Password: the token

3. **Store credentials** (optional):
   ```bash
   git config --global credential.helper store
   ```
   Then on first use, enter your token as the password.

## Configure Git User Info

If not already set, configure your Git identity:

```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

To check current settings:
```bash
git config --global user.name
git config --global user.email
```

## Initialize Repository (if needed)

If this directory is not yet a Git repository:

```bash
git init
git add .
git commit -m "Initial commit"
```

## Add Remote Repository

If you have a GitHub repository created:

```bash
git remote add origin https://github.com/username/repo-name.git
# Or with SSH:
git remote add origin git@github.com:username/repo-name.git
```

To check existing remotes:
```bash
git remote -v
```

## Test Your Setup

1. **Check authentication**:
   ```bash
   npm run check:github
   ```

2. **Test push** (if you have a remote):
   ```bash
   git push -u origin main
   # or
   git push -u origin master
   ```

## Troubleshooting

### "Permission denied (publickey)"
- Make sure your SSH key is added to GitHub
- Test with: `ssh -T git@github.com`

### "Authentication failed"
- Check your token hasn't expired
- Regenerate token if needed

### "Repository not found"
- Verify the repository exists on GitHub
- Check you have access to the repository
- Verify the remote URL is correct

## Next Steps

After setting up authentication:
1. ✅ Verify with `npm run check:github`
2. ✅ Configure your Git user info
3. ✅ Add/verify remote repository
4. ✅ Test with a push or pull

