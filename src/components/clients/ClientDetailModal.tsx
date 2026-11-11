import React from 'react';
import { Client, Credit, Payment } from '../../types';
import { storageService } from '../../services/storageService';
import { formatCurrency, formatDate, calculateAge } from '../../services/creditCalculator';
import { X, User, Phone, Mail, MapPin, Briefcase, DollarSign, CreditCard, ShieldCheck, Plus, Eye } from 'lucide-react';

interface ClientDetailModalProps {
  isOpen: boolean;
  client: Client | null;
  onClose: () => void;
  onGrantCredit: (clientId: string) => void;
  onViewCredit: (credit: Credit) => void;
  onViewReceipt: (payment: Payment) => void;
}

export const ClientDetailModal: React.FC<ClientDetailModalProps> = ({
  isOpen,
  client,
  onClose,
  onGrantCredit,
  onViewCredit,
  onViewReceipt,
}) => {
  if (!isOpen || !client) return null;

  const clientCredits = storageService.getCreditsByClient(client.id);
  const clientPayments = storageService.getPaymentsByClient(client.id);
  const activeDebt = storageService.getClientOutstandingDebt(client.id);
  const availableLimit = storageService.getClientAvailableCreditLimit(client.id);
  const usagePercentage = Math.min(100, Math.round((activeDebt / client.creditLimit) * 100));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-purple-950/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-purple-100 max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-neutral-100 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-lg">
              {client.firstName.charAt(0)}{client.lastName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-neutral-900">
                  {client.firstName} {client.lastName}
                </h2>
                <span
                  className={`text-[10px] font-medium px-2 py-0.5 rounded ${
                    client.active
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-neutral-100 text-neutral-500 border border-neutral-200'
                  }`}
                >
                  {client.active ? 'Cliente Activo' : 'Cliente Inactivo'}
                </span>
              </div>
              <p className="text-xs text-neutral-500 font-tabular">
                DUI (9 dígitos): <span className="font-semibold text-neutral-800">{client.documentNumber}</span> · {calculateAge(client.birthDate)} años
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {client.active && (
              <button
                onClick={() => {
                  onClose();
                  onGrantCredit(client.id);
                }}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-purple-700 hover:bg-purple-800 rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Otorgar Crédito</span>
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

        {/* Financial Line of Credit Visual Card */}
        <div className="bg-purple-50/60 rounded-xl p-5 border border-purple-100 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-purple-900">
              Evaluación de Límite Crediticio
            </span>
            <span className="text-xs font-bold text-purple-900 font-tabular">
              {usagePercentage}% utilizado
            </span>
          </div>

          <div className="w-full bg-purple-200/70 h-2.5 rounded-full overflow-hidden mb-3">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                usagePercentage > 90 ? 'bg-rose-500' : 'bg-purple-700'
              }`}
              style={{ width: `${usagePercentage}%` }}
            />
          </div>

          <div className="grid grid-cols-3 gap-4 pt-2 border-t border-purple-200/50 text-xs">
            <div>
              <p className="text-neutral-500 text-[11px]">Límite Autorizado</p>
              <p className="font-bold text-neutral-900 font-tabular text-sm">
                {formatCurrency(client.creditLimit)}
              </p>
            </div>
            <div>
              <p className="text-neutral-500 text-[11px]">Deuda Pendiente</p>
              <p className="font-bold text-purple-900 font-tabular text-sm">
                {formatCurrency(activeDebt)}
              </p>
            </div>
            <div>
              <p className="text-neutral-500 text-[11px]">Capacidad Disponible</p>
              <p className="font-bold text-emerald-700 font-tabular text-sm">
                {formatCurrency(availableLimit)}
              </p>
            </div>
          </div>
        </div>

        {/* Profile Information Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-neutral-200/80 p-4 space-y-2.5 text-xs">
            <h3 className="font-bold text-neutral-900 mb-2">Datos de Contacto y Residencia</h3>
            <div className="flex items-center gap-2 text-neutral-600">
              <Phone className="w-3.5 h-3.5 text-purple-600 shrink-0" />
              <span>Teléfono:</span>
              <span className="font-medium text-neutral-900 font-tabular">{client.phone}</span>
            </div>
            <div className="flex items-center gap-2 text-neutral-600">
              <Mail className="w-3.5 h-3.5 text-purple-600 shrink-0" />
              <span>Correo:</span>
              <span className="font-medium text-neutral-900">{client.email}</span>
            </div>
            <div className="flex items-start gap-2 text-neutral-600">
              <MapPin className="w-3.5 h-3.5 text-purple-600 shrink-0 mt-0.5" />
              <span>Dirección:</span>
              <span className="font-medium text-neutral-900">{client.address}</span>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-neutral-200/80 p-4 space-y-2.5 text-xs">
            <h3 className="font-bold text-neutral-900 mb-2">Información Laboral</h3>
            <div className="flex items-center gap-2 text-neutral-600">
              <Briefcase className="w-3.5 h-3.5 text-purple-600 shrink-0" />
              <span>Ocupación:</span>
              <span className="font-medium text-neutral-900">{client.occupation}</span>
            </div>
            <div className="flex items-center gap-2 text-neutral-600">
              <DollarSign className="w-3.5 h-3.5 text-purple-600 shrink-0" />
              <span>Ingresos Mensuales:</span>
              <span className="font-bold text-neutral-900 font-tabular">
                {formatCurrency(client.monthlyIncome)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-neutral-600">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Registro de Cliente:</span>
              <span className="font-medium text-neutral-900">{formatDate(client.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* Credit History Table */}
        <div className="mb-6">
          <h3 className="text-sm font-bold text-neutral-900 mb-2">
            Historial de Créditos ({clientCredits.length})
          </h3>

          {clientCredits.length === 0 ? (
            <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 text-center text-xs text-neutral-500">
              El cliente no tiene créditos registrados aún.
            </div>
          ) : (
            <div className="border border-neutral-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50 text-neutral-500 border-b border-neutral-200">
                  <tr>
                    <th className="py-2.5 px-3 font-semibold">Código / Fecha</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Monto Capital</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Total a Pagar</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Saldo Actual</th>
                    <th className="py-2.5 px-3 font-semibold text-center">Estado</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Detalle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {clientCredits.map((cr) => (
                    <tr key={cr.id} className="hover:bg-neutral-50/50">
                      <td className="py-2.5 px-3">
                        <span className="font-bold text-neutral-900 font-tabular">{cr.id}</span>
                        <div className="text-[11px] text-neutral-400">{formatDate(cr.grantDate)}</div>
                      </td>
                      <td className="py-2.5 px-3 text-right font-tabular">{formatCurrency(cr.amount)}</td>
                      <td className="py-2.5 px-3 text-right font-tabular">{formatCurrency(cr.totalToPay)}</td>
                      <td className="py-2.5 px-3 text-right font-bold font-tabular text-purple-950">
                        {formatCurrency(cr.remainingBalance)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`text-[10px] font-medium px-2 py-0.5 rounded capitalize ${
                            cr.status === 'activo'
                              ? 'bg-purple-100 text-purple-800'
                              : cr.status === 'vencido'
                              ? 'bg-rose-100 text-rose-800'
                              : cr.status === 'pagado'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-neutral-100 text-neutral-600'
                          }`}
                        >
                          {cr.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => {
                            onClose();
                            onViewCredit(cr);
                          }}
                          className="px-2 py-1 text-[11px] font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 rounded cursor-pointer"
                        >
                          Ver
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Payments History Table */}
        <div>
          <h3 className="text-sm font-bold text-neutral-900 mb-2">
            Historial de Abonos y Recibos ({clientPayments.length})
          </h3>

          {clientPayments.length === 0 ? (
            <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 text-center text-xs text-neutral-500">
              No hay pagos registrados para este cliente.
            </div>
          ) : (
            <div className="border border-neutral-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50 text-neutral-500 border-b border-neutral-200 sticky top-0">
                  <tr>
                    <th className="py-2 px-3 font-semibold">Recibo / Fecha</th>
                    <th className="py-2 px-3 font-semibold">Crédito</th>
                    <th className="py-2 px-3 font-semibold text-right">Monto Abonado</th>
                    <th className="py-2 px-3 font-semibold text-right">Saldo Restante</th>
                    <th className="py-2 px-3 font-semibold text-right">Recibo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {clientPayments.map((p) => (
                    <tr key={p.id} className="hover:bg-neutral-50/50">
                      <td className="py-2 px-3">
                        <span className="font-semibold text-neutral-900 font-tabular">{p.receiptNumber}</span>
                        <div className="text-[11px] text-neutral-400">{formatDate(p.paymentDate)}</div>
                      </td>
                      <td className="py-2 px-3 font-tabular text-neutral-700">{p.creditId}</td>
                      <td className="py-2 px-3 text-right font-bold text-emerald-700 font-tabular">
                        {formatCurrency(p.amount)}
                      </td>
                      <td className="py-2 px-3 text-right font-tabular text-neutral-600">
                        {formatCurrency(p.newBalance)}
                      </td>
                      <td className="py-2 px-3 text-right">
                        <button
                          onClick={() => onViewReceipt(p)}
                          className="px-2 py-0.5 text-[11px] text-purple-700 bg-purple-50 hover:bg-purple-100 rounded cursor-pointer"
                        >
                          Ver PDF
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
