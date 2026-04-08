import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../lib/translations';
import { Loader2, LogIn, Lock, Mail } from 'lucide-react';

const Login = () => {
  const { lang, setLang, t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const langConfig = {
    es: 'ES',
    en: 'EN',
    zh: '中'
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    }
    
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '600px',
        height: '600px',
        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)',
        zIndex: -1,
        pointerEvents: 'none'
      }}></div>

      <div style={{
        position: 'absolute',
        top: '2rem',
        right: '2rem',
        display: 'flex',
        gap: '0.5rem',
        background: 'rgba(17, 24, 39, 0.7)',
        padding: '0.25rem',
        borderRadius: '0.75rem',
        border: '1px solid var(--border)',
        backdropFilter: 'blur(8px)'
      }}>
        {Object.entries(langConfig).map(([code, label]) => (
          <button
            key={code}
            onClick={() => setLang(code)}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              border: 'none',
              background: lang === code ? 'var(--primary)' : 'transparent',
              color: lang === code ? 'white' : 'var(--text-muted)',
              fontSize: '0.75rem',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: lang === code ? '0 0 10px rgba(99, 102, 241, 0.3)' : 'none'
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="card-mesh" style={{
        width: '100%',
        maxWidth: '440px',
        padding: '3rem 2.5rem',
        textAlign: 'center',
        background: 'rgba(10, 11, 16, 0.8)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
      }}>
        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{ 
            width: '80px', 
            height: '80px', 
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(99, 102, 241, 0.05))', 
            borderRadius: '24px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            margin: '0 auto 1.5rem',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            boxShadow: '0 0 30px rgba(99, 102, 241, 0.2)',
            position: 'relative'
          }}>
            <Lock size={36} color="var(--primary)" />
            <div style={{
              position: 'absolute',
              inset: '-1px',
              borderRadius: '24px',
              border: '2px solid var(--primary)',
              opacity: 0.1,
              filter: 'blur(4px)'
            }}></div>
          </div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 700, marginBottom: '0.75rem', color: 'white', fontFamily: 'var(--font-display)' }}>Invlog ERP</h1>
          {/* Cambia t.loading por t('loading') */} <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}> {t('loading').replace('...', '') || 'Ingresa tus credenciales para continuar'}</p>
        </div>{error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            color: '#fca5a5',
            padding: '1rem',
            borderRadius: '0.75rem',
            marginBottom: '2rem',
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--danger)' }}></div>
            {error === 'Invalid login credentials' ? t.invalidCredentials : error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          <div>
            <label>{t.email}</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@ejemplo.com"
                style={{
                  paddingLeft: '3.25rem'
                }}
              />
            </div>
          </div>

          <div>
            <label>{t.password}</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  paddingLeft: '3.25rem'
                }}
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ 
              width: '100%', 
              padding: '1rem', 
              marginTop: '0.5rem',
              fontSize: '1rem'
            }}
            disabled={loading}
          >
            {loading ? <Loader2 size={24} className="animate-spin" /> : (
              <>
                <LogIn size={20} />
                <span>{t.signInButton}</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
