import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Inventory from '../components/Inventory';

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
  Search: () => <div data-testid="search-icon" />,
  History: () => <div data-testid="history-icon" />,
  Loader2: () => <div data-testid="loader" />,
  Trash2: () => <div data-testid="trash-icon" />,
  ChevronRight: () => <div data-testid="chevron-icon" />,
  X: () => <div data-testid="x-icon" />,
}));

describe('Inventory Component', () => {
  const renderInventory = () => {
    return render(
      <BrowserRouter>
        <Inventory />
      </BrowserRouter>
    );
  };

  it('renders inventory title', async () => {
    renderInventory();
    
    await waitFor(() => {
      expect(screen.getByText('Almacén de Producto Terminado')).toBeInTheDocument();
    });
  });

  it('displays search input', async () => {
    renderInventory();
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Buscar por código o descripción...')).toBeInTheDocument();
    });
  });

  it('shows update button', async () => {
    renderInventory();
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Actualizar/i })).toBeInTheDocument();
    });
  });

  it('displays empty state when no inventory', async () => {
    renderInventory();
    
    await waitFor(() => {
      expect(screen.getByText(/No se detecta inventario de producto terminado aún/i)).toBeInTheDocument();
    });
  });
});
