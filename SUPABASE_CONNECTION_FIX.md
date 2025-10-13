# 🔧 Supabase Connection Error - Quick Fix

## ❌ Error You're Getting

```
psql: error: could not translate host name "db.zrwrdfkntrfqarbidtou.supabase.co" to address: Name or service not known
```

---

## 🎯 Solution: Get Correct Connection String

The hostname format might be different for your project. Let's get the **exact** connection string from Supabase.

### Step 1: Get Connection String from Supabase Dashboard

1. Go to: https://supabase.com/dashboard/project/zrwrdfkntrfqarbidtou/settings/database

2. Scroll to **Connection String** section

3. Look for **Connection pooling** - Copy the **Connection string** (Transaction mode)
   ```
   postgresql://postgres.[PROJECT_REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
   ```

4. Also note the **Direct connection** string:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
   ```

---

## 🔍 Find Your Exact Hostname

### Method 1: Check Supabase Dashboard

1. **Project Settings** → **Database**
2. Look for **Host** under "Connection parameters"
3. It should show the exact hostname

### Method 2: Test Different Formats

Your project might use one of these formats:

```bash
# Format 1: Standard (what we tried)
db.zrwrdfkntrfqarbidtou.supabase.co

# Format 2: With AWS region
db.zrwrdfkntrfqarbidtou.supabase.us-east-1.co

# Format 3: Pooler (Recommended for migration)
aws-0-us-east-1.pooler.supabase.com

# Format 4: Direct with full region
db.[project].supabase.co
```

---

## ✅ Quick Test Commands

Try these one by one to find which works:

### Test 1: Check Internet & DNS
```powershell
# Test if you can reach Supabase
ping supabase.com

# Test DNS resolution
nslookup db.zrwrdfkntrfqarbidtou.supabase.co
```

### Test 2: Try Pooler Connection
```powershell
# Use pooler instead (often more reliable)
psql "postgresql://postgres.zrwrdfkntrfqarbidtou:453241945@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require" -c "SELECT version();"
```

### Test 3: Check Your Actual Connection String

Go to Supabase Dashboard and copy the EXACT string, then test:
```powershell
psql "YOUR_EXACT_CONNECTION_STRING_FROM_DASHBOARD" -c "SELECT version();"
```

---

## 🛠️ Alternative: Use Supabase SQL Editor

If command line doesn't work, use the web interface:

### Step 1: Export Local Database
```powershell
# This still works (local only)
pg_dump -U postgres -d udrive-from-bolt --clean --if-exists -f migration.sql
```

### Step 2: Upload via Supabase SQL Editor

1. Go to: https://supabase.com/dashboard/project/zrwrdfkntrfqarbidtou/sql/new
2. Click **New Query**
3. Open `migration.sql` in a text editor
4. Copy ALL contents
5. Paste into Supabase SQL Editor
6. Click **Run**

**Note:** Large files might take time. If too large, split into chunks:
- First: Schema (CREATE TABLE statements)
- Then: Data (INSERT statements)

---

## 🔍 Troubleshooting Steps

### Issue 1: Hostname Not Found

**Possible Causes:**
- Project is in different region
- Supabase changed hostname format
- DNS issue on your network
- VPN/Firewall blocking

**Solutions:**

1. **Get exact hostname from dashboard:**
   ```
   Settings → Database → Connection Info → Host
   ```

2. **Try with IP instead of hostname:**
   - Dashboard will show the IP address
   - Use: `psql "postgresql://postgres:PASSWORD@IP_ADDRESS:5432/postgres"`

3. **Check your region:**
   - Your project might be in a different AWS region
   - Hostname format: `db.PROJECT_REF.supabase.co` OR `aws-0-REGION.pooler.supabase.com`

### Issue 2: SSL Certificate Error

If you get SSL errors, add `sslmode=require`:
```powershell
psql "postgresql://postgres:PASSWORD@HOST:PORT/postgres?sslmode=require" -c "SELECT 1;"
```

### Issue 3: Connection Timeout

**Check:**
- Internet connection
- Firewall settings
- VPN if using one

---

## 🎯 Recommended: Use Pooler Connection

For migration, **pooler is actually better**:

### Why Pooler?
- ✅ More stable for migrations
- ✅ Better connection handling
- ✅ Works through more firewalls
- ✅ Built-in connection pooling

### Pooler Format:
```
postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres?pgbouncer=true
```

### Get Your Pooler URL:
1. Dashboard → Settings → Database
2. Look for **"Connection pooling"** section
3. Select **"Transaction"** mode
4. Copy the connection string

---

## 📝 Updated Migration Command

Once you have the correct connection string from dashboard:

```powershell
# 1. Export (this works)
pg_dump -U postgres -d udrive-from-bolt --clean --if-exists -f migration.sql

# 2. Import with CORRECT URL from dashboard
psql "YOUR_EXACT_SUPABASE_CONNECTION_STRING" -f migration.sql
```

---

## 🔐 Getting Your Database Password

If you don't have it:

1. Go to: https://supabase.com/dashboard/project/zrwrdfkntrfqarbidtou/settings/database
2. Scroll to **Database Settings**
3. Click **"Reset database password"**
4. Copy and save the new password
5. Use it in your connection string

---

## ✅ Working Example

Once you get your connection details from dashboard, it should look like:

```powershell
# Connection string from Supabase (Transaction mode)
$SUPABASE_URL = "postgresql://postgres.zrwrdfkntrfqarbidtou:YOUR_NEW_PASSWORD@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Test connection
psql $SUPABASE_URL -c "SELECT current_database(), version();"

# If that works, import
psql $SUPABASE_URL -f migration.sql
```

---

## 🆘 Quick Actions

### Right Now - Do This:

1. **Go to Supabase Dashboard:**
   https://supabase.com/dashboard/project/zrwrdfkntrfqarbidtou/settings/database

2. **Find "Connection pooling" section**

3. **Copy the EXACT connection string shown there**

4. **Test it:**
   ```powershell
   psql "PASTE_CONNECTION_STRING_HERE" -c "SELECT 1;"
   ```

5. **If it works, use for migration:**
   ```powershell
   psql "PASTE_CONNECTION_STRING_HERE" -f migration.sql
   ```

---

## 🌐 Alternative: Direct Dashboard Upload

If psql continues to have issues:

### Using Supabase Dashboard:

1. **Export:** Already done! (`migration.sql`)

2. **Split file if large:**
   ```powershell
   # Get file size
   (Get-Item migration.sql).Length / 1MB
   
   # If > 10MB, split into parts
   ```

3. **Upload via SQL Editor:**
   - Small files: Copy/paste entire file
   - Large files: Upload schema first, then data

4. **Run in SQL Editor**

---

## 📞 Quick Check Commands

Run these to diagnose:

```powershell
# 1. Check if Supabase is reachable
Test-NetConnection supabase.com -Port 443

# 2. Check DNS
nslookup supabase.com

# 3. Check your local database works
psql -U postgres -d udrive-from-bolt -c "SELECT current_database();"

# 4. Check migration file was created
Get-Item migration.sql | Select-Object Name, Length

# 5. Preview migration file
Get-Content migration.sql -Head 50
```

---

## ✅ Next Steps

1. **Get exact connection string from Supabase Dashboard**
2. **Test connection with simple query**
3. **If works, run migration**
4. **If doesn't work, use SQL Editor method**

---

**The key is getting the EXACT connection string from your Supabase dashboard!**

Go to the dashboard now and copy it directly - don't manually construct it.

