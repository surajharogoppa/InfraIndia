import { useEffect } from 'react';
import { Card } from '../components/ui/Card';
import Breadcrumbs from '../components/common/Breadcrumbs';

export default function About() {
  useEffect(() => {
    document.title = 'About — InfraIndia';
  }, []);

  return (
    <div className="page-body">
      <Breadcrumbs />
      <div className="section-header mb-lg">
        <div>
          <div className="section-title">About the Platform</div>
          <div className="section-subtitle">Information on InfraIndia Intelligence Platform</div>
        </div>
      </div>
      <Card style={{ maxWidth: '800px', lineHeight: '1.8', padding: 'var(--gap-lg)' }}>
        <p style={{ marginBottom: '1rem' }}>
          InfraIndia is an independent, non-official intelligence platform designed to aggregate, analyze, and visualize data related to large-scale government infrastructure projects across India.
        </p>
        <p style={{ marginBottom: '1rem' }}>
          Our mission is to bring transparency and analytical rigor to public sector infrastructure execution. By consolidating reports from official sources (such as the Ministry of Statistics and Programme Implementation - MoSPI), we provide dashboards and mapping tools that allow analysts, journalists, and citizens to track project costs, delays, and progress.
        </p>
        <p>
          <strong>Disclaimer:</strong> This is an independent initiative and is not affiliated with, endorsed by, or operated by any government entity. All data is derived from publicly available flash reports and is subject to the accuracy of the original sources.
        </p>
      </Card>
    </div>
  );
}
