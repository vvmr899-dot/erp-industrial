import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import PartNumbers from '../components/PartNumbers';

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [] }),
    })),
  },
}));

vi.mock('lucide-react', () => ({
  Package: () => <div data-testid="package-icon" />,
  Plus: () => <div data-testid="plus-icon" />,
  Search: () => <div data-testid="search-icon" />,
  Loader2: () => <div data-testid="loader" />,
  Trash2: () => <div data-testid="trash-icon" />,
  Edit2: () => <div data-testid="edit-icon" />,
}));

describe('PartNumbers Component', () => {
  const renderPartNumbers = () => {
    return render(
      <BrowserRouter>
        <PartNumbers />
      </BrowserRouter>
    );
  };

  it('renders part numbers title', async () => {
    renderPartNumbers();
    
    await waitFor(() => {
      expect(screen.getByText('Números de Parte')).toBeInTheDocument();
    });
  });

  it('displays add new button', async () => {
    renderPartNumbers();
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Nuevo Número de Parte/i })).toBeInTheDocument();
    });
  });

  it('displays table headers', async () => {
    renderPartNumbers();
    
    await waitFor(() => {
      expect(screen.getByText('NÚMERO DE PARTE')).toBeInTheDocument();
      expect(screen.getByText('DESCRIPCIÓN')).toBeInTheDocument();
      expect(screen.getByText('UOM')).toBeInTheDocument();
      expect(screen.getByText('ACCIONES')).toBeInTheDocument();
    });
  });

  it('shows empty state when no parts', async () => {
    renderPartNumbers();
    
    await waitFor(() => {
      expect(screen.getByText('No hay números de parte registrados.')).toBeInTheDocument();
    });
  });

  it('opens modal when clicking add button', async () => {
    renderPartNumbers();
    
    await waitFor(() => {
      const addButton = screen.getByRole('button', { name: /Nuevo Número de Parte/i });
      fireEvent.click(addButton);
    });

    await waitFor(() => {
      expect(screen.getByText('Añadir Número de Parte')).toBeInTheDocument();
    });
  });
});
