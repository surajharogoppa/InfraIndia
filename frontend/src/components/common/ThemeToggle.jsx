import { useTheme } from '../../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle({ showLabel = false, className = '' }) {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <button
      type="button"
      className={`btn btn-ghost btn-sm theme-toggle-btn ${className}`}
      onClick={toggleTheme}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: showLabel ? '5px 10px' : '6px',
        borderRadius: 'var(--radius)',
        color: 'var(--text-secondary)',
        border: '1px solid var(--border)',
        cursor: 'pointer',
        transition: 'all var(--transition)',
      }}
    >
      {isDark ? (
        <Sun size={16} style={{ color: 'hsl(42 95% 58%)' }} />
      ) : (
        <Moon size={16} style={{ color: 'hsl(220 90% 55%)' }} />
      )}
      {showLabel && (
        <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>
          {isDark ? 'Light Mode' : 'Dark Mode'}
        </span>
      )}
    </button>
  );
}
