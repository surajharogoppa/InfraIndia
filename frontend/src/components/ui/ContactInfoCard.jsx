import React from 'react';
import { Card } from './Card';
import { ArrowUpRight, CheckCircle2 } from 'lucide-react';

export default function ContactInfoCard({
  icon: Icon,
  title,
  description,
  badge,
  onClick,
  active = false,
  colorAccent = 'var(--accent)'
}) {
  return (
    <Card
      className={`contact-info-card${active ? ' active' : ''}`}
      onClick={onClick}
      style={{
        padding: '14px 16px',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 200ms cubic-bezier(0.2, 0, 0, 1)',
        border: active ? `1px solid ${colorAccent}` : '1px solid var(--border)',
        background: active ? `${colorAccent}10` : 'var(--bg-card)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: active ? `0 4px 16px ${colorAccent}25` : 'var(--shadow-sm)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {active && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          bottom: 0,
          width: 3,
          background: colorAccent
        }} />
      )}

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
        <div style={{
          width: 36,
          height: 36,
          borderRadius: 'var(--radius)',
          background: active ? colorAccent : `${colorAccent}18`,
          color: active ? '#ffffff' : colorAccent,
          display: 'grid',
          placeItems: 'center',
          flexShrink: 0,
          border: `1px solid ${colorAccent}35`,
          transition: 'all 200ms ease',
          boxShadow: active ? `0 2px 8px ${colorAccent}40` : 'none'
        }}>
          {Icon && <Icon size={18} />}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '3px' }}>
            <h4 style={{
              fontSize: '0.88rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              margin: 0,
              fontFamily: 'var(--font-display)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              {title}
            </h4>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {badge && (
                <span className="badge" style={{
                  fontSize: '0.64rem',
                  padding: '2px 7px',
                  background: 'var(--bg-hover)',
                  color: 'var(--text-secondary)',
                  borderRadius: '99px',
                  border: '1px solid var(--border)',
                  fontWeight: 600
                }}>
                  {badge}
                </span>
              )}
              {active && (
                <CheckCircle2 size={15} style={{ color: colorAccent, flexShrink: 0 }} />
              )}
            </div>
          </div>

          <p style={{
            fontSize: '0.78rem',
            color: 'var(--text-secondary)',
            margin: 0,
            lineHeight: 1.5
          }}>
            {description}
          </p>

          {onClick && (
            <div style={{
              marginTop: '8px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.72rem',
              fontWeight: 600,
              color: active ? colorAccent : 'var(--text-muted)'
            }}>
              <span>{active ? 'Category Selected' : 'Select Category'}</span>
              <ArrowUpRight size={11} />
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
