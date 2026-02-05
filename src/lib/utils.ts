import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(cents: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
  }).format(cents / 100);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date));
}

export function getXpProgress(xp: number, level: number): number {
  const xpForNextLevel = 100 * level;
  const xpInCurrentLevel = xp % (100 * (level - 1 || 1));
  return Math.min(100, (xpInCurrentLevel / xpForNextLevel) * 100);
}
