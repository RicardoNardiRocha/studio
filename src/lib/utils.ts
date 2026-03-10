import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getUfFromAddress = (address: string = ''): string => {
  const match = address.match(/-\s([A-Z]{2})(?:\s*,|\s*$)/);
  return match ? match[1] : '';
};
