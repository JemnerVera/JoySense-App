# Script para optimizar dependencias del bundle
Write-Host "🚀 OPTIMIZACIÓN DE DEPENDENCIAS" -ForegroundColor Cyan
Write-Host "===============================" -ForegroundColor Cyan

# 1. Mover dependencias de testing a devDependencies
Write-Host "`n📦 MOVIENDO DEPENDENCIAS DE TESTING A DEV:" -ForegroundColor Yellow

$packageJsonPath = "frontend/package.json"
$packageJson = Get-Content $packageJsonPath | ConvertFrom-Json

# Dependencias de testing que deben moverse a devDependencies
$testingDeps = @(
    "@testing-library/dom",
    "@testing-library/jest-dom", 
    "@testing-library/react",
    "@testing-library/user-event",
    "@types/jest"
)

$movedDeps = @()
foreach ($dep in $testingDeps) {
    if ($packageJson.dependencies.$dep) {
        $version = $packageJson.dependencies.$dep
        # Mover a devDependencies
        $packageJson.devDependencies | Add-Member -MemberType NoteProperty -Name $dep -Value $version -Force
        # Remover de dependencies
        $packageJson.dependencies.PSObject.Properties.Remove($dep)
        $movedDeps += $dep
        Write-Host "  ✅ Movido $dep a devDependencies" -ForegroundColor Green
    }
}

# 2. Verificar web-vitals
if ($packageJson.dependencies."web-vitals") {
    Write-Host "`n⚠️  web-vitals encontrado en dependencies" -ForegroundColor Yellow
    Write-Host "  Considerar mover a devDependencies si solo se usa en reportWebVitals.ts" -ForegroundColor White
}

# 3. Guardar package.json modificado
if ($movedDeps.Count -gt 0) {
    $packageJson | ConvertTo-Json -Depth 10 | Set-Content $packageJsonPath
    Write-Host "`n💾 package.json actualizado" -ForegroundColor Green
    Write-Host "Dependencias movidas: $($movedDeps.Count)" -ForegroundColor White
} else {
    Write-Host "`n✅ No se encontraron dependencias de testing en dependencies" -ForegroundColor Green
}

# 4. Recomendaciones adicionales
Write-Host "`n💡 RECOMENDACIONES ADICIONALES:" -ForegroundColor Yellow
Write-Host "1. Verificar si web-vitals se puede mover a devDependencies" -ForegroundColor White
Write-Host "2. Considerar usar import() dinámico para chart.js y recharts" -ForegroundColor White
Write-Host "3. Implementar tree-shaking para librerías grandes" -ForegroundColor White
Write-Host "4. Usar webpack-bundle-analyzer para análisis detallado" -ForegroundColor White

Write-Host "`n✅ Optimización completada!" -ForegroundColor Green
