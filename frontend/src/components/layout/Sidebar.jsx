import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, FolderKanban, BarChart3, Map,
  Database, GitCompare, Info
} from 'lucide-react';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import ThemeToggle from '../common/ThemeToggle';

const NAV = [
  {
    section: 'Platform',
    items: [
      { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/projects', icon: FolderKanban, label: 'Project Explorer' },
      { to: '/analytics', icon: BarChart3, label: 'Analytics' },
      { to: '/map', icon: Map, label: 'Map Explorer' },
      { to: '/compare', icon: GitCompare, label: 'Compare Projects' },
    ]
  },
  {
    section: 'System',
    items: [
      { to: '/sources', icon: Database, label: 'Data Sources' },
    ]
  },
];

export default function Sidebar({ open, collapsed, onClose, onToggleCollapse }) {
  return (
    <>
      {/* Overlay for mobile */}
      {open && <div className="sidebar-overlay" onClick={onClose} />}

      <aside className={`sidebar${open ? ' open' : ''}${collapsed ? ' collapsed' : ''}`}>
        {/* Logo */}
        <div className="sidebar-logo" style={{ position: 'relative' }}>
          <div className="sidebar-logo-icon">🏛</div>
          <div>
            <div className="sidebar-logo-text">InfraIndia</div>
            <div className="sidebar-logo-sub">Intelligence Platform</div>
          </div>
          {/* Desktop Toggle inside Sidebar */}
          <button
            className="btn btn-ghost btn-icon sidebar-desktop-toggle"
            onClick={onToggleCollapse}
            title="Toggle Sidebar"
            style={{
              position: 'absolute',
              right: '-16px',
              top: '20px',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 10,
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {NAV.map(({ section, items }) => (
            <div key={section}>
              <div className="sidebar-section">
                <div className="sidebar-section-label">{section}</div>
              </div>
              {items.map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
                  onClick={onClose}
                  title={collapsed ? label : undefined}
                >
                  <Icon className="nav-link-icon" size={18} />
                  <span className="nav-link-label">{label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Info size={12} />
              <strong>InfraIndia</strong>
            </div>
            <ThemeToggle showLabel={false} />
          </div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
            Data sourced from official MoSPI flash reports. Independent platform.
          </div>
        </div>
      </aside>
    </>
  );
}
