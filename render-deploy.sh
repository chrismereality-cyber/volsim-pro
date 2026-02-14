#!/bin/bash

# ==========================================
# VOLSIM PRO Render Deployment Script
# ==========================================

# 1️⃣ Ensure you are on main
git checkout main

# 2️⃣ Pull latest from GitHub
echo "🔄 Pulling latest changes from GitHub..."
git pull origin main --rebase

# 3️⃣ Stage all changes
echo "📂 Adding all files..."
git add .

# 4️⃣ Commit changes
COMMIT_MSG=${1:-"Automated deployment update"}
echo "✏️ Committing changes: $COMMIT_MSG"
git commit -m "$COMMIT_MSG" || echo "Nothing to commit"

# 5️⃣ Push to GitHub
echo "🚀 Pushing to GitHub..."
git push origin main

# 6️⃣ Render automatically detects push and deploys
echo "✅ Deployment pushed. Render will auto-deploy from main branch."

