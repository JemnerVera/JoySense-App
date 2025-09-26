# Script SEGURO para eliminar console.log de debug
# Solo elimina console.log completos y bien formateados
# NO toca console.error, console.warn, ni código funcional

Write-Host "🧹 Iniciando limpieza SEGURA de console.log..." -ForegroundColor Green

# Directorio a limpiar
$srcDir = "frontend/src"

# Contador de archivos procesados
$filesProcessed = 0
$logsRemoved = 0

# Obtener todos los archivos TypeScript y JavaScript
$files = Get-ChildItem -Path $srcDir -Recurse -Include "*.ts", "*.tsx", "*.js", "*.jsx"

Write-Host "📁 Encontrados $($files.Count) archivos para procesar..." -ForegroundColor Yellow

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    
    # Contar console.log antes de eliminar
    $beforeCount = ([regex]::Matches($content, 'console\.log')).Count
    
    # Eliminar console.log completos (con indentación)
    # Patrón seguro: console.log(...); en líneas separadas
    $content = $content -replace '^\s*console\.log\([^)]*\);\s*$', ''
    
    # Eliminar console.log con comentarios de debug específicos
    $content = $content -replace '^\s*console\.log\([^)]*Debug[^)]*\);\s*$', ''
    $content = $content -replace '^\s*console\.log\([^)]*debug[^)]*\);\s*$', ''
    $content = $content -replace '^\s*console\.log\([^)]*DEBUG[^)]*\);\s*$', ''
    $content = $content -replace '^\s*console\.log\([^)]*llamado[^)]*\);\s*$', ''
    $content = $content -replace '^\s*console\.log\([^)]*Cargando[^)]*\);\s*$', ''
    $content = $content -replace '^\s*console\.log\([^)]*Llamando[^)]*\);\s*$', ''
    $content = $content -replace '^\s*console\.log\([^)]*Respuesta[^)]*\);\s*$', ''
    $content = $content -replace '^\s*console\.log\([^)]*obtenidas[^)]*\);\s*$', ''
    $content = $content -replace '^\s*console\.log\([^)]*obtenidos[^)]*\);\s*$', ''
    $content = $content -replace '^\s*console\.log\([^)]*procesados[^)]*\);\s*$', ''
    
    # Eliminar líneas vacías múltiples (más de 2 seguidas)
    $content = $content -replace '(\r?\n\s*){3,}', "`r`n`r`n"
    
    # Contar console.log después de eliminar
    $afterCount = ([regex]::Matches($content, 'console\.log')).Count
    $removedFromFile = $beforeCount - $afterCount
    $logsRemoved += $removedFromFile
    
    # Solo escribir si hubo cambios
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        $filesProcessed++
        Write-Host "✅ $($file.Name): $removedFromFile console.log eliminados" -ForegroundColor Green
    }
}

Write-Host "`n🎉 Limpieza SEGURA completada!" -ForegroundColor Green
Write-Host "📊 Archivos procesados: $filesProcessed" -ForegroundColor Cyan
Write-Host "🗑️ Console.log eliminados: $logsRemoved" -ForegroundColor Cyan
Write-Host "`nSolo se eliminaron console.log completos y bien formateados." -ForegroundColor Yellow
Write-Host "Console.error, console.warn y codigo funcional se mantuvieron intactos." -ForegroundColor Green
