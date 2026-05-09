import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: "Terms and conditions for using VedGuide astrology services.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white py-12 px-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <Link href="/" className="text-sm text-brand hover:underline underline-offset-2">
            ← Back to Home
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Use</h1>
        <p className="text-sm text-gray-400 mb-10">Last updated: May 2025</p>

        <div className="prose prose-sm max-w-none text-gray-700 space-y-8">

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">1. Acceptance of Terms</h2>
            <p className="leading-relaxed">
              By accessing or using VedGuide (&ldquo;the Platform&rdquo;), you agree to be bound by these
              Terms of Use. If you do not agree, please do not use our services. VedGuide is
              operated by VedGuide Technologies and is available to users in India and globally.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">2. Services</h2>
            <p className="leading-relaxed">
              VedGuide provides Vedic astrology consultations, Kundli generation, and related
              spiritual guidance services. All content, readings, and advice provided are for
              informational and entertainment purposes only. They do not constitute professional
              financial, medical, legal, or psychological advice.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">3. User Accounts</h2>
            <p className="leading-relaxed">
              You must be at least 18 years old to create an account. You are responsible for
              maintaining the confidentiality of your account credentials and for all activity
              that occurs under your account. You agree to provide accurate and complete information
              during registration.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">4. Payments &amp; Refunds</h2>
            <p className="leading-relaxed">
              All consultations and premium services are charged as displayed on the Platform.
              Payments are processed securely. Refunds may be considered on a case-by-case basis
              for unused wallet balance. Completed consultation sessions are non-refundable. For
              refund requests, contact us at{" "}
              <a href="mailto:support@vedguide.in" className="text-brand underline underline-offset-2">
                support@vedguide.in
              </a>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">5. Prohibited Conduct</h2>
            <p className="leading-relaxed mb-2">You agree not to:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-600">
              <li>Use the Platform for any unlawful purpose</li>
              <li>Harass, abuse, or harm astrologers or other users</li>
              <li>Share false or misleading information</li>
              <li>Attempt to reverse-engineer or scrape the Platform</li>
              <li>Resell or redistribute consultation content without permission</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">6. Intellectual Property</h2>
            <p className="leading-relaxed">
              All content on VedGuide including text, graphics, logos, and software is the
              property of VedGuide Technologies or its licensors. You may not reproduce,
              distribute, or create derivative works without our prior written consent.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">7. Disclaimer of Warranties</h2>
            <p className="leading-relaxed">
              The Platform is provided &ldquo;as is&rdquo; without warranties of any kind. VedGuide does not
              guarantee the accuracy, completeness, or usefulness of any astrological reading or
              content. Use the Platform at your own discretion and judgment.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">8. Limitation of Liability</h2>
            <p className="leading-relaxed">
              To the fullest extent permitted by law, VedGuide shall not be liable for any
              indirect, incidental, or consequential damages arising from your use of the Platform
              or reliance on any astrological content provided.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">9. Changes to Terms</h2>
            <p className="leading-relaxed">
              We reserve the right to update these Terms at any time. Continued use of the
              Platform after changes constitutes acceptance of the revised Terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">10. Contact</h2>
            <p className="leading-relaxed">
              For any questions about these Terms, reach us at{" "}
              <a href="mailto:support@vedguide.in" className="text-brand underline underline-offset-2">
                support@vedguide.in
              </a>.
            </p>
          </section>

        </div>

        <div className="mt-12 pt-8 border-t border-gray-100 text-center text-xs text-gray-400">
          Also read our{" "}
          <Link href="/privacy" className="text-brand underline underline-offset-2">
            Privacy Policy
          </Link>
        </div>
      </div>
    </div>
  );
}
