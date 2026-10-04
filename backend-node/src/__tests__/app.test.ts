import { describe, it, expect } from 'vitest';
import app from '../app';

describe('Backend Application Tests', () => {
  it('should initialize application', () => {
    expect(app).toBeDefined();
  });
}); 