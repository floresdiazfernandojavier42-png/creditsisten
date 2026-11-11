import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogOut, ChevronDown, LayoutDashboard, Users, CreditCard, Receipt } from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenLoginModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onSelectTab, onOpenLoginModal }) => {
  const { currentUser, isAdmin, isClient, logout, switchUser, availableUsers } = useAuth();
  const [showSwitchDropdown, setShowSwitchDropdown] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-purple-100 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Single text element wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => onSelectTab('dashboard')}
              className="text-left group cursor-pointer focus:outline-none"
            >
              <span className="text-xl font-bold tracking-tight text-purple-950 group-hover:text-purple-700 transition-colors whitespace-nowrap">
                Credi<span className="text-purple-600 font-extrabold">Master</span>
              </span>
            </button>
          </div>

          {/* Zone 2: Navigation Links (Clean text, single-line, hover underlines) */}
          {currentUser && (
            <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-neutral-600">
              <button
                onClick={() => onSelectTab('dashboard')}
                className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 cursor-pointer ${
                  currentTab === 'dashboard'
                    ? 'border-purple-600 text-purple-950 font-semibold'
                    : 'border-transparent hover:text-purple-900 hover:border-purple-200'
                }`}
              >
                Panel General
              </button>

              {isAdmin && (
                <button
                  onClick={() => onSelectTab('clients')}
                  className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 cursor-pointer ${
                    currentTab === 'clients'
                      ? 'border-purple-600 text-purple-950 font-semibold'
                      : 'border-transparent hover:text-purple-900 hover:border-purple-200'
                  }`}
                >
                  Clientes
                </button>
              )}

              <button
                onClick={() => onSelectTab('credits')}
                className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 cursor-pointer ${
                  currentTab === 'credits'
                    ? 'border-purple-600 text-purple-950 font-semibold'
                    : 'border-transparent hover:text-purple-900 hover:border-purple-200'
                }`}
              >
                {isAdmin ? 'Créditos' : 'Mis Créditos'}
              </button>

              <button
                onClick={() => onSelectTab('payments')}
                className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 cursor-pointer ${
                  currentTab === 'payments'
                    ? 'border-purple-600 text-purple-950 font-semibold'
                    : 'border-transparent hover:text-purple-900 hover:border-purple-200'
                }`}
              >
                {isAdmin ? 'Pagos y Recibos' : 'Mis Pagos'}
              </button>
            </nav>
          )}

          {/* Zone 3: 1 Primary Action / User Profile */}
          <div className="flex items-center gap-3 shrink-0">
            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setShowSwitchDropdown(!showSwitchDropdown)}
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg border border-purple-200 bg-purple-50/50 hover:bg-purple-100/60 transition-colors text-left cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-full bg-purple-700 text-white flex items-center justify-center font-bold text-xs">
                    {currentUser.name.charAt(0)}
                  </div>
                  <div className="hidden sm:block text-xs leading-tight">
                    <p className="font-semibold text-purple-950 whitespace-nowrap">{currentUser.name}</p>
                    <p className="text-purple-600 capitalize text-[11px]">
                      {currentUser.role === 'admin' ? 'Administrador' : 'Cliente'}
                    </p>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-purple-600 ml-0.5" />
                </button>

                {/* Dropdown for logout only - zero other accounts or admin lists exposed */}
                {showSwitchDropdown && (
                  <div
                    className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-purple-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-100"
                    onMouseLeave={() => setShowSwitchDropdown(false)}
                  >
                    <div className="px-3.5 py-2.5 border-b border-neutral-100 text-xs">
                      <p className="font-bold text-neutral-900">{currentUser.name}</p>
                      <p className="text-[11px] text-neutral-400 font-mono mt-0.5">{currentUser.email}</p>
                      <div className="mt-1.5">
                        <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-purple-100 text-purple-800">
                          {currentUser.role === 'admin' ? 'Administrador' : 'Cliente'}
                        </span>
                      </div>
                    </div>

                    <div className="pt-1.5">
                      <button
                        onClick={() => {
                          logout();
                          setShowSwitchDropdown(false);
                        }}
                        className="w-full px-3.5 py-2 text-left text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-colors cursor-pointer font-medium"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Cerrar Sesión</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={onOpenLoginModal}
                className="px-4 py-2 text-xs font-semibold text-white bg-purple-700 hover:bg-purple-800 rounded-lg transition-colors shadow-xs whitespace-nowrap shrink-0 cursor-pointer"
              >
                Iniciar Sesión
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile nav bar */}
      {currentUser && (
        <div className="md:hidden flex items-center justify-around border-t border-purple-100 bg-white py-2 px-2 text-xs font-medium text-neutral-600">
          <button
            onClick={() => onSelectTab('dashboard')}
            className={`flex flex-col items-center gap-0.5 ${currentTab === 'dashboard' ? 'text-purple-700 font-bold' : ''}`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Panel</span>
          </button>
          {isAdmin && (
            <button
              onClick={() => onSelectTab('clients')}
              className={`flex flex-col items-center gap-0.5 ${currentTab === 'clients' ? 'text-purple-700 font-bold' : ''}`}
            >
              <Users className="w-4 h-4" />
              <span>Clientes</span>
            </button>
          )}
          <button
            onClick={() => onSelectTab('credits')}
            className={`flex flex-col items-center gap-0.5 ${currentTab === 'credits' ? 'text-purple-700 font-bold' : ''}`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Créditos</span>
          </button>
          <button
            onClick={() => onSelectTab('payments')}
            className={`flex flex-col items-center gap-0.5 ${currentTab === 'payments' ? 'text-purple-700 font-bold' : ''}`}
          >
            <Receipt className="w-4 h-4" />
            <span>Pagos</span>
          </button>
        </div>
      )}
    </header>
  );
};
