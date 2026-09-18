import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, FolderKanban, BarChart3, Map,
  Database, GitCompare, Info
} from 'lucide-react';
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

export default function Sidebar({ open, onClose }) {
  return (
    <>
      {/* Overlay for mobile */}
      {open && <div className="sidebar-overlay" onClick={onClose} />}

      <aside className={`sidebar${open ? ' open' : ''}`}>
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">🏛</div>
          <div>
            <div className="sidebar-logo-text">InfraIndia</div>
            <div className="sidebar-logo-sub">Intelligence Platform</div>
          </div>
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
                >
                  <Icon className="nav-link-icon" size={18} />
                  {label}
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
