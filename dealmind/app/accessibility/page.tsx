import type { Metadata } from 'next';
import { PolicyShell, H2, P, UL, Note } from '../legal/PolicyShell';

export const metadata: Metadata = {
  title: 'Accessibility Statement — Pocket Pilot',
  description: 'Our commitment to making Pocket Pilot usable for everyone.',
};

const UPDATED = 'May 29, 2026';

export default function AccessibilityPage() {
  return (
    <PolicyShell title="Accessibility Statement" updated={UPDATED}>
      <Note>
        Update the contact details below with your real support address. This statement describes our
        ongoing commitment; accessibility is a continual effort, not a one-time certification.
      </Note>

      <P>
        Pocket Pilot is committed to making our product usable by everyone, including people with
        disabilities. We aim to conform to the Web Content Accessibility Guidelines (WCAG) 2.1 Level
        AA as a measurable standard.
      </P>

      <H2>What we do</H2>
      <UL>
        <li>Provide text labels for icon-only buttons and controls for screen-reader users.</li>
        <li>Maintain visible keyboard focus indicators and support keyboard navigation.</li>
        <li>Respect the operating system &ldquo;reduce motion&rdquo; preference.</li>
        <li>Offer light and dark themes and aim for sufficient color contrast.</li>
        <li>Use semantic structure and ARIA roles where appropriate.</li>
      </UL>

      <H2>Known limitations</H2>
      <P>
        Some areas of the product are still being improved for full assistive-technology support. We
        treat reported accessibility issues as priority bugs.
      </P>

      <H2>Feedback &amp; assistance</H2>
      <P>
        If you encounter an accessibility barrier, or need content in an alternative format, please
        contact us at [ACCESSIBILITY CONTACT EMAIL]. Include the page, what you were trying to do,
        and the assistive technology you use so we can reproduce and fix the issue quickly. We aim to
        respond within [RESPONSE TIME, e.g., 5 business days].
      </P>

      <H2>Compatibility</H2>
      <P>
        Pocket Pilot is designed to work with current versions of major browsers and common screen
        readers. If your setup isn&rsquo;t working well, let us know and we&rsquo;ll help.
      </P>
    </PolicyShell>
  );
}
