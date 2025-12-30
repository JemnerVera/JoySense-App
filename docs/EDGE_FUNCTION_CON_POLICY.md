# ✅ Edge Function con Políticas RLS - Versión Simplificada

## Código Completo para Copiar y Pegar

Después de ejecutar las políticas SQL (`docs/SOLUCION_POLICY_EDGE_FUNCTION.sql`), usa esta versión simplificada de la Edge Function:

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
    
    // ✅ Cliente de Supabase con schema joysense
    // Ahora las políticas RLS permiten el acceso
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL"), 
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),
      {
        db: {
          schema: "joysense"
        }
      }
    );
    
    // Obtener contacto con usuario (intentar con relación primero)
    let contacto = null;
    
    // Intento 1: Con relación (si Supabase la reconoce)
    const { data: contactoConRelacion, error: errorRelacion } = await supabase
      .from("contacto")
      .select(`
        celular,
        usuarioid,
        usuario:usuarioid (
          firstname
        )
      `)
      .eq("contactoid", record.contactoid)
      .single();
    
    if (!errorRelacion && contactoConRelacion && contactoConRelacion.usuario) {
      contacto = contactoConRelacion;
    } else {
      // Intento 2: Fallback - dos queries separadas (más robusto)
      console.log("Usando fallback: queries separadas");
      
      const { data: contactoSimple, error: errorContacto } = await supabase
        .from("contacto")
        .select("celular, usuarioid")
        .eq("contactoid", record.contactoid)
        .single();
      
      if (errorContacto || !contactoSimple) {
        console.error("Error obteniendo contacto:", errorContacto);
        return new Response(JSON.stringify({ 
          error: "No se encontró contacto",
          details: errorContacto 
        }), {
          status: 400
        });
      }
      
      const { data: usuario, error: errorUsuario } = await supabase
        .from("usuario")
        .select("firstname")
        .eq("usuarioid", contactoSimple.usuarioid)
        .single();
      
      if (errorUsuario || !usuario) {
        console.error("Error obteniendo usuario:", errorUsuario);
        return new Response(JSON.stringify({ 
          error: "No se encontró usuario",
          details: errorUsuario 
        }), {
          status: 400
        });
      }
      
      contacto = {
        celular: contactoSimple.celular,
        usuario: { firstname: usuario.firstname }
      };
    }
    
    // Validar que tenemos los datos necesarios
    if (!contacto.celular || !contacto.usuario?.firstname) {
      console.error("Datos incompletos:", contacto);
      return new Response(JSON.stringify({ 
        error: "Datos de contacto incompletos",
        contacto: contacto 
      }), {
        status: 400
      });
    }
    
    // JSON esperado por la API
    const body = {
      destinatario: contacto.celular,
      plantilla: "",
      mensaje: {
        "1": `${contacto.usuario.firstname}`,
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
      details: e.message,
      stack: e.stack 
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

1. **Ejecutar las políticas SQL** en Supabase SQL Editor:
   - Abre `docs/SOLUCION_POLICY_EDGE_FUNCTION.sql`
   - Ejecuta el script completo
   - Verifica que las políticas se crearon correctamente

2. **Actualizar la Edge Function** en Supabase Dashboard:
   - Ve a Edge Functions → `enviar-mensaje`
   - Reemplaza todo el código con el código de arriba
   - Guarda y despliega

3. **Verificar**:
   - Inserta una nueva medición
   - Verifica los logs de la Edge Function
   - Debe mostrar `200 OK` y el mensaje debe llegar a WhatsApp

## Ventajas de esta Solución

✅ **Sigue las recomendaciones del DBA**: Usa políticas RLS en lugar de funciones SQL  
✅ **Más simple**: No requiere crear funciones adicionales  
✅ **Mantenible**: Las políticas están en el schema junto con las tablas  
✅ **Segura**: Solo permite lectura de registros activos (`statusid = 1`)  
✅ **Flexible**: Puedes ajustar las políticas según necesidades futuras

## Comparación con la Solución Anterior

| Aspecto | Función SQL | Políticas RLS |
|---------|-------------|---------------|
| Complejidad | Requiere función adicional | Solo políticas |
| Mantenimiento | Función separada | Políticas junto a tablas |
| Seguridad | `SECURITY DEFINER` | RLS nativo |
| Recomendación DBA | ❌ | ✅ |

