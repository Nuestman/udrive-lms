# 🔧 Get Your Correct Supabase Connection String

## Step 1: Get Connection String from Supabase

1. Go to **Supabase Dashboard**: https://supabase.com/dashboard
2. Select your project
3. Click **Settings** (gear icon) in left sidebar
4. Click **Database**
5. Scroll to **Connection string** section
6. Select **URI** tab
7. Choose **Transaction** mode (for Vercel)

You'll see something like:

```
postgresql://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

OR

```
postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
```

## Step 2: Tell Me the Format

**WITHOUT revealing your actual password**, tell me which format you see:

**Format A (Transaction Pooler):**
```
postgresql://postgres.PROJECT_REF:[YOUR-PASSWORD]@aws-0-REGION.pooler.supabase.com:6543/postgres
```

**Format B (Direct Connection):**
```
postgresql://postgres:[YOUR-PASSWORD]@db.PROJECT_REF.supabase.co:5432/postgres
```

**Format C (Session Pooler):**
```
postgresql://postgres:[YOUR-PASSWORD]@aws-0-REGION.pooler.supabase.com:5432/postgres
```

## Step 3: I'll Build the Correct String

Once you tell me which format, I'll build the correct connection string with your URL-encoded password.

## Quick Test - Copy Your Connection String

Copy the ENTIRE connection string from Supabase (with `[YOUR-PASSWORD]` placeholder), then:

1. Replace `[YOUR-PASSWORD]` with: `%3AnN9D%26GE-%25-s5%24~M`
2. Paste it in your `.env` file as `DATABASE_URL=`
3. Try `npm run db:test:supabase` again

## Alternative: Use Direct Connection

If Transaction Pooler is causing issues, try Direct Connection:

1. In Supabase → Settings → Database
2. Under Connection string, select **Direct Connection**
3. Copy that string
4. Replace `[YOUR-PASSWORD]` with the URL-encoded version
5. Use port **5432** instead of **6543**

```env
# Direct Connection (port 5432)
DATABASE_URL=postgresql://postgres:[ENCODED-PASSWORD]@db.PROJECT_REF.supabase.co:5432/postgres
```

## What's Your Project Reference?

Your Supabase project reference is: `zrwrdfkntrfqarbidtou`

So your connection string should include this somewhere.

## Test Both Formats

Try BOTH of these in your `.env`:

### Option 1: Transaction Pooler
```env
DATABASE_URL=postgresql://postgres.zrwrdfkntrfqarbidtou:%3AnN9D%26GE-%25-s5%24~M@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

### Option 2: Direct Connection
```env
DATABASE_URL=postgresql://postgres:%3AnN9D%26GE-%25-s5%24~M@db.zrwrdfkntrfqarbidtou.supabase.co:5432/postgres
```

Try Option 2 first (Direct Connection) - it's more reliable for testing.

## Need Help?

Please share:
1. Which format you see in Supabase (A, B, or C above)
2. What region your Supabase project is in
3. The full connection string with `[YOUR-PASSWORD]` placeholder (don't share actual password)

