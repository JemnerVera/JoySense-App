# 🔧 Solución: Error de Permisos en Schema joysense

## Problema

La Edge Function está intentando acceder al schema `joysense` pero recibe el error:
```
permission denied for schema joysense
```

## Causa

La clave de servicio (`SUPABASE_SERVICE_ROLE_KEY`) puede no tener permisos explícitos para acceder al schema `joysense`, o la configuración del cliente de Supabase no está funcionando correctamente.

## Solución 1: Usar Schema Público con Referencia Explícita (Recomendado)

Si las tablas `contacto` y `usuario` están en el schema `public` o si puedes acceder a ellas desde el schema público, usa esta versión:

```javascript
import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js";

serve(async (req) => {
  try {
    const payload = await req.json();
    const record = payload.record;
    
    if (!record) {
      return new Response("No hay datos en record", {
        status: 400
      });
    }
    
    // ✅ Cliente de Supabase SIN especificar schema (usa public por defecto)
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL"), 
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
    );
    
    // Obtener contacto (usando referencia explícita si es necesario)
    const { data: contactoSimple, error: errorContacto } = await supabase
      .from("contacto")
      .select("celular, usuarioid")
      .eq("contactoid", record.contactoid)
      .single();
    
    if (errorContacto || !contactoSimple) {
      console.error("Error obteniendo contacto:", errorContacto);
      return new Response("No se encontró contacto", {
        status: 400
      });
    }
    
    // Obtener usuario por separado
    const { data: usuario, error: errorUsuario } = await supabase
      .from("usuario")
      .select("firstname")
      .eq("usuarioid", contactoSimple.usuarioid)
      .single();
    
    if (errorUsuario || !usuario) {
      console.error("Error obteniendo usuario:", errorUsuario);
      return new Response("No se encontró usuario", {
        status: 400
      });
    }
    
    // JSON esperado por la API
    const body = {
      destinatario: contactoSimple.celular,
      plantilla: "",
      mensaje: {
        "1": `${usuario.firstname}`,
        "2": record.mensaje
      }
    };
    
    // Token desde variable de entorno
    const TOKEN = Deno.env.get("WHATSAPP_TOKEN");
    if (!TOKEN) {
      console.error("Token no definido en variable de entorno WHATSAPP_TOKEN");
      return new Response("Token no configurado", {
        status: 500
      });
    }
    
    // Enviar al endpoint público
    const resp = await fetch("https://agromigiva-mensajeria-prod.azurewebsites.net/Twilio/EnviarMensaje", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${TOKEN}`
      },
      body: JSON.stringify(body)
    });
    
    if (!resp.ok) {
      const errorText = await resp.text();
      console.error("Respuesta del API WhatsApp:", resp.status, errorText);
      return new Response(JSON.stringify({ error: errorText, status: resp.status }), {
        status: 500
      });
    }
    
    return new Response(JSON.stringify({ ok: true, bodySent: body }), {
      status: 200
    });
  } catch (e) {
    console.error("Excepción en Edge Function:", e);
    return new Response("Error interno", {
      status: 500
    });
  }
});
```

## Solución 2: Usar SQL Directo con RPC (Si las tablas están en joysense)

Si las tablas están en el schema `joysense` y necesitas acceder a ellas, puedes crear una función SQL en la base de datos y llamarla desde la Edge Function:

### Paso 1: Crear función SQL en Supabase

```sql
CREATE OR REPLACE FUNCTION joysense.fn_obtener_contacto_usuario(p_contactoid bigint)
RETURNS TABLE (
  celular text,
  firstname text
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.celular,
    u.firstname
  FROM joysense.contacto c
  JOIN joysense.usuario u ON u.usuarioid = c.usuarioid
  WHERE c.contactoid = p_contactoid
    AND c.statusid = 1
    AND u.statusid = 1;
END;
$$;
```

### Paso 2: Edge Function usando RPC

```javascript
// Obtener contacto y usuario usando función SQL
const { data: resultado, error: errorRPC } = await supabase
  .rpc('fn_obtener_contacto_usuario', {
    p_contactoid: record.contactoid
  });

if (errorRPC || !resultado || resultado.length === 0) {
  console.error("Error obteniendo contacto/usuario:", errorRPC);
  return new Response("No se encontró contacto/usuario", {
    status: 400
  });
}

const contactoData = resultado[0];
```

## Solución 3: Verificar Permisos de la Clave de Servicio

Si las tablas están en `joysense` y quieres usar el schema directamente, necesitas otorgar permisos:

```sql
-- Otorgar permisos a la clave de servicio en el schema joysense
GRANT USAGE ON SCHEMA joysense TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA joysense TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA joysense TO service_role;
```

**⚠️ NOTA:** Esto otorga permisos muy amplios. Asegúrate de que esto sea seguro en tu entorno.

## Recomendación

**Usa la Solución 1** si las tablas `contacto` y `usuario` están accesibles desde el schema público (que es lo más común en Supabase).

Si las tablas están exclusivamente en `joysense`, usa la **Solución 2** (función SQL con `SECURITY DEFINER`).

