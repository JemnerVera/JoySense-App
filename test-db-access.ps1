# Script de demostración - Prueba de acceso via API REST
# Ejecutar: .\test-db-access.ps1

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  PRUEBA DE ACCESO AL SCHEMA JOYSENSE  " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:3001/api/joysense"

# Test 1: SELECT pais
Write-Host "----------------------------------------" -ForegroundColor Gray
Write-Host ""
Write-Host "[Test 1] SELECT en joysense.pais" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/pais" -Method GET -ErrorAction Stop
    Write-Host "   OK: $($response.Count) registros" -ForegroundColor Green
} catch {
    $errorContent = $_.ErrorDetails.Message | ConvertFrom-Json
    Write-Host "   ERROR: $($errorContent.error)" -ForegroundColor Red
}
Write-Host ""

# Test 2: SELECT usuario
Write-Host "[Test 2] SELECT en joysense.usuario" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/usuario" -Method GET -ErrorAction Stop
    Write-Host "   OK: $($response.Count) registros" -ForegroundColor Green
} catch {
    $errorContent = $_.ErrorDetails.Message | ConvertFrom-Json
    Write-Host "   ERROR: $($errorContent.error)" -ForegroundColor Red
}
Write-Host ""

# Test 3: SELECT empresa
Write-Host "[Test 3] SELECT en joysense.empresa" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/empresa" -Method GET -ErrorAction Stop
    Write-Host "   OK: $($response.Count) registros" -ForegroundColor Green
} catch {
    $errorContent = $_.ErrorDetails.Message | ConvertFrom-Json
    Write-Host "   ERROR: $($errorContent.error)" -ForegroundColor Red
}
Write-Host ""

# Test 4: INSERT usuario
Write-Host "----------------------------------------" -ForegroundColor Gray
Write-Host ""
Write-Host "[Test 4] INSERT en joysense.usuario" -ForegroundColor Yellow
$body = @{
    login = "test.demo@example.com"
    password = "TestDemo123"
    firstname = "Test"
    lastname = "Demo"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method POST -Body $body -ContentType "application/json" -ErrorAction Stop
    Write-Host "   OK: Usuario creado" -ForegroundColor Green
} catch {
    $errorMsg = $_.ErrorDetails.Message
    if ($errorMsg) {
        $errorContent = $errorMsg | ConvertFrom-Json
        Write-Host "   ERROR: $($errorContent.error)" -ForegroundColor Red
    } else {
        Write-Host "   ERROR: $($_.Exception.Message)" -ForegroundColor Red
    }
}
Write-Host ""

# Test 5: Diagnostico completo
Write-Host "----------------------------------------" -ForegroundColor Gray
Write-Host ""
Write-Host "[Test 5] Diagnostico completo" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/test-db" -Method GET -ErrorAction Stop
    Write-Host "   Schema: $($response.schema)" -ForegroundColor Cyan
    foreach ($key in $response.tests.PSObject.Properties.Name) {
        $test = $response.tests.$key
        if ($test.error) {
            Write-Host "   - $key : ERROR - $($test.error)" -ForegroundColor Red
        } else {
            Write-Host "   - $key : OK" -ForegroundColor Green
        }
    }
} catch {
    Write-Host "   ERROR al ejecutar diagnostico" -ForegroundColor Red
}

Write-Host ""
Write-Host "----------------------------------------" -ForegroundColor Gray
Write-Host ""
Write-Host "RESUMEN:" -ForegroundColor Cyan
Write-Host "Si todos fallan con 'permission denied for schema joysense'" -ForegroundColor White
Write-Host "el DBA debe ejecutar estos comandos SQL:" -ForegroundColor White
Write-Host ""
Write-Host "  GRANT USAGE ON SCHEMA joysense TO service_role;" -ForegroundColor Green
Write-Host "  GRANT ALL ON ALL TABLES IN SCHEMA joysense TO service_role;" -ForegroundColor Green
Write-Host "  GRANT ALL ON ALL SEQUENCES IN SCHEMA joysense TO service_role;" -ForegroundColor Green
Write-Host ""
