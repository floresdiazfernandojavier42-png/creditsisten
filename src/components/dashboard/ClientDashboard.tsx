import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { storageService } from '../../services/storageService';
import { formatCurrency, formatDate } from '../../services/creditCalculator';
import { Credit, Payment } from '../../types';
import { CreditCard, Wallet, ReceiptText, ArrowUpRight, CheckCircle2, ShieldCheck, Plus, Key, Lock, Eye, EyeOff, X } from 'lucide-react';

interface ClientDashboardProps {
  onNavigate: (tab: string) => void;
  onOpenPaymentModal: (creditId?: string) => void;
  onViewReceipt: (payment: Payment) => void;
  onViewCredit: (credit: Credit) => void;
}

export const ClientDashboard: React.FC<ClientDashboardProps> = ({
  onNavigate,
  onOpenPaymentModal,
  onViewReceipt,
  onViewCredit,
}) => {
  const { currentClient, currentUser } = useAuth();

  if (!currentUser?.clientId) {
    return (
      <div className="bg-white p-8 rounded-xl border border-neutral-200 text-center">
        <p className="text-sm text-neutral-600">No se encontró información de cliente asociada a esta cuenta.</p>
      </div>
    );
  }

  const metrics = storageService.getClientDashboardMetrics(currentUser.clientId);
  const clientCredits = storageService.getCreditsByClient(currentUser.clientId);
  const clientPayments = storageService.getPaymentsByClient(currentUser.clientId);

  const activeCreditsList = clientCredits.filter(
    (c) => c.status === 'activo' || c.status === 'vencido'
  );

  // Self-service password state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newChosenPass, setNewChosenPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [passError, setPassError] = useState('');
  const [passSuccess, setPassSuccess] = useState('');

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-purple-900 to-purple-800 rounded-2xl p-6 text-white shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs uppercase tracking-wider text-purple-200 font-semibold">
                Portal de Autoservicio Financiero
              </span>
              <span className="text-purple-300">·</span>
              <span className="text-xs text-purple-200">Doc: {metrics.client?.documentNumber}</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              Bienvenido, {metrics.client?.firstName} {metrics.client?.lastName}
            </h1>
            <p className="text-xs text-purple-200 mt-1 max-w-xl">
              Consulte sus créditos vigentes, estados de cuenta y registre pagos en línea con emisión inmediata de comprobantes.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => {
                setShowPasswordModal(true);
                setPassError('');
                setPassSuccess('');
                setNewChosenPass('');
                setConfirmPass('');
              }}
              className="px-3.5 py-2.5 bg-purple-800/80 hover:bg-purple-800 border border-purple-500/30 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Key className="w-3.5 h-3.5 text-purple-300" />
              <span>Mi Contraseña</span>
            </button>

            {activeCreditsList.length > 0 && (
              <button
                onClick={() => onOpenPaymentModal(activeCreditsList[0].id)}
                className="px-4 py-2.5 bg-white text-purple-900 hover:bg-purple-50 font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4 text-purple-700" />
                <span>Realizar Abono a Crédito</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Financial Health Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Saldo Total Pendiente */}
        <div className="bg-white rounded-xl border border-neutral-200/80 p-5 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-xs font-medium">Saldo Total Pendiente</span>
            <Wallet className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-purple-950 font-tabular">
            {formatCurrency(metrics.totalOutstandingDebt)}
          </div>
          <div className="mt-2 text-[11px] text-neutral-500">
            {activeCreditsList.length} crédito(s) con saldo por liquidar
          </div>
        </div>

        {/* Límite de Crédito Disponible */}
        <div className="bg-white rounded-xl border border-neutral-200/80 p-5 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-xs font-medium">Límite Disponible</span>
            <CreditCard className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-neutral-900 font-tabular">
            {formatCurrency(metrics.availableCredit)}
          </div>
          <div className="mt-2 text-[11px] text-neutral-500">
            De un límite total aprobado de {formatCurrency(metrics.creditLimit)}
          </div>
        </div>

        {/* Total Pagado Histórico */}
        <div className="bg-white rounded-xl border border-neutral-200/80 p-5 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-xs font-medium">Total Pagado Histórico</span>
            <ReceiptText className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-neutral-900 font-tabular">
            {formatCurrency(metrics.totalPaid)}
          </div>
          <div className="mt-2 text-[11px] text-neutral-500">
            {clientPayments.length} abonos efectuados puntualmente
          </div>
        </div>
      </div>

      {/* Split View: My Active Credits & My Recent Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mis Créditos Activos */}
        <div className="bg-white rounded-xl border border-neutral-200/80 p-5 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100 mb-4">
            <div>
              <h2 className="text-sm font-bold text-neutral-900">Mis Créditos Vigentes</h2>
              <p className="text-xs text-neutral-500">Créditos con saldos pendientes por amortizar</p>
            </div>
            <button
              onClick={() => onNavigate('credits')}
              className="text-xs font-semibold text-purple-700 hover:text-purple-900 cursor-pointer"
            >
              Ver todos
            </button>
          </div>

          {activeCreditsList.length === 0 ? (
            <div className="py-8 text-center text-xs text-neutral-500 flex flex-col items-center">
              <CheckCircle2 className="w-6 h-6 text-emerald-500 mb-2" />
              <p className="font-medium text-neutral-700">¡Al día! No tiene créditos activos con saldo pendiente.</p>
              <p className="text-neutral-400 mt-1">Consulte con su asesor para nuevas solicitudes.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeCreditsList.map((c) => {
                const paidPercentage = Math.round(
                  ((c.totalToPay - c.remainingBalance) / c.totalToPay) * 100
                );
                return (
                  <div
                    key={c.id}
                    className="p-4 rounded-xl border border-neutral-100 bg-neutral-50/50 hover:bg-neutral-50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-neutral-900 font-tabular text-xs">{c.id}</span>
                        <span
                          className={`text-[10px] font-medium px-2 py-0.5 rounded capitalize ${
                            c.status === 'vencido'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}
                        >
                          {c.status}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-purple-950 font-tabular">
                        {formatCurrency(c.remainingBalance)} por pagar
                      </span>
                    </div>

                    <div className="w-full bg-neutral-200 h-1.5 rounded-full overflow-hidden mb-2">
                      <div
                        className="bg-purple-600 h-full rounded-full transition-all duration-300"
                        style={{ width: `${paidPercentage}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-neutral-500 mb-3">
                      <span>Cuota mensual: {formatCurrency(c.monthlyFee)}</span>
                      <span>Vencimiento: {formatDate(c.dueDate)}</span>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-200/50">
                      <button
                        onClick={() => onViewCredit(c)}
                        className="px-2.5 py-1 text-xs font-medium text-neutral-700 hover:text-neutral-900 hover:bg-neutral-200/60 rounded transition-colors cursor-pointer"
                      >
                        Estado de Cuenta
                      </button>
                      <button
                        onClick={() => onOpenPaymentModal(c.id)}
                        className="px-3 py-1 text-xs font-semibold text-white bg-purple-700 hover:bg-purple-800 rounded transition-colors cursor-pointer"
                      >
                        Abonar Ahora
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Mis Últimos Pagos */}
        <div className="bg-white rounded-xl border border-neutral-200/80 p-5 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100 mb-4">
            <div>
              <h2 className="text-sm font-bold text-neutral-900">Mis Últimos Abonos</h2>
              <p className="text-xs text-neutral-500">Historial reciente con descarga de recibos</p>
            </div>
            <button
              onClick={() => onNavigate('payments')}
              className="text-xs font-semibold text-purple-700 hover:text-purple-900 cursor-pointer"
            >
              Historial completo
            </button>
          </div>

          {metrics.recentPayments.length === 0 ? (
            <div className="py-8 text-center text-xs text-neutral-500">
              Aún no registra abonos realizados a sus créditos.
            </div>
          ) : (
            <div className="divide-y divide-neutral-100">
              {metrics.recentPayments.map((p) => (
                <div key={p.id} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-neutral-900 text-xs font-tabular">
                        {p.receiptNumber}
                      </span>
                      <span className="text-[11px] text-neutral-400">·</span>
                      <span className="text-[11px] text-neutral-500">{formatDate(p.paymentDate)}</span>
                    </div>
                    <p className="text-[11px] text-neutral-400 font-tabular mt-0.5">
                      Crédito: {p.creditId} · Ref: {p.reference}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-bold text-xs text-emerald-700 font-tabular">
                      {formatCurrency(p.amount)}
                    </span>
                    <button
                      onClick={() => onViewReceipt(p)}
                      className="px-2.5 py-1 text-xs font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 rounded transition-colors cursor-pointer"
                    >
                      Ver Recibo
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal para que el cliente elija o cambie su contraseña */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-purple-950/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-purple-100 max-w-sm w-full p-6">
            <div className="flex items-center justify-between pb-3 border-b border-purple-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-neutral-900">Elegir mi Contraseña</h3>
                  <p className="text-[11px] text-neutral-500">Acceso exclusivo a tu portal</p>
                </div>
              </div>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="text-neutral-400 hover:text-neutral-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {passError && (
              <div className="mb-3 p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800">
                {passError}
              </div>
            )}

            {passSuccess && (
              <div className="mb-3 p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 font-medium">
                {passSuccess}
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setPassError('');
                setPassSuccess('');

                if (!newChosenPass || newChosenPass.length < 4) {
                  setPassError('La contraseña debe tener al menos 4 caracteres.');
                  return;
                }

                if (newChosenPass !== confirmPass) {
                  setPassError('Las contraseñas no coinciden.');
                  return;
                }

                const res = storageService.updateClientPassword(currentUser.email, newChosenPass);
                if (res.success) {
                  setPassSuccess('✓ Contraseña guardada con éxito. La usarás para volver a entrar.');
                  setTimeout(() => {
                    setShowPasswordModal(false);
                  }, 1800);
                } else {
                  setPassError(res.error || 'Error al guardar la contraseña.');
                }
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Nueva Contraseña que elijas
                </label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    required
                    value={newChosenPass}
                    onChange={(e) => setNewChosenPass(e.target.value)}
                    placeholder="Escribe tu nueva contraseña"
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
                  Confirmar Contraseña
                </label>
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  value={confirmPass}
                  onChange={(e) => setConfirmPass(e.target.value)}
                  placeholder="Repite la contraseña"
                  className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>

              <p className="text-[11px] text-neutral-500">
                Esta contraseña quedará guardada permanentemente en el sistema para tus próximos inicios de sesión.
              </p>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-neutral-600 hover:text-neutral-800 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-purple-700 hover:bg-purple-800 rounded-lg shadow-2xs cursor-pointer flex items-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Guardar Contraseña</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
