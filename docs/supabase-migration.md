# Supabase to Local PostgreSQL Migration Guide

This guide documents the process of migrating database schema and data from Supabase to local PostgreSQL for development.

## Overview

The migration process involves:
1. **Dumping the complete schema** from Supabase
2. **Dumping all data** from Supabase
3. **Recreating the local database** with the Supabase schema
4. **Importing the data** into the local database

## Prerequisites

- Local PostgreSQL installed and running
- Node.js installed
- Access to Supabase database connection string
- `.env` file configured (see below)

## Environment Setup

### For Schema/Data Dump (from Supabase)

Set `DATABASE_URL` in your `.env` file to your Supabase connection string:

```env
DATABASE_URL=postgresql://postgres.xxx:password@aws-0-eu-west-2.pooler.supabase.com:5432/postgres
```

### For Local Database Operations

Comment out or remove `DATABASE_URL` and use individual parameters:

```env
# DATABASE_URL=...  # Comment out for local operations

DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=sunlms
DATABASE_USER=postgres
DATABASE_PASSWORD=your_local_password
```

## Step-by-Step Migration Process

### Step 1: Dump Schema from Supabase

This creates a complete SQL schema file from your Supabase database.

```bash
# Set DATABASE_URL to Supabase connection string
$env:DATABASE_URL = "postgresql://postgres.xxx:password@aws-0-eu-west-2.pooler.supabase.com:5432/postgres"
node database/dump-supabase-schema.js
```

**Output:**
- `database/schema.sql` - Complete schema with proper ordering
- `database/supabase-schema-dump.sql` - Copy of the schema dump

**What it does:**
- Connects to Supabase
- Extracts all tables, columns, constraints, indexes, functions, and triggers
- Orders tables by dependencies (tables with no dependencies first)
- Creates schema in this order:
  1. Extensions (uuid-ossp, pgcrypto)
  2. All CREATE TABLE statements (with PRIMARY KEYs)
  3. All ALTER TABLE constraints (foreign keys, checks, unique)
  4. All indexes
  5. All functions
  6. All triggers

**Key Features:**
- Handles table dependencies automatically
- Includes PRIMARY KEYs in CREATE TABLE statements
- Separates constraints to avoid dependency issues
- Properly formats dollar-quoted strings in functions

### Step 2: Dump Data from Supabase

This exports all data from Supabase tables to SQL INSERT statements.

```bash
# DATABASE_URL should still point to Supabase
node database/dump-supabase-data.js
```

**Output:**
- `database/supabase-data-dump.sql` - All data as INSERT statements

**What it does:**
- Connects to Supabase
- Iterates through all tables
- Generates INSERT statements with proper escaping
- Handles special data types:
  - JSONB columns (properly stringified)
  - PostgreSQL arrays (with type casting for empty arrays)
  - NULL values
  - Dates and timestamps
  - UUIDs

**Key Features:**
- Properly escapes SQL strings
- Handles JSONB arrays and objects
- Casts empty arrays with type: `ARRAY[]::text[]`
- Uses `ON CONFLICT DO NOTHING` for idempotency

### Step 3: Recreate Local Database

This drops and recreates your local database with the Supabase schema.

```bash
# Make sure DATABASE_URL is commented out in .env
node database/recreate-local-db.js
```

**What it does:**
- Connects to PostgreSQL server (not a specific database)
- Terminates existing connections to the database
- Drops the `sunlms` database if it exists
- Creates a new `sunlms` database
- Executes the schema from `schema.sql`
- Splits SQL statements properly (handles dollar-quoted strings)
- Verifies tables were created

**Important:** This will **delete all existing data** in your local database!

### Step 4: Import Data to Local Database

This imports all the Supabase data into your local database.

```bash
# DATABASE_URL should still be commented out
node database/import-supabase-data.js
```

**What it does:**
- Connects to local PostgreSQL database
- Reads `supabase-data-dump.sql`
- Executes all INSERT statements
- Handles errors gracefully

## Common Issues and Solutions

### Issue 1: "relation does not exist" when running schema

**Problem:** Foreign key constraints are added before referenced tables exist.

**Solution:** The schema dump script now properly orders:
1. All tables first
2. All constraints after tables
3. All indexes after constraints

If you still see this error, make sure you're using the latest `dump-supabase-schema.js`.

### Issue 2: "cannot cast type text[] to jsonb"

**Problem:** JSONB columns containing arrays were being formatted as PostgreSQL arrays instead of JSON.

**Solution:** The data dump script now checks data type first:
- If column is `jsonb` or `json`, it stringifies the value (even if it's an array)
- Only PostgreSQL array columns use `ARRAY[]` syntax

### Issue 3: "cannot determine type of empty array"

**Problem:** Empty PostgreSQL arrays need explicit type casting.

**Solution:** Empty arrays are now cast with their type:
- `ARRAY[]::text[]` for text arrays
- `ARRAY[]::uuid[]` for UUID arrays
- etc.

The script detects the array element type from the column definition.

### Issue 4: Connection timeouts

**Problem:** Supabase connection times out during large data dumps.

**Solution:**
- The script processes tables one at a time
- If a table times out, it will skip it and continue
- You can re-run the dump script - it will overwrite the file
- For very large tables, consider dumping them separately

### Issue 5: Schema mismatches

**Problem:** Local schema doesn't match Supabase schema.

**Solution:**
- Always dump schema from Supabase first
- Use `dump-supabase-schema.js` to get the exact schema
- Don't manually edit `schema.sql` - always regenerate from Supabase
- If you have migration files, apply them to Supabase first, then dump

## File Structure

```
database/
├── dump-supabase-schema.js      # Dumps schema from Supabase
├── dump-supabase-data.js        # Dumps data from Supabase
├── import-supabase-data.js      # Imports data to local DB
├── recreate-local-db.js         # Recreates local database
├── run-schema.js                # Runs schema.sql (alternative)
├── schema.sql                   # Main schema file (from Supabase)
├── supabase-schema-dump.sql     # Schema dump backup
└── supabase-data-dump.sql       # Data dump file
```

## Best Practices

1. **Always dump schema first** - Schema changes should come from Supabase
2. **Backup before recreating** - The recreate script deletes all local data
3. **Test in a separate database first** - Create a test database to verify the process
4. **Keep dumps in version control** - Commit schema and data dumps for reference
5. **Document schema changes** - If you modify Supabase schema, document why
6. **Use migrations for Supabase** - Apply schema changes via migrations, then dump

## Workflow for Schema Changes

When you need to update the local schema:

1. Apply migrations to Supabase (if any)
2. Dump fresh schema: `node database/dump-supabase-schema.js`
3. Review `schema.sql` for changes
4. Recreate local database: `node database/recreate-local-db.js`
5. Re-import data: `node database/import-supabase-data.js`

## Troubleshooting

### Check database connection

```bash
node database/test-connection.js
```

### Verify schema matches

Compare table counts and structure between Supabase and local:

```sql
-- In Supabase
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' ORDER BY table_name;

-- In local database
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' ORDER BY table_name;
```

### Check for missing columns

```sql
-- Compare column counts per table
SELECT 
    table_name,
    COUNT(*) as column_count
FROM information_schema.columns
WHERE table_schema = 'public'
GROUP BY table_name
ORDER BY table_name;
```

## Notes

- The schema dump includes all tables, constraints, indexes, functions, and triggers
- Data dump includes all rows from all tables
- Both scripts handle special PostgreSQL types (JSONB, arrays, UUIDs, etc.)
- The process is idempotent - you can re-run it safely
- Local database is completely replaced during migration

## Related Documentation

- [Development Setup Guide](development-setup.md)
- [Git Workflow Guide](git-workflow.md)

