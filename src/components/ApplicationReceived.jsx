export default function ApplicationReceived({ firstName }) {
  const name = (typeof firstName === 'string' && firstName.trim()) || 'there';

  return (
    <section className="application-received" aria-live="polite">
      <h2>Application received! 🎉</h2>
      <p>Thanks for applying, {name}. You're officially in the running for the 2026 CloutLabs Creator Monetisation Programme (1st Edition).</p>
      <p>Our team will review your application and creator profile. If you're selected, you'll receive an interview invitation within 24 to 72 hours, and successful creators will get onboarding details after that.</p>
      <p>As part of our very first edition, you'll be among the creators helping us build meaningful connections between creators and brands.</p>
    </section>
  );
}
