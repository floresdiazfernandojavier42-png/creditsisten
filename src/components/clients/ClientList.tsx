import React, { useState, useMemo } from 'react';
import { storageService } from '../../services/storageService';
import { Client } from '../../types';
import { formatCurrency, formatDate } from '../../services/creditCalculator';
import { Search, Plus, Eye, Edit2, Power, AlertCircle, ChevronLeft, ChevronRight, UserCheck } from 'lucide-react';

interface ClientListProps {
  onOpenCreate: () => void;
  onOpenEdit: (client: Client) => void;
  onOpenDetail: (client: Client) => void;
  onNotification: (type: 'success' | 'error', message: string) => void;
}

export const ClientList: React.FC<ClientListProps> = ({
  onOpenCreate,
  onOpenEdit,
  onOpenDetail,
  onNotification,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Refresh client data
  const clients = storageService.getClients();

  const filteredClients = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return clients;
    return clients.filter(
      (c) =>
        c.documentNumber.toLowerCase().includes(term) ||
        c.firstName.toLowerCase().includes(term) ||
        c.lastName.toLowerCase().includes(term) ||
        c.email.toLowerCase().includes(term)
    );
  }, [clients, searchTerm]);

  const totalPages = Math.ceil(filteredClients.length / itemsPerPage) || 1;
  const paginatedClients = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredClients.slice(start, start + itemsPerPage);
  }, [filteredClients, currentPage]);

  const handleToggleStatus = (client: Client) => {
    const actionText = client.active ? 'desactivar' : 'activar';
    if (!window.confirm(`¿Está seguro de que desea ${actionText} al cliente ${client.firstName} ${client.lastName}?`)) {
      return;
    }

    const res = storageService.toggleClientStatus(client.id);
    if (res.success) {
      onNotification(
        'success',
        `Cliente ${client.active ? 'desactivado' : 'activado'} correctamente.`
      );
    } else {
      onNotification('error', res.error || 'No se pudo cambiar el estado del cliente.');
    }
  };

  return (
    <div className="space-y-5">
      {/* Module Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
            Gestión de Clientes
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Registro, evaluación de límites de crédito y seguimiento financiero de clientes.
          </p>
        </div>

        <button
          onClick={onOpenCreate}
          className="px-4 py-2 text-xs font-semibold text-white bg-purple-700 hover:bg-purple-800 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Registrar Nuevo Cliente</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-neutral-200/80 p-3.5 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Buscar por nombre, apellido o DUI (9 dígitos)..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all"
          />
        </div>

        <div className="text-xs text-neutral-500 self-end sm:self-auto font-tabular">
          Mostrando {paginatedClients.length} de {filteredClients.length} cliente(s)
        </div>
      </div>

      {/* Clients Data Grid (High density, tabular figures) */}
      <div className="bg-white rounded-xl border border-neutral-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-neutral-50/70 text-neutral-500 border-b border-neutral-200/80">
                <th className="py-3 px-4 font-semibold">Documento / Cliente</th>
                <th className="py-3 px-4 font-semibold">Contacto</th>
                <th className="py-3 px-4 font-semibold">Ocupación / Ingresos</th>
                <th className="py-3 px-4 font-semibold text-right">Límite Aprobado</th>
                <th className="py-3 px-4 font-semibold text-right">Deuda Pendiente</th>
                <th className="py-3 px-4 font-semibold text-center">Estado</th>
                <th className="py-3 px-4 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {paginatedClients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-neutral-500">
                    No se encontraron clientes que coincidan con la búsqueda.
                  </td>
                </tr>
              ) : (
                paginatedClients.map((client) => {
                  const activeDebt = storageService.getClientOutstandingDebt(client.id);
                  const availableLimit = Math.max(0, client.creditLimit - activeDebt);

                  return (
                    <tr key={client.id} className="hover:bg-neutral-50/60 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-neutral-900">{client.firstName} {client.lastName}</div>
                        <div className="text-[11px] text-neutral-400 font-tabular">
                          DUI: {client.documentNumber}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-neutral-700">{client.phone}</div>
                        <div className="text-[11px] text-neutral-400">{client.email}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-neutral-700">{client.occupation}</div>
                        <div className="text-[11px] text-neutral-400 font-tabular">
                          Ingresos: {formatCurrency(client.monthlyIncome)}/mes
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-neutral-900 font-tabular">
                        {formatCurrency(client.creditLimit)}
                        <div className="text-[10px] text-neutral-400 font-normal">
                          Disp: {formatCurrency(availableLimit)}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-bold font-tabular">
                        <span className={activeDebt > 0 ? 'text-purple-900' : 'text-neutral-400 font-normal'}>
                          {formatCurrency(activeDebt)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded capitalize ${
                            client.active
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                              : 'bg-neutral-100 text-neutral-500 border border-neutral-200'
                          }`}
                        >
                          {client.active ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => onOpenDetail(client)}
                            title="Ver historial financiero"
                            className="p-1.5 text-neutral-500 hover:text-purple-700 hover:bg-purple-50 rounded transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onOpenEdit(client)}
                            title="Editar datos"
                            className="p-1.5 text-neutral-500 hover:text-purple-700 hover:bg-purple-50 rounded transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(client)}
                            title={client.active ? 'Desactivar cliente' : 'Activar cliente'}
                            className={`p-1.5 rounded transition-colors cursor-pointer ${
                              client.active
                                ? 'text-neutral-400 hover:text-rose-600 hover:bg-rose-50'
                                : 'text-neutral-400 hover:text-emerald-600 hover:bg-emerald-50'
                            }`}
                          >
                            <Power className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination bar */}
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
