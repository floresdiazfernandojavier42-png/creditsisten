import React from 'react';
import { Credit, Payment } from '../../types';
import { storageService } from '../../services/storageService';
import { formatCurrency, formatDate } from '../../services/creditCalculator';
import { generateAccountStatementPDF } from '../../services/pdfService';
import { X, Printer, Download, FileText, CheckCircle2 } from 'lucide-react';

interface AccountStatementModalProps {
  isOpen: boolean;
  credit: Credit | null;
  onClose: () => void;
}

export const AccountStatementModal: React.FC<AccountStatementModalProps> = ({
  isOpen,
  credit,
  onClose,
}) => {
  if (!isOpen || !credit) return null;

  const payments = storageService.getPaymentsByCredit(credit.id);
  const client = storageService.getClientById(credit.clientId);
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    generateAccountStatementPDF(credit, payments, client);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-purple-950/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-purple-100 max-w-4xl w-full p-6 sm:p-8 max-h-[92vh] overflow-y-auto">
        {/* Top Control Bar (Hidden during print) */}
        <div className="no-print flex items-center justify-between pb-4 border-b border-neutral-100 mb-6">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-700" />
            <span className="text-sm font-bold text-neutral-900">
              Estado de Cuenta Oficial — {credit.id}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPDF}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-purple-700 hover:bg-purple-800 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar PDF</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
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

        {/* Printable Statement Sheet */}
        <div id="printable-receipt" className="space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between pb-4 border-b-2 border-purple-900">
            <div>
              <h1 className="text-xl font-black tracking-tight text-purple-950">
                CREDIMASTER S.A.C.
              </h1>
              <p className="text-xs text-neutral-500">
                División de Créditos y Servicios Financieros · RUC: 20491823901
              </p>
              <p className="text-xs text-neutral-500">
                Av. Las Camelias 490, San Isidro, Lima · Central: (01) 614-2000
              </p>
            </div>

            <div className="text-right">
              <span className="text-xs uppercase font-bold tracking-wider text-purple-700 block">
                Estado de Cuenta Individual
              </span>
              <span className="text-lg font-bold font-tabular text-neutral-900 block">
                {credit.id}
              </span>
              <span className="text-xs text-neutral-400">
                Fecha Emisión: {new Date().toLocaleDateString('es-ES')}
              </span>
            </div>
          </div>

          {/* Client & Loan Info Box */}
          <div className="grid grid-cols-2 gap-4 bg-purple-50/40 p-4 rounded-xl border border-purple-100 text-xs">
            <div>
              <span className="text-[11px] text-neutral-400 block uppercase font-semibold">
                Titular del Crédito
              </span>
              <p className="font-bold text-neutral-900 text-sm mt-0.5">
                {credit.clientName || `${client?.firstName} ${client?.lastName}`}
              </p>
              <p className="text-neutral-600 font-tabular mt-0.5">
                Documento de Identidad: {credit.clientDocument || client?.documentNumber}
              </p>
              <p className="text-neutral-600 mt-0.5">
                Dirección: {client?.address || 'Registrada en expediente'}
              </p>
            </div>

            <div>
              <span className="text-[11px] text-neutral-400 block uppercase font-semibold">
                Parámetros Financieros
              </span>
              <div className="grid grid-cols-2 gap-2 mt-1 font-tabular">
                <div>
                  <span className="text-neutral-500 text-[11px]">Capital Aprobado:</span>
                  <p className="font-bold text-neutral-900">{formatCurrency(credit.amount)}</p>
                </div>
                <div>
                  <span className="text-neutral-500 text-[11px]">Tasa de Interés:</span>
                  <p className="font-semibold text-neutral-900">{credit.annualInterestRate}% anual</p>
                </div>
                <div>
                  <span className="text-neutral-500 text-[11px]">Plazo / Cuotas:</span>
                  <p className="font-semibold text-neutral-900">{credit.termMonths} meses</p>
                </div>
                <div>
                  <span className="text-neutral-500 text-[11px]">Vencimiento:</span>
                  <p className="font-semibold text-neutral-900">{formatDate(credit.dueDate)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Chronological Movements Table */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-purple-950 mb-2">
              Cronología de Movimientos y Abonos
            </h3>

            <div className="border border-neutral-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs font-tabular">
                <thead className="bg-purple-900 text-white font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Fecha</th>
                    <th className="py-2.5 px-3">Concepto / Comprobante</th>
                    <th className="py-2.5 px-3 text-right">Cargo (+)</th>
                    <th className="py-2.5 px-3 text-right">Abono (-)</th>
                    <th className="py-2.5 px-3 text-right">Saldo Pendiente</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {/* Initial Disbursement */}
                  <tr className="bg-white">
                    <td className="py-2.5 px-3">{formatDate(credit.grantDate)}</td>
                    <td className="py-2.5 px-3 font-medium text-neutral-800">
                      Desembolso de Crédito ({credit.termMonths} cuotas pactadas)
                    </td>
                    <td className="py-2.5 px-3 text-right font-medium">
                      {formatCurrency(credit.totalToPay)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-neutral-400">-</td>
                    <td className="py-2.5 px-3 text-right font-bold text-neutral-900">
                      {formatCurrency(credit.totalToPay)}
                    </td>
                  </tr>

                  {/* Payments */}
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-neutral-50/60">
                      <td className="py-2.5 px-3">{formatDate(p.paymentDate)}</td>
                      <td className="py-2.5 px-3">
                        <span className="font-semibold text-neutral-800">
                          Abono {p.receiptNumber}
                        </span>{' '}
                        <span className="text-neutral-400 capitalize">
                          ({p.paymentMethod} - {p.reference})
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right text-neutral-400">-</td>
                      <td className="py-2.5 px-3 text-right font-bold text-emerald-700">
                        {formatCurrency(p.amount)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-purple-950">
                        {formatCurrency(p.newBalance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Summary Box */}
          <div className="flex justify-end">
            <div className="w-full sm:w-80 bg-neutral-50 p-4 rounded-xl border border-neutral-200 space-y-2 text-xs font-tabular">
              <div className="flex items-center justify-between text-neutral-600">
                <span>Total Deuda Inicial (Cap + Int):</span>
                <span className="font-semibold text-neutral-900">{formatCurrency(credit.totalToPay)}</span>
              </div>
              <div className="flex items-center justify-between text-neutral-600">
                <span>Total Amortizado a la Fecha:</span>
                <span className="font-semibold text-emerald-700">{formatCurrency(totalPaid)}</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-neutral-200 text-sm">
                <span className="font-bold text-neutral-900">Saldo Remanente Actual:</span>
                <span className={`font-bold ${credit.remainingBalance > 0 ? 'text-purple-950' : 'text-emerald-700'}`}>
                  {formatCurrency(credit.remainingBalance)}
                </span>
              </div>
            </div>
          </div>

          {/* Legal disclaimer */}
          <div className="pt-6 border-t border-neutral-200 text-[11px] text-neutral-400 text-center">
            Este extracto de cuenta refleja todos los abonos y saldos computados a la fecha de consulta. Para consultas adicionales, contacte a cobranzas@credimaster.com.
          </div>
        </div>
      </div>
    </div>
  );
};
