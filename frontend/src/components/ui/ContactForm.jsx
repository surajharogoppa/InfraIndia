import React, { useState } from 'react';
import { Card } from './Card';
import {
  Send,
  AlertCircle,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { contactApi } from '../../services/api';

const TOPICS = [
  { value: 'General Question', label: 'General Question' },
  { value: 'Data Feedback', label: 'Data Correction / Feedback' },
  { value: 'Feature Request', label: 'Feature Suggestion' },
  { value: 'Technical Issue', label: 'Technical Issue' },
  { value: 'Source / Data Question', label: 'Source & Provenance Question' },
  { value: 'Other', label: 'Other' }
];

export default function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    topic: 'General Question',
    subject: '',
    message: ''
  });

  const [touched, setTouched] = useState({});
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle'); // 'idle' | 'submitting' | 'success' | 'unavailable'
  const [statusMessage, setStatusMessage] = useState('');
  const [copied, setCopied] = useState(false);

  const validateField = (field, value) => {
    switch (field) {
      case 'name':
        if (!value.trim()) return 'Name is required';
        if (value.trim().length > 100) return 'Max 100 characters';
        return null;
      case 'email':
        if (!value.trim()) return 'Email is required';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) return 'Invalid email address';
        if (value.trim().length > 120) return 'Max 120 characters';
        return null;
      case 'subject':
        if (!value.trim()) return 'Subject is required';
        if (value.trim().length > 150) return 'Max 150 characters';
        return null;
      case 'message':
        if (!value.trim()) return 'Message is required';
        if (value.trim().length < 10) return 'Minimum 10 characters required';
        if (value.trim().length > 2000) return 'Max 2000 characters';
        return null;
      default:
        return null;
    }
  };

  const validateAll = () => {
    const newErrors = {};
    Object.keys(formData).forEach(key => {
      const err = validateField(key, formData[key]);
      if (err) newErrors[key] = err;
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (touched[name]) {
      const err = validateField(name, value);
      setErrors(prev => ({ ...prev, [name]: err }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    const err = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: err }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ name: true, email: true, topic: true, subject: true, message: true });
    
    if (!validateAll()) return;

    setStatus('submitting');
    setStatusMessage('');

    try {
      const response = await contactApi.submit(formData);
      if (response?.status >= 200 && response?.status < 300) {
        setStatus('success');
        setStatusMessage('Thanks for reaching out. Your message has been submitted successfully.');
      } else {
        setStatus('unavailable');
        setStatusMessage('Contact submission is currently unavailable. Please try again later.');
      }
    } catch {
      setStatus('unavailable');
      setStatusMessage('Online message submission is currently being set up. Please copy your message or email us directly.');
    }
  };

  const handleCopy = () => {
    const text = `Topic: ${formData.topic}\nName: ${formData.name}\nEmail: ${formData.email}\nSubject: ${formData.subject}\n\nMessage:\n${formData.message}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setFormData({
      name: '',
      email: '',
      topic: 'General Question',
      subject: '',
      message: ''
    });
    setTouched({});
    setErrors({});
    setStatus('idle');
    setStatusMessage('');
  };

  const isFormValid = Object.keys(formData).every(key => !validateField(key, formData[key]));

  return (
    <Card style={{
      padding: '24px',
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--shadow-sm)'
    }}>
      {status === 'success' ? (
        <div style={{ padding: '32px 16px', textAlign: 'center' }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: 'hsl(142 70% 48% / 0.12)',
            color: 'var(--green)',
            display: 'grid',
            placeItems: 'center',
            margin: '0 auto 14px'
          }}>
            <CheckCircle2 size={24} />
          </div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 6px' }}>
            Message Sent
          </h3>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: '0 0 20px', lineHeight: 1.5 }}>
            {statusMessage}
          </p>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={handleReset}
          >
            Send Another Message
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate>
          {status === 'unavailable' && (
            <div style={{
              background: 'hsl(38 95% 50% / 0.08)',
              border: '1px solid hsl(38 90% 50% / 0.25)',
              borderRadius: 'var(--radius)',
              padding: '12px 14px',
              marginBottom: '18px',
              fontSize: '0.8rem',
              color: 'var(--text-primary)',
              lineHeight: 1.5
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '8px' }}>
                <AlertCircle size={16} style={{ color: 'var(--yellow)', flexShrink: 0, marginTop: '2px' }} />
                <span>{statusMessage}</span>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', paddingTop: '6px' }}>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={handleCopy}
                  style={{ fontSize: '0.74rem', padding: '3px 10px', gap: '4px' }}
                >
                  {copied ? <Check size={12} color="var(--green)" /> : <Copy size={12} />}
                  <span>{copied ? 'Copied to Clipboard' : 'Copy Message'}</span>
                </button>
                <a
                  href={`mailto:contact@infraindia.org?subject=${encodeURIComponent(`[${formData.topic}] ${formData.subject}`)}&body=${encodeURIComponent(`From: ${formData.name} (${formData.email})\n\n${formData.message}`)}`}
                  className="btn btn-ghost btn-sm"
                  style={{ fontSize: '0.74rem', padding: '3px 10px', gap: '4px', textDecoration: 'none', color: 'inherit' }}
                >
                  <ExternalLink size={12} />
                  <span>Open Email Client</span>
                </a>
              </div>
            </div>
          )}

          {/* Name & Email Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
            <div>
              <label htmlFor="contact-name" style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                Name
              </label>
              <input
                id="contact-name"
                name="name"
                type="text"
                className="search-input"
                style={{
                  padding: '8px 12px',
                  borderRadius: 'var(--radius)',
                  borderColor: touched.name && errors.name ? 'var(--red)' : undefined
                }}
                placeholder="Your name"
                value={formData.name}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={status === 'submitting'}
                maxLength={100}
                required
              />
              {touched.name && errors.name && (
                <div style={{ color: 'var(--red)', fontSize: '0.7rem', marginTop: '3px' }}>
                  {errors.name}
                </div>
              )}
            </div>

            <div>
              <label htmlFor="contact-email" style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                Email
              </label>
              <input
                id="contact-email"
                name="email"
                type="email"
                className="search-input"
                style={{
                  padding: '8px 12px',
                  borderRadius: 'var(--radius)',
                  borderColor: touched.email && errors.email ? 'var(--red)' : undefined
                }}
                placeholder="name@example.com"
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={status === 'submitting'}
                maxLength={120}
                required
              />
              {touched.email && errors.email && (
                <div style={{ color: 'var(--red)', fontSize: '0.7rem', marginTop: '3px' }}>
                  {errors.email}
                </div>
              )}
            </div>
          </div>

          {/* Topic / Category */}
          <div style={{ marginBottom: '14px' }}>
            <label htmlFor="contact-topic" style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
              Topic
            </label>
            <select
              id="contact-topic"
              name="topic"
              className="select-input"
              style={{
                width: '100%',
                padding: '8px 32px 8px 12px',
                borderRadius: 'var(--radius)',
                fontSize: '0.82rem',
                height: '38px'
              }}
              value={formData.topic}
              onChange={handleChange}
              disabled={status === 'submitting'}
            >
              {TOPICS.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          {/* Subject */}
          <div style={{ marginBottom: '14px' }}>
            <label htmlFor="contact-subject" style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
              Subject
            </label>
            <input
              id="contact-subject"
              name="subject"
              type="text"
              className="search-input"
              style={{
                padding: '8px 12px',
                borderRadius: 'var(--radius)',
                borderColor: touched.subject && errors.subject ? 'var(--red)' : undefined
              }}
              placeholder="What is your message about?"
              value={formData.subject}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={status === 'submitting'}
              maxLength={150}
              required
            />
            {touched.subject && errors.subject && (
              <div style={{ color: 'var(--red)', fontSize: '0.7rem', marginTop: '3px' }}>
                {errors.subject}
              </div>
            )}
          </div>

          {/* Message */}
          <div style={{ marginBottom: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
              <label htmlFor="contact-message" style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Message
              </label>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                {formData.message.length} / 2000
              </span>
            </div>
            <textarea
              id="contact-message"
              name="message"
              rows={5}
              className="search-input"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 'var(--radius)',
                resize: 'vertical',
                minHeight: '120px',
                fontFamily: 'var(--font-sans)',
                lineHeight: 1.5,
                borderColor: touched.message && errors.message ? 'var(--red)' : undefined
              }}
              placeholder="Provide details about your question, project data correction (include project name/ID if relevant), or suggestion..."
              value={formData.message}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={status === 'submitting'}
              maxLength={2000}
              required
            />
            {touched.message && errors.message && (
              <div style={{ color: 'var(--red)', fontSize: '0.7rem', marginTop: '3px' }}>
                {errors.message}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={status === 'submitting' || (Object.keys(touched).length > 0 && !isFormValid)}
              style={{ padding: '8px 22px', fontSize: '0.82rem' }}
            >
              {status === 'submitting' ? (
                <>
                  <RefreshCw size={13} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <Send size={13} />
                  <span>Send Message</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </Card>
  );
}
