import React, { useState, useEffect } from 'react';
import { Client } from '../../types';
import { storageService } from '../../services/storageService';
import { calculateAge } from '../../services/creditCalculator';
import {
  validateDUI,
  validateGmail,
  validateName,
  validateBirthDate,
  validatePhone,
  validateAmount,
} from '../../services/validators';
import { X, UserPlus, AlertCircle, CheckCircle, ShieldCheck, Lock, Eye, EyeOff, Key } from 'lucide-react';

interface ClientModalProps {
  isOpen: boolean;
  clientToEdit?: Client | null;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export const ClientModal: React.FC<ClientModalProps> = ({
  isOpen,
  clientToEdit,
  onClose,
  onSuccess,
}) => {
  const isEditing = !!clientToEdit;

  const [formData, setFormData] = useState({
    documentNumber: '',
    firstName: '',
    lastName: '',
    birthDate: '',
    phone: '',
    address: '',
    email: '',
    occupation: '',
    monthlyIncome: '',
    creditLimit: '',
    password: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (clientToEdit) {
      const savedPass = storageService.getClientPassword(clientToEdit.id);
      setFormData({
        documentNumber: clientToEdit.documentNumber,
        firstName: clientToEdit.firstName,
        lastName: clientToEdit.lastName,
        birthDate: clientToEdit.birthDate,
        phone: clientToEdit.phone,
        address: clientToEdit.address,
        email: clientToEdit.email,
        occupation: clientToEdit.occupation,
        monthlyIncome: clientToEdit.monthlyIncome.toString(),
        creditLimit: clientToEdit.creditLimit.toString(),
        password: savedPass || '',
      });
    } else {
      setFormData({
        documentNumber: '',
        firstName: '',
        lastName: '',
        birthDate: '1995-05-15',
        phone: '',
        address: '',
        email: '',
        occupation: '',
        monthlyIncome: '3000',
        creditLimit: '10000',
        password: '',
      });
    }
    setErrorMessage('');
  }, [clientToEdit, isOpen]);

  if (!isOpen) return null;

  // Real-time checks
  const duiError = formData.documentNumber && formData.documentNumber.length !== 9
    ? 'El DUI debe contener exactamente 9 dígitos.'
    : null;

  const emailLower = formData.email.trim().toLowerCase();
  const gmailError = formData.email && !emailLower.endsWith('@gmail.com')
    ? 'El correo debe terminar en @gmail.com'
    : null;

  const calculatedAge = formData.birthDate ? calculateAge(formData.birthDate) : 0;

  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numeric digits up to 9
    const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 9);
    setFormData((prev) => ({ ...prev, documentNumber: digitsOnly }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    // 1. Validar DUI (9 dígitos)
    const duiCheck = validateDUI(formData.documentNumber);
    if (!duiCheck.valid) {
      setErrorMessage(duiCheck.error || 'DUI inválido.');
      return;
    }

    // 2. Validar correo estrictamente @gmail.com
    const gmailCheck = validateGmail(formData.email);
    if (!gmailCheck.valid) {
      setErrorMessage(gmailCheck.error || 'El correo debe ser de @gmail.com.');
      return;
    }

    // 3. Validar nombres y apellidos
    const firstNameCheck = validateName(formData.firstName, 'nombres');
    if (!firstNameCheck.valid) {
      setErrorMessage(firstNameCheck.error || 'Nombres inválidos.');
      return;
    }
    const lastNameCheck = validateName(formData.lastName, 'apellidos');
    if (!lastNameCheck.valid) {
      setErrorMessage(lastNameCheck.error || 'Apellidos inválidos.');
      return;
    }

    // 4. Validar fecha de nacimiento (edad >= 18)
    const birthCheck = validateBirthDate(formData.birthDate);
    if (!birthCheck.valid) {
      setErrorMessage(birthCheck.error || 'Fecha de nacimiento inválida.');
      return;
    }

    // 5. Validar teléfono
    const phoneCheck = validatePhone(formData.phone);
    if (!phoneCheck.valid) {
      setErrorMessage(phoneCheck.error || 'Teléfono inválido.');
      return;
    }

    // 6. Validar montos positivos
    const income = parseFloat(formData.monthlyIncome);
    const limit = parseFloat(formData.creditLimit);

    const incomeCheck = validateAmount(income, 'Los ingresos mensuales');
    if (!incomeCheck.valid) {
      setErrorMessage(incomeCheck.error || 'Ingresos mensuales inválidos.');
      return;
    }

    const limitCheck = validateAmount(limit, 'El límite de crédito');
    if (!limitCheck.valid) {
      setErrorMessage(limitCheck.error || 'Límite de crédito inválido.');
      return;
    }

    // 7. Validar dirección y ocupación
    if (!formData.address.trim()) {
      setErrorMessage('La dirección residencial es obligatoria.');
      return;
    }
    if (!formData.occupation.trim()) {
      setErrorMessage('La ocupación o actividad económica es obligatoria.');
      return;
    }

    if (formData.password.trim() && formData.password.trim().length < 4) {
      setErrorMessage('La contraseña elegida debe tener al menos 4 caracteres.');
      return;
    }

    const clientPayload = {
      documentNumber: formData.documentNumber.trim(),
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      birthDate: formData.birthDate,
      phone: formData.phone.trim(),
      address: formData.address.trim(),
      email: formData.email.trim().toLowerCase(),
      occupation: formData.occupation.trim(),
      monthlyIncome: income,
      creditLimit: limit,
      active: clientToEdit ? clientToEdit.active : true,
      initialPassword: formData.password.trim() || undefined,
    };

    const res = storageService.saveClient(clientPayload, clientToEdit?.id);

    if (res.success) {
      onSuccess(
        isEditing
          ? 'Datos del cliente actualizados exitosamente.'
          : 'Cliente registrado exitosamente.'
      );
      onClose();
    } else {
      setErrorMessage(res.error || 'Ocurrió un error al guardar el cliente.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-purple-950/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-purple-100 max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-100 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900">
                {isEditing ? 'Editar Datos del Cliente' : 'Registrar Nuevo Cliente'}
              </h2>
              <p className="text-xs text-neutral-500">
                Validación estricta de DUI (9 dígitos numéricos) y correo exclusivo @gmail.com.
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* DUI - Documento Único de Identidad (Exactamente 9 dígitos) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-neutral-700">
                  DUI (Documento Único de Identidad) *
                </label>
                <span className={`text-[11px] font-mono ${formData.documentNumber.length === 9 ? 'text-emerald-600 font-bold' : 'text-neutral-400'}`}>
                  {formData.documentNumber.length}/9 dígitos
                </span>
              </div>
              <input
                type="text"
                required
                maxLength={9}
                value={formData.documentNumber}
                onChange={handleDocumentChange}
                placeholder="Ej. 012345678"
                className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 font-tabular ${
                  duiError
                    ? 'border-amber-300 bg-amber-50/20 focus:ring-amber-500'
                    : 'border-neutral-200 focus:ring-purple-600'
                }`}
              />
              <p className="text-[10px] text-neutral-400 mt-1">
                Solo números (exactamente 9 dígitos numéricos sin guiones).
              </p>
            </div>

            {/* Fecha de Nacimiento */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Fecha de Nacimiento * {calculatedAge > 0 && <span className="text-neutral-400 font-normal">({calculatedAge} años)</span>}
              </label>
              <input
                type="date"
                required
                max={new Date().toISOString().split('T')[0]}
                value={formData.birthDate}
                onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent font-tabular"
              />
              {calculatedAge < 18 && formData.birthDate && (
                <p className="text-[11px] text-rose-600 mt-1 font-medium">El cliente debe tener al menos 18 años.</p>
              )}
            </div>

            {/* Nombres */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Nombres *
              </label>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                placeholder="Ej. Carlos Eduardo"
                className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              />
            </div>

            {/* Apellidos */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Apellidos *
              </label>
              <input
                type="text"
                required
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                placeholder="Ej. Mendoza Rivas"
                className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              />
            </div>

            {/* Correo Electrónico (Solo @gmail.com) */}
            <div className="sm:col-span-2">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-neutral-700">
                  Correo Electrónico (Exclusivo @gmail.com) *
                </label>
                {formData.email && (
                  <span className={`text-[11px] ${gmailError ? 'text-amber-600' : 'text-emerald-600 font-medium'}`}>
                    {gmailError ? 'Dominio requerido: @gmail.com' : '✓ Dominio @gmail.com válido'}
                  </span>
                )}
              </div>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="ejemplo.usuario@gmail.com"
                className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 ${
                  gmailError
                    ? 'border-amber-300 bg-amber-50/20 focus:ring-amber-500'
                    : 'border-neutral-200 focus:ring-purple-600'
                }`}
              />
              <p className="text-[10px] text-neutral-400 mt-1">
                Por política de seguridad del sistema, únicamente se aceptan cuentas con dominio <strong>@gmail.com</strong>.
              </p>
            </div>

            {/* Teléfono */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Teléfono de Contacto *
              </label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+503 7890 1234"
                className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent font-tabular"
              />
            </div>

            {/* Ocupación */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Ocupación o Actividad Económica *
              </label>
              <input
                type="text"
                required
                value={formData.occupation}
                onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                placeholder="Ej. Contador, Ingeniero, Comerciante"
                className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              />
            </div>

            {/* Ingresos Mensuales */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Ingresos Mensuales Declarados ($) *
              </label>
              <input
                type="number"
                step="0.01"
                min="1"
                required
                value={formData.monthlyIncome}
                onChange={(e) => setFormData({ ...formData, monthlyIncome: e.target.value })}
                placeholder="3000.00"
                className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent font-tabular"
              />
            </div>

            {/* Límite de Crédito Aprobado */}
            <div>
              <label className="block text-xs font-semibold text-purple-950 mb-1">
                Límite de Crédito Máximo ($) *
              </label>
              <input
                type="number"
                step="0.01"
                min="100"
                required
                value={formData.creditLimit}
                onChange={(e) => setFormData({ ...formData, creditLimit: e.target.value })}
                placeholder="10000.00"
                className="w-full px-3 py-2 text-xs border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent bg-purple-50/20 font-bold text-purple-950 font-tabular"
              />
            </div>

            {/* Dirección */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Dirección Residencial Completa *
              </label>
              <input
                type="text"
                required
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Av. Principal 123, Residencial Las Flores, Ciudad"
                className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              />
            </div>

            {/* Contraseña elegida por el cliente para el portal */}
            <div className="sm:col-span-2 p-3.5 bg-purple-50/50 border border-purple-100 rounded-xl">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-purple-950 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-purple-700" />
                  <span>Contraseña de Acceso al Portal (elegida por el cliente)</span>
                </label>
                <span className="text-[11px] text-purple-700 font-medium">
                  {isEditing ? 'Actualizar si el cliente lo desea' : 'Personalizada por el cliente'}
                </span>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder={isEditing ? 'Escribir nueva contraseña si desea cambiarla' : 'Escriba la contraseña elegida (mín. 4 caracteres)'}
                  className="w-full pl-3 pr-10 py-2 text-xs border border-purple-200 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-2 text-neutral-400 hover:text-neutral-600 transition-colors cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-purple-700/80 mt-1.5">
                Esta es la contraseña con la cual el cliente iniciará sesión en el sistema para consultar sus créditos y realizar abonos.
              </p>
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
              className="px-5 py-2 text-xs font-semibold text-white bg-purple-700 hover:bg-purple-800 rounded-lg transition-colors shadow-2xs cursor-pointer"
            >
              {isEditing ? 'Guardar Cambios' : 'Registrar Cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
