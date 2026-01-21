/**
 * Rutas de Usuarios: usuario, perfil, contacto, correo, usuarioperfil, codigotelefono
 * Versión Supabase API con RLS - Refactorizado a MVC (Route-Controller-Service)
 */

const express = require('express');
const router = express.Router();
const usuariosController = require('../controllers/usuariosController');
const { optionalAuth } = require('../middleware/auth');

// Aplicar middleware de autenticación opcional a todas las rutas
// Esto permite que las queries usen el token del usuario para RLS
router.use(optionalAuth);

// ============================================================================
// USUARIO
// ============================================================================
router.get('/usuario', usuariosController.getUsuarios);
router.get('/usuario/columns', usuariosController.getUsuarioColumns);
router.post('/usuario', usuariosController.postUsuario);
router.put('/usuario/:id', usuariosController.putUsuario);

// ============================================================================
// SINCRONIZAR USUARIO CON AUTH (Reintentar sincronización)
// ============================================================================
router.post('/usuario/:id/sync-auth', usuariosController.syncAuth);

// ============================================================================
// LOGIN (Público)
// ============================================================================
router.post('/usuario/login', usuariosController.login);

// ============================================================================
// PERFIL
// ============================================================================
router.get('/perfil', usuariosController.getPerfiles);
router.get('/perfil/columns', usuariosController.getPerfilColumns);
router.post('/perfil', usuariosController.postPerfil);
router.put('/perfil/:id', usuariosController.putPerfil);

// ============================================================================
// USUARIOPERFIL
// ============================================================================
router.get('/usuarioperfil', usuariosController.getUsuarioPerfiles);
router.get('/usuarioperfil/columns', usuariosController.getUsuarioPerfilColumns);
router.post('/usuarioperfil', usuariosController.postUsuarioPerfil);
router.put('/usuarioperfil/composite', usuariosController.putUsuarioPerfilComposite);

// ============================================================================
// CODIGOTELEFONO
// ============================================================================
router.get('/codigotelefono', usuariosController.getCodigosTelefono);
router.get('/codigotelefono/columns', usuariosController.getCodigoTelefonoColumns);
router.post('/codigotelefono', usuariosController.postCodigoTelefono);
router.put('/codigotelefono/:id', usuariosController.putCodigoTelefono);

// ============================================================================
// CONTACTO
// ============================================================================
router.get('/contacto', usuariosController.getContactos);
router.get('/contacto/columns', usuariosController.getContactoColumns);
router.post('/contacto', usuariosController.postContacto);
router.put('/contacto/:id', usuariosController.putContacto);

// ============================================================================
// CORREO
// ============================================================================
router.get('/correo', usuariosController.getCorreos);
router.get('/correo/columns', usuariosController.getCorreoColumns);
router.post('/correo', usuariosController.postCorreo);
router.put('/correo/:id', usuariosController.putCorreo);

// ============================================================================
// BÚSQUEDA DE USUARIOS
// ============================================================================
router.get('/search', usuariosController.search);
router.get('/search-with-empresas', usuariosController.searchWithEmpresas);

module.exports = router;
