import { useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import logoImg from '../../assets/logo.png';
import {
  Sparkles,
  CircleGauge,
  Building2,
  BarChart3,
  MapPinned,
  ArrowLeftRight,
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
      { to: '/ai', icon: Sparkles, label: 'AI Assistant', badge: 'AI', isAi: true },
      { to: '/dashboard', icon: CircleGauge, label: 'Dashboard' },
      { to: '/projects', icon: Building2, label: 'Project Explorer' },
      { to: '/analytics', icon: BarChart3, label: 'Analytics' },
      { to: '/map', icon: MapPinned, label: 'Map Explorer' },
      { to: '/compare', icon: ArrowLeftRight, label: 'Compare Projects' },
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

  const isCollapsed = collapsed && !open;

  return (
    <>
      {/* Overlay for mobile */}
      {open && <div className="sidebar-overlay" onClick={onClose} />}

      <aside className={`sidebar${open ? ' open' : ''}${isCollapsed ? ' collapsed' : ''}`}>
        {/* Top Header with Hamburger Toggle (aligned with page-header) */}
        <div className="sidebar-header">
          {!isCollapsed ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <img
                src={logoImg}
                alt="InfraIndia"
                style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover' }}
              />
              <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                InfraIndia
              </span>
            </div>
          ) : null}
          <button
            className="btn btn-ghost btn-icon btn-sm"
            onClick={open ? onClose : onToggleCollapse}
            title={open ? "Close Menu" : (isCollapsed ? "Expand Sidebar" : "Collapse Sidebar")}
            aria-label="Toggle navigation menu"
            style={{ color: 'var(--text-secondary)' }}
          >
            {open ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav" style={{ paddingTop: 'var(--gap-xs)' }}>
          {NAV.map(({ section, items }) => (
            <div key={section} className="sidebar-group">
              {!isCollapsed && (
                <div className="sidebar-section">
                  <div className="sidebar-section-label">{section}</div>
                </div>
              )}
                    {items.map(({ to, icon: Icon, label, badge, isAi }) => (
                      <NavLink
                        key={to}
                        to={to}
                        end={to === '/ai' || to === '/dashboard'}
                        className={({ isActive }) => `nav-link${isActive ? ' active' : ''}${isAi ? ' nav-link-ai' : ''}`}
                        onClick={onClose}
                        title={isCollapsed ? label : undefined}
                      >
                        {isAi ? (
                          <span className="nav-ai-icon-circle" title={label}>
                            <Icon size={16} />
                          </span>
                        ) : (
                          <Icon className="nav-link-icon" size={19} />
                        )}
                        {!isCollapsed && (
                          <span className="nav-link-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                            <span>{label}</span>
                            {badge && (
                              <span style={{
                                fontSize: '0.62rem',
                                fontWeight: 700,
                                padding: '1px 6px',
                                borderRadius: '5px',
                                background: 'linear-gradient(135deg, hsl(220 90% 55%), hsl(260 85% 65%))',
                                color: '#ffffff',
                                letterSpacing: '0.04em',
                                boxShadow: '0 1px 5px var(--accent-glow)'
                              }}>
                                {badge}
                              </span>
                            )}
                          </span>
                        )}
                      </NavLink>
                    ))
                    }
                  </div>
                ))}
            </nav>

        {/* Footer */ }
        {!isCollapsed && (
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
          )}
      </aside>
    </>
  );
}
