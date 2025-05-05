import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Calcula la edad a partir de una fecha de nacimiento en formato 'YYYY-MM-DD'.
 *
 * @param birthDateString - Fecha de nacimiento como string, p. ej. '1993-01-01'
 * @returns Edad en años cumplidos
 */
export function getAge(birthDateString: string): number {
  // Parsear el string a año, mes y día
  const [year, month, day] = birthDateString.split('-').map(Number);

  // Construir objeto Date (mes empieza en 0)
  const birthDate = new Date(year, month - 1, day);
  const today = new Date();

  // Calcular diferencia de años
  let age = today.getFullYear() - birthDate.getFullYear();

  // Ajustar si aún no ha cumplido años este año
  const hasHadBirthdayThisYear =
    today.getMonth() > birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() && today.getDate() >= birthDate.getDate());

  if (!hasHadBirthdayThisYear) {
    age--;
  }

  return age;
}