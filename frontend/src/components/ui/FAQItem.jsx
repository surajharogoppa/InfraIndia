import React from 'react';
import { ChevronDown } from 'lucide-react';

export default function FAQItem({ question, answer, isOpen, onToggle, id }) {
  const contentId = `faq-content-${id}`;
  const headerId = `faq-header-${id}`;

  return (
    <div
      style={{
        borderBottom: '1px solid var(--border)',
        padding: '12px 0',
        transition: 'all var(--transition)'
      }}
    >
      <button
        type="button"
        id={headerId}
        aria-expanded={isOpen}
        aria-controls={contentId}
        onClick={onToggle}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          background: 'transparent',
          border: 'none',
          color: isOpen ? 'var(--accent)' : 'var(--text-primary)',
          cursor: 'pointer',
          textAlign: 'left',
          fontSize: '0.86rem',
          fontWeight: 600,
          fontFamily: 'var(--font-sans)',
          padding: '4px 0'
        }}
      >
        <span>{question}</span>
        <ChevronDown
          size={15}
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 180ms ease',
            color: 'var(--text-muted)',
            flexShrink: 0
          }}
        />
      </button>

      {isOpen && (
        <div
          id={contentId}
          role="region"
          aria-labelledby={headerId}
          style={{
            paddingTop: '8px',
            paddingBottom: '4px',
            fontSize: '0.8rem',
            lineHeight: 1.6,
            color: 'var(--text-secondary)'
          }}
        >
          {answer}
        </div>
      )}
    </div>
  );
}
