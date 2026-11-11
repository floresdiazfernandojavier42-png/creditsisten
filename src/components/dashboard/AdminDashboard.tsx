import React from 'react';
import { storageService } from '../../services/storageService';
import { formatCurrency, formatDate } from '../../services/creditCalculator';
import { Credit, Payment } from '../../types';
import { Users, CreditCard, Wallet, ArrowDownRight, AlertTriangle, CheckCircle, Plus, Eye, ReceiptText } from 'lucide-react';

interface AdminDashboardProps {
  onNavigate: (tab: string) => void;
  onOpenNewCredit: () => void;
  onOpenNewClient: () => void;
  onOpenNewPayment: (creditId?: string) => void;
  onViewReceipt: (payment: Payment) => void;
  onViewCredit: (credit: Credit) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onNavigate,
  onOpenNewCredit,
  onOpenNewClient,
  onOpenNewPayment,
  onViewReceipt,
  onViewCredit,
}) => {
  const metrics = storageService.getAdminDashboardMetrics();
  const allCredits = storageService.getCredits();
  const overdueCredits = allCredits.filter((c) => c.status === 'vencido');

  return (
    <div className="space-y-6">
      {/* Top Header / Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
            Panel de Control Financiero
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Vista general de cartera de créditos, recaudaciones y clientes en tiempo real.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenNewClient}
            className="px-3.5 py-2 text-xs font-semibold text-neutral-700 bg-white hover:bg-neutral-50 border border-neutral-300 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5 text-neutral-500" />
            <span>Nuevo Cliente</span>
          </button>

          <button
            onClick={onOpenNewCredit}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-purple-700 hover:bg-purple-800 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Otorgar Crédito</span>
          </button>
        </div>
      </div>

      {/* KPI Metrics Grid (Single-Elevation, tabular figures, purple highlights) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Clientes */}
        <div className="bg-white rounded-xl border border-neutral-200/80 p-5 shadow-2xs hover:border-purple-200 transition-colors">
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-xs font-medium">Total de Clientes</span>
            <Users className="w-4 h-4 text-purple-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-neutral-900 font-tabular">
              {metrics.totalClients}
            </span>
            <span className="text-xs text-neutral-500">
              ({metrics.activeClients} activos)
            </span>
          </div>
          <button
            onClick={() => onNavigate('clients')}
            className="mt-3 text-[11px] font-medium text-purple-700 hover:text-purple-900 flex items-center gap-1 cursor-pointer"
          >
            <span>Ver listado de clientes</span>
            <ArrowDownRight className="w-3 h-3 -rotate-45" />
          </button>
        </div>

        {/* Créditos Activos */}
        <div className="bg-white rounded-xl border border-neutral-200/80 p-5 shadow-2xs hover:border-purple-200 transition-colors">
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-xs font-medium">Créditos Vigentes</span>
            <CreditCard className="w-4 h-4 text-purple-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-neutral-900 font-tabular">
              {metrics.activeCredits}
            </span>
            {metrics.overdueCredits > 0 && (
              <span className="text-xs text-rose-600 font-medium">
                · {metrics.overdueCredits} vencidos
              </span>
            )}
          </div>
          <button
            onClick={() => onNavigate('credits')}
            className="mt-3 text-[11px] font-medium text-purple-700 hover:text-purple-900 flex items-center gap-1 cursor-pointer"
          >
            <span>Ver cartera de créditos</span>
            <ArrowDownRight className="w-3 h-3 -rotate-45" />
          </button>
        </div>

        {/* Cartera Total (Suma de saldos pendientes) */}
        <div className="bg-white rounded-xl border border-neutral-200/80 p-5 shadow-2xs hover:border-purple-200 transition-colors">
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-xs font-medium">Cartera Pendiente Total</span>
            <Wallet className="w-4 h-4 text-purple-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-purple-950 font-tabular">
              {formatCurrency(metrics.totalOutstandingPortfolio)}
            </span>
          </div>
          <p className="mt-3 text-[11px] text-neutral-500">
            Suma de saldos pendientes por cobrar
          </p>
        </div>

        {/* Total Recaudado (Cobranza acumulada) */}
        <div className="bg-white rounded-xl border border-neutral-200/80 p-5 shadow-2xs hover:border-purple-200 transition-colors">
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-xs font-medium">Total Recaudado</span>
            <ReceiptText className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-700 font-tabular">
              {formatCurrency(metrics.totalCollected)}
            </span>
          </div>
          <button
            onClick={() => onNavigate('payments')}
            className="mt-3 text-[11px] font-medium text-purple-700 hover:text-purple-900 flex items-center gap-1 cursor-pointer"
          >
            <span>Consultar pagos</span>
            <ArrowDownRight className="w-3 h-3 -rotate-45" />
          </button>
        </div>
      </div>

      {/* Main Grid: Overdue Alerts & Recent Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Payments Section */}
        <div className="bg-white rounded-xl border border-neutral-200/80 p-5 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100 mb-4">
            <div>
              <h2 className="text-sm font-bold text-neutral-900">Últimos Pagos Registrados</h2>
              <p className="text-xs text-neutral-500">Abonos aplicados a créditos en tiempo real</p>
            </div>
            <button
              onClick={() => onNavigate('payments')}
              className="text-xs font-semibold text-purple-700 hover:text-purple-900 cursor-pointer"
            >
              Ver todos
            </button>
          </div>

          {metrics.recentPayments.length === 0 ? (
            <div className="py-8 text-center text-xs text-neutral-500">
              No hay pagos registrados aún en el sistema.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-neutral-400 border-b border-neutral-100">
                    <th className="pb-2 font-medium">Recibo / Fecha</th>
                    <th className="pb-2 font-medium">Cliente</th>
                    <th className="pb-2 font-medium text-right">Monto</th>
                    <th className="pb-2 font-medium text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {metrics.recentPayments.map((p) => (
                    <tr key={p.id} className="hover:bg-neutral-50/70 transition-colors">
                      <td className="py-2.5">
                        <span className="font-semibold text-neutral-900 font-tabular">{p.receiptNumber}</span>
                        <div className="text-[11px] text-neutral-500">{formatDate(p.paymentDate)}</div>
                      </td>
                      <td className="py-2.5">
                        <span className="text-neutral-800 font-medium">{p.clientName}</span>
                        <div className="text-[11px] text-neutral-400 font-tabular">{p.creditId}</div>
                      </td>
                      <td className="py-2.5 text-right font-bold text-emerald-700 font-tabular">
                        {formatCurrency(p.amount)}
                      </td>
                      <td className="py-2.5 text-right">
                        <button
                          onClick={() => onViewReceipt(p)}
                          className="px-2 py-1 text-[11px] font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 rounded transition-colors cursor-pointer"
                        >
                          Recibo
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Credits Needing Attention / Overdue Section */}
        <div className="bg-white rounded-xl border border-neutral-200/80 p-5 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100 mb-4">
            <div>
              <h2 className="text-sm font-bold text-neutral-900 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span>Créditos en Mora o Vencidos</span>
              </h2>
              <p className="text-xs text-neutral-500">Créditos que sobrepasaron su fecha de vencimiento</p>
            </div>
            <button
              onClick={() => onNavigate('credits')}
              className="text-xs font-semibold text-purple-700 hover:text-purple-900 cursor-pointer"
            >
              Ver Cartera
            </button>
          </div>

          {overdueCredits.length === 0 ? (
            <div className="py-8 text-center text-xs text-neutral-500 flex flex-col items-center justify-center gap-1">
              <CheckCircle className="w-5 h-5 text-emerald-500 mb-1" />
              <span>Excelente: no existen créditos vencidos con saldo pendiente.</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-neutral-400 border-b border-neutral-100">
                    <th className="pb-2 font-medium">Código / Vencimiento</th>
                    <th className="pb-2 font-medium">Cliente</th>
                    <th className="pb-2 font-medium text-right">Saldo en Mora</th>
                    <th className="pb-2 font-medium text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {overdueCredits.map((c) => (
                    <tr key={c.id} className="hover:bg-rose-50/40 transition-colors">
                      <td className="py-2.5">
                        <span className="font-semibold text-neutral-900 font-tabular">{c.id}</span>
                        <div className="text-[11px] text-rose-600 font-medium">Venció: {formatDate(c.dueDate)}</div>
                      </td>
                      <td className="py-2.5">
                        <span className="text-neutral-800 font-medium">{c.clientName}</span>
                        <div className="text-[11px] text-neutral-400 font-tabular">{c.clientDocument}</div>
                      </td>
                      <td className="py-2.5 text-right font-bold text-rose-700 font-tabular">
                        {formatCurrency(c.remainingBalance)}
                      </td>
                      <td className="py-2.5 text-right">
                        <button
                          onClick={() => onViewCredit(c)}
                          className="px-2 py-1 text-[11px] font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 rounded transition-colors cursor-pointer mr-1.5"
                        >
                          Detalle
                        </button>
                        <button
                          onClick={() => onOpenNewPayment(c.id)}
                          className="px-2 py-1 text-[11px] font-medium text-white bg-purple-700 hover:bg-purple-800 rounded transition-colors cursor-pointer"
                        >
                          Abonar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
