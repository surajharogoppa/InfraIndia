import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectsApi, analyticsApi } from '../services/api';
import { formatCrore, formatPercent, statusBadgeClass, statusLabel } from '../utils/format';
import { Card } from '../components/ui/Card';
import Breadcrumbs from '../components/common/Breadcrumbs';
import {
  Sparkles, Send, Bot, User, Database, ArrowRight,
  TrendingUp, AlertTriangle, CheckCircle, RefreshCw, Trash2, HelpCircle
} from 'lucide-react';

const SUGGESTED_PROMPTS = [
  "Show Karnataka road projects above ₹500 crore",
  "Projects above ₹1,000 crore",
  "What are the most delayed projects?",
  "Compare road and railway projects",
  "Show top projects in Maharashtra",
  "Projects with high progress (>80%)"
];

export default function AIAssistant() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'assistant',
      text: "Hello! I am the **InfraIndia Intelligence Assistant**. You can ask me natural-language questions about central sector infrastructure projects, cost escalations, state distributions, or physical progress across India.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      data: null,
      stats: null
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    document.title = 'AI Assistant — InfraIndia';
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function handleSend(queryText) {
    const q = (queryText || input).trim();
    if (!q || loading) return;

    const userMsg = {
      id: 'user-' + Date.now(),
      sender: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // Natural language intelligence extraction
      const lower = q.toLowerCase();
      let stateParam = '';
      let sectorParam = '';
      let minCost = '';
      let progressMin = '';
      let searchParam = '';

      // State matching
      if (lower.includes('karnataka')) stateParam = 'Karnataka';
      else if (lower.includes('maharashtra')) stateParam = 'Maharashtra';
      else if (lower.includes('gujarat')) stateParam = 'Gujarat';
      else if (lower.includes('uttar pradesh')) stateParam = 'Uttar Pradesh';
      else if (lower.includes('tamil nadu')) stateParam = 'Tamil Nadu';
      else if (lower.includes('delhi')) stateParam = 'Delhi';
      else if (lower.includes('bihar')) stateParam = 'Bihar';

      // Sector matching
      if (lower.includes('road') || lower.includes('highway')) sectorParam = 'Road Transport and Highways';
      else if (lower.includes('rail') || lower.includes('railway') || lower.includes('train')) sectorParam = 'Railways';
      else if (lower.includes('power') || lower.includes('energy') || lower.includes('solar')) sectorParam = 'Power';
      else if (lower.includes('petroleum') || lower.includes('gas') || lower.includes('oil')) sectorParam = 'Petroleum';
      else if (lower.includes('telecom')) sectorParam = 'Telecommunications';
      else if (lower.includes('urban') || lower.includes('metro')) sectorParam = 'Urban Development';

      // Cost extraction
      const costMatch = lower.match(/(\d+[\d,]*)\s*(?:cr|crore)/i);
      if (costMatch) {
        minCost = costMatch[1].replace(/,/g, '');
      } else if (lower.includes('1000') || lower.includes('1,000')) {
        minCost = '1000';
      } else if (lower.includes('500')) {
        minCost = '500';
      }

      // Progress extraction
      if (lower.includes('>80%') || lower.includes('80%') || lower.includes('high progress')) {
        progressMin = '80';
      }

      // Fetch projects matching query
      const params = { page_size: 6 };
      if (stateParam) params.state = stateParam;
      if (sectorParam) params.sector = sectorParam;
      if (minCost) params.min_cost = minCost;
      if (progressMin) params.progress_min = progressMin;
      if (!stateParam && !sectorParam && !minCost && !progressMin) {
        params.search = q.replace(/show|list|projects|about|find|tell me|give me/gi, '').trim();
      }

      const res = await projectsApi.list(params);
      const projectList = res.data.results || res.data || [];
      const totalFound = res.data.count || projectList.length;

      // Calculate stats
      const totalCost = projectList.reduce((acc, p) => acc + (parseFloat(p.current_cost_crore) || 0), 0);
      const avgProg = projectList.length > 0
        ? (projectList.reduce((acc, p) => acc + (parseFloat(p.current_progress) || 0), 0) / projectList.length).toFixed(1)
        : null;

      let answerText = '';
      if (projectList.length > 0) {
        let criteria = [];
        if (stateParam) criteria.push(`in **${stateParam}**`);
        if (sectorParam) criteria.push(`in the **${sectorParam}** sector`);
        if (minCost) criteria.push(`with cost ≥ **₹${minCost} Cr**`);
        if (progressMin) criteria.push(`with progress ≥ **${progressMin}%**`);

        answerText = `Found **${totalFound} projects** ${criteria.join(' ')}. Here are the top central sector projects tracked by the platform:`;
      } else {
        answerText = `No projects directly matched the specific criteria in your query ("${q}"). Try searching by a specific state (e.g. Karnataka, Gujarat), sector (e.g. Roads, Railways), or adjusting cost thresholds.`;
      }

      const assistantMsg = {
        id: 'assistant-' + Date.now(),
        sender: 'assistant',
        text: answerText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        data: projectList.length > 0 ? projectList : null,
        stats: projectList.length > 0 ? {
          totalCount: totalFound,
          sampleCost: totalCost,
          avgProgress: avgProg
        } : null
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [
        ...prev,
        {
          id: 'assistant-err-' + Date.now(),
          sender: 'assistant',
          text: "I encountered an error querying the central project registry. Please ensure the backend API is running and try again.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  }

  function clearHistory() {
    setMessages([
      {
        id: 'welcome',
        sender: 'assistant',
        text: "Conversation cleared. How can I assist your infrastructure research today?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        data: null,
        stats: null
      }
    ]);
  }

  return (
    <div className="page-body" style={{ maxWidth: '1080px', margin: '0 auto', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)' }}>
      <Breadcrumbs />
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--gap)' }}>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={20} color="var(--accent)" />
            InfraIndia Assistant
          </h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
            AI-powered semantic querying and intelligence over MoSPI central sector infrastructure data
          </p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={clearHistory} title="Clear conversation">
          <Trash2 size={14} /> Clear
        </button>
      </div>

      {/* Suggested Prompts Pills */}
      <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '8px', marginBottom: 'var(--gap-sm)' }}>
        {SUGGESTED_PROMPTS.map((prompt, i) => (
          <button
            key={i}
            className="btn btn-ghost btn-sm"
            style={{
              fontSize: '0.75rem',
              whiteSpace: 'nowrap',
              border: '1px solid var(--border)',
              background: 'var(--bg-surface)',
              borderRadius: '999px',
              padding: '4px 12px'
            }}
            onClick={() => handleSend(prompt)}
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Chat Area */}
      <Card style={{ flex: 1, overflowY: 'auto', padding: 'var(--gap)', display: 'flex', flexDirection: 'column', gap: 'var(--gap-md)', marginBottom: 'var(--gap)' }}>
        {messages.map(msg => (
          <div
            key={msg.id}
            style={{
              display: 'flex',
              gap: '12px',
              alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: msg.sender === 'user' ? '80%' : '100%',
              flexDirection: msg.sender === 'user' ? 'row-reverse' : 'row'
            }}
          >
            {/* Avatar */}
            <div style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              background: msg.sender === 'user' ? 'var(--accent)' : 'var(--bg-hover)',
              color: msg.sender === 'user' ? '#fff' : 'var(--accent)'
            }}>
              {msg.sender === 'user' ? <User size={16} /> : <Bot size={18} />}
            </div>

            {/* Bubble */}
            <div style={{
              background: msg.sender === 'user' ? 'var(--accent)' : 'var(--bg-card)',
              color: msg.sender === 'user' ? '#fff' : 'var(--text-primary)',
              border: msg.sender === 'user' ? 'none' : '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding: '12px 16px',
              boxShadow: 'var(--shadow-sm)',
              width: msg.data ? '100%' : 'auto'
            }}>
              <div style={{ fontSize: '0.85rem', lineHeight: 1.5, marginBottom: msg.data ? 'var(--gap-sm)' : 0 }}>
                {msg.text.split('**').map((part, idx) => idx % 2 === 1 ? <strong key={idx}>{part}</strong> : part)}
              </div>

              {/* Stats badges */}
              {msg.stats && (
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', margin: '10px 0', padding: '8px 12px', background: 'var(--bg-hover)', borderRadius: 'var(--radius)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    Total Found: <strong style={{ color: 'var(--text-primary)' }}>{msg.stats.totalCount}</strong>
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    Cost (Top sample): <strong style={{ color: 'var(--text-primary)' }}>{formatCrore(msg.stats.sampleCost)}</strong>
                  </span>
                  {msg.stats.avgProgress && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      Avg Progress: <strong style={{ color: 'var(--text-primary)' }}>{msg.stats.avgProgress}%</strong>
                    </span>
                  )}
                </div>
              )}

              {/* Data Table */}
              {msg.data && msg.data.length > 0 && (
                <div className="table-container" style={{ margin: '12px 0 6px', border: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Project</th>
                        <th>State</th>
                        <th>Sector</th>
                        <th>Cost</th>
                        <th>Progress</th>
                        <th>Status</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {msg.data.map(p => (
                        <tr key={p.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/projects/${p.id}`)}>
                          <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</td>
                          <td style={{ fontSize: '0.8rem' }}>{p.state_name || '—'}</td>
                          <td>
                            {p.sector_name ? <span className="badge badge-sector">{p.sector_name}</span> : '—'}
                          </td>
                          <td style={{ fontWeight: 600 }}>{formatCrore(p.current_cost_crore)}</td>
                          <td>{p.current_progress != null ? `${p.current_progress}%` : '—'}</td>
                          <td>
                            <span className={`badge ${statusBadgeClass(p.platform_status)}`}>
                              {statusLabel(p.platform_status)}
                            </span>
                          </td>
                          <td>
                            <span style={{ color: 'var(--accent)', display: 'flex', alignItems: 'center' }}>
                              <ArrowRight size={14} />
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Attribution */}
              {msg.sender === 'assistant' && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Database size={11} /> Source: MoSPI / IPMD Official Central Sector Flash Reports
                  </span>
                  <span>{msg.timestamp}</span>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
              <Bot size={18} />
            </div>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              <RefreshCw size={14} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
              Querying central infrastructure data...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </Card>

      {/* Input box */}
      <form
        onSubmit={e => { e.preventDefault(); handleSend(); }}
        style={{ display: 'flex', gap: '8px', position: 'relative' }}
      >
        <input
          className="search-input"
          style={{ flex: 1, padding: '10px 14px', borderRadius: 'var(--radius)', fontSize: '0.85rem' }}
          placeholder="Ask InfraIndia Assistant (e.g. 'Show railway projects in Gujarat above ₹1000 crore')..."
          value={input}
          onChange={e => setInput(e.target.value)}
          disabled={loading}
        />
        <button
          type="submit"
          className="btn btn-primary"
          style={{ padding: '0 18px', display: 'flex', alignItems: 'center', gap: 6 }}
          disabled={!input.trim() || loading}
        >
          <Send size={15} />
          <span>Ask</span>
        </button>
      </form>
    </div>
  );
}
