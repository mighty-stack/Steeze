import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { answerCloutQuestion, CHAT_SUGGESTIONS } from '../lib/chatbot.js';

const GREETING = {
  id: 'greeting',
  from: 'assistant',
  text: 'Hi! I’m the Clout guide. Ask me about joining, verification, your profile, or opportunities.',
};

const WHATSAPP_URL = 'https://wa.me/2348168053286?text=Hi%20Clout%2C%20I%20have%20a%20question.';

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
      <a className="home-chat-whatsapp" href={WHATSAPP_URL} target="_blank" rel="noreferrer">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M20.5 3.5A11.8 11.8 0 0 0 12.1 0C5.6 0 .3 5.3.3 11.8c0 2.1.6 4.1 1.6 5.9L.2 24l6.5-1.7a11.9 11.9 0 0 0 5.4 1.3h.1c6.5 0 11.8-5.3 11.8-11.8 0-3.1-1.2-6-3.5-8.3Zm-8.4 18.1h-.1a9.8 9.8 0 0 1-5-1.4l-.4-.2-3.9 1 1-3.8-.3-.4a9.8 9.8 0 0 1-1.5-5.2C1.9 6.4 6.5 1.8 12.1 1.8c2.7 0 5.2 1.1 7.1 2.9a10 10 0 0 1 2.9 7.1c0 5.4-4.5 9.8-10 9.8Zm5.5-7.4c-.3-.1-1.7-.8-2-.9-.3-.1-.5-.1-.7.2-.2.3-.7.9-.9 1.1-.2.2-.3.2-.6.1-.3-.1-1.2-.4-2.3-1.4-.8-.7-1.4-1.7-1.5-2-.2-.3 0-.4.1-.6l.5-.5c.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5l-.9-2.1c-.2-.5-.5-.4-.7-.4h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.4s1 2.8 1.1 3c.1.2 2 3.1 4.8 4.3.7.3 1.2.5 1.6.6.7.2 1.3.2 1.8.1.5-.1 1.7-.7 1.9-1.4.2-.7.2-1.3.1-1.4-.1-.1-.3-.2-.6-.4Z" />
        </svg>
        Chat on WhatsApp
      </a>
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
