# Yummy Website - GitHub Pages Setup

This folder contains the static website for Yummy with privacy policy and data deletion pages required by Google Play Console.

## Files

- `index.html` - Home page with links to all policies
- `privacy-policy.html` - Privacy Policy
- `delete-account.html` - Account deletion instructions
- `delete-data.html` - Data deletion instructions (keep account)

## How to Host on GitHub Pages (FREE)

### Step 1: Push to GitHub

```bash
# If you haven't initialized git yet:
git init
git add .
git commit -m "Add website for Google Play requirements"

# Create a new repository on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/yummy-app.git
git branch -M main
git push -u origin main
```

### Step 2: Enable GitHub Pages

1. Go to your repository on GitHub
2. Click **Settings** (top right)
3. Click **Pages** (left sidebar)
4. Under **Source**, select:
   - Branch: `main`
   - Folder: `/docs`
5. Click **Save**

### Step 3: Wait for Deployment

- GitHub will deploy your site (takes 1-2 minutes)
- Your site will be available at: `https://YOUR_USERNAME.github.io/yummy-app/`

### Step 4: URLs for Google Play Console

Use these URLs in Google Play Console:

- **Privacy Policy:** `https://YOUR_USERNAME.github.io/yummy-app/privacy-policy.html`
- **Account Deletion:** `https://YOUR_USERNAME.github.io/yummy-app/delete-account.html`
- **Data Deletion:** `https://YOUR_USERNAME.github.io/yummy-app/delete-data.html`

## Alternative: Use a Custom Domain (Optional)

If you have a custom domain:

1. Add a `CNAME` file in the `docs` folder with your domain
2. Configure DNS settings with your domain provider
3. Enable HTTPS in GitHub Pages settings

## Important Notes

- **Update email address:** Replace `support@yummyapp.com` with your actual support email in all HTML files
- **Review dates:** Update the "Effective Date" in `privacy-policy.html` to today's date
- **Test links:** Make sure all pages load correctly before submitting to Google Play

## Need Help?

If you need a different hosting solution:
- **Netlify:** Drag and drop the `docs` folder to netlify.com
- **Vercel:** Connect your GitHub repo
- **Firebase Hosting:** `firebase deploy`
