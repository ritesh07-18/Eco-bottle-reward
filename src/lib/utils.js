import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDateTime(value) {
  if (!value) return 'Not available';
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function isExpired(value) {
  return value ? new Date(value).getTime() < Date.now() : false;
}

export function normalizePhone(value) {
  const digits = String(value ?? '').replace(/\D/g, '');
  return digits.slice(-10);
}

export function phoneToEmail(phone) {
  return `${normalizePhone(phone)}@eco.in`;
}

export function resolveLoginEmail(input) {
  const value = String(input ?? '').trim();
  return value.includes('@') ? value : phoneToEmail(value);
}
