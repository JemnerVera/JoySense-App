import { renderHook, act } from '@testing-library/react';
import { useProgressiveEnablement } from '../useProgressiveEnablement';

describe('useProgressiveEnablement', () => {
  describe('País', () => {
    it('debe habilitar paisabrev solo cuando pais tiene valor', () => {
      const { result } = renderHook(() => useProgressiveEnablement('pais', {}));
      
      expect(result.current.isFieldEnabled('pais')).toBe(true);
      expect(result.current.isFieldEnabled('paisabrev')).toBe(false);
      
      act(() => {
        // Simular cambio en formData
        const { result: newResult } = renderHook(() => useProgressiveEnablement('pais', { pais: 'Test País' }));
        expect(newResult.current.isFieldEnabled('pais')).toBe(true);
        expect(newResult.current.isFieldEnabled('paisabrev')).toBe(true);
      });
    });

    it('debe obtener campos habilitados correctamente', () => {
      const { result } = renderHook(() => useProgressiveEnablement('pais', { pais: 'Test País' }));
      
      const enabledFields = result.current.getEnabledFields();
      expect(enabledFields).toContain('pais');
      expect(enabledFields).toContain('paisabrev');
      expect(enabledFields).toContain('statusid');
    });

    it('debe obtener campos deshabilitados correctamente', () => {
      const { result } = renderHook(() => useProgressiveEnablement('pais', {}));
      
      const disabledFields = result.current.getDisabledFields();
      expect(disabledFields).toContain('paisabrev');
    });

    it('debe obtener campos obligatorios correctamente', () => {
      const { result } = renderHook(() => useProgressiveEnablement('pais', {}));
      
      const requiredFields = result.current.getRequiredFields();
      expect(requiredFields).toContain('pais');
      expect(requiredFields).toContain('paisabrev');
    });
  });

  describe('Empresa', () => {
    it('debe habilitar empresabrev solo cuando empresa tiene valor', () => {
      const { result } = renderHook(() => useProgressiveEnablement('empresa', {}));
      
      expect(result.current.isFieldEnabled('empresa')).toBe(true);
      expect(result.current.isFieldEnabled('empresabrev')).toBe(false);
      
      act(() => {
        const { result: newResult } = renderHook(() => useProgressiveEnablement('empresa', { empresa: 'Test Empresa' }));
        expect(newResult.current.isFieldEnabled('empresa')).toBe(true);
        expect(newResult.current.isFieldEnabled('empresabrev')).toBe(true);
      });
    });
  });

  describe('Fundo', () => {
    it('debe habilitar fundoabrev solo cuando fundo tiene valor', () => {
      const { result } = renderHook(() => useProgressiveEnablement('fundo', {}));
      
      expect(result.current.isFieldEnabled('fundo')).toBe(true);
      expect(result.current.isFieldEnabled('fundoabrev')).toBe(false);
      
      act(() => {
        const { result: newResult } = renderHook(() => useProgressiveEnablement('fundo', { fundo: 'Test Fundo' }));
        expect(newResult.current.isFieldEnabled('fundo')).toBe(true);
        expect(newResult.current.isFieldEnabled('fundoabrev')).toBe(true);
      });
    });
  });

  describe('Tipo', () => {
    it('debe habilitar tipo solo cuando entidadid tiene valor', () => {
      const { result } = renderHook(() => useProgressiveEnablement('tipo', {}));
      
      expect(result.current.isFieldEnabled('entidadid')).toBe(true);
      expect(result.current.isFieldEnabled('tipo')).toBe(false);
      
      act(() => {
        const { result: newResult } = renderHook(() => useProgressiveEnablement('tipo', { entidadid: 1 }));
        expect(newResult.current.isFieldEnabled('entidadid')).toBe(true);
        expect(newResult.current.isFieldEnabled('tipo')).toBe(true);
      });
    });
  });

  describe('Nodo', () => {
    it('debe habilitar campos progresivamente', () => {
      const { result } = renderHook(() => useProgressiveEnablement('nodo', {}));
      
      // Inicialmente solo nodo está habilitado
      expect(result.current.isFieldEnabled('nodo')).toBe(true);
      expect(result.current.isFieldEnabled('deveui')).toBe(false);
      expect(result.current.isFieldEnabled('appeui')).toBe(false);
      
      act(() => {
        // Con nodo lleno, deveui se habilita
        const { result: newResult } = renderHook(() => useProgressiveEnablement('nodo', { nodo: 'Test Nodo' }));
        expect(newResult.current.isFieldEnabled('nodo')).toBe(true);
        expect(newResult.current.isFieldEnabled('deveui')).toBe(true);
        expect(newResult.current.isFieldEnabled('appeui')).toBe(false);
      });
      
      act(() => {
        // Con nodo y deveui llenos, appeui se habilita
        const { result: newResult } = renderHook(() => useProgressiveEnablement('nodo', { nodo: 'Test Nodo', deveui: 'Test Deveui' }));
        expect(newResult.current.isFieldEnabled('nodo')).toBe(true);
        expect(newResult.current.isFieldEnabled('deveui')).toBe(true);
        expect(newResult.current.isFieldEnabled('appeui')).toBe(true);
      });
    });
  });

  describe('Métrica', () => {
    it('debe habilitar unidad solo cuando metrica tiene valor', () => {
      const { result } = renderHook(() => useProgressiveEnablement('metrica', {}));
      
      expect(result.current.isFieldEnabled('metrica')).toBe(true);
      expect(result.current.isFieldEnabled('unidad')).toBe(false);
      
      act(() => {
        const { result: newResult } = renderHook(() => useProgressiveEnablement('metrica', { metrica: 'Test Métrica' }));
        expect(newResult.current.isFieldEnabled('metrica')).toBe(true);
        expect(newResult.current.isFieldEnabled('unidad')).toBe(true);
      });
    });
  });

  describe('Umbral', () => {
    it('debe habilitar campos progresivamente', () => {
      const { result } = renderHook(() => useProgressiveEnablement('umbral', {}));
      
      // Inicialmente solo umbral está habilitado
      expect(result.current.isFieldEnabled('umbral')).toBe(true);
      expect(result.current.isFieldEnabled('ubicacionid')).toBe(false);
      expect(result.current.isFieldEnabled('criticidadid')).toBe(false);
      
      act(() => {
        // Con umbral lleno, ubicacionid se habilita
        const { result: newResult } = renderHook(() => useProgressiveEnablement('umbral', { umbral: 'Test Umbral' }));
        expect(newResult.current.isFieldEnabled('umbral')).toBe(true);
        expect(newResult.current.isFieldEnabled('ubicacionid')).toBe(true);
        expect(newResult.current.isFieldEnabled('criticidadid')).toBe(false);
      });
      
      act(() => {
        // Con umbral y ubicacionid llenos, criticidadid se habilita
        const { result: newResult } = renderHook(() => useProgressiveEnablement('umbral', { 
          umbral: 'Test Umbral', 
          ubicacionid: 1 
        }));
        expect(newResult.current.isFieldEnabled('umbral')).toBe(true);
        expect(newResult.current.isFieldEnabled('ubicacionid')).toBe(true);
        expect(newResult.current.isFieldEnabled('criticidadid')).toBe(true);
      });
    });
  });

  describe('Perfil Umbral', () => {
    it('debe habilitar umbralid solo cuando perfilid tiene valor', () => {
      const { result } = renderHook(() => useProgressiveEnablement('perfilumbral', {}));
      
      expect(result.current.isFieldEnabled('perfilid')).toBe(true);
      expect(result.current.isFieldEnabled('umbralid')).toBe(false);
      
      act(() => {
        const { result: newResult } = renderHook(() => useProgressiveEnablement('perfilumbral', { perfilid: 1 }));
        expect(newResult.current.isFieldEnabled('perfilid')).toBe(true);
        expect(newResult.current.isFieldEnabled('umbralid')).toBe(true);
      });
    });
  });

  describe('Criticidad', () => {
    it('debe habilitar criticidadbrev solo cuando criticidad tiene valor', () => {
      const { result } = renderHook(() => useProgressiveEnablement('criticidad', {}));
      
      expect(result.current.isFieldEnabled('criticidad')).toBe(true);
      expect(result.current.isFieldEnabled('criticidadbrev')).toBe(false);
      
      act(() => {
        const { result: newResult } = renderHook(() => useProgressiveEnablement('criticidad', { criticidad: 'Test Criticidad' }));
        expect(newResult.current.isFieldEnabled('criticidad')).toBe(true);
        expect(newResult.current.isFieldEnabled('criticidadbrev')).toBe(true);
      });
    });
  });

  describe('Medio', () => {
    it('debe habilitar nombre siempre', () => {
      const { result } = renderHook(() => useProgressiveEnablement('medio', {}));
      
      expect(result.current.isFieldEnabled('nombre')).toBe(true);
    });
  });

  describe('Contacto', () => {
    it('debe habilitar campos progresivamente', () => {
      const { result } = renderHook(() => useProgressiveEnablement('contacto', {}));
      
      // Inicialmente solo usuarioid está habilitado
      expect(result.current.isFieldEnabled('usuarioid')).toBe(true);
      expect(result.current.isFieldEnabled('medioid')).toBe(false);
      expect(result.current.isFieldEnabled('celular')).toBe(false);
      
      act(() => {
        // Con usuarioid lleno, medioid se habilita
        const { result: newResult } = renderHook(() => useProgressiveEnablement('contacto', { usuarioid: 1 }));
        expect(newResult.current.isFieldEnabled('usuarioid')).toBe(true);
        expect(newResult.current.isFieldEnabled('medioid')).toBe(true);
        expect(newResult.current.isFieldEnabled('celular')).toBe(false);
      });
      
      act(() => {
        // Con usuarioid y medioid llenos, celular se habilita
        const { result: newResult } = renderHook(() => useProgressiveEnablement('contacto', { 
          usuarioid: 1, 
          medioid: 1 
        }));
        expect(newResult.current.isFieldEnabled('usuarioid')).toBe(true);
        expect(newResult.current.isFieldEnabled('medioid')).toBe(true);
        expect(newResult.current.isFieldEnabled('celular')).toBe(true);
      });
    });
  });

  describe('Usuario', () => {
    it('debe habilitar campos progresivamente', () => {
      const { result } = renderHook(() => useProgressiveEnablement('usuario', {}));
      
      // Inicialmente solo login está habilitado
      expect(result.current.isFieldEnabled('login')).toBe(true);
      expect(result.current.isFieldEnabled('nombre')).toBe(false);
      expect(result.current.isFieldEnabled('apellido')).toBe(false);
      
      act(() => {
        // Con login lleno, nombre se habilita
        const { result: newResult } = renderHook(() => useProgressiveEnablement('usuario', { login: 'testuser' }));
        expect(newResult.current.isFieldEnabled('login')).toBe(true);
        expect(newResult.current.isFieldEnabled('nombre')).toBe(true);
        expect(newResult.current.isFieldEnabled('apellido')).toBe(false);
      });
      
      act(() => {
        // Con login y nombre llenos, apellido se habilita
        const { result: newResult } = renderHook(() => useProgressiveEnablement('usuario', { 
          login: 'testuser', 
          nombre: 'Test' 
        }));
        expect(newResult.current.isFieldEnabled('login')).toBe(true);
        expect(newResult.current.isFieldEnabled('nombre')).toBe(true);
        expect(newResult.current.isFieldEnabled('apellido')).toBe(true);
      });
    });
  });

  describe('Perfil', () => {
    it('debe habilitar nivel solo cuando perfil tiene valor', () => {
      const { result } = renderHook(() => useProgressiveEnablement('perfil', {}));
      
      expect(result.current.isFieldEnabled('perfil')).toBe(true);
      expect(result.current.isFieldEnabled('nivel')).toBe(false);
      
      act(() => {
        const { result: newResult } = renderHook(() => useProgressiveEnablement('perfil', { perfil: 'Test Perfil' }));
        expect(newResult.current.isFieldEnabled('perfil')).toBe(true);
        expect(newResult.current.isFieldEnabled('nivel')).toBe(true);
      });
    });
  });

  describe('Usuario Perfil', () => {
    it('debe habilitar perfilid solo cuando usuarioid tiene valor', () => {
      const { result } = renderHook(() => useProgressiveEnablement('usuarioperfil', {}));
      
      expect(result.current.isFieldEnabled('usuarioid')).toBe(true);
      expect(result.current.isFieldEnabled('perfilid')).toBe(false);
      
      act(() => {
        const { result: newResult } = renderHook(() => useProgressiveEnablement('usuarioperfil', { usuarioid: 1 }));
        expect(newResult.current.isFieldEnabled('usuarioid')).toBe(true);
        expect(newResult.current.isFieldEnabled('perfilid')).toBe(true);
      });
    });
  });

  describe('Localización', () => {
    it('debe habilitar campos progresivamente', () => {
      const { result } = renderHook(() => useProgressiveEnablement('localizacion', {}));
      
      // Inicialmente solo ubicacionid está habilitado
      expect(result.current.isFieldEnabled('ubicacionid')).toBe(true);
      expect(result.current.isFieldEnabled('nodoid')).toBe(false);
      expect(result.current.isFieldEnabled('entidadid')).toBe(false);
      
      act(() => {
        // Con ubicacionid lleno, nodoid se habilita
        const { result: newResult } = renderHook(() => useProgressiveEnablement('localizacion', { ubicacionid: 1 }));
        expect(newResult.current.isFieldEnabled('ubicacionid')).toBe(true);
        expect(newResult.current.isFieldEnabled('nodoid')).toBe(true);
        expect(newResult.current.isFieldEnabled('entidadid')).toBe(false);
      });
      
      act(() => {
        // Con ubicacionid y nodoid llenos, entidadid se habilita
        const { result: newResult } = renderHook(() => useProgressiveEnablement('localizacion', { 
          ubicacionid: 1, 
          nodoid: 1 
        }));
        expect(newResult.current.isFieldEnabled('ubicacionid')).toBe(true);
        expect(newResult.current.isFieldEnabled('nodoid')).toBe(true);
        expect(newResult.current.isFieldEnabled('entidadid')).toBe(true);
      });
    });
  });

  describe('Ubicación', () => {
    it('debe habilitar fundoid solo cuando ubicacion tiene valor', () => {
      const { result } = renderHook(() => useProgressiveEnablement('ubicacion', {}));
      
      expect(result.current.isFieldEnabled('ubicacion')).toBe(true);
      expect(result.current.isFieldEnabled('fundoid')).toBe(false);
      
      act(() => {
        const { result: newResult } = renderHook(() => useProgressiveEnablement('ubicacion', { ubicacion: 'Test Ubicación' }));
        expect(newResult.current.isFieldEnabled('ubicacion')).toBe(true);
        expect(newResult.current.isFieldEnabled('fundoid')).toBe(true);
      });
    });
  });

  describe('Entidad', () => {
    it('debe habilitar entidad siempre', () => {
      const { result } = renderHook(() => useProgressiveEnablement('entidad', {}));
      
      expect(result.current.isFieldEnabled('entidad')).toBe(true);
    });
  });
});
