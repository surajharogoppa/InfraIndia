import { useEffect } from 'react';
import Breadcrumbs from '../components/common/Breadcrumbs';
import { Card } from '../components/ui/Card';
import {
  Building2,
  TrendingUp,
  History,
  BarChart3,
  MapPinned,
  Database,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function About() {
  useEffect(() => {
    document.title = 'About InfraIndia';
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', 'Learn about InfraIndia, an independent platform for exploring and understanding infrastructure project information.');
    }
  }, []);

  const capabilities = [
    {
      icon: Building2,
      title: 'Project Explorer',
      description: 'Search and filter hundreds of central sector infrastructure projects across sectors, states, and implementing ministries.',
      to: '/projects'
    },
    {
      icon: TrendingUp,
      title: 'Project Intelligence',
      description: 'Review capital outlays, original vs. anticipated costs, physical progress metrics, and delay tracking.',
      to: '/projects'
    },
    {
      icon: History,
      title: 'Historical Snapshots',
      description: 'Inspect chronological change logs to see how project budgets and commissioning deadlines evolve over time.',
      to: '/projects'
    },
    {
      icon: BarChart3,
      title: 'Analytical Dashboards',
      description: 'Analyze aggregated sector allocations, state expenditure distributions, and multi-year completion projections.',
      to: '/analytics'
    },
    {
      icon: MapPinned,
      title: 'Geographic Mapping',
      description: 'Explore regional project distribution and state-level expenditure density with interactive choropleth maps.',
      to: '/map'
    },
    {
      icon: Database,
      title: 'Source Transparency',
      description: 'Direct attribution to official monthly flash reports, ingestion history, and dataset provenance.',
      to: '/sources'
    }
  ];

  const steps = [
    {
      num: '01',
      title: 'Collect',
      description: 'Ingests public administrative records and official monthly flash reports from MoSPI.'
    },
    {
      num: '02',
      title: 'Standardize',
      description: 'Cleanses and normalizes disparate tables into structured project entities and metrics.'
    },
    {
      num: '03',
      title: 'Audit',
      description: 'Maintains chronological snapshots to track cost revisions and timeline delays over time.'
    },
    {
      num: '04',
      title: 'Explore',
      description: 'Enables search, comparative analysis, interactive GIS maps, and analytical discovery.'
    }
  ];

  return (
    <div className="page-body" style={{ maxWidth: '1040px', margin: '0 auto' }}>
      <Breadcrumbs />

      {/* Sleek Integrated Hero Section */}
      <div className="about-hero-section">
        <div style={{ marginBottom: '20px' }}>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.75rem',
            fontWeight: 800,
            color: 'var(--text-primary)',
            margin: '0 0 8px',
            letterSpacing: '-0.02em'
          }}>
            About InfraIndia
          </h1>
          <p style={{
            fontSize: '0.94rem',
            color: 'var(--text-secondary)',
            margin: '0 0 14px',
            maxWidth: '740px',
            lineHeight: 1.55
          }}>
            An independent project intelligence platform dedicated to making India's central infrastructure projects transparent, structured, and easy to track.
          </p>
          <p style={{
            fontSize: '0.84rem',
            color: 'var(--text-muted)',
            margin: 0,
            maxWidth: '740px',
            lineHeight: 1.6
          }}>
            Infrastructure developments involve massive public capital, multi-year timelines, and complex administrative filings. InfraIndia aggregates and standardizes monthly official flash reports—enabling citizens, researchers, and planners to explore project costs, execution milestones, and delay histories through an intuitive interface.
          </p>
        </div>

        {/* Integrated 4-Metric Bar */}
        <div className="about-stats-grid">
          <div className="about-stat-item">
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.45rem',
              fontWeight: 800,
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
              lineHeight: 1.1,
              marginBottom: '4px'
            }}>
              1,800+
            </div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Central Projects
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Tracked across major ministries
            </div>
          </div>

          <div className="about-stat-item">
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.45rem',
              fontWeight: 800,
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
              lineHeight: 1.1,
              marginBottom: '4px'
            }}>
              16+
            </div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Core Sectors
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Rail, Roads, Energy & more
            </div>
          </div>

          <div className="about-stat-item">
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.45rem',
              fontWeight: 800,
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
              lineHeight: 1.1,
              marginBottom: '4px'
            }}>
              37
            </div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              States & UTs
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Pan-India regional coverage
            </div>
          </div>

          <div className="about-stat-item">
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.45rem',
              fontWeight: 800,
              color: 'var(--accent)',
              letterSpacing: '-0.02em',
              lineHeight: 1.1,
              marginBottom: '4px'
            }}>
              100%
            </div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Public Provenance
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              MoSPI monthly flash data
            </div>
          </div>
        </div>
      </div>

      {/* Platform Capabilities (Clean 6-Card Grid) */}
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: '32px', marginBottom: '40px' }}>
        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px', fontFamily: 'var(--font-display)' }}>
            Platform Capabilities
          </h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
            Core tools for exploring, mapping, and analyzing infrastructure project data.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '16px'
        }}>
          {capabilities.map((cap) => {
            const IconComp = cap.icon;
            return (
              <Card
                key={cap.title}
                style={{
                  padding: '18px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <div style={{
                      width: 30,
                      height: 30,
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-hover)',
                      color: 'var(--accent)',
                      display: 'grid',
                      placeItems: 'center',
                      flexShrink: 0
                    }}>
                      <IconComp size={16} />
                    </div>
                    <h3 style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                      {cap.title}
                    </h3>
                  </div>

                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                    {cap.description}
                  </p>
                </div>

                <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px solid var(--border)' }}>
                  <Link
                    to={cap.to}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.74rem',
                      fontWeight: 600,
                      color: 'var(--accent)',
                      textDecoration: 'none'
                    }}
                  >
                    <span>Open Tool</span>
                    <ArrowRight size={12} />
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* How InfraIndia Works (Clean 4-Step Pipeline) */}
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: '32px', marginBottom: '40px' }}>
        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px', fontFamily: 'var(--font-display)' }}>
            How InfraIndia Works
          </h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
            From raw public administrative tables to structured intelligence.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '14px'
        }}>
          {steps.map((st) => (
            <Card
              key={st.num}
              style={{
                padding: '16px 18px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)'
              }}
            >
              <div style={{
                fontSize: '1rem',
                fontWeight: 800,
                color: 'var(--accent)',
                fontFamily: 'var(--font-display)',
                marginBottom: '6px'
              }}>
                {st.num}
              </div>
              <h3 style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px' }}>
                {st.title}
              </h3>
              <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                {st.description}
              </p>
            </Card>
          ))}
        </div>
      </div>

      {/* Data Principles & Transparency */}
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: '32px', marginBottom: '36px' }}>
        <div style={{ marginBottom: '16px' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px', fontFamily: 'var(--font-display)' }}>
            Data Principles & Limitations
          </h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
            InfraIndia aims to make project information easier to understand while maintaining clear source attribution.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '16px',
          marginBottom: '20px'
        }}
        className="about-principles-grid"
        >
          <Card style={{ padding: '16px 18px', background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
              Source Attribution & Normalization
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
              All project records trace back to published government flash reports and administrative releases. Datasets are standardized across state names, agency codes, and monetary units (₹ Crore).
            </p>
          </Card>

          <Card style={{ padding: '16px 18px', background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
              Reporting Cadence & Limitations
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
              Information displayed is derived from available public sources and may reflect reporting lags or revisions published by source agencies. InfraIndia does not independently audit construction sites.
            </p>
          </Card>
        </div>

        {/* Minimal Independent Platform Disclaimer */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '10px',
          padding: '14px 16px',
          borderRadius: 'var(--radius)',
          background: 'var(--bg-hover)',
          border: '1px solid var(--border)',
          fontSize: '0.76rem',
          color: 'var(--text-muted)',
          lineHeight: 1.5
        }}>
          <ShieldCheck size={16} style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: '2px' }} />
          <span>
            <strong style={{ color: 'var(--text-secondary)' }}>Independent Information Platform: </strong>
            InfraIndia is an independent project intelligence platform and is not an official website of the Government of India, any ministry, department, or public sector undertaking.
          </span>
        </div>
      </div>

      {/* Bottom Actions Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '14px',
        padding: '20px 24px',
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)'
      }}>
        <div>
          <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '2px' }}>
            Ready to explore infrastructure data?
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
            Browse projects, inspect interactive maps, or get in touch with our team.
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <Link to="/projects" className="btn btn-primary" style={{ textDecoration: 'none', fontSize: '0.8rem', padding: '7px 16px', gap: '5px' }}>
            <span>Browse Projects</span>
            <ArrowRight size={13} />
          </Link>
          <Link to="/map" className="btn btn-ghost" style={{ textDecoration: 'none', fontSize: '0.8rem', padding: '7px 14px' }}>
            <span>Map View</span>
          </Link>
          <Link to="/contact" className="btn btn-ghost" style={{ textDecoration: 'none', fontSize: '0.8rem', padding: '7px 14px' }}>
            <span>Contact Us</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
