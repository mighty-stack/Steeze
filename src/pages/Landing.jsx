import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ProjectNav from '../components/ProjectNav.jsx';
import { Wordmark } from '../components/ui.jsx';
import HomeChatbot from '../components/HomeChatbot.jsx';
import { warmUp } from '../api/client.js';
import {
  ABOUT, HOW_IT_WORKS, PROCESS_NODES, FAQ_INTRO, FAQS, CONTACT_EMAIL,
  FOOTER_DESCRIPTION, FOOTER_LINKS, FOOTER_SOCIALS,
} from '../lib/content.js';

function SocialIcon({ name }) {
  if (name === 'instagram') {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle className="solid" cx="18" cy="6" r="1" /></svg>;
  }
  if (name === 'linkedin') {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path className="solid" d="M5.2 8.8H2.4V21h2.8V8.8ZM3.8 3a1.7 1.7 0 1 0 0 3.4 1.7 1.7 0 0 0 0-3.4ZM21.6 13.9c0-3.7-2-5.4-4.7-5.4-2.2 0-3.2 1.2-3.8 2V8.8h-2.8V21h2.8v-6.1c0-1.6.3-3.2 2.4-3.2s2.1 1.9 2.1 3.3V21h2.8l1.2-7.1Z" /></svg>;
  }
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path className="solid" d="M18.9 2H22l-6.8 7.8L23.2 22h-6.3L12 14.8 5.7 22H2.5l7.3-8.4L1.9 2h6.5l4.4 6.6L18.9 2Zm-1.1 17.9h1.7L7.4 4H5.6l12.2 15.9Z" /></svg>;
}

export default function Landing() {
  const [openFaq, setOpenFaq] = useState(null);
  const [useStaticHero, setUseStaticHero] = useState(() => (
    typeof window !== 'undefined'
    && (window.matchMedia('(max-width: 760px)').matches
      || window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  ));

  useEffect(() => {
    warmUp();
  }, []);

  useEffect(() => {
    const mobile = window.matchMedia('(max-width: 760px)');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updateHeroMedia = () => setUseStaticHero(mobile.matches || reducedMotion.matches);

    mobile.addEventListener('change', updateHeroMedia);
    reducedMotion.addEventListener('change', updateHeroMedia);
    return () => {
      mobile.removeEventListener('change', updateHeroMedia);
      reducedMotion.removeEventListener('change', updateHeroMedia);
    };
  }, []);

  return (
    <div className="landing-page">
      <ProjectNav landing />

      <main>
        <section className="landing-hero">
          <div className="landing-hero-copy">
            <h1>Brands and creators, together in one place.</h1>
            <p>Register your brand or your channel. The Clout team checks every profile before it goes live, then shares collaboration opportunities with verified members.</p>
          </div>
          <div className="landing-hero-media" aria-hidden="true">
            {useStaticHero ? (
              <img src="/hero_image.webp" alt="" />
            ) : (
              <video
                autoPlay
                muted
                loop
                playsInline
                poster="/hero_image.webp"
                src="/coverr-a-girl-presses-record-on-a-camera-and-begins-a-vlog-2609-1080p.mp4"
              />
            )}
          </div>
        </section>

        <section className="landing-pair" id="register" aria-label="Choose how you want to join">
          <article className="landing-side brand">
            <div>
              <h2>I run a brand or business</h2>
              <p>Tell us what you sell, where you operate and the kind of creators you want to work with.</p>
              <Link className="btn white" to="/register/brand">Register your brand</Link>
            </div>
          </article>

          <article className="landing-side creator">
            <div>
              <h2>I create content</h2>
              <p>Share your niche, your platforms and your audience so brands can see who you are.</p>
              <Link className="btn white" to="/register/creator">Register as a creator</Link>
            </div>
          </article>

          <div className="seam-cards" aria-hidden="true">
            <svg className="match-arc" viewBox="0 0 500 80" preserveAspectRatio="none">
              <path d="M4 65 C125 5 375 5 496 65" />
            </svg>
            <div className="sample sample-brand">
              <div className="sample-row">
                <div className="avatar b">A</div>
                <div><strong>Adaeze Skin Lab</strong><small>Beauty and personal care</small></div>
              </div>
              <div className="sample-facts">
                <span><b>Location</b>&nbsp;Lagos, Nigeria</span>
                <span><b>Looking for</b>&nbsp;Product reviews, giveaways</span>
              </div>
            </div>
            <div className="sample sample-creator">
              <div className="sample-row">
                <div className="avatar c">T</div>
                <div><strong>Tomi Cooks</strong><small>Food and home cooking</small></div>
              </div>
              <div className="sample-facts">
                <span><b>Location</b>&nbsp;Accra, Ghana</span>
                <span><b>TikTok</b>&nbsp;48,200 followers</span>
              </div>
            </div>
            <div className="match-badge">✓</div>
          </div>
        </section>

        <section className="landing-about" id="about">
          <div className="landing-about-copy">
            <h2>What Clout does</h2>
            <div>
              {ABOUT.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            </div>
          </div>
          <div className="process-diagram" aria-hidden="true">
            {PROCESS_NODES.map((node) => (
              <div className="process-node" key={node.title}>
                <div className={`process-icon ${node.tone}`}>{node.symbol}</div>
                <strong>{node.title}</strong>
                <span>{node.text}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="landing-thread">
          <h3>How joining works</h3>
          <ol className="thread-list">
            {HOW_IT_WORKS.map((step, index) => (
              <li className="thread-step" key={step.title}>
                <span className="thread-number">{index + 1}</span>
                <strong>{step.title}</strong>
                <span className="thread-copy">{step.text}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="landing-faq" id="faq" aria-labelledby="landing-faq-title">
          <h2 id="landing-faq-title">{FAQ_INTRO[0]}</h2>
          <div className="landing-faq-list">
            {FAQS.map((item, index) => {
              const isOpen = openFaq === index;
              const questionId = `landing-faq-question-${index}`;
              const answerId = `landing-faq-answer-${index}`;

              return (
                <article className={`landing-faq-item${isOpen ? ' open' : ''}`} key={item.question}>
                  <h3>
                    <button
                      id={questionId}
                      className="landing-faq-question"
                      type="button"
                      aria-expanded={isOpen}
                      aria-controls={answerId}
                      onClick={() => setOpenFaq(isOpen ? null : index)}
                    >
                      <span>{item.question}</span>
                      <span className="landing-faq-icon" aria-hidden="true" />
                    </button>
                  </h3>
                  <div
                    className={`landing-faq-answer${isOpen ? ' open' : ''}`}
                    id={answerId}
                    role="region"
                    aria-labelledby={questionId}
                    aria-hidden={!isOpen}
                    inert={!isOpen}
                  >
                    <div><p>{item.answer}</p></div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="landing-contact" id="contact" aria-labelledby="landing-contact-title">
          <div>
            <h2 id="landing-contact-title">Get in touch</h2>
            <p>Have a question about joining Clout or finding the right collaboration? Our team is happy to help.</p>
          </div>
          <a className="btn white" href={`mailto:${CONTACT_EMAIL}`}>Contact us</a>
        </section>
      </main>

      <footer className="site">
        <div className="footer-main">
          <div className="footer-brand">
            <Wordmark tone="reversed" />
            <p>{FOOTER_DESCRIPTION}</p>
          </div>
          {Object.entries(FOOTER_LINKS).map(([title, links]) => (
            <nav className="footer-links" aria-label={title} key={title}>
              <p className="footer-title">{title}</p>
              <ul>
                {links.map((link) => (
                  <li key={link.label}>
                    {link.to.startsWith('/') ? <Link to={link.to}>{link.label}</Link> : <a href={link.to}>{link.label}</a>}
                  </li>
                ))}
              </ul>
            </nav>
          ))}
          <div className="footer-follow">
            <p className="footer-title">Follow</p>
            <ul className="footer-socials" aria-label="Social media">
              {FOOTER_SOCIALS.map((social) => (
                <li key={social.icon}>
                  <a href="#" aria-label={`Follow us on ${social.label}`}>
                    <SocialIcon name={social.icon} />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>&copy; {new Date().getFullYear()} Clout</span>
          <span>Placeholder copy for design review</span>
        </div>
      </footer>
      <HomeChatbot />
    </div>
  );
}
