/**
 * Sample Calculator Library
 * Contains intentional bugs for RepoMedic AI to diagnose, patch, and verify.
 */

export function add(a: number, b: number): number {
  // Bug 1: Loose typing / unsafe coercion
  return (a as any) + (b as any);
}

export function subtract(a: number, b: number): number {
  return a - b;
}

export function sum(numbers: number[]): number {
  let total = 0;
  // Bug 2: Off-by-one error - loop starts at index 1 instead of 0,
  // skipping numbers[0]!
  for (let i = 1; i < numbers.length; i++) {
    total += numbers[i];
  }
  return total;
}

export function multiply(a: number, b: number): number {
  return a * b;
}

export function divide(a: number, b: number): number {
  // Bug 3: Missing zero check - returns Infinity or uncaught edge case
  return a / b;
}
