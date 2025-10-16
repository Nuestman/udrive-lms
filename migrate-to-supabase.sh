#!/bin/bash

# ============================================
# UDrive LMS - Database Migration to Supabase
# ============================================

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
LOCAL_DB="udrive-from-bolt"
LOCAL_USER="postgres"
LOCAL_PASS="453241945"  # From your .env
SUPABASE_HOST="db.zrwrdfkntrfqarbidtou.supabase.co"
SUPABASE_PORT="5432"
SUPABASE_DB="postgres"
SUPABASE_USER="postgres"
BACKUP_FILE="udrive_migration_$(date +%Y%m%d_%H%M%S).sql"

echo -e "${CYAN}=========================================${NC}"
echo -e "${CYAN}  UDrive LMS - Database Migration       ${NC}"
echo -e "${CYAN}  Local PostgreSQL → Supabase            ${NC}"
echo -e "${CYAN}=========================================${NC}\n"

# Check if PostgreSQL tools are installed
if ! command -v pg_dump &> /dev/null; then
    echo -e "${RED}❌ pg_dump not found${NC}"
    echo -e "${YELLOW}Please install PostgreSQL client tools${NC}"
    exit 1
fi

if ! command -v psql &> /dev/null; then
    echo -e "${RED}❌ psql not found${NC}"
    echo -e "${YELLOW}Please install PostgreSQL client tools${NC}"
    exit 1
fi

# Get Supabase password
if [ -z "$SUPABASE_PASSWORD" ]; then
    echo -e "${YELLOW}Supabase Database Password:${NC}"
    echo -e "${CYAN}Get it from: https://supabase.com/dashboard → Settings → Database${NC}"
    read -sp "Enter password: " SUPABASE_PASSWORD
    echo ""
fi

if [ -z "$SUPABASE_PASSWORD" ]; then
    echo -e "${RED}❌ Password is required!${NC}"
    exit 1
fi

SUPABASE_URL="postgresql://${SUPABASE_USER}:${SUPABASE_PASSWORD}@${SUPABASE_HOST}:${SUPABASE_PORT}/${SUPABASE_DB}"

# Step 1: Test local connection
echo -e "\n${CYAN}📡 Testing local database connection...${NC}"
export PGPASSWORD=$LOCAL_PASS
TABLE_COUNT=$(psql -U $LOCAL_USER -d $LOCAL_DB -t -A -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null)

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Connected to local database${NC}"
    echo -e "   Found $TABLE_COUNT tables"
else
    echo -e "${RED}❌ Cannot connect to local database${NC}"
    echo -e "${YELLOW}   Make sure PostgreSQL is running${NC}"
    exit 1
fi

# Step 2: Test Supabase connection
echo -e "\n${CYAN}☁️  Testing Supabase connection...${NC}"
VERSION=$(psql "$SUPABASE_URL" -t -A -c "SELECT version();" 2>/dev/null | cut -d',' -f1)

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Connected to Supabase${NC}"
    echo -e "   $VERSION"
else
    echo -e "${RED}❌ Cannot connect to Supabase${NC}"
    echo -e "${YELLOW}   Check your password and internet connection${NC}"
    unset PGPASSWORD
    exit 1
fi

# Step 3: Export local database
echo -e "\n${CYAN}📦 Exporting local database...${NC}"
echo -e "   This may take a minute..."

pg_dump -U $LOCAL_USER -d $LOCAL_DB --clean --if-exists -f $BACKUP_FILE 2>/dev/null

if [ $? -eq 0 ] && [ -f $BACKUP_FILE ]; then
    FILE_SIZE=$(du -h $BACKUP_FILE | cut -f1)
    echo -e "${GREEN}✅ Export complete${NC}"
    echo -e "   File: $BACKUP_FILE"
    echo -e "   Size: $FILE_SIZE"
else
    echo -e "${RED}❌ Failed to export database${NC}"
    unset PGPASSWORD
    exit 1
fi

unset PGPASSWORD

# Step 4: Analyze backup
echo -e "\n${CYAN}🔍 Analyzing backup file...${NC}"
TABLE_COUNT=$(grep -c "CREATE TABLE" $BACKUP_FILE)
INSERT_COUNT=$(grep -c "INSERT INTO" $BACKUP_FILE)

echo -e "   Tables: $TABLE_COUNT"
echo -e "   Data statements: $INSERT_COUNT"

if [ $TABLE_COUNT -eq 0 ]; then
    echo -e "${YELLOW}⚠️  No tables found in backup!${NC}"
    read -p "Continue anyway? (y/n): " CONTINUE
    if [ "$CONTINUE" != "y" ]; then
        exit 1
    fi
fi

# Step 5: Confirm migration
echo -e "\n${YELLOW}=========================================${NC}"
echo -e "${YELLOW}  READY TO MIGRATE${NC}"
echo -e "${YELLOW}=========================================${NC}"
echo -e "From: Local PostgreSQL ($LOCAL_DB)"
echo -e "To:   Supabase ($SUPABASE_HOST)"
echo -e "\nThis will:"
echo -e "  • Drop existing tables in Supabase"
echo -e "  • Create new tables from local"
echo -e "  • Import all data"
echo -e "\n${RED}⚠️  THIS CANNOT BE UNDONE!${NC}"

read -p $'\nContinue with migration? (yes/no): ' CONFIRM
if [ "$CONFIRM" != "yes" ]; then
    echo -e "\n${YELLOW}Migration cancelled.${NC}"
    exit 0
fi

# Step 6: Import to Supabase
echo -e "\n${CYAN}📤 Importing to Supabase...${NC}"
echo -e "   This may take several minutes..."
echo -e "   ${YELLOW}Do not close this window!${NC}"

psql "$SUPABASE_URL" -f $BACKUP_FILE > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Import complete!${NC}"
else
    echo -e "${YELLOW}⚠️  Import completed with warnings${NC}"
    echo -e "   Check output above for any errors"
fi

# Step 7: Verify migration
echo -e "\n${CYAN}✔️  Verifying migration...${NC}"

SUPABASE_TABLES=$(psql "$SUPABASE_URL" -t -A -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null)
USER_COUNT=$(psql "$SUPABASE_URL" -t -A -c "SELECT COUNT(*) FROM users;" 2>/dev/null)
COURSE_COUNT=$(psql "$SUPABASE_URL" -t -A -c "SELECT COUNT(*) FROM courses;" 2>/dev/null)
LESSON_COUNT=$(psql "$SUPABASE_URL" -t -A -c "SELECT COUNT(*) FROM lessons;" 2>/dev/null)

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Verification complete${NC}"
    echo -e "\n   ${CYAN}📊 Supabase Database:${NC}"
    echo -e "      Tables: $SUPABASE_TABLES"
    echo -e "      Users: $USER_COUNT"
    echo -e "      Courses: $COURSE_COUNT"
    echo -e "      Lessons: $LESSON_COUNT"
fi

# Step 8: Success message
echo -e "\n${GREEN}=========================================${NC}"
echo -e "${GREEN}  🎉 MIGRATION COMPLETE!${NC}"
echo -e "${GREEN}=========================================${NC}"

echo -e "\n${CYAN}✅ Next Steps:${NC}"
echo -e "   ${NC}1. Update your .env file:${NC}"
echo -e "      ${CYAN}DATABASE_URL=postgresql://postgres.zrwrdfkntrfqarbidtou:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true${NC}"
echo -e "\n   ${NC}2. Test locally with Supabase:${NC}"
echo -e "      ${CYAN}npm run db:test:supabase${NC}"
echo -e "\n   ${NC}3. Test your application:${NC}"
echo -e "      ${CYAN}npm run dev${NC}"
echo -e "\n   ${NC}4. Deploy to Vercel:${NC}"
echo -e "      ${CYAN}Push to GitHub and Vercel auto-deploys!${NC}"

echo -e "\n${YELLOW}📝 Backup saved as: $BACKUP_FILE${NC}"
echo -e "   Keep this file safe!"

echo -e "\n${CYAN}🌐 View your Supabase database:${NC}"
echo -e "   https://supabase.com/dashboard/project/zrwrdfkntrfqarbidtou/editor\n"

