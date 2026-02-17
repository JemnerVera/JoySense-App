// ============================================================================
// REGLA_OBJETO FORM FIELDS
// ============================================================================
// Componente específico para renderizar formulario de asignación de objetos a reglas

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { DualListbox, SelectWithPlaceholder } from '../../../selectors';
import { useLanguage } from '../../../../contexts/LanguageContext';
import { getColumnDisplayNameTranslated } from '../../../../utils/systemParametersUtils';

interface ReglaObjetoFormFieldsProps {
  visibleColumns: any[];
  formData: Record<string, any>;
  setFormData: (data: Record<string, any>) => void;
  updateField: (field: string, value: any) => void;
  getThemeColor: (type: 'text' | 'bg' | 'hover' | 'focus' | 'border') => string;
  getUniqueOptionsForField: (columnName: string) => Array<{value: any, label: string}>;
  isFieldRequired: (columnName: string) => boolean;
  disabled?: boolean;
  // Datos para la cascada
  paisesData?: any[];
  empresasData?: any[];
  fundosData?: any[];
  ubicacionesData?: any[];
  nodosData?: any[];
  localizacionesData?: any[];
  fuentesData?: any[];
  reglasData?: any[];
}

export const ReglaObjetoFormFields: React.FC<ReglaObjetoFormFieldsProps> = ({
  visibleColumns,
  formData,
  setFormData,
  updateField,
  getThemeColor,
  getUniqueOptionsForField,
  isFieldRequired,
  disabled = false,
  paisesData = [],
  empresasData = [],
  fundosData = [],
  ubicacionesData = [],
  nodosData = [],
  localizacionesData = [],
  fuentesData = [],
  reglasData = []
}) => {
  const { t } = useLanguage();

  // Estados locales para la cascada: arrays de IDs seleccionados en cada nivel
  const [selectedPaises, setSelectedPaises] = useState<number[]>([]);
  const [selectedEmpresas, setSelectedEmpresas] = useState<number[]>([]);
  const [selectedFundos, setSelectedFundos] = useState<number[]>([]);
  const [selectedUbicaciones, setSelectedUbicaciones] = useState<number[]>([]);

  // Refs para evitar bucles infinitos en la sincronización con el padre
  const lastSyncRef = useRef<{
    objetos: string;
    fuenteid: number | null;
    activeLevel: string;
  }>({ objetos: '[]', fuenteid: null, activeLevel: 'pais' });

  // Nivel activo de la cascada (cuál es el nivel que estamos usando para el multi-select)
  const [activeLevel, setActiveLevel] = useState<string>('pais');

  // Obtener la regla seleccionada y sus detalles
  const selectedRegla = useMemo(() => {
    if (!formData.reglaid) return null;
    return reglasData.find(r => r.reglaid === formData.reglaid);
  }, [formData.reglaid, reglasData]);

  // Determinar qué objetos están actualmente seleccionados (según el nivel activo)
  const getCurrentSelectedObjects = (): number[] => {
    switch(activeLevel) {
      case 'pais':
        return selectedPaises;
      case 'empresa':
        return selectedEmpresas;
      case 'fundo':
        return selectedFundos;
      case 'ubicacion':
        return selectedUbicaciones;
      default:
        return [];
    }
  };

  // Sincronizar con formData._objetosSeleccionados, fuenteid y origenid
  useEffect(() => {
    const currentSelectedObjects = getCurrentSelectedObjects();
    const objetosStr = JSON.stringify(currentSelectedObjects);
    const fuente = fuentesData.find(f => f.fuente?.toLowerCase() === activeLevel.toLowerCase());
    const fuenteid = fuente?.fuenteid || null;

    // Solo actualizar si algo relevante cambió
    if (
      objetosStr !== lastSyncRef.current.objetos ||
      fuenteid !== lastSyncRef.current.fuenteid ||
      activeLevel !== lastSyncRef.current.activeLevel
    ) {
      // Actualizar objetos seleccionados
      updateField('_objetosSeleccionados', currentSelectedObjects);
      
      // Actualizar fuenteid
      if (fuenteid) {
        updateField('fuenteid', fuenteid);
      }
      
      // origenid siempre es 1 (Geografía)
      updateField('origenid', 1);

      // Guardar último estado sincronizado
      lastSyncRef.current = {
        objetos: objetosStr,
        fuenteid,
        activeLevel
      };
    }
  }, [selectedPaises, selectedEmpresas, selectedFundos, selectedUbicaciones, activeLevel, fuentesData, updateField]);

  // Opciones para los selects de la cascada
  const paisOptions = useMemo(() => 
    paisesData.map(p => ({ value: p.paisid, label: p.pais })), [paisesData]);

  const empresaOptions = useMemo(() => {
    if (selectedPaises.length === 0) return [];
    const filtered = empresasData.filter(e => selectedPaises.includes(Number(e.paisid)));
    return filtered.map(e => ({ value: e.empresaid, label: e.empresa }));
  }, [empresasData, selectedPaises]);

  const fundoOptions = useMemo(() => {
    if (selectedEmpresas.length === 0) return [];
    const filtered = fundosData.filter(f => selectedEmpresas.includes(Number(f.empresaid)));
    return filtered.map(f => ({ value: f.fundoid, label: f.fundo }));
  }, [fundosData, selectedEmpresas]);

  const ubicacionOptions = useMemo(() => {
    if (selectedFundos.length === 0) return [];
    const filtered = ubicacionesData.filter(u => selectedFundos.includes(Number(u.fundoid)));
    return filtered.map(u => ({ value: u.ubicacionid, label: u.ubicacion }));
  }, [ubicacionesData, selectedFundos]);

  // Manejadores de cambio para los niveles de la cascada
  const handlePaisChange = (values: number[]) => {
    setSelectedPaises(values);
    // Si se borra la selección, volver a nivel pais
    if (values.length === 0) {
      setSelectedEmpresas([]);
      setSelectedFundos([]);
      setSelectedUbicaciones([]);
      setActiveLevel('pais');
    } else {
      // Si hay selecciones, cambiar a empresa
      setActiveLevel('empresa');
    }
  };

  const handleEmpresaChange = (values: number[]) => {
    setSelectedEmpresas(values);
    if (values.length === 0) {
      setSelectedFundos([]);
      setSelectedUbicaciones([]);
      setActiveLevel('empresa');
    } else {
      setActiveLevel('fundo');
    }
  };

  const handleFundoChange = (values: number[]) => {
    setSelectedFundos(values);
    if (values.length === 0) {
      setSelectedUbicaciones([]);
      setActiveLevel('fundo');
    } else {
      setActiveLevel('ubicacion');
    }
  };

  const handleUbicacionChange = (values: number[]) => {
    setSelectedUbicaciones(values);
    setActiveLevel('ubicacion');
  };

  // Renderizar detalles de la regla
  const renderReglaDetails = () => {
    if (!selectedRegla) return (
      <div className="bg-neutral-800/50 border border-dashed border-neutral-600 rounded-lg p-6 flex items-center justify-center text-neutral-500 font-mono italic">
        SELECCIONE UNA REGLA PARA VER SUS DETALLES
      </div>
    );

    return (
      <div className="bg-neutral-800 border border-orange-500/30 rounded-lg p-4 shadow-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="space-y-1">
            <span className="text-xs font-mono text-orange-500 uppercase tracking-tighter">Nombre</span>
            <p className="text-white font-mono font-bold truncate">{selectedRegla.nombre}</p>
          </div>
          <div className="space-y-1">
            <span className="text-xs font-mono text-orange-500 uppercase tracking-tighter">Prioridad</span>
            <p className="text-white font-mono font-bold">{selectedRegla.prioridad}</p>
          </div>
          <div className="space-y-1">
            <span className="text-xs font-mono text-orange-500 uppercase tracking-tighter">Ventana</span>
            <p className="text-white font-mono font-bold">{selectedRegla.ventana}</p>
          </div>
          <div className="space-y-1">
            <span className="text-xs font-mono text-orange-500 uppercase tracking-tighter">Cooldown</span>
            <p className="text-white font-mono font-bold">{selectedRegla.cooldown}</p>
          </div>
          <div className="space-y-1">
            <span className="text-xs font-mono text-orange-500 uppercase tracking-tighter">Criticidad</span>
            <p className="text-white font-mono font-bold">
              {getUniqueOptionsForField('criticidadid').find(o => o.value === selectedRegla.criticidadid)?.label || selectedRegla.criticidadid}
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* SELECCIÓN DE REGLA */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-neutral-700"></div>
          <h3 className="text-lg font-mono font-bold text-orange-500 tracking-widest uppercase">1. Configuración de Regla</h3>
          <div className="h-px flex-1 bg-neutral-700"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <label className={`block text-sm font-bold mb-2 font-mono tracking-wider ${getThemeColor('text')}`}>
              REGLA*
            </label>
            <SelectWithPlaceholder
              value={formData.reglaid || ''}
              onChange={(val) => updateField('reglaid', val ? Number(val) : null)}
              options={reglasData.map(r => ({ value: r.reglaid, label: r.nombre }))}
              placeholder="SELECCIONAR REGLA"
              themeColor="orange"
              disabled={disabled}
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-bold mb-2 font-mono tracking-wider text-neutral-400">
              DETALLES DE LA REGLA
            </label>
            {renderReglaDetails()}
          </div>
        </div>
      </div>

      {/* SELECCIÓN DE OBJETOS (CASCADA) */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-neutral-700"></div>
          <h3 className="text-lg font-mono font-bold text-orange-500 tracking-widest uppercase">2. Selección de Objetos Geográficos</h3>
          <div className="h-px flex-1 bg-neutral-700"></div>
        </div>

        <div className="space-y-6">
          {/* Nivel 1: País (SIEMPRE VISIBLE) */}
          <div className="space-y-2">
            <label className="text-xs font-mono text-neutral-400 uppercase">
              PAÍS{selectedPaises.length > 0 && <span className="text-orange-500 ml-2">({selectedPaises.length})</span>}
            </label>
            <DualListbox
              value={selectedPaises}
              onChange={handlePaisChange}
              options={paisOptions}
              placeholder="SELECCIONAR PAÍSES"
              disabled={disabled}
              canFilter={true}
              themeColor="orange"
              availableLabel="DISPONIBLES"
              selectedLabel="SELECCIONADOS"
            />
          </div>

          {/* Nivel 2: Empresa (VISIBLE SOLO SI HAY PAÍSES SELECCIONADOS) */}
          {selectedPaises.length > 0 && (
            <div className="space-y-2 pt-4 border-t border-neutral-700">
              <label className="text-xs font-mono text-neutral-400 uppercase">
                EMPRESA{selectedEmpresas.length > 0 && <span className="text-orange-500 ml-2">({selectedEmpresas.length})</span>}
              </label>
              <DualListbox
                value={selectedEmpresas}
                onChange={handleEmpresaChange}
                options={empresaOptions}
                placeholder="SELECCIONAR EMPRESAS"
                disabled={disabled || empresaOptions.length === 0}
                canFilter={true}
                themeColor="orange"
                availableLabel="DISPONIBLES"
                selectedLabel="SELECCIONADOS"
              />
            </div>
          )}

          {/* Nivel 3: Fundo (VISIBLE SOLO SI HAY EMPRESAS SELECCIONADAS) */}
          {selectedEmpresas.length > 0 && (
            <div className="space-y-2 pt-4 border-t border-neutral-700">
              <label className="text-xs font-mono text-neutral-400 uppercase">
                FUNDO{selectedFundos.length > 0 && <span className="text-orange-500 ml-2">({selectedFundos.length})</span>}
              </label>
              <DualListbox
                value={selectedFundos}
                onChange={handleFundoChange}
                options={fundoOptions}
                placeholder="SELECCIONAR FUNDOS"
                disabled={disabled || fundoOptions.length === 0}
                canFilter={true}
                themeColor="orange"
                availableLabel="DISPONIBLES"
                selectedLabel="SELECCIONADOS"
              />
            </div>
          )}

          {/* Nivel 4: Ubicación (VISIBLE SOLO SI HAY FUNDOS SELECCIONADOS) */}
          {selectedFundos.length > 0 && (
            <div className="space-y-2 pt-4 border-t border-neutral-700">
              <label className="text-xs font-mono text-neutral-400 uppercase">
                UBICACIÓN{selectedUbicaciones.length > 0 && <span className="text-orange-500 ml-2">({selectedUbicaciones.length})</span>}
              </label>
              <DualListbox
                value={selectedUbicaciones}
                onChange={handleUbicacionChange}
                options={ubicacionOptions}
                placeholder="SELECCIONAR UBICACIONES"
                disabled={disabled || ubicacionOptions.length === 0}
                canFilter={true}
                themeColor="orange"
                availableLabel="DISPONIBLES"
                selectedLabel="SELECCIONADOS"
              />
            </div>
          )}
        </div>

        {/* Resumen de selección en cascada */}
        <div className="mt-6 p-4 bg-neutral-900/50 rounded border border-neutral-700 font-mono text-xs space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-neutral-400 uppercase">Selección Actual:</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="space-y-1">
              <span className="text-neutral-500 text-[10px]">PAÍSES</span>
              <span className="text-orange-500 font-bold block">{selectedPaises.length}</span>
            </div>
            <div className="space-y-1">
              <span className="text-neutral-500 text-[10px]">EMPRESAS</span>
              <span className={`font-bold block ${selectedPaises.length === 0 ? 'text-neutral-600' : 'text-orange-500'}`}>
                {selectedEmpresas.length}
              </span>
            </div>
            <div className="space-y-1">
              <span className="text-neutral-500 text-[10px]">FUNDOS</span>
              <span className={`font-bold block ${selectedEmpresas.length === 0 ? 'text-neutral-600' : 'text-orange-500'}`}>
                {selectedFundos.length}
              </span>
            </div>
            <div className="space-y-1">
              <span className="text-neutral-500 text-[10px]">UBICACIONES</span>
              <span className={`font-bold block ${selectedFundos.length === 0 ? 'text-neutral-600' : 'text-orange-500'}`}>
                {selectedUbicaciones.length}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
