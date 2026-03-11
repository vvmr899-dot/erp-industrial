import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ProductionRouting from '../components/ProductionRouting';

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
  Search: () => <div data-testid="search-icon" />,
  Edit2: () => <div data-testid="edit-icon" />,
  Trash2: () => <div data-testid="trash-icon" />,
  Loader2: () => <div data-testid="loader" />,
  ChevronRight: () => <div data-testid="chevron-icon" />,
  Clock: () => <div data-testid="clock-icon" />,
  Settings: () => <div data-testid="settings-icon" />,
  CheckCircle2: () => <div data-testid="check-icon" />,
  AlertCircle: () => <div data-testid="alert-icon" />,
  FileText: () => <div data-testid="file-icon" />,
  Package: () => <div data-testid="package-icon" />,
  Copy: () => <div data-testid="copy-icon" />,
}));

describe('ProductionRouting Component', () => {
  const renderProductionRouting = () => {
    return render(
      <BrowserRouter>
        <ProductionRouting />
      </BrowserRouter>
    );
  };

  it('renders production routing title', async () => {
    renderProductionRouting();
    
    await waitFor(() => {
      expect(screen.getByText('Rutas de Producción')).toBeInTheDocument();
    });
  });

  it('displays new operation button', async () => {
    renderProductionRouting();
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Nueva Operación/i })).toBeInTheDocument();
    });
  });

  it('displays filter dropdown', async () => {
    renderProductionRouting();
    
    await waitFor(() => {
      expect(screen.getByText('-- Todos los Números de Parte --')).toBeInTheDocument();
    });
  });
});
