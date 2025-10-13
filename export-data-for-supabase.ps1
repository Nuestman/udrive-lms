# Export data from local PostgreSQL to Supabase-compatible SQL file
# This script generates INSERT statements instead of COPY statements

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Exporting Data for Supabase Migration" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Database connection details
$DB_USER = "postgres"
$DB_NAME = "udrive-from-bolt"
$DB_HOST = "localhost"
$DB_PORT = "5432"

# Output file
$OUTPUT_FILE = "data_inserts.sql"

Write-Host "Database: $DB_NAME" -ForegroundColor Yellow
Write-Host "Output File: $OUTPUT_FILE" -ForegroundColor Yellow
Write-Host ""

# Prompt for password securely
$SecurePassword = Read-Host "Enter PostgreSQL password for user '$DB_USER'" -AsSecureString
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($SecurePassword)
$PlainPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

Write-Host ""
Write-Host "Exporting data..." -ForegroundColor Green

# Set PGPASSWORD environment variable temporarily
$env:PGPASSWORD = $PlainPassword

try {
    # Run pg_dump with INSERT statements
    # --column-inserts: Use INSERT with column names (most compatible)
    # --data-only: Only export data, no schema
    # --no-owner: Don't set ownership
    # --no-privileges: Don't dump privileges
    
    pg_dump -U $DB_USER `
            -h $DB_HOST `
            -p $DB_PORT `
            -d $DB_NAME `
            --data-only `
            --column-inserts `
            --no-owner `
            --no-privileges `
            -f $OUTPUT_FILE

    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "================================================" -ForegroundColor Green
        Write-Host "  ✅ Export Successful!" -ForegroundColor Green
        Write-Host "================================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "Output file: $OUTPUT_FILE" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Next Steps:" -ForegroundColor Cyan
        Write-Host "1. Open Supabase SQL Editor" -ForegroundColor White
        Write-Host "2. Make sure your schema exists in Supabase first" -ForegroundColor White
        Write-Host "3. Copy and paste the contents of $OUTPUT_FILE" -ForegroundColor White
        Write-Host "4. Run the SQL to import all data" -ForegroundColor White
        Write-Host ""
        
        # Show file size
        $fileSize = (Get-Item $OUTPUT_FILE).Length
        $fileSizeKB = [math]::Round($fileSize / 1KB, 2)
        Write-Host "File size: $fileSizeKB KB" -ForegroundColor Gray
        
    } else {
        Write-Host ""
        Write-Host "❌ Export failed with error code: $LASTEXITCODE" -ForegroundColor Red
    }
} catch {
    Write-Host ""
    Write-Host "❌ Error: $_" -ForegroundColor Red
} finally {
    # Clear password from environment
    $env:PGPASSWORD = $null
    # Clear password from memory
    [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($BSTR)
}

Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

