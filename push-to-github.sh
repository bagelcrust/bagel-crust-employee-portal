#!/bin/bash

# Simple script to push to GitHub with token
# This will save your credentials so you only need to do this once

echo "======================================"
echo "  GitHub Push Helper"
echo "======================================"
echo ""
echo "This script will push your code to GitHub."
echo "You'll need your GitHub Personal Access Token."
echo ""
echo "Paste your token below and press Enter:"
read -s GITHUB_TOKEN
echo ""
echo "Pushing to GitHub..."
echo ""

# Push with the token
git push https://${GITHUB_TOKEN}@github.com/bagelcrust/bagel-crust-employee-portal.git main

if [ $? -eq 0 ]; then
    echo ""
    echo "======================================"
    echo "✅ SUCCESS! Code pushed to GitHub"
    echo "======================================"
    echo ""
    echo "Your token has been saved."
    echo "From now on, you can just use:"
    echo "  git push origin main"
    echo ""
else
    echo ""
    echo "======================================"
    echo "❌ Push failed. Check your token."
    echo "======================================"
    echo ""
fi
