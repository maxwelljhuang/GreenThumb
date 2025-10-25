#!/bin/bash

# Fix Dependencies Script for GreenThumb Frontend
echo "🔧 Fixing GreenThumb Frontend Dependencies..."

# Navigate to frontend directory
cd "$(dirname "$0")"

# Clear node_modules and package-lock.json
echo "🧹 Cleaning existing dependencies..."
rm -rf node_modules package-lock.json

# Install all dependencies
echo "📦 Installing dependencies..."
npm install

# Check for missing Radix UI packages
echo "🔍 Checking for missing Radix UI packages..."

# Add any missing Radix UI packages
npm install @radix-ui/react-slider@^1.1.2 --save

# Update Next.js to latest version
echo "⬆️ Updating Next.js..."
npm install next@latest --save

# Install any other missing packages
echo "📦 Installing additional packages..."
npm install @radix-ui/react-separator@^1.0.3 --save
npm install @radix-ui/react-label@^2.0.2 --save

# Run type check
echo "🔍 Running type check..."
npm run type-check

# Run build to check for errors
echo "🏗️ Running build check..."
npm run build

echo "✅ Dependencies fixed! You can now run 'npm run dev'"
