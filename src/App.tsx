import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { LoginModal } from './components/auth/LoginModal';
import { AdminDashboard } from './components/dashboard/AdminDashboard';
import { ClientDashboard } from './components/dashboard/ClientDashboard';
import { ClientList } from './components/clients/ClientList';
import { ClientModal } from './components/clients/ClientModal';
import { ClientDetailModal } from './components/clients/ClientDetailModal';
import { CreditList } from './components/credits/CreditList';
import { CreditModal } from './components/credits/CreditModal';
import { CreditDetailModal } from './components/credits/CreditDetailModal';
import { AccountStatementModal } from './components/credits/AccountStatementModal';
import { PaymentList } from './components/payments/PaymentList';
import { PaymentModal } from './components/payments/PaymentModal';
import { ReceiptModal } from './components/payments/ReceiptModal';
import { NotificationToast } from './components/common/NotificationToast';
import { Client, Credit, Payment } from './types';
import { storageService } from './services/storageService';
import { RefreshCw, Shield } from 'lucide-react';

function MainApp() {
  const { currentUser, isAdmin, isClient, refreshUserData } = useAuth();

  // Navigation tab (without Laravel code tab)
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'clients' | 'credits' | 'payments'>('dashboard');

  // Modals state
  const [showLoginModal, setShowLoginModal] = useState(!currentUser);
  const [clientModalState, setClientModalState] = useState<{ isOpen: boolean; client?: Client | null }>({ isOpen: false });
  const [clientDetailState, setClientDetailState] = useState<{ isOpen: boolean; client?: Client | null }>({ isOpen: false });
  const [creditModalState, setCreditModalState] = useState<{ isOpen: boolean; credit?: Credit | null; initialClientId?: string }>({ isOpen: false });
  const [creditDetailState, setCreditDetailState] = useState<{ isOpen: boolean; credit?: Credit | null }>({ isOpen: false });
  const [statementModalState, setStatementModalState] = useState<{ isOpen: boolean; credit?: Credit | null }>({ isOpen: false });
  const [paymentModalState, setPaymentModalState] = useState<{ isOpen: boolean; payment?: Payment | null; initialCreditId?: string }>({ isOpen: false });
  const [receiptModalState, setReceiptModalState] = useState<{ isOpen: boolean; payment?: Payment | null }>({ isOpen: false });

  // Notifications
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });

  const notify = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    refreshUserData();
  };

  const handleResetData = () => {
    if (window.confirm('¿Desea restaurar todos los datos de prueba a sus valores iniciales?')) {
      storageService.resetToDefault();
      refreshUserData();
      notify('success', 'Base de datos restaurada a los datos de prueba predeterminados.');
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50/70 text-neutral-900 flex flex-col selection:bg-purple-500 selection:text-white">
      {/* Top Bar Navigation */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          if (tab === 'clients' && !isAdmin) {
            notify('error', 'Acceso denegado: este módulo está reservado para el Administrador.');
            return;
          }
          setCurrentTab(tab as any);
        }}
        onOpenLoginModal={() => setShowLoginModal(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-7">
        {!currentUser ? (
          <div className="py-16 text-center max-w-xl mx-auto space-y-4">
            <div className="w-16 h-16 bg-purple-100 text-purple-700 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
              <Shield className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
              Sistema de Gestión de Créditos
            </h1>
            <p className="text-sm text-neutral-500 leading-relaxed">
              Plataforma integral con control de límites crediticios, amortización de cuotas y emisión de recibos en PDF.
            </p>
            <button
              onClick={() => setShowLoginModal(true)}
              className="px-5 py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Iniciar Sesión para Acceder
            </button>
          </div>
        ) : (
          <>
            {/* Dashboard View */}
            {currentTab === 'dashboard' && (
              <>
                {isAdmin ? (
                  <AdminDashboard
                    onNavigate={(tab) => setCurrentTab(tab as any)}
                    onOpenNewCredit={() => setCreditModalState({ isOpen: true })}
                    onOpenNewClient={() => setClientModalState({ isOpen: true })}
                    onOpenNewPayment={(creditId) => setPaymentModalState({ isOpen: true, initialCreditId: creditId })}
                    onViewReceipt={(p) => setReceiptModalState({ isOpen: true, payment: p })}
                    onViewCredit={(c) => setCreditDetailState({ isOpen: true, credit: c })}
                  />
                ) : (
                  <ClientDashboard
                    onNavigate={(tab) => setCurrentTab(tab as any)}
                    onOpenPaymentModal={(creditId) => setPaymentModalState({ isOpen: true, initialCreditId: creditId })}
                    onViewReceipt={(p) => setReceiptModalState({ isOpen: true, payment: p })}
                    onViewCredit={(c) => setCreditDetailState({ isOpen: true, credit: c })}
                  />
                )}
              </>
            )}

            {/* Clients Management (Admin only) */}
            {currentTab === 'clients' && isAdmin && (
              <ClientList
                onOpenCreate={() => setClientModalState({ isOpen: true })}
                onOpenEdit={(client) => setClientModalState({ isOpen: true, client })}
                onOpenDetail={(client) => setClientDetailState({ isOpen: true, client })}
                onNotification={notify}
              />
            )}

            {/* Credits Management */}
            {currentTab === 'credits' && (
              <CreditList
                onOpenCreate={() => setCreditModalState({ isOpen: true })}
                onOpenEdit={(credit) => setCreditModalState({ isOpen: true, credit })}
                onOpenDetail={(credit) => setCreditDetailState({ isOpen: true, credit })}
                onOpenStatement={(credit) => setStatementModalState({ isOpen: true, credit })}
                onOpenPayment={(creditId) => setPaymentModalState({ isOpen: true, initialCreditId: creditId })}
                onNotification={notify}
              />
            )}

            {/* Payments & Receipts */}
            {currentTab === 'payments' && (
              <PaymentList
                onOpenCreate={(creditId) => setPaymentModalState({ isOpen: true, initialCreditId: creditId })}
                onOpenEdit={(payment) => setPaymentModalState({ isOpen: true, payment })}
                onViewReceipt={(payment) => setReceiptModalState({ isOpen: true, payment })}
                onNotification={notify}
              />
            )}
          </>
        )}
      </main>

      {/* Quiet Footer */}
      <footer className="no-print mt-auto border-t border-purple-100 bg-white py-4 px-4 sm:px-6 lg:px-8 text-xs text-neutral-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-purple-950">CrediMaster</span>
            <span>·</span>
            <span>Sistema de Gestión de Créditos</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleResetData}
              className="text-[11px] text-neutral-500 hover:text-purple-700 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Restaurar datos de prueba</span>
            </button>
            <span className="text-neutral-300">·</span>
            <span className="text-[11px] text-neutral-400">Ambiente Seguro</span>
          </div>
        </div>
      </footer>

      {/* Modals & Dialogs */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />

      {clientModalState.isOpen && (
        <ClientModal
          isOpen={clientModalState.isOpen}
          clientToEdit={clientModalState.client}
          onClose={() => setClientModalState({ isOpen: false })}
          onSuccess={(msg) => notify('success', msg)}
        />
      )}

      {clientDetailState.isOpen && (
        <ClientDetailModal
          isOpen={clientDetailState.isOpen}
          client={clientDetailState.client || null}
          onClose={() => setClientDetailState({ isOpen: false })}
          onGrantCredit={(clientId) => setCreditModalState({ isOpen: true, initialClientId: clientId })}
          onViewCredit={(credit) => setCreditDetailState({ isOpen: true, credit })}
          onViewReceipt={(payment) => setReceiptModalState({ isOpen: true, payment })}
        />
      )}

      {creditModalState.isOpen && (
        <CreditModal
          isOpen={creditModalState.isOpen}
          creditToEdit={creditModalState.credit}
          initialClientId={creditModalState.initialClientId}
          onClose={() => setCreditModalState({ isOpen: false })}
          onSuccess={(msg) => notify('success', msg)}
        />
      )}

      {creditDetailState.isOpen && (
        <CreditDetailModal
          isOpen={creditDetailState.isOpen}
          credit={creditDetailState.credit || null}
          onClose={() => setCreditDetailState({ isOpen: false })}
          onOpenPayment={(creditId) => setPaymentModalState({ isOpen: true, initialCreditId: creditId })}
          onOpenStatement={(credit) => setStatementModalState({ isOpen: true, credit })}
          onViewReceipt={(payment) => setReceiptModalState({ isOpen: true, payment })}
          isAdmin={isAdmin}
          onNotification={notify}
        />
      )}

      {statementModalState.isOpen && (
        <AccountStatementModal
          isOpen={statementModalState.isOpen}
          credit={statementModalState.credit || null}
          onClose={() => setStatementModalState({ isOpen: false })}
        />
      )}

      {paymentModalState.isOpen && (
        <PaymentModal
          isOpen={paymentModalState.isOpen}
          paymentToEdit={paymentModalState.payment}
          initialCreditId={paymentModalState.initialCreditId}
          onClose={() => setPaymentModalState({ isOpen: false })}
          onSuccess={(p, msg) => {
            notify('success', msg);
            setReceiptModalState({ isOpen: true, payment: p });
          }}
        />
      )}

      {receiptModalState.isOpen && (
        <ReceiptModal
          isOpen={receiptModalState.isOpen}
          payment={receiptModalState.payment || null}
          onClose={() => setReceiptModalState({ isOpen: false })}
        />
      )}

      {/* Global Toast Notification */}
      <NotificationToast
        type={notification.type}
        message={notification.message}
        onClose={() => setNotification({ type: null, message: '' })}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
