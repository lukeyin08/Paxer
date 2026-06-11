import type { Metadata } from 'next';
import { LegalLayout, LegalSection } from '@/components/legal-layout';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'The terms that govern your use of Paxer.',
  alternates: { canonical: '/terms' },
  openGraph: {
    title: 'Terms of Service · Paxer',
    description: 'The terms that govern your use of Paxer.',
    url: '/terms',
  },
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

      <LegalSection heading="3. Fees & subscription">
        <p>
          Your first bill audit is free. Additional audits and generating dispute letters require a
          <strong> Paxer Plus</strong> subscription, a flat recurring software fee, shown to you
          before you subscribe. This is <strong>not</strong> a contingency or success fee: Paxer
          never takes a percentage of any amount you recover, and you keep 100% of your recoveries.
        </p>
        <p>
          <strong>Auto-renewal &amp; cancellation.</strong> A Paxer Plus subscription renews
          automatically at the end of each billing period at the then-current price until you cancel.
          You may cancel at any time from Settings → Paxer Plus (or the billing portal); cancellation
          stops future renewals, and your access continues through the end of the period you have
          already paid for.
        </p>
        <p>
          <strong>Refunds.</strong> Subscription fees are generally non-refundable except where
          required by applicable law; contact support for any billing issue and we will work with you
          in good faith. Prices and any changes will be disclosed before they take effect. Business
          use of the Audit API is subject to the separate API plan you select.
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
          <span className="font-mono">hello@paxer.app</span>.
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
