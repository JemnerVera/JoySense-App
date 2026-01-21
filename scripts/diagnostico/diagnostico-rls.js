/**
 * DIAGNÓSTICO RLS - Script de JavaScript para el Frontend
 *
 * Este script diagnostica problemas con las políticas RLS (Row Level Security)
 * en las tablas geográficas cuando un usuario está autenticado.
 *
 * USO EN PRODUCCIÓN: Solo consultas SELECT, no modifica datos.
 *
 * Para usar: Importar y ejecutar la función diagnosticoRLS()
 */

import { supabase } from '../services/supabase-auth'

/**
 * Función principal de diagnóstico RLS
 */
export async function diagnosticoRLS() {
  console.log('🔍 INICIANDO DIAGNÓSTICO RLS')
  console.log('================================')

  try {
    // 1. Verificar autenticación
    await verificarAutenticacion()

    // 2. Verificar configuración de permisos
    await verificarConfiguracionPermisos()

    // 3. Diagnosticar acceso a cada tabla
    await diagnosticarAccesoTablas()

    // 4. Resumen final
    mostrarResumen()

  } catch (error) {
    console.error('❌ Error en diagnóstico RLS:', error)
  }

  console.log('================================')
  console.log('🏁 DIAGNÓSTICO RLS COMPLETADO')
}

/**
 * Verifica el estado de autenticación del usuario
 */
async function verificarAutenticacion() {
  console.log('\n1. VERIFICACIÓN DE AUTENTICACIÓN')
  console.log('---------------------------------')

  try {
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error) {
      console.error('❌ Error obteniendo usuario:', error)
      return
    }

    if (!user) {
      console.log('❌ Usuario NO autenticado')
      return
    }

    console.log('✅ Usuario autenticado:', user.email)
    console.log('🆔 User UUID:', user.id)

    // Verificar que existe en la tabla usuario
    const { data: usuarioData, error: usuarioError } = await supabase
      .from('usuario')
      .select('usuarioid, login, firstname, lastname')
      .eq('useruuid', user.id)
      .single()

    if (usuarioError) {
      console.error('❌ Error obteniendo datos de usuario:', usuarioError)
    } else {
      console.log('✅ Usuario encontrado en BD:', usuarioData)
    }

  } catch (error) {
    console.error('❌ Error en verificación de autenticación:', error)
  }
}

/**
 * Verifica la configuración de permisos del usuario actual
 */
async function verificarConfiguracionPermisos() {
  console.log('\n2. CONFIGURACIÓN DE PERMISOS')
  console.log('-----------------------------')

  try {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      console.log('❌ No hay usuario autenticado')
      return
    }

    // Obtener perfil del usuario
    const { data: perfilData, error: perfilError } = await supabase
      .from('usuarioperfil')
      .select(`
        perfilid,
        perfil (
          perfilid,
          perfil,
          is_admin_global
        )
      `)
      .eq('usuarioid', (
        await supabase
          .from('usuario')
          .select('usuarioid')
          .eq('useruuid', user.id)
          .single()
      ).data?.usuarioid)
      .eq('statusid', 1)

    if (perfilError) {
      console.error('❌ Error obteniendo perfil:', perfilError)
    } else {
      console.log('👤 Perfil del usuario:', perfilData?.[0]?.perfil)
      console.log('👑 Admin global:', perfilData?.[0]?.perfil?.is_admin_global ? 'SÍ' : 'NO')
    }

    // Obtener empresas asignadas
    const { data: empresasData, error: empresasError } = await supabase
      .from('usuario_empresa')
      .select(`
        empresaid,
        is_default,
        empresa (
          empresaid,
          empresa
        )
      `)
      .eq('usuarioid', (
        await supabase
          .from('usuario')
          .select('usuarioid')
          .eq('useruuid', user.id)
          .single()
      ).data?.usuarioid)
      .eq('statusid', 1)

    if (empresasError) {
      console.error('❌ Error obteniendo empresas:', empresasError)
    } else {
      console.log('🏢 Empresas asignadas:', empresasData?.length || 0)
      empresasData?.forEach(emp => {
        console.log(`  - ${emp.empresa?.empresa} (${emp.is_default ? 'DEFAULT' : ''})`)
      })
    }

    // Obtener permisos específicos (usando la vista)
    const { data: permisosData, error: permisosError } = await supabase
      .from('v_permiso_usuario')
      .select('*')
      .eq('useruuid', user.id)

    if (permisosError) {
      console.error('❌ Error obteniendo permisos:', permisosError)
    } else {
      console.log('🔐 Permisos específicos:', permisosData?.length || 0)
      permisosData?.forEach(permiso => {
        const tipo = {
          1: 'País',
          2: 'Empresa',
          3: 'Fundo',
          4: 'Ubicación',
          5: 'Nodo',
          6: 'Localización'
        }[permiso.fuenteid] || 'Desconocido'

        console.log(`  - ${tipo} ${permiso.objetoid || 'TODOS'}: ${permiso.puede_ver ? '✅ VER' : '❌ NO VER'}`)
      })
    }

  } catch (error) {
    console.error('❌ Error en verificación de permisos:', error)
  }
}

/**
 * Diagnostica el acceso a cada tabla geográfica
 */
async function diagnosticarAccesoTablas() {
  console.log('\n3. DIAGNÓSTICO DE ACCESO A TABLAS')
  console.log('----------------------------------')

  // Tablas a diagnosticar
  const tablas = [
    { nombre: 'pais', descripcion: 'Países' },
    { nombre: 'empresa', descripcion: 'Empresas' },
    { nombre: 'fundo', descripcion: 'Fundos' },
    { nombre: 'ubicacion', descripcion: 'Ubicaciones' },
    { nombre: 'nodo', descripcion: 'Nodos' },
    { nombre: 'localizacion', descripcion: 'Localizaciones' }
  ]

  for (const tabla of tablas) {
    await diagnosticarTabla(tabla.nombre, tabla.descripcion)
  }
}

/**
 * Diagnostica el acceso a una tabla específica
 */
async function diagnosticarTabla(nombreTabla, descripcionTabla) {
  console.log(`\n📋 DIAGNÓSTICO: ${descripcionTabla} (${nombreTabla})`)

  try {
    let query

    // Configurar consulta según la tabla
    switch (nombreTabla) {
      case 'pais':
        query = supabase.from('pais').select('paisid, pais')
        break
      case 'empresa':
        query = supabase.from('empresa').select('empresaid, empresa, paisid')
        break
      case 'fundo':
        query = supabase.from('fundo').select('fundoid, fundo, empresaid')
        break
      case 'ubicacion':
        query = supabase.from('ubicacion').select('ubicacionid, ubicacion, fundoid')
        break
      case 'nodo':
        query = supabase.from('nodo').select('nodoid, nodo, ubicacionid')
        break
      case 'localizacion':
        query = supabase.from('localizacion').select('localizacionid, localizacion, nodoid')
        break
      default:
        query = supabase.from(nombreTabla).select('*').limit(5)
    }

    const { data, error, count } = await query

    if (error) {
      console.error(`❌ ERROR en consulta ${nombreTabla}:`, error.message)
      console.error('   Código:', error.code)
      console.error('   Detalles:', error.details)
      console.error('   Hint:', error.hint)
    } else {
      const totalRegistros = Array.isArray(data) ? data.length : (count || 0)
      console.log(`✅ Consulta exitosa: ${totalRegistros} registros accesibles`)

      if (totalRegistros === 0) {
        console.log('⚠️  La tabla está vacía O las políticas RLS bloquean todos los registros')
      } else {
        console.log('📊 Primeros registros:', data.slice(0, 3))
      }
    }

  } catch (error) {
    console.error(`❌ Error inesperado en ${nombreTabla}:`, error)
  }
}

/**
 * Muestra un resumen final del diagnóstico
 */
function mostrarResumen() {
  console.log('\n4. RESUMEN Y RECOMENDACIONES')
  console.log('-----------------------------')

  console.log('🔍 RESULTADOS ESPERADOS PARA USUARIO DEMO:')
  console.log('  ✅ País 1 (Perú) - debería ver')
  console.log('  ✅ Empresa 1 (Agrícola Andrea) - debería ver')
  console.log('  ✅ Fundo 1 (Elise) - debería ver')
  console.log('  ✅ TODAS las ubicaciones - debería ver (permiso global)')
  console.log('  ✅ TODOS los nodos - debería ver (permiso global)')
  console.log('  ✅ TODAS las localizaciones - debería ver (permiso global)')

  console.log('\n💡 POSIBLES PROBLEMAS:')
  console.log('  ❌ Políticas RLS complejas bloquean el acceso')
  console.log('  ❌ Funciones de permisos no funcionan correctamente')
  console.log('  ❌ Configuración de permisos incompleta')

  console.log('\n🛠️  RECOMENDACIONES:')
  console.log('  1. Si no ves Fundo 1: política RLS de fundo es demasiado compleja')
  console.log('  2. Si no ves ubicaciones: política RLS de ubicación falla')
  console.log('  3. Si no ves nodos: política RLS de nodo falla')
  console.log('  4. Comparar con empresa (que funciona) vs las otras tablas')

  console.log('\n📞 PARA DEBUGGING AVANZADO:')
  console.log('  - Revisar logs del backend para errores en funciones RLS')
  console.log('  - Usar script SQL de diagnóstico en Supabase')
  console.log('  - Comparar permisos del usuario con políticas RLS')
}

/**
 * Función de utilidad para ejecutar consultas de diagnóstico individual
 */
export async function diagnosticoTablaIndividual(nombreTabla) {
  console.log(`🔍 Diagnóstico individual: ${nombreTabla}`)
  await diagnosticarTabla(nombreTabla, nombreTabla.toUpperCase())
}

// Hacer las funciones disponibles globalmente para debugging en consola
if (typeof window !== 'undefined') {
  window.diagnosticoRLS = diagnosticoRLS
  window.diagnosticoTabla = diagnosticoTablaIndividual
  console.log('💡 Funciones de diagnóstico disponibles:')
  console.log('  - diagnosticoRLS() // Diagnóstico completo')
  console.log('  - diagnosticoTabla("fundo") // Diagnóstico de tabla específica')
}