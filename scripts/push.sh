#!/bin/bash

# CodeVisualizer Master Deployment Script

echo "🚀 Preparing master push..."

# Stage all changes
git add .

# Commit with detailed message
git commit -m "feat: complete UI overhaul, bug fixes, AI improvements, and full documentation"

# Push to origin main
echo "📤 Pushing to GitHub..."
git push origin main

echo "✅ Master push complete! Your project is now up to date."
