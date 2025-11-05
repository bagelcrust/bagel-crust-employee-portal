# Push to GitHub - Step by Step

## Option 1: Create GitHub Repo via Web Interface (Recommended)

### Step 1: Create Repository on GitHub
1. Go to https://github.com/new
2. Repository name: `bagel-crust-employee-portal` (or your preferred name)
3. Description: `Employee Portal for Bagel Crust - Clock In/Out, Schedules, Timesheets`
4. **Privacy:** Choose Public or Private
5. **DO NOT** initialize with README, .gitignore, or license (we already have these)
6. Click **"Create repository"**

### Step 2: Push Your Code
After creating the repo, GitHub will show you commands. Use these:

```bash
cd /bagelcrust/react-app

# Add GitHub as remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/bagel-crust-employee-portal.git

# Push code to GitHub
git push -u origin main
```

**Example:**
If your GitHub username is `johndoe`, the command would be:
```bash
git remote add origin https://github.com/johndoe/bagel-crust-employee-portal.git
git push -u origin main
```

### Step 3: Verify Upload
1. Refresh your GitHub repository page
2. You should see all files uploaded
3. ✅ Ready for Vercel deployment!

---

## Option 2: Using SSH (If you have SSH keys set up)

```bash
cd /bagelcrust/react-app

# Add remote with SSH
git remote add origin git@github.com:YOUR_USERNAME/bagel-crust-employee-portal.git

# Push code
git push -u origin main
```

---

## Next Steps After GitHub Push

### Deploy to Vercel

#### Quick Deploy (Easiest):
1. Go to https://vercel.com/new
2. Click **"Import Git Repository"**
3. Select your GitHub repository
4. Click **"Import"**
5. Configure:
   - **Framework Preset:** Vite (should auto-detect)
   - **Root Directory:** `./`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
6. **IMPORTANT:** Add Environment Variables:
   - Click **"Environment Variables"**
   - Add `VITE_SUPABASE_URL`
   - Add `VITE_SUPABASE_ANON_KEY`
   - (See DEPLOYMENT.md for values)
7. Click **"Deploy"**
8. Wait 1-2 minutes for build
9. ✅ Your site is live!

#### Using Vercel CLI:
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

---

## Environment Variables for Vercel

**REQUIRED:** Add these in Vercel dashboard before deploying:

```
VITE_SUPABASE_URL=https://gyyjviynlwbbodyfmvoi.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5eWp2aXlubHdiYm9keWZtdm9pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjU0NzMxMDQsImV4cCI6MjA0MTA0OTEwNH0.lBCMz9a-v1JVzsvf1dSp3v8WVo0x1xXqSV1qHqQFCGo
```

---

## Troubleshooting

### "Permission denied (publickey)" error
- You need to set up SSH keys or use HTTPS instead
- Use the HTTPS URL: `https://github.com/YOUR_USERNAME/repo-name.git`

### "Repository not found" error
- Check your GitHub username is correct
- Make sure the repository was created successfully
- Try using HTTPS instead of SSH

### Vercel build fails
- Make sure you added environment variables
- Check build logs for specific errors
- Verify `npm run build` works locally

---

## Quick Reference

**Current directory:** `/bagelcrust/react-app`

**Git status:**
```bash
git status
git log --oneline
```

**View remote:**
```bash
git remote -v
```

**Need to make changes before pushing?**
```bash
git add .
git commit -m "Update description"
git push
```
