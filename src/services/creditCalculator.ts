import { AmortizationRow } from '../types';

/**
 * Calculates credit financing terms using the standard French amortization schedule (fixed monthly installment)
 */
export function calculateCreditSchedule(
  amount: number,
  annualInterestRate: number,
  termMonths: number,
  grantDate: string
): {
  monthlyFee: number;
  totalInterest: number;
  totalToPay: number;
  dueDate: string;
  amortizationTable: AmortizationRow[];
} {
  if (amount <= 0 || termMonths <= 0) {
    return {
      monthlyFee: 0,
      totalInterest: 0,
      totalToPay: 0,
      dueDate: grantDate,
      amortizationTable: [],
    };
  }

  const monthlyRate = annualInterestRate / 100 / 12;
  let monthlyFee = 0;

  if (monthlyRate === 0) {
    monthlyFee = amount / termMonths;
  } else {
    monthlyFee =
      (amount * (monthlyRate * Math.pow(1 + monthlyRate, termMonths))) /
      (Math.pow(1 + monthlyRate, termMonths) - 1);
  }

  // Round monthly fee to 2 decimals
  monthlyFee = Math.round(monthlyFee * 100) / 100;

  let currentBalance = amount;
  const amortizationTable: AmortizationRow[] = [];
  let accumulatedInterest = 0;

  const baseDate = new Date(grantDate + 'T12:00:00');

  for (let m = 1; m <= termMonths; m++) {
    const interest = Math.round(currentBalance * monthlyRate * 100) / 100;
    let principal = monthlyFee - interest;

    if (m === termMonths || principal > currentBalance) {
      principal = currentBalance;
      monthlyFee = principal + interest;
    }

    currentBalance = Math.max(0, Math.round((currentBalance - principal) * 100) / 100);
    accumulatedInterest += interest;

    // Calculate next month's date
    const feeDate = new Date(baseDate);
    feeDate.setMonth(baseDate.getMonth() + m);
    const dateStr = feeDate.toISOString().split('T')[0];

    amortizationTable.push({
      month: m,
      paymentDate: dateStr,
      monthlyFee: Math.round(monthlyFee * 100) / 100,
      principal: Math.round(principal * 100) / 100,
      interest: Math.round(interest * 100) / 100,
      remainingBalance: currentBalance,
    });
  }

  const totalToPay = Math.round((amount + accumulatedInterest) * 100) / 100;

  // Due date is the last installment date
  const finalDueDate =
    amortizationTable.length > 0
      ? amortizationTable[amortizationTable.length - 1].paymentDate
      : grantDate;

  return {
    monthlyFee: Math.round(monthlyFee * 100) / 100,
    totalInterest: Math.round(accumulatedInterest * 100) / 100,
    totalToPay,
    dueDate: finalDueDate,
    amortizationTable,
  };
}

/**
 * Calculates exact age in years from birthDate
 */
export function calculateAge(birthDate: string): number {
  if (!birthDate) return 0;
  const today = new Date();
  const birth = new Date(birthDate + 'T12:00:00');
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

/**
 * Checks if a given date is strictly in the future compared to today
 */
export function isFutureDate(dateStr: string): boolean {
  if (!dateStr) return false;
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  const target = new Date(dateStr + 'T12:00:00');
  return target > today;
}

/**
 * Checks if a due date has expired compared to today
 */
export function isOverdue(dueDateStr: string): boolean {
  if (!dueDateStr) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDateStr + 'T23:59:59');
  return due < today;
}

/**
 * Currency formatter for Spanish locale
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  })
    .format(amount || 0)
    .replace('US$', '$');
}

/**
 * Date formatter (e.g. 15 de marzo de 2026)
 */
export function formatDate(dateStr: string): string {
  if (!dateStr) return '-';
  try {
    const date = new Date(dateStr + 'T12:00:00');
    return new Intl.DateTimeFormat('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date);
  } catch {
    return dateStr;
  }
}
