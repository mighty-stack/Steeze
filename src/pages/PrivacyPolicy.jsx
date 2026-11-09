import { useEffect } from 'react';
import { Link } from 'react-router-dom';

const POLICY_SECTIONS = [
  {
    title: '1. Introduction',
    paragraphs: [
      'Welcome to CloutLabs.',
      'CloutLabs is committed to protecting the privacy and personal information of everyone who uses our platform.',
      'This Privacy Policy explains how we collect, use, store, process, and protect your personal information when you visit our website, create an account, participate in our creator programmes, or interact with our services.',
      'By accessing or using CloutLabs, you acknowledge that you have read and understood this Privacy Policy.',
      'Our data protection practices are guided by applicable data protection laws, including the Nigeria Data Protection Act (NDPA) 2023.',
    ],
  },
  {
    title: '2. Information We Collect',
    paragraphs: ['We collect information that helps us provide, maintain, and improve our services.'],
    subsections: [
      {
        title: '2.1 Personal Information',
        intro: 'When you register on CloutLabs, we may collect:',
        items: ['Full name.', 'Email address.', 'Phone number.', 'Username.', 'Password.', 'Country or location.', 'Other information voluntarily provided during registration.'],
      },
      {
        title: '2.2 Account Information',
        intro: 'We collect and maintain information associated with your account, including:',
        items: ['Account registration details.', 'Email verification status.', 'Login and authentication records.', 'Account preferences.', 'Account activity and status.'],
      },
      {
        title: '2.3 Creator and Programme Information',
        intro: 'For users participating in creator programmes, applications, or related activities, we may collect:',
        items: ['Social media usernames and profile links.', 'Creator profiles and descriptions.', 'Audience and engagement information provided by users.', 'Programme applications and responses.', 'Interview and assessment information.', 'Other information voluntarily submitted during programme participation.'],
      },
      {
        title: '2.4 Technical Information',
        intro: 'When you access our website, we may automatically collect certain technical information, including:',
        items: ['IP address.', 'Browser type.', 'Device information.', 'Operating system.', 'Website usage information.', 'Cookies and similar technologies, where applicable.'],
      },
    ],
  },
  {
    title: '3. How We Use Your Information',
    intro: 'We use collected information for the following purposes:',
    items: [
      'To create and manage user accounts.',
      'To authenticate users and verify email addresses.',
      'To process creator registrations and applications.',
      'To manage creator programmes and participation.',
      'To communicate important account updates.',
      'To send verification emails and password-reset instructions.',
      'To provide customer support.',
      'To improve website functionality and user experience.',
      'To maintain platform security.',
      'To detect and prevent fraudulent or unauthorised activities.',
      'To comply with applicable legal obligations.',
    ],
    end: ['We process personal information based on applicable lawful grounds, including contractual necessity, legitimate interests, consent, and legal obligations, depending on the purpose.'],
  },
  {
    title: '4. How We Store Your Information',
    paragraphs: [
      'CloutLabs uses third-party technology infrastructure to store and process user information.',
      'Our primary database infrastructure uses MongoDB to store account information, registration details, creator information, and other relevant platform data.',
      'We implement reasonable technical and organisational security measures designed to protect personal information against:',
    ],
    items: ['Unauthorised access.', 'Accidental loss.', 'Unlawful disclosure.', 'Unauthorised modification.', 'Destruction or misuse.'],
    end: [
      'Passwords are handled using appropriate security measures rather than being stored as readable plain text.',
      'Although we take reasonable steps to protect user information, no electronic storage or internet transmission system can guarantee absolute security.',
    ],
  },
  {
    title: '5. Third-Party Service Providers',
    paragraphs: ['To operate CloutLabs effectively, we rely on selected third-party service providers.'],
    providers: [
      ['MongoDB', 'Used as our database infrastructure for storing and managing user information.'],
      ['Brevo', 'Used to deliver transactional emails, including account verification messages, password-reset emails, and important platform notifications.'],
    ],
    end: [
      'These providers may process information on our behalf where necessary to deliver their services.',
      "We do not sell, rent, or trade users' personal information to third parties for commercial purposes.",
      'Where third-party providers process personal information, we take reasonable steps to ensure appropriate data protection safeguards are in place.',
    ],
  },
  {
    title: '6. Sharing of Personal Information',
    paragraphs: [
      'We do not sell or commercially distribute your personal information.',
      'However, information may be disclosed in limited circumstances:',
    ],
    items: [
      'When necessary to provide our services through trusted technology providers.',
      'When required by applicable laws or legal processes.',
      'When necessary to protect CloutLabs, its users, or the security of the platform.',
      'When users expressly authorise the sharing of their information.',
    ],
    end: ['We take reasonable steps to ensure that any information shared is limited to what is necessary for the relevant purpose.'],
  },
  {
    title: '7. Data Retention',
    paragraphs: [
      'We retain personal information only for as long as reasonably necessary to fulfil the purposes for which it was collected.',
      'Account information may be retained while your account remains active.',
      'When an account is deleted, we take reasonable steps to remove or anonymise the associated personal information from our active systems, subject to applicable legal, security, and record-keeping requirements.',
      'Some information may remain in secure backups for a limited period before being permanently overwritten or deleted.',
    ],
  },
  {
    title: '8. Account Deletion and Personal Data Removal',
    paragraphs: [
      'CloutLabs gives users the ability to delete their accounts.',
      'When you choose to delete your account:',
    ],
    items: [
      'Your account will be removed from active platform use.',
      'Associated personal information will be scheduled for deletion from our active systems.',
      'Information no longer required for legitimate operational purposes will be deleted or anonymised.',
      'Certain records may be retained where required by applicable laws or necessary to resolve disputes and protect legitimate interests.',
    ],
    end: ['Deleting your account does not necessarily result in the immediate removal of information from backup systems.'],
  },
  {
    title: '9. Cookies and Website Technologies',
    paragraphs: ['CloutLabs may use cookies and similar technologies to:'],
    items: [
      'Maintain user login sessions.',
      'Improve website functionality.',
      'Remember user preferences.',
      'Understand website usage and performance.',
    ],
    end: [
      'You can manage cookies through your browser settings.',
      'Disabling certain cookies may affect some features or functionalities of the website.',
      'Where required, we will obtain consent before using non-essential cookies.',
    ],
  },
  {
    title: '10. Your Privacy Rights',
    paragraphs: ['Subject to applicable data protection laws, you have the right to:'],
    items: [
      'Access the personal information we hold about you.',
      'Request corrections to inaccurate information.',
      'Request deletion of your personal information.',
      'Withdraw consent where processing is based on consent.',
      'Object to certain types of data processing.',
      'Request information about how your data is processed.',
      'Request a copy of your personal information.',
      'Lodge a complaint with the relevant data protection authority.',
    ],
    end: [
      'You can exercise your account deletion rights through the account deletion functionality available on CloutLabs.',
      'For other privacy-related requests, you can contact our support team.',
    ],
  },
  {
    title: '11. International Data Processing',
    paragraphs: ['Some of our third-party technology providers may process or store information outside Nigeria.', 'Where personal information is transferred internationally, CloutLabs will take reasonable steps to ensure that such transfers comply with applicable data protection requirements, including appropriate safeguards under the Nigeria Data Protection Act.'],
  },
  {
    title: "12. Children's Privacy",
    paragraphs: [
      'CloutLabs does not knowingly collect personal information from children in violation of applicable data protection laws.',
      "Where our services are available to minors, we will apply appropriate safeguards and comply with applicable requirements concerning children's personal information.",
    ],
  },
  {
    title: '13. Third-Party Websites',
    paragraphs: [
      'Our platform may contain links to external websites, social media platforms, or other third-party services.',
      'CloutLabs does not control the privacy practices or security policies of these external platforms.',
      'Users are encouraged to review the privacy policies of third-party websites before sharing personal information with them.',
    ],
  },
  {
    title: '14. Changes to This Privacy Policy',
    paragraphs: [
      'We may update this Privacy Policy from time to time to reflect changes in our services, technology infrastructure, or legal obligations.',
      'Any updates will be published on this page with a revised effective date.',
      'We encourage users to review this Privacy Policy periodically.',
    ],
  },
];

export default function PrivacyPolicy() {
  useEffect(() => {
    const previousTitle = document.title;
    const description = document.querySelector('meta[name="description"]');
    const previousDescription = description?.getAttribute('content');
    document.title = 'Privacy Policy | CloutLabs';
    description?.setAttribute('content', 'Read the CloutLabs Privacy Policy, effective November 9, 2026.');
    return () => {
      document.title = previousTitle;
      if (previousDescription !== null && previousDescription !== undefined) {
        description?.setAttribute('content', previousDescription);
      }
    };
  }, []);

  return (
    <div className="privacy-policy-page">
      <header className="privacy-policy-header">
        <Link to="/" className="privacy-policy-home">CloutLabs</Link>
        <Link to="/">Back to home</Link>
      </header>
      <main className="privacy-policy">
        <article>
          <h1>CloutLabs Privacy Policy</h1>
          <div className="privacy-policy-dates">
            <p><strong>Effective Date:</strong> November 9, 2026</p>
            <p><strong>Last Updated:</strong> November 9, 2026</p>
          </div>
          {POLICY_SECTIONS.map((section) => (
            <section key={section.title}>
              <h2>{section.title}</h2>
              {section.paragraphs?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              {section.intro && <p>{section.intro}</p>}
              {section.items && <ul>{section.items.map((item) => <li key={item}>{item}</li>)}</ul>}
              {section.subsections?.map((subsection) => (
                <section key={subsection.title}>
                  <h3>{subsection.title}</h3>
                  <p>{subsection.intro}</p>
                  <ul>{subsection.items.map((item) => <li key={item}>{item}</li>)}</ul>
                </section>
              ))}
              {section.providers?.map(([name, description]) => (
                <p key={name}><strong>{name}:</strong> {description}</p>
              ))}
              {section.end?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            </section>
          ))}
          <section>
            <h2>15. Contact Information</h2>
            <p>If you have questions, concerns, or requests relating to this Privacy Policy or the handling of your personal information, please contact us.</p>
            <p><strong>Company:</strong> CloutLabs</p>
            <p><strong>Website:</strong> <a href="https://www.cloutlabs.name.ng">https://www.cloutlabs.name.ng</a></p>
            <p><strong>Support Email:</strong> <a href="mailto:info@cloutlabs.name.ng">info@cloutlabs.name.ng</a></p>
            <p>We value your privacy and remain committed to protecting the information entrusted to us.</p>
          </section>
          <p className="privacy-policy-copyright">© 2026 CloutLabs. All Rights Reserved.</p>
        </article>
      </main>
    </div>
  );
}
