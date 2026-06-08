import type { Metadata } from 'next';
import { LegalLayout, LegalSection } from '@/components/legal-layout';

export const metadata: Metadata = {
  title: 'Terms of Service — Paxer',
  description: 'The terms that govern your use of Paxer.',
};

export default function TermsPage() {
  return (
    <LegalLayout kicker="Legal" title="Terms of Service" lastUpdated="June 2026">
      <p>
        These Terms of Service (&ldquo;Terms&rdquo;) govern your use of Paxer. By creating an account
        or using the service, you agree to these Terms.
      </p>

      <LegalSection heading="1. What Paxer does">
        <p>
          Paxer helps patients review their own medical bills and Explanation of Benefits documents,
          identifies potential billing errors, and generates draft dispute letters for the patient to
          review and send. Paxer is a tool to assist you; you remain responsible for reviewing all
          findings and letters and for deciding whether and how to act on them.
        </p>
      </LegalSection>

      <LegalSection heading="2. Not legal, medical, or financial advice">
        <p>
          Paxer does not provide legal, medical, or financial advice and is not a law firm, medical
          provider, or financial advisor. Audit findings and estimated recoverable amounts are
          estimates, not guarantees. Dispute letters are drafts you must review, complete, and send
          yourself; Paxer does not transmit them to providers or insurers on your behalf.
        </p>
      </LegalSection>

      <LegalSection heading="3. Fees">
        <p>
          Paxer is free for individual use: there is no charge to audit your bills, generate dispute
          letters, or track recoveries, and Paxer does not take a percentage of amounts you recover.
          If Paxer ever introduces paid plans (for example, business or enterprise tiers), the
          applicable terms and pricing will be disclosed to you before any fee applies, and your
          individual use will not become chargeable without your agreement. Business use of the
          Audit API is subject to the plan you select.
        </p>
      </LegalSection>

      <LegalSection heading="4. Your responsibilities">
        <p>
          You agree to provide accurate information, to use the service only for your own bills (or
          bills you are authorized to act on), and not to misuse, disrupt, or attempt to gain
          unauthorized access to the service. You are responsible for maintaining the security of
          your account.
        </p>
      </LegalSection>

      <LegalSection heading="5. Acceptable use">
        <p>
          You may not upload content you have no right to share, use the service for any unlawful
          purpose, or attempt to overload, reverse-engineer, or circumvent the service&rsquo;s
          protections, including its rate limits.
        </p>
      </LegalSection>

      <LegalSection heading="6. Disclaimers and limitation of liability">
        <p>
          The service is provided &ldquo;as is&rdquo; without warranties of any kind. To the maximum
          extent permitted by law, Paxer is not liable for indirect, incidental, or consequential
          damages arising from your use of the service. Estimates are not guarantees, and dispute
          letters are drafts you review and send yourself.
        </p>
      </LegalSection>

      <LegalSection heading="7. Changes and termination">
        <p>
          We may update these Terms from time to time; material changes will be communicated to you.
          You may stop using the service and delete your account at any time. We may suspend or
          terminate accounts that violate these Terms.
        </p>
      </LegalSection>

      <LegalSection heading="8. Contact us">
        <p>
          Questions about these Terms? Contact us at{' '}
          <span className="font-mono">ly3569@princeton.edu</span>.
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
