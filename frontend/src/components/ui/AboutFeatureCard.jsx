import React from 'react';
import { Card } from './Card';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AboutFeatureCard({
  icon: Icon,
  title,
  description,
  to,
  badge,
  cardAccent = 'var(--accent)',
  cardGlow = 'var(--accent-glow)'
}) {
  const content = (
    <Card
      className="about-feature-card"
      style={{
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        textDecoration: 'none',
        color: 'inherit',
        position: 'relative',
        '--card-accent': cardAccent,
        '--card-glow': cardGlow,
        borderRadius: 'var(--radius-lg)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{
          width: 36,
          height: 36,
          borderRadius: 'var(--radius)',
          background: `${cardAccent}18`,
          color: cardAccent,
          display: 'grid',
          placeItems: 'center',
          flexShrink: 0,
          border: `1px solid ${cardAccent}30`,
          boxShadow: `0 2px 8px ${cardAccent}20`
        }}>
          {Icon && <Icon size={18} />}
        </div>
        {badge && (
          <span className="badge" style={{
            fontSize: '0.66rem',
            padding: '2px 8px',
            background: 'var(--bg-hover)',
            color: 'var(--text-secondary)',
            borderRadius: '99px',
            fontWeight: 600,
            border: '1px solid var(--border)'
          }}>
            {badge}
          </span>
        )}
      </div>

      <h3 style={{
        fontSize: '0.9rem',
        fontWeight: 700,
        color: 'var(--text-primary)',
        margin: '0 0 6px',
        fontFamily: 'var(--font-display)',
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
      }}>
        {title}
      </h3>

      <p style={{
        fontSize: '0.78rem',
        color: 'var(--text-secondary)',
        margin: 0,
        lineHeight: 1.55,
        flex: 1
      }}>
        {description}
      </p>

      {to && (
        <div style={{
          marginTop: '12px',
          paddingTop: '10px',
          borderTop: '1px solid var(--border)',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          fontSize: '0.72rem',
          fontWeight: 600,
          color: cardAccent
        }}>
          <span>Launch Tool</span>
          <ArrowRight size={12} className="feature-card-arrow" />
        </div>
      )}
    </Card>
  );

  if (to) {
    return (
      <Link to={to} style={{ textDecoration: 'none', display: 'block', height: '100%' }}>
        {content}
      </Link>
    );
  }

  return content;
}
