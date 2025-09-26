# Script para limpiar imports no utilizados
Write-Host "Limpiando imports no utilizados..." -ForegroundColor Green

$srcDir = "frontend/src"
$filesProcessed = 0
$importsRemoved = 0

$files = Get-ChildItem -Path $srcDir -Recurse -Include "*.ts", "*.tsx", "*.js", "*.jsx"

Write-Host "Procesando $($files.Count) archivos..." -ForegroundColor Yellow

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    $lines = Get-Content $file.FullName
    $newLines = @()
    $removedFromFile = 0
    
    foreach ($line in $lines) {
        $shouldKeepLine = $true
        
        # Verificar si es una línea de import
        if ($line -match '^\s*import\s+') {
            # Verificar si es un import no utilizado
            if ($line -match 'import\s+\{([^}]+)\}') {
                # Named imports
                $imports = $matches[1] -split ',' | ForEach-Object { $_.Trim() }
                $usedImports = @()
                
                foreach ($import in $imports) {
                    if ($import -notmatch '^\s*$') {
                        $importName = $import.Trim()
                        # Verificar si se usa en el archivo (excluyendo esta línea)
                        $usageCount = ($content -replace $line, '') | Select-String -Pattern "\b$importName\b" | Measure-Object | Select-Object -ExpandProperty Count
                        if ($usageCount -gt 0) {
                            $usedImports += $importName
                        } else {
                            $removedFromFile++
                        }
                    }
                }
                
                # Si no hay imports utilizados, eliminar toda la línea
                if ($usedImports.Count -eq 0) {
                    $shouldKeepLine = $false
                } else {
                    # Reconstruir la línea con solo los imports utilizados
                    $newLine = $line -replace '\{[^}]+\}', "{ $($usedImports -join ', ') }"
                    $newLines += $newLine
                    $shouldKeepLine = $false
                }
            }
            elseif ($line -match 'import\s+(\w+)\s+from') {
                # Default import
                $importName = $matches[1]
                $usageCount = ($content -replace $line, '') | Select-String -Pattern "\b$importName\b" | Measure-Object | Select-Object -ExpandProperty Count
                if ($usageCount -eq 0) {
                    $shouldKeepLine = $false
                    $removedFromFile++
                }
            }
        }
        
        if ($shouldKeepLine) {
            $newLines += $line
        }
    }
    
    # Solo escribir si hubo cambios
    if ($newLines.Count -ne $lines.Count) {
        Set-Content -Path $file.FullName -Value $newLines
        $filesProcessed++
        $importsRemoved += $removedFromFile
        Write-Host "✅ $($file.Name): $removedFromFile imports eliminados" -ForegroundColor Green
    }
}

Write-Host "`nLimpieza completada!" -ForegroundColor Green
Write-Host "Archivos procesados: $filesProcessed" -ForegroundColor Cyan
Write-Host "Imports eliminados: $importsRemoved" -ForegroundColor Cyan
Write-Host "`nSolo se eliminaron imports que realmente no se utilizan." -ForegroundColor Yellow
