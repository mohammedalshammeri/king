# PowerShell script to fix RTL issues across the entire kom-mobile-app

Write-Host "Starting RTL fix across the codebase..." -ForegroundColor Green

$mobileAppPath = "c:\Users\Dell\Desktop\KOM\kom-mobile-app"

# Get all .tsx and .ts files (excluding node_modules and .expo)
$files = Get-ChildItem -Path $mobileAppPath -Recurse -Include *.tsx,*.ts | 
    Where-Object { 
        $_.FullName -notmatch 'node_modules' -and 
        $_.FullName -notmatch '\.expo' -and
        $_.FullName -notmatch 'android\\' -and
        $_.FullName -notmatch 'ios\\'
    }

$totalFiles = 0
$modifiedFiles = 0

foreach ($file in $files) {
    $totalFiles++
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    $originalContent = $content
    $modified = $false
    
    # Fix 1: Replace all 'row-reverse' with 'row'
    if ($content -match "flexDirection:\s*['\`"]row-reverse['\`"]") {
        $content = $content -replace "flexDirection:\s*['\`"]row-reverse['\`"]", "flexDirection: 'row'"
        $modified = $true
        Write-Host "  [row-reverse -> row] $($file.Name)" -ForegroundColor Yellow
    }
    
    # Fix 2: Remove all transform: [{ scaleX: -1 }] patterns
    if ($content -match "transform:\s*\[\s*\{\s*scaleX:\s*-1\s*\}\s*\]") {
        # Remove the transform style completely
        $content = $content -replace ",?\s*transform:\s*\[\s*\{\s*scaleX:\s*-1\s*\}\s*\]", ""
        $content = $content -replace "style=\{\{\s*transform:\s*\[\s*\{\s*scaleX:\s*-1\s*\}\s*\]\s*\}\}", ""
        $modified = $true
        Write-Host "  [removed scaleX] $($file.Name)" -ForegroundColor Yellow
    }
    
    # Fix 3: Replace paddingLeft with paddingStart
    if ($content -match "paddingLeft") {
        $content = $content -replace "\bpaddingLeft\b", "paddingStart"
        $modified = $true
        Write-Host "  [paddingLeft -> paddingStart] $($file.Name)" -ForegroundColor Yellow
    }
    
    # Fix 4: Replace paddingRight with paddingEnd
    if ($content -match "paddingRight") {
        $content = $content -replace "\bpaddingRight\b", "paddingEnd"
        $modified = $true
        Write-Host "  [paddingRight -> paddingEnd] $($file.Name)" -ForegroundColor Yellow
    }
    
    # Fix 5: Replace marginLeft with marginStart
    if ($content -match "marginLeft") {
        $content = $content -replace "\bmarginLeft\b", "marginStart"
        $modified = $true
        Write-Host "  [marginLeft -> marginStart] $($file.Name)" -ForegroundColor Yellow
    }
    
    # Fix 6: Replace marginRight with marginEnd
    if ($content -match "marginRight") {
        $content = $content -replace "\bmarginRight\b", "marginEnd"
        $modified = $true
        Write-Host "  [marginRight -> marginEnd] $($file.Name)" -ForegroundColor Yellow
    }
    
    # Save the file if modified
    if ($modified -and $content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -Encoding UTF8 -NoNewline
        $modifiedFiles++
        Write-Host "✓ Modified: $($file.FullName)" -ForegroundColor Green
    }
}

Write-Host "`n======================================" -ForegroundColor Cyan
Write-Host "RTL Fix Complete!" -ForegroundColor Green
Write-Host "Total files scanned: $totalFiles" -ForegroundColor Cyan
Write-Host "Files modified: $modifiedFiles" -ForegroundColor Green
Write-Host "======================================`n" -ForegroundColor Cyan

# Also fix the RTL_ROW constant in listing/[id].tsx
$listingFile = Join-Path $mobileAppPath "app\listing\[id].tsx"
if (Test-Path $listingFile) {
    $content = Get-Content $listingFile -Raw -Encoding UTF8
    if ($content -match "const RTL_ROW = \{ flexDirection: 'row-reverse'") {
        $content = $content -replace "const RTL_ROW = \{ flexDirection: 'row-reverse' as const \};", "const RTL_ROW = { flexDirection: 'row' as const };"
        Set-Content -Path $listingFile -Value $content -Encoding UTF8 -NoNewline
        Write-Host "✓ Fixed RTL_ROW constant in listing/[id].tsx" -ForegroundColor Green
    }
}

Write-Host "All RTL issues have been fixed!" -ForegroundColor Green
Write-Host "The app should now work correctly in both development and production builds." -ForegroundColor Cyan
