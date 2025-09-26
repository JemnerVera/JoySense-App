# Script para analizar bundle size y dependencias
Write-Host "🔍 ANÁLISIS DE BUNDLE SIZE Y DEPENDENCIAS" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# 1. Analizar package.json
Write-Host "`n📦 DEPENDENCIAS PRINCIPALES:" -ForegroundColor Yellow
$packageJson = Get-Content "frontend/package.json" | ConvertFrom-Json

Write-Host "Dependencias de producción:" -ForegroundColor Green
$packageJson.dependencies.PSObject.Properties | ForEach-Object {
    $name = $_.Name
    $version = $_.Value
    Write-Host "  - $name: $version" -ForegroundColor White
}

Write-Host "`nDependencias de desarrollo:" -ForegroundColor Green
$packageJson.devDependencies.PSObject.Properties | ForEach-Object {
    $name = $_.Name
    $version = $_.Value
    Write-Host "  - $name: $version" -ForegroundColor White
}

# 2. Analizar node_modules size
Write-Host "`n📊 TAMAÑO DE NODE_MODULES:" -ForegroundColor Yellow
if (Test-Path "frontend/node_modules") {
    $nodeModulesSize = (Get-ChildItem "frontend/node_modules" -Recurse | Measure-Object -Property Length -Sum).Sum
    $nodeModulesSizeMB = [math]::Round($nodeModulesSize / 1MB, 2)
    Write-Host "Tamaño total: $nodeModulesSizeMB MB" -ForegroundColor White
} else {
    Write-Host "node_modules no encontrado" -ForegroundColor Red
}

# 3. Analizar build directory si existe
Write-Host "`n🏗️ TAMAÑO DE BUILD:" -ForegroundColor Yellow
if (Test-Path "frontend/build") {
    $buildSize = (Get-ChildItem "frontend/build" -Recurse | Measure-Object -Property Length -Sum).Sum
    $buildSizeMB = [math]::Round($buildSize / 1MB, 2)
    Write-Host "Tamaño total: $buildSizeMB MB" -ForegroundColor White
    
    # Analizar archivos más grandes en build
    Write-Host "`nArchivos más grandes en build:" -ForegroundColor Green
    Get-ChildItem "frontend/build" -Recurse -File | 
        Sort-Object Length -Descending | 
        Select-Object -First 10 | 
        ForEach-Object {
            $sizeKB = [math]::Round($_.Length / 1KB, 2)
            Write-Host "  - $($_.Name): $sizeKB KB" -ForegroundColor White
        }
} else {
    Write-Host "build directory no encontrado - ejecuta 'npm run build' primero" -ForegroundColor Red
}

# 4. Identificar dependencias potencialmente no utilizadas
Write-Host "`n🔍 ANÁLISIS DE DEPENDENCIAS POTENCIALMENTE NO UTILIZADAS:" -ForegroundColor Yellow

# Dependencias que podrían no estar siendo usadas
$potentiallyUnused = @(
    "@testing-library/dom",
    "@testing-library/jest-dom", 
    "@testing-library/react",
    "@testing-library/user-event",
    "@types/jest",
    "web-vitals"
)

Write-Host "Dependencias que podrían no estar siendo utilizadas:" -ForegroundColor Green
foreach ($dep in $potentiallyUnused) {
    if ($packageJson.dependencies.$dep -or $packageJson.devDependencies.$dep) {
        Write-Host "  - $dep" -ForegroundColor Yellow
    }
}

# 5. Recomendaciones
Write-Host "`n💡 RECOMENDACIONES DE OPTIMIZACIÓN:" -ForegroundColor Yellow
Write-Host "1. Mover dependencias de testing a devDependencies" -ForegroundColor White
Write-Host "2. Verificar uso de @types/jest y web-vitals" -ForegroundColor White
Write-Host "3. Considerar tree-shaking para librerías grandes" -ForegroundColor White
Write-Host "4. Implementar code splitting por rutas" -ForegroundColor White
Write-Host "5. Optimizar imágenes y assets" -ForegroundColor White

Write-Host "`n✅ Análisis completado!" -ForegroundColor Green
