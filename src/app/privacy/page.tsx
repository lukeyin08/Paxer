import type { Metadata } from 'next';
import { LegalLayout, LegalSection } from '@/components/legal-layout';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How Paxer collects, uses, protects, and shares your information.',
  alternates: { canonical: '/privacy' },
  openGraph: {
    title: 'Privacy Policy · Paxer',
    description: 'How Paxer collects, uses, protects, and shares your information.',
    url: '/privacy',
  },
};

export default function PrivacyPage() {
  return (
    <LegalLayout kicker="Legal" title="Privacy Policy" lastUpdated="June 2026">
      <p>
        This Privacy Policy describes how Paxer (&ldquo;Paxer,&rdquo; &ldquo;we,&rdquo;
        &ldquo;us&rdquo;) collects, uses, and shares information when you use our medical-bill audit
        service. Because Paxer handles sensitive medical and financial information, please read this
        carefully.
      </p>

      <LegalSection heading="1. Information we collect">
        <p>
          To audit your bills, we collect information you provide directly, including: your name and
          contact details; medical bills, Explanation of Benefits (EOBs), and denial letters you
          upload; line-item charges, billing codes, and plan-benefit details; and your state (used
          to compare charges against regional benchmarks). We also collect basic technical and usage
          data when you use the service.
        </p>
      </LegalSection>

      <LegalSection heading="2. How we use your information">
        <p>
          We use your information to: read and extract charges from the documents you provide; run
          our audit engine to identify potential billing errors; generate dispute-letter drafts for
          your review; send you account and reminder emails; and improve the accuracy of our price
          benchmarks using de-identified, aggregated charge data (billing code, region, and amount
          only, never your identity).
        </p>
      </LegalSection>

      <LegalSection heading="3. How we share your information">
        <p>
          We do not sell your personal information. We share information with service providers who
          process it on our behalf under contract, including: our cloud hosting and database
          provider; our file-storage provider; our email-delivery provider; and our AI provider,
          which processes document contents to extract charges and draft letters. Where required for
          handling protected health information, we enter into Business Associate Agreements (BAAs)
          with these providers.
        </p>
        <p>
          We may also disclose information when required by law, or to protect the rights, safety,
          and security of our users and the service.
        </p>
      </LegalSection>

      <LegalSection heading="4. Data retention and deletion">
        <p>
          We retain your information for as long as your account is active or as needed to provide
          the service. You can delete individual cases or your entire account at any time from your
          account settings; deleting your account removes your cases, documents, and uploaded files.
          Some records may be retained as required by law or for legitimate business purposes.
        </p>
      </LegalSection>

      <LegalSection heading="5. Security">
        <p>
          We use administrative, technical, and physical safeguards designed to protect your
          information, including access controls that restrict documents to the account that owns
          them and encryption in transit. No method of transmission or storage is completely secure,
          and we cannot guarantee absolute security.
        </p>
      </LegalSection>

      <LegalSection heading="6. Your rights">
        <p>
          Depending on where you live, you may have rights to access, correct, delete, or obtain a
          copy of your personal information, and to object to or restrict certain processing. To
          exercise these rights, contact us using the details below.
        </p>
      </LegalSection>

      <LegalSection heading="7. Contact us">
        <p>
          Questions about this policy or your data? Contact us at{' '}
          <span className="font-mono">hello@paxer.app</span>.
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
