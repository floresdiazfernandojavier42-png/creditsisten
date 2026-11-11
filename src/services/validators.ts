import { calculateAge, isFutureDate } from './creditCalculator';

/**
 * Validates Documento Único de Identidad (DUI)
 * Strictly requires exactly 9 numeric digits (e.g. 012345678)
 */
export function validateDUI(dui: string): { valid: boolean; error?: string } {
  if (!dui || !dui.trim()) {
    return { valid: false, error: 'El DUI es obligatorio.' };
  }
  const clean = dui.trim();
  if (!/^\d{9}$/.test(clean)) {
    return {
      valid: false,
      error: 'El DUI debe contener exactamente 9 dígitos numéricos (ej. 012345678).',
    };
  }
  return { valid: true };
}

/**
 * Validates that an email strictly ends with @gmail.com
 */
export function validateGmail(email: string): { valid: boolean; error?: string } {
  if (!email || !email.trim()) {
    return { valid: false, error: 'El correo electrónico es obligatorio.' };
  }
  const clean = email.trim().toLowerCase();
  // Standard user part + exactly @gmail.com
  const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
  if (!gmailRegex.test(clean)) {
    return {
      valid: false,
      error: 'El correo electrónico debe ser una cuenta válida de @gmail.com (ej. usuario@gmail.com).',
    };
  }
  return { valid: true };
}

/**
 * Validates text names (nombres y apellidos)
 */
export function validateName(name: string, label = 'nombre'): { valid: boolean; error?: string } {
  if (!name || !name.trim()) {
    return { valid: false, error: `El campo ${label} es obligatorio.` };
  }
  const clean = name.trim();
  if (clean.length < 2) {
    return { valid: false, error: `El ${label} debe tener al menos 2 caracteres.` };
  }
  // Allow letters, accented characters, spaces, hyphens
  if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/.test(clean)) {
    return { valid: false, error: `El ${label} solo debe contener letras.` };
  }
  return { valid: true };
}

/**
 * Validates client birthdate and enforces legal majority (age >= 18)
 */
export function validateBirthDate(birthDate: string): { valid: boolean; error?: string } {
  if (!birthDate) {
    return { valid: false, error: 'La fecha de nacimiento es obligatoria.' };
  }
  if (isFutureDate(birthDate)) {
    return { valid: false, error: 'La fecha de nacimiento no puede ser una fecha futura.' };
  }
  const age = calculateAge(birthDate);
  if (age < 18) {
    return {
      valid: false,
      error: `El cliente debe ser mayor de 18 años (edad calculada: ${age} años).`,
    };
  }
  if (age > 110) {
    return { valid: false, error: 'La fecha de nacimiento ingresada no es válida.' };
  }
  return { valid: true };
}

/**
 * Validates phone number
 */
export function validatePhone(phone: string): { valid: boolean; error?: string } {
  if (!phone || !phone.trim()) {
    return { valid: false, error: 'El teléfono de contacto es obligatorio.' };
  }
  const digitsOnly = phone.replace(/\D/g, '');
  if (digitsOnly.length < 8) {
    return { valid: false, error: 'El número de teléfono debe tener al menos 8 dígitos.' };
  }
  return { valid: true };
}

/**
 * Validates positive monetary amounts
 */
export function validateAmount(amount: number, label = 'El monto'): { valid: boolean; error?: string } {
  if (isNaN(amount) || amount <= 0) {
    return { valid: false, error: `${label} debe ser un valor numérico mayor a cero.` };
  }
  return { valid: true };
}
