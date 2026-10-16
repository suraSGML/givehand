# Vercel Deployment - Step by Step Instructions

---

## STEP 1: Prepare Your Project (Local Machine)

### 1.1 - Open PowerShell and go to your project folder

```powershell
cd "c:\Users\surag\Desktop\New folder (4)\givehand-et"
```

### 1.2 - Build the project to check it works

```powershell
npm run build
```

**Expected result:** You should see ✓ Compiled successfully

If you get errors, **STOP** and fix them. Do not continue.

### 1.3 - Run lint check

```powershell
npm run lint
```

### 1.4 - Check git status and push to GitHub

```powershell
git status
```

If you see changes, commit and push:

```powershell
git add .
git commit -m "Final preparations for Vercel deployment"
git push
```

**Wait for this to complete before moving to next step.**

---

## STEP 2: Create GitHub Repository (if you don't have one yet)

### 2.1 - Go to GitHub

Open your browser and go to: **https://github.com/new**

### 2.2 - Fill in the form

- **Repository name:** Type `givehand-et`
- **Description:** Type `GiveHand Ethiopia - Charity platform`
- **Visibility:** Select `Public`
- **Do NOT check** "Initialize this repository with: README"

### 2.3 - Click "Create repository" button

GitHub will show you instructions. Copy the URL. It looks like:
```
https://github.com/YOUR_USERNAME/givehand-et.git
```

### 2.4 - Add GitHub remote on your local machine

Back in PowerShell, type:

```powershell
git remote add origin https://github.com/YOUR_USERNAME/givehand-et.git
```

**Replace** `YOUR_USERNAME` with your actual GitHub username.

### 2.5 - Verify remote was added

```powershell
git remote -v
```

You should see output showing `origin` with your repository URL.

### 2.6 - Push your project to GitHub

```powershell
git branch -M main
git push -u origin main
```

**Wait for this to complete.** This might take a few minutes.

### 2.7 - Verify code is on GitHub

Go to https://github.com/YOUR_USERNAME/givehand-et and refresh the page.

You should see all your project files listed there.

---

## STEP 3: Create Vercel Account

### 3.1 - Go to Vercel website

Open your browser and go to: **https://vercel.com**

### 3.2 - Click "Sign Up" button

It's in the top right corner.

### 3.3 - Select "Continue with GitHub"

This will redirect you to GitHub to authorize Vercel.

### 3.4 - Click "Authorize vercel"

GitHub will ask for permission. Click the green "Authorize vercel" button.

You might need to enter your GitHub password.

### 3.5 - Complete Vercel signup

After authorizing, you'll see a form:

- **Name:** Enter your name
- **Email:** Enter your email
- **Team name:** Leave as default or enter your name

### 3.6 - Click "Create"

Vercel creates your account. You'll be taken to the dashboard.

---

## STEP 4: Import Your GitHub Repository to Vercel

### 4.1 - On Vercel dashboard, click "Add New"

You'll see it in the top left area.

### 4.2 - Select "Project"

A list will appear showing "Import Git Repository".

### 4.3 - Find your repository

Either:
- **Option A:** Paste your GitHub repo URL in the search box: `https://github.com/YOUR_USERNAME/givehand-et`
- **Option B:** Scroll down and click on your repository if it appears in the list

### 4.4 - Click "Import"

Vercel will now scan your repository.

### 4.5 - Verify settings (next page)

You should see:
- **Project Name:** `givehand-et` (auto-filled) ✓
- **Framework:** `Next.js` (auto-detected) ✓
- **Root Directory:** `.` (default) ✓

Everything should be correct. Just verify and continue.

### 4.6 - Click "Continue"

You'll move to the environment variables page.

---

## STEP 5: Add Environment Variables to Vercel

This is **CRITICAL**. Your app won't work without these.

### 5.1 - Get your environment variables

Open your `.env.local` file locally. You should see something like:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

**Do NOT share these values with anyone.**

### 5.2 - Add first variable to Vercel

In the "Environment Variables" section on the Vercel page:

**Name field:** Type exactly: `NEXT_PUBLIC_SUPABASE_URL`

**Value field:** Copy and paste the value from your `.env.local` file (the actual URL)

Click **"Add"**

### 5.3 - Add second variable

**Name field:** Type exactly: `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Value field:** Copy and paste your anon key value from `.env.local`

Click **"Add"**

### 5.4 - Add any other variables

If you have more environment variables, repeat the process:
- Type the variable name exactly as it appears
- Copy the value from your `.env.local`
- Click "Add"

**Only add variables that start with `NEXT_PUBLIC_`** for now. Others might not be needed for deployment.

### 5.5 - Verify all variables are listed

You should see a list like:
```
✓ NEXT_PUBLIC_SUPABASE_URL
✓ NEXT_PUBLIC_SUPABASE_ANON_KEY
✓ [Any other variables]
```

The values won't show (they're hidden for security).

---

## STEP 6: Deploy Your App

### 6.1 - Click the "Deploy" button

It's at the bottom right of the page. Click it.

### 6.2 - Watch the deployment progress

Vercel will show you logs as it deploys:

```
✓ Cloning repository...
✓ Installing dependencies...
✓ Building your Next.js app...
✓ Uploading files...
✓ Deployment complete!
```

**This takes 2-5 minutes. Be patient and don't close the page.**

### 6.3 - Wait for success message

You'll see: **"Congratulations! Your project has been successfully deployed."**

---

## STEP 7: Test Your Live App

### 7.1 - Click "Visit" button

After deployment completes, you'll see a "Visit" button. Click it.

Your app will open in a new browser tab.

**The URL will look like:** `https://givehand-et.vercel.app`

### 7.2 - Test your app

- [ ] Click on different pages - do they load?
- [ ] Fill out forms - do they work?
- [ ] Does the home page look correct?
- [ ] No errors showing in the browser console?

If everything works, **you're done!** 🎉

### 7.3 - If something doesn't work

Check the Vercel dashboard for errors:
1. Go to https://vercel.com/dashboard
2. Click your `givehand-et` project
3. Click the "Deployments" tab
4. Click on the latest deployment
5. Look at the "Build Logs" to see what went wrong

Common issues:
- Missing environment variables
- Build errors (check the logs)
- Database connection issues

---

## STEP 8: Set Up Auto-Deployment (DONE AUTOMATICALLY!)

This happens automatically. You don't need to do anything.

From now on, whenever you push code to GitHub:

```powershell
git add .
git commit -m "Your message"
git push
```

Vercel will automatically:
1. See the new code
2. Build your app
3. Deploy it to production

**No manual action needed!**

---

## STEP 9: View Your Live App

Your app is now live at:

**https://givehand-et.vercel.app**

Share this URL with others to show them your app!

---

## ALL COMMANDS YOU NEED (Copy & Paste)

### Commands on your local machine:

```powershell
# 1. Go to your project folder
cd "c:\Users\surag\Desktop\New folder (4)\givehand-et"

# 2. Test build
npm run build

# 3. Test lint
npm run lint

# 4. Push to GitHub
git add .
git commit -m "Deploy to Vercel"
git push
```

### After first deployment, for future updates:

```powershell
# Make your changes, then:
git add .
git commit -m "Your changes description"
git push

# That's it! Vercel deploys automatically
```

---

## Verification Checklist

After completing all steps, check:

- [ ] GitHub repository created
- [ ] Code pushed to GitHub (can see files at github.com/YOUR_USERNAME/givehand-et)
- [ ] Vercel account created
- [ ] Repository imported to Vercel
- [ ] Environment variables added to Vercel
- [ ] Deployment completed (saw "Congratulations" message)
- [ ] Live app works at https://givehand-et.vercel.app
- [ ] No errors showing in browser console

---

## Troubleshooting

### Build failed on Vercel

**Solution:**
1. Check Vercel build logs
2. Fix the error locally with `npm run build`
3. Push to GitHub again
4. Vercel will automatically retry

### App loads but doesn't work

**Likely cause:** Missing environment variables

**Solution:**
1. Go to Vercel dashboard
2. Click your project
3. Click "Settings" → "Environment Variables"
4. Verify all variables are there with correct values
5. Click "Redeploy" button on latest deployment

### Can't connect to database

**Check:**
- [ ] Database URL is correct in Vercel environment variables
- [ ] Database is accessible from the internet (not on your local machine)
- [ ] No firewall blocking the connection

---

## You're Done! 🎉

Your app is now deployed on Vercel and accessible worldwide!
