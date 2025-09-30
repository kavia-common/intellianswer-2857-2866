import React, { useEffect, useMemo, useRef, useState } from 'react';
import './App.css';

/**
 * PUBLIC_INTERFACE
 * Root application for the Q&A SPA.
 * Provides an Ocean Professional themed interface with sidebar, header, chat/Q&A area, and session history.
 */
function App() {
  const [sessions, setSessions] = useState(() => MockStorage.loadSessions());
  const [activeSessionId, setActiveSessionId] = useState(() => sessions[0]?.id || null);
  const [question, setQuestion] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [authUser, setAuthUser] = useState(() => MockStorage.loadAuth());
  const [search, setSearch] = useState('');

  // Sync to mock storage
  useEffect(() => {
    MockStorage.saveSessions(sessions);
  }, [sessions]);

  useEffect(() => {
    MockStorage.saveAuth(authUser);
  }, [authUser]);

  const activeSession = useMemo(
    () => sessions.find(s => s.id === activeSessionId) || null,
    [sessions, activeSessionId]
  );

  // Create initial session if none
  useEffect(() => {
    if (!activeSession) {
      const newS = createNewSession();
      setSessions(prev => [newS, ...prev]);
      setActiveSessionId(newS.id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function createNewSession(title = 'New Session') {
    return {
      id: `sess_${Date.now()}`,
      title,
      createdAt: new Date().toISOString(),
      messages: []
    };
  }

  // PUBLIC_INTERFACE
  async function handleSend() {
    if (!question.trim() || !activeSession) return;
    setIsSending(true);
    const userMsg = { id: `m_${Date.now()}`, role: 'user', content: question.trim(), createdAt: new Date().toISOString() };

    try {
      // Optimistically add question
      updateActiveSessionMessages(d => [...d, userMsg]);
      setQuestion('');

      // Call backend (mocked)
      const response = await ApiClient.askQuestion({
        sessionId: activeSession.id,
        question: userMsg.content,
        user: authUser
      });

      const assistantMsg = {
        id: `m_${Date.now()}_asst`,
        role: 'assistant',
        content: response.answer,
        createdAt: new Date().toISOString()
      };
      updateActiveSessionMessages(d => [...d, assistantMsg]);

      // Update session title if it's the first message
      if ((activeSession.messages?.length || 0) === 0) {
        setSessions(prev => prev.map(s => s.id === activeSession.id ? { ...s, title: truncateTitle(userMsg.content) } : s));
      }
    } catch (e) {
      const errMsg = {
        id: `m_${Date.now()}_err`,
        role: 'assistant',
        content: `Error: ${e.message || 'Unable to get answer.'}`,
        createdAt: new Date().toISOString(),
        error: true
      };
      updateActiveSessionMessages(d => [...d, errMsg]);
    } finally {
      setIsSending(false);
    }
  }

  function truncateTitle(text, len = 42) {
    return text.length > len ? `${text.slice(0, len)}…` : text;
  }

  function updateActiveSessionMessages(updater) {
    setSessions(prev => prev.map(s => {
      if (s.id !== activeSessionId) return s;
      const messages = updater(s.messages || []);
      return { ...s, messages };
    }));
  }

  function handleNewSession() {
    const s = createNewSession();
    setSessions(prev => [s, ...prev]);
    setActiveSessionId(s.id);
  }

  function handleDeleteSession(id) {
    setSessions(prev => prev.filter(s => s.id !== id));
    if (activeSessionId === id) {
      setActiveSessionId(prev => (sessions.find(s => s.id !== id)?.id || null));
    }
  }

  function handleAuthToggle() {
    if (authUser) {
      setAuthUser(null);
    } else {
      // Mock sign in
      setAuthUser({ id: 'user_1', name: 'Ocean Pro', email: 'ocean.pro@example.com' });
    }
  }

  const filteredSessions = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return sessions;
    return sessions.filter(s =>
      s.title.toLowerCase().includes(q) ||
      (s.messages || []).some(m => (m.content || '').toLowerCase().includes(q))
    );
  }, [sessions, search]);

  return (
    <div className="app-shell" aria-label="Ocean Professional Q&A App">
      <aside className="sidebar" aria-label="Sidebar">
        <div className="brand" aria-label="Brand">
          <span className="brand-mark" aria-hidden>🌊</span>
          <div>
            Ocean Q&A
            <div className="text-muted" style={{ fontSize: 12 }}>Professional</div>
          </div>
        </div>

        <div className="nav" role="navigation" aria-label="Primary">
          <button className="button secondary" onClick={handleNewSession} aria-label="Start a new session">
            ➕ New Session
          </button>
          <button className="button ghost" aria-label="Shortcuts">⌘K Command Palette</button>
        </div>

        <div className="sidebar-card" aria-label="Tips">
          <div className="badge">Tip</div>
          <div style={{ marginTop: 8, fontSize: 13, color: 'var(--color-muted)' }}>
            Use clear, concise questions for better answers. Add context like examples or constraints.
          </div>
        </div>
      </aside>

      <header className="header" aria-label="Top header">
        <div className="header-left">
          <div className="search" role="search">
            <span className="search-icon" aria-hidden>🔎</span>
            <input
              className="input"
              type="search"
              placeholder="Search sessions or content…"
              aria-label="Search"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="badge" aria-label="Model">Model <span>GPT‑5</span></div>
        </div>
        <div className="header-right">
          <button
            className="button secondary"
            onClick={() => alert('Settings panel is not implemented in this mock.')}
            aria-label="Settings"
          >
            ⚙️ Settings
          </button>
          <button
            className="button"
            onClick={handleAuthToggle}
            aria-label={authUser ? 'Sign out' : 'Sign in'}
          >
            {authUser ? `Sign out (${authUser.name})` : 'Sign in'}
          </button>
        </div>
      </header>

      <main className="main" aria-label="Main content">
        <section className="chat-card" aria-label="Chat area">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <strong>{activeSession?.title || 'New Session'}</strong>
              <span className="text-muted" style={{ fontSize: 12 }}>
                {activeSession?.messages?.length || 0} messages
              </span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="button secondary"
                onClick={() => {
                  if (!activeSession) return;
                  const title = prompt('Rename session title', activeSession.title);
                  if (title && title.trim()) {
                    setSessions(prev => prev.map(s => s.id === activeSession.id ? { ...s, title: title.trim() } : s));
                  }
                }}
                aria-label="Rename session"
              >
                ✏️ Rename
              </button>
              <button
                className="button secondary"
                onClick={() => activeSession && handleDeleteSession(activeSession.id)}
                aria-label="Delete session"
              >
                🗑️ Delete
              </button>
            </div>
          </div>

          <MessageList messages={activeSession?.messages || []} />

          <Composer
            value={question}
            onChange={setQuestion}
            onSend={handleSend}
            isSending={isSending}
          />
        </section>

        <aside className="history-card" aria-label="Session history">
          <div className="card-header">
            <strong>History</strong>
            <span className="text-muted" style={{ fontSize: 12 }}>{filteredSessions.length} sessions</span>
          </div>
          <div className="card-body">
            <div className="history-list" role="list" aria-label="Sessions">
              {filteredSessions.map(s => (
                <button
                  key={s.id}
                  className={`session-item ${s.id === activeSessionId ? 'active' : ''}`}
                  onClick={() => setActiveSessionId(s.id)}
                  role="listitem"
                  aria-label={`Open session: ${s.title}`}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <div style={{ fontWeight: 600 }}>{s.title}</div>
                    <div className="text-muted" style={{ fontSize: 12 }}>
                      {(s.messages || []).length}
                    </div>
                  </div>
                  <div className="text-muted" style={{ fontSize: 12, marginTop: 4 }}>
                    {new Date(s.createdAt).toLocaleString()}
                  </div>
                </button>
              ))}
              {filteredSessions.length === 0 && (
                <div className="text-muted" style={{ fontSize: 14 }}>No sessions found.</div>
              )}
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}

/**
 * PUBLIC_INTERFACE
 * MessageList renders chat messages with role badges and content.
 */
function MessageList({ messages }) {
  const endRef = useRef(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="card-body">
      <div className="messages" aria-live="polite">
        {messages.map(m => (
          <div key={m.id} className={`message ${m.role} ${m.error ? 'error' : ''}`}>
            <div className="role">{m.role === 'user' ? 'You' : 'Assistant'}</div>
            <div className="content">{m.content}</div>
          </div>
        ))}
        <div ref={endRef} />
        {messages.length === 0 && (
          <EmptyState />
        )}
      </div>
    </div>
  );
}

/**
 * PUBLIC_INTERFACE
 * Composer holds the input textarea and send button for posting a question.
 */
function Composer({ value, onChange, onSend, isSending }) {
  const taRef = useRef(null);

  function handleKeyDown(e) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      onSend();
    }
  }

  return (
    <div className="composer" aria-label="Composer">
      <label htmlFor="question" className="visually-hidden">Your question</label>
      <textarea
        id="question"
        ref={taRef}
        className="input textarea"
        placeholder="Ask a question… (Press ⌘ Enter to send)"
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        rows={2}
      />
      <button
        className="button"
        onClick={onSend}
        disabled={isSending || !value.trim()}
        aria-disabled={isSending || !value.trim()}
        aria-busy={isSending}
        aria-label="Send question"
        title="Send (⌘ Enter)"
        style={{ minWidth: 100 }}
      >
        {isSending ? 'Sending…' : 'Send'}
      </button>
    </div>
  );
}

/**
 * Empty state displayed when no messages exist.
 */
function EmptyState() {
  return (
    <div style={{
      display: 'grid',
      placeItems: 'center',
      padding: 24,
      color: 'var(--color-muted)'
    }}>
      <div style={{
        display: 'grid',
        justifyItems: 'center',
        gap: 8
      }}>
        <div className="brand-mark" aria-hidden>💬</div>
        <div style={{ fontWeight: 700 }}>Start a conversation</div>
        <div style={{ fontSize: 13 }}>Ask about anything. Include details for better context.</div>
      </div>
    </div>
  );
}

/**
 * Mock API client implementing required REST shape.
 * Replace baseUrl with environment variable when backend is available.
 */
const ApiClient = {
  // PUBLIC_INTERFACE
  async askQuestion({ sessionId, question, user }) {
    // Example REST call structure (mocked)
    // const res = await fetch(`${process.env.REACT_APP_API_URL}/sessions/${sessionId}/query`, { method: 'POST', ... })
    await delay(650);
    // Mock "intelligent" response
    const canned = [
      'Here’s a concise explanation:',
      'Key points to consider:',
      'An example implementation could be:',
      'Potential pitfalls include:',
      'Recommended next steps:'
    ];
    const pick = canned[Math.floor(Math.random() * canned.length)];
    return {
      answer: `${pick}\n\n• ${synthesize(question)}\n• Use clear structure and types\n• Handle errors and edge cases\n\n— Ocean Assistant`
    };
  },

  // PUBLIC_INTERFACE
  async listSessions() {
    await delay(200);
    return MockStorage.loadSessions();
  },

  // PUBLIC_INTERFACE
  async createSession(title = 'New Session') {
    await delay(200);
    const s = {
      id: `sess_${Date.now()}`,
      title,
      createdAt: new Date().toISOString(),
      messages: []
    };
    const existing = MockStorage.loadSessions();
    MockStorage.saveSessions([s, ...existing]);
    return s;
  }
};

function delay(ms) {
  return new Promise(res => setTimeout(res, ms));
}

function synthesize(text) {
  const t = text.trim();
  if (!t) return 'Ask a specific question to get a specific answer.';
  const words = t.split(/\s+/);
  return words.length > 12 ? `${words.slice(0, 12).join(' ')}…` : t;
}

/**
 * Simple persistent storage using localStorage to mock backend state.
 */
const MockStorage = {
  key: 'ocean_sessions_v1',
  authKey: 'ocean_auth_v1',
  // PUBLIC_INTERFACE
  loadSessions() {
    try {
      const raw = localStorage.getItem(this.key);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },
  // PUBLIC_INTERFACE
  saveSessions(sessions) {
    try {
      localStorage.setItem(this.key, JSON.stringify(sessions));
    } catch {
      // ignore
    }
  },
  // PUBLIC_INTERFACE
  loadAuth() {
    try {
      const raw = localStorage.getItem(this.authKey);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },
  // PUBLIC_INTERFACE
  saveAuth(user) {
    try {
      if (user) localStorage.setItem(this.authKey, JSON.stringify(user));
      else localStorage.removeItem(this.authKey);
    } catch {
      // ignore
    }
  }
};

export default App;
