import type { Metadata } from 'next';
import { PolicyShell, H2, P, UL, Note } from '../legal/PolicyShell';

export const metadata: Metadata = {
  title: 'Terms of Service — Pocket Pilot',
  description: 'The terms governing your use of Pocket Pilot.',
};

const UPDATED = 'May 29, 2026';

export default function TermsPage() {
  return (
    <PolicyShell title="Terms of Service" updated={UPDATED}>
      <Note>
        This is a starting template, not legal advice. Have it reviewed by a qualified attorney and
        replace the bracketed placeholders before relying on it.
      </Note>

      <P>
        These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and use of Pocket Pilot
        (the &ldquo;Service&rdquo;), operated by [COMPANY LEGAL NAME] (&ldquo;we,&rdquo;
        &ldquo;us&rdquo;). By creating an account or using the Service, you agree to these Terms.
      </P>

      <H2>Eligibility &amp; accounts</H2>
      <P>
        You must be at least 18 and able to form a binding contract. You are responsible for your
        account credentials and for all activity under your account. Keep your login secure.
      </P>

      <H2>Subscriptions &amp; billing</H2>
      <UL>
        <li>The Service is offered on a subscription basis (currently [PRICE] per month) billed through Stripe.</li>
        <li>Subscriptions renew automatically until cancelled. You can cancel anytime; access continues through the end of the paid period.</li>
        <li>Except where required by law, fees are non-refundable.</li>
        <li>We may change pricing with advance notice; changes apply to the next billing cycle.</li>
      </UL>

      <H2>Acceptable use</H2>
      <P>You agree not to:</P>
      <UL>
        <li>Use the Service for unlawful, deceptive, or abusive purposes.</li>
        <li>Send outreach without a lawful basis or required consent, or in violation of anti-spam, telemarketing, or do-not-call laws.</li>
        <li>Attempt to bypass security, rate limits, or access controls, or to reverse engineer the Service.</li>
        <li>Upload content you don&rsquo;t have the right to use, or that infringes others&rsquo; rights.</li>
        <li>Use the Service to build a competing product or to scrape data at scale.</li>
      </UL>

      <H2>Your content</H2>
      <P>
        You retain ownership of the data and content you submit. You grant us a limited license to
        process it solely to operate and improve the Service for you, including sending it to our AI
        and infrastructure providers as described in our Privacy Policy.
      </P>

      <H2>AI output disclaimer</H2>
      <P>
        The Service uses AI to generate suggestions, summaries, scripts, and briefings. AI output may
        be inaccurate or incomplete. It is provided for your convenience only and is{' '}
        <strong>not legal, financial, tax, or investment advice</strong>. You are responsible for
        reviewing and verifying any output before acting on it or sending it to others.
      </P>

      <H2>Third-party services</H2>
      <P>
        The Service integrates with third parties (e.g., Supabase, Stripe, Google, Anthropic). Your
        use of those integrations is also subject to their terms, and we are not responsible for
        their acts or omissions.
      </P>

      <H2>Disclaimers</H2>
      <P>
        The Service is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without warranties
        of any kind, whether express or implied, including merchantability, fitness for a particular
        purpose, and non-infringement. We do not warrant that the Service will be uninterrupted,
        error-free, or secure.
      </P>

      <H2>Limitation of liability</H2>
      <P>
        To the maximum extent permitted by law, [COMPANY LEGAL NAME] will not be liable for any
        indirect, incidental, special, consequential, or punitive damages, or for lost profits or
        data. Our total liability for any claim relating to the Service will not exceed the amount
        you paid us in the 12 months before the event giving rise to the claim.
      </P>

      <H2>Indemnification</H2>
      <P>
        You agree to indemnify and hold us harmless from claims arising out of your content, your
        outreach to third parties, or your breach of these Terms or applicable law.
      </P>

      <H2>Termination</H2>
      <P>
        You may stop using the Service at any time. We may suspend or terminate access for violation
        of these Terms or to protect the Service or other users. Upon termination, your right to use
        the Service ends.
      </P>

      <H2>Governing law</H2>
      <P>
        These Terms are governed by the laws of [GOVERNING LAW / STATE], without regard to conflict
        of law rules. Disputes will be resolved in the courts located in [VENUE], unless otherwise
        required by law.
      </P>

      <H2>Changes</H2>
      <P>
        We may update these Terms. Material changes will be noticed in-app or by email, and the
        &ldquo;Last updated&rdquo; date above will change. Continued use means you accept the updated
        Terms.
      </P>

      <H2>Contact</H2>
      <P>[SUPPORT CONTACT EMAIL], [COMPANY LEGAL NAME], [MAILING ADDRESS].</P>
    </PolicyShell>
  );
}
