import { describe, it, expect } from 'vitest';
import { add, subtract, sum, multiply, divide } from '../src/calculator.js';

describe('Calculator Operations', () => {
  it('adds two numbers correctly', () => {
    expect(add(10, 20)).toBe(30);
  });

  it('subtracts two numbers correctly', () => {
    expect(subtract(50, 15)).toBe(35);
  });

  it('multiplies numbers correctly', () => {
    expect(multiply(4, 5)).toBe(20);
  });

  // FAILS BEFORE PATCH: sum([10, 20, 30]) returns 50 because index 0 (10) is skipped!
  it('calculates the sum of an array including the first element', () => {
    expect(sum([10, 20, 30])).toBe(60);
  });

  // FAILS BEFORE PATCH: divide(10, 0) returns Infinity instead of throwing!
  it('throws an error on division by zero', () => {
    expect(() => divide(10, 0)).toThrow('Division by zero is not allowed');
  });
});
