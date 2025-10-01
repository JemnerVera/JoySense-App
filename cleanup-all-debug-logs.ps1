# Script para limpiar console.log de debugging en múltiples archivos
# SOLO elimina logs que son claramente de debugging innecesario

Write-Host "Iniciando limpieza selectiva de console.log de debugging en múltiples archivos..."

# Lista de archivos a limpiar
$filesToClean = @(
    "frontend/src/components/AdvancedMetricaSensorUpdateForm.tsx",
    "frontend/src/components/Dashboard/ModernDashboard.tsx",
    "frontend/src/services/optimizedDataService.ts"
)

foreach ($filePath in $filesToClean) {
    if (Test-Path $filePath) {
        Write-Host "Limpiando: $filePath"
        $content = Get-Content $filePath -Raw
        
        # 1. Eliminar console.log con emojis de debugging
        $cleanedContent = $content -replace "^\s*console\.log\([^)]*🔍[^)]*\);\s*$", ""
        $cleanedContent = $cleanedContent -replace "^\s*console\.log\([^)]*🔄[^)]*\);\s*$", ""
        
        # 2. Eliminar console.log que contienen "Debug" o "debug"
        $cleanedContent = $cleanedContent -replace "^\s*console\.log\([^)]*[Dd]ebug[^)]*\);\s*$", ""
        
        # 3. Eliminar comentarios de debug temporal
        $cleanedContent = $cleanedContent -replace "^\s*// .*[Dd]ebug.*$", ""
        $cleanedContent = $cleanedContent -replace "^\s*// .*[Tt]emporal.*$", ""
        
        # 4. Eliminar líneas vacías múltiples
        $cleanedContent = $cleanedContent -replace "(\r?\n\s*){3,}", "`r`n`r`n"
        
        # Escribir el contenido limpio
        Set-Content -Path $filePath -Value $cleanedContent -NoNewline
        Write-Host "  ✅ Completado"
    } else {
        Write-Host "  ❌ Archivo no encontrado: $filePath"
    }
}

Write-Host "`n✅ Limpieza selectiva completada en todos los archivos:"
Write-Host "   - Eliminados console.log con emojis de debugging (🔍, 🔄)"
Write-Host "   - Eliminados console.log con texto 'Debug'"
Write-Host "   - Eliminados comentarios de debug temporal"
Write-Host "   - Preservados console.log funcionales importantes"
