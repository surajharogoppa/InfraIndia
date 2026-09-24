import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectDetails from './pages/ProjectDetails';
import Analytics from './pages/Analytics';
import MapExplorer from './pages/MapExplorer';
import Compare from './pages/Compare';
import DataSources from './pages/DataSources';
import { ThemeProvider } from './context/ThemeContext';
import ThemeToggle from './components/common/ThemeToggle';
import { Menu } from 'lucide-react';
import About from './pages/About';
import Contact from './pages/Contact';

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <ThemeProvider>
      <BrowserRouter>
        <div className="app-shell">
          <Sidebar 
            open={sidebarOpen} 
            collapsed={sidebarCollapsed} 
            onClose={() => setSidebarOpen(false)} 
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          />

          <div className={`main-content${sidebarCollapsed ? ' collapsed' : ''}`}>
            {/* Header */}
            <header className="page-header" style={{ padding: '0 var(--gap-lg)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--gap-sm)' }}>
                {/* Mobile Menu Toggle */}
                <button
                  className="btn btn-ghost btn-icon"
                  onClick={() => setSidebarOpen(true)}
                  id="sidebar-toggle"
                >
                  <Menu size={18} />
                </button>
                <span className="page-title" id="page-title-slot" />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--gap-xl)' }}>
                <nav style={{ display: 'flex', gap: 'var(--gap-lg)', alignItems: 'center' }}>
                  <a href="/about" onClick={(e) => { e.preventDefault(); window.history.pushState(null, '', '/about'); window.dispatchEvent(new Event('popstate')); }} className="header-nav-link" style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)' }}>About</a>
                  <a href="/contact" onClick={(e) => { e.preventDefault(); window.history.pushState(null, '', '/contact'); window.dispatchEvent(new Event('popstate')); }} className="header-nav-link" style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Contact</a>
                </nav>
                <ThemeToggle showLabel={false} />
              </div>
            </header>

          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/projects/:id" element={<ProjectDetails />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/map" element={<MapExplorer />} />
            <Route path="/compare" element={<Compare />} />
            <Route path="/sources" element={<DataSources />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  </ThemeProvider>
);
}
