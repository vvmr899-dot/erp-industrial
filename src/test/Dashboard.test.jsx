import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Dashboard from '../components/Dashboard';

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [] }),
      limit: vi.fn().mockResolvedValue({ data: [] }),
    })),
  },
}));

vi.mock('lucide-react', () => ({
  Clock: () => <div data-testid="clock-icon" />,
  ClipboardList: () => <div data-testid="clipboard-icon" />,
  TrendingUp: () => <div data-testid="trending-icon" />,
  Activity: () => <div data-testid="activity-icon" />,
  AlertCircle: () => <div data-testid="alert-icon" />,
  RefreshCcw: () => <div data-testid="refresh-icon" />,
  BarChart3: () => <div data-testid="barchart-icon" />,
  Cpu: () => <div data-testid="cpu-icon" />,
}));

describe('Dashboard Component', () => {
  const renderDashboard = () => {
    return render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );
  };

  it('renders dashboard title', async () => {
    renderDashboard();
    
    await waitFor(() => {
      expect(screen.getByText('Dashboard de Producción')).toBeInTheDocument();
    });
  });

  it('displays KPI cards', async () => {
    renderDashboard();
    
    await waitFor(() => {
      expect(screen.getByText('Órdenes Activas')).toBeInTheDocument();
      expect(screen.getByText('Salida Diaria (Hoy)')).toBeInTheDocument();
      expect(screen.getByText('Total Piezas en Piso')).toBeInTheDocument();
      expect(screen.getByText('Tasa de Rechazos')).toBeInTheDocument();
    });
  });
});
