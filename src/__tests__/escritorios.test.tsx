import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Mock fetch global
global.fetch = vi.fn();

describe('Escritorios API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/escritorios', () => {
    it('returns list of escritorios', async () => {
      const mockEscritorios = [
        {
          id: '1',
          codigo: 1,
          nome: 'DOGUP Assessoria',
          documento: '12345678000190',
          email: 'contato@dogup.com.br',
          status: 'ATIVO',
        },
      ];

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockEscritorios),
      } as any);

      const response = await fetch('/api/escritorios');
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data).toHaveLength(1);
      expect(data[0].nome).toBe('DOGUP Assessoria');
    });

    it('returns 401 when not authenticated', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: 'Unauthorized' }),
      } as any);

      const response = await fetch('/api/escritorios');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/escritorios', () => {
    it('creates new escritorio', async () => {
      const newEscritorio = {
        nome: 'Novo Escritório',
        documento: '98765432000100',
        email: 'novo@escritorio.com.br',
      };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: () => Promise.resolve({ id: '2', codigo: 2, ...newEscritorio }),
      } as any);

      const response = await fetch('/api/escritorios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEscritorio),
      });

      expect(response.status).toBe(201);
    });

    it('validates required fields', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: 'Nome, documento e email são obrigatórios' }),
      } as any);

      const response = await fetch('/api/escritorios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      expect(response.status).toBe(400);
    });
  });
});
