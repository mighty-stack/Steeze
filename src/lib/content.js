export const LANDING_HERO = {
  title: 'Where creators get hired and brands find talent.',
  description: "CloutLabs brings creators, brands, and opportunities together. Creators build a profile they control. Our team uses it to see who's rising and who's the right fit for a gig, a collaboration, or a growth programme.",
};

export const LANDING_PANELS = [
  {
    kind: 'creator',
    title: 'For creators',
    text: "Get hired, gain experience, and get seen. Build a profile you own, and we'll connect you with the right brands, gigs, and fellow creators.",
    offers: 'Explore internships, collaborations, paid gigs, a profile that shows your work, and levels and the CloutLabs score.',
    cta: 'Register as a creator',
    to: '/register/creator',
  },
  {
    kind: 'brand',
    title: 'For brands',
    text: 'Find the right creator without the guesswork. Tell us what you need, and our team matches you with emerging creators who fit the brief.',
    offers: 'Find creators who fit your budget, and explore collaborations and gigs for your brand.',
    cta: 'Register your brand',
    to: '/register/brand',
  },
];

export const SEAM_CARDS = [
  {
    kind: 'brand',
    name: 'Adaeze Skin Lab',
    description: 'Beauty and personal care',
    fact: 'Lagos, Nigeria · Needs UGC videos',
  },
  {
    kind: 'creator',
    name: 'Tomi Cooks',
    description: 'Food and home cooking',
    fact: 'Accra, Ghana · Short-form video',
  },
];

export const LANDING_COPY = {
  aboutHeading: 'About CloutLabs',
  stepsHeading: 'How joining works',
  contactHeading: 'For brands',
  contactDescription: 'Reach emerging creators your audience will actually respond to. CloutLabs matches you with creators who fit your campaign, so you spend less time searching and more time collaborating.',
  contactCta: 'Work with CloutLabs',
  footerName: 'CloutLabs',
  footerBottom: 'Connecting Creators, Brands & Opportunities',
  offersLabel: 'What CloutLabs offers',
  liveStatus: 'Live',
  soonStatus: 'Coming soon',
  previous: 'Previous',
  next: 'Next',
  offerAnnouncement: (position, total, title) => `Offer ${position} of ${total}: ${title}`,
};

export const ABOUT = [
  'CloutLabs gives small creators a real path to earning and gives brands a smarter way to find talent. Members build a profile they own, and our team uses it to match the right creator to the right opportunity.',
];

export const HOW_IT_WORKS = [
  { title: 'Create your profile', text: 'Register as a creator or a brand and add the details that show who you are.' },
  { title: 'We review it', text: "The CloutLabs team checks every registration. You'll get an email when you're verified." },
  { title: 'Apply, collaborate, grow', text: 'Browse opportunities, show interest and build your record, one gig at a time.' },
];

export const OFFERS = [
  {
    key: 'gigs',
    tag: 'For creators',
    title: 'Paid creator gigs',
    text: 'Find opportunities from brands and businesses: UGC, product reviews, event coverage, photography and more. Apply to the ones that match your niche and location.',
    status: 'live',
    image: 'gigs.webp',
    alt: 'A creator filming a product with a phone and ring light',
  },
  {
    key: 'internships',
    tag: 'For new creators',
    title: 'Creator internships',
    text: 'New to this? Work on practice and real campaigns, build your portfolio, and graduate into paid gigs.',
    status: 'soon',
    image: 'internships.webp',
    alt: 'A new creator learning to plan and film a campaign',
  },
  {
    key: 'collaborations',
    tag: 'For creators',
    title: 'Collaborations',
    text: 'Team up with a videographer, photographer, stylist or editor and take on bigger briefs together than any of you could alone.',
    status: 'soon',
    image: 'collaborations.webp',
    alt: 'Creators working together on a video shoot',
  },
  {
    key: 'profile',
    tag: 'For creators',
    title: 'A profile that shows your work',
    text: 'Add your portfolio, skills and availability so brands can judge you on more than follower count.',
    status: 'live',
    image: 'profile.webp',
    alt: 'A creator sharing portfolio work on a profile',
  },
  {
    key: 'levels',
    tag: 'For creators',
    title: 'Levels and the CloutLabs score',
    text: 'Grow from Intern to Professional. Your level comes from real activity: completed gigs, ratings and reliability.',
    status: 'soon',
    image: 'levels.webp',
    alt: 'A creator reviewing progress and completed work',
  },
  {
    key: 'brands',
    tag: 'For brands',
    title: 'Creators who fit your budget',
    text: 'Tell us what you need and review creators who match your niche, location and budget.',
    status: 'live',
    image: 'brands.webp',
    alt: 'A small business reviewing creator portfolios',
  },
];

export const BENEFITS_INTRO = [
  'Why brands and creators choose CloutLabs',
  'A more considered way to meet, built around verified email addresses and clear expectations.',
];

export const BENEFITS = [
  { number: '01', title: 'Start with trust', text: 'Email verification helps keep member accounts genuine.' },
  { number: '02', title: 'Show the right details', text: 'Share your business, niche, platforms and audience in one clear profile.' },
  { number: '03', title: 'Find a better fit', text: 'Useful profile details help brands and creators spot relevant collaboration opportunities.' },
  { number: '04', title: 'Stay in control', text: 'Manage your profile and keep your information current as your work changes.' },
];

export const FAQ_INTRO = ['Frequently asked questions'];

export const FAQS = [
  { question: 'How do I verify my account?', answer: 'Click the verification link sent to your email. It expires after 24 hours; you can request another link from the login page.' },
  { question: 'Is registration free?', answer: 'Yes. Registering and maintaining a member profile is free.' },
  { question: 'Can I update my profile later?', answer: 'Yes. Once your email is verified, you can log in and update your profile details.' },
  { question: 'What happens after email verification?', answer: 'You can log in to manage your profile and view current collaboration opportunities.' },
];

export const CONTACT_EMAIL = 'hello@example.com';

export const FOOTER_DESCRIPTION = 'CloutLabs brings creators, brands, and opportunities together.';

export const FOOTER_LINKS = {
  'Quick links': [
    { label: 'About', to: '#about' },
    { label: 'Log in', to: '/login' },
    { label: 'Register brand', to: '/register/brand' },
    { label: 'Register creator', to: '/register/creator' },
  ],
  'For members': [
    { label: 'Help center', to: '#help-center' },
    { label: 'Contact', to: '#contact' },
    { label: 'FAQ', to: '#faq' },
  ],
};

export const FOOTER_SOCIALS = [
  { label: 'TikTok', icon: 'tiktok', href: 'https://www.tiktok.com/kloutcollabs' },
  { label: 'Facebook', icon: 'facebook', href: 'https://www.facebook.com/share/1D4vEJmzDN/' },
  { label: 'Instagram', icon: 'instagram', href: 'https://www.instagram.com/kloutcollabs' },
];

export const SCORE_NAME = 'CloutLabs score';

export const LEVEL_LABELS = {
  intern: 'Creator Intern',
  emerging: 'Emerging Creator',
  rising: 'Rising Creator',
  established: 'Established Creator',
  professional: 'Professional Creator',
};

export const STANDING_COMPONENT_LABELS = {
  profile: 'Profile completeness',
  portfolio: 'Portfolio',
  activity: 'Platform activity',
  completedGigs: 'Completed gigs',
  ratings: 'Brand ratings',
  reliability: 'Reliability',
  collaborationActivity: 'Collaboration activity',
  contentActivity: 'Content activity',
  campaignPerformance: 'Campaign performance',
  growth: 'Growth',
};
