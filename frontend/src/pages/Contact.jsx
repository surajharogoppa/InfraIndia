import { useEffect } from 'react';
import { Mail, Code, MessageCircle } from 'lucide-react';
import { Card } from '../components/ui/Card';
import Breadcrumbs from '../components/common/Breadcrumbs';

export default function Contact() {
  useEffect(() => {
    document.title = 'Contact — InfraIndia';
  }, []);

  return (
    <div className="page-body">
      <Breadcrumbs />
      <div className="section-header mb-lg">
        <div>
          <div className="section-title">Contact Us</div>
          <div className="section-subtitle">Get in touch with the team behind InfraIndia</div>
        </div>
      </div>
      <Card style={{ maxWidth: '600px', padding: '2rem' }}>
        <p style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>
          Have questions, suggestions, or want to report a data anomaly? We'd love to hear from you.
        </p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ background: 'var(--bg-hover)', padding: '10px', borderRadius: '50%' }}>
              <Mail size={20} color="var(--accent)" />
            </div>
            <div>
              <div style={{ fontWeight: 600 }}>Email</div>
              <div style={{ color: 'var(--text-muted)' }}>contact@infraindia.example.com</div>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ background: 'var(--bg-hover)', padding: '10px', borderRadius: '50%' }}>
              <Code size={20} color="var(--accent)" />
            </div>
            <div>
              <div style={{ fontWeight: 600 }}>Source Code</div>
              <div style={{ color: 'var(--text-muted)' }}>github.com/infraindia</div>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ background: 'var(--bg-hover)', padding: '10px', borderRadius: '50%' }}>
              <MessageCircle size={20} color="var(--accent)" />
            </div>
            <div>
              <div style={{ fontWeight: 600 }}>Social</div>
              <div style={{ color: 'var(--text-muted)' }}>@InfraIndiaApp</div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
