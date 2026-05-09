import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How VedGuide collects, uses, and protects your personal information.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white py-12 px-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <Link href="/" className="text-sm text-brand hover:underline underline-offset-2">
            ← Back to Home
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-400 mb-10">Last updated: May 2025</p>

        <div className="prose prose-sm max-w-none text-gray-700 space-y-8">

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">1. Introduction</h2>
            <p className="leading-relaxed">
              VedGuide (&ldquo;we&rdquo;, &ldquo;our&rdquo;, &ldquo;us&rdquo;) is committed to protecting your personal
              information. This Privacy Policy explains how we collect, use, and safeguard your
              data when you use our Platform. By using VedGuide, you consent to the practices
              described in this policy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">2. Information We Collect</h2>
            <p className="leading-relaxed mb-2">We collect the following types of information:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-600">
              <li><span className="font-medium text-gray-700">Account data:</span> Phone number, name, email address</li>
              <li><span className="font-medium text-gray-700">Birth details:</span> Date, time, and place of birth (for Kundli generation)</li>
              <li><span className="font-medium text-gray-700">Usage data:</span> Pages visited, consultation history, session duration</li>
              <li><span className="font-medium text-gray-700">Device data:</span> IP address, browser type, operating system</li>
              <li><span className="font-medium text-gray-700">Payment data:</span> Transaction records (payment details are handled by our payment partners and not stored by us)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">3. How We Use Your Information</h2>
            <p className="leading-relaxed mb-2">Your information is used to:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-600">
              <li>Create and manage your account</li>
              <li>Generate your Kundli and provide personalized astrology readings</li>
              <li>Process payments and maintain transaction records</li>
              <li>Send consultation updates via WhatsApp or SMS</li>
              <li>Improve our services and user experience</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">4. WhatsApp &amp; SMS Communications</h2>
            <p className="leading-relaxed">
              When you provide your phone number and consent, we may send you OTP codes,
              consultation reminders, and service updates via WhatsApp or SMS. You can withdraw
              consent at any time by contacting us. Standard messaging rates from your carrier
              may apply.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">5. Data Sharing</h2>
            <p className="leading-relaxed">
              We do not sell your personal data. We may share your information with:
            </p>
            <ul className="list-disc list-inside space-y-1 text-gray-600 mt-2">
              <li>Astrologers on our Platform, to the extent required to fulfill your consultation</li>
              <li>Payment processors (Razorpay or similar) for transaction processing</li>
              <li>Analytics providers (PostHog, Google Analytics) for Platform improvement — anonymized</li>
              <li>Legal authorities when required by applicable law</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">6. Data Retention</h2>
            <p className="leading-relaxed">
              We retain your personal data for as long as your account is active or as needed
              to provide services. You may request deletion of your account and associated data
              by contacting{" "}
              <a href="mailto:support@vedguide.in" className="text-brand underline underline-offset-2">
                support@vedguide.in
              </a>. Some data may be retained for legal or compliance purposes.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">7. Security</h2>
            <p className="leading-relaxed">
              We use industry-standard security measures including encryption (HTTPS/TLS),
              secure authentication, and access controls to protect your data. However, no
              method of transmission over the internet is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">8. Cookies &amp; Tracking</h2>
            <p className="leading-relaxed">
              We use cookies and similar tracking technologies to maintain session state,
              analyze Platform usage, and improve user experience. You can control cookie
              preferences through your browser settings, though some features may not function
              correctly without cookies.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">9. Your Rights</h2>
            <p className="leading-relaxed mb-2">You have the right to:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-600">
              <li>Access the personal data we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Withdraw consent for communications</li>
              <li>Lodge a complaint with relevant data protection authorities</li>
            </ul>
            <p className="leading-relaxed mt-2">
              To exercise these rights, email us at{" "}
              <a href="mailto:support@vedguide.in" className="text-brand underline underline-offset-2">
                support@vedguide.in
              </a>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">10. Children&apos;s Privacy</h2>
            <p className="leading-relaxed">
              VedGuide is not directed at children under 18. We do not knowingly collect
              personal information from minors. If you believe a minor has provided us with
              personal data, please contact us immediately.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">11. Changes to This Policy</h2>
            <p className="leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of
              significant changes via the Platform or by email. Continued use after changes
              constitutes acceptance.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">12. Contact Us</h2>
            <p className="leading-relaxed">
              For privacy-related questions or concerns, contact us at{" "}
              <a href="mailto:support@vedguide.in" className="text-brand underline underline-offset-2">
                support@vedguide.in
              </a>.
            </p>
          </section>

        </div>

        <div className="mt-12 pt-8 border-t border-gray-100 text-center text-xs text-gray-400">
          Also read our{" "}
          <Link href="/terms" className="text-brand underline underline-offset-2">
            Terms of Use
          </Link>
        </div>
      </div>
    </div>
  );
}
