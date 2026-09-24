import React from 'react';

export function Card({ children, className = '', style = {}, noPadding = false, ...props }) {
  return (
    <div 
      className={`card ${noPadding ? 'p-0' : ''} ${className}`} 
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: noPadding ? 0 : '10px 14px',
        boxShadow: 'var(--shadow-sm)',
        ...style
      }}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, action, subtitle }) {
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center',
      marginBottom: 'var(--gap-sm)',
      borderBottom: subtitle ? 'none' : '1px solid var(--border)',
      paddingBottom: subtitle ? 0 : '4px'
    }}>
      <div>
        <h3 className="card-title" style={{ margin: 0, fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)' }}>{title}</h3>
        {subtitle && <p style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', margin: '1px 0 0' }}>{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
