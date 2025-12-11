-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE joysense.alerta (
  uuid_alertaid uuid NOT NULL DEFAULT gen_random_uuid(),
  medicionid bigint NOT NULL,
  umbralid bigint NOT NULL,
  fecha timestamp with time zone NOT NULL DEFAULT now(),
  statusid integer NOT NULL DEFAULT 1 CHECK (statusid = ANY (ARRAY[0, 1])),
  usercreatedid integer NOT NULL,
  datecreated timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT alerta_pkey PRIMARY KEY (uuid_alertaid),
  CONSTRAINT fk_alerta_medicion FOREIGN KEY (medicionid) REFERENCES joysense.medicion(medicionid),
  CONSTRAINT fk_alerta_umbral FOREIGN KEY (umbralid) REFERENCES joysense.umbral(umbralid)
);
CREATE TABLE joysense.alertaconsolidado (
  uuid_consolidadoid uuid NOT NULL DEFAULT gen_random_uuid(),
  umbralid bigint NOT NULL,
  fechainicio timestamp with time zone NOT NULL DEFAULT now(),
  fechaultimo timestamp with time zone NOT NULL DEFAULT now(),
  fechaultimacorrida timestamp with time zone,
  ultimamedicion numeric NOT NULL,
  contador integer NOT NULL DEFAULT 1,
  nivelnotificado integer,
  ultimoenvio timestamp with time zone,
  ultimoescalamiento timestamp with time zone,
  nivelescalamiento integer,
  statusid integer NOT NULL DEFAULT 1,
  usercreatedid integer NOT NULL,
  datecreated timestamp with time zone NOT NULL DEFAULT now(),
  usermodifiedid integer NOT NULL,
  datemodified timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT alertaconsolidado_pkey PRIMARY KEY (uuid_consolidadoid)
);
CREATE TABLE joysense.asociacion (
  localizacionid integer NOT NULL,
  id_device character varying NOT NULL,
  statusid integer NOT NULL DEFAULT 1 CHECK (statusid = ANY (ARRAY[0, 1])),
  usercreatedid integer NOT NULL,
  datecreated timestamp with time zone NOT NULL DEFAULT now(),
  usermodifiedid integer NOT NULL,
  datemodified timestamp with time zone NOT NULL DEFAULT now(),
  asociacionid bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  CONSTRAINT asociacion_pkey PRIMARY KEY (asociacionid),
  CONSTRAINT fk_asociacion_localizacion FOREIGN KEY (localizacionid) REFERENCES joysense.localizacion(localizacionid)
);
CREATE TABLE joysense.audit_log_umbral (
  auditid bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  umbralid bigint NOT NULL,
  old_minimo double precision,
  new_minimo double precision,
  old_maximo double precision,
  new_maximo double precision,
  old_criticidadid integer,
  new_criticidadid integer,
  accion character varying NOT NULL CHECK (accion::text = ANY (ARRAY['INSERT'::character varying, 'UPDATE'::character varying, 'DELETE'::character varying]::text[])),
  modified_by integer NOT NULL,
  modified_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT audit_log_umbral_pkey PRIMARY KEY (auditid),
  CONSTRAINT fk_audit_log_umbral_umbral FOREIGN KEY (umbralid) REFERENCES joysense.umbral(umbralid)
);
CREATE TABLE joysense.codigotelefono (
  codigotelefonoid integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  codigotelefono character varying NOT NULL,
  paistelefono character varying NOT NULL,
  statusid integer NOT NULL DEFAULT 1 CHECK (statusid = ANY (ARRAY[0, 1])),
  usercreatedid integer NOT NULL,
  datecreated timestamp with time zone NOT NULL DEFAULT now(),
  usermodifiedid integer NOT NULL,
  datemodified timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT codigotelefono_pkey PRIMARY KEY (codigotelefonoid)
);
CREATE TABLE joysense.contacto (
  contactoid integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  usuarioid integer NOT NULL,
  codigotelefonoid integer NOT NULL,
  celular character varying NOT NULL,
  statusid integer NOT NULL DEFAULT 1 CHECK (statusid = ANY (ARRAY[0, 1])),
  usercreatedid integer NOT NULL,
  datecreated timestamp with time zone NOT NULL DEFAULT now(),
  usermodifiedid integer NOT NULL,
  datemodified timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT contacto_pkey PRIMARY KEY (contactoid),
  CONSTRAINT fk_contacto_usuario FOREIGN KEY (usuarioid) REFERENCES joysense.usuario(usuarioid),
  CONSTRAINT fk_contacto_codigotelefono FOREIGN KEY (codigotelefonoid) REFERENCES joysense.codigotelefono(codigotelefonoid)
);
CREATE TABLE joysense.correo (
  correoid integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  usuarioid integer NOT NULL,
  correo character varying NOT NULL,
  statusid integer NOT NULL DEFAULT 1 CHECK (statusid = ANY (ARRAY[0, 1])),
  usercreatedid integer NOT NULL,
  datecreated timestamp with time zone NOT NULL DEFAULT now(),
  usermodifiedid integer NOT NULL,
  datemodified timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT correo_pkey PRIMARY KEY (correoid),
  CONSTRAINT fk_correo_usuario FOREIGN KEY (usuarioid) REFERENCES joysense.usuario(usuarioid)
);
CREATE TABLE joysense.criticidad (
  criticidadid integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  criticidad character varying NOT NULL UNIQUE,
  grado integer NOT NULL,
  frecuencia integer NOT NULL DEFAULT 1,
  escalamiento integer NOT NULL DEFAULT 2,
  escalon integer NOT NULL,
  statusid integer NOT NULL DEFAULT 1 CHECK (statusid = ANY (ARRAY[0, 1])),
  usercreatedid integer NOT NULL,
  datecreated timestamp with time zone NOT NULL DEFAULT now(),
  usermodifiedid integer NOT NULL,
  datemodified timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT criticidad_pkey PRIMARY KEY (criticidadid)
);
CREATE TABLE joysense.empresa (
  empresaid integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  paisid integer NOT NULL,
  empresa character varying NOT NULL,
  empresabrev character varying NOT NULL,
  statusid integer NOT NULL DEFAULT 1 CHECK (statusid = ANY (ARRAY[0, 1])),
  usercreatedid integer NOT NULL,
  datecreated timestamp with time zone NOT NULL DEFAULT now(),
  usermodifiedid integer NOT NULL,
  datemodified timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT empresa_pkey PRIMARY KEY (empresaid),
  CONSTRAINT fk_empresa_pais FOREIGN KEY (paisid) REFERENCES joysense.pais(paisid)
);
CREATE TABLE joysense.entidad (
  entidadid integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  entidad character varying NOT NULL,
  statusid integer NOT NULL DEFAULT 1 CHECK (statusid = ANY (ARRAY[0, 1])),
  usercreatedid integer NOT NULL,
  datecreated timestamp with time zone NOT NULL DEFAULT now(),
  usermodifiedid integer NOT NULL,
  datemodified timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT entidad_pkey PRIMARY KEY (entidadid)
);
CREATE TABLE joysense.entidad_localizacion (
  entidadid integer NOT NULL,
  localizacionid integer NOT NULL,
  statusid integer NOT NULL DEFAULT 1 CHECK (statusid = ANY (ARRAY[0, 1])),
  usercreatedid integer NOT NULL,
  datecreated timestamp with time zone NOT NULL DEFAULT now(),
  usermodifiedid integer NOT NULL,
  datemodified timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT entidad_localizacion_pkey PRIMARY KEY (entidadid, localizacionid),
  CONSTRAINT fk_entidad_localizacion_localizacion FOREIGN KEY (localizacionid) REFERENCES joysense.localizacion(localizacionid),
  CONSTRAINT fk_entidad_localizacion_entidad FOREIGN KEY (entidadid) REFERENCES joysense.entidad(entidadid)
);
CREATE TABLE joysense.fundo (
  fundoid integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  empresaid integer NOT NULL,
  fundo character varying NOT NULL,
  fundoabrev character varying NOT NULL,
  statusid integer NOT NULL DEFAULT 1 CHECK (statusid = ANY (ARRAY[0, 1])),
  usercreatedid integer NOT NULL,
  datecreated timestamp with time zone NOT NULL DEFAULT now(),
  usermodifiedid integer NOT NULL,
  datemodified timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT fundo_pkey PRIMARY KEY (fundoid),
  CONSTRAINT fk_fundo_empresa FOREIGN KEY (empresaid) REFERENCES joysense.empresa(empresaid)
);
CREATE TABLE joysense.localizacion (
  localizacionid integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  nodoid bigint NOT NULL,
  sensorid integer NOT NULL,
  metricaid integer NOT NULL,
  latitud numeric,
  longitud numeric,
  referencia character varying,
  statusid integer NOT NULL DEFAULT 1 CHECK (statusid = ANY (ARRAY[0, 1])),
  usercreatedid integer NOT NULL,
  datecreated timestamp with time zone NOT NULL DEFAULT now(),
  usermodifiedid integer NOT NULL,
  datemodified timestamp with time zone NOT NULL DEFAULT now(),
  localizacion character varying NOT NULL,
  CONSTRAINT localizacion_pkey PRIMARY KEY (localizacionid),
  CONSTRAINT fk_localizacion_nodo FOREIGN KEY (nodoid) REFERENCES joysense.nodo(nodoid),
  CONSTRAINT fk_localizacion_metricasensor FOREIGN KEY (sensorid) REFERENCES joysense.metricasensor(sensorid),
  CONSTRAINT fk_localizacion_metricasensor FOREIGN KEY (metricaid) REFERENCES joysense.metricasensor(sensorid),
  CONSTRAINT fk_localizacion_metricasensor FOREIGN KEY (sensorid) REFERENCES joysense.metricasensor(metricaid),
  CONSTRAINT fk_localizacion_metricasensor FOREIGN KEY (metricaid) REFERENCES joysense.metricasensor(metricaid)
);
CREATE TABLE joysense.medicion (
  medicionid bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  localizacionid integer NOT NULL,
  fecha timestamp with time zone NOT NULL,
  medicion double precision NOT NULL,
  usercreatedid integer NOT NULL,
  datecreated timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT medicion_pkey PRIMARY KEY (medicionid),
  CONSTRAINT fk_medicion_localizacion FOREIGN KEY (localizacionid) REFERENCES joysense.localizacion(localizacionid)
);
CREATE TABLE joysense.mensaje (
  uuid_origen uuid NOT NULL,
  contactoid integer NOT NULL,
  tipo_origen character varying NOT NULL,
  mensaje character varying NOT NULL,
  fecha timestamp with time zone NOT NULL DEFAULT now(),
  statusid integer NOT NULL DEFAULT 1 CHECK (statusid = ANY (ARRAY['-1'::integer, 0, 1])),
  usercreatedid integer NOT NULL,
  datecreated timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT mensaje_pkey PRIMARY KEY (uuid_origen, contactoid),
  CONSTRAINT fk_mensaje_contacto FOREIGN KEY (contactoid) REFERENCES joysense.contacto(contactoid)
);
CREATE TABLE joysense.metrica (
  metricaid integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  metrica character varying NOT NULL UNIQUE,
  unidad character varying NOT NULL,
  statusid integer NOT NULL DEFAULT 1 CHECK (statusid = ANY (ARRAY[0, 1])),
  usercreatedid integer NOT NULL,
  datecreated timestamp with time zone NOT NULL DEFAULT now(),
  usermodifiedid integer NOT NULL,
  datemodified timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT metrica_pkey PRIMARY KEY (metricaid)
);
CREATE TABLE joysense.metricasensor (
  sensorid integer NOT NULL,
  metricaid integer NOT NULL,
  statusid integer NOT NULL DEFAULT 1 CHECK (statusid = ANY (ARRAY[0, 1])),
  usercreatedid integer NOT NULL,
  usermodifiedid integer NOT NULL,
  datecreated timestamp with time zone NOT NULL DEFAULT now(),
  datemodified timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT metricasensor_pkey PRIMARY KEY (sensorid, metricaid),
  CONSTRAINT fk_metricadispositivo_metrica FOREIGN KEY (metricaid) REFERENCES joysense.metrica(metricaid),
  CONSTRAINT fk_metricasensor_sensor FOREIGN KEY (sensorid) REFERENCES joysense.sensor(sensorid)
);
CREATE TABLE joysense.nodo (
  nodoid bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  nodo character varying NOT NULL,
  descripcion character varying,
  statusid integer NOT NULL DEFAULT 1 CHECK (statusid = ANY (ARRAY[0, 1])),
  usercreatedid integer NOT NULL,
  datecreated timestamp with time zone NOT NULL DEFAULT now(),
  usermodifiedid integer NOT NULL,
  datemodified timestamp with time zone NOT NULL DEFAULT now(),
  ubicacionid integer NOT NULL,
  CONSTRAINT nodo_pkey PRIMARY KEY (nodoid),
  CONSTRAINT fk_nodo_ubicacion FOREIGN KEY (ubicacionid) REFERENCES joysense.ubicacion(ubicacionid)
);
CREATE TABLE joysense.pais (
  paisid integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  pais character varying NOT NULL UNIQUE,
  paisabrev character varying NOT NULL UNIQUE,
  statusid integer NOT NULL DEFAULT 1 CHECK (statusid = ANY (ARRAY[0, 1])),
  usercreatedid integer NOT NULL,
  datecreated timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  usermodifiedid integer NOT NULL,
  datemodified timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pais_pkey PRIMARY KEY (paisid)
);
CREATE TABLE joysense.perfil (
  perfilid integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  perfil character varying NOT NULL UNIQUE,
  nivel integer NOT NULL DEFAULT 0,
  jefeid integer,
  statusid integer NOT NULL DEFAULT 1 CHECK (statusid = ANY (ARRAY[0, 1])),
  usercreatedid integer NOT NULL,
  datecreated timestamp with time zone NOT NULL DEFAULT now(),
  usermodifiedid integer NOT NULL,
  datemodified timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT perfil_pkey PRIMARY KEY (perfilid),
  CONSTRAINT fk_perfil_jefe FOREIGN KEY (jefeid) REFERENCES joysense.perfil(perfilid)
);
CREATE TABLE joysense.perfil_geografia_permiso (
  permisoid bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  perfilid integer NOT NULL,
  paisid integer,
  empresaid integer,
  fundoid integer,
  ubicacionid integer,
  puede_ver boolean NOT NULL DEFAULT false,
  puede_insertar boolean NOT NULL DEFAULT false,
  puede_actualizar boolean NOT NULL DEFAULT false,
  statusid integer NOT NULL DEFAULT 1,
  usercreatedid integer NOT NULL,
  datecreated timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT perfil_geografia_permiso_pkey PRIMARY KEY (permisoid),
  CONSTRAINT perfil_geografia_permiso_perfilid_fkey FOREIGN KEY (perfilid) REFERENCES joysense.perfil(perfilid)
);
CREATE TABLE joysense.perfilumbral (
  perfilid integer NOT NULL,
  umbralid bigint NOT NULL,
  statusid integer NOT NULL DEFAULT 1 CHECK (statusid = ANY (ARRAY[0, 1])),
  usercreatedid integer NOT NULL,
  datecreated timestamp with time zone NOT NULL DEFAULT now(),
  usermodifiedid integer NOT NULL,
  datemodified timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT perfilumbral_pkey PRIMARY KEY (perfilid, umbralid),
  CONSTRAINT fk_perfilumbral_perfil FOREIGN KEY (perfilid) REFERENCES joysense.perfil(perfilid),
  CONSTRAINT fk_perfilumbral_umbral FOREIGN KEY (umbralid) REFERENCES joysense.umbral(umbralid)
);
CREATE TABLE joysense.regla (
  reglaid bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  nombre text NOT NULL,
  prioridad integer NOT NULL DEFAULT 1,
  statusid integer NOT NULL DEFAULT 1,
  usercreatedid integer NOT NULL,
  datecreated timestamp with time zone NOT NULL DEFAULT now(),
  usermodifiedid integer NOT NULL,
  datemodified timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT regla_pkey PRIMARY KEY (reglaid)
);
CREATE TABLE joysense.regla_ambito (
  regla_ambitoid bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  reglaid bigint,
  paisid bigint,
  empresaid bigint,
  fundoid bigint,
  ubicacionid bigint,
  nodoid bigint,
  statusid integer NOT NULL DEFAULT 1,
  usercreatedid integer NOT NULL,
  datecreated timestamp with time zone NOT NULL DEFAULT now(),
  usermodifiedid integer NOT NULL,
  datemodified timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT regla_ambito_pkey PRIMARY KEY (regla_ambitoid),
  CONSTRAINT regla_ambito_reglaid_fkey FOREIGN KEY (reglaid) REFERENCES joysense.regla(reglaid)
);
CREATE TABLE joysense.regla_perfil (
  regla_perfilid bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  reglaid bigint NOT NULL,
  perfilid bigint NOT NULL,
  statusid integer NOT NULL DEFAULT 1,
  usercreatedid integer NOT NULL,
  datecreated timestamp with time zone NOT NULL DEFAULT now(),
  usermodifiedid integer NOT NULL,
  datemodified timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT regla_perfil_pkey PRIMARY KEY (regla_perfilid),
  CONSTRAINT regla_perfil_reglaid_fkey FOREIGN KEY (reglaid) REFERENCES joysense.regla(reglaid),
  CONSTRAINT regla_perfil_perfilid_fkey FOREIGN KEY (perfilid) REFERENCES joysense.perfil(perfilid)
);
CREATE TABLE joysense.regla_umbral (
  regla_umbralid bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  reglaid bigint NOT NULL,
  umbralid bigint NOT NULL,
  operador_logico text NOT NULL DEFAULT 'AND'::text,
  agrupador_inicio boolean NOT NULL DEFAULT false,
  agrupador_fin boolean NOT NULL DEFAULT false,
  orden integer NOT NULL,
  statusid integer NOT NULL DEFAULT 1,
  usercreatedid integer NOT NULL,
  datecreated timestamp with time zone NOT NULL DEFAULT now(),
  usermodifiedid integer NOT NULL,
  datemodified timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT regla_umbral_pkey PRIMARY KEY (regla_umbralid),
  CONSTRAINT regla_umbral_reglaid_fkey FOREIGN KEY (reglaid) REFERENCES joysense.regla(reglaid),
  CONSTRAINT regla_umbral_umbralid_fkey FOREIGN KEY (umbralid) REFERENCES joysense.umbral(umbralid)
);
CREATE TABLE joysense.sensor (
  sensorid integer NOT NULL,
  tipoid integer NOT NULL,
  statusid integer NOT NULL DEFAULT 1 CHECK (statusid = ANY (ARRAY[0, 1])),
  usercreatedid integer NOT NULL,
  datecreated timestamp with time zone NOT NULL DEFAULT now(),
  usermodifiedid integer NOT NULL,
  datemodified timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT sensor_pkey PRIMARY KEY (sensorid),
  CONSTRAINT fk_sensor_tipo FOREIGN KEY (tipoid) REFERENCES joysense.tipo(tipoid)
);
CREATE TABLE joysense.sensor_valor (
  id_device character varying NOT NULL,
  fecha timestamp with time zone NOT NULL,
  valor double precision NOT NULL,
  statusid integer NOT NULL CHECK (statusid = ANY (ARRAY[0, 1])),
  CONSTRAINT sensor_valor_pkey PRIMARY KEY (id_device, fecha)
);
CREATE TABLE joysense.sensor_valor_error (
  sensorvalorerrorid bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  id_device character varying NOT NULL,
  error character varying NOT NULL,
  valor double precision NOT NULL,
  fecha timestamp with time zone NOT NULL,
  statusid integer NOT NULL DEFAULT 1 CHECK (statusid = ANY (ARRAY[0, 1])),
  CONSTRAINT sensor_valor_error_pkey PRIMARY KEY (sensorvalorerrorid)
);
CREATE TABLE joysense.tipo (
  tipoid integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  tipo character varying NOT NULL UNIQUE,
  statusid integer NOT NULL DEFAULT 1 CHECK (statusid = ANY (ARRAY[0, 1])),
  usercreatedid integer NOT NULL,
  datecreated timestamp with time zone NOT NULL DEFAULT now(),
  usermodifiedid integer NOT NULL,
  datemodified timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT tipo_pkey PRIMARY KEY (tipoid)
);
CREATE TABLE joysense.ubicacion (
  ubicacionid integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  fundoid integer NOT NULL,
  ubicacion character varying NOT NULL,
  statusid integer NOT NULL DEFAULT 1 CHECK (statusid = ANY (ARRAY[0, 1])),
  usercreatedid integer NOT NULL,
  datecreated timestamp with time zone NOT NULL DEFAULT now(),
  usermodifiedid integer NOT NULL,
  datemodified timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT ubicacion_pkey PRIMARY KEY (ubicacionid),
  CONSTRAINT fk_ubicacion_fundo FOREIGN KEY (fundoid) REFERENCES joysense.fundo(fundoid)
);
CREATE TABLE joysense.umbral (
  umbralid bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  localizacionid integer NOT NULL,
  criticidadid integer NOT NULL,
  umbral character varying NOT NULL,
  maximo double precision NOT NULL,
  minimo double precision NOT NULL,
  estandar double precision,
  statusid integer NOT NULL DEFAULT 1 CHECK (statusid = ANY (ARRAY[0, 1])),
  usercreatedid integer NOT NULL,
  datecreated timestamp with time zone NOT NULL DEFAULT now(),
  usermodifiedid integer NOT NULL,
  datemodified timestamp with time zone NOT NULL DEFAULT now(),
  operador text NOT NULL,
  inversion boolean DEFAULT false,
  CONSTRAINT umbral_pkey PRIMARY KEY (umbralid),
  CONSTRAINT fk_umbral_localizacion FOREIGN KEY (localizacionid) REFERENCES joysense.localizacion(localizacionid),
  CONSTRAINT fk_umbral_criticidad FOREIGN KEY (criticidadid) REFERENCES joysense.criticidad(criticidadid)
);
CREATE TABLE joysense.usuario (
  usuarioid integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  login character varying NOT NULL UNIQUE,
  lastname character varying NOT NULL,
  firstname character varying NOT NULL,
  password_hash text NOT NULL,
  statusid integer NOT NULL DEFAULT 1 CHECK (statusid = ANY (ARRAY[0, 1])),
  usercreatedid integer NOT NULL,
  datecreated timestamp with time zone NOT NULL DEFAULT now(),
  usermodifiedid integer NOT NULL,
  datemodified timestamp with time zone NOT NULL DEFAULT now(),
  useruuid uuid,
  CONSTRAINT usuario_pkey PRIMARY KEY (usuarioid),
  CONSTRAINT fk_usuario_auth_user FOREIGN KEY (useruuid) REFERENCES auth.users(id)
);
CREATE TABLE joysense.usuarioperfil (
  usuarioid integer NOT NULL,
  perfilid integer NOT NULL,
  statusid integer NOT NULL DEFAULT 1 CHECK (statusid = ANY (ARRAY[0, 1])),
  usercreatedid integer NOT NULL,
  datecreated timestamp with time zone NOT NULL DEFAULT now(),
  usermodifiedid integer NOT NULL,
  datemodified timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT usuarioperfil_pkey PRIMARY KEY (usuarioid, perfilid),
  CONSTRAINT fk_usuarioperfil_usuario FOREIGN KEY (usuarioid) REFERENCES joysense.usuario(usuarioid),
  CONSTRAINT fk_usuarioperfil_perfil FOREIGN KEY (perfilid) REFERENCES joysense.perfil(perfilid)
);