import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { storageService } from '../../services/storageService';
import { Credit, CreditStatus } from '../../types';
import { formatCurrency, formatDate } from '../../services/creditCalculator';
import { Search, Plus, Eye, Edit3, XCircle, FileText, ChevronLeft, ChevronRight, DollarSign } from 'lucide-react';

interface CreditListProps {
  onOpenCreate: () => void;
  onOpenEdit: (credit: Credit) => void;
  onOpenDetail: (credit: Credit) => void;
  onOpenStatement: (credit: Credit) => void;
  onOpenPayment: (creditId: string) => void;
  onNotification: (type: 'success' | 'error', message: string) => void;
}

export const CreditList: React.FC<CreditListProps> = ({
  onOpenCreate,
  onOpenEdit,
  onOpenDetail,
  onOpenStatement,
  onOpenPayment,
  onNotification,
}) => {
  const { isAdmin, isClient, currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | CreditStatus>('todos');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Audit overdue on load
  storageService.auditOverdueCredits();

  // Load credits respecting permissions
  const allCredits = isClient && currentUser?.clientId
    ? storageService.getCreditsByClient(currentUser.clientId)
    : storageService.getCredits();

  const filteredCredits = useMemo(() => {
    return allCredits.filter((c) => {
      // Status filter
      if (statusFilter !== 'todos' && c.status !== statusFilter) {
        return false;
      }
      // Search filter
      const term = searchTerm.toLowerCase().trim();
      if (!term) return true;
      return (
        c.id.toLowerCase().includes(term) ||
        (c.clientName && c.clientName.toLowerCase().includes(term)) ||
        (c.clientDocument && c.clientDocument.toLowerCase().includes(term))
      );
    });
  }, [allCredits, statusFilter, searchTerm]);

  const totalPages = Math.ceil(filteredCredits.length / itemsPerPage) || 1;
  const paginatedCredits = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredCredits.slice(start, start + itemsPerPage);
  }, [filteredCredits, currentPage]);

  const handleCancelCredit = (credit: Credit) => {
    if (!window.confirm(`¿Está seguro de que desea cancelar el crédito ${credit.id}? Esta acción no se puede deshacer.`)) {
      return;
    }

    const res = storageService.cancelCredit(credit.id);
    if (res.success) {
      onNotification('success', `Crédito ${credit.id} cancelado correctamente.`);
    } else {
      onNotification('error', res.error || 'No se pudo cancelar el crédito.');
    }
  };

  return (
    <div className="space-y-5">
      {/* Module Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
            {isAdmin ? 'Cartera de Créditos' : 'Mis Créditos Contratados'}
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            {isAdmin
              ? 'Otorgamiento, seguimiento de amortizaciones y control de cartera vigente y vencida.'
              : 'Detalle de sus préstamos activos, cuotas mensuales y opciones de abono.'}
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={onOpenCreate}
            className="px-4 py-2 text-xs font-semibold text-white bg-purple-700 hover:bg-purple-800 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Otorgar Nuevo Crédito</span>
          </button>
        )}
      </div>

      {/* Filter Tabs and Search Bar */}
      <div className="bg-white rounded-xl border border-neutral-200/80 p-3.5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Interactive Segmented Filter Controls */}
        <div className="flex items-center gap-1 p-1 bg-neutral-100 rounded-lg overflow-x-auto">
          {(['todos', 'activo', 'vencido', 'pagado', 'cancelado'] as const).map((st) => (
            <button
              key={st}
              onClick={() => {
                setStatusFilter(st);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors capitalize whitespace-nowrap cursor-pointer ${
                statusFilter === st
                  ? 'bg-white text-purple-950 font-bold shadow-2xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Buscar por código o cliente..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all"
          />
        </div>
      </div>

      {/* Credits Grid */}
      <div className="bg-white rounded-xl border border-neutral-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-neutral-50/70 text-neutral-500 border-b border-neutral-200/80">
                <th className="py-3 px-4 font-semibold">Código / Fecha</th>
                <th className="py-3 px-4 font-semibold">Cliente</th>
                <th className="py-3 px-4 font-semibold text-right">Monto Capital</th>
                <th className="py-3 px-4 font-semibold text-right">Cuota / Plazo</th>
                <th className="py-3 px-4 font-semibold text-right">Saldo Pendiente</th>
                <th className="py-3 px-4 font-semibold text-center">Estado</th>
                <th className="py-3 px-4 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {paginatedCredits.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-neutral-500">
                    No se encontraron créditos registrados para el filtro seleccionado.
                  </td>
                </tr>
              ) : (
                paginatedCredits.map((credit) => {
                  const payments = storageService.getPaymentsByCredit(credit.id);
                  const hasPayments = payments.length > 0;
                  const canMakePayment = credit.status === 'activo' || credit.status === 'vencido';

                  return (
                    <tr key={credit.id} className="hover:bg-neutral-50/60 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-bold text-neutral-900 font-tabular">{credit.id}</span>
                        <div className="text-[11px] text-neutral-400">
                          Otorgado: {formatDate(credit.grantDate)}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-neutral-900">{credit.clientName}</div>
                        <div className="text-[11px] text-neutral-400 font-tabular">
                          Doc: {credit.clientDocument}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right font-semibold text-neutral-900 font-tabular">
                        {formatCurrency(credit.amount)}
                        <div className="text-[10px] text-neutral-400 font-normal">
                          Tasa: {credit.annualInterestRate}% anual
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right font-medium font-tabular text-neutral-800">
                        {formatCurrency(credit.monthlyFee)}
                        <div className="text-[11px] text-neutral-400 font-normal">
                          {credit.termMonths} meses (Vence: {formatDate(credit.dueDate)})
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right font-bold font-tabular">
                        <span
                          className={
                            credit.remainingBalance > 0
                              ? credit.status === 'vencido'
                                ? 'text-rose-600'
                                : 'text-purple-950'
                              : 'text-emerald-700 font-normal'
                          }
                        >
                          {formatCurrency(credit.remainingBalance)}
                        </span>
                        <div className="text-[10px] text-neutral-400 font-normal">
                          Total: {formatCurrency(credit.totalToPay)}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded capitalize ${
                            credit.status === 'activo'
                              ? 'bg-purple-100 text-purple-900 border border-purple-200'
                              : credit.status === 'vencido'
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : credit.status === 'pagado'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-neutral-100 text-neutral-600 border border-neutral-200'
                          }`}
                        >
                          {credit.status}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {canMakePayment && (
                            <button
                              onClick={() => onOpenPayment(credit.id)}
                              title="Registrar abono"
                              className="px-2.5 py-1 text-[11px] font-semibold text-white bg-purple-700 hover:bg-purple-800 rounded transition-colors cursor-pointer mr-1"
                            >
                              Abonar
                            </button>
                          )}

                          <button
                            onClick={() => onOpenDetail(credit)}
                            title="Ver detalle del crédito"
                            className="p-1.5 text-neutral-500 hover:text-purple-700 hover:bg-purple-50 rounded transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => onOpenStatement(credit)}
                            title="Estado de cuenta"
                            className="p-1.5 text-neutral-500 hover:text-purple-700 hover:bg-purple-50 rounded transition-colors cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>

                          {isAdmin && !hasPayments && credit.status === 'activo' && (
                            <>
                              <button
                                onClick={() => onOpenEdit(credit)}
                                title="Editar crédito (sin pagos)"
                                className="p-1.5 text-neutral-500 hover:text-purple-700 hover:bg-purple-50 rounded transition-colors cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleCancelCredit(credit)}
                                title="Cancelar crédito"
                                className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-200/80 bg-neutral-50/40 text-xs">
            <span className="text-neutral-500">
              Página {currentPage} de {totalPages}
            </span>
            <div className="flex items-center gap-1.5">
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
