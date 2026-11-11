import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { storageService } from '../../services/storageService';
import { Payment } from '../../types';
import { formatCurrency, formatDate } from '../../services/creditCalculator';
import { Search, Plus, Eye, Edit2, Trash2, Receipt, ChevronLeft, ChevronRight } from 'lucide-react';

interface PaymentListProps {
  onOpenCreate: (creditId?: string) => void;
  onOpenEdit: (payment: Payment) => void;
  onViewReceipt: (payment: Payment) => void;
  onNotification: (type: 'success' | 'error', message: string) => void;
}

export const PaymentList: React.FC<PaymentListProps> = ({
  onOpenCreate,
  onOpenEdit,
  onViewReceipt,
  onNotification,
}) => {
  const { isAdmin, isClient, currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Filter payments by user role
  const allPayments = isClient && currentUser?.clientId
    ? storageService.getPaymentsByClient(currentUser.clientId)
    : storageService.getPayments();

  const filteredPayments = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return allPayments;
    return allPayments.filter(
      (p) =>
        p.receiptNumber.toLowerCase().includes(term) ||
        p.creditId.toLowerCase().includes(term) ||
        (p.clientName && p.clientName.toLowerCase().includes(term)) ||
        (p.reference && p.reference.toLowerCase().includes(term))
    );
  }, [allPayments, searchTerm]);

  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage) || 1;
  const paginatedPayments = useMemo(() => {
    // Reverse to show newest payments first
    const reversed = [...filteredPayments].reverse();
    const start = (currentPage - 1) * itemsPerPage;
    return reversed.slice(start, start + itemsPerPage);
  }, [filteredPayments, currentPage]);

  const totalCollectedSum = useMemo(() => {
    return filteredPayments.reduce((sum, p) => sum + p.amount, 0);
  }, [filteredPayments]);

  const handleDeletePayment = (payment: Payment) => {
    if (
      !window.confirm(
        `¿Está seguro de eliminar el pago ${payment.receiptNumber} de ${formatCurrency(payment.amount)}? El saldo del crédito ${payment.creditId} se recalculará automáticamente.`
      )
    ) {
      return;
    }

    const res = storageService.deletePayment(payment.id);
    if (res.success) {
      onNotification('success', `Pago ${payment.receiptNumber} eliminado. Saldo recalculado exitosamente.`);
    } else {
      onNotification('error', res.error || 'No se pudo eliminar el pago.');
    }
  };

  return (
    <div className="space-y-5">
      {/* Module Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
            {isAdmin ? 'Registro General de Pagos y Abonos' : 'Mis Abonos Registrados'}
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            {isAdmin
              ? 'Control de ingresos, comprobantes de pago emitidos y recálculo de saldos en tiempo real.'
              : 'Historial de pagos efectuados a sus créditos con generación instantánea de recibos en PDF.'}
          </p>
        </div>

        <button
          onClick={() => onOpenCreate()}
          className="px-4 py-2 text-xs font-semibold text-white bg-purple-700 hover:bg-purple-800 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Registrar Nuevo Abono</span>
        </button>
      </div>

      {/* Filter and Metrics Summary Strip */}
      <div className="bg-white rounded-xl border border-neutral-200/80 p-3.5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Buscar por recibo, crédito o cliente..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all"
          />
        </div>

        <div className="flex items-center gap-4 text-xs font-tabular">
          <span className="text-neutral-500">
            Registros: <strong className="text-neutral-900">{filteredPayments.length}</strong>
          </span>
          <span className="text-neutral-300">·</span>
          <span className="text-neutral-500">
            Total recaudado:{' '}
            <strong className="text-emerald-700 font-bold">{formatCurrency(totalCollectedSum)}</strong>
          </span>
        </div>
      </div>

      {/* Payments Data Grid */}
      <div className="bg-white rounded-xl border border-neutral-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-neutral-50/70 text-neutral-500 border-b border-neutral-200/80">
                <th className="py-3 px-4 font-semibold">N° Recibo / Fecha</th>
                <th className="py-3 px-4 font-semibold">Cliente</th>
                <th className="py-3 px-4 font-semibold">Crédito Asignado</th>
                <th className="py-3 px-4 font-semibold">Método / Ref.</th>
                <th className="py-3 px-4 font-semibold text-right">Monto Abonado</th>
                <th className="py-3 px-4 font-semibold text-right">Saldo Restante</th>
                <th className="py-3 px-4 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 font-tabular">
              {paginatedPayments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-neutral-500 font-sans">
                    No se encontraron pagos registrados con los criterios especificados.
                  </td>
                </tr>
              ) : (
                paginatedPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-neutral-50/60 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-neutral-900">{p.receiptNumber}</div>
                      <div className="text-[11px] text-neutral-400 font-sans">{formatDate(p.paymentDate)}</div>
                    </td>

                    <td className="py-3 px-4 font-sans">
                      <div className="font-semibold text-neutral-900">{p.clientName}</div>
                      <div className="text-[11px] text-neutral-400 font-tabular">Doc: {p.clientDocument}</div>
                    </td>

                    <td className="py-3 px-4 font-medium text-neutral-800">
                      {p.creditId}
                    </td>

                    <td className="py-3 px-4 font-sans">
                      <span className="capitalize text-neutral-800 font-medium">{p.paymentMethod}</span>
                      <div className="text-[11px] text-neutral-400 font-tabular">Ref: {p.reference}</div>
                    </td>

                    <td className="py-3 px-4 text-right font-bold text-emerald-700">
                      {formatCurrency(p.amount)}
                    </td>

                    <td className="py-3 px-4 text-right font-semibold text-purple-950">
                      {formatCurrency(p.newBalance)}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onViewReceipt(p)}
                          title="Ver y descargar recibo oficial en PDF"
                          className="px-2.5 py-1 text-[11px] font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 rounded transition-colors cursor-pointer mr-1 font-sans"
                        >
                          Recibo PDF
                        </button>

                        {isAdmin && (
                          <>
                            <button
                              onClick={() => onOpenEdit(p)}
                              title="Editar este pago (recalcula saldo)"
                              className="p-1.5 text-neutral-400 hover:text-purple-700 hover:bg-purple-50 rounded transition-colors cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeletePayment(p)}
                              title="Eliminar este pago (recalcula saldo)"
                              className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-200/80 bg-neutral-50/40 text-xs">
            <span className="text-neutral-500 font-tabular">
              Página {currentPage} de {totalPages}
            </span>
            <div className="flex items-center gap-1.5 font-sans">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-2.5 py-1 rounded border border-neutral-200 bg-white hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5 inline mr-0.5" />
                Anterior
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-2.5 py-1 rounded border border-neutral-200 bg-white hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                Siguiente
                <ChevronRight className="w-3.5 h-3.5 inline ml-0.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
