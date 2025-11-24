#!/usr/bin/env python3
"""
Script para generar INSERT statements de umbrales desde CSV
"""
import csv
import os

# Configuración
CSV_FILE = 'Supabase Snippet Active Sensor Inventory with Location Hierarchy.xlsx - Matriz.csv'
OUTPUT_FILE = 'sql/insert_umbrales_desde_csv.sql'
USER_ID = 3

def escape_sql_string(value):
    """Escapa comillas simples en strings SQL"""
    if value is None:
        return 'NULL'
    return "'" + str(value).replace("'", "''") + "'"

def generate_insert_statements():
    """Genera los INSERT statements desde el CSV"""
    
    # Leer el CSV
    with open(CSV_FILE, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        rows = list(reader)
    
    print(f"Procesando {len(rows)} filas del CSV...")
    
    # Generar el SQL
    sql_lines = []
    sql_lines.append("-- ============================================================================")
    sql_lines.append("-- Script de inserción de umbrales desde CSV")
    sql_lines.append(f"-- Generado desde: {CSV_FILE}")
    sql_lines.append("-- Fecha: 2025-11-22")
    sql_lines.append("-- ============================================================================")
    sql_lines.append("-- ")
    sql_lines.append("-- Este script inserta umbrales en la tabla sense.umbral")
    sql_lines.append("-- Campos requeridos según schema:")
    sql_lines.append("--   - ubicacionid (del CSV)")
    sql_lines.append("--   - criticidadid (del CSV)")
    sql_lines.append("--   - nodoid (del CSV)")
    sql_lines.append("--   - metricaid (del CSV)")
    sql_lines.append("--   - umbral (del CSV)")
    sql_lines.append("--   - maximo (del CSV)")
    sql_lines.append("--   - minimo (del CSV)")
    sql_lines.append("--   - statusid (default 1)")
    sql_lines.append(f"--   - usercreatedid ({USER_ID})")
    sql_lines.append("--   - datecreated (NOW())")
    sql_lines.append(f"--   - usermodifiedid ({USER_ID})")
    sql_lines.append("--   - datemodified (NOW())")
    sql_lines.append("--   - tipoid (del CSV)")
    sql_lines.append("-- ============================================================================")
    sql_lines.append("")
    sql_lines.append("-- Limpiar umbrales existentes si es necesario (descomentar si se requiere)")
    sql_lines.append(f"-- DELETE FROM sense.umbral WHERE usercreatedid = {USER_ID};")
    sql_lines.append("")
    sql_lines.append("-- Insertar umbrales")
    sql_lines.append("INSERT INTO sense.umbral (")
    sql_lines.append("    ubicacionid,")
    sql_lines.append("    criticidadid,")
    sql_lines.append("    nodoid,")
    sql_lines.append("    metricaid,")
    sql_lines.append("    umbral,")
    sql_lines.append("    maximo,")
    sql_lines.append("    minimo,")
    sql_lines.append("    statusid,")
    sql_lines.append("    usercreatedid,")
    sql_lines.append("    datecreated,")
    sql_lines.append("    usermodifiedid,")
    sql_lines.append("    datemodified,")
    sql_lines.append("    tipoid")
    sql_lines.append(")")
    sql_lines.append("VALUES")
    
    # Generar los VALUES
    value_lines = []
    for i, row in enumerate(rows):
        ubicacionid = row['ubicacionid'].strip()
        criticidadid = row['criticidadid'].strip()
        nodoid = row['nodoid'].strip()
        metricaid = row['metricaid'].strip()
        umbral = escape_sql_string(row['umbral'].strip())
        maximo = row['maximo'].strip()
        minimo = row['minimo'].strip()
        tipoid = row['tipoid'].strip()
        
        # Validar que los valores numéricos sean válidos
        try:
            float(maximo)
            float(minimo)
            int(ubicacionid)
            int(criticidadid)
            int(nodoid)
            int(metricaid)
            int(tipoid)
        except ValueError as e:
            print(f"Error en fila {i+2}: {e}")
            continue
        
        # Construir la línea VALUES
        value_line = f"    ({ubicacionid}, {criticidadid}, {nodoid}, {metricaid}, {umbral}, {maximo}, {minimo}, 1, {USER_ID}, NOW(), {USER_ID}, NOW(), {tipoid})"
        
        # Agregar coma si no es el último
        if i < len(rows) - 1:
            value_line += ","
        
        value_lines.append(value_line)
    
    sql_lines.extend(value_lines)
    sql_lines.append(";")
    sql_lines.append("")
    sql_lines.append("-- Verificar inserción")
    sql_lines.append(f"SELECT COUNT(*) as total_insertados FROM sense.umbral WHERE usercreatedid = {USER_ID};")
    
    # Escribir el archivo
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        f.write('\n'.join(sql_lines))
    
    print(f"✓ Script SQL generado: {OUTPUT_FILE}")
    print(f"✓ Total de registros a insertar: {len(rows)}")

if __name__ == '__main__':
    generate_insert_statements()

