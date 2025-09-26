# Script simple para detectar imports no utilizados
Write-Host "Analizando imports no utilizados..." -ForegroundColor Green

$srcDir = "frontend/src"
$unusedImports = @()
$totalFiles = 0

$files = Get-ChildItem -Path $srcDir -Recurse -Include "*.ts", "*.tsx", "*.js", "*.jsx"

Write-Host "Analizando $($files.Count) archivos..." -ForegroundColor Yellow

foreach ($file in $files) {
    $totalFiles++
    $content = Get-Content $file.FullName -Raw
    $lines = Get-Content $file.FullName
    
    # Buscar imports
    $importLines = $lines | Where-Object { $_ -match '^\s*import\s+' }
    
    foreach ($importLine in $importLines) {
        # Extraer el nombre del import
        if ($importLine -match 'import\s+\{([^}]+)\}') {
            # Named imports
            $imports = $matches[1] -split ',' | ForEach-Object { $_.Trim() }
            foreach ($import in $imports) {
                if ($import -notmatch '^\s*$') {
                    $importName = $import.Trim()
                    # Verificar si se usa en el archivo
                    $usageCount = ($content -replace $importLine, '') | Select-String -Pattern "\b$importName\b" | Measure-Object | Select-Object -ExpandProperty Count
                    if ($usageCount -eq 0) {
                        $unusedImports += [PSCustomObject]@{
                            File = $file.Name
                            Import = $importName
                            Line = $importLine.Trim()
                        }
                    }
                }
            }
        }
        elseif ($importLine -match 'import\s+(\w+)\s+from') {
            # Default import
            $importName = $matches[1]
            $usageCount = ($content -replace $importLine, '') | Select-String -Pattern "\b$importName\b" | Measure-Object | Select-Object -ExpandProperty Count
            if ($usageCount -eq 0) {
                $unusedImports += [PSCustomObject]@{
                    File = $file.Name
                    Import = $importName
                    Line = $importLine.Trim()
                }
            }
        }
    }
}

Write-Host "`nRESULTADOS:" -ForegroundColor Cyan
Write-Host "Archivos analizados: $totalFiles" -ForegroundColor White
Write-Host "Total imports no utilizados: $($unusedImports.Count)" -ForegroundColor Red

if ($unusedImports.Count -gt 0) {
    Write-Host "`nIMPORTS NO UTILIZADOS:" -ForegroundColor Red
    
    # Agrupar por archivo
    $groupedByFile = $unusedImports | Group-Object File | Sort-Object Count -Descending
    
    foreach ($group in $groupedByFile) {
        Write-Host "`n$($group.Name) ($($group.Count) imports no utilizados):" -ForegroundColor Yellow
        foreach ($item in $group.Group) {
            Write-Host "  - $($item.Import)" -ForegroundColor Red
        }
    }
} else {
    Write-Host "`nExcelente! No se encontraron imports no utilizados." -ForegroundColor Green
}
