import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { storageService } from '../../services/storageService';
import { Lock, Mail, AlertCircle, Shield, User, Key, CheckCircle2, ArrowLeft, Eye, EyeOff } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { login } = useAuth();
  const [activeTab, setActiveTab] = useState<'admin' | 'cliente'>('admin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Self-service password setup for clients
  const [isSettingPassword, setIsSettingPassword] = useState(false);
  const [setupEmail, setSetupEmail] = useState('');
  const [setupDui, setSetupDui] = useState('');
  const [newChosenPassword, setNewChosenPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setIsLoading(true);

    setTimeout(() => {
      // Pass targetRole so clients CAN NEVER enter as admin
      const res = login(email, password, activeTab);
      setIsLoading(false);
      if (res.success) {
        setEmail('');
        setPassword('');
        onClose();
      } else {
        setErrorMessage(res.error || 'Credenciales incorrectas');
      }
    }, 200);
  };

  const handleSaveCustomPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const cleanEmail = setupEmail.trim().toLowerCase();
    const cleanDui = setupDui.trim();

    if (!cleanEmail.endsWith('@gmail.com')) {
      setErrorMessage('El correo debe pertenecer a @gmail.com');
      return;
    }

    if (cleanDui.length !== 9 || !/^\d{9}$/.test(cleanDui)) {
      setErrorMessage('El DUI debe tener exactamente 9 dígitos numéricos.');
      return;
    }

    if (!newChosenPassword || newChosenPassword.length < 4) {
      setErrorMessage('La contraseña elegida debe tener al menos 4 caracteres.');
      return;
    }

    if (newChosenPassword !== confirmPassword) {
      setErrorMessage('Las contraseñas ingresadas no coinciden.');
      return;
    }

    // Verify client exists with this email and DUI
    const client = storageService.getClientByEmail(cleanEmail);
    if (!client || client.documentNumber !== cleanDui) {
      setErrorMessage('No se encontró un cliente con este correo y número de DUI.');
      return;
    }

    const res = storageService.updateClientPassword(cleanEmail, newChosenPassword);
    if (res.success) {
      setSuccessMessage('✓ Contraseña guardada con éxito. Ya puedes ingresar con tu nueva clave.');
      setEmail(cleanEmail);
      setPassword(newChosenPassword);
      setIsSettingPassword(false);
      setNewChosenPassword('');
      setConfirmPassword('');
    } else {
      setErrorMessage(res.error || 'Error al guardar la contraseña.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-purple-950/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-purple-100 max-w-md w-full p-6 sm:p-8">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-purple-100 text-purple-700 rounded-xl flex items-center justify-center mx-auto mb-3">
            {activeTab === 'admin' ? <Shield className="w-6 h-6" /> : <User className="w-6 h-6" />}
          </div>
          <h2 className="text-xl font-bold text-neutral-900 tracking-tight">Acceso al Sistema</h2>
          <p className="text-xs text-neutral-500 mt-1">
            Seleccione el tipo de acceso e ingrese sus credenciales.
          </p>
        </div>

        {/* Role Access Selector Tabs */}
        <div className="flex items-center gap-1 p-1 bg-neutral-100 rounded-xl mb-5">
          <button
            type="button"
            onClick={() => {
              setActiveTab('admin');
              setIsSettingPassword(false);
              setErrorMessage('');
              setSuccessMessage('');
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'admin'
                ? 'bg-purple-700 text-white shadow-2xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Acceso Administrativo</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('cliente');
              setErrorMessage('');
              setSuccessMessage('');
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'cliente'
                ? 'bg-purple-700 text-white shadow-2xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Portal de Clientes</span>
          </button>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <p>{errorMessage}</p>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5 text-xs text-emerald-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <p>{successMessage}</p>
          </div>
        )}

        {/* Client Password Choice View */}
        {activeTab === 'cliente' && isSettingPassword ? (
          <form onSubmit={handleSaveCustomPassword} className="space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-purple-100">
              <span className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                <Key className="w-4 h-4 text-purple-700" />
                Elegir o Cambiar mi Contraseña
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsSettingPassword(false);
                  setErrorMessage('');
                }}
                className="text-xs text-neutral-500 hover:text-neutral-800 flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Volver
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Mi Correo Registrado (@gmail.com)
              </label>
              <input
                type="email"
                required
                value={setupEmail}
                onChange={(e) => setSetupEmail(e.target.value)}
                placeholder="ejemplo@gmail.com"
                className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Mi DUI (9 dígitos numéricos)
              </label>
              <input
                type="text"
                required
                maxLength={9}
                value={setupDui}
                onChange={(e) => setSetupDui(e.target.value.replace(/\D/g, '').slice(0, 9))}
                placeholder="024829101"
                className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Nueva Contraseña que elijo
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  value={newChosenPassword}
                  onChange={(e) => setNewChosenPassword(e.target.value)}
                  placeholder="Mínimo 4 caracteres"
                  className="w-full pl-3 pr-9 py-2 text-xs border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-2.5 top-2 text-neutral-400 hover:text-neutral-600 cursor-pointer"
                  tabIndex={-1}
                >
                  {showPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Confirmar mi Contraseña
              </label>
              <input
                type={showPass ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repite la contraseña"
                className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
            </div>

            <p className="text-[11px] text-purple-700/80">
              Esta contraseña quedará guardada en el sistema para que vuelvas a entrar cuando quieras.
            </p>

            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs cursor-pointer flex items-center justify-center gap-2"
            >
              <Key className="w-3.5 h-3.5" />
              <span>Guardar mi contraseña y volver al acceso</span>
            </button>
          </form>
        ) : (
          /* Normal Login Form */
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Correo Electrónico (@gmail.com)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={activeTab === 'admin' ? 'admin@gmail.com' : 'cliente@gmail.com'}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-neutral-700">
                  Contraseña
                </label>
                {activeTab === 'cliente' && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsSettingPassword(true);
                      setSetupEmail(email);
                      setErrorMessage('');
                    }}
                    className="text-[11px] text-purple-700 hover:text-purple-900 font-semibold cursor-pointer"
                  >
                    ¿Elegir o cambiar contraseña?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div className="text-[11px] text-neutral-400">
              {activeTab === 'admin'
                ? 'Acceso restringido a los administradores del sistema.'
                : 'Acceso para consulta de créditos vigentes y pagos con tu contraseña elegida.'}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-purple-700 hover:bg-purple-800 text-white text-sm font-semibold rounded-lg transition-colors shadow-xs cursor-pointer flex items-center justify-center gap-2"
            >
              {isLoading ? 'Verificando...' : activeTab === 'admin' ? 'Ingresar como Administrador' : 'Ingresar como Cliente'}
            </button>
          </form>
        )}

        <div className="mt-5 pt-4 border-t border-neutral-100 text-center">
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-neutral-400 hover:text-neutral-600 transition-colors cursor-pointer"
          >
            Cerrar ventana
          </button>
        </div>
      </div>
    </div>
  );
};
