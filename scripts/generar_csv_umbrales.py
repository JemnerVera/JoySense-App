#!/usr/bin/env python3
"""
Script para generar CSV de umbrales listo para insertar en Supabase
"""
import csv
import os
from datetime import datetime

# Configuración
CSV_INPUT = 'Supabase Snippet Active Sensor Inventory with Location Hierarchy.xlsx - Matriz.csv'
CSV_OUTPUT = 'sql/umbrales_para_insertar.csv'
USER_ID = 3

def generate_csv():
    """Genera el CSV con los campos necesarios para INSERT en Supabase"""
    
    # Leer el CSV de entrada
    with open(CSV_INPUT, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        rows = list(reader)
    
    print(f"Procesando {len(rows)} filas del CSV...")
    
    # Generar el CSV de salida
    with open(CSV_OUTPUT, 'w', encoding='utf-8', newline='') as f:
        # Campos según el schema de sense.umbral
        # Nota: umbralid es auto-generado, no se incluye
        fieldnames = [
            'ubicacionid',
            'criticidadid',
            'nodoid',
            'metricaid',
            'umbral',
            'maximo',
            'minimo',
            'statusid',
            'usercreatedid',
            'datecreated',
            'usermodifiedid',
            'datemodified',
            'tipoid'
        ]
        
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        
        # Fecha actual para datecreated y datemodified
        now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        
        for row in rows:
            # Escapar comillas simples en el campo umbral si las hay
            umbral_value = row['umbral'].replace("'", "''") if row['umbral'] else ''
            
            writer.writerow({
                'ubicacionid': row['ubicacionid'],
                'criticidadid': row['criticidadid'],
                'nodoid': row['nodoid'],
                'metricaid': row['metricaid'],
                'umbral': umbral_value,
                'maximo': row['maximo'],
                'minimo': row['minimo'],
                'statusid': '1',  # Default activo
                'usercreatedid': str(USER_ID),
                'datecreated': now,
                'usermodifiedid': str(USER_ID),
                'datemodified': now,
                'tipoid': row['tipoid']
            })
    
    print(f"CSV generado exitosamente: {CSV_OUTPUT}")
    print(f"   Total de registros: {len(rows)}")

if __name__ == '__main__':
    # Crear directorio sql si no existe
    os.makedirs('sql', exist_ok=True)
    
    generate_csv()

