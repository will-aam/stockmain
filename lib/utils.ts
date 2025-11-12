// src/lib/utils.ts
/** Utilitários globais, incluindo a função `cn` para combinar classes do Tailwind CSS. */

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combina classes do Tailwind CSS de forma inteligente, resolvendo conflitos.
 * @param inputs - Classes a serem combinadas.
 * @returns String de classes CSS sem conflitos.
 */
export function cn(...inputs: ClassValue[]) {
  // A ordem é importante: clsx constrói a string e twMerge resolve os conflitos.
  return twMerge(clsx(inputs));
}
