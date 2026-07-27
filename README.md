# Personal Website

## Deploy to Render (Free)

### Step 1: Push to GitHub
1. Go to https://github.com/new
2. Name it `personal-website`, make it **Public**
3. Run these commands in Terminal:

```bash
cd ~/persona_website
git init
git add .
git commit -m "initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/personal-website.git
git push -u origin main
```

### Step 2: Deploy on Render
1. Go to https://render.com (sign up with GitHub)
2. Click **New** → **Web Service**
3. Connect your GitHub repo `personal-website`
4. Settings:
   - **Name:** `personal-website`
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
5. Click **Create Web Service**

### Step 3: Done!
- Your site: `personal-website.onrender.com`
- Admin: `personal-website.onrender.com/admin`
- Username: `admin`
- Password: `atharv2025`

## Updating
Edit in admin panel → click **Publish** → changes go live.
