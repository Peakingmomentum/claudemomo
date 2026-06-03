import type { Metadata } from 'next';
import { PolicyShell, H2, P, UL, Note } from '../legal/PolicyShell';

export const metadata: Metadata = {
  title: 'Privacy Policy — Pocket Pilot',
  description: 'How Pocket Pilot collects, uses, and protects your data.',
};

const UPDATED = 'May 29, 2026';

export default function PrivacyPage() {
  return (
    <PolicyShell title="Privacy Policy" updated={UPDATED}>
      <Note>
        This policy is a starting template. Before relying on it, have it reviewed by a qualified
        attorney and replace the bracketed placeholders (company name, address, governing law,
        contact address) with your real business details.
      </Note>

      <P>
        Pocket Pilot (&ldquo;Pocket Pilot,&rdquo; &ldquo;we,&rdquo; &ldquo;us&rdquo;) provides an
        AI assistant, lead pipeline, and outreach tools for real estate professionals. This Privacy
        Policy explains what we collect, why, and the choices you have. It applies to
        [COMPANY LEGAL NAME], operated from [JURISDICTION].
      </P>

      <H2>Information we collect</H2>
      <UL>
        <li><strong>Account data</strong> — name, email, and authentication identifiers you provide or that your Google sign-in returns.</li>
        <li><strong>Business content</strong> — leads, contacts, notes, calendar events, messages, and documents you add to the product.</li>
        <li><strong>Usage data</strong> — feature interactions, device/browser type, and log data used to operate and secure the service.</li>
        <li><strong>Payment data</strong> — handled by our payment processor (Stripe). We do not store full card numbers on our servers.</li>
      </UL>

      <H2>How we use your information</H2>
      <UL>
        <li>To provide, maintain, and improve the product&rsquo;s features.</li>
        <li>To generate AI responses, briefings, and suggestions based on the content in your account.</li>
        <li>To process subscription billing and send service-related communications.</li>
        <li>To detect, prevent, and address abuse, fraud, and security incidents.</li>
        <li>To comply with legal obligations.</li>
      </UL>

      <H2>AI processing</H2>
      <P>
        To power AI features, relevant content from your account (such as lead details and your
        messages) is sent to our AI provider, Anthropic, to generate responses. We do not sell your
        data, and we do not use it to train third-party models beyond what is necessary to return a
        response to you.
      </P>

      <H2>Third-party services</H2>
      <P>We share data with service providers only as needed to run the product:</P>
      <UL>
        <li><strong>Supabase</strong> — database, authentication, and hosting of your account data.</li>
        <li><strong>Stripe</strong> — subscription payments and billing.</li>
        <li><strong>Anthropic</strong> — AI model processing.</li>
        <li><strong>Google</strong> — optional Gmail and Google Calendar sync, only with your explicit authorization.</li>
      </UL>

      <H2>Communications &amp; outreach</H2>
      <P>
        Pocket Pilot may help you draft and send email or messaging outreach to your own contacts.
        You are responsible for ensuring you have a lawful basis and any required consent to contact
        those recipients, and for complying with anti-spam and telemarketing laws (for example,
        CAN-SPAM, TCPA, and applicable state rules). We send you service and account emails; you can
        opt out of non-essential marketing emails at any time.
      </P>

      <H2>Data retention</H2>
      <P>
        We retain your data for as long as your account is active. You may request deletion of your
        account and associated data by contacting us; we will delete or anonymize it except where we
        must retain records to meet legal, tax, or security obligations.
      </P>

      <H2>Your rights</H2>
      <P>
        Depending on where you live (for example under GDPR or the CCPA/CPRA), you may have rights to
        access, correct, export, or delete your personal information, and to opt out of certain
        processing. To exercise these rights, contact us at the address below. We do not sell your
        personal information.
      </P>

      <H2>Security</H2>
      <P>
        We use industry-standard safeguards including encryption in transit, access controls, and
        rate limiting. No system is perfectly secure, but we work to protect your data and to notify
        you of material incidents as required by law.
      </P>

      <H2>Children</H2>
      <P>Pocket Pilot is for business use by adults and is not directed to anyone under 18.</P>

      <H2>Changes</H2>
      <P>
        We may update this policy. We will revise the &ldquo;Last updated&rdquo; date above and, for
        material changes, provide additional notice.
      </P>

      <H2>Contact</H2>
      <P>
        Questions or requests: [PRIVACY CONTACT EMAIL], [COMPANY LEGAL NAME], [MAILING ADDRESS].
      </P>
    </PolicyShell>
  );
}
