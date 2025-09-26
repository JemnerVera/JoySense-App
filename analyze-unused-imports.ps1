# Script para detectar imports no utilizados en el proyecto
# Ayuda a identificar código muerto y optimizar el bundle

Write-Host "🔍 Analizando imports no utilizados..." -ForegroundColor Green

$srcDir = "frontend/src"
$unusedImports = @()
$totalFiles = 0
$filesWithUnusedImports = 0

# Obtener todos los archivos TypeScript y JavaScript
$files = Get-ChildItem -Path $srcDir -Recurse -Include "*.ts", "*.tsx", "*.js", "*.jsx"

Write-Host "📁 Analizando $($files.Count) archivos..." -ForegroundColor Yellow

foreach ($file in $files) {
    $totalFiles++
    $content = Get-Content $file.FullName -Raw
    $lines = Get-Content $file.FullName
    
    # Buscar imports
    $importLines = $lines | Where-Object { $_ -match '^\s*import\s+' }
    
    foreach ($importLine in $importLines) {
        # Extraer el nombre del import
        if ($importLine -match 'import\s+\{([^}]+)\}') {
            # Named imports: import { Component1, Component2 } from 'module'
            $imports = $matches[1] -split ',' | ForEach-Object { $_.Trim() }
            foreach ($import in $imports) {
                if ($import -notmatch '^\s*$') {
                    $importName = $import.Trim()
                    # Verificar si se usa en el archivo (excluyendo la línea del import)
                    $usageCount = ($content -replace $importLine, '') | Select-String -Pattern "\b$importName\b" | Measure-Object | Select-Object -ExpandProperty Count
                    if ($usageCount -eq 0) {
                        $unusedImports += [PSCustomObject]@{
                            File = $file.Name
                            Path = $file.FullName
                            Import = $importName
                            Line = $importLine
                        }
                    }
                }
            }
        }
        elseif ($importLine -match 'import\s+(\w+)\s+from') {
            # Default import: import Component from 'module'
            $importName = $matches[1]
            $usageCount = ($content -replace $importLine, '') | Select-String -Pattern "\b$importName\b" | Measure-Object | Select-Object -ExpandProperty Count
            if ($usageCount -eq 0) {
                $unusedImports += [PSCustomObject]@{
                    File = $file.Name
                    Path = $file.FullName
                    Import = $importName
                    Line = $importLine
                }
            }
        }
    }
    
    # Contar archivos con imports no utilizados
    $fileUnusedImports = $unusedImports | Where-Object { $_.File -eq $file.Name }
    if ($fileUnusedImports.Count -gt 0) {
        $filesWithUnusedImports++
    }
}

Write-Host "`n📊 RESULTADOS DEL ANÁLISIS:" -ForegroundColor Cyan
Write-Host "Archivos analizados: $totalFiles" -ForegroundColor White
Write-Host "Archivos con imports no utilizados: $filesWithUnusedImports" -ForegroundColor Yellow
Write-Host "Total de imports no utilizados: $($unusedImports.Count)" -ForegroundColor Red

if ($unusedImports.Count -gt 0) {
    Write-Host "`n🚨 IMPORTS NO UTILIZADOS DETECTADOS:" -ForegroundColor Red
    
    # Agrupar por archivo
    $groupedByFile = $unusedImports | Group-Object File | Sort-Object Count -Descending
    
    foreach ($group in $groupedByFile) {
        Write-Host "`n📄 $($group.Name) ($($group.Count) imports no utilizados):" -ForegroundColor Yellow
        foreach ($item in $group.Group) {
            Write-Host "  ❌ $($item.Import)" -ForegroundColor Red
        }
    }
    
    Write-Host "`n💡 RECOMENDACIONES:" -ForegroundColor Green
    Write-Host "1. Revisar cada import no utilizado manualmente" -ForegroundColor White
    Write-Host "2. Eliminar imports que realmente no se usan" -ForegroundColor White
    Write-Host "3. Verificar si son imports necesarios para tipos TypeScript" -ForegroundColor White
    Write-Host "4. Considerar usar eslint-plugin-unused-imports para automatización" -ForegroundColor White
} else {
    Write-Host "`n✅ ¡Excelente! No se encontraron imports no utilizados." -ForegroundColor Green
}

Write-Host "`n📋 Archivo de reporte generado: unused-imports-report.txt" -ForegroundColor Cyan

# Generar reporte detallado
$report = @"
# Reporte de Imports No Utilizados
Fecha: $(Get-Date)
Total archivos analizados: $totalFiles
Archivos con imports no utilizados: $filesWithUnusedImports
Total imports no utilizados: $($unusedImports.Count)

## Detalles por archivo:
"@

foreach ($group in $groupedByFile) {
    $report += "`n### $($group.Name) ($($group.Count) imports no utilizados)`n"
    foreach ($item in $group.Group) {
        $report += "- $($item.Import)`n"
    }
}

$report | Out-File -FilePath "unused-imports-report.txt" -Encoding UTF8
