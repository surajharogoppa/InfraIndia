import { useLocation, Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

export default function Breadcrumbs({ extra }) {
  const location = useLocation();
  const path = location.pathname;

  let crumb = 'Dashboard';
  let parent = null;

  if (path === '/' || path === '/dashboard') {
    crumb = 'Dashboard';
  } else if (path === '/projects') {
    crumb = 'Project Explorer';
  } else if (path.startsWith('/projects/')) {
    parent = { label: 'Project Explorer', to: '/projects' };
    crumb = extra || 'Project Details';
  } else if (path === '/analytics') {
    crumb = 'Analytics';
  } else if (path === '/map') {
    crumb = 'Map Explorer';
  } else if (path === '/compare') {
    crumb = 'Compare Projects';
  } else if (path === '/sources') {
    crumb = 'Data Sources';
  } else if (path === '/ai') {
    crumb = 'AI Assistant';
  } else if (path === '/about') {
    crumb = 'About';
  } else if (path === '/contact') {
    crumb = 'Contact';
  }

  return (
    <nav
      aria-label="Breadcrumbs"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '0.78rem',
        marginBottom: 'var(--gap-sm)',
        color: 'var(--text-muted)'
      }}
    >
      <Link
        to="/"
        style={{
          color: 'var(--text-muted)',
          textDecoration: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}
      >
        <Home size={12} />
        <span>InfraIndia</span>
      </Link>
      <ChevronRight size={11} color="var(--text-muted)" />
      {parent && (
        <>
          <Link
            to={parent.to}
            style={{ color: 'var(--text-muted)', textDecoration: 'none' }}
          >
            {parent.label}
          </Link>
          <ChevronRight size={11} color="var(--text-muted)" />
        </>
      )}
      <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{crumb}</span>
    </nav>
  );
}
