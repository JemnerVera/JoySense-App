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

  // Estados locales para la cascada
  const [selectedPais, setSelectedPais] = useState<number | null>(null);
  const [selectedEmpresa, setSelectedEmpresa] = useState<number | null>(null);
  const [selectedFundo, setSelectedFundo] = useState<number | null>(null);
  const [selectedUbicacion, setSelectedUbicacion] = useState<number | null>(null);
  const [selectedNodo, setSelectedNodo] = useState<number | null>(null);
  const [selectedObjects, setSelectedObjects] = useState<number[]>([]);

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

  // Sincronizar con formData._objetosSeleccionados, fuenteid y origenid
  useEffect(() => {
    const objetosStr = JSON.stringify(selectedObjects);
    const fuente = fuentesData.find(f => f.fuente?.toLowerCase() === activeLevel.toLowerCase());
    const fuenteid = fuente?.fuenteid || null;

    // Solo actualizar si algo relevante cambió
    if (
      objetosStr !== lastSyncRef.current.objetos ||
      fuenteid !== lastSyncRef.current.fuenteid ||
      activeLevel !== lastSyncRef.current.activeLevel
    ) {
      // Actualizar objetos seleccionados
      updateField('_objetosSeleccionados', selectedObjects);
      
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
  }, [selectedObjects, activeLevel, fuentesData, updateField]);

  // Opciones para los selects de la cascada
  const paisOptions = useMemo(() => 
    paisesData.map(p => ({ value: p.paisid, label: p.pais })), [paisesData]);

  const empresaOptions = useMemo(() => {
    const filtered = empresasData.filter(e => !selectedPais || Number(e.paisid) === Number(selectedPais));
    return filtered.map(e => ({ value: e.empresaid, label: e.empresa }));
  }, [empresasData, selectedPais]);

  const fundoOptions = useMemo(() => {
    const filtered = fundosData.filter(f => !selectedEmpresa || Number(f.empresaid) === Number(selectedEmpresa));
    return filtered.map(f => ({ value: f.fundoid, label: f.fundo }));
  }, [fundosData, selectedEmpresa]);

  const ubicacionOptions = useMemo(() => {
    const filtered = ubicacionesData.filter(u => !selectedFundo || Number(u.fundoid) === Number(selectedFundo));
    return filtered.map(u => ({ value: u.ubicacionid, label: u.ubicacion }));
  }, [ubicacionesData, selectedFundo]);

  const nodoOptions = useMemo(() => {
    const filtered = nodosData.filter(n => !selectedUbicacion || Number(n.ubicacionid) === Number(selectedUbicacion));
    return filtered.map(n => ({ value: n.nodoid, label: n.nombre || n.nodo }));
  }, [nodosData, selectedUbicacion]);

  const localizacionOptions = useMemo(() => {
    const filtered = localizacionesData.filter(l => !selectedNodo || Number(l.nodoid) === Number(selectedNodo));
    return filtered.map(l => ({ value: l.localizacionid, label: l.localizacion }));
  }, [localizacionesData, selectedNodo]);

  // Manejadores de cambio para los niveles de la cascada
  const handlePaisChange = (val: any) => {
    const id = val ? Number(val) : null;
    setSelectedPais(id);
    setSelectedEmpresa(null);
    setSelectedFundo(null);
    setSelectedUbicacion(null);
    setSelectedNodo(null);
    setSelectedObjects([]);
    setActiveLevel(id ? 'empresa' : 'pais');
  };

  const handleEmpresaChange = (val: any) => {
    const id = val ? Number(val) : null;
    setSelectedEmpresa(id);
    setSelectedFundo(null);
    setSelectedUbicacion(null);
    setSelectedNodo(null);
    setSelectedObjects([]);
    setActiveLevel(id ? 'fundo' : 'empresa');
  };

  const handleFundoChange = (val: any) => {
    const id = val ? Number(val) : null;
    setSelectedFundo(id);
    setSelectedUbicacion(null);
    setSelectedNodo(null);
    setSelectedObjects([]);
    setActiveLevel(id ? 'ubicacion' : 'fundo');
  };

  const handleUbicacionChange = (val: any) => {
    const id = val ? Number(val) : null;
    setSelectedUbicacion(id);
    setSelectedNodo(null);
    setSelectedObjects([]);
    setActiveLevel(id ? 'nodo' : 'ubicacion');
  };

  const handleNodoChange = (val: any) => {
    const id = val ? Number(val) : null;
    setSelectedNodo(id);
    setSelectedObjects([]);
    setActiveLevel(id ? 'localizacion' : 'nodo');
  };

  const handleLocalizacionChange = (values: number[]) => {
    setSelectedObjects(values);
    setActiveLevel('localizacion');
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Nivel 1: País */}
          <div className={`space-y-2 ${activeLevel === 'pais' ? 'md:col-span-3' : ''}`}>
            <label className="text-xs font-mono text-neutral-400 uppercase flex justify-between">
              <span>País</span>
              {activeLevel !== 'pais' && (
                <button 
                  type="button"
                  onClick={() => { setActiveLevel('pais'); setSelectedObjects([]); }}
                  className="text-[10px] text-orange-500 hover:underline"
                >
                  MULTISELECCIÓN
                </button>
              )}
            </label>
            {activeLevel === 'pais' ? (
              <DualListbox
                value={selectedObjects}
                onChange={setSelectedObjects}
                options={paisOptions}
                placeholder="SELECCIONAR PAÍSES"
                disabled={disabled}
                canFilter={true}
                themeColor="orange"
                availableLabel="DISPONIBLES"
                selectedLabel="SELECCIONADOS"
              />
            ) : (
              <SelectWithPlaceholder
                value={selectedPais}
                onChange={handlePaisChange}
                options={paisOptions}
                placeholder="SELECCIONAR PAÍS"
                themeColor="orange"
                disabled={disabled}
              />
            )}
          </div>

          {/* Nivel 2: Empresa */}
          <div className={`space-y-2 ${activeLevel === 'empresa' ? 'md:col-span-3' : ''}`}>
            <label className="text-xs font-mono text-neutral-400 uppercase flex justify-between">
              <span>Empresa</span>
              {selectedPais && activeLevel !== 'empresa' && (
                <button 
                  type="button"
                  onClick={() => { setActiveLevel('empresa'); setSelectedObjects([]); }}
                  className="text-[10px] text-orange-500 hover:underline"
                >
                  MULTISELECCIÓN
                </button>
              )}
            </label>
            {activeLevel === 'empresa' ? (
              <DualListbox
                value={selectedObjects}
                onChange={setSelectedObjects}
                options={empresaOptions}
                placeholder="SELECCIONAR EMPRESAS"
                disabled={disabled || !selectedPais}
                canFilter={true}
                themeColor="orange"
                availableLabel="DISPONIBLES"
                selectedLabel="SELECCIONADOS"
              />
            ) : (
              <SelectWithPlaceholder
                value={selectedEmpresa}
                onChange={handleEmpresaChange}
                options={empresaOptions}
                placeholder={selectedPais ? "SELECCIONAR EMPRESA" : "---"}
                themeColor="orange"
                disabled={disabled || !selectedPais}
              />
            )}
          </div>

          {/* Nivel 3: Fundo */}
          <div className={`space-y-2 ${activeLevel === 'fundo' ? 'md:col-span-3' : ''}`}>
            <label className="text-xs font-mono text-neutral-400 uppercase flex justify-between">
              <span>Fundo</span>
              {selectedEmpresa && activeLevel !== 'fundo' && (
                <button 
                  type="button"
                  onClick={() => { setActiveLevel('fundo'); setSelectedObjects([]); }}
                  className="text-[10px] text-orange-500 hover:underline"
                >
                  MULTISELECCIÓN
                </button>
              )}
            </label>
            {activeLevel === 'fundo' ? (
              <DualListbox
                value={selectedObjects}
                onChange={setSelectedObjects}
                options={fundoOptions}
                placeholder="SELECCIONAR FUNDOS"
                disabled={disabled || !selectedEmpresa}
                canFilter={true}
                themeColor="orange"
                availableLabel="DISPONIBLES"
                selectedLabel="SELECCIONADOS"
              />
            ) : (
              <SelectWithPlaceholder
                value={selectedFundo}
                onChange={handleFundoChange}
                options={fundoOptions}
                placeholder={selectedEmpresa ? "SELECCIONAR FUNDO" : "---"}
                themeColor="orange"
                disabled={disabled || !selectedEmpresa}
              />
            )}
          </div>

          {/* Nivel 4: Ubicación */}
          <div className={`space-y-2 ${activeLevel === 'ubicacion' ? 'md:col-span-3' : ''}`}>
            <label className="text-xs font-mono text-neutral-400 uppercase flex justify-between">
              <span>Ubicación</span>
              {selectedFundo && activeLevel !== 'ubicacion' && (
                <button 
                  type="button"
                  onClick={() => { setActiveLevel('ubicacion'); setSelectedObjects([]); }}
                  className="text-[10px] text-orange-500 hover:underline"
                >
                  MULTISELECCIÓN
                </button>
              )}
            </label>
            {activeLevel === 'ubicacion' ? (
              <DualListbox
                value={selectedObjects}
                onChange={setSelectedObjects}
                options={ubicacionOptions}
                placeholder="SELECCIONAR UBICACIONES"
                disabled={disabled || !selectedFundo}
                canFilter={true}
                themeColor="orange"
                availableLabel="DISPONIBLES"
                selectedLabel="SELECCIONADOS"
              />
            ) : (
              <SelectWithPlaceholder
                value={selectedUbicacion}
                onChange={handleUbicacionChange}
                options={ubicacionOptions}
                placeholder={selectedFundo ? "SELECCIONAR UBICACIÓN" : "---"}
                themeColor="orange"
                disabled={disabled || !selectedFundo}
              />
            )}
          </div>

          {/* Nivel 5: Nodo */}
          <div className={`space-y-2 ${activeLevel === 'nodo' ? 'md:col-span-3' : ''}`}>
            <label className="text-xs font-mono text-neutral-400 uppercase flex justify-between">
              <span>Nodo</span>
              {selectedUbicacion && activeLevel !== 'nodo' && (
                <button 
                  type="button"
                  onClick={() => { setActiveLevel('nodo'); setSelectedObjects([]); }}
                  className="text-[10px] text-orange-500 hover:underline"
                >
                  MULTISELECCIÓN
                </button>
              )}
            </label>
            {activeLevel === 'nodo' ? (
              <DualListbox
                value={selectedObjects}
                onChange={setSelectedObjects}
                options={nodoOptions}
                placeholder="SELECCIONAR NODOS"
                disabled={disabled || !selectedUbicacion}
                canFilter={true}
                themeColor="orange"
                availableLabel="DISPONIBLES"
                selectedLabel="SELECCIONADOS"
              />
            ) : (
              <SelectWithPlaceholder
                value={selectedNodo}
                onChange={handleNodoChange}
                options={nodoOptions}
                placeholder={selectedUbicacion ? "SELECCIONAR NODO" : "---"}
                themeColor="orange"
                disabled={disabled || !selectedUbicacion}
              />
            )}
          </div>

          {/* Nivel 6: Localización */}
          <div className={`space-y-2 ${activeLevel === 'localizacion' ? 'md:col-span-3' : ''}`}>
            <label className="text-xs font-mono text-neutral-400 uppercase flex justify-between">
              <span>Localización</span>
              {selectedNodo && activeLevel !== 'localizacion' && (
                <button 
                  type="button"
                  onClick={() => { setActiveLevel('localizacion'); setSelectedObjects([]); }}
                  className="text-[10px] text-orange-500 hover:underline"
                >
                  MULTISELECCIÓN
                </button>
              )}
            </label>
            <DualListbox
              value={activeLevel === 'localizacion' ? selectedObjects : []}
              onChange={handleLocalizacionChange}
              options={localizacionOptions}
              placeholder={selectedNodo ? "SELECCIONAR LOCALIZACIONES" : "---"}
              disabled={disabled || !selectedNodo || activeLevel !== 'localizacion'}
              canFilter={true}
              themeColor="orange"
              availableLabel="DISPONIBLES"
              selectedLabel="SELECCIONADOS"
            />
          </div>
        </div>

        {/* Resumen de selección */}
        <div className="mt-4 p-3 bg-neutral-900/50 rounded border border-neutral-700 font-mono text-xs">
          <div className="flex justify-between items-center">
            <span className="text-neutral-400 uppercase">Nivel Activo: <span className="text-orange-500 font-bold">{activeLevel.toUpperCase()}</span></span>
            <span className="text-neutral-400 uppercase">Objetos Seleccionados: <span className="text-orange-500 font-bold">{selectedObjects.length}</span></span>
          </div>
        </div>
      </div>
    </div>
  );
};
