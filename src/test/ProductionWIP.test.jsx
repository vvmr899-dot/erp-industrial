import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ProductionWIP from '../components/ProductionWIP';

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
    })),
  },
}));

vi.mock('lucide-react', () => ({
  AlertTriangle: () => <div data-testid="alert-icon" />,
  Loader2: () => <div data-testid="loader" />,
  Search: () => <div data-testid="search-icon" />,
  Factory: () => <div data-testid="factory-icon" />,
}));

describe('ProductionWIP Component', () => {
  const renderProductionWIP = () => {
    return render(
      <BrowserRouter>
        <ProductionWIP />
      </BrowserRouter>
    );
  };

  it('renders WIP title', async () => {
    renderProductionWIP();
    
    await waitFor(() => {
      expect(screen.getByText('Trazabilidad de Piso (WIP)')).toBeInTheDocument();
    });
  });

  it('displays order filter dropdown', async () => {
    renderProductionWIP();
    
    await waitFor(() => {
      expect(screen.getByText('-- Todas las órdenes en proceso --')).toBeInTheDocument();
    });
  });

  it('displays update button', async () => {
    renderProductionWIP();
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Actualizar Datos/i })).toBeInTheDocument();
    });
  });

  it('shows empty state when no order selected', async () => {
    renderProductionWIP();
    
    await waitFor(() => {
      expect(screen.getByText('Selecciona una orden para ver su flujo')).toBeInTheDocument();
    });
  });

  it('displays WIP description', async () => {
    renderProductionWIP();
    
    await waitFor(() => {
      expect(screen.getByText(/El sistema mostrará el inventario en proceso/i)).toBeInTheDocument();
    });
  });
});
