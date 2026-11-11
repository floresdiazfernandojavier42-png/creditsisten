import React, { useState, useEffect, useMemo } from 'react';
import { Credit, Client } from '../../types';
import { storageService } from '../../services/storageService';
import { calculateCreditSchedule, formatCurrency, formatDate } from '../../services/creditCalculator';
import { X, CreditCard, Calculator, AlertCircle, CheckCircle2, ChevronDown, Calendar, Percent } from 'lucide-react';

interface CreditModalProps {
  isOpen: boolean;
  creditToEdit?: Credit | null;
  initialClientId?: string;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export const CreditModal: React.FC<CreditModalProps> = ({
  isOpen,
  creditToEdit,
  initialClientId,
  onClose,
  onSuccess,
}) => {
  const isEditing = !!creditToEdit;
  const activeClients = storageService.getClients().filter((c) => c.active);

  const [clientId, setClientId] = useState(initialClientId || (activeClients[0]?.id || ''));
  const [amount, setAmount] = useState('5000');
  const [annualRate, setAnnualRate] = useState('18.0');
  const [termMonths, setTermMonths] = useState('12');
  const [grantDate, setGrantDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showAmortizationPreview, setShowAmortizationPreview] = useState(false);

  useEffect(() => {
    if (creditToEdit) {
      setClientId(creditToEdit.clientId);
      setAmount(creditToEdit.amount.toString());
      setAnnualRate(creditToEdit.annualInterestRate.toString());
      setTermMonths(creditToEdit.termMonths.toString());
      setGrantDate(creditToEdit.grantDate);
      setNotes(creditToEdit.notes || '');
    } else {
      if (initialClientId) {
        setClientId(initialClientId);
      } else if (activeClients.length > 0 && !clientId) {
        setClientId(activeClients[0].id);
      }
      setAmount('5000');
      setAnnualRate('18.0');
      setTermMonths('12');
      setGrantDate(new Date().toISOString().split('T')[0]);
      setNotes('');
    }
    setErrorMessage('');
  }, [creditToEdit, initialClientId, isOpen]);

  // Selected client details and limits
  const selectedClient = useMemo(() => {
    return storageService.getClientById(clientId);
  }, [clientId]);

  const clientActiveDebt = useMemo(() => {
    return clientId ? storageService.getClientOutstandingDebt(clientId) : 0;
  }, [clientId]);

  const clientAvailableLimit = useMemo(() => {
    if (!selectedClient) return 0;
    // If editing, exclude this credit's original amount
    const debt = isEditing && creditToEdit ? Math.max(0, clientActiveDebt - creditToEdit.amount) : clientActiveDebt;
    return Math.max(0, selectedClient.creditLimit - debt);
  }, [selectedClient, clientActiveDebt, isEditing, creditToEdit]);

  // Dynamic automatic calculation of amortization schedule
  const calculation = useMemo(() => {
    const numAmount = parseFloat(amount) || 0;
    const numRate = parseFloat(annualRate) || 0;
    const numMonths = parseInt(termMonths, 10) || 0;
    return calculateCreditSchedule(numAmount, numRate, numMonths, grantDate);
  }, [amount, annualRate, termMonths, grantDate]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!clientId) {
      setErrorMessage('Debe seleccionar un cliente activo.');
      return;
    }

    const numAmount = parseFloat(amount);
    const numRate = parseFloat(annualRate);
    const numMonths = parseInt(termMonths, 10);

    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMessage('El monto del crédito debe ser mayor a cero.');
      return;
    }

    if (isNaN(numRate) || numRate < 0) {
      setErrorMessage('La tasa de interés no puede ser negativa.');
      return;
    }

    if (isNaN(numMonths) || numMonths <= 0) {
      setErrorMessage('El plazo debe ser de al menos 1 mes.');
      return;
    }

    // Check credit limit
    if (numAmount > clientAvailableLimit) {
      setErrorMessage(
        `El monto ($ ${numAmount.toFixed(2)}) supera el límite disponible del cliente ($ ${clientAvailableLimit.toFixed(2)}).`
      );
      return;
    }

    const creditPayload = {
      clientId,
      amount: numAmount,
      annualInterestRate: numRate,
      termMonths: numMonths,
      grantDate,
      dueDate: calculation.dueDate,
      monthlyFee: calculation.monthlyFee,
      totalInterest: calculation.totalInterest,
      totalToPay: calculation.totalToPay,
      notes: notes.trim(),
    };

    const res = storageService.saveCredit(creditPayload, creditToEdit?.id);

    if (res.success) {
      onSuccess(
        isEditing
          ? 'Crédito actualizado correctamente.'
          : `Crédito otorgado exitosamente con código ${res.credit?.id}.`
      );
      onClose();
    } else {
      setErrorMessage(res.error || 'Ocurrió un error al registrar el crédito.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-purple-950/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-purple-100 max-w-3xl w-full p-6 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-100 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900">
                {isEditing ? `Modificar Crédito ${creditToEdit.id}` : 'Otorgamiento de Nuevo Crédito'}
              </h2>
              <p className="text-xs text-neutral-500">
                Simulación y registro formal de crédito con sistema de amortización francés.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <p>{errorMessage}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Client Selection & Credit Limit Verification Box */}
          <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200/80 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-800 mb-1">
                Cliente Solicitante (Solo clientes activos) *
              </label>
              <select
                disabled={isEditing}
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-600 font-medium text-neutral-900"
              >
                {activeClients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.firstName} {c.lastName} — Doc: {c.documentNumber}
                  </option>
                ))}
              </select>
            </div>

            {selectedClient && (
              <div className="grid grid-cols-3 gap-3 pt-2 border-t border-neutral-200 text-xs">
                <div>
                  <span className="text-neutral-500 text-[11px] block">Límite Total:</span>
                  <span className="font-semibold text-neutral-900 font-tabular">
                    {formatCurrency(selectedClient.creditLimit)}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-500 text-[11px] block">Deuda Pendiente Actual:</span>
                  <span className="font-semibold text-purple-900 font-tabular">
                    {formatCurrency(clientActiveDebt)}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-500 text-[11px] block">Capacidad Disponible:</span>
                  <span className="font-bold text-emerald-700 font-tabular">
                    {formatCurrency(clientAvailableLimit)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Credit Parameters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Monto Capital */}
            <div>
              <label className="block text-xs font-semibold text-neutral-800 mb-1">
                Monto Capital a Financiar ($) *
              </label>
              <input
                type="number"
                step="0.01"
                min="100"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="5000.00"
                className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 font-tabular font-bold text-purple-950"
              />
            </div>

            {/* Tasa de Interés Anual */}
            <div>
              <label className="block text-xs font-semibold text-neutral-800 mb-1">
                Tasa de Interés Anual (%) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  required
                  value={annualRate}
                  onChange={(e) => setAnnualRate(e.target.value)}
                  placeholder="18.0"
                  className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 font-tabular font-medium"
                />
                <span className="absolute right-3 top-2 text-xs text-neutral-400 font-bold">%</span>
              </div>
            </div>

            {/* Plazo en Meses */}
            <div>
              <label className="block text-xs font-semibold text-neutral-800 mb-1">
                Plazo en Meses *
              </label>
              <input
                type="number"
                min="1"
                max="120"
                required
                value={termMonths}
                onChange={(e) => setTermMonths(e.target.value)}
                placeholder="12"
                className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 font-tabular font-medium"
              />
            </div>

            {/* Fecha de Otorgamiento */}
            <div>
              <label className="block text-xs font-semibold text-neutral-800 mb-1">
                Fecha de Otorgamiento *
              </label>
              <input
                type="date"
                required
                value={grantDate}
                onChange={(e) => setGrantDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 font-tabular"
              />
            </div>

            {/* Observaciones / Notas */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-neutral-800 mb-1">
                Propósito del Crédito / Observaciones
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Destino del financiamiento, condiciones especiales..."
                className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
            </div>
          </div>

          {/* Real-time Calculation Summary Card */}
          <div className="bg-purple-900 text-white rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-purple-800 mb-3">
              <div className="flex items-center gap-2">
                <Calculator className="w-4 h-4 text-purple-300" />
                <span className="text-xs font-bold uppercase tracking-wider text-purple-200">
                  Resultado del Cálculo Financiero Automático
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowAmortizationPreview(!showAmortizationPreview)}
                className="text-xs font-semibold text-purple-200 hover:text-white underline cursor-pointer"
              >
                {showAmortizationPreview ? 'Ocultar cronograma' : 'Ver cronograma de cuotas'}
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <p className="text-purple-300 text-[11px]">Cuota Mensual Estimada</p>
                <p className="text-lg font-bold font-tabular text-white">
                  {formatCurrency(calculation.monthlyFee)}
                </p>
              </div>

              <div>
                <p className="text-purple-300 text-[11px]">Interés Total Proyectado</p>
                <p className="text-lg font-bold font-tabular text-purple-200">
                  {formatCurrency(calculation.totalInterest)}
                </p>
              </div>

              <div>
                <p className="text-purple-300 text-[11px]">Total a Pagar (Saldo Inicial)</p>
                <p className="text-lg font-bold font-tabular text-purple-100">
                  {formatCurrency(calculation.totalToPay)}
                </p>
              </div>

              <div>
                <p className="text-purple-300 text-[11px]">Fecha de Vencimiento</p>
                <p className="text-sm font-bold font-tabular text-white mt-1">
                  {formatDate(calculation.dueDate)}
                </p>
              </div>
            </div>

            {/* Amortization Table Preview */}
            {showAmortizationPreview && (
              <div className="mt-4 pt-3 border-t border-purple-800 max-h-48 overflow-y-auto">
                <table className="w-full text-left text-[11px]">
                  <thead>
                    <tr className="text-purple-300 border-b border-purple-800">
                      <th className="pb-1.5 font-semibold">N° Cuota</th>
                      <th className="pb-1.5 font-semibold">Fecha Venc.</th>
                      <th className="pb-1.5 font-semibold text-right">Cuota Fija</th>
                      <th className="pb-1.5 font-semibold text-right">Capital</th>
                      <th className="pb-1.5 font-semibold text-right">Interés</th>
                      <th className="pb-1.5 font-semibold text-right">Saldo Remanente</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-purple-800/60 font-tabular">
                    {calculation.amortizationTable.map((row) => (
                      <tr key={row.month} className="hover:bg-purple-800/40">
                        <td className="py-1">Mes {row.month}</td>
                        <td className="py-1 text-purple-200">{row.paymentDate}</td>
                        <td className="py-1 text-right font-medium">{formatCurrency(row.monthlyFee)}</td>
                        <td className="py-1 text-right text-purple-200">{formatCurrency(row.principal)}</td>
                        <td className="py-1 text-right text-purple-200">{formatCurrency(row.interest)}</td>
                        <td className="py-1 text-right font-bold">{formatCurrency(row.remainingBalance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-neutral-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:text-neutral-800 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-purple-700 hover:bg-purple-800 rounded-lg transition-colors shadow-2xs cursor-pointer"
            >
              {isEditing ? 'Guardar Cambios' : 'Confirmar y Otorgar Crédito'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
