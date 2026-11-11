import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Credit, Payment } from '../../types';
import { storageService } from '../../services/storageService';
import { formatCurrency, formatDate, isFutureDate } from '../../services/creditCalculator';
import { X, Receipt, AlertCircle, CheckCircle2, DollarSign, Calendar, CreditCard } from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  paymentToEdit?: Payment | null;
  initialCreditId?: string;
  onClose: () => void;
  onSuccess: (payment: Payment, message: string) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  paymentToEdit,
  initialCreditId,
  onClose,
  onSuccess,
}) => {
  const { isAdmin, isClient, currentUser } = useAuth();
  const isEditing = !!paymentToEdit;

  // Available credits with pending debt
  const eligibleCredits = useMemo(() => {
    const list = isClient && currentUser?.clientId
      ? storageService.getCreditsByClient(currentUser.clientId)
      : storageService.getCredits();

    return list.filter((c) => (c.status === 'activo' || c.status === 'vencido') && c.remainingBalance > 0);
  }, [isClient, currentUser, isOpen]);

  const [creditId, setCreditId] = useState(
    initialCreditId || (eligibleCredits[0]?.id || '')
  );
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'efectivo' | 'transferencia' | 'tarjeta' | 'deposito'>('transferencia');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Selected credit object
  const selectedCredit = useMemo(() => {
    return storageService.getCreditById(creditId);
  }, [creditId]);

  useEffect(() => {
    if (paymentToEdit) {
      setCreditId(paymentToEdit.creditId);
      setPaymentDate(paymentToEdit.paymentDate);
      setAmount(paymentToEdit.amount.toString());
      setPaymentMethod(paymentToEdit.paymentMethod);
      setReference(paymentToEdit.reference);
      setNotes(paymentToEdit.notes || '');
    } else {
      if (initialCreditId) {
        setCreditId(initialCreditId);
      } else if (eligibleCredits.length > 0 && !creditId) {
        setCreditId(eligibleCredits[0].id);
      }
      setPaymentDate(new Date().toISOString().split('T')[0]);
      setPaymentMethod('transferencia');
      setReference(`TRF-${Math.floor(100000 + Math.random() * 900000)}`);
      setNotes('');

      // Default amount to credit's monthly fee or remaining balance
      const cr = storageService.getCreditById(initialCreditId || eligibleCredits[0]?.id || '');
      if (cr) {
        const defaultAmt = Math.min(cr.monthlyFee, cr.remainingBalance);
        setAmount(defaultAmt.toString());
      } else {
        setAmount('');
      }
    }
    setErrorMessage('');
  }, [paymentToEdit, initialCreditId, isOpen]);

  if (!isOpen) return null;

  const numAmount = parseFloat(amount) || 0;
  const currentPendingBalance = selectedCredit ? selectedCredit.remainingBalance : 0;
  const projectedRemaining = Math.max(0, Math.round((currentPendingBalance - numAmount) * 100) / 100);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!creditId) {
      setErrorMessage('Seleccione un crédito válido con saldo pendiente.');
      return;
    }

    if (!paymentDate) {
      setErrorMessage('La fecha de pago es obligatoria.');
      return;
    }

    if (isFutureDate(paymentDate)) {
      setErrorMessage('La fecha de pago no puede ser una fecha futura.');
      return;
    }

    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMessage('El monto abonado debe ser mayor a cero.');
      return;
    }

    if (!isEditing && numAmount > currentPendingBalance) {
      setErrorMessage(
        `El monto ($ ${numAmount.toFixed(2)}) no puede exceder el saldo pendiente ($ ${currentPendingBalance.toFixed(2)}).`
      );
      return;
    }

    if (isEditing && paymentToEdit) {
      const res = storageService.updatePayment(paymentToEdit.id, {
        paymentDate,
        amount: numAmount,
        paymentMethod,
        reference: reference.trim(),
        notes: notes.trim(),
      });

      if (res.success) {
        const updated = storageService.getPaymentById(paymentToEdit.id)!;
        onSuccess(updated, 'Pago actualizado y saldos recalculados correctamente.');
        onClose();
      } else {
        setErrorMessage(res.error || 'Error al actualizar el pago.');
      }
    } else {
      const res = storageService.registerPayment(
        {
          creditId,
          paymentDate,
          amount: numAmount,
          paymentMethod,
          reference: reference.trim(),
          notes: notes.trim(),
        },
        isClient && currentUser?.clientId ? currentUser.clientId : undefined
      );

      if (res.success && res.payment) {
        onSuccess(
          res.payment,
          `Abono de ${formatCurrency(numAmount)} registrado exitosamente bajo recibo ${res.payment.receiptNumber}.`
        );
        onClose();
      } else {
        setErrorMessage(res.error || 'Error al registrar el pago.');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-purple-950/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-purple-100 max-w-xl w-full p-6 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-100 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900">
                {isEditing ? `Modificar Pago ${paymentToEdit.receiptNumber}` : 'Registrar Nuevo Abono / Pago'}
              </h2>
              <p className="text-xs text-neutral-500">
                El saldo del crédito se actualizará en tiempo real y se emitirá el comprobante oficial.
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

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Credit Selection */}
          <div>
            <label className="block text-xs font-semibold text-neutral-800 mb-1">
              Seleccionar Crédito a Abonar *
            </label>
            <select
              disabled={isEditing}
              value={creditId}
              onChange={(e) => {
                setCreditId(e.target.value);
                const cr = storageService.getCreditById(e.target.value);
                if (cr) {
                  setAmount(Math.min(cr.monthlyFee, cr.remainingBalance).toString());
                }
              }}
              className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-600 font-medium text-neutral-900"
            >
              {eligibleCredits.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.id} — {c.clientName} (Saldo: {formatCurrency(c.remainingBalance)})
                </option>
              ))}
            </select>
            {eligibleCredits.length === 0 && (
              <p className="text-[11px] text-amber-600 mt-1">
                No hay créditos con saldo pendiente disponibles para abonar.
              </p>
            )}
          </div>

          {/* Real-time Balance Box */}
          {selectedCredit && (
            <div className="bg-purple-50/70 p-3.5 rounded-xl border border-purple-100 flex items-center justify-between text-xs font-tabular">
              <div>
                <span className="text-[11px] text-neutral-500 block">Saldo Pendiente Actual:</span>
                <span className="font-bold text-neutral-900 text-sm">
                  {formatCurrency(currentPendingBalance)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-neutral-500 block">Saldo Tras Este Abono:</span>
                <span className={`font-bold text-sm ${projectedRemaining === 0 ? 'text-emerald-700' : 'text-purple-950'}`}>
                  {formatCurrency(projectedRemaining)} {projectedRemaining === 0 && '(¡Liquidado!)'}
                </span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Monto del Abono */}
            <div>
              <label className="block text-xs font-semibold text-neutral-800 mb-1">
                Monto del Abono ($) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 font-tabular font-bold text-purple-950"
              />
              {selectedCredit && (
                <div className="flex items-center justify-between mt-1 text-[10px] text-neutral-400">
                  <button
                    type="button"
                    onClick={() => setAmount(Math.min(selectedCredit.monthlyFee, selectedCredit.remainingBalance).toString())}
                    className="hover:text-purple-700 underline cursor-pointer"
                  >
                    Cuota mensual: {formatCurrency(selectedCredit.monthlyFee)}
                  </button>
                  <button
                    type="button"
                    onClick={() => setAmount(selectedCredit.remainingBalance.toString())}
                    className="hover:text-purple-700 underline cursor-pointer"
                  >
                    Liquidar total
                  </button>
                </div>
              )}
            </div>

            {/* Fecha del Abono */}
            <div>
              <label className="block text-xs font-semibold text-neutral-800 mb-1">
                Fecha de Pago (No futura) *
              </label>
              <input
                type="date"
                required
                max={new Date().toISOString().split('T')[0]}
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 font-tabular"
              />
            </div>

            {/* Método de Pago */}
            <div>
              <label className="block text-xs font-semibold text-neutral-800 mb-1">
                Método de Pago *
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-600 font-medium"
              >
                <option value="transferencia">Transferencia Bancaria</option>
                <option value="deposito">Depósito en Ventanilla</option>
                <option value="tarjeta">Tarjeta Débito / Crédito</option>
                <option value="efectivo">Efectivo en Caja</option>
              </select>
            </div>

            {/* Referencia de Pago */}
            <div>
              <label className="block text-xs font-semibold text-neutral-800 mb-1">
                N° de Operación / Referencia *
              </label>
              <input
                type="text"
                required
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Ej. TRF-982104"
                className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 font-tabular"
              />
            </div>

            {/* Observaciones */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-neutral-800 mb-1">
                Observaciones del Pago (Opcional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ej. Abono correspondiente a la cuota 3"
                className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-neutral-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:text-neutral-800 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={eligibleCredits.length === 0}
              className="px-5 py-2 text-xs font-semibold text-white bg-purple-700 hover:bg-purple-800 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors shadow-2xs cursor-pointer"
            >
              {isEditing ? 'Guardar Cambios y Recalcular' : 'Confirmar Abono y Emitir Recibo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
