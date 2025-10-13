# 🚀 Deploy to Vercel - Final Steps

## ✅ Local Setup Complete!

Your local environment is working:
- ✅ Database connected (Supabase)
- ✅ Server running on http://localhost:5000
- ✅ Frontend running on http://localhost:5173
- ✅ All tables present (17 tables)
- ✅ Test data loaded (9 users, 5 courses)

## 📦 Step 1: Update Vercel Environment Variables

Go to: **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**

### Required Variables (Copy/Paste from VERCEL_ENV_FINAL.txt)

**Update or add these:**

```
NODE_ENV=production
```

```
DATABASE_URL=postgresql://postgres.zrwrdfkntrfqarbidtou:uwykGPTyCQo8jRa9@aws-0-eu-west-2.pooler.supabase.com:5432/postgres
```

```
JWT_SECRET=8c3f0d27d574dbf2c3cb9536cdcddb3eab201dd0118d3d503dd781e9e87fefe8076100c9c2fbbc45537cfab0583da9acd5d6e345db1ce036a84a393636bb4e60
```

```
JWT_EXPIRES_IN=7d
```

```
VITE_API_URL=https://YOUR-APP-NAME.vercel.app/api
```
**⚠️ IMPORTANT:** Replace `YOUR-APP-NAME` with your actual Vercel URL!

```
FRONTEND_URL=https://YOUR-APP-NAME.vercel.app
```
**⚠️ IMPORTANT:** Replace `YOUR-APP-NAME` with your actual Vercel URL!

### Optional Variables

```
VITE_TINYMCE_API_KEY=no-api-key
```

```
VITE_SUPABASE_URL=https://zrwrdfkntrfqarbidtou.supabase.co
```

```
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpyd3JkZmtudHJmcWFyYmlkdG91Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIzMDIyNDgsImV4cCI6MjA2Nzg3ODI0OH0.QlEzPw9vXhNrmNtsVHeIGvxrKAR_NOGAjiZYpe
```

## 🔍 Step 2: Find Your Vercel URL

1. Go to your Vercel project dashboard
2. Look at the **"Domains"** section
3. Copy your URL (e.g., `udrive-lms.vercel.app`)
4. Use this to replace `YOUR-APP-NAME` in the variables above

## 🔄 Step 3: Redeploy

After updating all environment variables:

1. Go to **Deployments** tab
2. Find your latest deployment
3. Click **⋮** (three dots)
4. Click **Redeploy**
5. Wait 1-2 minutes for deployment to complete

## ✅ Step 4: Test Production

Visit your Vercel URL and try logging in with:

**Test Credentials:**
- Email: Check your Supabase → Table Editor → user_profiles for actual emails
- Common ones:
  - `admin@udrivelms.com` / `password123`
  - `schooladmin@premier.com` / `password123`
  - `instructor@premier.com` / `password123`
  - `student1@premier.com` / `password123`

## 🐛 Troubleshooting

### "Network Error" or Can't Login

**Check 1: Environment Variables**
- Make sure `VITE_API_URL` does NOT contain "localhost"
- Must be: `https://your-actual-vercel-url.vercel.app/api`

**Check 2: Vercel Function Logs**
- Go to Deployments → Click your deployment → Functions tab
- Look for errors

**Check 3: Browser Console**
- Press F12 in your browser
- Check Console tab for errors
- Check Network tab to see if API calls are going to correct URL

### Still Getting Errors?

1. **Verify DATABASE_URL in Vercel** - Must be the EU West 2 pooler URL
2. **Check if all variables are set** - NODE_ENV, DATABASE_URL, JWT_SECRET, VITE_API_URL, FRONTEND_URL
3. **Make sure you redeployed** - Changes don't take effect until redeploy

## 🎯 Success Checklist

- [ ] All Vercel environment variables updated
- [ ] VITE_API_URL and FRONTEND_URL have correct Vercel domain (not localhost)
- [ ] DATABASE_URL is the Supabase EU West 2 pooler connection
- [ ] JWT_SECRET is set
- [ ] Vercel redeployed after changes
- [ ] Can visit production URL
- [ ] Can login with test credentials
- [ ] See dashboard after login

## 📝 Common Mistakes to Avoid

❌ **Wrong:** `VITE_API_URL=http://localhost:5000/api` in Vercel
✅ **Correct:** `VITE_API_URL=https://your-app.vercel.app/api`

❌ **Wrong:** Using old US East 1 database URL
✅ **Correct:** Using EU West 2 pooler URL

❌ **Wrong:** Forgetting to redeploy after changing variables
✅ **Correct:** Always redeploy after environment variable changes

## 🎉 What's Next?

Once production is working:
1. Test all features (login, courses, lessons, enrollments)
2. Change default passwords for security
3. Add your real schools/tenants
4. Invite real users
5. Configure custom domain (optional)
6. Set up monitoring (optional)

---

Your local environment is perfect! Just update Vercel and you're done! 🚀

