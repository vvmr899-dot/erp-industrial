import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ProductionCapture from '../components/ProductionCapture';

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
  ClipboardCheck: () => <div data-testid="clipboard-icon" />,
  User: () => <div data-testid="user-icon" />,
  Clock: () => <div data-testid="clock-icon" />,
  AlertCircle: () => <div data-testid="alert-icon" />,
  Save: () => <div data-testid="save-icon" />,
  Loader2: () => <div data-testid="loader" />,
  ArrowRight: () => <div data-testid="arrow-icon" />,
  Layers: () => <div data-testid="layers-icon" />,
  Settings: () => <div data-testid="settings-icon" />,
  Database: () => <div data-testid="database-icon" />,
  Activity: () => <div data-testid="activity-icon" />,
  CheckCircle2: () => <div data-testid="check-icon" />,
  Package: () => <div data-testid="package-icon" />,
  TrendingUp: () => <div data-testid="trending-icon" />,
  Cpu: () => <div data-testid="cpu-icon" />,
}));

describe('ProductionCapture Component', () => {
  const renderProductionCapture = () => {
    return render(
      <BrowserRouter>
        <ProductionCapture />
      </BrowserRouter>
    );
  };

  it('renders production capture title', async () => {
    renderProductionCapture();
    
    await waitFor(() => {
      expect(screen.getByText('Captura de Producción')).toBeInTheDocument();
    });
  });

  it('displays selection section', async () => {
    renderProductionCapture();
    
    await waitFor(() => {
      expect(screen.getByText('1. Selección de Trabajo')).toBeInTheDocument();
    });
  });

  it('displays capture form section', async () => {
    renderProductionCapture();
    
    await waitFor(() => {
      expect(screen.getByText('2. Captura de Avance')).toBeInTheDocument();
    });
  });

  it('displays WIP flow section', async () => {
    renderProductionCapture();
    
    await waitFor(() => {
      expect(screen.getByText('3. Flujo WIP y Estado de la Orden')).toBeInTheDocument();
    });
  });

  it('displays order selection dropdown', async () => {
    renderProductionCapture();
    
    await waitFor(() => {
      expect(screen.getByText('-- Buscar Orden --')).toBeInTheDocument();
    });
  });

  it('shows placeholder when no order selected', async () => {
    renderProductionCapture();
    
    await waitFor(() => {
      expect(screen.getByText('Selecciona una operación para habilitar la captura.')).toBeInTheDocument();
    });
  });
});
