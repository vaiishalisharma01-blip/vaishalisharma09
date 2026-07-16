# Push schema to Turso, then seed data.
# Usage (PowerShell):
#   .\scripts\push-turso.ps1 -Url "libsql://...." -Token "eyJ..."

param(
  [Parameter(Mandatory = $true)][string]$Url,
  [Parameter(Mandatory = $true)][string]$Token
)

$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..")

if ($Url -notmatch "^libsql://") {
  Write-Error "URL must start with libsql:// (got: $Url)"
}

$schemaFile = Join-Path (Get-Location) "prisma\turso-schema.sql"
if (-not (Test-Path $schemaFile)) {
  Write-Error "Missing prisma/turso-schema.sql — run: git pull origin main"
}

# Prisma CLI must use local file URL only
$env:DATABASE_URL = "file:./prisma/dev.db"
$env:TURSO_DATABASE_URL = $Url
$env:TURSO_AUTH_TOKEN = $Token

# libsql://NAME.region.turso.io  →  NAME
$dbName = ($Url -replace "^libsql://", "").Split(".")[0]
Write-Host "Applying schema to Turso database: $dbName"
Get-Content $schemaFile | turso db shell $dbName
if ($LASTEXITCODE -ne 0) {
  Write-Error "turso db shell failed. Run: turso auth login   then   turso db list"
}

Write-Host "Seeding sample data..."
npx tsx prisma/seed.ts

Write-Host ""
Write-Host "Done. Add TURSO_DATABASE_URL + TURSO_AUTH_TOKEN on Vercel, then Redeploy."
