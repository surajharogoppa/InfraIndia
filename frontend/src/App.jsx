import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectDetails from './pages/ProjectDetails';
import Analytics from './pages/Analytics';
import MapExplorer from './pages/MapExplorer';
import Compare from './pages/Compare';
import DataSources from './pages/DataSources';
import AIAssistant from './pages/AIAssistant';
import About from './pages/About';
import Contact from './pages/Contact';
import { ThemeProvider } from './context/ThemeContext';
import ThemeToggle from './components/common/ThemeToggle';
import SearchPalette from './components/common/SearchPalette';
import { Search, Bell, User, Menu } from 'lucide-react';

function MainApp() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // Global shortcut Ctrl+K / Cmd+K to open Search
  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(prev => !prev);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="app-shell">
      <Sidebar
        open={sidebarOpen}
        collapsed={sidebarCollapsed}
        onClose={() => setSidebarOpen(false)}
        onToggleCollapse={() => setSidebarCollapsed(prev => !prev)}
      />

      <div className={`main-content${sidebarCollapsed ? ' collapsed' : ''}`}>
        {/* Global Application Header */}
        <header className="page-header" style={{ padding: '0 var(--gap-lg)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--gap-sm)' }}>
            {/* Mobile Hamburger Menu Toggle */}
            <button
              type="button"
              className="btn btn-ghost btn-icon mobile-only"
              onClick={() => setSidebarOpen(prev => !prev)}
              aria-label="Toggle navigation menu"
              title="Open Navigation"
              id="mobile-nav-toggle"
              style={{ padding: '6px' }}
            >
              <Menu size={20} />
            </button>

            {/* Logo and InfraIndia Branding in Global Header */}
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', color: 'inherit' }}>
              <div style={{
                width: 28,
                height: 28,
                borderRadius: 'var(--radius-sm)',
                background: 'linear-gradient(135deg, hsl(220 90% 60%), hsl(262 80% 65%))',
                display: 'grid',
                placeItems: 'center',
                fontSize: '14px',
                flexShrink: 0,
                boxShadow: 'var(--shadow-sm)'
              }}>
                🏛
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontWeight: 800, fontSize: '0.98rem', letterSpacing: '-0.02em', color: 'var(--text-primary)', lineHeight: 1.1 }}>
                  InfraIndia
                </span>
                <span className="desktop-only" style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Intelligence Platform
                </span>
              </div>
            </Link>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--gap)' }}>
            <nav className="desktop-only" style={{ display: 'flex', gap: 'var(--gap-lg)', alignItems: 'center', marginRight: 'var(--gap-lg)' }}>
              <Link to="/about" className="header-nav-link" style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--text-secondary)', textDecoration: 'none' }}>
                About
              </Link>
              <Link to="/contact" className="header-nav-link" style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--text-secondary)', textDecoration: 'none' }}>
                Contact
              </Link>
            </nav>

            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--gap-xs)' }}>
              <button
                className="btn btn-ghost btn-icon"
                onClick={() => setSearchOpen(true)}
                title="Search projects (Ctrl+K)"
                aria-label="Search projects"
              >
                <Search size={18} color="var(--text-secondary)" />
              </button>

              <button
                className="btn btn-ghost btn-icon desktop-only"
                title="System notifications"
                aria-label="Notifications"
                onClick={() => alert('No unread system notifications. Dataset is synced and up to date.')}
              >
                <Bell size={18} color="var(--text-secondary)" />
              </button>

              <ThemeToggle showLabel={false} />

              <button
                className="btn btn-ghost btn-icon mobile-only"
                title="Public User"
                aria-label="User Profile"
              >
                <User size={18} color="var(--text-secondary)" />
              </button>
            </div>
          </div>
        </header>

        {/* Routes */}
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/:id" element={<ProjectDetails />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/map" element={<MapExplorer />} />
          <Route path="/compare" element={<Compare />} />
          <Route path="/sources" element={<DataSources />} />
          <Route path="/ai" element={<AIAssistant />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="*" element={<Dashboard />} />
        </Routes>
      </div>

      {/* Global Search Palette */}
      <SearchPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <MainApp />
      </BrowserRouter>
    </ThemeProvider>
  );
}
