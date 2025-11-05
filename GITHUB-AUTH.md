# GitHub Authentication - How to Push Your Code

## The Issue
Git needs your GitHub credentials to push code, but we're on a remote server without interactive login.

## Solution: Use GitHub Personal Access Token (Easiest)

### Step 1: Create a Personal Access Token
1. Go to https://github.com/settings/tokens
2. Click **"Generate new token"** → **"Generate new token (classic)"**
3. Give it a name: `Bagel Crust Deploy`
4. Set expiration: **90 days** (or your preference)
5. Select scopes:
   - ✅ **repo** (full control of private repositories)
6. Click **"Generate token"**
7. **COPY THE TOKEN** - you won't see it again!

### Step 2: Push Using the Token

Run this command in your terminal (replace `YOUR_TOKEN` with the token you just copied):

```bash
cd /bagelcrust/react-app

git push https://YOUR_TOKEN@github.com/bagelcrust/bagel-crust-employee-portal.git main
```

**Example:**
If your token is `ghp_abc123xyz789`, run:
```bash
git push https://ghp_abc123xyz789@github.com/bagelcrust/bagel-crust-employee-portal.git main
```

### Step 3: Verify Upload
1. Go to https://github.com/bagelcrust/bagel-crust-employee-portal
2. Refresh the page
3. You should see all your files!

---

## Alternative: Configure Git to Store Credentials

If you want to save the token for future pushes:

```bash
# Set up credential storage
git config credential.helper store

# Push with token (Git will remember it)
git push https://YOUR_TOKEN@github.com/bagelcrust/bagel-crust-employee-portal.git main

# Future pushes will work without the token
git push origin main
```

---

## Alternative: Use SSH (More Secure, More Setup)

If you prefer SSH keys:

1. Generate SSH key:
```bash
ssh-keygen -t ed25519 -C "your_email@example.com"
```

2. Copy the public key:
```bash
cat ~/.ssh/id_ed25519.pub
```

3. Add to GitHub:
   - Go to https://github.com/settings/keys
   - Click "New SSH key"
   - Paste your public key
   - Click "Add SSH key"

4. Change remote URL to SSH:
```bash
git remote set-url origin git@github.com:bagelcrust/bagel-crust-employee-portal.git
git push -u origin main
```

---

## Quick Reference

**Your GitHub repository:** https://github.com/bagelcrust/bagel-crust-employee-portal

**To push in the future:**
```bash
cd /bagelcrust/react-app
git add .
git commit -m "Your commit message"
git push origin main
```

---

## Next Step After Pushing: Deploy to Vercel

Once your code is on GitHub:

1. Go to https://vercel.com/new
2. Import `bagelcrust/bagel-crust-employee-portal`
3. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Click Deploy
5. ✅ Live in 1-2 minutes!
