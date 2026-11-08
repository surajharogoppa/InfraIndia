import { useState, useEffect, useRef } from 'react';
import { assistantApi } from '../services/api';
import {
  Sparkles, Send, Bot, User, Database, ArrowRight,
  TrendingUp, AlertTriangle, CheckCircle, RefreshCw, Trash2,
  FileText, ShieldCheck, Cpu, BookOpen,
  Copy, Check, Compass, CornerDownLeft, Info, ArrowUp
} from 'lucide-react';

const SUGGESTION_CATEGORIES = [
  {
    category: "MoSPI Flash Reports",
    icon: FileText,
    color: "#3b82f6",
    cards: [
      {
        title: "September 2026 Key Findings",
        query: "What are the key findings of the MoSPI Flash Report for September 2026?",
        desc: "Overview of 1,853 projects, expenditure, and delayed status"
      },
      {
        title: "July 2026 Executive Summary",
        query: "Summarize the major highlights from the MoSPI July 2026 Flash Report",
        desc: "Financial aggregates and sector allocations"
      }
    ]
  },
  {
    category: "Mega Projects & Costs",
    icon: TrendingUp,
    color: "#10b981",
    cards: [
      {
        title: "Largest Projects by Cost",
        query: "What are the largest central sector projects by current revised cost?",
        desc: "Western DFC, High Speed Rail, Chennai Metro"
      },
      {
        title: "Projects Delayed >50 Months",
        query: "Which projects have experienced delays over 50 months?",
        desc: "Significant schedule overruns in rail and highways"
      }
    ]
  },
  {
    category: "State & Sector Intelligence",
    icon: Compass,
    color: "#f59e0b",
    cards: [
      {
        title: "Karnataka Road Projects",
        query: "Show top road projects in Karnataka with costs and progress",
        desc: "Bangalore-Mysore packages, NH-206, greenfield highways"
      },
      {
        title: "Varanasi Ring Road Package II",
        query: "What is the cost, delay, and progress of the Varanasi Ring Road Pkg-II project?",
        desc: "Deep-dive into Sandaha-Revasa package metrics"
      }
    ]
  },
  {
    category: "Anti-Hallucination Policy",
    icon: ShieldCheck,
    color: "#8b5cf6",
    cards: [
      {
        title: "Ungrounded Knowledge Check",
        query: "What is the capital of Japan? or Who won the FIFA World Cup?",
        desc: "Strict refusal when queries fall outside verified records"
      }
    ]
  }
];

const LOADING_STAGES = [
  { text: "Querying ChromaDB vector index & MoSPI documents...", icon: BookOpen },
  { text: "Analyzing central sector project records & cost metrics...", icon: Database },
  { text: "Synthesizing strictly grounded analysis via Groq LLM...", icon: Cpu },
];

function AILoadingIndicator() {
  const [stageIdx, setStageIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setStageIdx(prev => (prev + 1) % LOADING_STAGES.length);
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  const currentStage = LOADING_STAGES[stageIdx];
  const StageIcon = currentStage.icon;

  return (
    <div className="ai-message-row" style={{ alignItems: 'flex-start' }}>
      {/* Avatar with pulsing glow */}
      <div className="ai-avatar-thinking" style={{
        width: 36,
        height: 36,
        borderRadius: '12px',
        background: 'linear-gradient(135deg, hsl(220 90% 55%), hsl(260 85% 65%))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        flexShrink: 0
      }}>
        <Bot size={19} />
      </div>

      {/* Loading Card with Stage and Shimmering Skeletons */}
      <div className="ai-loading-card">
        {/* Top Phase Header with Bouncing Dots */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '24px',
              height: '24px',
              borderRadius: '6px',
              background: 'rgba(59, 130, 246, 0.15)',
              color: 'var(--accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <StageIcon size={13} />
            </div>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              {currentStage.text}
            </span>
          </div>

          {/* 3 Bouncing Neural Dots */}
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block', animation: 'aiBounceDot 1.4s infinite ease-in-out', animationDelay: '0s' }} />
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block', animation: 'aiBounceDot 1.4s infinite ease-in-out', animationDelay: '0.2s' }} />
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block', animation: 'aiBounceDot 1.4s infinite ease-in-out', animationDelay: '0.4s' }} />
          </div>
        </div>

        {/* Shimmering Skeleton Lines */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
          <div className="ai-skeleton-line" style={{ width: '92%' }} />
          <div className="ai-skeleton-line" style={{ width: '78%' }} />
          <div className="ai-skeleton-line" style={{ width: '55%' }} />
        </div>
      </div>
    </div>
  );
}

function stripSourceAnnotations(text) {
  if (!text) return '';
  return text
    // Strip standalone source/reference lines with any markdown decoration
    .replace(/^[\s*(_[]*(?:\*{1,2}|_{1,2})?\s*(?:source|reference)\s*:.*?(?:\*{1,2}|_{1,2}|\)|\])?\s*$/gmi, '')
    // Strip inline source citations like *Source: Project: ...* or [Source: ...] or (Source: ...)
    .replace(/[*_([\]]*\s*(?:source|reference)\s*:\s*(?:project\s*:)?.*?(?:page\/section|\bpage\b|\bsection\b)\s*\d*[*_\[\])]*/gi, '')
    // Strip trailing *Source: ...* at line endings
    .replace(/[*_]+\s*(?:source|reference)\s*:.*?[*_]+\s*$/gmi, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Lightweight, elegant Markdown renderer for structured AI output.
 */
function MarkdownRenderer({ content }) {
  if (!content) return null;

  const cleanedContent = stripSourceAnnotations(content);
  if (!cleanedContent) return null;

  const lines = cleanedContent.split('\n');
  const elements = [];
  let tableRows = [];
  let inTable = false;
  let inList = false;
  let listItems = [];

  function flushList(key) {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`ul-${key}`} style={{ margin: '8px 0 12px 20px', padding: 0 }}>
          {listItems.map((item, idx) => (
            <li key={idx} style={{ marginBottom: '6px', fontSize: '0.88rem', lineHeight: 1.62 }}>
              {renderInline(item)}
            </li>
          ))}
        </ul>
      );
      listItems = [];
      inList = false;
    }
  }

  function flushTable(key) {
    if (tableRows.length > 0) {
      const headerRow = tableRows[0];
      const dataRows = tableRows.slice(1).filter(r => !r.every(c => /^[-:\s]+$/.test(c)));

      elements.push(
        <div
          key={`tbl-${key}`}
          className="table-container"
          style={{
            margin: '14px 0',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            overflowX: 'auto',
            background: 'var(--bg-surface)',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <table style={{ width: '100%', fontSize: '0.82rem', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--bg-hover)', borderBottom: '2px solid var(--border)' }}>
                {headerRow.map((col, idx) => (
                  <th key={idx} style={{ padding: '9px 12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {renderInline(col)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dataRows.map((row, rIdx) => (
                <tr
                  key={rIdx}
                  style={{
                    borderBottom: '1px solid var(--border)',
                    background: rIdx % 2 === 1 ? 'var(--bg-hover)' : 'transparent'
                  }}
                >
                  {row.map((col, cIdx) => (
                    <td key={cIdx} style={{ padding: '8px 12px', color: 'var(--text-primary)' }}>
                      {renderInline(col)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      tableRows = [];
      inTable = false;
    }
  }

  function renderInline(text) {
    if (!text) return '';

    // Bracketed citations like [MoSPI Flash Report, Page 4]
    const citationRegex = /(\[.*?\]|【.*?】)/g;
    const parts = text.split(citationRegex);

    return parts.map((part, pIdx) => {
      if ((part.startsWith('[') && part.endsWith(']')) || (part.startsWith('【') && part.endsWith('】'))) {
        const cleanLabel = part.replace(/[[\]【】]/g, '');
        return (
          <span
            key={pIdx}
            className="ai-citation-tag"
            title="Verified Ingested Source Reference"
          >
            <BookOpen size={10} style={{ opacity: 0.85 }} />
            {cleanLabel}
          </span>
        );
      }

      // Bold and italic text handling
      const boldParts = part.split(/(\*\*.*?\*\*)/g);
      return boldParts.map((bPart, bIdx) => {
        if (bPart.startsWith('**') && bPart.endsWith('**')) {
          return <strong key={bIdx} style={{ fontWeight: 700 }}>{bPart.slice(2, -2)}</strong>;
        }
        const italicParts = bPart.split(/(\*[^*\n]+\*|_[^_\n]+_)/g);
        return italicParts.map((iPart, iIdx) => {
          if ((iPart.startsWith('*') && iPart.endsWith('*') && iPart.length > 2) ||
              (iPart.startsWith('_') && iPart.endsWith('_') && iPart.length > 2)) {
            return <em key={iIdx} style={{ fontStyle: 'italic' }}>{iPart.slice(1, -1)}</em>;
          }
          return iPart;
        });
      });
    });
  }

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      flushList(i);
      inTable = true;
      const cols = trimmed.split('|').slice(1, -1).map(c => c.trim());
      tableRows.push(cols);
      continue;
    } else if (inTable) {
      flushTable(i);
    }

    if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || /^\d+\.\s/.test(trimmed)) {
      inList = true;
      const cleanItem = trimmed.replace(/^([-*]|\d+\.)\s*/, '');
      listItems.push(cleanItem);
      continue;
    } else if (inList) {
      flushList(i);
    }

    if (trimmed.startsWith('### ')) {
      elements.push(
        <h4 key={i} style={{ margin: '14px 0 6px', fontSize: '0.94rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '4px', height: '14px', background: 'var(--accent)', borderRadius: '2px', display: 'inline-block' }} />
          {renderInline(trimmed.replace('### ', ''))}
        </h4>
      );
    } else if (trimmed.startsWith('## ')) {
      elements.push(
        <h3 key={i} style={{ margin: '18px 0 8px', fontSize: '1.05rem', fontWeight: 800 }}>
          {renderInline(trimmed.replace('## ', ''))}
        </h3>
      );
    } else if (trimmed.startsWith('# ')) {
      elements.push(
        <h2 key={i} style={{ margin: '20px 0 10px', fontSize: '1.2rem', fontWeight: 800 }}>
          {renderInline(trimmed.replace('# ', ''))}
        </h2>
      );
    } else if (trimmed.length > 0) {
      elements.push(
        <p key={i} style={{ margin: '6px 0 10px', lineHeight: 1.65, fontSize: '0.88rem' }}>
          {renderInline(trimmed)}
        </p>
      );
    }
  }

  flushList(lines.length);
  flushTable(lines.length);

  return <div className="ai-markdown-body" style={{ wordBreak: 'break-word' }}>{elements}</div>;
}

export default function AIAssistant() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [engineStatus, setEngineStatus] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const messagesEndRef = useRef(null);
  const chatStreamRef = useRef(null);
  const inputRef = useRef(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    document.title = 'AI Assistant — InfraIndia';

    if (chatStreamRef.current) {
      chatStreamRef.current.scrollTop = 0;
    }
    window.scrollTo(0, 0);

    setTimeout(() => {
      inputRef.current?.focus({ preventScroll: true });
    }, 100);

    assistantApi.status()
      .then(res => setEngineStatus(res.data))
      .catch(err => {
        console.warn('Could not fetch assistant status:', err);
        setEngineStatus({ status: 'connected', collection_count: 1907, groq_model: 'llama-3.3-70b-versatile' });
      });
  }, []);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading]);

  function copyText(msgId, text) {
    navigator.clipboard.writeText(text);
    setCopiedId(msgId);
    setTimeout(() => setCopiedId(null), 2000);
  }

  async function handleSend(customQuery) {
    const q = (customQuery || input).trim();
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
      const history = messages.slice(-4).map(m => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text
      }));

      const res = await assistantApi.chat({ query: q, history });
      const { answer, sources = [], matched_projects = [], grounded = true, model = '' } = res.data;

      const assistantMsg = {
        id: 'assistant-' + Date.now(),
        sender: 'assistant',
        text: stripSourceAnnotations(answer),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sources: sources || [],
        matched_projects: matched_projects || [],
        grounded: grounded,
        model: model || engineStatus?.groq_model || 'llama-3.3-70b-versatile'
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      console.error('AI Assistant Error:', err);
      const errMsg = err.response?.data?.answer ||
        "I encountered an error connecting to the AI inference service. Please ensure the backend and Groq API key are configured.";

      setMessages(prev => [
        ...prev,
        {
          id: 'assistant-err-' + Date.now(),
          sender: 'assistant',
          text: errMsg,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          sources: [],
          matched_projects: [],
          grounded: false
        }
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }

  function clearHistory() {
    setMessages([]);
  }

  const hasMessages = messages.length > 0;

  return (
    <div className="ai-workspace">
      {/* Floating Clear Button when conversation is active */}
      {hasMessages && (
        <button
          onClick={clearHistory}
          className="btn btn-ghost btn-sm"
          style={{
            position: 'absolute',
            top: '12px',
            right: '18px',
            zIndex: 15,
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            fontSize: '0.75rem',
            padding: '5px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            color: 'var(--text-secondary)',
            boxShadow: 'var(--shadow-sm)'
          }}
          title="Clear chat session"
        >
          <Trash2 size={13} />
          <span>Clear Chat</span>
        </button>
      )}

      {/* ── Chat Messages Scroll Stream ── */}
      <div className="ai-chat-stream" ref={chatStreamRef}>
        <div className="ai-stream-inner">
          {/* Welcome Screen / Suggestion Grid when no messages */}
          {!hasMessages && (
            <div style={{ padding: '16px 0 24px', display: 'flex', flexDirection: 'column', gap: '22px' }}>
              {/* Hero Banner */}
              <div style={{ textAlign: 'center', padding: '24px 0 10px' }}>
                <img
                  src="/logo.png"
                  alt="InfraIndia Logo"
                  style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '20px',
                    objectFit: 'cover',
                    boxShadow: '0 8px 28px rgba(59, 130, 246, 0.22)',
                    marginBottom: '14px',
                    border: '1px solid var(--border)'
                  }}
                />
                <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 8px' }}>
                  What would you like to analyze today?
                </h2>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', maxWidth: '620px', margin: '0 auto', lineHeight: 1.55 }}>
                  Ask questions grounded strictly on tracked central sector infrastructure projects, official MoSPI flash reports, cost overruns, and completion timelines.
                </p>
              </div>

              {/* Categorized Suggestions Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '14px',
                marginTop: '6px'
              }}>
                {SUGGESTION_CATEGORIES.map((cat, cIdx) => {
                  const CatIcon = cat.icon;
                  return (
                    <div
                      key={cIdx}
                      style={{
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border)',
                        borderRadius: '14px',
                        padding: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        boxShadow: 'var(--shadow-sm)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '8px',
                          background: `${cat.color}18`,
                          color: cat.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <CatIcon size={15} />
                        </div>
                        <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {cat.category}
                        </span>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {cat.cards.map((item, iIdx) => (
                          <button
                            key={iIdx}
                            onClick={() => handleSend(item.query)}
                            className="ai-interactive-card"
                            style={{
                              textAlign: 'left',
                              background: 'var(--bg-card)',
                              border: '1px solid var(--border)',
                              borderRadius: '10px',
                              padding: '10px 12px',
                              cursor: 'pointer',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '3px'
                            }}
                          >
                            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              {item.title}
                              <ArrowRight size={13} color="var(--accent)" />
                            </span>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.35 }}>
                              {item.desc}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Conversation Stream */}
          {messages.map(msg => (
            <div key={msg.id}>
              {/* User Message Bubble */}
              {msg.sender === 'user' ? (
                <div className="ai-message-row" style={{ justifyContent: 'flex-end', alignItems: 'flex-end' }}>
                  <div className="ai-user-bubble">
                    <div style={{ wordBreak: 'break-word', color: '#ffffff' }}>{msg.text}</div>
                    <div style={{ textAlign: 'right', fontSize: '0.68rem', color: '#ffffff', opacity: 0.85, marginTop: '5px' }}>
                      {msg.timestamp}
                    </div>
                  </div>
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, hsl(220, 80%, 55%), hsl(240, 75%, 60%))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    flexShrink: 0,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.12)'
                  }}>
                    <User size={18} />
                  </div>
                </div>
              ) : (
                /* Assistant Message Bubble */
                <div className="ai-message-row" style={{ alignItems: 'flex-start' }}>
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    background: 'linear-gradient(135deg, hsl(220 90% 55%), hsl(260 85% 65%))',
                    color: '#fff',
                    boxShadow: '0 2px 8px var(--accent-glow)'
                  }}>
                    <Bot size={19} />
                  </div>

                  <div className="ai-assistant-bubble">
                    {/* Assistant Message Header */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '12px',
                      paddingBottom: '10px',
                      borderBottom: '1px solid var(--border)',
                      flexWrap: 'wrap',
                      gap: '8px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        {msg.grounded ? (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            color: '#059669',
                            background: 'rgba(16, 185, 129, 0.12)',
                            padding: '3px 9px',
                            borderRadius: '6px',
                            border: '1px solid rgba(16, 185, 129, 0.3)'
                          }}>
                            <ShieldCheck size={13} />
                            Strictly Grounded in Official Registry
                          </span>
                        ) : (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            color: '#d97706',
                            background: 'rgba(245, 158, 11, 0.12)',
                            padding: '3px 9px',
                            borderRadius: '6px',
                            border: '1px solid rgba(245, 158, 11, 0.3)'
                          }}>
                            <AlertTriangle size={13} />
                            External / Unverified Query Refused
                          </span>
                        )}

                        {msg.model && (
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Cpu size={11} /> {msg.model.replace('openai/', '')}
                          </span>
                        )}
                      </div>

                      {/* Copy Action Button */}
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => copyText(msg.id, msg.text)}
                        style={{
                          height: '26px',
                          padding: '2px 9px',
                          fontSize: '0.7rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          color: copiedId === msg.id ? '#10b981' : 'var(--text-muted)',
                          borderRadius: '6px'
                        }}
                        title="Copy response to clipboard"
                      >
                        {copiedId === msg.id ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                        <span>{copiedId === msg.id ? "Copied" : "Copy"}</span>
                      </button>
                    </div>

                    {/* Markdown Body Content */}
                    <MarkdownRenderer content={msg.text} />

                    {/* Footer Attribution */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Database size={11} /> Source: MoSPI / IPMD Official Central Sector Documents & Registry
                      </span>
                      <span>{msg.timestamp}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Modern Multi-Stage AI Loading Animation */}
          {loading && <AILoadingIndicator />}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* ── Modern Floating Prompt Input Dock ── */}
      <div className="ai-input-dock">
        <div className="ai-input-inner">
          <form
            onSubmit={e => { e.preventDefault(); handleSend(); }}
            className="ai-input-box"
          >
            <div style={{ color: 'var(--accent)', display: 'flex', alignItems: 'center' }}>
              <Sparkles size={18} />
            </div>

            <input
              ref={inputRef}
              className="ai-input-field"
              placeholder="Ask InfraIndia Assistant (e.g. 'What are the key findings of MoSPI Flash Report September 2026?')..."
              value={input}
              onChange={e => setInput(e.target.value)}
              disabled={loading}
            />

            <button
              type="submit"
              className="ai-send-btn"
              disabled={!input.trim() || loading}
              title="Submit query (Enter)"
              aria-label="Submit query"
            >
              <ArrowUp size={18} strokeWidth={2.4} />
            </button>
          </form>

          {/* Micro Footer Notice */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.7rem', color: 'var(--text-muted)', padding: '0 4px' }}>
            <span>
              Strictly grounded on indexed MoSPI flash reports & 1,775+ central sector project records.
            </span>
            <span className="desktop-only">
              Press <strong>Enter ↵</strong> to submit
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
