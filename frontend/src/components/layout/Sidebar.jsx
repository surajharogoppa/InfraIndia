import { useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  BarChart3,
  MapPinned,
  ArrowLeftRight,
  Sparkles,
  Database,
  Info,
  MessageSquareText,
  X,
  Menu
} from 'lucide-react';
import ThemeToggle from '../common/ThemeToggle';

const NAV = [
  {
    section: 'Platform',
    items: [
      { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/projects', icon: Building2, label: 'Project Explorer' },
      { to: '/analytics', icon: BarChart3, label: 'Analytics' },
      { to: '/map', icon: MapPinned, label: 'Map Explorer' },
      { to: '/compare', icon: ArrowLeftRight, label: 'Compare Projects' },
      { to: '/ai', icon: Sparkles, label: 'AI Assistant' },
    ]
  },
  {
    section: 'Data & System',
    items: [
      { to: '/sources', icon: Database, label: 'Data Sources' },
    ]
  },
  {
    section: 'Information',
    items: [
      { to: '/about', icon: Info, label: 'About Platform' },
      { to: '/contact', icon: MessageSquareText, label: 'Contact & Support' },
    ]
  },
];

export default function Sidebar({ open, collapsed, onClose, onToggleCollapse }) {
  // Prevent body scrolling on mobile when sidebar is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <>
      {/* Overlay for mobile */}
      {open && <div className="sidebar-overlay" onClick={onClose} />}

      <aside className={`sidebar${open ? ' open' : ''}${collapsed ? ' collapsed' : ''}`}>
        {/* Top Header with Hamburger Toggle */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          padding: collapsed ? '12px 0' : '10px 14px',
          borderBottom: '1px solid var(--border)',
          minHeight: '44px'
        }}>
          {!collapsed && (
            <span style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>
              Menu
            </span>
          )}
          <button
            className="btn btn-ghost btn-icon btn-sm"
            onClick={open ? onClose : onToggleCollapse}
            title={open ? "Close Menu" : (collapsed ? "Expand Sidebar" : "Collapse Sidebar")}
            aria-label="Toggle navigation menu"
            style={{ color: 'var(--text-secondary)' }}
          >
            {open ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav" style={{ paddingTop: 'var(--gap-xs)' }}>
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
