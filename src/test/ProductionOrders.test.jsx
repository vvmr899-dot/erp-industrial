import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ProductionOrders from '../components/ProductionOrders';

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
    })),
  },
}));

vi.mock('lucide-react', () => ({
  Plus: () => <div data-testid="plus-icon" />,
  Loader2: () => <div data-testid="loader" />,
  Trash2: () => <div data-testid="trash-icon" />,
  Edit2: () => <div data-testid="edit-icon" />,
  RefreshCw: () => <div data-testid="refresh-icon" />,
  CheckCircle2: () => <div data-testid="check-icon" />,
  Hash: () => <div data-testid="hash-icon" />,
  Package: () => <div data-testid="package-icon" />,
  Calendar: () => <div data-testid="calendar-icon" />,
  ChevronDown: () => <div data-testid="chevron-icon" />,
  MoreVertical: () => <div data-testid="more-icon" />,
}));

describe('ProductionOrders Component', () => {
  const renderProductionOrders = () => {
    return render(
      <BrowserRouter>
        <ProductionOrders />
      </BrowserRouter>
    );
  };

  it('renders production orders title', async () => {
    renderProductionOrders();
    
    await waitFor(() => {
      expect(screen.getByText('Órdenes de Producción')).toBeInTheDocument();
    });
  });

  it('displays new order button', async () => {
    renderProductionOrders();
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Nueva Orden/i })).toBeInTheDocument();
    });
  });

  it('displays table headers', async () => {
    renderProductionOrders();
    
    await waitFor(() => {
      expect(screen.getByText('ORDEN')).toBeInTheDocument();
      expect(screen.getByText('PRODUCTO')).toBeInTheDocument();
      expect(screen.getByText('LOTE')).toBeInTheDocument();
      expect(screen.getByText('CANTIDAD')).toBeInTheDocument();
      expect(screen.getByText('AVANCE')).toBeInTheDocument();
      expect(screen.getByText('FECHA INICIO')).toBeInTheDocument();
      expect(screen.getByText('ESTADO')).toBeInTheDocument();
      expect(screen.getByText('ACCIONES')).toBeInTheDocument();
    });
  });

  it('shows empty state when no orders', async () => {
    renderProductionOrders();
    
    await waitFor(() => {
      expect(screen.getByText('No hay órdenes registradas.')).toBeInTheDocument();
    });
  });
});
