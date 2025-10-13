# Export database in format compatible with Supabase SQL Editor
# This uses INSERT statements instead of COPY commands

Write-Host "Exporting database for Supabase SQL Editor..." -ForegroundColor Cyan

$LOCAL_DB = "udrive-from-bolt"
$LOCAL_USER = "postgres"
$LOCAL_PASS = "453241945"
$OUTPUT_FILE = "supabase_import_$(Get-Date -Format 'yyyyMMdd_HHmmss').sql"

# Set password for pg_dump
$env:PGPASSWORD = $LOCAL_PASS

Write-Host "`nExporting with INSERT statements (SQL Editor compatible)..." -ForegroundColor Yellow

# Export with column-inserts (no COPY commands)
pg_dump -U $LOCAL_USER -d $LOCAL_DB `
    --clean `
    --if-exists `
    --column-inserts `
    --no-owner `
    --no-privileges `
    -f $OUTPUT_FILE

# Clean up
Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue

if ($LASTEXITCODE -eq 0 -and (Test-Path $OUTPUT_FILE)) {
    $fileSize = (Get-Item $OUTPUT_FILE).Length / 1KB
    Write-Host "`n✅ Export complete!" -ForegroundColor Green
    Write-Host "   File: $OUTPUT_FILE" -ForegroundColor White
    Write-Host "   Size: $([math]::Round($fileSize, 2)) KB" -ForegroundColor White
    Write-Host "`n📝 This file is compatible with Supabase SQL Editor!" -ForegroundColor Green
    Write-Host "`nNext steps:" -ForegroundColor Cyan
    Write-Host "1. Open: https://supabase.com/dashboard/project/zrwrdfkntrfqarbidtou/sql" -ForegroundColor White
    Write-Host "2. Click 'New Query'" -ForegroundColor White
    Write-Host "3. Open $OUTPUT_FILE in Notepad" -ForegroundColor White
    Write-Host "4. Copy ALL contents and paste into SQL Editor" -ForegroundColor White
    Write-Host "5. Click 'Run' (F5)" -ForegroundColor White
    Write-Host "`n⚠️  Note: If file is very large (>5MB), you may need to split it." -ForegroundColor Yellow
} else {
    Write-Host "`n❌ Export failed!" -ForegroundColor Red
    Write-Host "Make sure PostgreSQL is running and database exists." -ForegroundColor Yellow
}

