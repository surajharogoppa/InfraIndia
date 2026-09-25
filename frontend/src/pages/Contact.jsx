import { useEffect, useState } from 'react';
import Breadcrumbs from '../components/common/Breadcrumbs';
import ContactForm from '../components/ui/ContactForm';
import FAQItem from '../components/ui/FAQItem';
import { Card } from '../components/ui/Card';
import {
  Mail,
  Copy,
  Check,
  Clock,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

export default function Contact() {
  const [openFaq, setOpenFaq] = useState(null);
  const [emailCopied, setEmailCopied] = useState(false);

  useEffect(() => {
    document.title = 'Contact InfraIndia';
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', 'Contact InfraIndia with questions, feedback, data issues, or suggestions.');
    }
  }, []);

  const faqs = [
    {
      id: 'faq-1',
      question: 'Is InfraIndia an official government website?',
      answer: 'No. InfraIndia is an independent project intelligence platform and is not affiliated with the Government of India or any ministry. All project information is organized from publicly published government datasets.'
    },
    {
      id: 'faq-2',
      question: 'Where does the project information come from?',
      answer: 'Data is gathered from monthly flash reports published by the Ministry of Statistics and Programme Implementation (MoSPI), central administrative releases, and public infrastructure portals.'
    },
    {
      id: 'faq-3',
      question: 'How do I report an incorrect project figure or timeline?',
      answer: 'Select "Data Correction / Feedback" in the form above and provide the project name or ID along with details of the discrepancy. Our team reviews source reports to update records.'
    },
    {
      id: 'faq-4',
      question: 'How frequently is project data refreshed?',
      answer: 'Project metrics reflect the publication cadence of government reporting agencies, typically updated on a monthly or quarterly basis.'
    }
  ];

  const handleCopyEmail = () => {
    navigator.clipboard.writeText('contact@infraindia.org');
    setEmailCopied(true);
    setTimeout(() => setEmailCopied(false), 2000);
  };

  return (
    <div className="page-body" style={{ maxWidth: '1080px', margin: '0 auto' }}>
      <Breadcrumbs />

      {/* Clean Minimalist Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.65rem',
          fontWeight: 800,
          color: 'var(--text-primary)',
          margin: '0 0 6px',
          letterSpacing: '-0.02em'
        }}>
          Contact Us
        </h1>
        <p style={{
          fontSize: '0.88rem',
          color: 'var(--text-secondary)',
          margin: 0,
          maxWidth: '600px',
          lineHeight: 1.5
        }}>
          Have a question about the platform, feedback on project data, or feature ideas? Send us a message below.
        </p>
      </div>

      {/* Two-Column Clean Layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1.4fr',
        gap: '32px',
        alignItems: 'start',
        marginBottom: '40px'
      }}
      className="contact-split-grid"
      >
        {/* Left Column: Direct Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Email Box */}
          <Card style={{ padding: '18px 20px', background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div style={{
                width: 32,
                height: 32,
                borderRadius: 'var(--radius)',
                background: 'hsl(220 90% 60% / 0.12)',
                color: 'var(--accent)',
                display: 'grid',
                placeItems: 'center'
              }}>
                <Mail size={16} />
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Direct Email
                </div>
                <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  contact@infraindia.org
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '10px', borderTop: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                <Clock size={12} />
                <span>Response in 1–2 business days</span>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={handleCopyEmail}
                style={{ fontSize: '0.72rem', padding: '3px 8px', gap: '4px' }}
                title="Copy email address"
              >
                {emailCopied ? <Check size={12} color="var(--green)" /> : <Copy size={12} />}
                <span>{emailCopied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </Card>

          {/* Inquiry Scope List */}
          <div>
            <h2 style={{ fontSize: '0.84rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', margin: '0 0 12px' }}>
              What we can help with
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <CheckCircle2 size={15} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong style={{ fontSize: '0.82rem', color: 'var(--text-primary)', display: 'block' }}>
                    Data Corrections & Updates
                  </strong>
                  <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                    Report discrepancies in project costs, commissioning deadlines, or implementing agencies.
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <CheckCircle2 size={15} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong style={{ fontSize: '0.82rem', color: 'var(--text-primary)', display: 'block' }}>
                    Platform & API Questions
                  </strong>
                  <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                    Questions regarding data ingestion, filtering logic, or research queries.
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <CheckCircle2 size={15} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong style={{ fontSize: '0.82rem', color: 'var(--text-primary)', display: 'block' }}>
                    Feature Suggestions
                  </strong>
                  <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                    Ideas for new analytical metrics, visual charts, or sector breakdowns.
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Minimal Independent Platform Disclaimer */}
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            padding: '12px 14px',
            borderRadius: 'var(--radius)',
            background: 'var(--bg-hover)',
            border: '1px solid var(--border)',
            fontSize: '0.74rem',
            color: 'var(--text-muted)',
            lineHeight: 1.5
          }}>
            <ShieldCheck size={15} style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: '2px' }} />
            <span>
              InfraIndia is an independent information platform and is not an official government entity. All submissions are handled for dataset and platform improvements.
            </span>
          </div>
        </div>

        {/* Right Column: Sleek Form */}
        <div>
          <ContactForm />
        </div>
      </div>

      {/* Clean Compact FAQ Section */}
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: '28px', marginBottom: '24px' }}>
        <div style={{ marginBottom: '16px' }}>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px', fontFamily: 'var(--font-display)' }}>
            Frequently Asked Questions
          </h2>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
            Common questions regarding data sources and platform operations.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {faqs.map((faq) => (
            <FAQItem
              key={faq.id}
              id={faq.id}
              question={faq.question}
              answer={faq.answer}
              isOpen={openFaq === faq.id}
              onToggle={() => setOpenFaq(prev => prev === faq.id ? null : faq.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
