import React from 'react';
import { Credit, Payment } from '../../types';
import { storageService } from '../../services/storageService';
import { formatCurrency, formatDate, calculateCreditSchedule } from '../../services/creditCalculator';
import { X, CreditCard, DollarSign, Calendar, FileText, CheckCircle2, AlertTriangle, XCircle, Plus, Receipt } from 'lucide-react';

interface CreditDetailModalProps {
  isOpen: boolean;
  credit: Credit | null;
  onClose: () => void;
  onOpenPayment: (creditId: string) => void;
  onOpenStatement: (credit: Credit) => void;
  onViewReceipt: (payment: Payment) => void;
  isAdmin: boolean;
  onNotification: (type: 'success' | 'error', message: string) => void;
}

export const CreditDetailModal: React.FC<CreditDetailModalProps> = ({
  isOpen,
  credit,
  onClose,
  onOpenPayment,
  onOpenStatement,
  onViewReceipt,
  isAdmin,
  onNotification,
}) => {
  if (!isOpen || !credit) return null;

  const payments = storageService.getPaymentsByCredit(credit.id);
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const paidPercent = Math.min(100, Math.round((totalPaid / credit.totalToPay) * 100));

  // Amortization schedule for reference
  const { amortizationTable } = calculateCreditSchedule(
    credit.amount,
    credit.annualInterestRate,
    credit.termMonths,
    credit.grantDate
  );

  const handleCancelCredit = () => {
    if (!window.confirm(`¿Está seguro de que desea cancelar definitivamente el crédito ${credit.id}?`)) {
      return;
    }
    const res = storageService.cancelCredit(credit.id);
    if (res.success) {
      onNotification('success', `Crédito ${credit.id} cancelado exitosamente.`);
      onClose();
    } else {
      onNotification('error', res.error || 'No se pudo cancelar el crédito.');
    }
  };

  const canPay = credit.status === 'activo' || credit.status === 'vencido';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-purple-950/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-purple-100 max-w-4xl w-full p-6 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-neutral-100 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-neutral-900 font-tabular">
                  Detalle del Crédito: {credit.id}
                </h2>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded capitalize ${
                    credit.status === 'activo'
                      ? 'bg-purple-100 text-purple-900'
                      : credit.status === 'vencido'
                      ? 'bg-rose-100 text-rose-800'
                      : credit.status === 'pagado'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-neutral-100 text-neutral-600'
                  }`}
                >
                  {credit.status}
                </span>
              </div>
              <p className="text-xs text-neutral-500">
                Cliente: <span className="font-semibold text-neutral-800">{credit.clientName}</span> · Doc: {credit.clientDocument}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onOpenStatement(credit);
              }}
              className="px-3 py-1.5 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Estado de Cuenta</span>
            </button>

            {canPay && (
              <button
                onClick={() => {
                  onClose();
                  onOpenPayment(credit.id);
                }}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-purple-700 hover:bg-purple-800 rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Registrar Abono</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="text-neutral-400 hover:text-neutral-600 p-1.5 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Progress & Balances Banner */}
        <div className="bg-neutral-50 rounded-xl p-5 border border-neutral-200/80 mb-6">
          <div className="flex items-center justify-between mb-2 text-xs">
            <span className="font-semibold text-neutral-700">Progreso de Amortización de Deuda</span>
            <span className="font-bold text-neutral-900 font-tabular">{paidPercent}% amortizado</span>
          </div>

          <div className="w-full bg-neutral-200 h-2.5 rounded-full overflow-hidden mb-4">
            <div
              className="bg-purple-700 h-full rounded-full transition-all duration-300"
              style={{ width: `${paidPercent}%` }}
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 border-t border-neutral-200 text-xs">
            <div>
              <p className="text-neutral-400 text-[11px]">Capital Otorgado</p>
              <p className="font-bold text-neutral-900 font-tabular text-sm">
                {formatCurrency(credit.amount)}
              </p>
            </div>
            <div>
              <p className="text-neutral-400 text-[11px]">Total Deuda Pactada</p>
              <p className="font-bold text-neutral-900 font-tabular text-sm">
                {formatCurrency(credit.totalToPay)}
              </p>
            </div>
            <div>
              <p className="text-neutral-400 text-[11px]">Total Abonado</p>
              <p className="font-bold text-emerald-700 font-tabular text-sm">
                {formatCurrency(totalPaid)}
              </p>
            </div>
            <div>
              <p className="text-neutral-400 text-[11px]">Saldo Pendiente Actual</p>
              <p className={`font-bold font-tabular text-sm ${credit.remainingBalance > 0 ? 'text-purple-950' : 'text-emerald-700'}`}>
                {formatCurrency(credit.remainingBalance)}
              </p>
            </div>
          </div>
        </div>

        {/* Financial Terms Details */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 text-xs">
          <div className="p-3.5 bg-white rounded-xl border border-neutral-200/80">
            <span className="text-neutral-400 text-[11px] block">Condiciones Financieras</span>
            <div className="mt-1 space-y-1">
              <p className="text-neutral-700">Tasa: <strong className="text-neutral-900 font-tabular">{credit.annualInterestRate}%</strong> anual</p>
              <p className="text-neutral-700">Interés Total: <strong className="text-neutral-900 font-tabular">{formatCurrency(credit.totalInterest)}</strong></p>
            </div>
          </div>

          <div className="p-3.5 bg-white rounded-xl border border-neutral-200/80">
            <span className="text-neutral-400 text-[11px] block">Cuotas y Plazo</span>
            <div className="mt-1 space-y-1">
              <p className="text-neutral-700">Cuota Mensual Fija: <strong className="text-purple-900 font-tabular">{formatCurrency(credit.monthlyFee)}</strong></p>
              <p className="text-neutral-700">Plazo Acordado: <strong className="text-neutral-900 font-tabular">{credit.termMonths} meses</strong></p>
            </div>
          </div>

          <div className="p-3.5 bg-white rounded-xl border border-neutral-200/80">
            <span className="text-neutral-400 text-[11px] block">Fechas Clave</span>
            <div className="mt-1 space-y-1">
              <p className="text-neutral-700">Otorgamiento: <strong className="text-neutral-900">{formatDate(credit.grantDate)}</strong></p>
              <p className="text-neutral-700">Vencimiento: <strong className={credit.status === 'vencido' ? 'text-rose-600 font-bold' : 'text-neutral-900'}>{formatDate(credit.dueDate)}</strong></p>
            </div>
          </div>
        </div>

        {/* Registered Payments on this Credit */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-neutral-900">
              Abonos Registrados ({payments.length})
            </h3>
            <span className="text-xs text-neutral-500 font-tabular">
              Total Cobrado: <strong className="text-emerald-700">{formatCurrency(totalPaid)}</strong>
            </span>
          </div>

          {payments.length === 0 ? (
            <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 text-center text-xs text-neutral-500">
              No se han registrado pagos para este crédito aún.
            </div>
          ) : (
            <div className="border border-neutral-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50 text-neutral-500 border-b border-neutral-200">
                  <tr>
                    <th className="py-2.5 px-3 font-semibold">N° Recibo</th>
                    <th className="py-2.5 px-3 font-semibold">Fecha</th>
                    <th className="py-2.5 px-3 font-semibold">Método / Ref</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Saldo Previo</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Monto Pagado</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Nuevo Saldo</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Comprobante</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 font-tabular">
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-neutral-50/50">
                      <td className="py-2.5 px-3 font-bold text-neutral-900">{p.receiptNumber}</td>
                      <td className="py-2.5 px-3 text-neutral-700">{formatDate(p.paymentDate)}</td>
                      <td className="py-2.5 px-3 text-neutral-600 capitalize">
                        {p.paymentMethod} ({p.reference})
                      </td>
                      <td className="py-2.5 px-3 text-right text-neutral-500">{formatCurrency(p.previousBalance)}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-emerald-700">
                        {formatCurrency(p.amount)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-purple-950">
                        {formatCurrency(p.newBalance)}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => onViewReceipt(p)}
                          className="px-2 py-1 text-[11px] font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 rounded transition-colors cursor-pointer"
                        >
                          Recibo PDF
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Admin Danger / Cancellation Zone */}
        {isAdmin && payments.length === 0 && credit.status === 'activo' && (
          <div className="pt-4 border-t border-neutral-100 flex items-center justify-between text-xs">
            <span className="text-neutral-400">
              Crédito sin abonos registrados: puede cancelarse si fue otorgado por error.
            </span>
            <button
              onClick={handleCancelCredit}
              className="px-3 py-1.5 text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Cancelar Crédito</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
