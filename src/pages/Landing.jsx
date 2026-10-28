import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import ProjectNav from '../components/ProjectNav.jsx';
import { Wordmark } from '../components/ui.jsx';
import HomeChatbot from '../components/HomeChatbot.jsx';
import { warmUp } from '../api/client.js';
import {
  ABOUT, HOW_IT_WORKS, OFFERS, LANDING_HERO, LANDING_PANELS, SEAM_CARDS, LANDING_COPY, FAQ_INTRO, FAQS,
  FOOTER_DESCRIPTION, FOOTER_LINKS, FOOTER_SOCIALS,
} from '../lib/content.js';
import OfferDeck from '../components/OfferDeck.jsx';

gsap.registerPlugin(ScrollTrigger, useGSAP);

const MotionLink = motion(Link);

function SocialIcon({ name }) {
  if (name === 'instagram') {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle className="solid" cx="18" cy="6" r="1" /></svg>;
  }
  if (name === 'facebook') {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path className="solid" d="M13.5 21v-8.2h2.8l.4-3.2h-3.2v-2c0-.9.3-1.5 1.6-1.5h1.7V3.2c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2.2H7.3v3.2h2.8V21h3.4Z" /></svg>;
  }
  if (name === 'tiktok') {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path className="solid" d="M19.6 8.1a6.2 6.2 0 0 1-3.9-1.4v7.1a5.5 5.5 0 1 1-5.5-5.5c.4 0 .8 0 1.2.1v3.1a2.5 2.5 0 1 0 1.3 2.2V2h3.1a6.2 6.2 0 0 0 3.8 3.1v3Z" /></svg>;
  }
}

export default function Landing() {
  const [openFaq, setOpenFaq] = useState(null);
  const landingRef = useRef(null);
  const [useStaticHero, setUseStaticHero] = useState(() => (
    typeof window !== 'undefined'
    && (window.matchMedia('(max-width: 760px)').matches
      || window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  ));

  useEffect(() => {
    warmUp();
  }, []);

  useGSAP(() => {
    const media = gsap.matchMedia();
    let active = true;

    media.add('(prefers-reduced-motion: reduce)', () => {});
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const intro = gsap.timeline();
      intro
        .from('.landing-hero h1 .hero-word', {
          y: 22,
          autoAlpha: 0,
          stagger: 0.045,
          duration: 0.58,
          ease: 'power2.out',
        })
        .from('.landing-hero-copy > p', {
          y: 16,
          autoAlpha: 0,
          duration: 0.5,
          ease: 'power2.out',
        }, '-=0.2')
        .from('.landing-side', {
          y: 24,
          autoAlpha: 0,
          stagger: 0.12,
          duration: 0.48,
          ease: 'power2.out',
        }, '-=0.12')
        .fromTo('.sample-brand', {
          y: 16,
          scale: 0.9,
          rotation: -9,
          autoAlpha: 0,
        }, {
          y: 0,
          scale: 1,
          rotation: -3,
          autoAlpha: 1,
          duration: 0.42,
          ease: 'back.out(1.7)',
        }, '-=0.05')
        .fromTo('.sample-creator', {
          y: 16,
          scale: 0.9,
          rotation: 9,
          autoAlpha: 0,
        }, {
          y: 0,
          scale: 1,
          rotation: 3,
          autoAlpha: 1,
          duration: 0.42,
          ease: 'back.out(1.7)',
        }, '<')
        .fromTo('.match-badge', {
          scale: 0.55,
          autoAlpha: 0,
        }, {
          scale: 1,
          autoAlpha: 1,
          duration: 0.32,
          ease: 'back.out(1.8)',
        }, '-=0.18')
        .fromTo('.match-arc', { autoAlpha: 0 }, {
          autoAlpha: 1,
          duration: 0.38,
        }, '<');

      gsap.timeline({
        scrollTrigger: {
          trigger: '.landing-thread',
          start: 'top 75%',
          once: true,
        },
      })
        .fromTo('.thread-line', { scaleX: 0 }, {
          scaleX: 1,
          duration: 0.8,
          ease: 'power2.out',
        })
        .from('.thread-number', {
          scale: 0.55,
          autoAlpha: 0,
          stagger: 0.12,
          duration: 0.35,
          ease: 'back.out(1.7)',
        }, '-=0.25');
    });

    document.fonts.ready.then(() => {
      if (active) ScrollTrigger.refresh();
    });

    return () => {
      active = false;
      media.revert();
    };
  }, { scope: landingRef });

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
    <div className="landing-page" ref={landingRef}>
      <ProjectNav landing />

      <main>
        <section className="landing-hero">
          <div className="landing-hero-copy">
            <h1>
              {LANDING_HERO.title.split(' ').map((word, index, words) => (
                <span className="hero-word" key={`${word}-${index}`}>
                  {word}{index < words.length - 1 ? ' ' : ''}
                </span>
              ))}
            </h1>
            <p>{LANDING_HERO.description}</p>
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
              >
                <source src="/black_influencer.webm" type="video/webm" />
              </video>
            )}
          </div>
        </section>

        <section className="landing-pair" id="register" aria-label="Choose how you want to join">
          {LANDING_PANELS.map((panel) => (
            <article className={`landing-side ${panel.kind}`} key={panel.kind}>
              <motion.div whileHover={{ y: -4 }} whileTap={{ scale: 0.99 }}>
                <h2>{panel.title}</h2>
                <p>{panel.text}</p>
                <p className="panel-offers">{panel.offers}</p>
                <MotionLink className="btn white" to={panel.to} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                  {panel.cta}
                </MotionLink>
              </motion.div>
            </article>
          ))}

          <div className="seam-cards" aria-hidden="true">
            <svg className="match-arc" viewBox="0 0 500 80" preserveAspectRatio="none">
              <path d="M4 65 C125 5 375 5 496 65" />
            </svg>
            {SEAM_CARDS.map((card) => (
              <motion.div className="sample-interaction" whileHover={{ y: -5 }} whileTap={{ scale: 0.98 }} key={card.kind}>
                <div className={`sample sample-${card.kind}`}>
                  <div className="sample-row">
                    <div className={`avatar ${card.kind === 'brand' ? 'b' : 'c'}`}>{card.name[0]}</div>
                    <div><strong>{card.name}</strong><small>{card.description}</small></div>
                  </div>
                  <div className="sample-facts"><span>{card.fact}</span></div>
                </div>
              </motion.div>
            ))}
            <div className="match-badge">✓</div>
          </div>
        </section>

        <section className="landing-about" id="about">
          <motion.div
            className="landing-about-copy"
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
          >
            <h2>{LANDING_COPY.aboutHeading}</h2>
            <div>
              {ABOUT.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            </div>
          </motion.div>
          <OfferDeck offers={OFFERS} />
        </section>

        <section className="landing-thread">
          <h3>{LANDING_COPY.stepsHeading}</h3>
          <div className="thread-line" aria-hidden="true" />
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
            <h2 id="landing-contact-title">{LANDING_COPY.contactHeading}</h2>
            <p>{LANDING_COPY.contactDescription}</p>
          </div>
          <MotionLink className="btn white" to="/register/brand" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
            {LANDING_COPY.contactCta}
          </MotionLink>
        </section>
      </main>

      <footer className="site">
        <div className="footer-main">
          <motion.div
            className="footer-brand"
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
          >
            <Wordmark tone="reversed" brandName={LANDING_COPY.footerName} />
            <p>{FOOTER_DESCRIPTION}</p>
          </motion.div>
          {Object.entries(FOOTER_LINKS).map(([title, links]) => (
            <motion.nav
              className="footer-links"
              aria-label={title}
              key={title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.55, ease: 'easeOut' }}
            >
              <p className="footer-title">{title}</p>
              <ul>
                {links.map((link) => (
                  <li key={link.label}>
                    {link.to.startsWith('/') ? <Link to={link.to}>{link.label}</Link> : <a href={link.to}>{link.label}</a>}
                  </li>
                ))}
              </ul>
            </motion.nav>
          ))}
          <motion.div
            className="footer-follow"
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
          >
            <p className="footer-title">Follow</p>
            <ul className="footer-socials" aria-label="Social media">
              {FOOTER_SOCIALS.map((social) => (
                <li key={social.icon}>
                  <a href={social.href} target="_blank" rel="noreferrer" aria-label={`Follow us on ${social.label}`}>
                    <SocialIcon name={social.icon} />
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
        <div className="footer-bottom">
          <span>&copy; {new Date().getFullYear()} {LANDING_COPY.footerName}</span>
          <span>{LANDING_COPY.footerBottom}</span>
        </div>
      </footer>
      <HomeChatbot />
    </div>
  );
}
