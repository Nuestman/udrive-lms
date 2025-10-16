# Test Authentication - Step by Step

## 🎯 Goal
Verify that authentication works end-to-end with your PostgreSQL database.

---

## Prerequisites

✅ Database is set up (`npm run db:setup` completed)  
✅ Test users exist in database  
✅ `.env` file configured  

---

## Step 1: Start the Application

In your terminal, run:

```bash
npm run dev:all
```

Wait for both servers to start. You should see:

```
[0] 🚀 Server running on http://localhost:5000
[0] 📡 API available at http://localhost:5000/api
[0] 🔐 Auth endpoints at http://localhost:5000/api/auth
[1] 
[1]   VITE v5.4.2  ready in 500 ms
[1]   ➜  Local:   http://localhost:5173/
```

---

## Step 2: Open Browser DevTools

1. Open Chrome/Edge
2. Press F12 to open DevTools
3. Go to **Console** tab
4. Keep it open to see authentication logs

---

## Step 3: Navigate to Login

1. Open: http://localhost:5173
2. Click "Sign In" button
3. You should see the login page

---

## Step 4: Test Login (School Admin)

1. Enter:
   ```
   Email: schooladmin@premier.com
   Password: password123
   ```

2. Click "Sign In"

3. **Watch the Console** - You should see:
   ```
   [AUTH-INFO] Sign in attempt
   POST /api/auth/login
   [AUTH-INFO] Sign in successful
   ```

4. **Check Network Tab** (F12 → Network):
   - Find `login` request
   - Status should be `200 OK`
   - Response should include user data

5. **Expected Result:**
   - ✅ Redirect to school admin dashboard
   - ✅ No errors in console
   - ✅ User profile loads

---

## Step 5: Verify Backend Logs

Switch to your terminal where servers are running.

You should see backend logs like:
```
POST /api/auth/login
Executed query { text: 'SELECT * FROM users WHERE email = $1...', duration: 12, rows: 1 }
```

This confirms:
- ✅ Frontend connected to backend
- ✅ Backend connected to database
- ✅ Query executed successfully
- ✅ User found and authenticated

---

## Step 6: Check User Data

In the browser console, type:
```javascript
localStorage.getItem('auth_token')
```

You should see a JWT token or check cookies:
1. DevTools → Application tab
2. Cookies → http://localhost:5173
3. Look for `auth_token` cookie

---

## Step 7: Test Logout

1. Click on your profile/avatar
2. Click "Logout"
3. **Expected:**
   - ✅ Redirect to landing page
   - ✅ Console shows: `[AUTH-INFO] Sign out successful`
   - ✅ Cookie is cleared

---

## Step 8: Test Different Roles

### Test Instructor Login
```
Email: instructor@premier.com
Password: password123
```

**Expected:** Redirect to instructor dashboard

### Test Student Login
```
Email: student1@example.com
Password: password123
```

**Expected:** Redirect to student dashboard

---

## Step 9: Test Wrong Password

1. Try to login with:
   ```
   Email: schooladmin@premier.com
   Password: wrongpassword
   ```

2. **Expected:**
   - ❌ Error message: "Invalid email or password"
   - ❌ Status 401 in Network tab
   - ❌ Console shows: `[AUTH-ERROR] Sign in failed`

---

## Step 10: Test Signup (Optional)

1. Click "Sign up"
2. Fill in the form:
   ```
   First Name: Test
   Last Name: User
   Email: testuser@example.com
   Password: password123
   Confirm Password: password123
   ```

3. Click "Create Account"

4. **Expected:**
   - ✅ Account created
   - ✅ Automatic login
   - ✅ Redirect to student dashboard
   - ✅ New user appears in database

---

## ✅ Success Checklist

After testing, verify:

- [ ] Backend server started without errors
- [ ] Frontend loaded successfully
- [ ] Login page displayed correctly
- [ ] Can login with test credentials
- [ ] JWT token is generated
- [ ] User profile loads from database
- [ ] Redirect to appropriate dashboard
- [ ] Backend logs show database queries
- [ ] Logout clears session
- [ ] Wrong password shows error
- [ ] Different roles redirect correctly

---

## 🐛 Troubleshooting

### Login Button Does Nothing

**Check:**
1. Is backend running? (Terminal should show server logs)
2. Open DevTools → Console - any errors?
3. Check Network tab - is request being made?

**Fix:** Restart servers with `npm run dev:all`

### "Failed to fetch" Error

**Problem:** Frontend can't reach backend

**Check:**
1. Backend running on port 5000?
2. CORS enabled in backend?
3. API_URL correct in frontend?

**Fix:** Check `.env` file:
```env
VITE_API_URL=http://localhost:5000/api
```

### "Invalid email or password" (But credentials are correct)

**Problem:** Database not seeded or password issue

**Check:**
```bash
node database/test-connection.js
```

Should show 6 users. If not:
```bash
npm run db:seed
```

### Backend Shows Database Errors

**Problem:** Database connection issue

**Check:** `.env` file has correct credentials:
```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=udrive-from-bolt
DATABASE_USER=postgres
DATABASE_PASSWORD=your_actual_password
```

**Verify:** PostgreSQL is running in pgAdmin

---

## 📊 What Success Looks Like

### Console Output (Frontend)
```
[AUTH-INFO] Checking for existing session
[AUTH-INFO] No active session
[AUTH-INFO] Sign in attempt { credential: 'sch***' }
POST /api/auth/login 200 OK
[AUTH-INFO] Sign in successful { userId: '...', role: 'school_admin' }
```

### Terminal Output (Backend)
```
POST /api/auth/login
Executed query { text: 'SELECT * FROM users WHERE...', duration: 15, rows: 1 }
```

### Network Tab
```
Request URL: http://localhost:5000/api/auth/login
Status Code: 200 OK
Response: { success: true, user: {...}, token: 'eyJhbG...' }
```

---

## 🎉 If Everything Works

Congratulations! You have:

✅ **Working Backend API**  
✅ **Database Integration**  
✅ **JWT Authentication**  
✅ **Secure Session Management**  
✅ **Role-Based Access Control**  
✅ **Real User Accounts**  

**Your LMS is functional!** 🚀

---

## 🔜 Next Steps

After confirming authentication works:

1. Test all 3 roles (admin, instructor, student)
2. Try signing up a new user
3. Test logout and re-login
4. Verify session persists across page refresh
5. Check database in pgAdmin - new users should appear

Then proceed to **Week 2** - connecting components to real data!

---

## 📝 Report Issues

If something doesn't work:

1. Check console for errors
2. Check backend terminal for errors
3. Verify database connection: `node database/test-connection.js`
4. Check `.env` file configuration
5. Try restarting: Stop servers (Ctrl+C) and run `npm run dev:all` again

---

**Happy Testing!** 🎯





