import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/supabase-auth';

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetLogin, setResetLogin] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  const { signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await signIn(email, password);
      
      if (!result.success) {
        setError(result.error || 'Error al iniciar sesión');
      }
    } catch (error) {
      setError('Error inesperado durante el inicio de sesión');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    setResetError('');
    setResetSuccess(false);

    try {
      const result = await authService.resetPassword(resetLogin);
      
      if (!result.success) {
        setResetError(result.error || 'Error al resetear la contraseña');
      } else {
        setResetSuccess(true);
        setTimeout(() => {
          setShowResetModal(false);
          setResetLogin('');
          setResetSuccess(false);
        }, 3000);
      }
    } catch (error) {
      setResetError('Error inesperado durante el reset de contraseña');
    } finally {
      setResetLoading(false);
    }
  };

  const handleOpenResetModal = () => {
    setShowResetModal(true);
    setResetLogin('');
    setResetError('');
    setResetSuccess(false);
  };

  const handleCloseResetModal = () => {
    setShowResetModal(false);
    setResetLogin('');
    setResetError('');
    setResetSuccess(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-black flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-24 h-24 flex items-center justify-center">
            <img 
              src="/Logo - icono.png" 
              alt="JoySense Logo" 
              className="w-full h-full object-contain"
            />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-orange-500 font-mono tracking-wider">
          JOYSENSE APP
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-neutral-900 py-8 px-4 shadow-xl sm:rounded-xl sm:px-10 border border-gray-300 dark:border-neutral-700">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-900 border border-red-600 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-300 font-mono">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-orange-500 font-mono tracking-wider">
                CORREO ELECTRÓNICO
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-md placeholder-gray-500 dark:placeholder-neutral-400 bg-gray-100 dark:bg-neutral-800 text-gray-900 dark:text-white focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm font-mono"
                  placeholder="usuario@ejemplo.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-orange-500 font-mono tracking-wider">
                CONTRASEÑA
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-md placeholder-gray-500 dark:placeholder-neutral-400 bg-gray-100 dark:bg-neutral-800 text-gray-900 dark:text-white focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm font-mono"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:bg-neutral-400 disabled:cursor-not-allowed transition-colors duration-200 font-mono tracking-wider"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    INICIANDO SESIÓN...
                  </div>
                ) : (
                  'INICIAR SESIÓN'
                )}
              </button>
            </div>
          </form>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={handleOpenResetModal}
              className="text-sm text-orange-500 hover:text-orange-600 font-mono tracking-wider underline focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 rounded"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-neutral-600" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-neutral-900 text-gray-500 dark:text-neutral-400 font-mono tracking-wider">SISTEMA DE MONITOREO AGRÍCOLA</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Reset de Contraseña */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-xl max-w-md w-full p-6 border border-gray-300 dark:border-neutral-700">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white font-mono tracking-wider">
                RECUPERAR CONTRASEÑA
              </h2>
              <button
                onClick={handleCloseResetModal}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {resetSuccess ? (
              <div className="mb-4 p-4 bg-green-900 border border-green-600 rounded-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-green-300 font-mono">
                      Se ha enviado una nueva contraseña al correo registrado. Revisa tu bandeja de entrada.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-600 dark:text-neutral-400 mb-4 font-mono">
                  Ingresa tu correo electrónico o login para recibir una nueva contraseña por correo.
                </p>

                {resetError && (
                  <div className="mb-4 p-4 bg-red-900 border border-red-600 rounded-md">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-red-300 font-mono">{resetError}</p>
                      </div>
                    </div>
                  </div>
                )}

                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div>
                    <label htmlFor="resetLogin" className="block text-sm font-medium text-orange-500 font-mono tracking-wider mb-1">
                      CORREO ELECTRÓNICO O LOGIN
                    </label>
                    <input
                      id="resetLogin"
                      name="resetLogin"
                      type="text"
                      required
                      value={resetLogin}
                      onChange={(e) => setResetLogin(e.target.value)}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-md placeholder-gray-500 dark:placeholder-neutral-400 bg-gray-100 dark:bg-neutral-800 text-gray-900 dark:text-white focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm font-mono"
                      placeholder="usuario@ejemplo.com"
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={handleCloseResetModal}
                      disabled={resetLoading}
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-neutral-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-neutral-800 hover:bg-gray-50 dark:hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-mono tracking-wider"
                    >
                      CANCELAR
                    </button>
                    <button
                      type="submit"
                      disabled={resetLoading}
                      className="flex-1 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:bg-neutral-400 disabled:cursor-not-allowed transition-colors font-mono tracking-wider"
                    >
                      {resetLoading ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          ENVIANDO...
                        </div>
                      ) : (
                        'ENVIAR'
                      )}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginForm;
