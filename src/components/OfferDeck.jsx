import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, useInView, useReducedMotion } from 'motion/react';
import { LANDING_COPY, OFFERS } from '../lib/content.js';

const AUTOPLAY_MS = 3800;
const offerImages = import.meta.glob('../assets/offers/*.webp', {
  eager: true,
  import: 'default',
  query: '?url',
});

function OfferCard({ offer, stackIndex, reducedMotion, swipe, onSwipe, onSwipeEnd, onDragStart, onDragStop }) {
  const [imageFailed, setImageFailed] = useState(false);
  const imageSrc = offerImages[`../assets/offers/${offer.image}`];
  const isTop = stackIndex === 0;
  const exited = isTop && Boolean(swipe);

  return (
    <motion.article
      className="offer-card"
      aria-hidden="true"
      style={{ zIndex: 3 - stackIndex, willChange: isTop ? 'transform, opacity' : undefined }}
      initial={false}
      animate={{
        x: exited && !reducedMotion ? swipe.side * 320 : 0,
        y: reducedMotion ? 0 : stackIndex * 14,
        scale: reducedMotion ? 1 : [1, 0.94, 0.88][stackIndex],
        rotate: exited && !reducedMotion ? swipe.side * 16 : 0,
        opacity: exited ? 0 : reducedMotion && stackIndex > 0 ? 0.2 : 1,
      }}
      transition={{ duration: reducedMotion ? 0.2 : 0.45, ease: 'easeOut' }}
      onAnimationComplete={exited ? onSwipeEnd : undefined}
      drag={isTop && !reducedMotion ? 'x' : false}
      dragConstraints={{ left: -420, right: 420 }}
      dragElastic={0.85}
      dragMomentum={false}
      onDragStart={isTop ? onDragStart : undefined}
      onDragEnd={isTop && !reducedMotion ? (_, info) => {
        onDragStop();
        const passedDistance = Math.abs(info.offset.x) > 110;
        const passedVelocity = Math.abs(info.velocity.x) > 500;
        if (passedDistance || passedVelocity) {
          const direction = passedDistance ? Math.sign(info.offset.x) : Math.sign(info.velocity.x);
          onSwipe(direction, false);
        }
      } : undefined}
    >
      <div className="offer-photo">
        {imageSrc && !imageFailed ? (
          <img
            src={imageSrc}
            alt={offer.alt}
            draggable={false}
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="offer-photo-fallback" aria-hidden="true">{offer.title[0]}</div>
        )}
      </div>
      <div className="offer-copy">
        <span className="offer-tag">{offer.tag}</span>
        <h3 className="offer-title">{offer.title}</h3>
        <p className="offer-description">{offer.text}</p>
        <span className={`offer-status ${offer.status}`}>
          {offer.status === 'soon' ? LANDING_COPY.soonStatus : LANDING_COPY.liveStatus}
        </span>
      </div>
    </motion.article>
  );
}

export default function OfferDeck({ offers = OFFERS }) {
  const deckRef = useRef(null);
  const swipeRef = useRef(null);
  const autoplayDirection = useRef(-1);
  const interactionTimer = useRef(null);
  const [order, setOrder] = useState(() => offers.map((_, index) => index));
  const [swipe, setSwipe] = useState(null);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(() => document.visibilityState === 'hidden');
  const [interactionPaused, setInteractionPaused] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const inView = useInView(deckRef, { amount: 0.3 });
  const reducedMotion = useReducedMotion() ?? false;
  const orderRef = useRef(order);
  orderRef.current = order;

  const pauseAfterInteraction = useCallback(() => {
    setInteractionPaused(true);
    window.clearTimeout(interactionTimer.current);
    interactionTimer.current = window.setTimeout(() => {
      setInteractionPaused(false);
      interactionTimer.current = null;
    }, 2000);
  }, []);

  const beginSwipe = useCallback((side, backwards = false, manual = false) => {
    if (swipeRef.current) return false;
    const targetIndex = backwards
      ? orderRef.current[orderRef.current.length - 1]
      : orderRef.current[1] ?? orderRef.current[0];
    const nextSwipe = { side, backwards, manual, targetIndex };
    swipeRef.current = nextSwipe;
    setSwipe(nextSwipe);
    return true;
  }, []);

  const finishSwipe = useCallback(() => {
    const finishedSwipe = swipeRef.current;
    if (!finishedSwipe) return;
    setOrder((current) => finishedSwipe.backwards
      ? [current[current.length - 1], ...current.slice(0, -1)]
      : [...current.slice(1), current[0]]);
    if (finishedSwipe.manual) {
      const offer = offers[finishedSwipe.targetIndex];
      setAnnouncement(LANDING_COPY.offerAnnouncement(finishedSwipe.targetIndex + 1, offers.length, offer.title));
    }
    swipeRef.current = null;
    setSwipe(null);
  }, [offers]);

  useEffect(() => {
    const updateVisibility = () => setHidden(document.visibilityState === 'hidden');
    document.addEventListener('visibilitychange', updateVisibility);
    return () => document.removeEventListener('visibilitychange', updateVisibility);
  }, []);

  useEffect(() => () => {
    window.clearTimeout(interactionTimer.current);
  }, []);

  useEffect(() => {
    if (
      !inView || hidden || hovered || focused || dragging
      || interactionPaused || swipe || reducedMotion
    ) return undefined;

    const timer = window.setTimeout(() => {
      beginSwipe(autoplayDirection.current);
      autoplayDirection.current *= -1;
    }, AUTOPLAY_MS);
    return () => window.clearTimeout(timer);
  }, [
    beginSwipe,
    dragging,
    focused,
    hidden,
    hovered,
    inView,
    interactionPaused,
    reducedMotion,
    swipe,
  ]);

  const handleInteractionSwipe = (backwards = false) => {
    pauseAfterInteraction();
    beginSwipe(backwards ? -1 : 1, backwards, true);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      handleInteractionSwipe(true);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      handleInteractionSwipe(false);
    }
  };

  const currentOfferIndex = order[0];
  const visibleOffers = order.slice(0, 3);

  return (
    <section
      className="offer-deck"
      aria-roledescription="carousel"
      aria-label={LANDING_COPY.offersLabel}
      ref={deckRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={(event) => {
        if (event.target.matches(':focus-visible')) setFocused(true);
      }}
      onBlurCapture={(event) => {
        if (
          !event.currentTarget.contains(event.relatedTarget)
          || !event.relatedTarget?.matches?.(':focus-visible')
        ) setFocused(false);
      }}
    >
      <ul className="sr-only">
        {offers.map((offer) => (
          <li key={offer.key}>
            <strong>{offer.title}</strong>
            <span>{offer.text}</span>
            <span>{offer.status === 'soon' ? LANDING_COPY.soonStatus : LANDING_COPY.liveStatus}</span>
          </li>
        ))}
      </ul>

      <div className="offer-stage" aria-hidden="true">
        {visibleOffers.map((offerIndex, stackIndex) => (
          <OfferCard
            key={offers[offerIndex].key}
            offer={offers[offerIndex]}
            stackIndex={stackIndex}
            reducedMotion={reducedMotion}
            swipe={stackIndex === 0 ? swipe : null}
            onSwipe={(direction) => beginSwipe(direction, false, true)}
            onSwipeEnd={finishSwipe}
            onDragStart={() => {
              setDragging(true);
              pauseAfterInteraction();
            }}
            onDragStop={() => {
              setDragging(false);
              pauseAfterInteraction();
            }}
          />
        ))}
      </div>

      <div className="offer-controls">
        <button type="button" className="offer-control" onClick={() => handleInteractionSwipe(true)}>
          {LANDING_COPY.previous}
        </button>
        <span className="offer-position">{currentOfferIndex + 1} / {offers.length}</span>
        <button type="button" className="offer-control" onClick={() => handleInteractionSwipe(false)}>
          {LANDING_COPY.next}
        </button>
      </div>
      <p className="sr-only" aria-live="polite" aria-atomic="true">{announcement}</p>
    </section>
  );
}
