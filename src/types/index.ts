export type UserRole = 'admin' | 'cliente';

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string; // Contraseña personalizada del usuario
  role: UserRole;
  clientId?: string; // Linked client ID if role === 'cliente'
  active: boolean;
  avatarUrl?: string;
  createdAt: string;
}

export interface Client {
  id: string;
  documentNumber: string; // DNI / Cédula (único)
  firstName: string;
  lastName: string;
  birthDate: string; // YYYY-MM-DD
  phone: string;
  address: string;
  email: string; // único
  occupation: string;
  monthlyIncome: number;
  creditLimit: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export type CreditStatus = 'activo' | 'pagado' | 'vencido' | 'cancelado';

export interface Credit {
  id: string; // e.g. CRE-2026-001
  clientId: string;
  clientName?: string;
  clientDocument?: string;
  amount: number; // Monto solicitado / Capital
  annualInterestRate: number; // Tasa anual en % (e.g. 18.0)
  termMonths: number; // Plazo en meses
  grantDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  monthlyFee: number; // Cuota mensual
  totalInterest: number; // Interés total
  totalToPay: number; // Capital + Interés total
  remainingBalance: number; // Saldo pendiente actual
  status: CreditStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string; // e.g. PAG-2026-001
  receiptNumber: string; // e.g. REC-00101
  creditId: string;
  clientId: string;
  clientName?: string;
  clientDocument?: string;
  paymentDate: string; // YYYY-MM-DD
  amount: number;
  previousBalance: number;
  newBalance: number;
  paymentMethod: 'efectivo' | 'transferencia' | 'tarjeta' | 'deposito';
  reference: string;
  notes?: string;
  createdAt: string;
}

export interface AmortizationRow {
  month: number;
  paymentDate: string;
  monthlyFee: number;
  principal: number;
  interest: number;
  remainingBalance: number;
}

export interface AccountStatementMovement {
  date: string;
  type: 'desembolso' | 'abono';
  concept: string;
  reference: string;
  debit: number; // Aumento de deuda (desembolso)
  credit: number; // Reducción de deuda (abono)
  balance: number; // Saldo tras el movimiento
}
