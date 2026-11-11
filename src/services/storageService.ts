import { Client, Credit, CreditStatus, Payment, User } from '../types';
import { isOverdue } from './creditCalculator';
import {
  validateDUI,
  validateGmail,
  validateName,
  validateBirthDate,
  validatePhone,
  validateAmount,
} from './validators';

const STORAGE_KEYS = {
  USERS: 'crediflex_users',
  CLIENTS: 'crediflex_clients',
  CREDITS: 'crediflex_credits',
  PAYMENTS: 'crediflex_payments',
  CURRENT_USER: 'crediflex_current_user',
  SEEDED: 'credimaster_initialized_v7', // updated for customizable client passwords
};

// Initial Seed Data: Fernando and Rosmery as Admins (credimaster123) and clients with individual passwords
const INITIAL_USERS: User[] = [
  {
    id: 'USR-001',
    name: 'Fernando',
    email: 'fernando@gmail.com',
    password: 'credimaster123',
    role: 'admin',
    active: true,
    createdAt: '2026-01-01',
  },
  {
    id: 'USR-002',
    name: 'Rosmery',
    email: 'rosmery@gmail.com',
    password: 'credimaster123',
    role: 'admin',
    active: true,
    createdAt: '2026-01-01',
  },
  {
    id: 'USR-003',
    name: 'Carlos Mendoza',
    email: 'carlos.mendoza.cred@gmail.com',
    password: 'carlos123',
    role: 'cliente',
    clientId: 'CLI-001',
    active: true,
    createdAt: '2026-01-15',
  },
  {
    id: 'USR-004',
    name: 'Ana Gómez',
    email: 'ana.gomez.val@gmail.com',
    password: 'ana123',
    role: 'cliente',
    clientId: 'CLI-002',
    active: true,
    createdAt: '2026-01-20',
  },
  {
    id: 'USR-005',
    name: 'Roberto Silva',
    email: 'roberto.silva.par@gmail.com',
    password: 'roberto123',
    role: 'cliente',
    clientId: 'CLI-003',
    active: true,
    createdAt: '2026-02-01',
  },
  {
    id: 'USR-006',
    name: 'Lucía Morales',
    email: 'lucia.morales.ux@gmail.com',
    password: 'lucia123',
    role: 'cliente',
    clientId: 'CLI-004',
    active: true,
    createdAt: '2026-02-05',
  },
];

const INITIAL_CLIENTS: Client[] = [
  {
    id: 'CLI-001',
    documentNumber: '024829101', // Exactamente 9 dígitos
    firstName: 'Carlos',
    lastName: 'Mendoza Rivas',
    birthDate: '1988-06-14',
    phone: '+503 7890 1234',
    address: 'Av. Las Palmeras 450, Urb. Sol',
    email: 'carlos.mendoza.cred@gmail.com',
    occupation: 'Ingeniero de Sistemas',
    monthlyIncome: 3800,
    creditLimit: 15000,
    active: true,
    createdAt: '2026-01-15',
    updatedAt: '2026-01-15',
  },
  {
    id: 'CLI-002',
    documentNumber: '019384722', // Exactamente 9 dígitos
    firstName: 'Ana',
    lastName: 'Gómez Valdivia',
    birthDate: '1992-11-23',
    phone: '+503 7654 3210',
    address: 'Jr. Los Álamos 182, Dpto 301',
    email: 'ana.gomez.val@gmail.com',
    occupation: 'Contadora Pública',
    monthlyIncome: 2900,
    creditLimit: 8000,
    active: true,
    createdAt: '2026-01-20',
    updatedAt: '2026-01-20',
  },
  {
    id: 'CLI-003',
    documentNumber: '031849203', // Exactamente 9 dígitos
    firstName: 'Roberto',
    lastName: 'Silva Paredes',
    birthDate: '1982-03-10',
    phone: '+503 7543 2109',
    address: 'Calle San Martín 524',
    email: 'roberto.silva.par@gmail.com',
    occupation: 'Comerciante Minorista',
    monthlyIncome: 4200,
    creditLimit: 20000,
    active: true,
    createdAt: '2026-02-01',
    updatedAt: '2026-02-01',
  },
  {
    id: 'CLI-004',
    documentNumber: '042950183', // Exactamente 9 dígitos
    firstName: 'Lucía',
    lastName: 'Morales Cano',
    birthDate: '1996-08-30',
    phone: '+503 7432 1098',
    address: 'Av. Primavera 1200',
    email: 'lucia.morales.ux@gmail.com',
    occupation: 'Diseñadora UX/UI',
    monthlyIncome: 3100,
    creditLimit: 10000,
    active: true,
    createdAt: '2026-02-05',
    updatedAt: '2026-02-05',
  },
  {
    id: 'CLI-005',
    documentNumber: '053061294', // Exactamente 9 dígitos
    firstName: 'Fernando',
    lastName: 'Torres Bazán',
    birthDate: '1979-12-05',
    phone: '+503 7321 0987',
    address: 'Pasaje San Judas 104',
    email: 'fernando.torres.bz@gmail.com',
    occupation: 'Consultor Independiente',
    monthlyIncome: 2500,
    creditLimit: 5000,
    active: false, // Desactivado de prueba
    createdAt: '2026-02-10',
    updatedAt: '2026-02-10',
  },
];

const INITIAL_CREDITS: Credit[] = [
  // 1. Crédito ACTIVO al día para Carlos Mendoza
  {
    id: 'CRE-2026-001',
    clientId: 'CLI-001',
    clientName: 'Carlos Mendoza Rivas',
    clientDocument: '024829101',
    amount: 5000,
    annualInterestRate: 18.0,
    termMonths: 12,
    grantDate: '2026-01-15',
    dueDate: '2027-01-15',
    monthlyFee: 458.4,
    totalInterest: 500.8,
    totalToPay: 5500.8,
    remainingBalance: 4584.0,
    status: 'activo',
    notes: 'Crédito para modernización de equipo informático',
    createdAt: '2026-01-15',
    updatedAt: '2026-03-15',
  },
  // 2. Crédito VENCIDO para Ana Gómez
  {
    id: 'CRE-2026-002',
    clientId: 'CLI-002',
    clientName: 'Ana Gómez Valdivia',
    clientDocument: '019384722',
    amount: 3000,
    annualInterestRate: 20.0,
    termMonths: 6,
    grantDate: '2025-07-10',
    dueDate: '2026-01-10',
    monthlyFee: 529.73,
    totalInterest: 178.38,
    totalToPay: 3178.38,
    remainingBalance: 1058.92,
    status: 'vencido',
    notes: 'Crédito personal para capital de trabajo',
    createdAt: '2025-07-10',
    updatedAt: '2026-01-10',
  },
  // 3. Crédito PAGADO para Roberto Silva
  {
    id: 'CRE-2026-003',
    clientId: 'CLI-003',
    clientName: 'Roberto Silva Paredes',
    clientDocument: '031849203',
    amount: 4000,
    annualInterestRate: 15.0,
    termMonths: 4,
    grantDate: '2025-08-01',
    dueDate: '2025-12-01',
    monthlyFee: 1031.54,
    totalInterest: 126.16,
    totalToPay: 4126.16,
    remainingBalance: 0,
    status: 'pagado',
    notes: 'Crédito para adquisición de inventario cancelado en su totalidad',
    createdAt: '2025-08-01',
    updatedAt: '2025-11-28',
  },
];

const INITIAL_PAYMENTS: Payment[] = [
  // Pagos del crédito 1 (Carlos Mendoza)
  {
    id: 'PAG-2026-001',
    receiptNumber: 'REC-00101',
    creditId: 'CRE-2026-001',
    clientId: 'CLI-001',
    clientName: 'Carlos Mendoza Rivas',
    clientDocument: '024829101',
    paymentDate: '2026-02-15',
    amount: 458.4,
    previousBalance: 5500.8,
    newBalance: 5042.4,
    paymentMethod: 'transferencia',
    reference: 'TRF-982103',
    notes: 'Pago puntual cuota 1',
    createdAt: '2026-02-15 10:30:00',
  },
  {
    id: 'PAG-2026-002',
    receiptNumber: 'REC-00102',
    creditId: 'CRE-2026-001',
    clientId: 'CLI-001',
    clientName: 'Carlos Mendoza Rivas',
    clientDocument: '024829101',
    paymentDate: '2026-03-15',
    amount: 458.4,
    previousBalance: 5042.4,
    newBalance: 4584.0,
    paymentMethod: 'transferencia',
    reference: 'TRF-984421',
    notes: 'Pago puntual cuota 2',
    createdAt: '2026-03-15 11:15:00',
  },
  // Pagos parciales del crédito 2 (Ana Gómez)
  {
    id: 'PAG-2026-003',
    receiptNumber: 'REC-00103',
    creditId: 'CRE-2026-002',
    clientId: 'CLI-002',
    clientName: 'Ana Gómez Valdivia',
    clientDocument: '019384722',
    paymentDate: '2025-08-10',
    amount: 1059.46,
    previousBalance: 3178.38,
    newBalance: 2118.92,
    paymentMethod: 'deposito',
    reference: 'DEP-84721',
    notes: 'Abono cuotas 1 y 2',
    createdAt: '2025-08-10 16:45:00',
  },
  {
    id: 'PAG-2026-004',
    receiptNumber: 'REC-00104',
    creditId: 'CRE-2026-002',
    clientId: 'CLI-002',
    clientName: 'Ana Gómez Valdivia',
    clientDocument: '019384722',
    paymentDate: '2025-10-12',
    amount: 1060.0,
    previousBalance: 2118.92,
    newBalance: 1058.92,
    paymentMethod: 'efectivo',
    reference: 'EFE-00912',
    notes: 'Abono cuotas 3 y 4',
    createdAt: '2025-10-12 09:20:00',
  },
  // Pagos del crédito 3 (Roberto Silva)
  {
    id: 'PAG-2026-005',
    receiptNumber: 'REC-00105',
    creditId: 'CRE-2026-003',
    clientId: 'CLI-003',
    clientName: 'Roberto Silva Paredes',
    clientDocument: '031849203',
    paymentDate: '2025-09-01',
    amount: 2063.08,
    previousBalance: 4126.16,
    newBalance: 2063.08,
    paymentMethod: 'transferencia',
    reference: 'TRF-33819',
    notes: 'Abono extraordinario 50%',
    createdAt: '2025-09-01 14:10:00',
  },
  {
    id: 'PAG-2026-006',
    receiptNumber: 'REC-00106',
    creditId: 'CRE-2026-003',
    clientId: 'CLI-003',
    clientName: 'Roberto Silva Paredes',
    clientDocument: '031849203',
    paymentDate: '2025-11-28',
    amount: 2063.08,
    previousBalance: 2063.08,
    newBalance: 0,
    paymentMethod: 'transferencia',
    reference: 'TRF-34190',
    notes: 'Cancelación definitiva del crédito',
    createdAt: '2025-11-28 17:30:00',
  },
];

class StorageService {
  constructor() {
    this.init();
  }

  private init() {
    if (typeof window === 'undefined') return;
    const isSeeded = localStorage.getItem(STORAGE_KEYS.SEEDED);
    if (!isSeeded) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
      localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(INITIAL_CLIENTS));
      localStorage.setItem(STORAGE_KEYS.CREDITS, JSON.stringify(INITIAL_CREDITS));
      localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(INITIAL_PAYMENTS));
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(INITIAL_USERS[0]));
      localStorage.setItem(STORAGE_KEYS.SEEDED, 'true');
    }
    this.auditOverdueCredits();
  }

  public resetToDefault() {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
    localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(INITIAL_CLIENTS));
    localStorage.setItem(STORAGE_KEYS.CREDITS, JSON.stringify(INITIAL_CREDITS));
    localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(INITIAL_PAYMENTS));
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(INITIAL_USERS[0]));
    localStorage.setItem(STORAGE_KEYS.SEEDED, 'true');
    this.auditOverdueCredits();
  }

  // --- OVERDUE AUDIT ---
  public auditOverdueCredits(): void {
    const credits = this.getCredits();
    let changed = false;

    const updated = credits.map((c) => {
      if (c.status === 'activo' && c.remainingBalance > 0 && isOverdue(c.dueDate)) {
        changed = true;
        return { ...c, status: 'vencido' as const, updatedAt: new Date().toISOString().split('T')[0] };
      }
      return c;
    });

    if (changed) {
      localStorage.setItem(STORAGE_KEYS.CREDITS, JSON.stringify(updated));
    }
  }

  // --- USERS & AUTH ---
  public getUsers(): User[] {
    const data = localStorage.getItem(STORAGE_KEYS.USERS);
    return data ? JSON.parse(data) : [];
  }

  public getCurrentUser(): User | null {
    const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return data ? JSON.parse(data) : null;
  }

  public setCurrentUser(user: User | null): void {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
  }

  public authenticate(
    email: string,
    password: string,
    targetRole?: 'admin' | 'cliente'
  ): { user?: User; error?: string } {
    const users = this.getUsers();
    let cleanEmail = email.trim().toLowerCase();
    if (cleanEmail === 'floresdiazfernandojavier423@gmail.com') {
      cleanEmail = 'fernando@gmail.com';
    }
    const user = users.find((u) => u.email.trim().toLowerCase() === cleanEmail);

    if (!user) {
      return { error: 'Credenciales incorrectas' };
    }

    if (!user.active) {
      return { error: 'Su cuenta está desactivada. Comuníquese con la administración.' };
    }

    // Regla estricta: un cliente nunca puede ingresar como administrador
    if (targetRole === 'admin' && user.role !== 'admin') {
      return { error: 'Acceso denegado: Esta cuenta no posee privilegios de administrador.' };
    }

    if (targetRole === 'cliente' && user.role !== 'cliente') {
      return { error: 'Esta cuenta es de administrador. Seleccione la pestaña de Administrador.' };
    }

    // Admins (Fernando y Rosmery): contraseña obligatoria credimaster123
    let valid = false;
    if (user.role === 'admin') {
      // Bloqueo estricto: solo Fernando y Rosmery
      if (user.email !== 'fernando@gmail.com' && user.email !== 'rosmery@gmail.com') {
        return { error: 'Credenciales incorrectas' };
      }
      valid = (password === 'credimaster123');
    } else {
      // Cliente: validamos contra la contraseña que el cliente eligió y guardó
      if (user.password) {
        valid = (password === user.password);
      } else {
        valid = (password === 'cliente123' || password === '123456');
      }
    }

    if (!valid) {
      return { error: 'Credenciales incorrectas' };
    }

    // Si es cliente, verificar que su registro de cliente esté activo
    if (user.role === 'cliente' && user.clientId) {
      const client = this.getClientById(user.clientId);
      if (client && !client.active) {
        return { error: 'Su cuenta de cliente está desactivada. Comuníquese con la administración.' };
      }
    }

    this.setCurrentUser(user);
    return { user };
  }

  // --- CLIENTS ---
  public getClients(): Client[] {
    const data = localStorage.getItem(STORAGE_KEYS.CLIENTS);
    return data ? JSON.parse(data) : [];
  }

  public getClientById(id: string): Client | undefined {
    return this.getClients().find((c) => c.id === id);
  }

  public getClientByDocument(doc: string, excludeId?: string): Client | undefined {
    return this.getClients().find(
      (c) => c.documentNumber.trim() === doc.trim() && c.id !== excludeId
    );
  }

  public getClientByEmail(email: string, excludeId?: string): Client | undefined {
    return this.getClients().find(
      (c) => c.email.trim().toLowerCase() === email.trim().toLowerCase() && c.id !== excludeId
    );
  }

  public getClientPassword(clientIdOrEmail: string): string {
    const users = this.getUsers();
    const clean = clientIdOrEmail.trim().toLowerCase();
    const user = users.find(
      (u) => u.clientId === clientIdOrEmail || u.email.trim().toLowerCase() === clean
    );
    return user?.password || '';
  }

  public updateClientPassword(
    emailOrClientId: string,
    newPassword: string
  ): { success: boolean; error?: string } {
    if (!newPassword || newPassword.trim().length < 4) {
      return { success: false, error: 'La contraseña debe tener al menos 4 caracteres.' };
    }

    const users = this.getUsers();
    const clean = emailOrClientId.trim().toLowerCase();
    const userIndex = users.findIndex(
      (u) =>
        u.role === 'cliente' &&
        (u.clientId === emailOrClientId || u.email.trim().toLowerCase() === clean)
    );

    if (userIndex === -1) {
      return { success: false, error: 'No se encontró un usuario cliente con este correo o identificador.' };
    }

    users[userIndex].password = newPassword.trim();
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

    // Si el usuario actual es este cliente, sincronizar su sesión
    const currentUser = this.getCurrentUser();
    if (currentUser && currentUser.id === users[userIndex].id) {
      currentUser.password = newPassword.trim();
      this.setCurrentUser(currentUser);
    }

    return { success: true };
  }

  public saveClient(
    clientData: Omit<Client, 'id' | 'createdAt' | 'updatedAt'> & { initialPassword?: string },
    id?: string
  ): { success: boolean; client?: Client; error?: string } {
    const clients = this.getClients();

    // 1. Validar DUI: debe tener exactamente 9 dígitos numéricos
    const duiCheck = validateDUI(clientData.documentNumber);
    if (!duiCheck.valid) {
      return { success: false, error: duiCheck.error };
    }

    // 2. Validar correo: debe pertenecer estrictamente a @gmail.com
    const gmailCheck = validateGmail(clientData.email);
    if (!gmailCheck.valid) {
      return { success: false, error: gmailCheck.error };
    }

    // 3. Validar nombres y apellidos
    const firstNameCheck = validateName(clientData.firstName, 'nombres');
    if (!firstNameCheck.valid) {
      return { success: false, error: firstNameCheck.error };
    }
    const lastNameCheck = validateName(clientData.lastName, 'apellidos');
    if (!lastNameCheck.valid) {
      return { success: false, error: lastNameCheck.error };
    }

    // 4. Validar fecha de nacimiento y mayoría de edad (>= 18)
    const birthCheck = validateBirthDate(clientData.birthDate);
    if (!birthCheck.valid) {
      return { success: false, error: birthCheck.error };
    }

    // 5. Validar teléfono
    const phoneCheck = validatePhone(clientData.phone);
    if (!phoneCheck.valid) {
      return { success: false, error: phoneCheck.error };
    }

    // 6. Validar montos positivos
    const incomeCheck = validateAmount(clientData.monthlyIncome, 'Los ingresos mensuales');
    if (!incomeCheck.valid) {
      return { success: false, error: incomeCheck.error };
    }
    const limitCheck = validateAmount(clientData.creditLimit, 'El límite de crédito');
    if (!limitCheck.valid) {
      return { success: false, error: limitCheck.error };
    }

    // 7. Validar dirección y ocupación obligatorias
    if (!clientData.address || !clientData.address.trim()) {
      return { success: false, error: 'La dirección residencial es obligatoria.' };
    }
    if (!clientData.occupation || !clientData.occupation.trim()) {
      return { success: false, error: 'La ocupación o actividad económica es obligatoria.' };
    }

    // 8. Unicidad de DUI
    if (this.getClientByDocument(clientData.documentNumber, id)) {
      return { success: false, error: 'Ya existe un cliente registrado con este número de DUI.' };
    }

    // 9. Unicidad de Correo
    if (this.getClientByEmail(clientData.email, id)) {
      return { success: false, error: 'Ya existe un cliente registrado con este correo de Gmail.' };
    }

    const todayStr = new Date().toISOString().split('T')[0];

    if (id) {
      // Update
      const index = clients.findIndex((c) => c.id === id);
      if (index === -1) return { success: false, error: 'Cliente no encontrado.' };

      const updated: Client = {
        ...clients[index],
        ...clientData,
        documentNumber: clientData.documentNumber.trim(),
        email: clientData.email.trim().toLowerCase(),
        updatedAt: todayStr,
      };
      clients[index] = updated;
      localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients));

      // Update linked user
      const users = this.getUsers();
      const userIndex = users.findIndex((u) => u.clientId === id);
      if (userIndex !== -1) {
        users[userIndex].name = `${updated.firstName} ${updated.lastName}`;
        users[userIndex].email = updated.email;
        if (clientData.initialPassword && clientData.initialPassword.trim()) {
          users[userIndex].password = clientData.initialPassword.trim();
        }
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      }

      return { success: true, client: updated };
    } else {
      // Create new
      const newId = `CLI-${String(clients.length + 1).padStart(3, '0')}`;
      const newClient: Client = {
        ...clientData,
        documentNumber: clientData.documentNumber.trim(),
        email: clientData.email.trim().toLowerCase(),
        id: newId,
        createdAt: todayStr,
        updatedAt: todayStr,
      };
      clients.push(newClient);
      localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients));

      // Create linked user account with chosen password
      const users = this.getUsers();
      const chosenPassword = clientData.initialPassword && clientData.initialPassword.trim()
        ? clientData.initialPassword.trim()
        : 'cliente123';

      const newUser: User = {
        id: `USR-${String(users.length + 1).padStart(3, '0')}`,
        name: `${newClient.firstName} ${newClient.lastName}`,
        email: newClient.email,
        role: 'cliente',
        clientId: newId,
        password: chosenPassword,
        active: newClient.active,
        createdAt: todayStr,
      };
      users.push(newUser);
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

      return { success: true, client: newClient };
    }
  }

  public toggleClientStatus(clientId: string): { success: boolean; error?: string } {
    const clients = this.getClients();
    const client = clients.find((c) => c.id === clientId);
    if (!client) return { success: false, error: 'Cliente no encontrado.' };

    if (client.active) {
      // Check: "No se puede desactivar un cliente con créditos activos con saldo pendiente"
      const clientCredits = this.getCreditsByClient(clientId);
      const hasOutstandingDebt = clientCredits.some(
        (cr) => (cr.status === 'activo' || cr.status === 'vencido') && cr.remainingBalance > 0
      );

      if (hasOutstandingDebt) {
        return {
          success: false,
          error: 'No se puede desactivar un cliente con créditos activos o vencidos que tengan saldo pendiente.',
        };
      }
    }

    client.active = !client.active;
    client.updatedAt = new Date().toISOString().split('T')[0];
    localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients));

    // Also toggle linked user
    const users = this.getUsers();
    const user = users.find((u) => u.clientId === clientId);
    if (user) {
      user.active = client.active;
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    }

    return { success: true };
  }

  // --- CREDITS ---
  public getCredits(): Credit[] {
    const data = localStorage.getItem(STORAGE_KEYS.CREDITS);
    return data ? JSON.parse(data) : [];
  }

  public getCreditById(id: string): Credit | undefined {
    return this.getCredits().find((c) => c.id === id);
  }

  public getCreditsByClient(clientId: string): Credit[] {
    return this.getCredits().filter((c) => c.clientId === clientId);
  }

  public getClientOutstandingDebt(clientId: string): number {
    const credits = this.getCreditsByClient(clientId);
    return credits
      .filter((c) => c.status === 'activo' || c.status === 'vencido')
      .reduce((sum, c) => sum + c.remainingBalance, 0);
  }

  public getClientAvailableCreditLimit(clientId: string): number {
    const client = this.getClientById(clientId);
    if (!client) return 0;
    const currentDebt = this.getClientOutstandingDebt(clientId);
    return Math.max(0, client.creditLimit - currentDebt);
  }

  public saveCredit(
    creditData: Omit<Credit, 'id' | 'createdAt' | 'updatedAt' | 'remainingBalance' | 'status'>,
    id?: string
  ): { success: boolean; credit?: Credit; error?: string } {
    const credits = this.getCredits();
    const client = this.getClientById(creditData.clientId);

    if (!client) {
      return { success: false, error: 'El cliente seleccionado no existe.' };
    }

    if (!client.active) {
      return { success: false, error: 'No se puede registrar un crédito para un cliente inactivo.' };
    }

    if (creditData.amount <= 0) {
      return { success: false, error: 'El monto del crédito debe ser mayor a cero.' };
    }

    if (creditData.termMonths <= 0) {
      return { success: false, error: 'El plazo en meses debe ser al menos de 1 mes.' };
    }

    if (creditData.annualInterestRate < 0) {
      return { success: false, error: 'La tasa de interés no puede ser negativa.' };
    }

    const todayStr = new Date().toISOString().split('T')[0];

    if (id) {
      // Edit credit: Rule: "Editar un crédito solo si no tiene pagos registrados"
      const existing = credits.find((c) => c.id === id);
      if (!existing) return { success: false, error: 'Crédito no encontrado.' };

      const payments = this.getPaymentsByCredit(id);
      if (payments.length > 0) {
        return { success: false, error: 'No se puede editar un crédito que ya tiene pagos registrados.' };
      }

      const currentDebt = this.getClientOutstandingDebt(creditData.clientId) - existing.amount;
      if (currentDebt + creditData.amount > client.creditLimit) {
        const available = Math.max(0, client.creditLimit - currentDebt);
        return {
          success: false,
          error: `El monto solicitado supera el límite de crédito disponible del cliente ($ ${available.toFixed(2)}).`,
        };
      }

      const index = credits.findIndex((c) => c.id === id);
      const updated: Credit = {
        ...existing,
        ...creditData,
        clientName: `${client.firstName} ${client.lastName}`,
        clientDocument: client.documentNumber,
        remainingBalance: creditData.totalToPay,
        status: isOverdue(creditData.dueDate) ? 'vencido' : 'activo',
        updatedAt: todayStr,
      };

      credits[index] = updated;
      localStorage.setItem(STORAGE_KEYS.CREDITS, JSON.stringify(credits));
      return { success: true, credit: updated };
    } else {
      // New credit
      const currentDebt = this.getClientOutstandingDebt(creditData.clientId);
      if (currentDebt + creditData.amount > client.creditLimit) {
        const available = Math.max(0, client.creditLimit - currentDebt);
        return {
          success: false,
          error: `El crédito supera el límite de crédito disponible ($ ${available.toFixed(2)}). Límite total: $ ${client.creditLimit.toFixed(2)}.`,
        };
      }

      const newId = `CRE-${new Date().getFullYear()}-${String(credits.length + 1).padStart(3, '0')}`;
      const status: CreditStatus = isOverdue(creditData.dueDate) ? 'vencido' : 'activo';

      const newCredit: Credit = {
        ...creditData,
        id: newId,
        clientName: `${client.firstName} ${client.lastName}`,
        clientDocument: client.documentNumber,
        remainingBalance: creditData.totalToPay,
        status,
        createdAt: todayStr,
        updatedAt: todayStr,
      };

      credits.push(newCredit);
      localStorage.setItem(STORAGE_KEYS.CREDITS, JSON.stringify(credits));
      return { success: true, credit: newCredit };
    }
  }

  public cancelCredit(creditId: string): { success: boolean; error?: string } {
    const credits = this.getCredits();
    const credit = credits.find((c) => c.id === creditId);
    if (!credit) return { success: false, error: 'Crédito no encontrado.' };

    const payments = this.getPaymentsByCredit(creditId);
    if (payments.length > 0) {
      return {
        success: false,
        error: 'Un crédito con pagos registrados no puede cancelarse ni eliminarse.',
      };
    }

    credit.status = 'cancelado';
    credit.remainingBalance = 0;
    credit.updatedAt = new Date().toISOString().split('T')[0];
    localStorage.setItem(STORAGE_KEYS.CREDITS, JSON.stringify(credits));
    return { success: true };
  }

  // --- PAYMENTS ---
  public getPayments(): Payment[] {
    const data = localStorage.getItem(STORAGE_KEYS.PAYMENTS);
    const payments: Payment[] = data ? JSON.parse(data) : [];
    return payments.sort((a, b) => new Date(a.paymentDate).getTime() - new Date(b.paymentDate).getTime());
  }

  public getPaymentsByCredit(creditId: string): Payment[] {
    return this.getPayments().filter((p) => p.creditId === creditId);
  }

  public getPaymentsByClient(clientId: string): Payment[] {
    return this.getPayments().filter((p) => p.clientId === clientId);
  }

  public getPaymentById(id: string): Payment | undefined {
    return this.getPayments().find((p) => p.id === id);
  }

  public registerPayment(
    paymentData: {
      creditId: string;
      paymentDate: string;
      amount: number;
      paymentMethod: 'efectivo' | 'transferencia' | 'tarjeta' | 'deposito';
      reference: string;
      notes?: string;
    },
    clientRestrictedId?: string
  ): { success: boolean; payment?: Payment; error?: string } {
    const credit = this.getCreditById(paymentData.creditId);
    if (!credit) return { success: false, error: 'Crédito no encontrado.' };

    if (clientRestrictedId && credit.clientId !== clientRestrictedId) {
      return { success: false, error: 'Acceso denegado: solo puede registrar pagos sobre sus propios créditos.' };
    }

    if (credit.status === 'pagado') {
      return { success: false, error: 'El crédito ya se encuentra totalmente pagado.' };
    }

    if (credit.status === 'cancelado') {
      return { success: false, error: 'No se pueden registrar abonos sobre un crédito cancelado.' };
    }

    if (paymentData.amount <= 0) {
      return { success: false, error: 'El monto del abono debe ser mayor a cero.' };
    }

    if (paymentData.amount > credit.remainingBalance) {
      return {
        success: false,
        error: `El monto ingresado ($ ${paymentData.amount.toFixed(2)}) supera el saldo pendiente ($ ${credit.remainingBalance.toFixed(2)}).`,
      };
    }

    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const paymentDateObj = new Date(paymentData.paymentDate + 'T12:00:00');
    if (paymentDateObj > today) {
      return { success: false, error: 'La fecha de pago no puede ser una fecha futura.' };
    }

    if (!paymentData.reference || !paymentData.reference.trim()) {
      return { success: false, error: 'La referencia u operación de pago es obligatoria.' };
    }

    const previousBalance = credit.remainingBalance;
    const newBalance = Math.max(0, Math.round((previousBalance - paymentData.amount) * 100) / 100);

    const payments = this.getPayments();
    const newPaymentId = `PAG-${new Date().getFullYear()}-${String(payments.length + 1).padStart(3, '0')}`;
    const receiptNum = `REC-${String(100 + payments.length + 1).padStart(5, '0')}`;

    const newPayment: Payment = {
      id: newPaymentId,
      receiptNumber: receiptNum,
      creditId: credit.id,
      clientId: credit.clientId,
      clientName: credit.clientName,
      clientDocument: credit.clientDocument,
      paymentDate: paymentData.paymentDate,
      amount: paymentData.amount,
      previousBalance,
      newBalance,
      paymentMethod: paymentData.paymentMethod,
      reference: paymentData.reference.trim(),
      notes: paymentData.notes,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };

    payments.push(newPayment);
    localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(payments));

    // Update credit
    const credits = this.getCredits();
    const creditIdx = credits.findIndex((c) => c.id === credit.id);
    if (creditIdx !== -1) {
      credits[creditIdx].remainingBalance = newBalance;
      if (newBalance === 0) {
        credits[creditIdx].status = 'pagado';
      }
      credits[creditIdx].updatedAt = new Date().toISOString().split('T')[0];
      localStorage.setItem(STORAGE_KEYS.CREDITS, JSON.stringify(credits));
    }

    return { success: true, payment: newPayment };
  }

  public updatePayment(
    paymentId: string,
    updatedData: {
      paymentDate: string;
      amount: number;
      paymentMethod: 'efectivo' | 'transferencia' | 'tarjeta' | 'deposito';
      reference: string;
      notes?: string;
    }
  ): { success: boolean; error?: string } {
    const payments = this.getPayments();
    const payment = payments.find((p) => p.id === paymentId);
    if (!payment) return { success: false, error: 'Pago no encontrado.' };

    const credit = this.getCreditById(payment.creditId);
    if (!credit) return { success: false, error: 'Crédito asociado no encontrado.' };

    if (updatedData.amount <= 0) {
      return { success: false, error: 'El monto debe ser mayor a cero.' };
    }

    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const dateObj = new Date(updatedData.paymentDate + 'T12:00:00');
    if (dateObj > today) {
      return { success: false, error: 'La fecha de pago no puede ser futura.' };
    }

    const otherPayments = payments.filter((p) => p.creditId === credit.id && p.id !== paymentId);
    const sumOthers = otherPayments.reduce((s, p) => s + p.amount, 0);
    const maxAllowed = credit.totalToPay - sumOthers;

    if (updatedData.amount > maxAllowed) {
      return {
        success: false,
        error: `El monto no puede exceder el total a pagar del crédito ($ ${maxAllowed.toFixed(2)} máximo).`,
      };
    }

    payment.paymentDate = updatedData.paymentDate;
    payment.amount = updatedData.amount;
    payment.paymentMethod = updatedData.paymentMethod;
    payment.reference = updatedData.reference;
    payment.notes = updatedData.notes;

    localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(payments));
    this.recalculateCreditLedger(credit.id);

    return { success: true };
  }

  public deletePayment(paymentId: string): { success: boolean; error?: string } {
    const payments = this.getPayments();
    const paymentIndex = payments.findIndex((p) => p.id === paymentId);
    if (paymentIndex === -1) return { success: false, error: 'Pago no encontrado.' };

    const creditId = payments[paymentIndex].creditId;
    payments.splice(paymentIndex, 1);
    localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(payments));

    this.recalculateCreditLedger(creditId);

    return { success: true };
  }

  private recalculateCreditLedger(creditId: string) {
    const credit = this.getCreditById(creditId);
    if (!credit) return;

    const payments = this.getPaymentsByCredit(creditId);
    let runningBalance = credit.totalToPay;

    payments.forEach((p) => {
      p.previousBalance = runningBalance;
      runningBalance = Math.max(0, Math.round((runningBalance - p.amount) * 100) / 100);
      p.newBalance = runningBalance;
    });

    const allPayments = this.getPayments().map((p) => {
      const match = payments.find((item) => item.id === p.id);
      return match || p;
    });
    localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(allPayments));

    const credits = this.getCredits();
    const idx = credits.findIndex((c) => c.id === creditId);
    if (idx !== -1) {
      credits[idx].remainingBalance = runningBalance;
      if (runningBalance === 0) {
        credits[idx].status = 'pagado';
      } else if (isOverdue(credits[idx].dueDate)) {
        credits[idx].status = 'vencido';
      } else {
        credits[idx].status = 'activo';
      }
      credits[idx].updatedAt = new Date().toISOString().split('T')[0];
      localStorage.setItem(STORAGE_KEYS.CREDITS, JSON.stringify(credits));
    }
  }

  // --- METRICS ---
  public getAdminDashboardMetrics() {
    this.auditOverdueCredits();
    const clients = this.getClients();
    const credits = this.getCredits();
    const payments = this.getPayments();

    const totalClients = clients.length;
    const activeClients = clients.filter((c) => c.active).length;
    const activeCredits = credits.filter((c) => c.status === 'activo').length;
    const overdueCredits = credits.filter((c) => c.status === 'vencido').length;
    const paidCredits = credits.filter((c) => c.status === 'pagado').length;

    const totalOutstandingPortfolio = credits
      .filter((c) => c.status === 'activo' || c.status === 'vencido')
      .reduce((sum, c) => sum + c.remainingBalance, 0);

    const totalCollected = payments.reduce((sum, p) => sum + p.amount, 0);
    const recentPayments = [...payments].reverse().slice(0, 5);

    return {
      totalClients,
      activeClients,
      activeCredits,
      overdueCredits,
      paidCredits,
      totalOutstandingPortfolio,
      totalCollected,
      recentPayments,
    };
  }

  public getClientDashboardMetrics(clientId: string) {
    this.auditOverdueCredits();
    const client = this.getClientById(clientId);
    const credits = this.getCreditsByClient(clientId);
    const payments = this.getPaymentsByClient(clientId);

    const activeCredits = credits.filter((c) => c.status === 'activo');
    const overdueCredits = credits.filter((c) => c.status === 'vencido');
    const paidCredits = credits.filter((c) => c.status === 'pagado');

    const totalOutstandingDebt = credits
      .filter((c) => c.status === 'activo' || c.status === 'vencido')
      .reduce((sum, c) => sum + c.remainingBalance, 0);

    const creditLimit = client ? client.creditLimit : 0;
    const availableCredit = Math.max(0, creditLimit - totalOutstandingDebt);
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    const recentPayments = [...payments].reverse().slice(0, 5);

    return {
      client,
      activeCredits,
      overdueCredits,
      paidCredits,
      totalOutstandingDebt,
      creditLimit,
      availableCredit,
      totalPaid,
      recentPayments,
    };
  }
}

export const storageService = new StorageService();
