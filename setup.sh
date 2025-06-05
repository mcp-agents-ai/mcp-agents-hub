#!/bin/bash

# MCP Agents Hub - Environment Setup Script
# This script ensures the correct Node.js version is being used via nvm

echo "🚀 Setting up MCP Agents Hub development environment..."

# Source nvm (in case it's not in the current shell)
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"

# Check if nvm is available
if ! type nvm &> /dev/null; then
    echo "❌ nvm is not installed or not sourced. Please install nvm first:"
    echo "   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash"
    echo "   source ~/.bashrc"
    exit 1
fi

# Use the Node.js version specified in .nvmrc
if [ -f ".nvmrc" ]; then
    echo "📋 Found .nvmrc file, using specified Node.js version..."
    nvm use
    if [ $? -ne 0 ]; then
        echo "⚠️  Node.js version not installed. Installing now..."
        nvm install
        nvm use
    fi
else
    echo "⚠️  No .nvmrc file found, using default Node.js version"
fi

# Display current versions
echo "✅ Node.js version: $(node --version)"
echo "✅ npm version: $(npm --version)"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

echo "🎉 Setup complete! You can now run:"
echo "   npm run dev    (start development server)"
echo "   npm run build  (build for production)"
echo "   npm run lint   (run linting)"
