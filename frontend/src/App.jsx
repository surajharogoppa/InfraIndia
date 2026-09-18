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
import Admin from './pages/Admin';
import { ThemeProvider } from './context/ThemeContext';
import ThemeToggle from './components/common/ThemeToggle';
import { Menu } from 'lucide-react';

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <ThemeProvider>
      <BrowserRouter>
        <div className="app-shell">
          <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

          <div className="main-content">
            {/* Header */}
            <header className="page-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--gap-sm)' }}>
                <button
                  className="btn btn-ghost btn-icon"
                  onClick={() => setSidebarOpen(true)}
                  style={{ display: 'none' }}
                  id="sidebar-toggle"
                >
                  <Menu size={18} />
                </button>
                <span className="page-title" id="page-title-slot" />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--gap-sm)' }}>
                <ThemeToggle showLabel={true} />
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
            <Route path="/admin" element={<Admin />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  </ThemeProvider>
);
}
