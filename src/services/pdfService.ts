import jsPDF from 'jspdf';
import { Credit, Payment, Client } from '../types';
import { formatCurrency, formatDate } from './creditCalculator';

export function generatePaymentReceiptPDF(payment: Payment, credit?: Credit, client?: Client): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a5', // Compact, official receipt format
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Primary Theme Colors (Deep Purple & Crisp White)
  const primaryColor = [88, 28, 135]; // #581C87 (Purple 900)
  const secondaryColor = [126, 34, 206]; // #7E22CE (Purple 700)
  const lightPurple = [245, 243, 255]; // #F5F3FF (Purple 50)
  const textColor = [30, 41, 59]; // Slate 800
  const mutedColor = [100, 116, 139]; // Slate 500

  // 1. Header Banner
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Institution Brand & Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('CREDIMASTER S.A.C.', 14, 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Sistema de Gestión de Créditos y Finanzas', 14, 16);
  doc.text('RUC: 20491823901 · Av. Las Camelias 490, Lima', 14, 20);

  // Receipt Number & Date Block in Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('RECIBO DE PAGO', pageWidth - 14, 11, { align: 'right' });
  doc.setFontSize(9);
  doc.text(payment.receiptNumber, pageWidth - 14, 16, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Emisión: ${payment.paymentDate}`, pageWidth - 14, 20, { align: 'right' });

  // 2. Client & Credit Details Card
  let y = 35;
  doc.setFillColor(lightPurple[0], lightPurple[1], lightPurple[2]);
  doc.roundedRect(12, y, pageWidth - 24, 38, 2, 2, 'F');
  doc.setDrawColor(216, 180, 254);
  doc.roundedRect(12, y, pageWidth - 24, 38, 2, 2, 'S');

  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('DATOS DE LA OPERACIÓN', 16, y + 6);

  // Client Details (Left)
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Cliente:', 16, y + 13);
  doc.setFont('helvetica', 'bold');
  doc.text(payment.clientName || client ? `${client?.firstName} ${client?.lastName}` : 'Cliente Registrado', 38, y + 13);

  doc.setFont('helvetica', 'normal');
  doc.text('Documento:', 16, y + 19);
  doc.setFont('helvetica', 'bold');
  doc.text(payment.clientDocument || client?.documentNumber || '-', 38, y + 19);

  doc.setFont('helvetica', 'normal');
  doc.text('Método:', 16, y + 25);
  doc.setFont('helvetica', 'bold');
  doc.text(payment.paymentMethod.toUpperCase(), 38, y + 25);

  doc.setFont('helvetica', 'normal');
  doc.text('Referencia:', 16, y + 31);
  doc.setFont('helvetica', 'bold');
  doc.text(payment.reference, 38, y + 31);

  // Credit Details (Right)
  const rightColX = pageWidth / 2 + 6;
  doc.setFont('helvetica', 'normal');
  doc.text('Código Crédito:', rightColX, y + 13);
  doc.setFont('helvetica', 'bold');
  doc.text(payment.creditId, rightColX + 26, y + 13);

  if (credit) {
    doc.setFont('helvetica', 'normal');
    doc.text('Monto Crédito:', rightColX, y + 19);
    doc.setFont('helvetica', 'bold');
    doc.text(formatCurrency(credit.amount), rightColX + 26, y + 19);

    doc.setFont('helvetica', 'normal');
    doc.text('Plazo / Vencimiento:', rightColX, y + 25);
    doc.setFont('helvetica', 'bold');
    doc.text(`${credit.termMonths} meses (${formatDate(credit.dueDate)})`, rightColX + 26, y + 25);
  }

  // 3. Financial Summary Table
  y = 80;
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(12, y, pageWidth - 24, 7, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('CONCEPTO FINANCIERO', 16, y + 5);
  doc.text('IMPORTE', pageWidth - 16, y + 5, { align: 'right' });

  // Rows
  y += 7;
  const rows = [
    { label: 'Saldo Anterior del Crédito', value: formatCurrency(payment.previousBalance), bold: false },
    { label: 'Monto Abonado (Pago Aplicado)', value: `- ${formatCurrency(payment.amount)}`, bold: true, highlight: true },
    { label: 'Nuevo Saldo Remanente', value: formatCurrency(payment.newBalance), bold: true },
  ];

  rows.forEach((r, idx) => {
    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(12, y, pageWidth - 24, 8, 'F');
    }
    doc.setDrawColor(226, 232, 240);
    doc.line(12, y + 8, pageWidth - 12, y + 8);

    doc.setTextColor(r.bold ? primaryColor[0] : textColor[0], r.bold ? primaryColor[1] : textColor[1], r.bold ? primaryColor[2] : textColor[2]);
    doc.setFont('helvetica', r.bold ? 'bold' : 'normal');
    doc.setFontSize(8.5);
    doc.text(r.label, 16, y + 5.5);
    doc.text(r.value, pageWidth - 16, y + 5.5, { align: 'right' });

    y += 8;
  });

  // Observations
  if (payment.notes) {
    y += 4;
    doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.text(`Observaciones: ${payment.notes}`, 16, y);
    y += 4;
  }

  // 4. Verification Stamp Box
  y += 12;
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(12, y, pageWidth - 24, 26, 2, 2, 'S');

  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('CERTIFICACIÓN DE OPERACIÓN ELECTRÓNICA', 16, y + 6);

  doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('Este documento constituye comprobante oficial de abono según las normas financieras vigentes.', 16, y + 11);
  doc.text(`Transacción registrada electrónicamente el ${payment.createdAt}.`, 16, y + 16);
  doc.text(`Código Hash de Seguridad: SHA256-${payment.id.replace(/-/g, '')}-${payment.receiptNumber}`, 16, y + 21);

  // 5. Footer signature line
  y += 34;
  doc.setDrawColor(148, 163, 184);
  doc.line(pageWidth / 2 - 25, y, pageWidth / 2 + 25, y);
  doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('Departamento de Créditos y Cobranzas', pageWidth / 2, y + 4, { align: 'center' });

  // Download PDF
  doc.save(`Recibo_${payment.receiptNumber}_${payment.creditId}.pdf`);
}

export function generateAccountStatementPDF(credit: Credit, payments: Payment[], client?: Client): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const primaryColor = [88, 28, 135];
  const textColor = [30, 41, 59];
  const mutedColor = [100, 116, 139];

  // Header
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('CREDIMASTER S.A.C.', 14, 12);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('ESTADO DE CUENTA DE CRÉDITO', 14, 18);
  doc.text(`Generado al: ${new Date().toLocaleDateString('es-ES')}`, 14, 23);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(`CRÉDITO: ${credit.id}`, pageWidth - 14, 14, { align: 'right' });
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Estado: ${credit.status.toUpperCase()}`, pageWidth - 14, 20, { align: 'right' });

  // Summary Card
  let y = 36;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, y, pageWidth - 28, 30, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, y, pageWidth - 28, 30, 2, 2, 'S');

  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(`Cliente: ${credit.clientName || client?.firstName + ' ' + client?.lastName}`, 18, y + 8);
  doc.text(`Documento: ${credit.clientDocument || client?.documentNumber}`, 18, y + 14);
  doc.text(`Fecha Otorgamiento: ${formatDate(credit.grantDate)}`, 18, y + 20);

  const col2 = pageWidth / 2 + 10;
  doc.text(`Monto Capital: ${formatCurrency(credit.amount)}`, col2, y + 8);
  doc.text(`Total a Pagar: ${formatCurrency(credit.totalToPay)}`, col2, y + 14);
  doc.text(`Saldo Pendiente: ${formatCurrency(credit.remainingBalance)}`, col2, y + 20);

  // Movements Table
  y = 74;
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(14, y, pageWidth - 28, 8, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('FECHA', 18, y + 5.5);
  doc.text('MOVIMIENTO / REFERENCIA', 45, y + 5.5);
  doc.text('CARGO (+)', 115, y + 5.5, { align: 'right' });
  doc.text('ABONO (-)', 150, y + 5.5, { align: 'right' });
  doc.text('SALDO', pageWidth - 18, y + 5.5, { align: 'right' });

  y += 8;

  // Initial Disbursement Row
  doc.setFillColor(255, 255, 255);
  doc.rect(14, y, pageWidth - 28, 7, 'F');
  doc.setDrawColor(241, 245, 249);
  doc.line(14, y + 7, pageWidth - 14, y + 7);

  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(formatDate(credit.grantDate), 18, y + 5);
  doc.text('Desembolso de Crédito Inicial', 45, y + 5);
  doc.text(formatCurrency(credit.totalToPay), 115, y + 5, { align: 'right' });
  doc.text('-', 150, y + 5, { align: 'right' });
  doc.setFont('helvetica', 'bold');
  doc.text(formatCurrency(credit.totalToPay), pageWidth - 18, y + 5, { align: 'right' });

  y += 7;

  // Chronological Payments
  payments.forEach((p, idx) => {
    if (idx % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(14, y, pageWidth - 28, 7, 'F');
    }
    doc.setDrawColor(241, 245, 249);
    doc.line(14, y + 7, pageWidth - 14, y + 7);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.text(formatDate(p.paymentDate), 18, y + 5);
    doc.text(`Abono ${p.receiptNumber} (${p.reference})`, 45, y + 5);
    doc.text('-', 115, y + 5, { align: 'right' });
    doc.setTextColor(16, 185, 129); // Emerald for payment
    doc.text(formatCurrency(p.amount), 150, y + 5, { align: 'right' });
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.setFont('helvetica', 'bold');
    doc.text(formatCurrency(p.newBalance), pageWidth - 18, y + 5, { align: 'right' });

    y += 7;
  });

  // Final Summary Box
  y += 8;
  doc.setFillColor(245, 243, 255);
  doc.roundedRect(pageWidth - 90, y, 76, 20, 2, 2, 'F');
  doc.setDrawColor(216, 180, 254);
  doc.roundedRect(pageWidth - 90, y, 76, 20, 2, 2, 'S');

  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('RESUMEN DE CUENTA', pageWidth - 86, y + 6);
  doc.setFontSize(8);
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.text('Total Pagado:', pageWidth - 86, y + 11);
  const totalPaid = payments.reduce((s, p) => s + p.amount, 0);
  doc.text(formatCurrency(totalPaid), pageWidth - 18, y + 11, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.text('Saldo Actual:', pageWidth - 86, y + 16);
  doc.setTextColor(credit.remainingBalance > 0 ? 220 : 16, credit.remainingBalance > 0 ? 38 : 185, credit.remainingBalance > 0 ? 38 : 129);
  doc.text(formatCurrency(credit.remainingBalance), pageWidth - 18, y + 16, { align: 'right' });

  doc.save(`EstadoCuenta_${credit.id}.pdf`);
}
