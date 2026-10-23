import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { answerCloutQuestion, CHAT_SUGGESTIONS } from '../lib/chatbot.js';

const GREETING = {
  id: 'greeting',
  from: 'assistant',
  text: 'Hi! I’m the Clout guide. Ask me about joining, verification, your profile, or opportunities.',
};

export default function HomeChatbot() {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([GREETING]);
  const [announcement, setAnnouncement] = useState('');
  const inputRef = useRef(null);
  const logRef = useRef(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [messages, open]);

  const ask = (value) => {
    const text = value.trim();
    if (!text) return;
    const result = answerCloutQuestion(text);
    setMessages((current) => [
      ...current,
      { id: `${Date.now()}-question`, from: 'user', text },
      { id: `${Date.now()}-answer`, from: 'assistant', text: result.answer, links: result.links },
    ]);
    setAnnouncement(`Question: ${text}. ${result.answer}`);
    setQuestion('');
  };

  const submit = (event) => {
    event.preventDefault();
    ask(question);
  };

  return (
    <div className="home-chat">
      {open && (
        <section id="home-chat-panel" className="home-chat-panel" role="dialog" aria-labelledby="home-chat-title">
          <header className="home-chat-header">
            <div>
              <strong id="home-chat-title">Clout guide</strong>
              <span>Help with the platform</span>
            </div>
            <button type="button" className="home-chat-close" onClick={() => setOpen(false)} aria-label="Close chat">
              &times;
            </button>
          </header>

          <div className="home-chat-messages" ref={logRef} role="log" aria-live="polite" aria-relevant="additions">
            {messages.map((message) => (
              <article key={message.id} className={`home-chat-message ${message.from}`}>
                <p>{message.text}</p>
                {message.links?.length > 0 && (
                  <div className="home-chat-links">
                    {message.links.map((link) => (
                      <Link key={`${link.to}-${link.label}`} to={link.to} onClick={() => setOpen(false)}>
                        {link.label}
                      </Link>
                    ))}
                  </div>
                )}
              </article>
            ))}
            {messages.length === 1 && (
              <div className="home-chat-suggestions" aria-label="Suggested questions">
                {CHAT_SUGGESTIONS.map((suggestion) => (
                  <button type="button" key={suggestion} onClick={() => ask(suggestion)}>{suggestion}</button>
                ))}
              </div>
            )}
          </div>

          <form className="home-chat-form" onSubmit={submit}>
            <label className="sr-only" htmlFor="home-chat-question">Ask the Clout guide</label>
            <input
              id="home-chat-question"
              ref={inputRef}
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Ask a question..."
              maxLength={300}
            />
            <button type="submit" disabled={!question.trim()} aria-label="Send question">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12 20 4l-5 16-3-7-8-1Zm8 1 8-9" /></svg>
            </button>
          </form>
        </section>
      )}

      <span className="sr-only" aria-live="polite">{announcement}</span>
      <button
        type="button"
        className="home-chat-launcher"
        aria-expanded={open}
        aria-controls="home-chat-panel"
        onClick={() => setOpen((current) => !current)}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11.5a7.5 7.5 0 0 1-8 7.5 8.7 8.7 0 0 1-3.4-.7L4 20l1.3-3.7A7.2 7.2 0 0 1 4 12c0-4.1 3.6-7.5 8-7.5s8 3.1 8 7Z" /><path d="M8 12h.01M12 12h.01M16 12h.01" /></svg>
        {open ? 'Close help' : 'Ask Clout'}
      </button>
    </div>
  );
}
