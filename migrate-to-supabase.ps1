# ============================================
# UDrive LMS - Database Migration to Supabase
# ============================================

param(
    [string]$SupabasePassword = ""
)

# Configuration
$LOCAL_DB = "udrive-from-bolt"
$LOCAL_USER = "postgres"
$SUPABASE_HOST = "db.zrwrdfkntrfqarbidtou.supabase.co"
$SUPABASE_PORT = "5432"
$SUPABASE_DB = "postgres"
$SUPABASE_USER = "postgres"
$BACKUP_FILE = "udrive_migration_$(Get-Date -Format 'yyyyMMdd_HHmmss').sql"

# Colors
$script:SuccessColor = "Green"
$script:ErrorColor = "Red"
$script:WarningColor = "Yellow"
$script:InfoColor = "Cyan"

function Write-Step {
    param([string]$Message)
    Write-Host "`n$Message" -ForegroundColor $script:InfoColor
}

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor $script:SuccessColor
}

function Write-Error-Message {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor $script:ErrorColor
}

function Write-Warning-Message {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor $script:WarningColor
}

# Check if pg_dump is available
function Test-PostgreSQLTools {
    try {
        $null = Get-Command pg_dump -ErrorAction Stop
        $null = Get-Command psql -ErrorAction Stop
        return $true
    } catch {
        Write-Error-Message "PostgreSQL tools (pg_dump, psql) not found in PATH"
        Write-Host "`nPlease install PostgreSQL or add it to your PATH:" -ForegroundColor Yellow
        Write-Host "C:\Program Files\PostgreSQL\14\bin\" -ForegroundColor White
        return $false
    }
}

# Main script
Clear-Host
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  UDrive LMS - Database Migration       " -ForegroundColor Cyan
Write-Host "  Local PostgreSQL → Supabase            " -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# Check PostgreSQL tools
if (-not (Test-PostgreSQLTools)) {
    exit 1
}

# Get Supabase password if not provided
if ([string]::IsNullOrEmpty($SupabasePassword)) {
    Write-Host "`nSupabase Database Password:" -ForegroundColor Yellow
    Write-Host "Get it from: https://supabase.com/dashboard → Settings → Database" -ForegroundColor Gray
    $SecurePassword = Read-Host "Enter password" -AsSecureString
    $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($SecurePassword)
    $SupabasePassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
}

if ([string]::IsNullOrEmpty($SupabasePassword)) {
    Write-Error-Message "Password is required!"
    exit 1
}

$SUPABASE_URL = "postgresql://${SUPABASE_USER}:${SupabasePassword}@${SUPABASE_HOST}:${SUPABASE_PORT}/${SUPABASE_DB}"

# Step 1: Test local database connection
Write-Step "📡 Testing local database connection..."
try {
    $env:PGPASSWORD = "453241945"  # Your local password from .env
    $result = psql -U $LOCAL_USER -d $LOCAL_DB -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" -t -A 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Connected to local database"
        Write-Host "   Found $result tables" -ForegroundColor Gray
    } else {
        throw "Connection failed"
    }
} catch {
    Write-Error-Message "Cannot connect to local database"
    Write-Host "   Make sure PostgreSQL is running" -ForegroundColor Yellow
    Write-Host "   Database: $LOCAL_DB" -ForegroundColor Yellow
    exit 1
} finally {
    Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
}

# Step 2: Test Supabase connection
Write-Step "☁️  Testing Supabase connection..."
try {
    $result = psql $SUPABASE_URL -c "SELECT version();" -t 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Connected to Supabase"
        Write-Host "   PostgreSQL Version: $($result.Trim().Split(',')[0])" -ForegroundColor Gray
    } else {
        throw "Connection failed"
    }
} catch {
    Write-Error-Message "Cannot connect to Supabase"
    Write-Host "   Check your password and internet connection" -ForegroundColor Yellow
    Write-Host "   Get password from: https://supabase.com/dashboard" -ForegroundColor Yellow
    exit 1
}

# Step 3: Export local database
Write-Step "📦 Exporting local database..."
Write-Host "   This may take a minute..." -ForegroundColor Gray

try {
    $env:PGPASSWORD = "453241945"
    pg_dump -U $LOCAL_USER -d $LOCAL_DB --clean --if-exists -f $BACKUP_FILE 2>&1 | Out-Null
    
    if ($LASTEXITCODE -eq 0 -and (Test-Path $BACKUP_FILE)) {
        $fileSize = (Get-Item $BACKUP_FILE).Length / 1KB
        Write-Success "Export complete"
        Write-Host "   File: $BACKUP_FILE" -ForegroundColor Gray
        Write-Host "   Size: $([math]::Round($fileSize, 2)) KB" -ForegroundColor Gray
    } else {
        throw "Export failed"
    }
} catch {
    Write-Error-Message "Failed to export database"
    exit 1
} finally {
    Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
}

# Step 4: Backup check
Write-Step "🔍 Analyzing backup file..."
$content = Get-Content $BACKUP_FILE -Raw
$tableCount = ([regex]::Matches($content, "CREATE TABLE")).Count
$insertCount = ([regex]::Matches($content, "INSERT INTO")).Count

Write-Host "   Tables: $tableCount" -ForegroundColor Gray
Write-Host "   Data statements: $insertCount" -ForegroundColor Gray

if ($tableCount -eq 0) {
    Write-Warning-Message "No tables found in backup!"
    $continue = Read-Host "Continue anyway? (y/n)"
    if ($continue -ne 'y') {
        exit 1
    }
}

# Step 5: Confirm migration
Write-Host "`n=========================================" -ForegroundColor Yellow
Write-Host "  READY TO MIGRATE" -ForegroundColor Yellow
Write-Host "=========================================" -ForegroundColor Yellow
Write-Host "From: Local PostgreSQL ($LOCAL_DB)" -ForegroundColor White
Write-Host "To:   Supabase ($SUPABASE_HOST)" -ForegroundColor White
Write-Host "`nThis will:" -ForegroundColor Yellow
Write-Host "  • Drop existing tables in Supabase" -ForegroundColor Gray
Write-Host "  • Create new tables from local" -ForegroundColor Gray
Write-Host "  • Import all data" -ForegroundColor Gray
Write-Host "`n⚠️  THIS CANNOT BE UNDONE!" -ForegroundColor Red

$confirm = Read-Host "`nContinue with migration? (yes/no)"
if ($confirm -ne 'yes') {
    Write-Host "`nMigration cancelled." -ForegroundColor Yellow
    exit 0
}

# Step 6: Import to Supabase
Write-Step "📤 Importing to Supabase..."
Write-Host "   This may take several minutes..." -ForegroundColor Gray
Write-Host "   Do not close this window!" -ForegroundColor Yellow

try {
    $output = psql $SUPABASE_URL -f $BACKUP_FILE 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Import complete!"
    } else {
        Write-Warning-Message "Import completed with warnings"
        Write-Host "   Check output above for any errors" -ForegroundColor Gray
    }
} catch {
    Write-Error-Message "Import failed"
    Write-Host "   Error: $_" -ForegroundColor Red
    exit 1
}

# Step 7: Verify migration
Write-Step "✔️  Verifying migration..."

try {
    # Count tables
    $supabaseTables = psql $SUPABASE_URL -t -A -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>&1
    
    # Count some records
    $userCount = psql $SUPABASE_URL -t -A -c "SELECT COUNT(*) FROM user_profiles;" 2>&1
    $courseCount = psql $SUPABASE_URL -t -A -c "SELECT COUNT(*) FROM courses;" 2>&1
    $lessonCount = psql $SUPABASE_URL -t -A -c "SELECT COUNT(*) FROM lessons;" 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Verification complete"
        Write-Host "`n   📊 Supabase Database:" -ForegroundColor Cyan
        Write-Host "      Tables: $supabaseTables" -ForegroundColor White
        Write-Host "      Users: $userCount" -ForegroundColor White
        Write-Host "      Courses: $courseCount" -ForegroundColor White
        Write-Host "      Lessons: $lessonCount" -ForegroundColor White
    }
} catch {
    Write-Warning-Message "Could not verify data (but import may have succeeded)"
}

# Step 8: Success message
Write-Host "`n=========================================" -ForegroundColor Green
Write-Host "  🎉 MIGRATION COMPLETE!" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green

Write-Host "`n✅ Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Update your .env file:" -ForegroundColor White
Write-Host "      DATABASE_URL=postgresql://postgres.zrwrdfkntrfqarbidtou:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true" -ForegroundColor Gray
Write-Host "`n   2. Test locally with Supabase:" -ForegroundColor White
Write-Host "      npm run db:test:supabase" -ForegroundColor Gray
Write-Host "`n   3. Test your application:" -ForegroundColor White
Write-Host "      npm run dev" -ForegroundColor Gray
Write-Host "`n   4. Deploy to Vercel:" -ForegroundColor White
Write-Host "      Push to GitHub and Vercel auto-deploys!" -ForegroundColor Gray

Write-Host "`n📝 Backup saved as: $BACKUP_FILE" -ForegroundColor Yellow
Write-Host "   Keep this file safe!" -ForegroundColor Yellow

Write-Host "`n🌐 View your Supabase database:" -ForegroundColor Cyan
Write-Host "   https://supabase.com/dashboard/project/zrwrdfkntrfqarbidtou/editor" -ForegroundColor White

Write-Host ""

