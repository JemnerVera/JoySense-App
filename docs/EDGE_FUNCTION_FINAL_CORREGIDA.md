# ✅ Edge Function Final - Versión Corregida con Permisos

## Código Completo para Copiar y Pegar

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
    // La función SQL tiene SECURITY DEFINER y accede a joysense internamente
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL"), 
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
    );
    
    // Obtener contacto y usuario usando función SQL (más seguro y robusto)
    const { data: resultado, error: errorRPC } = await supabase
      .rpc('fn_obtener_contacto_usuario', {
        p_contactoid: record.contactoid
      });
    
    if (errorRPC || !resultado || resultado.length === 0) {
      console.error("Error obteniendo contacto/usuario:", errorRPC);
      return new Response(JSON.stringify({ 
        error: "No se encontró contacto/usuario",
        details: errorRPC 
      }), {
        status: 400
      });
    }
    
    const contactoData = resultado[0];
    
    // Validar que tenemos los datos necesarios
    if (!contactoData.celular || !contactoData.firstname) {
      console.error("Datos incompletos:", contactoData);
      return new Response("Datos de contacto incompletos", {
        status: 400
      });
    }
    
    // JSON esperado por la API
    const body = {
      destinatario: contactoData.celular,
      plantilla: "",
      mensaje: {
        "1": `${contactoData.firstname}`,
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
      return new Response(JSON.stringify({ 
        error: errorText, 
        status: resp.status 
      }), {
        status: 500
      });
    }
    
    const responseData = await resp.json().catch(() => ({ ok: true }));
    
    return new Response(JSON.stringify({ 
      ok: true, 
      bodySent: body,
      apiResponse: responseData
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json"
      }
    });
  } catch (e) {
    console.error("Excepción en Edge Function:", e);
    return new Response(JSON.stringify({ 
      error: "Error interno",
      details: e.message 
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json"
      }
    });
  }
});
```

## Pasos para Implementar

1. **Ejecutar la función SQL** en Supabase SQL Editor:
   - Abre `docs/SOLUCION_PERMISOS_EDGE_FUNCTION.sql`
   - Ejecuta el script completo

2. **Actualizar la Edge Function** en Supabase Dashboard:
   - Ve a Edge Functions → `enviar-mensaje`
   - Reemplaza todo el código con el código de arriba
   - Guarda y despliega

3. **Verificar**:
   - Inserta una nueva medición
   - Verifica los logs de la Edge Function
   - Debe mostrar `200 OK` y el mensaje debe llegar a WhatsApp

## Ventajas de esta Solución

✅ **Segura**: La función SQL usa `SECURITY DEFINER` y `SET search_path`, evitando problemas de permisos  
✅ **Robusta**: Maneja errores de manera explícita  
✅ **Mantenible**: La lógica de acceso a datos está centralizada en la función SQL  
✅ **Sin cambios de permisos**: No necesitas otorgar permisos directos a la clave de servicio

