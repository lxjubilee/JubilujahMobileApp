/**
 * Source text for the in-app legal documents (Privacy Policy & Terms of Use).
 * Kept as structured data — not hard-coded JSX — so the same `LegalScreen`
 * renderer can present either document and copy edits stay in one place.
 */

/** A single rendered block within a section: a paragraph or a bulleted list. */
export type LegalBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'bullets'; items: string[] };

export interface LegalSection {
  heading: string;
  blocks: LegalBlock[];
}

export interface LegalDocument {
  title: string;
  /** Human-readable effective date shown under the title. */
  effectiveDate: string;
  /** Lead paragraph(s) shown before the numbered sections. */
  intro: string[];
  sections: LegalSection[];
  /** Address used in the closing "Contact us" section. */
  contactEmail: string;
}

const COMPANY = 'Jubilujah';
const WEBSITE = 'https://jubilujah.com';
const EFFECTIVE_DATE = 'June 17, 2026';

export const PRIVACY_POLICY: LegalDocument = {
  title: 'Privacy Policy',
  effectiveDate: EFFECTIVE_DATE,
  contactEmail: 'privacy@jubilujah.com',
  intro: [
    `This Privacy Policy explains how ${COMPANY} ("we", "us", or "our") collects, uses, shares, and protects your information when you use the ${COMPANY} mobile application and related services (the "Service").`,
    `By creating an account or using the Service, you agree to the practices described in this policy. If you do not agree, please do not use the Service.`,
  ],
  sections: [
    {
      heading: '1. Information We Collect',
      blocks: [
        {
          type: 'paragraph',
          text: 'We collect information you provide directly, information generated as you use the Service, and limited information from your device.',
        },
        {
          type: 'bullets',
          items: [
            'Account information: your name, email address, date of birth, and password (stored only in encrypted form).',
            'Usage data: songs, albums, and artists you play, search, like, download, or add to your library, including playback history and listening preferences.',
            'Device information: device model, operating system version, app version, language, and a unique app identifier used for security and diagnostics.',
            'Technical data: IP address, crash logs, and performance diagnostics used to keep the Service reliable.',
          ],
        },
      ],
    },
    {
      heading: '2. How We Use Your Information',
      blocks: [
        {
          type: 'bullets',
          items: [
            'Provide, maintain, and personalize the Service, including recommendations and your library.',
            'Authenticate you, secure your account, and support two-factor verification.',
            'Enable offline playback for content you download.',
            'Communicate with you about your account, security alerts, and important changes to the Service.',
            'Detect, prevent, and respond to fraud, abuse, and security incidents.',
            'Comply with our legal obligations and enforce our Terms of Use.',
          ],
        },
      ],
    },
    {
      heading: '3. How We Share Your Information',
      blocks: [
        {
          type: 'paragraph',
          text: 'We do not sell your personal information. We share information only in the limited circumstances described below.',
        },
        {
          type: 'bullets',
          items: [
            'Service providers: trusted vendors who host our infrastructure, deliver streaming content, process payments, or provide analytics, all bound by confidentiality obligations.',
            'Legal reasons: when required by law, regulation, legal process, or a valid government request, or to protect the rights, safety, and property of users and the public.',
            'Business transfers: in connection with a merger, acquisition, or sale of assets, subject to this policy.',
          ],
        },
      ],
    },
    {
      heading: '4. Data Retention',
      blocks: [
        {
          type: 'paragraph',
          text: 'We keep your information for as long as your account is active or as needed to provide the Service. When you delete your account, we delete or anonymize your personal information within a reasonable period, except where we must retain it to meet legal, accounting, or security obligations.',
        },
      ],
    },
    {
      heading: '5. Security',
      blocks: [
        {
          type: 'paragraph',
          text: 'We use technical and organizational measures — including encryption in transit, encrypted password storage, and access controls — to protect your information. No method of transmission or storage is completely secure, so we cannot guarantee absolute security.',
        },
      ],
    },
    {
      heading: '6. Your Rights and Choices',
      blocks: [
        {
          type: 'bullets',
          items: [
            'Access and update your account information from within the app.',
            'Change your password or enable additional verification at any time.',
            'Delete your account, which removes your personal data as described in Data Retention.',
            'Request a copy of your data or ask us to restrict certain processing, subject to applicable law.',
          ],
        },
      ],
    },
    {
      heading: "7. Children's Privacy",
      blocks: [
        {
          type: 'paragraph',
          text: 'The Service is not directed to children under 13, and we do not knowingly collect personal information from them. If you believe a child has provided us information, please contact us so we can remove it.',
        },
      ],
    },
    {
      heading: '8. Changes to This Policy',
      blocks: [
        {
          type: 'paragraph',
          text: 'We may update this Privacy Policy from time to time. When we make material changes, we will notify you in the app or by email and update the effective date above. Your continued use of the Service after changes take effect means you accept the revised policy.',
        },
      ],
    },
    {
      heading: '9. Contact Us',
      blocks: [
        {
          type: 'paragraph',
          text: `If you have questions about this Privacy Policy or how we handle your information, contact us at privacy@jubilujah.com or visit ${WEBSITE}.`,
        },
      ],
    },
  ],
};

export const TERMS_OF_USE: LegalDocument = {
  title: 'Terms of Use',
  effectiveDate: EFFECTIVE_DATE,
  contactEmail: 'support@jubilujah.com',
  intro: [
    `These Terms of Use ("Terms") govern your access to and use of the ${COMPANY} mobile application and related services (the "Service"). Please read them carefully.`,
    `By creating an account or using the Service, you agree to be bound by these Terms. If you do not agree, do not use the Service.`,
  ],
  sections: [
    {
      heading: '1. Eligibility',
      blocks: [
        {
          type: 'paragraph',
          text: 'You must be at least 13 years old to use the Service. If you are under the age of majority in your jurisdiction, you may use the Service only with the involvement and consent of a parent or legal guardian.',
        },
      ],
    },
    {
      heading: '2. Your Account',
      blocks: [
        {
          type: 'bullets',
          items: [
            'You are responsible for providing accurate information and keeping it up to date.',
            'You are responsible for safeguarding your password and all activity under your account.',
            'Notify us immediately if you suspect any unauthorized use of your account.',
            'You may not share your account or transfer it to anyone else.',
          ],
        },
      ],
    },
    {
      heading: '3. License to Use the Service',
      blocks: [
        {
          type: 'paragraph',
          text: `Subject to these Terms, ${COMPANY} grants you a limited, non-exclusive, non-transferable, revocable license to use the Service for your personal, non-commercial enjoyment. All rights not expressly granted are reserved.`,
        },
      ],
    },
    {
      heading: '4. Content and Intellectual Property',
      blocks: [
        {
          type: 'paragraph',
          text: 'All music, artwork, text, logos, and other materials available through the Service are owned by us or our licensors and are protected by intellectual property laws. The Service and its content are licensed, not sold, to you.',
        },
      ],
    },
    {
      heading: '5. Acceptable Use',
      blocks: [
        {
          type: 'paragraph',
          text: 'You agree not to misuse the Service. In particular, you must not:',
        },
        {
          type: 'bullets',
          items: [
            'Copy, record, redistribute, reproduce, or publicly perform content except as expressly permitted.',
            'Circumvent, disable, or interfere with security, digital rights management, or access controls.',
            'Use bots, scrapers, or other automated means to access the Service.',
            'Reverse engineer, decompile, or attempt to extract the source code of the app, except where permitted by law.',
            'Use the Service for any unlawful purpose or in violation of these Terms.',
          ],
        },
      ],
    },
    {
      heading: '6. Subscriptions and Payments',
      blocks: [
        {
          type: 'paragraph',
          text: 'Some features may require a paid subscription. Applicable prices, billing cycles, and renewal terms will be presented to you before you purchase. Unless stated otherwise, subscriptions renew automatically until cancelled, and payments are non-refundable except where required by law.',
        },
      ],
    },
    {
      heading: '7. Downloads and Offline Playback',
      blocks: [
        {
          type: 'paragraph',
          text: 'Content you download for offline playback remains part of the Service and is available only while your account is active and in good standing. Downloaded content may become unavailable if licensing changes or your subscription ends.',
        },
      ],
    },
    {
      heading: '8. Termination',
      blocks: [
        {
          type: 'paragraph',
          text: 'You may stop using the Service and delete your account at any time. We may suspend or terminate your access if you violate these Terms or if we are required to do so by law. Upon termination, your right to use the Service ends immediately.',
        },
      ],
    },
    {
      heading: '9. Disclaimers',
      blocks: [
        {
          type: 'paragraph',
          text: 'The Service is provided "as is" and "as available" without warranties of any kind, whether express or implied, including fitness for a particular purpose, availability, or that the Service will be uninterrupted or error-free, to the fullest extent permitted by law.',
        },
      ],
    },
    {
      heading: '10. Limitation of Liability',
      blocks: [
        {
          type: 'paragraph',
          text: `To the maximum extent permitted by law, ${COMPANY} will not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of data, use, or goodwill arising from your use of the Service.`,
        },
      ],
    },
    {
      heading: '11. Changes to These Terms',
      blocks: [
        {
          type: 'paragraph',
          text: 'We may update these Terms from time to time. When we make material changes, we will notify you in the app or by email and update the effective date above. Your continued use of the Service after changes take effect means you accept the revised Terms.',
        },
      ],
    },
    {
      heading: '12. Contact Us',
      blocks: [
        {
          type: 'paragraph',
          text: `If you have questions about these Terms, contact us at support@jubilujah.com or visit ${WEBSITE}.`,
        },
      ],
    },
  ],
};
