import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';

interface ConfigurationPanelProps {
  className?: string;
}

const ConfigurationPanel: React.FC<ConfigurationPanelProps> = ({ className = '' }) => {
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();

  const languages = [
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'en', name: 'English', flag: '🇺🇸' }
  ];

  const currentLanguage = languages.find(lang => lang.code === language) || languages[0];

  return (
    <div className={`space-y-6 ${className}`}>
        {/* Configuración Básica: Idioma y Tema */}
        <>
            {/* Configuración de Idioma */}
            <div className="bg-gray-200 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded-lg p-4">
              <h3 className="text-lg font-bold text-gray-500 mb-3 font-mono tracking-wider uppercase flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                </svg>
                {t('configuration.language')}
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
              <h3 className="text-lg font-bold text-gray-500 mb-3 font-mono tracking-wider uppercase flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
                {t('configuration.theme')}
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
              <h3 className="text-lg font-bold text-gray-500 mb-3 font-mono tracking-wider uppercase flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {t('configuration.system_info')}
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

        </>
      </div>
  );
};

export default ConfigurationPanel;
