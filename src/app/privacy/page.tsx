import * as React from "react";
import type { Metadata } from "next";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Card } from "@/components/ui/card";
import { LockIcon, ShieldIcon, DatabaseIcon, MicrophoneIcon } from "@/components/ui/icons";

export const metadata: Metadata = {
  title: "Privacy Policy - Rehabify",
  description: "Learn how Rehabify protects your privacy with client-side video processing and secure data handling practices.",
};

export default function PrivacyPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header showCTA={false} />

      <main className="flex-1 bg-gradient-to-b from-sage-50/50 to-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          {/* Page Header */}
          <div className="max-w-4xl mx-auto mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Privacy Policy
            </h1>
            <p className="text-sm text-muted-foreground">
              Last Updated: December 29, 2024
            </p>
          </div>

          {/* Privacy Highlights Section */}
          <section className="max-w-4xl mx-auto mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">
              Privacy Highlights
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Video Privacy Card */}
              <Card className="p-6 border-2 border-sage-200/50 bg-gradient-to-br from-white to-sage-50/30">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <LockIcon size="lg" variant="sage" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-foreground">
                      Your Video Never Leaves Your Device
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      All pose analysis happens locally in your browser using WebAssembly.
                      MediaPipe runs client-side - we never see, store, or transmit your video frames.
                    </p>
                  </div>
                </div>
              </Card>

              {/* Data We Collect Card */}
              <Card className="p-6 border-2 border-coral-200/50 bg-gradient-to-br from-white to-coral-50/30">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <DatabaseIcon size="lg" variant="coral" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-foreground">
                      What We Do Collect
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      We only collect joint angles, rep counts, form scores, and session metrics.
                      No video frames, just numeric data to track your progress.
                    </p>
                  </div>
                </div>
              </Card>

              {/* Voice Data Card */}
              <Card className="p-6 border-2 border-sage-200/50 bg-gradient-to-br from-white to-sage-50/30">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <MicrophoneIcon size="lg" variant="sage" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-foreground">
                      Voice Audio Processing
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Voice audio IS transmitted to Vapi and OpenAI via encrypted WebSocket
                      for speech-to-text and conversational AI coaching.
                    </p>
                  </div>
                </div>
              </Card>

              {/* Security Card */}
              <Card className="p-6 border-2 border-coral-200/50 bg-gradient-to-br from-white to-coral-50/30">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <ShieldIcon size="lg" variant="coral" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-foreground">
                      Enterprise-Grade Security
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      All data transmission uses TLS encryption. We use Neon PostgreSQL
                      with row-level security for data storage.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </section>

          {/* Legal Content */}
          <article className="max-w-4xl mx-auto prose prose-sage">
            {/* Information We Collect */}
            <section className="mb-10">
              <h2 className="text-xl md:text-2xl font-bold text-foreground mb-4">
                Information We Collect
              </h2>
              <div className="space-y-4 text-base leading-relaxed text-foreground">
                <p>
                  Rehabify collects different types of information to provide and improve our service:
                </p>

                <h3 className="text-lg font-semibold text-foreground mt-6 mb-3">
                  Account Information
                </h3>
                <p>
                  When you create an account, we collect your email address, name, and password.
                  Passwords are hashed and never stored in plain text.
                </p>

                <h3 className="text-lg font-semibold text-foreground mt-6 mb-3">
                  Exercise Data
                </h3>
                <p>
                  During exercise sessions, we collect:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Joint angles calculated from pose landmarks (no video frames)</li>
                  <li>Rep counts and form scores for each exercise</li>
                  <li>Session duration and timestamps</li>
                  <li>Form error types and frequencies</li>
                  <li>Progress metrics over time</li>
                </ul>

                <h3 className="text-lg font-semibold text-foreground mt-6 mb-3">
                  Voice Data
                </h3>
                <p>
                  When you use voice AI coaching features, your voice audio is transmitted to:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li><strong>Vapi</strong> - Real-time voice AI platform for exercise coaching</li>
                  <li><strong>Deepgram</strong> - Speech-to-text transcription (via Vapi)</li>
                  <li><strong>OpenAI</strong> - Language model for generating coaching responses (via Vapi)</li>
                  <li><strong>ElevenLabs</strong> - Text-to-speech for voice output (via Vapi)</li>
                </ul>
                <p>
                  Audio data is transmitted via encrypted WebSocket connections and processed in real-time.
                  Vapi may retain audio recordings for quality assurance and model improvement as described
                  in their privacy policy.
                </p>

                <h3 className="text-lg font-semibold text-foreground mt-6 mb-3">
                  Usage Data
                </h3>
                <p>
                  We automatically collect information about how you use our service, including:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Pages visited and features accessed</li>
                  <li>Device type, browser type, and operating system</li>
                  <li>IP address and approximate geographic location (city/country level)</li>
                  <li>Session timestamps and duration</li>
                </ul>
              </div>
            </section>

            {/* How We Use Your Information */}
            <section className="mb-10">
              <h2 className="text-xl md:text-2xl font-bold text-foreground mb-4">
                How We Use Your Information
              </h2>
              <div className="space-y-4 text-base leading-relaxed text-foreground">
                <p>
                  We use the information we collect to:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Provide real-time form correction and exercise coaching</li>
                  <li>Track your rehabilitation progress over time</li>
                  <li>Improve our pose detection algorithms and coaching responses</li>
                  <li>Send you service updates, security alerts, and support messages</li>
                  <li>Detect and prevent fraud, abuse, and technical issues</li>
                  <li>Comply with legal obligations and respond to legal requests</li>
                </ul>
                <p>
                  We do NOT use your data for advertising purposes or sell it to third parties.
                </p>
              </div>
            </section>

            {/* Data Sharing and Third Parties */}
            <section className="mb-10">
              <h2 className="text-xl md:text-2xl font-bold text-foreground mb-4">
                Data Sharing and Third Parties
              </h2>
              <div className="space-y-4 text-base leading-relaxed text-foreground">
                <p>
                  Rehabify shares your information with the following trusted third-party services:
                </p>

                <h3 className="text-lg font-semibold text-foreground mt-6 mb-3">
                  Vapi (Voice AI Platform)
                </h3>
                <p className="text-muted-foreground">
                  Voice audio, session context, and form correction data are transmitted to Vapi
                  for real-time conversational AI coaching. Vapi processes this data through
                  Deepgram (speech-to-text), OpenAI (language model), and ElevenLabs (text-to-speech).
                </p>

                <h3 className="text-lg font-semibold text-foreground mt-6 mb-3">
                  Neon (Database and Authentication)
                </h3>
                <p className="text-muted-foreground">
                  Your account information, exercise data, and session metrics are stored in
                  Neon PostgreSQL with row-level security policies. Neon Auth handles user
                  authentication securely.
                </p>

                <h3 className="text-lg font-semibold text-foreground mt-6 mb-3">
                  Google Gemini (Plan Generation)
                </h3>
                <p className="text-muted-foreground">
                  Your exercise history and progress data may be sent to Google Gemini to
                  generate personalized rehabilitation plans. This data is anonymized where possible.
                </p>

                <p className="mt-6">
                  We do NOT share your personal information with marketers, advertisers, or
                  data brokers. We only share data with service providers necessary to operate
                  Rehabify, and we require them to protect your information.
                </p>
              </div>
            </section>

            {/* Data Security Measures */}
            <section className="mb-10">
              <h2 className="text-xl md:text-2xl font-bold text-foreground mb-4">
                Data Security Measures
              </h2>
              <div className="space-y-4 text-base leading-relaxed text-foreground">
                <p>
                  We implement industry-standard security measures to protect your data:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li><strong>Client-Side Video Processing:</strong> Video frames never leave your device.
                  MediaPipe Pose runs entirely in your browser using WebAssembly.</li>
                  <li><strong>TLS Encryption:</strong> All data transmission between your browser and
                  our servers uses HTTPS/TLS encryption.</li>
                  <li><strong>Encrypted WebSockets:</strong> Voice audio is transmitted via secure
                  WebSocket connections (WSS protocol).</li>
                  <li><strong>Password Hashing:</strong> Passwords are hashed using bcrypt before storage.</li>
                  <li><strong>Row-Level Security:</strong> Neon PostgreSQL uses RLS policies to ensure
                  users can only access their own data.</li>
                  <li><strong>Regular Security Audits:</strong> We review and update our security
                  practices regularly.</li>
                </ul>
                <p>
                  While we strive to protect your information, no security system is impenetrable.
                  If you believe your account has been compromised, please contact us immediately
                  at security@rehabify.com.
                </p>
              </div>
            </section>

            {/* Your Rights and Choices */}
            <section className="mb-10">
              <h2 className="text-xl md:text-2xl font-bold text-foreground mb-4">
                Your Rights and Choices
              </h2>
              <div className="space-y-4 text-base leading-relaxed text-foreground">
                <p>
                  You have the following rights regarding your personal information:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li><strong>Access:</strong> Request a copy of the personal data we hold about you.</li>
                  <li><strong>Correction:</strong> Request corrections to inaccurate or incomplete data.</li>
                  <li><strong>Deletion:</strong> Request deletion of your account and associated data.</li>
                  <li><strong>Export:</strong> Download your exercise data in a portable format (CSV/JSON).</li>
                  <li><strong>Object:</strong> Object to certain data processing activities.</li>
                  <li><strong>Withdraw Consent:</strong> Withdraw consent for data processing where
                  consent was the legal basis.</li>
                </ul>
                <p>
                  To exercise these rights, email us at privacy@rehabify.com or use the account
                  settings page after logging in. We will respond to your request within 30 days.
                </p>

                <h3 className="text-lg font-semibold text-foreground mt-6 mb-3">
                  Data Retention
                </h3>
                <p className="text-muted-foreground">
                  We retain your account information and exercise data for as long as your account
                  is active. If you delete your account, we will permanently delete your personal
                  data within 90 days, except where we are required to retain it for legal compliance.
                </p>
              </div>
            </section>

            {/* Children's Privacy */}
            <section className="mb-10">
              <h2 className="text-xl md:text-2xl font-bold text-foreground mb-4">
                Children&apos;s Privacy
              </h2>
              <div className="space-y-4 text-base leading-relaxed text-foreground">
                <p>
                  Rehabify is not intended for use by children under 13 years of age. We do not
                  knowingly collect personal information from children under 13.
                </p>
                <p>
                  If you are a parent or guardian and believe your child has provided us with
                  personal information, please contact us at privacy@rehabify.com and we will
                  delete the information promptly.
                </p>
                <p>
                  Users between 13 and 18 years of age should use Rehabify only with parental
                  consent and supervision. We recommend consulting with a healthcare provider
                  before beginning any rehabilitation program.
                </p>
              </div>
            </section>

            {/* Changes to This Policy */}
            <section className="mb-10">
              <h2 className="text-xl md:text-2xl font-bold text-foreground mb-4">
                Changes to This Privacy Policy
              </h2>
              <div className="space-y-4 text-base leading-relaxed text-foreground">
                <p>
                  We may update this Privacy Policy from time to time to reflect changes in our
                  practices or for legal, operational, or regulatory reasons.
                </p>
                <p>
                  When we make material changes, we will:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Update the &ldquo;Last Updated&rdquo; date at the top of this page</li>
                  <li>Send you an email notification if you have an account</li>
                  <li>Display a prominent notice on our website for 30 days</li>
                </ul>
                <p>
                  Your continued use of Rehabify after changes become effective constitutes
                  acceptance of the updated Privacy Policy. If you do not agree with the changes,
                  you may delete your account.
                </p>
              </div>
            </section>

            {/* Contact Information */}
            <section className="mb-10">
              <h2 className="text-xl md:text-2xl font-bold text-foreground mb-4">
                Contact Information
              </h2>
              <div className="space-y-4 text-base leading-relaxed text-foreground">
                <p>
                  If you have questions, concerns, or requests regarding this Privacy Policy or
                  our data practices, please contact us:
                </p>
                <div className="bg-sage-50 p-6 rounded-lg border border-sage-200/50 space-y-2 text-muted-foreground">
                  <p><strong className="text-foreground">Email:</strong> privacy@rehabify.com</p>
                  <p><strong className="text-foreground">Security Issues:</strong> security@rehabify.com</p>
                  <p><strong className="text-foreground">General Support:</strong> support@rehabify.com</p>
                </div>
                <p>
                  We are committed to resolving privacy concerns promptly and transparently.
                  We will acknowledge your inquiry within 48 hours and provide a full response
                  within 30 days.
                </p>
              </div>
            </section>
          </article>
        </div>
      </main>

      <Footer />
    </div>
  );
}
