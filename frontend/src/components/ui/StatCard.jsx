import React from 'react';

export default function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend, 
  trendLabel, 
  description, 
  loading,
  color = 'var(--accent)',
  bgColor = 'var(--bg-card)'
}) {
  return (
    <div 
      className="card stat-card" 
      style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid var(--border)',
        borderTop: `2px solid ${color}`,
        borderRadius: 'var(--radius)',
        background: bgColor,
        padding: '6px 8px',
        boxShadow: 'var(--shadow-sm)',
        minWidth: 0
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 4 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ 
            fontSize: '0.62rem', 
            fontWeight: 600, 
            color: 'var(--text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.03em',
            margin: 0,
            marginBottom: '2px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }} title={title}>
            {title}
          </div>
          
          {loading ? (
            <div className="skeleton skeleton-text" style={{ width: '70%', height: '1.2rem', marginTop: '2px' }} />
          ) : (
            <div style={{ 
              fontSize: '1.05rem', 
              fontWeight: 800, 
              color: 'var(--text-primary)',
              lineHeight: 1.15,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {value}
            </div>
          )}
          
          {subtitle && (
            <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: '1px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {subtitle}
            </div>
          )}
        </div>
        
        {Icon && (
          <div style={{ 
            padding: '3px', 
            borderRadius: 'var(--radius-sm)', 
            background: `${color}15`,
            color: color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Icon size={13} />
          </div>
        )}
      </div>

      {(trend || description) && (
        <div style={{ 
          marginTop: '4px', 
          paddingTop: '4px', 
          borderTop: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          fontSize: '0.62rem',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          {trend && (
            <span style={{ 
              fontWeight: 700, 
              color: trend > 0 ? 'var(--green)' : trend < 0 ? 'var(--red)' : 'var(--text-muted)' 
            }}>
              {trend > 0 ? '↑' : trend < 0 ? '↓' : '−'} {Math.abs(trend)}%
            </span>
          )}
          
          {(trendLabel || description) && (
            <span style={{ color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {trendLabel || description}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
