import React from 'react';
import { Payment } from '../../types';
import { storageService } from '../../services/storageService';
import { formatCurrency, formatDate } from '../../services/creditCalculator';
import { generatePaymentReceiptPDF } from '../../services/pdfService';
import { X, Printer, Download, Receipt, CheckCircle, ShieldCheck } from 'lucide-react';

interface ReceiptModalProps {
  isOpen: boolean;
  payment: Payment | null;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  payment,
  onClose,
}) => {
  if (!isOpen || !payment) return null;

  const credit = storageService.getCreditById(payment.creditId);
  const client = storageService.getClientById(payment.clientId);

  const handleDownloadPDF = () => {
    generatePaymentReceiptPDF(payment, credit, client);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-purple-950/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-purple-100 max-w-lg w-full p-6 sm:p-7 max-h-[92vh] overflow-y-auto">
        {/* Top Control Bar (Hidden on print) */}
        <div className="no-print flex items-center justify-between pb-3 border-b border-neutral-100 mb-5">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-purple-700" />
            <span className="text-xs font-bold text-neutral-800">
              Comprobante Oficial de Abono
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleDownloadPDF}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-purple-700 hover:bg-purple-800 rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar PDF</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir</span>
            </button>
            <button
              onClick={onClose}
              className="text-neutral-400 hover:text-neutral-600 p-1.5 rounded-lg transition-colors cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Official Receipt */}
        <div id="printable-receipt" className="border border-purple-200 rounded-2xl p-6 bg-white shadow-xs">
          {/* Header */}
          <div className="border-b-2 border-purple-900 pb-4 mb-4 flex items-start justify-between">
            <div>
              <h2 className="text-base font-black text-purple-950 tracking-tight">
                CREDIMASTER S.A.C.
              </h2>
              <p className="text-[11px] text-neutral-500">
                Sistema Integral de Gestión de Créditos
              </p>
              <p className="text-[10px] text-neutral-400 font-tabular">
                RUC: 20491823901 · San Isidro, Lima
              </p>
            </div>

            <div className="text-right">
              <span className="text-[10px] uppercase font-bold tracking-wider text-purple-700 block">
                Recibo de Abono
              </span>
              <span className="text-sm font-bold font-tabular text-neutral-900 block">
                {payment.receiptNumber}
              </span>
              <span className="text-[10px] text-neutral-400">
                Fecha: {formatDate(payment.paymentDate)}
              </span>
            </div>
          </div>

          {/* Operation & Client info */}
          <div className="bg-purple-50/50 rounded-xl p-3.5 border border-purple-100 mb-4 text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-neutral-500">Cliente Titular:</span>
              <span className="font-bold text-neutral-900">{payment.clientName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Documento de Identidad:</span>
              <span className="font-semibold text-neutral-800 font-tabular">{payment.clientDocument}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Crédito Asociado:</span>
              <span className="font-semibold text-purple-950 font-tabular">{payment.creditId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Forma de Pago:</span>
              <span className="font-medium text-neutral-800 capitalize">
                {payment.paymentMethod} (Ref: {payment.reference})
              </span>
            </div>
          </div>

          {/* Financial Balance Summary */}
          <div className="border border-neutral-200 rounded-xl overflow-hidden mb-4 text-xs font-tabular">
            <div className="bg-purple-900 text-white px-3 py-2 flex justify-between font-semibold">
              <span>Concepto Financiero</span>
              <span>Importe</span>
            </div>
            <div className="p-3 space-y-2 bg-neutral-50/40">
              <div className="flex justify-between text-neutral-600">
                <span>Saldo Anterior del Crédito:</span>
                <span className="font-medium">{formatCurrency(payment.previousBalance)}</span>
              </div>
              <div className="flex justify-between text-emerald-700 font-bold text-sm pt-1 border-t border-neutral-200">
                <span>Monto Abonado (Cancelado):</span>
                <span>- {formatCurrency(payment.amount)}</span>
              </div>
              <div className="flex justify-between text-purple-950 font-bold text-sm pt-1 border-t border-neutral-200">
                <span>Nuevo Saldo Restante:</span>
                <span>{formatCurrency(payment.newBalance)}</span>
              </div>
            </div>
          </div>

          {payment.notes && (
            <div className="mb-4 text-[11px] text-neutral-500 italic bg-neutral-50 p-2 rounded-lg">
              Observaciones: {payment.notes}
            </div>
          )}

          {/* Electronic stamp */}
          <div className="pt-3 border-t border-neutral-100 flex items-center justify-between text-[10px] text-neutral-400">
            <div className="flex items-center gap-1 text-emerald-700">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Operación Verificada Electrónicamente</span>
            </div>
            <span className="font-tabular">ID: {payment.id}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
