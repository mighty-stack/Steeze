import { FAQS } from './content.js';

const TOPICS = [
  {
    keywords: ['what is clout', 'about clout', 'what does clout do', 'platform', 'how does clout work'],
    answer: 'Clout brings brands and content creators together. Members create a profile, verify their email, and can then view relevant collaboration opportunities.',
  },
  {
    keywords: ['brand', 'business', 'company', 'business owner'],
    answer: 'Brands can register a business profile with their category, location, contact details, products or services, and the kinds of creator collaborations they are looking for.',
    links: [{ label: 'Register as a brand', to: '/register/brand' }],
  },
  {
    keywords: ['creator', 'influencer', 'content creator', 'youtuber'],
    answer: 'Creators can register with their niche, location, social platforms, audience information, and content description.',
    links: [{ label: 'Register as a creator', to: '/register/creator' }],
  },
  {
    keywords: ['register', 'sign up', 'join', 'create account', 'registration'],
    answer: 'Choose whether you are joining as a brand or creator, complete the registration form, and verify your email from the link we send. Registration and member profiles are free.',
    links: [
      { label: 'Register as a brand', to: '/register/brand' },
      { label: 'Register as a creator', to: '/register/creator' },
    ],
  },
  {
    keywords: ['free', 'cost', 'price', 'pricing', 'pay', 'payment', 'fee'],
    answer: 'Registering and maintaining a Clout member profile is free.',
  },
  {
    keywords: ['access code', 'referral code', 'invite code'],
    answer: 'An access code is optional. You can enter one during registration if you have it, or continue without one.',
  },
  {
    keywords: ['verify', 'verification', 'email link', 'confirm email', 'not received email', 'verification email'],
    answer: 'Open the verification email and click its link. Links expire after 24 hours. Check your spam folder; if it still is not there, use the resend page and submit the email you registered with.',
    links: [{ label: 'Resend verification email', to: '/resend-verification' }],
  },
  {
    keywords: ['expired link', 'link expired', 'resend', 'new verification link'],
    answer: 'Verification links expire after 24 hours. Request a fresh one from the resend page using your registered email address.',
    links: [{ label: 'Resend verification email', to: '/resend-verification' }],
  },
  {
    keywords: ['pending', 'review', 'approved', 'approval', 'how long'],
    answer: 'You need to verify your email before you can log in. Clout checks member profiles before they go live; the site does not specify a review turnaround time.',
  },
  {
    keywords: ['edit profile', 'update profile', 'change profile', 'profile details'],
    answer: 'After verifying your email and logging in, open your profile to update your details. Brands can manage their business information; creators can update their niche, platforms, and audience details.',
    links: [{ label: 'Log in', to: '/login' }],
  },
  {
    keywords: ['opportunity', 'opportunities', 'collaboration', 'campaign', 'apply'],
    answer: 'After email verification, log in and open Opportunities to see live calls that match your member role. An opportunity may have a closing date; closed or expired calls cannot accept new interest.',
    links: [{ label: 'Log in', to: '/login' }],
  },
  {
    keywords: ['interested', 'express interest', 'apply for', 'message to brand', 'application message'],
    answer: 'On an open opportunity, choose “I’m interested.” You can include an optional message of up to 500 characters. You can respond once per opportunity, withdraw, and express interest again while it remains open.',
    links: [{ label: 'Log in to view opportunities', to: '/login' }],
  },
  {
    keywords: ['withdraw', 'remove interest', 'reapply', 'apply again'],
    answer: 'You can withdraw an active interest while the opportunity is open. If it remains open, you can express interest again after withdrawing.',
    links: [{ label: 'Log in', to: '/login' }],
  },
  {
    keywords: ['shortlist', 'shortlisted', 'selected', 'not selected', 'declined'],
    answer: 'You can see your own interest status in Opportunities. If you are shortlisted, the Clout team will contact you by email; there is no in-app messaging.',
    links: [{ label: 'Log in', to: '/login' }],
  },
  {
    keywords: [
      'message',
      'message me',
      'will a brand message me',
      'will they contact me',
      'how will they contact me',
      'chat with brand',
      'contact brand',
      'in-app messaging',
      'messaging',
    ],
    answer: 'There is no in-app messaging. If a member is shortlisted for an opportunity, the Clout team contacts them by email.',
  },
  {
    keywords: ['forgot password', 'reset password', 'password reset', 'cannot log in', 'can’t log in', "can't log in"],
    answer: 'Use “Forgot your password?” on the login page and enter your registered email. The reset link works once and expires after one hour. Check spam if it does not arrive.',
    links: [{ label: 'Reset password', to: '/forgot-password' }],
  },
  {
    keywords: ['login', 'log in', 'sign in', 'account'],
    answer: 'You can log in after verifying the email address used to register. If your account is pending verification, request a new verification link.',
    links: [
      { label: 'Log in', to: '/login' },
      { label: 'Resend verification email', to: '/resend-verification' },
    ],
  },
  {
    keywords: ['contact', 'support', 'help', 'talk to someone', 'team'],
    answer: 'For help that is not covered here, use the “Get in touch” section on this page to contact the Clout team.',
    links: [{ label: 'Go to contact section', to: '#contact' }],
  },
];

const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'can', 'do', 'does', 'for', 'how', 'i', 'in', 'is', 'it',
  'me', 'my', 'of', 'on', 'or', 'the', 'to', 'what', 'when', 'where', 'who', 'with',
  'you', 'your',
]);

function words(value) {
  return value.toLowerCase().match(/[a-z0-9']+/g)?.filter((word) => word.length > 1 && !STOP_WORDS.has(word)) || [];
}

export function answerCloutQuestion(question) {
  const normalized = question.trim().toLowerCase();
  const queryWords = new Set(words(normalized));
  let best = null;
  let bestScore = 0;

  for (const topic of TOPICS) {
    let score = 0;
    for (const keyword of topic.keywords) {
      const phrase = keyword.toLowerCase();
      if (normalized.includes(phrase)) {
        score += phrase.includes(' ') ? 5 : 3;
        continue;
      }
      const keywordWords = words(phrase);
      const matches = keywordWords.filter((word) => queryWords.has(word)).length;
      score += keywordWords.length > 1 && matches === keywordWords.length
        ? 4
        : matches === 1 && keywordWords.length === 1 ? 2 : 0;
    }
    if (score > bestScore) {
      best = topic;
      bestScore = score;
    }
  }

  if (best && bestScore >= 2) return best;

  const faq = FAQS
    .map((item) => {
      const faqWords = new Set(words(`${item.question} ${item.answer}`));
      return { item, score: [...queryWords].filter((word) => faqWords.has(word)).length };
    })
    .sort((a, b) => b.score - a.score)[0];
  if (faq?.score && faq.score >= 2) return { answer: faq.item.answer };

  return {
    answer: 'I can help with Clout accounts, email verification, profiles, and collaboration opportunities. I’m not sure about that one—please use the contact section and the Clout team can help.',
    links: [{ label: 'Contact the Clout team', to: '#contact' }],
  };
}

export const CHAT_SUGGESTIONS = [
  'How do I join?',
  'I didn’t get a verification email',
  'How do opportunities work?',
];
