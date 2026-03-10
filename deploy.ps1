# KOM Fly.io Deployment Script
# Run this script AFTER installing flyctl and logging in:
#   iwr https://fly.io/install.ps1 -useb | iex
#   fly auth login

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("all", "backend", "landing", "admin")]
    [string]$target = "all"
)

$ErrorActionPreference = "Stop"

$ROOT = "c:\Users\Dell\Desktop\KOM"
$BACKEND_DIR = "$ROOT\kom-backend\kom-backend"
$LANDING_DIR = "$ROOT\kom-landing"
$ADMIN_DIR = "$ROOT\kom-admin-dashboard"

function Deploy-Backend {
    Write-Host "`n=== Deploying Backend (kom-api) ===" -ForegroundColor Cyan

    Set-Location $BACKEND_DIR

    # Create the app if it doesn't exist
    $appExists = fly apps list 2>$null | Select-String "kom-api"
    if (-not $appExists) {
        Write-Host "Creating fly app: kom-api"
        fly apps create kom-api
    }

    # Prompt to set secrets
    Write-Host "`nYou need to set the following secrets for kom-api." -ForegroundColor Yellow
    Write-Host "Run these commands with your actual values:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "fly secrets set --app kom-api \"
    Write-Host "  DATABASE_URL=`"<your-neon-db-url>`" \"
    Write-Host "  JWT_ACCESS_SECRET=`"<strong-random-secret>`" \"
    Write-Host "  JWT_REFRESH_SECRET=`"<strong-random-secret>`" \"
    Write-Host "  SUPER_ADMIN_EMAIL=`"info@kotm.app`" \"
    Write-Host "  SUPER_ADMIN_PASSWORD=`"<secure-password>`" \"
    Write-Host "  S3_ENDPOINT=`"<s3-endpoint>`" \"
    Write-Host "  S3_REGION=`"<region>`" \"
    Write-Host "  S3_BUCKET=`"<bucket-name>`" \"
    Write-Host "  S3_ACCESS_KEY=`"<access-key>`" \"
    Write-Host "  S3_SECRET_KEY=`"<secret-key>`" \"
    Write-Host "  PUBLIC_CDN_BASE_URL=`"<cdn-url>`" \"
    Write-Host "  CLOUDINARY_CLOUD_NAME=`"<cloud-name>`" \"
    Write-Host "  CLOUDINARY_API_KEY=`"<api-key>`" \"
    Write-Host "  CLOUDINARY_API_SECRET=`"<api-secret>`""
    Write-Host ""

    $confirm = Read-Host "Have you set all secrets? Press Y to deploy or N to skip"
    if ($confirm -ne "Y" -and $confirm -ne "y") {
        Write-Host "Skipping backend deploy. Set secrets and re-run." -ForegroundColor Yellow
        return
    }

    fly deploy --app kom-api --local-only
    Write-Host "Backend deployed: https://api.kotm.app" -ForegroundColor Green
}

function Deploy-Landing {
    Write-Host "`n=== Deploying Landing Page (kom-landing) ===" -ForegroundColor Cyan

    Set-Location $LANDING_DIR

    $appExists = fly apps list 2>$null | Select-String "kom-landing"
    if (-not $appExists) {
        Write-Host "Creating fly app: kom-landing"
        fly apps create kom-landing
    }

    fly deploy --app kom-landing --local-only
    Write-Host "Landing page deployed: https://kotm.app" -ForegroundColor Green
}

function Deploy-Admin {
    Write-Host "`n=== Deploying Admin Dashboard (kom-admin) ===" -ForegroundColor Cyan

    Set-Location $ADMIN_DIR

    $appExists = fly apps list 2>$null | Select-String "kom-admin"
    if (-not $appExists) {
        Write-Host "Creating fly app: kom-admin"
        fly apps create kom-admin
    }

    fly deploy --app kom-admin --local-only
    Write-Host "Admin dashboard deployed: https://admin.kotm.app" -ForegroundColor Green
}

# Ensure flyctl is installed
if (-not (Get-Command fly -ErrorAction SilentlyContinue)) {
    Write-Host "flyctl is not installed. Installing now..." -ForegroundColor Yellow
    iwr https://fly.io/install.ps1 -useb | iex
    Write-Host "Please restart your terminal and log in with: fly auth login" -ForegroundColor Cyan
    exit 1
}

# Deploy based on target
switch ($target) {
    "backend" { Deploy-Backend }
    "landing"  { Deploy-Landing }
    "admin"    { Deploy-Admin }
    "all" {
        Deploy-Backend
        Deploy-Landing
        Deploy-Admin
        Write-Host "`n=== All deployments complete ===" -ForegroundColor Green
        Write-Host "Backend:   https://api.kotm.app"
        Write-Host "Landing:   https://kotm.app"
        Write-Host "Admin:     https://admin.kotm.app"
    }
}
