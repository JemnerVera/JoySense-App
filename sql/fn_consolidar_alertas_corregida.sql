-- =====================================================
-- FUNCIÓN CORREGIDA: fn_consolidar_alertas
-- =====================================================
-- Propósito: Consolidar alertas de la última hora y gestionar envíos/escalamientos
-- Tipo: Stored Procedure (void)
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
      fechaultimacorrida = v_hour_end,
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
      fechainicio, fechaultimo, fechaultimacorrida,
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
    datemodified   = now()
  WHERE ac.statusid = 1
    AND ac.fechaultimacorrida IS DISTINCT FROM v_hour_end
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

      -- CORREGIDO: Buscar nivel en perfil, no en usuario
      SELECT MAX(p.nivel)
      INTO v_nivel_max
      FROM sense.perfilumbral pu
      JOIN sense.perfil p ON p.perfilid = pu.perfilid
      JOIN sense.usuarioperfil up ON up.perfilid = pu.perfilid AND up.statusid = 1
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
        AND p.nivel = v_nivel_max;

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
              p.perfil, us.firstname, us.lastname
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
          AND p.nivel >= (v_nivel_base - 1)
          AND p.nivel < r.nivelnotificado;

        UPDATE sense.alertaconsolidado
        SET nivelescalamiento = v_nivel_base - 1
        WHERE consolidadoid = r.consolidadoid;
      END IF;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;
