import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ProductionScrap from '../components/ProductionScrap';

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
    })),
  },
}));

vi.mock('lucide-react', () => ({
  AlertCircle: () => <div data-testid="alert-icon" />,
  Search: () => <div data-testid="search-icon" />,
  Filter: () => <div data-testid="filter-icon" />,
  Calendar: () => <div data-testid="calendar-icon" />,
  User: () => <div data-testid="user-icon" />,
  Hash: () => <div data-testid="hash-icon" />,
  Loader2: () => <div data-testid="loader" />,
  Trash2: () => <div data-testid="trash-icon" />,
}));

describe('ProductionScrap Component', () => {
  const renderProductionScrap = () => {
    return render(
      <BrowserRouter>
        <ProductionScrap />
      </BrowserRouter>
    );
  };

  it('renders scrap control title', async () => {
    renderProductionScrap();
    
    await waitFor(() => {
      expect(screen.getByText('Control de Calidad (Scrap)')).toBeInTheDocument();
    });
  });

  it('displays update button', async () => {
    renderProductionScrap();
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Actualizar/i })).toBeInTheDocument();
    });
  });

  it('displays analytics cards', async () => {
    renderProductionScrap();
    
    await waitFor(() => {
      expect(screen.getByText('TOTAL SCRAP')).toBeInTheDocument();
      expect(screen.getByText('INCIDENCIAS')).toBeInTheDocument();
      expect(screen.getByText('TOP DEFECTOS')).toBeInTheDocument();
      expect(screen.getByText('PEOR OPERACIÓN')).toBeInTheDocument();
    });
  });

  it('displays search input', async () => {
    renderProductionScrap();
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Buscar por orden, pieza o responsable...')).toBeInTheDocument();
    });
  });

  it('shows empty state when no scrap data', async () => {
    renderProductionScrap();
    
    await waitFor(() => {
      expect(screen.getByText('Sin registros que mostrar.')).toBeInTheDocument();
    });
  });
});
