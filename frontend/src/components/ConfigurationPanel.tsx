import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';

interface ConfigurationPanelProps {
  className?: string;
  selectedSection?: 'basicas' | 'avanzadas'; // Nueva prop para determinar qué mostrar
}

const ConfigurationPanel: React.FC<ConfigurationPanelProps> = ({ className = '', selectedSection = 'basicas' }) => {
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();

  const languages = [
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'en', name: 'English', flag: '🇺🇸' }
  ];

  const currentLanguage = languages.find(lang => lang.code === language) || languages[0];

  // Determinar qué secciones mostrar según selectedSection
  const showBasics = selectedSection === 'basicas';
  const showAdvanced = selectedSection === 'avanzadas';

  return (
    <div className={`space-y-6 ${className}`}>
        {/* Configuración Básica: Idioma y Tema */}
        {showBasics && (
          <>
            {/* Configuración de Idioma */}
            <div className="bg-gray-200 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded-lg p-4">
              <h3 className="text-lg font-bold text-gray-500 mb-3 font-mono tracking-wider uppercase">
                🌐 {t('configuration.language')}
              </h3>
              <div className="space-y-3">
                <p className="text-sm text-gray-600 dark:text-neutral-400 font-mono uppercase">
                  {t('configuration.select_language')}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => setLanguage(lang.code)}
                      className={`p-3 rounded-lg border-2 transition-all duration-200 font-mono tracking-wider uppercase ${
                        language === lang.code
                          ? 'border-gray-500 bg-gray-50 dark:bg-gray-900/20 text-gray-700 dark:text-gray-300'
                          : 'border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-gray-700 dark:text-neutral-300 hover:border-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900/10'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{lang.flag}</span>
                        <div className="text-left">
                          <div className="font-bold uppercase">{lang.name}</div>
                          <div className="text-xs opacity-75 uppercase">{lang.code.toUpperCase()}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="mt-3 p-3 bg-gray-100 dark:bg-neutral-700 rounded-lg">
                  <p className="text-xs text-gray-600 dark:text-neutral-400 font-mono uppercase">
                    <strong>{t('configuration.preview')}</strong> {t('welcome.title')}
                  </p>
                </div>
              </div>
            </div>

            {/* Configuración de Tema */}
            <div className="bg-gray-200 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded-lg p-4">
              <h3 className="text-lg font-bold text-gray-500 mb-3 font-mono tracking-wider uppercase">
                🎨 {t('configuration.theme')}
              </h3>
              <div className="space-y-3">
                <p className="text-sm text-gray-600 dark:text-neutral-400 font-mono uppercase">
                  {t('configuration.select_theme')}
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={toggleTheme}
                    className="flex-1 p-4 rounded-lg border-2 border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 hover:border-gray-400 transition-all duration-200 uppercase"
                  >
                    <div className="flex items-center justify-center space-x-3">
                      {theme === 'dark' ? (
                        <>
                          <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                          <div className="text-left">
                            <div className="font-bold text-gray-800 dark:text-white font-mono uppercase">
                              {t('configuration.light_mode')}
                            </div>
                            <div className="text-xs text-gray-600 dark:text-neutral-400 font-mono uppercase">
                              {t('configuration.switch_to_light')}
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                          </svg>
                          <div className="text-left">
                            <div className="font-bold text-gray-800 dark:text-white font-mono uppercase">
                              {t('configuration.dark_mode')}
                            </div>
                            <div className="text-xs text-gray-600 dark:text-neutral-400 font-mono uppercase">
                              {t('configuration.switch_to_dark')}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </button>
                </div>
                <div className="mt-3 p-3 bg-gray-100 dark:bg-neutral-700 rounded-lg">
                  <p className="text-xs text-gray-600 dark:text-neutral-400 font-mono uppercase">
                    <strong>{t('configuration.current_theme')}</strong> {theme === 'dark' ? (language === 'es' ? 'OSCURO' : 'DARK') : (language === 'es' ? 'CLARO' : 'LIGHT')}
                  </p>
                </div>
              </div>
            </div>

            {/* Información del Sistema (también básica) */}
            <div className="bg-gray-200 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded-lg p-4">
              <h3 className="text-lg font-bold text-gray-500 mb-3 font-mono tracking-wider uppercase">
                ℹ️ {t('configuration.system_info')}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm font-mono uppercase">
                <div>
                  <div className="text-gray-600 dark:text-neutral-400 mb-1">
                    {t('configuration.version')}:
                  </div>
                  <div className="text-gray-800 dark:text-white font-bold">1.0.0</div>
                </div>
                <div>
                  <div className="text-gray-600 dark:text-neutral-400 mb-1">
                    {t('configuration.last_update')}:
                  </div>
                  <div className="text-gray-800 dark:text-white font-bold">
                    {new Date().toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US')}
                  </div>
                </div>
                <div>
                  <div className="text-gray-600 dark:text-neutral-400 mb-1">
                    {t('configuration.active_language')}:
                  </div>
                  <div className="text-gray-800 dark:text-white font-bold uppercase">
                    {currentLanguage.flag} {currentLanguage.name}
                  </div>
                </div>
                <div>
                  <div className="text-gray-600 dark:text-neutral-400 mb-1">
                    {t('configuration.active_theme')}:
                  </div>
                  <div className="text-gray-800 dark:text-white font-bold uppercase">
                    {theme === 'dark' ? (language === 'es' ? '🌙 OSCURO' : '🌙 DARK') : (language === 'es' ? '☀️ CLARO' : '☀️ LIGHT')}
                  </div>
                </div>
              </div>
            </div>

            {/* Botones de Acción */}
            <div className="flex justify-center space-x-3 pt-4">
              <button className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-mono tracking-wider uppercase">
                {t('configuration.save_changes')}
              </button>
              <button className="px-4 py-2 bg-gray-300 dark:bg-neutral-700 text-gray-700 dark:text-neutral-300 rounded-lg hover:bg-gray-400 dark:hover:bg-neutral-600 transition-colors font-mono tracking-wider uppercase">
                {t('configuration.reset')}
              </button>
            </div>
          </>
        )}

        {/* Configuración Avanzada: Notificaciones, Datos, Interfaz */}
        {showAdvanced && (
          <>
            <div className="bg-gray-200 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded-lg p-4">
              <h3 className="text-lg font-bold text-gray-500 mb-3 font-mono tracking-wider uppercase">
                ⚙️ {t('configuration.advanced')}
              </h3>
              <div className="space-y-4">
                {/* Configuración de Notificaciones */}
                <div className="border-b border-gray-300 dark:border-neutral-600 pb-4">
                  <h4 className="font-bold text-gray-800 dark:text-white mb-2 font-mono tracking-wider uppercase">
                    🔔 {t('configuration.notifications')}
                  </h4>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        defaultChecked
                        className="w-4 h-4 text-gray-500 bg-gray-100 dark:bg-neutral-700 border-gray-300 dark:border-neutral-600 rounded focus:ring-gray-500 focus:ring-2"
                      />
                      <span className="text-sm text-gray-700 dark:text-neutral-300 font-mono uppercase">
                        {t('configuration.email_alerts')}
                      </span>
                    </label>
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        defaultChecked
                        className="w-4 h-4 text-gray-500 bg-gray-100 dark:bg-neutral-700 border-gray-300 dark:border-neutral-600 rounded focus:ring-gray-500 focus:ring-2"
                      />
                      <span className="text-sm text-gray-700 dark:text-neutral-300 font-mono uppercase">
                        {t('configuration.push_notifications')}
                      </span>
                    </label>
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        className="w-4 h-4 text-gray-500 bg-gray-100 dark:bg-neutral-700 border-gray-300 dark:border-neutral-600 rounded focus:ring-gray-500 focus:ring-2"
                      />
                      <span className="text-sm text-gray-700 dark:text-neutral-300 font-mono uppercase">
                        {t('configuration.alert_sounds')}
                      </span>
                    </label>
                  </div>
                </div>

                {/* Configuración de Datos */}
                <div className="border-b border-gray-300 dark:border-neutral-600 pb-4">
                  <h4 className="font-bold text-gray-800 dark:text-white mb-2 font-mono tracking-wider uppercase">
                    📊 {t('configuration.data')}
                  </h4>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        defaultChecked
                        className="w-4 h-4 text-gray-500 bg-gray-100 dark:bg-neutral-700 border-gray-300 dark:border-neutral-600 rounded focus:ring-gray-500 focus:ring-2"
                      />
                      <span className="text-sm text-gray-700 dark:text-neutral-300 font-mono uppercase">
                        {t('configuration.auto_refresh')}
                      </span>
                    </label>
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        className="w-4 h-4 text-gray-500 bg-gray-100 dark:bg-neutral-700 border-gray-300 dark:border-neutral-600 rounded focus:ring-gray-500 focus:ring-2"
                      />
                      <span className="text-sm text-gray-700 dark:text-neutral-300 font-mono uppercase">
                        {t('configuration.offline_mode')}
                      </span>
                    </label>
                  </div>
                </div>

                {/* Configuración de Interfaz */}
                <div>
                  <h4 className="font-bold text-gray-800 dark:text-white mb-2 font-mono tracking-wider uppercase">
                    🖥️ {t('configuration.interface')}
                  </h4>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        defaultChecked
                        className="w-4 h-4 text-gray-500 bg-gray-100 dark:bg-neutral-700 border-gray-300 dark:border-neutral-600 rounded focus:ring-gray-500 focus:ring-2"
                      />
                      <span className="text-sm text-gray-700 dark:text-neutral-300 font-mono uppercase">
                        {t('configuration.smooth_animations')}
                      </span>
                    </label>
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        className="w-4 h-4 text-gray-500 bg-gray-100 dark:bg-neutral-700 border-gray-300 dark:border-neutral-600 rounded focus:ring-gray-500 focus:ring-2"
                      />
                      <span className="text-sm text-gray-700 dark:text-neutral-300 font-mono uppercase">
                        {t('configuration.compact_mode')}
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Botones de Acción */}
            <div className="flex justify-center space-x-3 pt-4">
              <button className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-mono tracking-wider uppercase">
                {t('configuration.save_changes')}
              </button>
              <button className="px-4 py-2 bg-gray-300 dark:bg-neutral-700 text-gray-700 dark:text-neutral-300 rounded-lg hover:bg-gray-400 dark:hover:bg-neutral-600 transition-colors font-mono tracking-wider uppercase">
                {t('configuration.reset')}
              </button>
            </div>
          </>
        )}
      </div>
  );
};

export default ConfigurationPanel;
