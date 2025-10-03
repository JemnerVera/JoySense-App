-- =====================================================
-- FUNCIONES Y TRIGGERS PARA SISTEMA DE ALERTAS
-- =====================================================
-- Fecha: 2025-10-02
-- Propósito: Funciones y triggers para consolidación de alertas y WhatsApp

-- =====================================================
-- 1. FUNCIÓN: fn_auditar_umbral
-- =====================================================
-- Propósito: Auditar cambios en la tabla umbral
-- Tipo: Trigger Function
-- Invoker: Invoker

CREATE OR REPLACE FUNCTION sense.fn_auditar_umbral()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO sense.audit_log_umbral(umbralid,new_minimo,new_maximo,new_criticidadid,modified_by,accion)
    VALUES (NEW.umbralid, NEW.minimo, NEW.maximo, NEW.criticidadid, NEW.usermodifiedid, 'INSERT');
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO sense.audit_log_umbral(umbralid,old_minimo,new_minimo,old_maximo,new_maximo,old_criticidadid,new_criticidadid,modified_by,accion)
    VALUES (NEW.umbralid, OLD.minimo, NEW.minimo, OLD.maximo, NEW.maximo, OLD.criticidadid, NEW.criticidadid, NEW.usermodifiedid, 'UPDATE');
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 2. FUNCIÓN: fn_consolidar_alertas
-- =====================================================
-- Propósito: Consolidar alertas similares y gestionar envío de mensajes
-- Tipo: Function
-- Retorno: void
-- Definer: Definer

CREATE OR REPLACE FUNCTION sense.fn_consolidar_alertas()
RETURNS void AS $$
DECLARE
  v_now        timestamptz := now();
  v_hour_end   timestamptz := date_trunc('hour', v_now);
  v_hour_start timestamptz := v_hour_end - interval '1 hour';
  v_frecuencia integer;
  v_escalamiento integer;
  v_ultimo     timestamptz;
  v_nivel_max  integer;
  v_nivel_base integer;
  v_max_length integer := 215; -- longitud máxima de los mensajes
  r RECORD;
BEGIN
  ----------------------------------------------------------------
  -- 1) Consolidación de la última hora
  ----------------------------------------------------------------
  WITH ultimas AS (
    SELECT
      a.umbralid,
      MIN(a.fecha) AS min_fecha,
      MAX(a.fecha) AS max_fecha,
      COUNT(*)     AS cnt
    FROM sense.alerta a
    WHERE a.fecha >= v_hour_start
      AND a.fecha  < v_hour_end
    GROUP BY a.umbralid
  ),
  ult_med AS (
    SELECT
      x.umbralid,
      m.medicion AS ultima_medicion
    FROM (
      SELECT
        a.umbralid,
        a.medicionid,
        ROW_NUMBER() OVER (
          PARTITION BY a.umbralid
          ORDER BY m.fecha DESC
        ) AS rn
      FROM sense.alerta a
      JOIN sense.medicion m ON m.medicionid = a.medicionid
      WHERE a.fecha >= v_hour_start
        AND a.fecha  < v_hour_end
    ) x
    JOIN sense.medicion m ON m.medicionid = x.medicionid
    WHERE x.rn = 1
  ),
  merged AS (
    SELECT u.umbralid, u.min_fecha, u.max_fecha, u.cnt, um.ultima_medicion
    FROM ultimas u
    JOIN ult_med um USING (umbralid)
  ),
  upserted AS (
    UPDATE sense.alertaconsolidado ac
    SET
      fechaultimo     = GREATEST(ac.fechaultimo, m.max_fecha),
      ultimacorrida   = v_hour_end,
      contador        = ac.contador + m.cnt,
      ultimamedicion  = m.ultima_medicion,
      usermodifiedid  = COALESCE(ac.usermodifiedid, 1),
      datemodified    = now()
    FROM merged m
    WHERE ac.umbralid = m.umbralid
      AND ac.statusid = 1
    RETURNING ac.consolidadoid, ac.umbralid
  ),
  inserted AS (
    INSERT INTO sense.alertaconsolidado (
      umbralid,
      fechainicio, fechaultimo, ultimacorrida,
      ultimamedicion, contador,
      statusid,
      usercreatedid, datecreated,
      usermodifiedid, datemodified
    )
    SELECT
      m.umbralid,
      m.min_fecha, m.max_fecha, v_hour_end,
      m.ultima_medicion, m.cnt,
      1,
      1, now(),
      1, now()
    FROM merged m
    WHERE NOT EXISTS (
      SELECT 1
      FROM sense.alertaconsolidado ac
      WHERE ac.umbralid = m.umbralid
        AND ac.statusid = 1
    )
    RETURNING consolidadoid, umbralid
  )
  UPDATE sense.alertaconsolidado ac
  SET
    statusid       = 0,
    usermodifiedid = 1,
    datemodified   = now(),
    fechafin       = v_hour_end
  WHERE ac.statusid = 1
    AND ac.ultimacorrida IS DISTINCT FROM v_hour_end
    AND NOT EXISTS (SELECT 1 FROM upserted u WHERE u.consolidadoid = ac.consolidadoid)
    AND NOT EXISTS (SELECT 1 FROM inserted i WHERE i.consolidadoid = ac.consolidadoid);

  ----------------------------------------------------------------
  -- 2) Revisión de criticidad: mensajes por frecuencia + escalamiento
  ----------------------------------------------------------------
  FOR r IN
    SELECT ac.consolidadoid, ac.umbralid, ac.fechainicio, ac.ultimoenvio,
           ac.ultimamedicion, ac.ultimoescalamiento, ac.nivelnotificado, ac.nivelescalamiento,
           c.frecuencia, c.escalamiento, c.escalon,
           u.minimo, u.maximo,
           t.tipo, e.entidad,
           me.metrica, no.nodo,
           f.fundo, ub.ubicacion, loc.referencia, loc.latitud, loc.longitud,
           cr.criticidad
    FROM sense.alertaconsolidado ac
    JOIN sense.umbral u ON u.umbralid = ac.umbralid
    JOIN sense.criticidad c ON c.criticidadid = u.criticidadid
    JOIN sense.tipo t ON t.tipoid = u.tipoid
    JOIN sense.entidad e ON e.entidadid = t.entidadid
    JOIN sense.metrica me ON me.metricaid = u.metricaid
    JOIN sense.localizacion loc ON loc.ubicacionid = u.ubicacionid
                               AND loc.nodoid = u.nodoid
                               AND loc.statusid = 1
    JOIN sense.nodo no ON no.nodoid = u.nodoid
    JOIN sense.ubicacion ub ON ub.ubicacionid = u.ubicacionid
    JOIN sense.fundo f ON f.fundoid = ub.fundoid
    JOIN sense.criticidad cr ON cr.criticidadid = u.criticidadid
    WHERE ac.statusid = 1
  LOOP
    v_frecuencia := r.frecuencia;
    v_escalamiento := r.escalamiento;
    v_ultimo := r.ultimoenvio;

    ----------------------------------------------------------------
    -- 2.a Envío normal por frecuencia
    ----------------------------------------------------------------
    IF (v_ultimo IS NULL AND EXTRACT(EPOCH FROM (v_now - r.fechainicio))/3600 >= v_frecuencia)
       OR (v_ultimo IS NOT NULL AND EXTRACT(EPOCH FROM (v_now - v_ultimo))/3600 >= v_frecuencia) THEN

      UPDATE sense.alertaconsolidado
      SET ultimoenvio = v_now,
          usermodifiedid = 1,
          datemodified = now()
      WHERE consolidadoid = r.consolidadoid;

      SELECT MAX(u.nivel)
      INTO v_nivel_max
      FROM sense.perfilumbral pu
      JOIN sense.usuarioperfil up ON up.perfilid = pu.perfilid AND up.statusid = 1
      JOIN sense.usuario u ON u.usuarioid = up.usuarioid
      WHERE pu.umbralid = r.umbralid
        AND pu.statusid = 1;

      INSERT INTO sense.mensaje (
        contactoid, consolidadoid, mensaje, fecha, statusid, usercreatedid, datecreated
      )
      SELECT
        c.contactoid,
        r.consolidadoid,
        LEFT(
          format(
            'Alerta %s [%s-%s], %s de %s en %s con %s=%s %s-%s (%s) [%s, %s]',
            r.criticidad, r.minimo, r.maximo,
            no.nodo, r.entidad, r.tipo,
            me.metrica, r.ultimamedicion,
            f.fundo,
            left(r.ubicacion, length(r.ubicacion) - strpos(reverse(r.ubicacion), '-')),
            r.referencia, r.latitud, r.longitud
          ),
          v_max_length
        ),
        v_now,
        1,
        1,
        now()
      FROM sense.perfilumbral pu
      JOIN sense.usuarioperfil up ON up.perfilid = pu.perfilid AND up.statusid = 1
      JOIN sense.usuario us ON us.usuarioid = up.usuarioid
      JOIN sense.contacto c ON c.usuarioid = us.usuarioid AND c.statusid = 1
      JOIN sense.umbral u ON u.umbralid = pu.umbralid
      JOIN sense.criticidad cr ON cr.criticidadid = u.criticidadid
      JOIN sense.tipo t ON t.tipoid = u.tipoid
      JOIN sense.entidad e ON e.entidadid = t.entidadid
      JOIN sense.metrica me ON me.metricaid = u.metricaid
      JOIN sense.localizacion loc ON loc.ubicacionid = u.ubicacionid
                                 AND loc.nodoid = u.nodoid
                                 AND loc.statusid = 1
      JOIN sense.nodo no ON no.nodoid = u.nodoid
      JOIN sense.ubicacion ub ON ub.ubicacionid = u.ubicacionid
      JOIN sense.fundo f ON f.fundoid = ub.fundoid
      WHERE pu.umbralid = r.umbralid
        AND pu.statusid = 1
        AND us.nivel = v_nivel_max;

      UPDATE sense.alertaconsolidado
      SET nivelnotificado = v_nivel_max
      WHERE consolidadoid = r.consolidadoid;
    END IF;

    ----------------------------------------------------------------
    -- 3) Escalamiento
    ----------------------------------------------------------------
    IF (r.ultimoescalamiento IS NULL AND EXTRACT(EPOCH FROM (v_now - r.fechainicio))/3600 >= v_escalamiento)
       OR (r.ultimoescalamiento IS NOT NULL AND EXTRACT(EPOCH FROM (v_now - r.ultimoescalamiento))/3600 >= v_escalamiento) THEN

      UPDATE sense.alertaconsolidado
      SET ultimoescalamiento = v_now,
          usermodifiedid = 1,
          datemodified = now()
      WHERE consolidadoid = r.consolidadoid;

      v_nivel_base := COALESCE(r.nivelescalamiento, r.nivelnotificado);

      IF (v_nivel_base - 1) >= (r.nivelnotificado - r.escalon) THEN
        INSERT INTO sense.mensaje (
          contactoid, consolidadoid, mensaje, fecha, statusid, usercreatedid, datecreated
        )
        SELECT
          c.contactoid,
          r.consolidadoid,
          LEFT(
            format(
              'Alerta %s [%s - %s], %s de %s en %s con %s = %s, %s-%s (%s) [%s, %s] %s:%s %s',
              r.criticidad, r.minimo, r.maximo,
              no.nodo, r.entidad, r.tipo,
              me.metrica, r.ultimamedicion,
              f.fundo,
              left(r.ubicacion, length(r.ubicacion) - strpos(reverse(r.ubicacion), '-')),
              r.referencia, r.latitud, r.longitud,
              p.perfil, us.nombre, us.apellido
            ),
            v_max_length
          ),
          v_now,
          1,
          1,
          now()
        FROM sense.perfilumbral pu
        JOIN sense.perfil p ON p.perfilid = pu.perfilid
        JOIN sense.usuarioperfil up ON up.perfilid = pu.perfilid AND up.statusid = 1
        JOIN sense.usuario us ON us.usuarioid = up.usuarioid
        JOIN sense.contacto c ON c.usuarioid = us.usuarioid AND c.statusid = 1
        JOIN sense.umbral u ON u.umbralid = pu.umbralid
        JOIN sense.criticidad cr ON cr.criticidadid = u.criticidadid
        JOIN sense.tipo t ON t.tipoid = u.tipoid
        JOIN sense.entidad e ON e.entidadid = t.entidadid
        JOIN sense.metrica me ON me.metricaid = u.metricaid
        JOIN sense.localizacion loc ON loc.ubicacionid = u.ubicacionid
                                   AND loc.nodoid = u.nodoid
                                   AND loc.statusid = 1
        JOIN sense.nodo no ON no.nodoid = u.nodoid
        JOIN sense.ubicacion ub ON ub.ubicacionid = u.ubicacionid
        JOIN sense.fundo f ON f.fundoid = ub.fundoid
        WHERE pu.umbralid = r.umbralid
          AND pu.statusid = 1
          AND us.nivel >= (v_nivel_base - 1)
          AND us.nivel < r.nivelnotificado;

        UPDATE sense.alertaconsolidado
        SET nivelescalamiento = v_nivel_base - 1
        WHERE consolidadoid = r.consolidadoid;
      END IF;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 3. FUNCIÓN: fn_insertar_medicion
-- =====================================================
-- Propósito: Insertar mediciones desde sensor_valor a medicion
-- Tipo: Trigger Function
-- Invoker: Invoker

CREATE OR REPLACE FUNCTION sense.fn_insertar_medicion()
RETURNS TRIGGER AS $$
DECLARE
    v_nodoid bigint;
    v_ubicacionid integer;
BEGIN
    -- Buscar el nodoid correspondiente al texto del nodo (ej: "NODO-01")
    SELECT nodoid INTO v_nodoid
    FROM sense.nodo
    WHERE nodo = NEW.id_device;
    IF v_nodoid IS NULL THEN
        INSERT INTO sense.sensor_valor_error (
            id_tipo_sensor, id_unidad, id_device, valor, fecha, statusid, error
        ) VALUES (
            NEW.id_tipo_sensor, NEW.id_unidad, NEW.id_device, NEW.valor, NEW.fecha, NEW.statusid,
            format('Nodo %s no encontrado en sense.nodo', NEW.id_device)
        );
        RETURN NEW;
    END IF;
    -- Buscar la ubicación activa (statusid = 1) correspondiente al nodoid
    SELECT ubicacionid INTO v_ubicacionid
    FROM sense.localizacion
    WHERE nodoid = v_nodoid AND statusid = 1;
    IF v_ubicacionid IS NULL THEN
        INSERT INTO sense.sensor_valor_error (
            id_tipo_sensor, id_unidad, id_device, valor, fecha, statusid, error
        ) VALUES (
            NEW.id_tipo_sensor, NEW.id_unidad, NEW.id_device, NEW.valor, NEW.fecha, NEW.statusid,
            format('Ubicación activa no encontrada para nodoid %s', v_nodoid)
        );
        RETURN NEW;
    END IF;
    -- Intentar insertar el dato en la tabla medicion
    BEGIN
        INSERT INTO sense.medicion (
            ubicacionid,
            nodoid,
            tipoid,
            metricaid,
            fecha,
            medicion,
            usercreatedid
        ) VALUES (
            v_ubicacionid,
            v_nodoid,
            NEW.id_tipo_sensor,
            NEW.id_unidad,
            NEW.fecha,
            NEW.valor,
            1
        );
    EXCEPTION WHEN OTHERS THEN
        INSERT INTO sense.sensor_valor_error (
            id_tipo_sensor, id_unidad, id_device, valor, fecha, statusid, error
        ) VALUES (
            NEW.id_tipo_sensor, NEW.id_unidad, NEW.id_device, NEW.valor, NEW.fecha, NEW.statusid,
            format('Error al insertar en medicion: %s', SQLERRM)
        );
        RETURN NEW;
    END;
    -- Si se insertó correctamente, marcar statusid = 0
    delete from sense.sensor_valor
    WHERE ctid = NEW.ctid;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 4. FUNCIÓN: fn_medicion_dispara_alerta
-- =====================================================
-- Propósito: Disparar alertas cuando una medición supera umbrales
-- Tipo: Trigger Function
-- Definer: Definer

CREATE OR REPLACE FUNCTION sense.fn_medicion_dispara_alerta()
RETURNS TRIGGER AS $$
BEGIN
  /*
    NEW: medicionid, ubicacionid, nodoid, tipoid, metricaid,
         fecha (timestamptz), medicion (double precision)
  */
  WITH umbrales_fuera AS (
    SELECT u.umbralid, u.minimo, u.maximo, u.umbral
    FROM sense.umbral u
    WHERE u.statusid   = 1
      AND u.ubicacionid = NEW.ubicacionid
      AND u.nodoid      = NEW.nodoid
      AND u.tipoid      = NEW.tipoid
      AND u.metricaid   = NEW.metricaid
      AND (NEW.medicion < u.minimo OR NEW.medicion > u.maximo)
  )
  INSERT INTO sense.alerta (umbralid, medicionid, fecha, usercreatedid)
  SELECT
    uf.umbralid,
    NEW.medicionid,
    NEW.fecha,
    COALESCE(NEW.usercreatedid, 1)
  FROM umbrales_fuera uf
  ON CONFLICT DO NOTHING;
  -- Para AFTER triggers el valor devuelto se ignora; puedes usar RETURN NEW o RETURN NULL.
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 5. TRIGGERS
-- =====================================================

-- Trigger para auditar cambios en umbral
CREATE TRIGGER trg_auditar_umbral
    AFTER INSERT OR UPDATE ON sense.umbral
    FOR EACH ROW
    EXECUTE FUNCTION sense.fn_auditar_umbral();

-- Trigger para enviar WhatsApp cuando se inserta un mensaje
CREATE TRIGGER trg_enviar_whatspp
    AFTER INSERT ON sense.mensaje
    FOR EACH ROW
    EXECUTE FUNCTION http_request();

-- Trigger para validar umbral antes de insertar/actualizar
CREATE TRIGGER trg_validar_umbral
    BEFORE INSERT OR UPDATE ON sense.umbral
    FOR EACH ROW
    EXECUTE FUNCTION sense.fn_validar_umbral_minimo_maximo();

-- Trigger para insertar medición desde sensor_valor
CREATE TRIGGER trg_insertar_medicion
    AFTER INSERT ON sense.sensor_valor
    FOR EACH ROW
    EXECUTE FUNCTION sense.fn_insertar_medicion();

-- Trigger para disparar alertas cuando se inserta una medición
CREATE TRIGGER trg_medicion_dispara_alerta
    AFTER INSERT ON sense.medicion
    FOR EACH ROW
    EXECUTE FUNCTION sense.fn_medicion_dispara_alerta();

-- Trigger para guardar solo un conjunto activo de entidades por nodo
CREATE TRIGGER trg_guard_one_active_entity_set_per_nodo
    BEFORE INSERT OR UPDATE ON sense.sensor
    FOR EACH ROW
    EXECUTE FUNCTION sense.fn_guard_one_active_entity_set_per_nodo();

-- =====================================================
-- 5. FUNCIÓN: fn_validar_umbral_minimo_maximo
-- =====================================================
-- Propósito: Validar que el valor mínimo sea menor que el máximo en umbral
-- Tipo: Trigger Function
-- Invoker: Invoker

CREATE OR REPLACE FUNCTION sense.fn_validar_umbral_minimo_maximo()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.minimo >= NEW.maximo THEN
        RAISE EXCEPTION 'El valor mínimo (%s) debe ser menor que el valor máximo (%s)', NEW.minimo, NEW.maximo;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 6. FUNCIÓN: fn_guard_one_active_entity_set_per_nodo
-- =====================================================
-- Propósito: Validar que solo haya un conjunto activo de entidades por nodo
-- Tipo: Trigger Function
-- Definer: Definer

CREATE OR REPLACE FUNCTION sense.fn_guard_one_active_entity_set_per_nodo()
RETURNS TRIGGER AS $$
DECLARE
  v_entidad_new integer;
BEGIN
  -- Solo valida cuando la fila va a quedar ACTIVA
  IF NOT (
    (TG_OP = 'INSERT' AND NEW.statusid = 1)
    OR (TG_OP = 'UPDATE' AND NEW.statusid = 1 AND COALESCE(OLD.statusid, -1) <> 1)
  ) THEN
    RETURN NEW;
  END IF;

  -- Entidad del tipo nuevo
  SELECT t.entidadid
    INTO v_entidad_new
  FROM sense.tipo t
  WHERE t.tipoid = NEW.tipoid
    AND t.statusid IN (0,1);   -- admite tipo activo o histórico válido
  IF v_entidad_new IS NULL THEN
    RAISE EXCEPTION 'Tipo % no existe o está inactivo en sense.tipo', NEW.tipoid;
  END IF;

  -- Serializar operaciones por nodo para evitar carreras
  PERFORM pg_advisory_xact_lock( ('sense.sensor'::regclass::oid::bigint << 32) | NEW.nodoid );

  -- ¿Existe YA algún sensor ACTIVO del mismo nodo pero de OTRA entidad?
  IF EXISTS (
    SELECT 1
    FROM sense.sensor s
    JOIN sense.tipo tt ON tt.tipoid = s.tipoid
    WHERE s.nodoid   = NEW.nodoid
      AND s.statusid = 1
      AND tt.entidadid <> v_entidad_new
      -- excluir la propia fila si es UPDATE del mismo registro
      AND NOT (TG_OP = 'UPDATE' AND s.nodoid = OLD.nodoid AND s.tipoid = OLD.tipoid)
  ) THEN
    RAISE EXCEPTION
      'Para nodoid=% ya existen sensores ACTIVOS de otra entidad. Desactive primero los actuales antes de activar los de entidad %.',
      NEW.nodoid, v_entidad_new
    USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--
-- =====================================================
-- WEBHOOK DE WHATSAPP (CONFIGURADO EN SUPABASE):
-- =====================================================
-- Nombre: trg_enviar_whatspp
-- Tabla: sense.mensaje
-- Eventos: INSERT, UPDATE
-- Tipo: HTTP Request
-- URL: Supabase Edge Function "enviar-mensaje"
-- Método: POST
-- Timeout: 5000ms
-- Headers:
--   - Content-type: application/json
--   - Authorization: Bearer [TOKEN]
--
-- =====================================================
-- NOTAS IMPORTANTES:
-- =====================================================
-- 1. Estas funciones requieren que existan las siguientes tablas:
--    - sense.audit_log_umbral (para auditoría)
--    - sense.sensor_valor (tabla de entrada de datos)
--    - sense.sensor_valor_error (tabla de errores)
--    - sense.sensor (tabla de sensores)
--
-- 2. Los triggers deben crearse después de estas funciones
--
-- 3. La función fn_consolidar_alertas debe ejecutarse periódicamente
--    (ej: cada hora) mediante un cron job o similar
--
-- 4. Verificar que todas las tablas referenciadas existan y tengan
--    los campos correctos antes de ejecutar
--
-- 5. El webhook de WhatsApp está configurado en Supabase y se ejecuta
--    automáticamente cuando se inserta o actualiza un mensaje
--
-- 6. La Edge Function "enviar-mensaje" debe estar desplegada en Supabase
--    para que el webhook funcione correctamente
