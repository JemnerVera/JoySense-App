const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Configuración de Supabase - Service Role Key (SOLO BACKEND)
const supabaseUrl = 'https://fagswxnjkcavchfrnrhs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhZ3N3eG5qa2NhdmNoZnJucmhzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzE1NDMyNywiZXhwIjoyMDYyNzMwMzI3fQ.ioeluR-iTWJ7-w_7UAuMl_aPXHJM6nlhv6Nh4hohBjw';

// Crear cliente de Supabase con Service Role Key
console.log('🔧 Configurando cliente Supabase...');
const supabase = createClient(supabaseUrl, supabaseKey, {
  db: {
    schema: 'sense'
  }
});

// Metadatos hardcodeados basados en la documentación del schema
const tableMetadata = {
  pais: {
    columns: [
      { column_name: 'paisid', data_type: 'integer', is_nullable: 'NO', column_default: 'nextval(\'sense.pais_paisid_seq\'::regclass)' },
      { column_name: 'pais', data_type: 'character varying', is_nullable: 'NO', column_default: null },
      { column_name: 'paisabrev', data_type: 'character varying', is_nullable: 'YES', column_default: null },
      { column_name: 'statusid', data_type: 'integer', is_nullable: 'NO', column_default: '1' },
      { column_name: 'usercreatedid', data_type: 'integer', is_nullable: 'YES', column_default: null },
      { column_name: 'datecreated', data_type: 'timestamp with time zone', is_nullable: 'YES', column_default: null },
      { column_name: 'usermodifiedid', data_type: 'integer', is_nullable: 'YES', column_default: null },
      { column_name: 'datemodified', data_type: 'timestamp with time zone', is_nullable: 'YES', column_default: null }
    ],
    info: { table_name: 'pais', table_type: 'BASE TABLE' },
    constraints: [
      { constraint_name: 'pais_pkey', constraint_type: 'PRIMARY KEY' }
    ]
  },
  empresa: {
    columns: [
      { column_name: 'empresaid', data_type: 'integer', is_nullable: 'NO', column_default: 'nextval(\'sense.empresa_empresaid_seq\'::regclass)' },
      { column_name: 'empresa', data_type: 'character varying', is_nullable: 'NO', column_default: null },
      { column_name: 'empresabrev', data_type: 'character varying', is_nullable: 'YES', column_default: null },
      { column_name: 'paisid', data_type: 'integer', is_nullable: 'NO', column_default: null },
      { column_name: 'statusid', data_type: 'integer', is_nullable: 'NO', column_default: '1' },
      { column_name: 'usercreatedid', data_type: 'integer', is_nullable: 'YES', column_default: null },
      { column_name: 'datecreated', data_type: 'timestamp with time zone', is_nullable: 'YES', column_default: null },
      { column_name: 'usermodifiedid', data_type: 'integer', is_nullable: 'YES', column_default: null },
      { column_name: 'datemodified', data_type: 'timestamp with time zone', is_nullable: 'YES', column_default: null }
    ],
    info: { table_name: 'empresa', table_type: 'BASE TABLE' },
    constraints: [
      { constraint_name: 'empresa_pkey', constraint_type: 'PRIMARY KEY' },
      { constraint_name: 'empresa_paisid_fkey', constraint_type: 'FOREIGN KEY' }
    ]
  },
  fundo: {
    columns: [
      { column_name: 'fundoid', data_type: 'integer', is_nullable: 'NO', column_default: 'nextval(\'sense.fundo_fundoid_seq\'::regclass)' },
      { column_name: 'fundo', data_type: 'character varying', is_nullable: 'NO', column_default: null },
      { column_name: 'farmabrev', data_type: 'character varying', is_nullable: 'YES', column_default: null },
      { column_name: 'empresaid', data_type: 'integer', is_nullable: 'NO', column_default: null },
      { column_name: 'statusid', data_type: 'integer', is_nullable: 'NO', column_default: '1' },
      { column_name: 'usercreatedid', data_type: 'integer', is_nullable: 'YES', column_default: null },
      { column_name: 'datecreated', data_type: 'timestamp with time zone', is_nullable: 'YES', column_default: null },
      { column_name: 'usermodifiedid', data_type: 'integer', is_nullable: 'YES', column_default: null },
      { column_name: 'datemodified', data_type: 'timestamp with time zone', is_nullable: 'YES', column_default: null }
    ],
    info: { table_name: 'fundo', table_type: 'BASE TABLE' },
    constraints: [
      { constraint_name: 'fundo_pkey', constraint_type: 'PRIMARY KEY' },
      { constraint_name: 'fundo_empresaid_fkey', constraint_type: 'FOREIGN KEY' }
    ]
  },
  ubicacion: {
    columns: [
      { column_name: 'ubicacionid', data_type: 'integer', is_nullable: 'NO', column_default: 'nextval(\'sense.ubicacion_ubicacionid_seq\'::regclass)' },
      { column_name: 'ubicacion', data_type: 'character varying', is_nullable: 'NO', column_default: null },
      { column_name: 'ubicacionabrev', data_type: 'character varying', is_nullable: 'YES', column_default: null },
      { column_name: 'fundoid', data_type: 'integer', is_nullable: 'NO', column_default: null },
      { column_name: 'statusid', data_type: 'integer', is_nullable: 'NO', column_default: '1' },
      { column_name: 'usercreatedid', data_type: 'integer', is_nullable: 'YES', column_default: null },
      { column_name: 'datecreated', data_type: 'timestamp with time zone', is_nullable: 'YES', column_default: null },
      { column_name: 'usermodifiedid', data_type: 'integer', is_nullable: 'YES', column_default: null },
      { column_name: 'datemodified', data_type: 'timestamp with time zone', is_nullable: 'YES', column_default: null }
    ],
    info: { table_name: 'ubicacion', table_type: 'BASE TABLE' },
    constraints: [
      { constraint_name: 'ubicacion_pkey', constraint_type: 'PRIMARY KEY' },
      { constraint_name: 'ubicacion_fundoid_fkey', constraint_type: 'FOREIGN KEY' }
    ]
  },
  entidad: {
    columns: [
      { column_name: 'entidadid', data_type: 'integer', is_nullable: 'NO', column_default: 'nextval(\'sense.entidad_entidadid_seq\'::regclass)' },
      { column_name: 'entidad', data_type: 'character varying', is_nullable: 'NO', column_default: null },
      { column_name: 'statusid', data_type: 'integer', is_nullable: 'NO', column_default: '1' },
      { column_name: 'usercreatedid', data_type: 'integer', is_nullable: 'YES', column_default: null },
      { column_name: 'datecreated', data_type: 'timestamp with time zone', is_nullable: 'YES', column_default: null },
      { column_name: 'usermodifiedid', data_type: 'integer', is_nullable: 'YES', column_default: null },
      { column_name: 'datemodified', data_type: 'timestamp with time zone', is_nullable: 'YES', column_default: null }
    ],
    info: { table_name: 'entidad', table_type: 'BASE TABLE' },
    constraints: [
      { constraint_name: 'entidad_pkey', constraint_type: 'PRIMARY KEY' }
    ]
  },
  metrica: {
    columns: [
      { column_name: 'metricaid', data_type: 'integer', is_nullable: 'NO', column_default: 'nextval(\'sense.metrica_metricaid_seq\'::regclass)' },
      { column_name: 'metrica', data_type: 'character varying', is_nullable: 'NO', column_default: null },
      { column_name: 'unidad', data_type: 'character varying', is_nullable: 'YES', column_default: null },
      { column_name: 'statusid', data_type: 'integer', is_nullable: 'NO', column_default: '1' },
      { column_name: 'usercreatedid', data_type: 'integer', is_nullable: 'YES', column_default: null },
      { column_name: 'datecreated', data_type: 'timestamp with time zone', is_nullable: 'YES', column_default: null },
      { column_name: 'usermodifiedid', data_type: 'integer', is_nullable: 'YES', column_default: null },
      { column_name: 'datemodified', data_type: 'timestamp with time zone', is_nullable: 'YES', column_default: null }
    ],
    info: { table_name: 'metrica', table_type: 'BASE TABLE' },
    constraints: [
      { constraint_name: 'metrica_pkey', constraint_type: 'PRIMARY KEY' }
    ]
  },
  tipo: {
    columns: [
      { column_name: 'tipoid', data_type: 'integer', is_nullable: 'NO', column_default: 'nextval(\'sense.tipo_tipoid_seq\'::regclass)' },
      { column_name: 'tipo', data_type: 'character varying', is_nullable: 'NO', column_default: null },
      { column_name: 'entidadid', data_type: 'integer', is_nullable: 'NO', column_default: null },
      { column_name: 'statusid', data_type: 'integer', is_nullable: 'NO', column_default: '1' },
      { column_name: 'usercreatedid', data_type: 'integer', is_nullable: 'YES', column_default: null },
      { column_name: 'datecreated', data_type: 'timestamp with time zone', is_nullable: 'YES', column_default: null },
      { column_name: 'usermodifiedid', data_type: 'integer', is_nullable: 'YES', column_default: null },
      { column_name: 'datemodified', data_type: 'timestamp with time zone', is_nullable: 'YES', column_default: null }
    ],
    info: { table_name: 'tipo', table_type: 'BASE TABLE' },
    constraints: [
      { constraint_name: 'tipo_pkey', constraint_type: 'PRIMARY KEY' },
      { constraint_name: 'tipo_entidadid_fkey', constraint_type: 'FOREIGN KEY' }
    ]
  },
  nodo: {
    columns: [
      { column_name: 'nodoid', data_type: 'integer', is_nullable: 'NO', column_default: 'nextval(\'sense.nodo_nodoid_seq\'::regclass)' },
      { column_name: 'nodo', data_type: 'character varying', is_nullable: 'NO', column_default: null },
      { column_name: 'deveui', data_type: 'character varying', is_nullable: 'YES', column_default: null },
      { column_name: 'appeui', data_type: 'character varying', is_nullable: 'YES', column_default: null },
      { column_name: 'appkey', data_type: 'character varying', is_nullable: 'YES', column_default: null },
      { column_name: 'atpin', data_type: 'character varying', is_nullable: 'YES', column_default: null },
      { column_name: 'statusid', data_type: 'integer', is_nullable: 'NO', column_default: '1' },
      { column_name: 'usercreatedid', data_type: 'integer', is_nullable: 'YES', column_default: null },
      { column_name: 'datecreated', data_type: 'timestamp with time zone', is_nullable: 'YES', column_default: null },
      { column_name: 'usermodifiedid', data_type: 'integer', is_nullable: 'YES', column_default: null },
      { column_name: 'datemodified', data_type: 'timestamp with time zone', is_nullable: 'YES', column_default: null }
    ],
    info: { table_name: 'nodo', table_type: 'BASE TABLE' },
    constraints: [
      { constraint_name: 'nodo_pkey', constraint_type: 'PRIMARY KEY' }
    ]
  },
  sensor: {
    columns: [
      { column_name: 'nodoid', data_type: 'integer', is_nullable: 'NO', column_default: null },
      { column_name: 'tipoid', data_type: 'integer', is_nullable: 'NO', column_default: null },
      { column_name: 'statusid', data_type: 'integer', is_nullable: 'NO', column_default: '1' },
      { column_name: 'usercreatedid', data_type: 'integer', is_nullable: 'YES', column_default: null },
      { column_name: 'datecreated', data_type: 'timestamp with time zone', is_nullable: 'YES', column_default: null },
      { column_name: 'usermodifiedid', data_type: 'integer', is_nullable: 'YES', column_default: null },
      { column_name: 'datemodified', data_type: 'timestamp with time zone', is_nullable: 'YES', column_default: null }
    ],
    info: { table_name: 'sensor', table_type: 'BASE TABLE' },
    constraints: [
      { constraint_name: 'sensor_pkey', constraint_type: 'PRIMARY KEY' },
      { constraint_name: 'sensor_nodoid_fkey', constraint_type: 'FOREIGN KEY' },
      { constraint_name: 'sensor_tipoid_fkey', constraint_type: 'FOREIGN KEY' }
    ]
  },
  metricasensor: {
    columns: [
      { column_name: 'nodoid', data_type: 'integer', is_nullable: 'NO', column_default: null },
      { column_name: 'metricaid', data_type: 'integer', is_nullable: 'NO', column_default: null },
      { column_name: 'tipoid', data_type: 'integer', is_nullable: 'NO', column_default: null },
      { column_name: 'statusid', data_type: 'integer', is_nullable: 'NO', column_default: '1' },
      { column_name: 'usercreatedid', data_type: 'integer', is_nullable: 'YES', column_default: null },
      { column_name: 'datecreated', data_type: 'timestamp with time zone', is_nullable: 'YES', column_default: null },
      { column_name: 'usermodifiedid', data_type: 'integer', is_nullable: 'YES', column_default: null },
      { column_name: 'datemodified', data_type: 'timestamp with time zone', is_nullable: 'YES', column_default: null }
    ],
    info: { table_name: 'metricasensor', table_type: 'BASE TABLE' },
    constraints: [
      { constraint_name: 'metricasensor_pkey', constraint_type: 'PRIMARY KEY' },
      { constraint_name: 'metricasensor_nodoid_fkey', constraint_type: 'FOREIGN KEY' },
      { constraint_name: 'metricasensor_metricaid_fkey', constraint_type: 'FOREIGN KEY' },
      { constraint_name: 'metricasensor_tipoid_fkey', constraint_type: 'FOREIGN KEY' }
    ]
  },
  criticidad: {
    columns: [
      { column_name: 'criticidadid', data_type: 'integer', is_nullable: 'NO', column_default: null },
      { column_name: 'criticidad', data_type: 'character varying', is_nullable: 'NO', column_default: null },
      { column_name: 'criticidadbrev', data_type: 'character varying', is_nullable: 'YES', column_default: null },
      { column_name: 'statusid', data_type: 'integer', is_nullable: 'NO', column_default: '1' },
      { column_name: 'usercreatedid', data_type: 'integer', is_nullable: 'YES', column_default: null },
      { column_name: 'datecreated', data_type: 'timestamp with time zone', is_nullable: 'YES', column_default: null },
      { column_name: 'usermodifiedid', data_type: 'integer', is_nullable: 'YES', column_default: null },
      { column_name: 'datemodified', data_type: 'timestamp with time zone', is_nullable: 'YES', column_default: null }
    ],
    info: { table_name: 'criticidad', table_type: 'BASE TABLE' },
    constraints: [
      { constraint_name: 'criticidad_pkey', constraint_type: 'PRIMARY KEY' }
    ]
  },
  perfil: {
    columns: [
      { column_name: 'perfilid', data_type: 'integer', is_nullable: 'NO', column_default: null },
      { column_name: 'perfil', data_type: 'character varying', is_nullable: 'NO', column_default: null },
      { column_name: 'nivel', data_type: 'character varying', is_nullable: 'YES', column_default: null },
      { column_name: 'statusid', data_type: 'integer', is_nullable: 'NO', column_default: '1' },
      { column_name: 'usercreatedid', data_type: 'integer', is_nullable: 'YES', column_default: null },
      { column_name: 'datecreated', data_type: 'timestamp with time zone', is_nullable: 'YES', column_default: null },
      { column_name: 'usermodifiedid', data_type: 'integer', is_nullable: 'YES', column_default: null },
      { column_name: 'datemodified', data_type: 'timestamp with time zone', is_nullable: 'YES', column_default: null }
    ],
    info: { table_name: 'perfil', table_type: 'BASE TABLE' },
    constraints: [
      { constraint_name: 'perfil_pkey', constraint_type: 'PRIMARY KEY' }
    ]
  },
  umbral: {
    columns: [
      { column_name: 'umbralid', data_type: 'bigint', is_nullable: 'NO', column_default: 'nextval(\'sense.umbral_umbralid_seq\'::regclass)' },
      { column_name: 'umbral', data_type: 'character varying', is_nullable: 'NO', column_default: null },
      { column_name: 'maximo', data_type: 'double precision', is_nullable: 'YES', column_default: null },
      { column_name: 'minimo', data_type: 'double precision', is_nullable: 'YES', column_default: null },
      { column_name: 'ubicacionid', data_type: 'integer', is_nullable: 'NO', column_default: null },
      { column_name: 'criticidadid', data_type: 'integer', is_nullable: 'NO', column_default: null },
      { column_name: 'nodoid', data_type: 'integer', is_nullable: 'NO', column_default: null },
      { column_name: 'metricaid', data_type: 'integer', is_nullable: 'NO', column_default: null },
      { column_name: 'tipoid', data_type: 'integer', is_nullable: 'NO', column_default: null },
      { column_name: 'statusid', data_type: 'integer', is_nullable: 'NO', column_default: '1' }
    ],
    info: { table_name: 'umbral', table_type: 'BASE TABLE' },
    constraints: [
      { constraint_name: 'umbral_pkey', constraint_type: 'PRIMARY KEY' },
      { constraint_name: 'umbral_ubicacionid_fkey', constraint_type: 'FOREIGN KEY' },
      { constraint_name: 'umbral_criticidadid_fkey', constraint_type: 'FOREIGN KEY' },
      { constraint_name: 'umbral_nodoid_fkey', constraint_type: 'FOREIGN KEY' },
      { constraint_name: 'umbral_metricaid_fkey', constraint_type: 'FOREIGN KEY' },
      { constraint_name: 'umbral_tipoid_fkey', constraint_type: 'FOREIGN KEY' }
    ]
  },
  medio: {
    columns: [
      { column_name: 'medioid', data_type: 'integer', is_nullable: 'NO', column_default: null },
      { column_name: 'nombre', data_type: 'character varying', is_nullable: 'NO', column_default: null },
      { column_name: 'statusid', data_type: 'integer', is_nullable: 'NO', column_default: '1' },
      { column_name: 'usercreatedid', data_type: 'integer', is_nullable: 'YES', column_default: null },
      { column_name: 'datecreated', data_type: 'timestamp with time zone', is_nullable: 'YES', column_default: null },
      { column_name: 'usermodifiedid', data_type: 'integer', is_nullable: 'YES', column_default: null },
      { column_name: 'datemodified', data_type: 'timestamp with time zone', is_nullable: 'YES', column_default: null }
    ],
    info: { table_name: 'medio', table_type: 'BASE TABLE' },
    constraints: [
      { constraint_name: 'medio_pkey', constraint_type: 'PRIMARY KEY' }
    ]
  },
    localizacion: {
      columns: [
        { column_name: 'ubicacionid', data_type: 'integer', is_nullable: 'NO', column_default: null },
        { column_name: 'nodoid', data_type: 'integer', is_nullable: 'NO', column_default: null },
        { column_name: 'latitud', data_type: 'numeric', is_nullable: 'YES', column_default: null },
        { column_name: 'longitud', data_type: 'numeric', is_nullable: 'YES', column_default: null },
        { column_name: 'referencia', data_type: 'text', is_nullable: 'YES', column_default: null },
        { column_name: 'statusid', data_type: 'integer', is_nullable: 'NO', column_default: '1' },
        { column_name: 'usercreatedid', data_type: 'integer', is_nullable: 'YES', column_default: null },
        { column_name: 'datecreated', data_type: 'timestamp with time zone', is_nullable: 'YES', column_default: null },
        { column_name: 'usermodifiedid', data_type: 'integer', is_nullable: 'YES', column_default: null },
        { column_name: 'datemodified', data_type: 'timestamp with time zone', is_nullable: 'YES', column_default: null },
        { column_name: 'entidadid', data_type: 'integer', is_nullable: 'YES', column_default: null }
      ],
      info: { table_name: 'localizacion', table_type: 'BASE TABLE' },
      constraints: [
        { constraint_name: 'localizacion_pkey', constraint_type: 'PRIMARY KEY', composite_key: ['ubicacionid', 'nodoid'] },
        { constraint_name: 'localizacion_ubicacionid_fkey', constraint_type: 'FOREIGN KEY' },
        { constraint_name: 'localizacion_nodoid_fkey', constraint_type: 'FOREIGN KEY' },
        { constraint_name: 'localizacion_entidadid_fkey', constraint_type: 'FOREIGN KEY' }
      ]
    },
    perfilumbral: {
      columns: [
        { column_name: 'perfilid', data_type: 'integer', is_nullable: 'NO', column_default: null },
        { column_name: 'umbralid', data_type: 'integer', is_nullable: 'NO', column_default: null },
        { column_name: 'statusid', data_type: 'integer', is_nullable: 'NO', column_default: '1' },
        { column_name: 'usercreatedid', data_type: 'integer', is_nullable: 'YES', column_default: null },
        { column_name: 'datecreated', data_type: 'timestamp with time zone', is_nullable: 'YES', column_default: null },
        { column_name: 'usermodifiedid', data_type: 'integer', is_nullable: 'YES', column_default: null },
        { column_name: 'datemodified', data_type: 'timestamp with time zone', is_nullable: 'YES', column_default: null }
      ],
      info: { table_name: 'perfilumbral', table_type: 'BASE TABLE' },
      constraints: [
        { constraint_name: 'perfilumbral_pkey', constraint_type: 'PRIMARY KEY', composite_key: ['perfilid', 'umbralid'] },
        { constraint_name: 'perfilumbral_perfilid_fkey', constraint_type: 'FOREIGN KEY' },
        { constraint_name: 'perfilumbral_umbralid_fkey', constraint_type: 'FOREIGN KEY' }
      ]
    },
    contacto: {
      columns: [
        { column_name: 'contactoid', data_type: 'integer', is_nullable: 'NO', column_default: 'nextval(\'sense.contacto_contactoid_seq\'::regclass)' },
        { column_name: 'usuarioid', data_type: 'integer', is_nullable: 'NO', column_default: null },
        { column_name: 'medioid', data_type: 'integer', is_nullable: 'NO', column_default: null },
        { column_name: 'celular', data_type: 'text', is_nullable: 'YES', column_default: null },
        { column_name: 'correo', data_type: 'text', is_nullable: 'YES', column_default: null },
        { column_name: 'statusid', data_type: 'integer', is_nullable: 'NO', column_default: '1' },
        { column_name: 'usercreatedid', data_type: 'integer', is_nullable: 'YES', column_default: null },
        { column_name: 'datecreated', data_type: 'timestamp with time zone', is_nullable: 'YES', column_default: null },
        { column_name: 'usermodifiedid', data_type: 'integer', is_nullable: 'YES', column_default: null },
        { column_name: 'datemodified', data_type: 'timestamp with time zone', is_nullable: 'YES', column_default: null }
      ],
      info: { table_name: 'contacto', table_type: 'BASE TABLE' },
      constraints: [
        { constraint_name: 'contacto_pkey', constraint_type: 'PRIMARY KEY' },
        { constraint_name: 'contacto_usuarioid_fkey', constraint_type: 'FOREIGN KEY' },
        { constraint_name: 'contacto_medioid_fkey', constraint_type: 'FOREIGN KEY' }
      ]
    },
    usuario: {
      columns: [
        { column_name: 'usuarioid', data_type: 'integer', is_nullable: 'NO', column_default: 'nextval(\'sense.usuario_usuarioid_seq\'::regclass)' },
        { column_name: 'login', data_type: 'text', is_nullable: 'NO', column_default: null },
        { column_name: 'lastname', data_type: 'text', is_nullable: 'YES', column_default: null },
        { column_name: 'firstname', data_type: 'text', is_nullable: 'YES', column_default: null },
        { column_name: 'statusid', data_type: 'integer', is_nullable: 'NO', column_default: '1' },
        { column_name: 'usercreatedid', data_type: 'integer', is_nullable: 'YES', column_default: null },
        { column_name: 'datecreated', data_type: 'timestamp with time zone', is_nullable: 'YES', column_default: null },
        { column_name: 'usermodifiedid', data_type: 'integer', is_nullable: 'YES', column_default: null },
        { column_name: 'datemodified', data_type: 'timestamp with time zone', is_nullable: 'YES', column_default: null },
        { column_name: 'auth_user_id', data_type: 'uuid', is_nullable: 'YES', column_default: null }
      ],
      info: { table_name: 'usuario', table_type: 'BASE TABLE' },
      constraints: [
        { constraint_name: 'usuario_pkey', constraint_type: 'PRIMARY KEY' },
        { constraint_name: 'usuario_login_key', constraint_type: 'UNIQUE' }
      ]
    },
    usuarioperfil: {
      columns: [
        { column_name: 'usuarioid', data_type: 'integer', is_nullable: 'NO', column_default: null },
        { column_name: 'perfilid', data_type: 'integer', is_nullable: 'NO', column_default: null },
        { column_name: 'statusid', data_type: 'integer', is_nullable: 'NO', column_default: '1' },
        { column_name: 'usercreatedid', data_type: 'integer', is_nullable: 'YES', column_default: null },
        { column_name: 'datecreated', data_type: 'timestamp with time zone', is_nullable: 'YES', column_default: null },
        { column_name: 'usermodifiedid', data_type: 'integer', is_nullable: 'YES', column_default: null },
        { column_name: 'datemodified', data_type: 'timestamp with time zone', is_nullable: 'YES', column_default: null }
      ],
      info: { table_name: 'usuarioperfil', table_type: 'BASE TABLE' },
      constraints: [
        { constraint_name: 'usuarioperfil_pkey', constraint_type: 'PRIMARY KEY', composite_key: ['usuarioid', 'perfilid'] },
        { constraint_name: 'usuarioperfil_usuarioid_fkey', constraint_type: 'FOREIGN KEY' },
        { constraint_name: 'usuarioperfil_perfilid_fkey', constraint_type: 'FOREIGN KEY' }
      ]
    },
    audit_log_umbral: {
      columns: [
        { column_name: 'auditid', data_type: 'integer', is_nullable: 'NO', column_default: 'nextval(\'sense.audit_log_umbral_auditid_seq\'::regclass)' },
        { column_name: 'umbralid', data_type: 'integer', is_nullable: 'NO', column_default: null },
        { column_name: 'old_minimo', data_type: 'numeric', is_nullable: 'YES', column_default: null },
        { column_name: 'new_minimo', data_type: 'numeric', is_nullable: 'YES', column_default: null },
        { column_name: 'old_maximo', data_type: 'numeric', is_nullable: 'YES', column_default: null },
        { column_name: 'new_maximo', data_type: 'numeric', is_nullable: 'YES', column_default: null },
        { column_name: 'old_criticidadid', data_type: 'integer', is_nullable: 'YES', column_default: null },
        { column_name: 'new_criticidadid', data_type: 'integer', is_nullable: 'YES', column_default: null },
        { column_name: 'modified_by', data_type: 'integer', is_nullable: 'YES', column_default: null },
        { column_name: 'modified_at', data_type: 'timestamp with time zone', is_nullable: 'YES', column_default: null },
        { column_name: 'accion', data_type: 'text', is_nullable: 'YES', column_default: null }
      ],
      info: { table_name: 'audit_log_umbral', table_type: 'BASE TABLE' },
      constraints: [
        { constraint_name: 'audit_log_umbral_pkey', constraint_type: 'PRIMARY KEY' },
        { constraint_name: 'audit_log_umbral_umbralid_fkey', constraint_type: 'FOREIGN KEY' }
      ]
    },
    alerta: {
      columns: [
        { column_name: 'alertaid', data_type: 'integer', is_nullable: 'NO', column_default: 'nextval(\'sense.alerta_alertaid_seq\'::regclass)' },
        { column_name: 'umbralid', data_type: 'integer', is_nullable: 'NO', column_default: null },
        { column_name: 'medicionid', data_type: 'integer', is_nullable: 'NO', column_default: null },
        { column_name: 'fecha', data_type: 'timestamp with time zone', is_nullable: 'NO', column_default: null },
        { column_name: 'usercreatedid', data_type: 'integer', is_nullable: 'YES', column_default: null },
        { column_name: 'datecreated', data_type: 'timestamp with time zone', is_nullable: 'YES', column_default: null },
        { column_name: 'statusid', data_type: 'integer', is_nullable: 'NO', column_default: '1' }
      ],
      info: { table_name: 'alerta', table_type: 'BASE TABLE' },
      constraints: [
        { constraint_name: 'alerta_pkey', constraint_type: 'PRIMARY KEY' },
        { constraint_name: 'alerta_umbralid_fkey', constraint_type: 'FOREIGN KEY' },
        { constraint_name: 'alerta_medicionid_fkey', constraint_type: 'FOREIGN KEY' }
      ]
    }
};
console.log('✅ Cliente Supabase configurado');

// Middleware para verificar autenticación (opcional por ahora)
const verifyAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token de autorización requerido' });
  }

  const token = authHeader.substring(7);
    
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
        return res.status(401).json({ error: 'Token inválido' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Error verificando token:', error);
    return res.status(401).json({ error: 'Error verificando token' });
  }
};

// Rutas para tablas en singular - usadas por el frontend de parámetros
app.get('/api/sense/pais', async (req, res) => {
  try {
    const { limit = 100 } = req.query;
    console.log('🔍 Backend: Obteniendo pais del schema sense...');
    const { data, error } = await supabase
      .from('pais')
      .select('*')
      .order('paisid')
      .limit(parseInt(limit));
    if (error) { console.error('❌ Error backend:', error); return res.status(500).json({ error: error.message }); }
    console.log('✅ Backend: Pais obtenido:', data?.length || 0);
    res.json(data || []);
  } catch (error) { console.error('❌ Error in /api/sense/pais:', error); res.status(500).json({ error: error.message }); }
});

app.get('/api/sense/empresa', async (req, res) => {
  try {
    const { limit = 100 } = req.query;
    console.log('🔍 Backend: Obteniendo empresa del schema sense...');
    const { data, error } = await supabase
      .from('empresa')
      .select('*')
      .order('empresaid')
      .limit(parseInt(limit));
    if (error) { console.error('❌ Error backend:', error); return res.status(500).json({ error: error.message }); }
    console.log('✅ Backend: Empresa obtenida:', data?.length || 0);
    res.json(data || []);
  } catch (error) { console.error('❌ Error in /api/sense/empresa:', error); res.status(500).json({ error: error.message }); }
});

app.get('/api/sense/fundo', async (req, res) => {
  try {
    const { limit = 100 } = req.query;
    console.log('🔍 Backend: Obteniendo fundo del schema sense...');
    const { data, error } = await supabase
      .from('fundo')
      .select('*')
      .order('fundoid')
      .limit(parseInt(limit));
    if (error) { console.error('❌ Error backend:', error); return res.status(500).json({ error: error.message }); }
    console.log('✅ Backend: Fundo obtenido:', data?.length || 0);
    res.json(data || []);
  } catch (error) { console.error('❌ Error in /api/sense/fundo:', error); res.status(500).json({ error: error.message }); }
});

app.get('/api/sense/ubicacion', async (req, res) => {
  try {
    const { limit = 100 } = req.query;
    console.log('🔍 Backend: Obteniendo ubicacion del schema sense...');
    const { data, error } = await supabase
      .from('ubicacion')
      .select('*')
      .order('ubicacionid')
      .limit(parseInt(limit));
    if (error) { console.error('❌ Error backend:', error); return res.status(500).json({ error: error.message }); }
    console.log('✅ Backend: Ubicacion obtenida:', data?.length || 0);
    res.json(data || []);
  } catch (error) { console.error('❌ Error in /api/sense/ubicacion:', error); res.status(500).json({ error: error.message }); }
});

app.get('/api/sense/entidad', async (req, res) => {
  try {
    const { limit = 100 } = req.query;
    console.log('🔍 Backend: Obteniendo entidad del schema sense...');
    const { data, error } = await supabase
      .from('entidad')
      .select('*')
      .order('entidadid')
      .limit(parseInt(limit));
    if (error) { console.error('❌ Error backend:', error); return res.status(500).json({ error: error.message }); }
    console.log('✅ Backend: Entidad obtenida:', data?.length || 0);
    res.json(data || []);
  } catch (error) { console.error('❌ Error in /api/sense/entidad:', error); res.status(500).json({ error: error.message }); }
});

app.get('/api/sense/metrica', async (req, res) => {
  try {
    const { limit = 100 } = req.query;
    console.log('🔍 Backend: Obteniendo metrica del schema sense...');
    const { data, error } = await supabase
      .from('metrica')
      .select('*')
      .order('metricaid')
      .limit(parseInt(limit));
    if (error) { console.error('❌ Error backend:', error); return res.status(500).json({ error: error.message }); }
    console.log('✅ Backend: Metrica obtenida:', data?.length || 0);
    res.json(data || []);
  } catch (error) { console.error('❌ Error in /api/sense/metrica:', error); res.status(500).json({ error: error.message }); }
});

app.get('/api/sense/tipo', async (req, res) => {
  try {
    const { limit = 100 } = req.query;
    console.log('🔍 Backend: Obteniendo tipo del schema sense...');
    const { data, error } = await supabase
      .from('tipo')
      .select('*')
      .order('tipoid')
      .limit(parseInt(limit));
    if (error) { console.error('❌ Error backend:', error); return res.status(500).json({ error: error.message }); }
    console.log('✅ Backend: Tipo obtenido:', data?.length || 0);
    res.json(data || []);
  } catch (error) { console.error('❌ Error in /api/sense/tipo:', error); res.status(500).json({ error: error.message }); }
});

app.get('/api/sense/nodo', async (req, res) => {
  try {
    const { limit = 100 } = req.query;
    console.log('🔍 Backend: Obteniendo nodo del schema sense...');
    const { data, error } = await supabase
      .from('nodo')
      .select('*')
      .order('nodoid')
      .limit(parseInt(limit));
    if (error) { console.error('❌ Error backend:', error); return res.status(500).json({ error: error.message }); }
    console.log('✅ Backend: Nodo obtenido:', data?.length || 0);
    res.json(data || []);
  } catch (error) { console.error('❌ Error in /api/sense/nodo:', error); res.status(500).json({ error: error.message }); }
});

app.get('/api/sense/criticidad', async (req, res) => {
  try {
    const { limit = 100 } = req.query;
    console.log('🔍 Backend: Obteniendo criticidad del schema sense...');
    const { data, error } = await supabase
      .from('criticidad')
      .select('*')
      .order('criticidadid')
      .limit(parseInt(limit));
    if (error) { console.error('❌ Error backend:', error); return res.status(500).json({ error: error.message }); }
    console.log('✅ Backend: Criticidad obtenida:', data?.length || 0);
    res.json(data || []);
  } catch (error) { console.error('❌ Error in /api/sense/criticidad:', error); res.status(500).json({ error: error.message }); }
});

app.get('/api/sense/perfil', async (req, res) => {
  try {
    const { limit = 100 } = req.query;
    console.log('🔍 Backend: Obteniendo perfil del schema sense...');
    const { data, error } = await supabase
      .from('perfil')
      .select('*')
      .order('perfilid')
      .limit(parseInt(limit));
    if (error) { console.error('❌ Error backend:', error); return res.status(500).json({ error: error.message }); }
    console.log('✅ Backend: Perfil obtenido:', data?.length || 0);
    res.json(data || []);
  } catch (error) { console.error('❌ Error in /api/sense/perfil:', error); res.status(500).json({ error: error.message }); }
});

app.get('/api/sense/umbral', async (req, res) => {
  try {
    const { limit = 100 } = req.query;
    console.log('🔍 Backend: Obteniendo umbral del schema sense...');
    const { data, error } = await supabase
      .from('umbral')
      .select('*')
      .order('umbralid')
      .limit(parseInt(limit));
    if (error) { console.error('❌ Error backend:', error); return res.status(500).json({ error: error.message }); }
    console.log('✅ Backend: Umbral obtenido:', data?.length || 0);
    res.json(data || []);
  } catch (error) { console.error('❌ Error in /api/sense/umbral:', error); res.status(500).json({ error: error.message }); }
});

app.get('/api/sense/medio', async (req, res) => {
  try {
    const { limit = 100 } = req.query;
    console.log('🔍 Backend: Obteniendo medio del schema sense...');
    const { data, error } = await supabase
      .from('medio')
      .select('*')
      .order('medioid')
      .limit(parseInt(limit));
    if (error) { console.error('❌ Error backend:', error); return res.status(500).json({ error: error.message }); }
    console.log('✅ Backend: Medio obtenido:', data?.length || 0);
    res.json(data || []);
  } catch (error) { console.error('❌ Error in /api/sense/medio:', error); res.status(500).json({ error: error.message }); }
});

app.get('/api/sense/sensor', async (req, res) => {
  try {
    const { limit = 100 } = req.query;
    console.log('🔍 Backend: Obteniendo sensor del schema sense...');
    const { data, error } = await supabase
      .from('sensor')
      .select('*')
      .order('nodoid')
      .limit(parseInt(limit));
    if (error) { console.error('❌ Error backend:', error); return res.status(500).json({ error: error.message }); }
    console.log('✅ Backend: Sensor obtenido:', data?.length || 0);
    res.json(data || []);
  } catch (error) { console.error('❌ Error in /api/sense/sensor:', error); res.status(500).json({ error: error.message }); }
});

// Ruta para metricasensor - usada por el frontend
app.get('/api/sense/metricasensor', async (req, res) => {
  try {
    const { limit = 100 } = req.query;
    console.log('🔍 Backend: Obteniendo metricasensor del schema sense...');
    const { data, error } = await supabase
      .from('metricasensor')
      .select('*')
      .order('nodoid')
      .limit(parseInt(limit));
    if (error) { console.error('❌ Error backend:', error); return res.status(500).json({ error: error.message }); }
    console.log('✅ Backend: Metricasensor obtenidos:', data?.length || 0);
    res.json(data || []);
  } catch (error) { console.error('❌ Error in /api/sense/metricasensor:', error); res.status(500).json({ error: error.message }); }
});

// Ruta para perfilumbral - usada por el frontend
app.get('/api/sense/perfilumbral', async (req, res) => {
  try {
    const { limit = 100 } = req.query;
    console.log('🔍 Backend: Obteniendo perfilumbral del schema sense...');
    const { data, error } = await supabase
      .from('perfilumbral')
      .select('*')
      .order('perfilid, umbralid') // Ordenar por clave primaria compuesta
      .limit(parseInt(limit));
    if (error) { console.error('❌ Error backend:', error); return res.status(500).json({ error: error.message }); }
    console.log('✅ Backend: Perfilumbral obtenido:', data?.length || 0);
    res.json(data || []);
  } catch (error) { console.error('❌ Error in /api/sense/perfilumbral:', error); res.status(500).json({ error: error.message }); }
});

// Ruta para usuarioperfil - usada por el frontend
app.get('/api/sense/usuarioperfil', async (req, res) => {
  try {
    const { limit = 100 } = req.query;
    console.log('🔍 Backend: Obteniendo usuarioperfil del schema sense...');
    const { data, error } = await supabase
      .from('usuarioperfil')
      .select('*')
      .order('usuarioid, perfilid') // Ordenar por clave primaria compuesta
      .limit(parseInt(limit));
    if (error) { console.error('❌ Error backend:', error); return res.status(500).json({ error: error.message }); }
    console.log('✅ Backend: Usuarioperfil obtenido:', data?.length || 0);
    res.json(data || []);
  } catch (error) { console.error('❌ Error in /api/sense/usuarioperfil:', error); res.status(500).json({ error: error.message }); }
});

// Ruta para audit_log_umbral - usada por el frontend
app.get('/api/sense/audit_log_umbral', async (req, res) => {
  try {
    const { limit = 100 } = req.query;
    console.log('🔍 Backend: Obteniendo audit_log_umbral del schema sense...');
    const { data, error } = await supabase
      .from('audit_log_umbral')
      .select('*')
      .order('auditid')
      .limit(parseInt(limit));
    if (error) { console.error('❌ Error backend:', error); return res.status(500).json({ error: error.message }); }
    console.log('✅ Backend: Audit_log_umbral obtenido:', data?.length || 0);
    res.json(data || []);
  } catch (error) { console.error('❌ Error in /api/sense/audit_log_umbral:', error); res.status(500).json({ error: error.message }); }
});

// Ruta para contacto - usada por el frontend
app.get('/api/sense/contacto', async (req, res) => {
  try {
    const { limit = 100 } = req.query;
    console.log('🔍 Backend: Obteniendo contacto del schema sense...');
    const { data, error } = await supabase
      .from('contacto')
      .select('*')
      .order('contactoid')
      .limit(parseInt(limit));
    if (error) { console.error('❌ Error backend:', error); return res.status(500).json({ error: error.message }); }
    console.log('✅ Backend: Contacto obtenido:', data?.length || 0);
    res.json(data || []);
  } catch (error) { console.error('❌ Error in /api/sense/contacto:', error); res.status(500).json({ error: error.message }); }
});

// Ruta para localizacion - usada por el frontend
app.get('/api/sense/localizacion', async (req, res) => {
  try {
    const { limit = 100 } = req.query;
    console.log('🔍 Backend: Obteniendo localizacion del schema sense...');
    const { data, error } = await supabase
      .from('localizacion')
      .select('*')
      .order('ubicacionid, nodoid') // Ordenar por clave primaria compuesta
      .limit(parseInt(limit));
    if (error) { console.error('❌ Error backend:', error); return res.status(500).json({ error: error.message }); }
    console.log('✅ Backend: Localizacion obtenida:', data?.length || 0);
    res.json(data || []);
  } catch (error) { console.error('❌ Error in /api/sense/localizacion:', error); res.status(500).json({ error: error.message }); }
});

// Ruta para usuario - usada por el frontend
app.get('/api/sense/usuario', async (req, res) => {
  try {
    const { limit = 100 } = req.query;
    console.log('🔍 Obteniendo usuarios de sense.usuario...');
    const { data, error } = await supabase
      .from('usuario')
      .select('*')
      .order('usuarioid')
      .limit(parseInt(limit));
    if (error) { console.error('❌ Error backend:', error); return res.status(500).json({ error: error.message }); }
    console.log('✅ Usuarios encontrados:', data?.length || 0);
    res.json(data || []);
  } catch (error) { console.error('❌ Error in /api/sense/usuario:', error); res.status(500).json({ error: error.message }); }
});

// Rutas para obtener información de las tablas (usadas por el frontend de parámetros)
app.get('/api/sense/:tableName/columns', async (req, res) => {
  try {
    const { tableName } = req.params;
    console.log(`🔍 Backend: Obteniendo columnas de la tabla ${tableName}...`);
    
    // Usar metadatos hardcodeados
    const metadata = tableMetadata[tableName];
    if (!metadata) {
      console.error(`❌ Tabla ${tableName} no encontrada en metadatos`);
      return res.status(404).json({ error: `Tabla ${tableName} no encontrada` });
    }

    console.log(`✅ Backend: Columnas obtenidas para ${tableName}:`, metadata.columns.length);
    res.json(metadata.columns);
  } catch (error) {
    console.error(`❌ Error in /api/sense/${req.params.tableName}/columns:`, error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/sense/:tableName/info', async (req, res) => {
  try {
    const { tableName } = req.params;
    console.log(`🔍 Backend: Obteniendo información de la tabla ${tableName}...`);
    
    // Usar metadatos hardcodeados
    const metadata = tableMetadata[tableName];
    if (!metadata) {
      console.error(`❌ Tabla ${tableName} no encontrada en metadatos`);
      return res.status(404).json({ error: `Tabla ${tableName} no encontrada` });
    }

    console.log(`✅ Backend: Información obtenida para ${tableName}`);
    res.json(metadata.info);
  } catch (error) {
    console.error(`❌ Error in /api/sense/${req.params.tableName}/info:`, error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/sense/:tableName/constraints', async (req, res) => {
  try {
    const { tableName } = req.params;
    console.log(`🔍 Backend: Obteniendo constraints de la tabla ${tableName}...`);
    
    // Usar metadatos hardcodeados
    const metadata = tableMetadata[tableName];
    if (!metadata) {
      console.error(`❌ Tabla ${tableName} no encontrada en metadatos`);
      return res.status(404).json({ error: `Tabla ${tableName} no encontrada` });
    }

    console.log(`✅ Backend: Constraints obtenidos para ${tableName}:`, metadata.constraints.length);
    res.json(metadata.constraints);
  } catch (error) {
    console.error(`❌ Error in /api/sense/${req.params.tableName}/constraints:`, error);
    res.status(500).json({ error: error.message });
  }
});

// Ruta temporal para verificar tablas disponibles
app.get('/api/sense/tables', async (req, res) => {
  try {
    console.log('🔍 Verificando tablas disponibles en schema sense...');
    
    const tables = Object.keys(tableMetadata).map(tableName => ({
      table_name: tableName
    }));
    
    console.log('✅ Tablas encontradas:', tables);
    res.json({ tables });
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Endpoint para login en modo desarrollo
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('🔐 Backend: Intentando autenticar usuario (modo desarrollo):', email);
    
    // Verificar si el usuario existe en la tabla sense.usuario
    const { data: userData, error: userError } = await supabase
      .from('usuario')
        .select('*')
      .eq('login', email)
      .single();

    if (userError || !userData) {
      console.error('❌ Usuario no encontrado en sense.usuario:', userError);
      return res.status(401).json({ 
        success: false,
        error: 'Usuario no encontrado. Verifique el email.' 
      });
    }

    if (userData.statusid !== 1) {
      console.error('❌ Usuario inactivo (statusid != 1)');
      return res.status(401).json({ 
        success: false,
        error: 'Usuario inactivo. Contacte al administrador.' 
      });
    }

    console.log('✅ Usuario autenticado en modo desarrollo:', email);

    // Crear respuesta de usuario autenticado
    const authenticatedUser = {
      id: `dev-${userData.usuarioid}`,
      email: email,
      user_metadata: {
        full_name: `${userData.firstname} ${userData.lastname}`,
        rol: 'admin', // Asumimos admin por ahora
        usuarioid: userData.usuarioid,
        auth_user_id: userData.auth_user_id
      }
    };

    res.json({
      success: true,
      user: authenticatedUser
    });

  } catch (error) {
    console.error('❌ Error inesperado durante autenticación:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error interno del servidor' 
    });
  }
});

// Endpoint para verificar autenticación
app.get('/api/auth/verify', verifyAuth, (req, res) => {
  if (req.user) {
    res.json({ 
      authenticated: true, 
      user: {
        id: req.user.id,
        email: req.user.email,
        user_metadata: req.user.user_metadata
      }
    });
  } else {
    res.json({ authenticated: false });
  }
});

// Rutas PUT para actualizar registros
app.put('/api/sense/pais/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    console.log(`🔍 Backend: Actualizando pais con ID ${id}...`);
    
    const { data, error } = await supabase
      .from('pais')
      .update(updateData)
      .eq('paisid', id)
      .select();

      if (error) {
        console.error('❌ Error backend:', error);
        return res.status(500).json({ error: error.message });
      }

    console.log(`✅ Backend: Pais actualizado: ${data.length} registros`);
    res.json(data);
  } catch (error) {
    console.error('❌ Error backend:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/sense/empresa/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    console.log(`🔍 Backend: Actualizando empresa con ID ${id}...`);
    
    const { data, error } = await supabase
      .from('empresa')
      .update(updateData)
      .eq('empresaid', id)
      .select();
    
    if (error) {
      console.error('❌ Error backend:', error);
      return res.status(500).json({ error: error.message });
    }
    
    console.log(`✅ Backend: Empresa actualizada: ${data.length} registros`);
    res.json(data);
  } catch (error) {
    console.error('❌ Error backend:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/sense/fundo/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    console.log(`🔍 Backend: Actualizando fundo con ID ${id}...`);
    
    const { data, error } = await supabase
      .from('fundo')
      .update(updateData)
      .eq('fundoid', id)
      .select();

    if (error) {
      console.error('❌ Error backend:', error);
      return res.status(500).json({ error: error.message });
    }

    console.log(`✅ Backend: Fundo actualizado: ${data.length} registros`);
    res.json(data);
  } catch (error) {
    console.error('❌ Error backend:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/sense/ubicacion/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    console.log(`🔍 Backend: Actualizando ubicacion con ID ${id}...`);
    console.log(`🔍 Backend: Datos recibidos:`, JSON.stringify(updateData, null, 2));
    
    const { data, error } = await supabase
      .from('ubicacion')
      .update(updateData)
      .eq('ubicacionid', id)
      .select();

    if (error) {
      console.error('❌ Error backend:', error);
      return res.status(500).json({ error: error.message });
    }

    console.log(`✅ Backend: Ubicacion actualizada: ${data.length} registros`);
    res.json(data);
  } catch (error) {
    console.error('❌ Error backend:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/sense/entidad/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    console.log(`🔍 Backend: Actualizando entidad con ID ${id}...`);
    
    const { data, error } = await supabase
      .from('entidad')
      .update(updateData)
      .eq('entidadid', id)
      .select();

    if (error) {
      console.error('❌ Error backend:', error);
      return res.status(500).json({ error: error.message });
    }

    console.log(`✅ Backend: Entidad actualizada: ${data.length} registros`);
    res.json(data);
  } catch (error) {
    console.error('❌ Error backend:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/sense/metrica/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    console.log(`🔍 Backend: Actualizando metrica con ID ${id}...`);
    
    const { data, error } = await supabase
      .from('metrica')
      .update(updateData)
      .eq('metricaid', id)
      .select();

    if (error) {
      console.error('❌ Error backend:', error);
      return res.status(500).json({ error: error.message });
    }

    console.log(`✅ Backend: Metrica actualizada: ${data.length} registros`);
    res.json(data);
  } catch (error) {
    console.error('❌ Error backend:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/sense/tipo/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    console.log(`🔍 Backend: Actualizando tipo con ID ${id}...`);
    
    const { data, error } = await supabase
      .from('tipo')
      .update(updateData)
      .eq('tipoid', id)
      .select();

    if (error) {
      console.error('❌ Error backend:', error);
      return res.status(500).json({ error: error.message });
    }

    console.log(`✅ Backend: Tipo actualizado: ${data.length} registros`);
    res.json(data);
  } catch (error) {
    console.error('❌ Error backend:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/sense/nodo/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    console.log(`🔍 Backend: Actualizando nodo con ID ${id}...`);
    
    const { data, error } = await supabase
      .from('nodo')
      .update(updateData)
      .eq('nodoid', id)
      .select();

    if (error) {
      console.error('❌ Error backend:', error);
      return res.status(500).json({ error: error.message });
    }

    console.log(`✅ Backend: Nodo actualizado: ${data.length} registros`);
    res.json(data);
  } catch (error) {
    console.error('❌ Error backend:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/sense/criticidad/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    console.log(`🔍 Backend: Actualizando criticidad con ID ${id}...`);
    
    const { data, error } = await supabase
      .from('criticidad')
      .update(updateData)
      .eq('criticidadid', id)
      .select();

    if (error) {
      console.error('❌ Error backend:', error);
      return res.status(500).json({ error: error.message });
    }

    console.log(`✅ Backend: Criticidad actualizada: ${data.length} registros`);
    res.json(data);
  } catch (error) {
    console.error('❌ Error backend:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/sense/perfil/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    console.log(`🔍 Backend: Actualizando perfil con ID ${id}...`);
    
    const { data, error } = await supabase
      .from('perfil')
      .update(updateData)
      .eq('perfilid', id)
      .select();

    if (error) {
      console.error('❌ Error backend:', error);
      return res.status(500).json({ error: error.message });
    }

    console.log(`✅ Backend: Perfil actualizado: ${data.length} registros`);
    res.json(data);
  } catch (error) {
    console.error('❌ Error backend:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/sense/umbral/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    console.log(`🔍 Backend: Actualizando umbral con ID ${id}...`);
    console.log(`🔍 Backend: Datos recibidos:`, JSON.stringify(updateData, null, 2));
    
    const { data, error } = await supabase
      .from('umbral')
      .update(updateData)
      .eq('umbralid', id)
      .select();

    if (error) {
      console.error('❌ Error backend:', error);
      return res.status(500).json({ error: error.message });
    }

    console.log(`✅ Backend: Umbral actualizado: ${data.length} registros`);
    res.json(data);
  } catch (error) {
    console.error('❌ Error backend:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/sense/medio/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    console.log(`🔍 Backend: Actualizando medio con ID ${id}...`);
    
    const { data, error } = await supabase
      .from('medio')
      .update(updateData)
      .eq('medioid', id)
      .select();

      if (error) {
      console.error('❌ Error backend:', error);
        return res.status(500).json({ error: error.message });
      }

    console.log(`✅ Backend: Medio actualizado: ${data.length} registros`);
    res.json(data);
  } catch (error) {
    console.error('❌ Error backend:', error);
    res.status(500).json({ error: error.message });
  }
});

// Nota: La tabla sensor usa clave compuesta (nodoid, tipoid), no ID simple
// La ruta PUT para sensor se maneja con las rutas de clave compuesta

// Nota: La tabla metricasensor usa clave compuesta (nodoid, metricaid, tipoid), no ID simple
// La ruta PUT para metricasensor se maneja con las rutas de clave compuesta

app.put('/api/sense/contacto/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    console.log(`🔍 Backend: Actualizando contacto con ID ${id}...`);
    
    const { data, error } = await supabase
      .from('contacto')
      .update(updateData)
      .eq('contactoid', id)
      .select();
    
    if (error) {
      console.error('❌ Error backend:', error);
      return res.status(500).json({ error: error.message });
    }
    
    console.log(`✅ Backend: Contacto actualizado: ${data.length} registros`);
    res.json(data);
  } catch (error) {
    console.error('❌ Error backend:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/sense/usuario/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    console.log(`🔍 Backend: Actualizando usuario con ID ${id}...`);
    
    const { data, error } = await supabase
      .from('usuario')
      .update(updateData)
      .eq('usuarioid', id)
      .select();
    
    if (error) {
      console.error('❌ Error backend:', error);
      return res.status(500).json({ error: error.message });
    }
    
    console.log(`✅ Backend: Usuario actualizado: ${data.length} registros`);
    res.json(data);
  } catch (error) {
    console.error('❌ Error backend:', error);
    res.status(500).json({ error: error.message });
  }
});

// Rutas PUT para tablas con claves compuestas
app.put('/api/sense/localizacion/:ubicacionid/:nodoid', async (req, res) => {
  try {
    const { ubicacionid, nodoid } = req.params;
    const updateData = req.body;
    
    console.log(`🔍 Backend: Actualizando localizacion con ubicacionid ${ubicacionid} y nodoid ${nodoid}...`);
    
    const { data, error } = await supabase
      .from('localizacion')
      .update(updateData)
      .eq('ubicacionid', ubicacionid)
      .eq('nodoid', nodoid)
      .select();
      
      if (error) {
      console.error('❌ Error backend:', error);
        return res.status(500).json({ error: error.message });
      }
      
    console.log(`✅ Backend: Localizacion actualizada: ${data.length} registros`);
    res.json(data);
  } catch (error) {
    console.error('❌ Error backend:', error);
    res.status(500).json({ error: error.message });
  }
});

// Ruta PUT para localizacion con query parameters (para compatibilidad con frontend)
app.put('/api/sense/localizacion/composite', async (req, res) => {
  try {
    const { ubicacionid, nodoid, entidadid } = req.query;
    const updateData = req.body;
    
    console.log(`🔍 Backend: Actualizando localizacion con query params - ubicacionid: ${ubicacionid}, nodoid: ${nodoid}, entidadid: ${entidadid}...`);
    console.log(`🔍 Backend: Datos recibidos:`, JSON.stringify(updateData, null, 2));
    
    const { data, error } = await supabase
        .from('localizacion')
      .update(updateData)
      .eq('ubicacionid', ubicacionid)
      .eq('nodoid', nodoid)
      .select();
    
    if (error) {
      console.error('❌ Error backend:', error);
      return res.status(500).json({ error: error.message });
    }
    
    console.log(`✅ Backend: Localizacion actualizada: ${data.length} registros`);
    res.json(data);
  } catch (error) {
    console.error('❌ Error backend:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/sense/perfilumbral/:perfilid/:umbralid', async (req, res) => {
  try {
    const { perfilid, umbralid } = req.params;
    const updateData = req.body;
    
    console.log(`🔍 Backend: Actualizando perfilumbral con perfilid ${perfilid} y umbralid ${umbralid}...`);
    
    const { data, error } = await supabase
      .from('perfilumbral')
      .update(updateData)
      .eq('perfilid', perfilid)
      .eq('umbralid', umbralid)
      .select();
    
    if (error) {
      console.error('❌ Error backend:', error);
      return res.status(500).json({ error: error.message });
    }
    
    console.log(`✅ Backend: Perfilumbral actualizado: ${data.length} registros`);
    res.json(data);
      } catch (error) {
    console.error('❌ Error backend:', error);
    res.status(500).json({ error: error.message });
  }
});

// Ruta PUT para perfilumbral con query parameters (para compatibilidad con frontend)
app.put('/api/sense/perfilumbral/composite', async (req, res) => {
  try {
    const { perfilid, umbralid } = req.query;
    const updateData = req.body;
    
    console.log(`🔍 Backend: Actualizando perfilumbral con query params - perfilid: ${perfilid}, umbralid: ${umbralid}...`);
    console.log(`🔍 Backend: Datos recibidos:`, JSON.stringify(updateData, null, 2));
    
    const { data, error } = await supabase
      .from('perfilumbral')
      .update(updateData)
      .eq('perfilid', perfilid)
      .eq('umbralid', umbralid)
      .select();
    
    if (error) {
      console.error('❌ Error backend:', error);
      return res.status(500).json({ error: error.message });
    }
    
    console.log(`✅ Backend: Perfilumbral actualizado: ${data.length} registros`);
    res.json(data);
  } catch (error) {
    console.error('❌ Error backend:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/sense/usuarioperfil/:usuarioid/:perfilid', async (req, res) => {
  try {
    const { usuarioid, perfilid } = req.params;
    const updateData = req.body;
    
    console.log(`🔍 Backend: Actualizando usuarioperfil con usuarioid ${usuarioid} y perfilid ${perfilid}...`);
    
    const { data, error } = await supabase
      .from('usuarioperfil')
      .update(updateData)
      .eq('usuarioid', usuarioid)
      .eq('perfilid', perfilid)
      .select();
    
    if (error) {
      console.error('❌ Error backend:', error);
      return res.status(500).json({ error: error.message });
    }
    
    console.log(`✅ Backend: Usuarioperfil actualizado: ${data.length} registros`);
    res.json({ success: true, data: data });
  } catch (error) {
    console.error('❌ Error backend:', error);
    res.status(500).json({ error: error.message });
  }
});

// Ruta PUT para usuarioperfil con query parameters (para compatibilidad con frontend)
app.put('/api/sense/usuarioperfil/composite', async (req, res) => {
  try {
    const { usuarioid, perfilid } = req.query;
    const updateData = req.body;
    
    console.log(`🔍 Backend: Actualizando usuarioperfil con query params - usuarioid: ${usuarioid}, perfilid: ${perfilid}...`);
    console.log(`🔍 Backend: Datos recibidos:`, JSON.stringify(updateData, null, 2));
    
    const { data, error } = await supabase
      .from('usuarioperfil')
      .update(updateData)
      .eq('usuarioid', usuarioid)
      .eq('perfilid', perfilid)
      .select();
    
    if (error) {
      console.error('❌ Error backend:', error);
      return res.status(500).json({ error: error.message });
    }
    
    console.log(`✅ Backend: Usuarioperfil actualizado: ${data.length} registros`);
    res.json({ success: true, data: data });
  } catch (error) {
    console.error('❌ Error backend:', error);
    res.status(500).json({ error: error.message });
  }
});

// Ruta PUT para sensor con clave compuesta (path parameters)
app.put('/api/sense/sensor/:nodoid/:tipoid', async (req, res) => {
  try {
    const { nodoid, tipoid } = req.params;
    const updateData = req.body;
    
    console.log(`🔍 Backend: Actualizando sensor con nodoid ${nodoid} y tipoid ${tipoid}...`);
    
    const { data, error } = await supabase
      .from('sensor')
      .update(updateData)
      .eq('nodoid', nodoid)
      .eq('tipoid', tipoid)
      .select();
    
    if (error) {
      console.error('❌ Error backend:', error);
      return res.status(500).json({ error: error.message });
    }
    
    console.log(`✅ Backend: Sensor actualizado: ${data.length} registros`);
    res.json(data);
  } catch (error) {
    console.error('❌ Error backend:', error);
    res.status(500).json({ error: error.message });
  }
});

// Ruta PUT para metricasensor con query parameters (para clave compuesta)
app.put('/api/sense/metricasensor/composite', async (req, res) => {
  try {
    const { nodoid, metricaid, tipoid } = req.query;
    const updateData = req.body;
    console.log(`🔍 Backend: Actualizando metricasensor con query params - nodoid: ${nodoid}, metricaid: ${metricaid}, tipoid: ${tipoid}...`);
    console.log(`🔍 Backend: Datos recibidos:`, JSON.stringify(updateData, null, 2));

    // Para metricasensor, la validación de negocio es diferente
    // No hay restricción de entidad como en sensor, solo validamos que no haya conflictos
    // La tabla metricasensor no tiene columna entidadid

    // Usar upsert para crear o actualizar la entrada
    const { data, error } = await supabase
      .from('metricasensor')
      .upsert({
        nodoid: parseInt(nodoid),
        metricaid: parseInt(metricaid),
        tipoid: parseInt(tipoid),
        ...updateData
      })
      .select();
    if (error) {
      console.error('❌ Error backend:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
    console.log(`✅ Backend: Metricasensor actualizado: ${data.length} registros`);
    res.json({ success: true, data: data });
  } catch (error) {
    console.error('❌ Error backend:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Ruta PUT para sensor con query parameters (para compatibilidad con frontend)
app.put('/api/sense/sensor/composite', async (req, res) => {
  try {
    const { nodoid, tipoid } = req.query;
    const updateData = req.body;
    console.log(`🔍 Backend: Actualizando sensor con query params - nodoid: ${nodoid}, tipoid: ${tipoid}...`);
    console.log(`🔍 Backend: Datos recibidos:`, JSON.stringify(updateData, null, 2));

    // Implementación de la validación de negocio
    if (updateData.statusid === 1) { // Si se intenta activar un sensor
      const { data: existingActiveSensors, error: activeSensorError } = await supabase
        .from('sensor')
        .select('nodoid, tipoid, statusid, entidadid') // Asumiendo que entidadid está disponible o se puede unir
        .eq('nodoid', nodoid)
        .eq('statusid', 1);

      if (activeSensorError) {
        console.error('❌ Error al verificar sensores activos:', activeSensorError);
        return res.status(500).json({ error: activeSensorError.message });
      }

      // Obtener la entidadid del sensor que se intenta activar
      const { data: targetSensorData, error: targetSensorError } = await supabase
        .from('sensor')
        .select('entidadid')
        .eq('nodoid', nodoid)
        .eq('tipoid', tipoid)
        .single();

      if (targetSensorError) {
        console.error('❌ Error al obtener entidad del sensor objetivo:', targetSensorError);
        return res.status(500).json({ error: targetSensorError.message });
      }

      const targetEntidadId = targetSensorData?.entidadid;

      const conflictingSensor = existingActiveSensors.find(
        (s) => s.entidadid !== targetEntidadId && s.nodoid === parseInt(nodoid)
      );

      if (conflictingSensor) {
        const errorMessage = `Para nodoid=${nodoid} ya existen sensores ACTIVOS de otra entidad. Desactive primero los actuales antes de activar los de entidad ${targetEntidadId}.`;
        console.error('❌ Error de validación de negocio:', errorMessage);
        return res.status(409).json({ code: '23514', message: errorMessage }); // 409 Conflict
      }
    }

    const { data, error } = await supabase
      .from('sensor')
      .update(updateData)
      .eq('nodoid', nodoid)
      .eq('tipoid', tipoid)
      .select();
    if (error) {
      console.error('❌ Error backend:', error);
      return res.status(500).json({ error: error.message });
    }
    console.log(`✅ Backend: Sensor actualizado: ${data.length} registros`);
    res.json(data);
  } catch (error) {
    console.error('❌ Error backend:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/sense/audit_log_umbral/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    console.log(`🔍 Backend: Actualizando audit_log_umbral con ID ${id}...`);
    
    const { data, error } = await supabase
      .from('audit_log_umbral')
      .update(updateData)
      .eq('auditid', id)
      .select();
    
    if (error) {
      console.error('❌ Error backend:', error);
      return res.status(500).json({ error: error.message });
    }
    
    console.log(`✅ Backend: Audit_log_umbral actualizado: ${data.length} registros`);
    res.json(data);
  } catch (error) {
    console.error('❌ Error backend:', error);
    res.status(500).json({ error: error.message });
  }
});

// Ruta para detectar schema disponible
app.get('/api/detect', async (req, res) => {
  try {
    console.log('🔍 Detectando schema disponible...');
    
    // Probar schema 'sense' usando una tabla conocida
    const { data: senseData, error: senseError } = await supabase
      .from('pais')
      .select('paisid')
        .limit(1);

    if (!senseError && senseData) {
      console.log('✅ Schema "sense" detectado y disponible');
      res.json({ available: true, schema: 'sense' });
      } else {
      console.log('❌ Schema "sense" no disponible, usando "public"');
      res.json({ available: false, schema: 'public' });
      }
    } catch (error) {
    console.error('❌ Error detectando schema:', error);
    res.json({ available: false, schema: 'public' });
  }
});

// Rutas en plural para filtros globales (usadas por el frontend)
app.get('/api/sense/paises', async (req, res) => {
  try {
    const { limit = 100 } = req.query;
    console.log(`🔍 Backend: Obteniendo paises del schema sense...`);
    
    const { data, error } = await supabase
      .from('pais')
      .select('*')
      .eq('statusid', 1)
      .limit(parseInt(limit));

    if (error) {
      console.error('❌ Error backend:', error);
      return res.status(500).json({ error: error.message });
    }
    
    console.log(`✅ Backend: Paises obtenidos: ${data.length}`);
    res.json(data);
  } catch (error) {
    console.error('❌ Error backend:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/sense/empresas', async (req, res) => {
  try {
    const { limit = 100, paisId } = req.query;
    console.log(`🔍 Backend: Obteniendo empresas del schema sense...`);
    
    let query = supabase
      .from('empresa')
      .select('*')
      .eq('statusid', 1);
    
    if (paisId) {
      query = query.eq('paisid', paisId);
    }
    
    const { data, error } = await query.limit(parseInt(limit));
    
    if (error) {
      console.error('❌ Error backend:', error);
      return res.status(500).json({ error: error.message });
    }
    
    console.log(`✅ Backend: Empresas obtenidas: ${data.length}`);
    res.json(data);
  } catch (error) {
    console.error('❌ Error backend:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/sense/fundos', async (req, res) => {
  try {
    const { limit = 100, empresaId } = req.query;
    console.log(`🔍 Backend: Obteniendo fundos del schema sense...`);

    let query = supabase
      .from('fundo')
      .select('*')
      .eq('statusid', 1);
    
    if (empresaId) {
      query = query.eq('empresaid', empresaId);
    }
    
    const { data, error } = await query.limit(parseInt(limit));
    
    if (error) {
      console.error('❌ Error backend:', error);
      return res.status(500).json({ error: error.message });
    }
    
    console.log(`✅ Backend: Fundos obtenidos: ${data.length}`);
    res.json(data);
  } catch (error) {
    console.error('❌ Error backend:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/sense/ubicaciones', async (req, res) => {
  try {
    const { limit = 100, fundoId } = req.query;
    console.log(`🔍 Backend: Obteniendo ubicaciones del schema sense...`);
    
    let query = supabase
      .from('ubicacion')
      .select('*')
      .eq('statusid', 1);
    
    if (fundoId) {
      query = query.eq('fundoid', fundoId);
    }
    
    const { data, error } = await query.limit(parseInt(limit));
    
    if (error) {
      console.error('❌ Error backend:', error);
      return res.status(500).json({ error: error.message });
    }
    
    console.log(`✅ Backend: Ubicaciones obtenidas: ${data.length}`);
    res.json(data);
  } catch (error) {
    console.error('❌ Error backend:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/sense/entidades', async (req, res) => {
  try {
    const { limit = 100 } = req.query;
    console.log(`🔍 Backend: Obteniendo entidades del schema sense...`);
    
    const { data, error } = await supabase
      .from('entidad')
      .select('*')
      .eq('statusid', 1)
      .limit(parseInt(limit));

    if (error) {
      console.error('❌ Error backend:', error);
      return res.status(500).json({ error: error.message });
    }

    console.log(`✅ Backend: Entidades obtenidas: ${data.length}`);
    res.json(data);
  } catch (error) {
    console.error('❌ Error backend:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/sense/metricas', async (req, res) => {
  try {
    const { limit = 100 } = req.query;
    console.log(`🔍 Backend: Obteniendo metricas del schema sense...`);
    
    const { data, error } = await supabase
      .from('metrica')
      .select('*')
      .eq('statusid', 1)
      .limit(parseInt(limit));
    
    if (error) {
      console.error('❌ Error backend:', error);
      return res.status(500).json({ error: error.message });
    }
    
    console.log(`✅ Backend: Metricas obtenidas: ${data.length}`);
    res.json(data);
  } catch (error) {
    console.error('❌ Error backend:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/sense/nodos', async (req, res) => {
  try {
    const { limit = 100 } = req.query;
    console.log(`🔍 Backend: Obteniendo nodos del schema sense...`);
    
    const { data, error } = await supabase
      .from('nodo')
        .select('*')
      .eq('statusid', 1)
      .limit(parseInt(limit));
    
    if (error) {
      console.error('❌ Error backend:', error);
      return res.status(500).json({ error: error.message });
    }
    
    console.log(`✅ Backend: Nodos obtenidos: ${data.length}`);
    res.json(data);
  } catch (error) {
    console.error('❌ Error backend:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/sense/tipos', async (req, res) => {
  try {
    const { limit = 100 } = req.query;
    console.log(`🔍 Backend: Obteniendo tipos del schema sense...`);
    
    const { data, error } = await supabase
      .from('tipo')
      .select('*')
      .eq('statusid', 1)
      .limit(parseInt(limit));

    if (error) {
      console.error('❌ Error backend:', error);
      return res.status(500).json({ error: error.message });
    }
    
    console.log(`✅ Backend: Tipos obtenidos: ${data.length}`);
    res.json(data);
  } catch (error) {
    console.error('❌ Error backend:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/sense/localizaciones', async (req, res) => {
  try {
    const { limit = 100 } = req.query;
    console.log(`🔍 Backend: Obteniendo localizaciones del schema sense...`);
    
    const { data, error } = await supabase
      .from('localizacion')
      .select('*')
      .eq('statusid', 1)
      .limit(parseInt(limit));
    
    if (error) {
      console.error('❌ Error backend:', error);
      return res.status(500).json({ error: error.message });
    }
    
    console.log(`✅ Backend: Localizaciones obtenidas: ${data.length}`);
    res.json(data);
  } catch (error) {
    console.error('❌ Error backend:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para obtener nodos con localizaciones completas (para mapa)
app.get('/api/sense/nodos-con-localizacion', async (req, res) => {
  try {
    const { limit = 1000 } = req.query;
    console.log(`🔍 Backend: Obteniendo nodos con localizaciones del schema sense...`);
    
    const { data, error } = await supabase
      .from('localizacion')
      .select(`
        *,
        nodo: nodoid (
          nodoid,
          nodo,
          deveui,
          statusid
        ),
        ubicacion: ubicacionid (
          ubicacionid,
          ubicacion,
          ubicacionabrev,
          fundoid,
          statusid,
          fundo: fundoid (
            fundoid,
            fundo,
            farmabrev,
            empresaid,
            empresa: empresaid (
              empresaid,
              empresa,
              empresabrev,
              paisid,
              pais: paisid (
                paisid,
                pais,
                paisabrev
              )
            )
          )
        ),
        entidad: entidadid (
          entidadid,
          entidad,
          statusid
        )
      `)
      .eq('statusid', 1)
      .not('latitud', 'is', null)
      .not('longitud', 'is', null)
      .limit(parseInt(limit));
    
    if (error) {
      console.error('❌ Error backend:', error);
      return res.status(500).json({ error: error.message });
    }
    
    console.log(`✅ Backend: Nodos con localizaciones obtenidos: ${data.length}`);
    res.json(data);
  } catch (error) {
    console.error('❌ Error backend:', error);
    res.status(500).json({ error: error.message });
  }
});

// Ruta para detectar schema disponible (alias para sense)
app.get('/api/sense/detect', async (req, res) => {
  try {
    console.log('🔍 Detectando schema disponible via /api/sense/detect...');
    
    // Probar schema 'sense' usando una tabla conocida
    const { data: senseData, error: senseError } = await supabase
      .from('pais')
      .select('paisid')
      .limit(1);

    if (!senseError && senseData) {
      console.log('✅ Schema "sense" detectado y disponible');
      res.json({ available: true, schema: 'sense' });
    } else {
      console.log('❌ Schema "sense" no disponible, usando "public"');
      res.json({ available: false, schema: 'public' });
    }
  } catch (error) {
    console.error('❌ Error detectando schema:', error);
    res.json({ available: false, schema: 'public' });
  }
});

// ===== RUTAS POST PARA INSERCIÓN DE DATOS =====

// Ruta POST para insertar país
app.post('/api/sense/pais', async (req, res) => {
  try {
    const insertData = req.body;
    console.log('🔍 Backend: Insertando país...');
    console.log('🔍 Backend: Datos recibidos:', JSON.stringify(insertData, null, 2));

    const { data, error } = await supabase
      .from('pais')
      .insert(insertData)
      .select();

    if (error) {
      console.error('❌ Error backend:', error);
      return res.status(500).json({ error: error.message });
    }
    
    console.log(`✅ Backend: País insertado: ${data.length} registros`);
    res.json(data);
  } catch (error) {
    console.error('❌ Error backend:', error);
    res.status(500).json({ error: error.message });
  }
});

// Ruta POST para insertar empresa
app.post('/api/sense/empresa', async (req, res) => {
  try {
    const insertData = req.body;
    console.log('🔍 Backend: Insertando empresa...');
    console.log('🔍 Backend: Datos recibidos:', JSON.stringify(insertData, null, 2));
    
    const { data, error } = await supabase
      .from('empresa')
      .insert(insertData)
      .select();
    
    if (error) {
      console.error('❌ Error backend:', error);
      return res.status(500).json({ error: error.message });
    }
    
    console.log(`✅ Backend: Empresa insertada: ${data.length} registros`);
    res.json(data);
  } catch (error) {
    console.error('❌ Error backend:', error);
    res.status(500).json({ error: error.message });
  }
});

// Ruta POST para insertar fundo
app.post('/api/sense/fundo', async (req, res) => {
  try {
    const insertData = req.body;
    console.log('🔍 Backend: Insertando fundo...');
    console.log('🔍 Backend: Datos recibidos:', JSON.stringify(insertData, null, 2));
    
    const { data, error } = await supabase
      .from('fundo')
      .insert(insertData)
      .select();

    if (error) {
      console.error('❌ Error backend:', error);
      return res.status(500).json({ error: error.message });
    }
    
    console.log(`✅ Backend: Fundo insertado: ${data.length} registros`);
    res.json(data);
  } catch (error) {
    console.error('❌ Error backend:', error);
    res.status(500).json({ error: error.message });
  }
});

// Ruta POST para insertar ubicación
app.post('/api/sense/ubicacion', async (req, res) => {
  try {
    const insertData = req.body;
    console.log('🔍 Backend: Insertando ubicación...');
    console.log('🔍 Backend: Datos recibidos:', JSON.stringify(insertData, null, 2));
    
    // Filtrar solo las columnas que existen en la tabla (omitir ubicacionabrev por problemas de cache)
    const filteredData = {
      ubicacion: insertData.ubicacion,
      fundoid: insertData.fundoid,
      statusid: insertData.statusid,
      usercreatedid: insertData.usercreatedid,
      usermodifiedid: insertData.usermodifiedid,
      datecreated: insertData.datecreated,
      datemodified: insertData.datemodified
    };

    const { data, error } = await supabase
      .from('ubicacion')
      .insert(filteredData)
      .select();

    if (error) {
      console.error('❌ Error backend:', error);
      return res.status(500).json({ error: error.message });
    }
    
    console.log(`✅ Backend: Ubicación insertada: ${data.length} registros`);
    res.json(data);
  } catch (error) {
    console.error('❌ Error backend:', error);
    res.status(500).json({ error: error.message });
  }
});

// Ruta POST para insertar entidad
app.post('/api/sense/entidad', async (req, res) => {
  try {
    const insertData = req.body;
    console.log('🔍 Backend: Insertando entidad...');
    console.log('🔍 Backend: Datos recibidos:', JSON.stringify(insertData, null, 2));
    
    const { data, error } = await supabase
      .from('entidad')
      .insert(insertData)
      .select();
    
    if (error) {
      console.error('❌ Error backend:', error);
      return res.status(500).json({ error: error.message });
    }
    
    console.log(`✅ Backend: Entidad insertada: ${data.length} registros`);
    res.json(data);
  } catch (error) {
    console.error('❌ Error backend:', error);
    res.status(500).json({ error: error.message });
  }
});

// Ruta POST para insertar tipo
app.post('/api/sense/tipo', async (req, res) => {
  try {
    const insertData = req.body;
    console.log('🔍 Backend: Insertando tipo...');
    console.log('🔍 Backend: Datos recibidos:', JSON.stringify(insertData, null, 2));
    
    const { data, error } = await supabase
      .from('tipo')
      .insert(insertData)
      .select();

    if (error) {
      console.error('❌ Error backend:', error);
      return res.status(500).json({ error: error.message });
    }

    console.log(`✅ Backend: Tipo insertado: ${data.length} registros`);
    res.json(data);
  } catch (error) {
    console.error('❌ Error backend:', error);
    res.status(500).json({ error: error.message });
  }
});

// Ruta POST para insertar nodo
app.post('/api/sense/nodo', async (req, res) => {
  try {
    const insertData = req.body;
    console.log('🔍 Backend: Insertando nodo...');
    console.log('🔍 Backend: Datos recibidos:', JSON.stringify(insertData, null, 2));
    
    const { data, error } = await supabase
      .from('nodo')
      .insert(insertData)
      .select();

    if (error) {
      console.error('❌ Error backend:', error);
      return res.status(500).json({ error: error.message });
    }

    console.log(`✅ Backend: Nodo insertado: ${data.length} registros`);
    res.json(data);
  } catch (error) {
    console.error('❌ Error backend:', error);
    res.status(500).json({ error: error.message });
  }
});

// Ruta POST para insertar métrica
app.post('/api/sense/metrica', async (req, res) => {
  try {
    const insertData = req.body;
    console.log('🔍 Backend: Insertando métrica...');
    console.log('🔍 Backend: Datos recibidos:', JSON.stringify(insertData, null, 2));
    
    const { data, error } = await supabase
      .from('metrica')
      .insert(insertData)
      .select();
    
    if (error) {
      console.error('❌ Error backend:', error);
      return res.status(500).json({ error: error.message });
    }
    
    console.log(`✅ Backend: Métrica insertada: ${data.length} registros`);
    res.json(data);
  } catch (error) {
    console.error('❌ Error backend:', error);
    res.status(500).json({ error: error.message });
  }
});

// Ruta POST para insertar umbral
app.post('/api/sense/umbral', async (req, res) => {
  try {
    const insertData = req.body;
    console.log('🔍 Backend: Insertando umbral...');
    console.log('🔍 Backend: Datos recibidos:', JSON.stringify(insertData, null, 2));
    
    const { data, error } = await supabase
      .from('umbral')
      .insert(insertData)
      .select();
    
    if (error) {
      console.error('❌ Error backend:', error);
      return res.status(500).json({ error: error.message });
    }
    
    console.log(`✅ Backend: Umbral insertado: ${data.length} registros`);
    res.json(data);
  } catch (error) {
    console.error('❌ Error backend:', error);
    res.status(500).json({ error: error.message });
  }
});

// Ruta POST para insertar criticidad
app.post('/api/sense/criticidad', async (req, res) => {
  try {
    const insertData = req.body;
    console.log('🔍 Backend: Insertando criticidad...');
    console.log('🔍 Backend: Datos recibidos:', JSON.stringify(insertData, null, 2));
    
    // Filtrar solo las columnas que existen en la tabla
    const filteredData = {
      criticidad: insertData.criticidad,
      criticidadbrev: insertData.criticidadbrev,
      statusid: insertData.statusid,
      usercreatedid: insertData.usercreatedid,
      usermodifiedid: insertData.usermodifiedid,
      datecreated: insertData.datecreated,
      datemodified: insertData.datemodified
    };
    
    const { data, error } = await supabase
      .from('criticidad')
      .insert(filteredData)
      .select();
    
    if (error) {
      console.error('❌ Error backend:', error);
      return res.status(500).json({ error: error.message });
    }
    
    console.log(`✅ Backend: Criticidad insertada: ${data.length} registros`);
    res.json(data);
  } catch (error) {
    console.error('❌ Error backend:', error);
    res.status(500).json({ error: error.message });
  }
});

// Ruta POST para insertar medio
app.post('/api/sense/medio', async (req, res) => {
  try {
    const insertData = req.body;
    console.log('🔍 Backend: Insertando medio...');
    console.log('🔍 Backend: Datos recibidos:', JSON.stringify(insertData, null, 2));
    
    // Filtrar solo las columnas que existen en la tabla
    const filteredData = {
      nombre: insertData.nombre,
      statusid: insertData.statusid,
      usercreatedid: insertData.usercreatedid,
      usermodifiedid: insertData.usermodifiedid,
      datecreated: insertData.datecreated,
      datemodified: insertData.datemodified
    };
    
    const { data, error } = await supabase
      .from('medio')
      .insert(filteredData)
      .select();

    if (error) {
      console.error('❌ Error backend:', error);
      return res.status(500).json({ error: error.message });
    }

    console.log(`✅ Backend: Medio insertado: ${data.length} registros`);
    res.json(data);
  } catch (error) {
    console.error('❌ Error backend:', error);
    res.status(500).json({ error: error.message });
  }
});

// Ruta POST para insertar contacto
app.post('/api/sense/contacto', async (req, res) => {
  try {
    const insertData = req.body;
    console.log('🔍 Backend: Insertando contacto...');
    console.log('🔍 Backend: Datos recibidos:', JSON.stringify(insertData, null, 2));
    
    // Filtrar solo las columnas que existen en la tabla
    const filteredData = {
      usuarioid: insertData.usuarioid,
      medioid: insertData.medioid,
      celular: insertData.celular,
      correo: insertData.correo,
      statusid: insertData.statusid,
      usercreatedid: insertData.usercreatedid,
      usermodifiedid: insertData.usermodifiedid,
      datecreated: insertData.datecreated,
      datemodified: insertData.datemodified
    };
    
    const { data, error } = await supabase
      .from('contacto')
      .insert(filteredData)
      .select();
    
    if (error) {
      console.error('❌ Error backend:', error);
      return res.status(500).json({ error: error.message });
    }
    
    console.log(`✅ Backend: Contacto insertado: ${data.length} registros`);
    res.json(data);
  } catch (error) {
    console.error('❌ Error backend:', error);
    res.status(500).json({ error: error.message });
  }
});

// Ruta POST para insertar usuario
app.post('/api/sense/usuario', async (req, res) => {
  try {
    const insertData = req.body;
    console.log('🔍 Backend: Insertando usuario...');
    console.log('🔍 Backend: Datos recibidos:', JSON.stringify(insertData, null, 2));
    
    // Filtrar solo las columnas que existen en la tabla
    const filteredData = {
      login: insertData.login,
      lastname: insertData.lastname,
      firstname: insertData.firstname,
      statusid: insertData.statusid,
      usercreatedid: insertData.usercreatedid,
      usermodifiedid: insertData.usermodifiedid,
      datecreated: insertData.datecreated,
      datemodified: insertData.datemodified,
      auth_user_id: insertData.auth_user_id
    };
    
    const { data, error } = await supabase
      .from('usuario')
      .insert(filteredData)
      .select();

    if (error) {
      console.error('❌ Error backend:', error);
      return res.status(500).json({ error: error.message });
    }
    
    console.log(`✅ Backend: Usuario insertado: ${data.length} registros`);
    res.json(data);
  } catch (error) {
    console.error('❌ Error backend:', error);
    res.status(500).json({ error: error.message });
  }
});

// Ruta POST para insertar perfil
app.post('/api/sense/perfil', async (req, res) => {
  try {
    const insertData = req.body;
    console.log('🔍 Backend: Insertando perfil...');
    console.log('🔍 Backend: Datos recibidos:', JSON.stringify(insertData, null, 2));
    
    // Filtrar solo las columnas que existen en la tabla
    const filteredData = {
      perfil: insertData.perfil,
      nivel: insertData.nivel,
      statusid: insertData.statusid,
      usercreatedid: insertData.usercreatedid,
      usermodifiedid: insertData.usermodifiedid,
      datecreated: insertData.datecreated,
      datemodified: insertData.datemodified
    };
    
    const { data, error } = await supabase
      .from('perfil')
      .insert(filteredData)
      .select();
    
    if (error) {
      console.error('❌ Error backend:', error);
      return res.status(500).json({ error: error.message });
    }
    
    console.log(`✅ Backend: Perfil insertado: ${data.length} registros`);
    res.json(data);
  } catch (error) {
    console.error('❌ Error backend:', error);
    res.status(500).json({ error: error.message });
  }
});

// Ruta POST para insertar localización (clave compuesta)
app.post('/api/sense/localizacion', async (req, res) => {
  try {
    const insertData = req.body;
    console.log('🔍 Backend: Insertando localización...');
    console.log('🔍 Backend: Datos recibidos:', JSON.stringify(insertData, null, 2));
    
    const { data, error } = await supabase
      .from('localizacion')
      .insert(insertData)
      .select();
    
    if (error) {
      console.error('❌ Error backend:', error);
      return res.status(500).json({ error: error.message });
    }
    
    console.log(`✅ Backend: Localización insertada: ${data.length} registros`);
    res.json(data);
  } catch (error) {
    console.error('❌ Error backend:', error);
    res.status(500).json({ error: error.message });
  }
});

// Ruta POST para insertar perfilumbral (clave compuesta)
app.post('/api/sense/perfilumbral', async (req, res) => {
  try {
    const insertData = req.body;
    console.log('🔍 Backend: Insertando perfilumbral...');
    console.log('🔍 Backend: Datos recibidos:', JSON.stringify(insertData, null, 2));
    
    const { data, error } = await supabase
      .from('perfilumbral')
      .insert(insertData)
      .select();
    
    if (error) {
      console.error('❌ Error backend:', error);
      return res.status(500).json({ error: error.message });
    }
    
    console.log(`✅ Backend: Perfilumbral insertado: ${data.length} registros`);
    res.json(data);
  } catch (error) {
    console.error('❌ Error backend:', error);
    res.status(500).json({ error: error.message });
  }
});

// Ruta POST para insertar usuarioperfil (clave compuesta)
app.post('/api/sense/usuarioperfil', async (req, res) => {
  try {
    const insertData = req.body;
    console.log('🔍 Backend: Insertando usuarioperfil...');
    console.log('🔍 Backend: Datos recibidos:', JSON.stringify(insertData, null, 2));
    
    const { data, error } = await supabase
      .from('usuarioperfil')
      .insert(insertData)
      .select();

    if (error) {
      console.error('❌ Error backend:', error);
      return res.status(500).json({ error: error.message });
    }
    
    console.log(`✅ Backend: Usuarioperfil insertado: ${data.length} registros`);
    res.json(data);
  } catch (error) {
    console.error('❌ Error backend:', error);
    res.status(500).json({ error: error.message });
  }
});

// Ruta POST para insertar sensor (clave compuesta)
app.post('/api/sense/sensor', async (req, res) => {
  try {
    const insertData = req.body;
    console.log('🔍 Backend: Insertando sensor...');
    console.log('🔍 Backend: Datos recibidos:', JSON.stringify(insertData, null, 2));
    
    const { data, error } = await supabase
        .from('sensor')
      .insert(insertData)
      .select();
    
    if (error) {
      console.error('❌ Error backend:', error);
      return res.status(500).json({ error: error.message });
    }
    
    console.log(`✅ Backend: Sensor insertado: ${data.length} registros`);
    res.json(data);
  } catch (error) {
    console.error('❌ Error backend:', error);
    res.status(500).json({ error: error.message });
  }
});

// Ruta POST para insertar metricasensor (clave compuesta)
app.post('/api/sense/metricasensor', async (req, res) => {
  try {
    const insertData = req.body;
    console.log('🔍 Backend: Insertando metricasensor...');
    console.log('🔍 Backend: Datos recibidos:', JSON.stringify(insertData, null, 2));
    
    const { data, error } = await supabase
            .from('metricasensor')
      .insert(insertData)
      .select();
    
    if (error) {
      console.error('❌ Error backend:', error);
      return res.status(500).json({ error: error.message });
    }
    
    console.log(`✅ Backend: Metricasensor insertado: ${data.length} registros`);
    res.json(data);
  } catch (error) {
    console.error('❌ Error backend:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para obtener mediciones con filtros
app.get('/api/sense/mediciones', async (req, res) => {
  try {
    const { ubicacionId, startDate, endDate, limit, countOnly, getAll } = req.query;
    console.log('🔍 Backend: Obteniendo mediciones del schema sense...', { ubicacionId, startDate, endDate, limit, countOnly, getAll });
    
    let query = supabase
      .from('medicion')
      .select('*');
    
    // Aplicar filtros
    if (ubicacionId) {
      query = query.eq('ubicacionid', ubicacionId);
    }
    
    if (startDate) {
      query = query.gte('fecha', startDate);
    }
    
    if (endDate) {
      query = query.lte('fecha', endDate);
    }
    
    // Si solo necesitamos el conteo
    if (countOnly === 'true') {
      query = query.select('*', { count: 'exact', head: true });
    } else if (limit) {
      query = query.limit(parseInt(limit));
    } else if (getAll !== 'true') {
      // Límite por defecto si no se especifica
      query = query.limit(1000);
    }
    
    // Ordenar por fecha descendente (más recientes primero)
    query = query.order('fecha', { ascending: false });
    
    const { data, error, count } = await query;
    
    if (error) {
      console.error('❌ Error backend:', error);
      return res.status(500).json({ error: error.message });
    }
    
    if (countOnly === 'true') {
      console.log(`✅ Backend: Conteo de mediciones: ${count}`);
      res.json({ count: count || 0 });
    } else {
      console.log(`✅ Backend: Mediciones obtenidas: ${data?.length || 0}`);
      res.json(data || []);
    }
  } catch (error) {
    console.error('❌ Error in /api/sense/mediciones:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para obtener mediciones con entidad (con JOIN)
app.get('/api/sense/mediciones-con-entidad', async (req, res) => {
  try {
    const { ubicacionId, startDate, endDate, limit, entidadId, countOnly, getAll } = req.query;
    console.log('🔍 Backend: Obteniendo mediciones con entidad del schema sense...', { ubicacionId, startDate, endDate, limit, entidadId, countOnly, getAll });
    
    // Query simple primero - solo mediciones
    let query = supabase
      .from('medicion')
      .select('*');
    
    // Aplicar filtros básicos
    if (ubicacionId) {
      query = query.eq('ubicacionid', ubicacionId);
    }
    
    if (startDate) {
      query = query.gte('fecha', startDate);
    }
    
    if (endDate) {
      query = query.lte('fecha', endDate);
    }
    
    // Si solo necesitamos el conteo
    if (countOnly === 'true') {
      query = query.select('*', { count: 'exact', head: true });
    } else if (limit) {
      query = query.limit(parseInt(limit));
    } else if (getAll !== 'true') {
      // Límite por defecto si no se especifica
      query = query.limit(1000);
    }
    
    // Ordenar por fecha descendente (más recientes primero)
    query = query.order('fecha', { ascending: false });
    
    const { data, error, count } = await query;
    
    if (error) {
      console.error('❌ Error backend:', error);
      return res.status(500).json({ error: error.message });
    }
    
    // Si hay entidadId, filtrar después de obtener los datos
    let filteredData = data || [];
    if (entidadId && data) {
      // Obtener ubicaciones que pertenecen a la entidad - query simple
      const { data: ubicaciones, error: ubicError } = await supabase
        .from('ubicacion')
        .select('ubicacionid');
      
      if (ubicError) {
        console.error('❌ Error obteniendo ubicaciones:', ubicError);
        return res.status(500).json({ error: ubicError.message });
      }
      
      // Por ahora, devolver todas las mediciones si hay entidadId
      // TODO: Implementar filtro por entidad correctamente
      filteredData = data;
    }
    
    if (countOnly === 'true') {
      console.log(`✅ Backend: Conteo de mediciones con entidad: ${filteredData.length}`);
      res.json({ count: filteredData.length });
    } else {
      console.log(`✅ Backend: Mediciones con entidad obtenidas: ${filteredData.length}`);
      res.json(filteredData);
    }
  } catch (error) {
    console.error('❌ Error in /api/sense/mediciones-con-entidad:', error);
    res.status(500).json({ error: error.message });
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 JoySense Backend API running on port ${PORT}`);
  console.log(`🔑 Using Service Role Key (backend only)`);
  console.log(`🌐 API URL: http://localhost:${PORT}/api`);
  console.log(`📡 Servidor listo para recibir conexiones...`);
}).on('error', (error) => {
  console.error('❌ Error al iniciar el servidor:', error);
  process.exit(1);
});
