# Push to GitHub Guide

## Step 1: Create GitHub Repository

1. Go to [GitHub.com](https://github.com) and sign in
2. Click the "+" icon in the top right corner
3. Select "New repository"
4. Repository name: `unilorin-ams`
5. Description: `University of Ilorin Attendance Management System`
6. Make it **Public** (for free hosting on Render)
7. **DO NOT** check "Add a README file"
8. **DO NOT** check "Add .gitignore"
9. **DO NOT** check "Choose a license"
10. Click "Create repository"

## Step 2: Add Remote and Push

After creating the repository, GitHub will show you commands. Use these:

```bash
# Add the remote repository (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/unilorin-ams.git

# Push the code to GitHub
git branch -M main
git push -u origin main
```

## Step 3: Verify

1. Go to your GitHub repository URL
2. You should see all your files there
3. The repository is now ready for Render deployment

## Step 4: Deploy to Render

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New" → "Web Service"
3. Connect your GitHub repository
4. Follow the deployment guide in `RENDER_DEPLOYMENT.md`

## Important Notes

- Make sure your repository is **public** for free Render hosting
- The repository URL will be: `https://github.com/YOUR_USERNAME/unilorin-ams`
- You can now use this URL to deploy on Render 