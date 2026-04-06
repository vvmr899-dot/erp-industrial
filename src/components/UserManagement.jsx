import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Loader2, UserCog, Shield, AlertCircle, RefreshCw } from 'lucide-react';
import ResponsiveTable from './ResponsiveTable';

const UserManagement = ({ userRole }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Error al cargar la lista de usuarios: ' + (err.message || err.code || 'Sin acceso a la tabla'));
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      setUpdating(userId);
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      // Optimistic update or refetch
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (err) {
      console.error('Error updating role:', err);
      alert('Error al actualizar el rol del usuario');
      // Refetch to ensure sync
      fetchUsers();
    } finally {
      setUpdating(null);
    }
  };

  if (userRole !== 'admin') {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
        <div style={{ 
          background: 'rgba(239, 68, 68, 0.1)', 
          border: '1px solid var(--danger)', 
          padding: '2rem', 
          borderRadius: '16px',
          maxWidth: '500px',
          margin: '0 auto'
        }}>
          <AlertCircle size={48} color="var(--danger)" style={{ marginBottom: '1rem' }} />
          <h2 style={{ marginBottom: '0.5rem' }}>No autorizado</h2>
          <p style={{ color: 'var(--text-muted)' }}>No tienes permisos de administrador para acceder a esta sección.</p>
        </div>
      </div>
    );
  }

  const columns = [
    {
      key: 'email',
      title: 'Usuario / Email',
      render: (user) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ 
            width: '32px', 
            height: '32px', 
            borderRadius: '50%', 
            background: 'rgba(99, 102, 241, 0.1)', 
            color: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.875rem',
            fontWeight: '600'
          }}>
            {user.email?.[0].toUpperCase()}
          </div>
          <span style={{ fontWeight: '500' }}>{user.email}</span>
        </div>
      )
    },
    {
      key: 'role',
      title: 'Rol Actual',
      render: (user) => {
        const roleColors = {
          admin: { bg: 'rgba(16, 185, 129, 0.1)', text: '#10b981' },
          supervisor: { bg: 'rgba(245, 158, 11, 0.1)', text: '#f59e0b' },
          operador: { bg: 'rgba(99, 102, 241, 0.1)', text: '#6366f1' },
          almacen: { bg: 'rgba(59, 130, 246, 0.1)', text: '#3b82f6' },
          calidad: { bg: 'rgba(139, 92, 246, 0.1)', text: '#8b5cf6' }
        };
        const style = roleColors[user.role] || { bg: 'rgba(107, 114, 128, 0.1)', text: '#6b7280' };
        
        return (
          <span className="badge" style={{ 
            background: style.bg, 
            color: style.text, 
            fontSize: '0.75rem', 
            textTransform: 'capitalize' 
          }}>
            {user.role || 'Sin rol'}
          </span>
        );
      }
    },
    {
      key: 'actions',
      title: 'Cambiar Rol',
      align: 'right',
      render: (user) => (
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '0.5rem' }}>
          {updating === user.id && <Loader2 size={16} className="animate-spin" color="var(--primary)" />}
          <select
            value={user.role || ''}
            onChange={(e) => handleRoleChange(user.id, e.target.value)}
            disabled={updating === user.id}
            style={{
              padding: '0.35rem 0.5rem',
              borderRadius: '6px',
              border: '1px solid var(--border)',
              background: '#1a1a2e',
              color: 'var(--text)',
              fontSize: '0.875rem',
              cursor: 'pointer'
            }}
          >
            <option value="" disabled>Seleccionar rol</option>
            <option value="admin">Administrador</option>
            <option value="supervisor">Supervisor</option>
            <option value="operador">Operador</option>
            <option value="almacen">Almacén</option>
            <option value="calidad">Calidad</option>
          </select>
        </div>
      )
    }
  ];

  return (
    <div className="container animate-in">
      <div className="header-actions" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <UserCog size={28} color="var(--primary)" />
            <h1 style={{ margin: 0 }}>Gestión de Usuarios</h1>
          </div>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>Administra los roles y permisos de los usuarios del sistema.</p>
        </div>
        <button 
          onClick={fetchUsers} 
          className="btn" 
          disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          <span>Actualizar</span>
        </button>
      </div>

      {error && (
        <div style={{ 
          background: 'rgba(239, 68, 68, 0.1)', 
          border: '1px solid var(--danger)', 
          color: '#fca5a5', 
          padding: '1rem', 
          borderRadius: '8px', 
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      <ResponsiveTable
        columns={columns}
        data={users}
        loading={loading}
        emptyMessage="No se encontraron usuarios en la base de datos"
      />

      <div style={{ marginTop: '2rem', padding: '1.25rem', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', background: 'rgba(255,255,255,0.02)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          <Shield size={18} />
          <span>
            <strong>Nota de seguridad:</strong> Los cambios de rol se aplican instantáneamente en la base de datos. 
            Asegúrate de contar con las políticas RLS adecuadas en Supabase para restringir esta operación.
          </span>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
