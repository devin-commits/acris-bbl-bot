#!/bin/bash

echo "=== GitHub Authentication & Repository Status ==="
echo ""

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "❌ Git is not installed. Please install Git first."
    exit 1
fi

echo "📋 Git Configuration:"
echo "-------------------"
echo "Global user.name: $(git config --global user.name 2>/dev/null || echo 'Not set')"
echo "Global user.email: $(git config --global user.email 2>/dev/null || echo 'Not set')"
echo "Local user.name: $(git config --local user.name 2>/dev/null || echo 'Not set')"
echo "Local user.email: $(git config --local user.email 2>/dev/null || echo 'Not set')"
echo ""

# Check if this is a git repository
if [ -d ".git" ]; then
    echo "✅ This is a Git repository"
    echo ""
    echo "📡 Remote Repositories:"
    echo "-------------------"
    git remote -v 2>/dev/null || echo "No remotes configured"
    echo ""
    
    echo "🌿 Current Branch:"
    echo "-------------------"
    git branch --show-current 2>/dev/null || echo "Unable to determine branch"
    echo ""
else
    echo "⚠️  This directory is not a Git repository"
    echo ""
fi

# Check GitHub CLI
echo "🔐 GitHub CLI Status:"
echo "-------------------"
if command -v gh &> /dev/null; then
    gh auth status 2>&1 || echo "Not authenticated with GitHub CLI"
else
    echo "GitHub CLI (gh) is not installed"
    echo "Install it with: sudo apt-get install gh (or visit https://cli.github.com/)"
fi
echo ""

# Check credential helper
echo "🔑 Credential Helper:"
echo "-------------------"
git config --global credential.helper 2>/dev/null || echo "No credential helper configured"
echo ""

echo "=== Setup Instructions ==="
echo ""
echo "To set up GitHub authentication, you can:"
echo ""
echo "1. Set Git user info (if not already set):"
echo "   git config --global user.name 'Your Name'"
echo "   git config --global user.email 'your.email@example.com'"
echo ""
echo "2. Authenticate with GitHub CLI (recommended):"
echo "   gh auth login"
echo ""
echo "3. Or use SSH keys:"
echo "   - Generate SSH key: ssh-keygen -t ed25519 -C 'your.email@example.com'"
echo "   - Add to GitHub: cat ~/.ssh/id_ed25519.pub"
echo "   - Test: ssh -T git@github.com"
echo ""
echo "4. Or use Personal Access Token:"
echo "   - Create token at: https://github.com/settings/tokens"
echo "   - Use it when pushing/pulling"
echo ""

