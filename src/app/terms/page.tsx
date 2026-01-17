import * as React from "react";
import type { Metadata } from "next";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

export const metadata: Metadata = {
  title: "Terms of Service - Rehabify",
  description: "Read the terms and conditions for using Rehabify, including medical disclaimers, user responsibilities, and acceptable use policies.",
};

export default function TermsPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header showCTA={false} />

      <main className="flex-1 bg-gradient-to-b from-sage-50/50 to-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          {/* Page Header */}
          <div className="max-w-4xl mx-auto mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Terms of Service
            </h1>
            <p className="text-sm text-muted-foreground">
              Last Updated: December 29, 2024
            </p>
          </div>

          {/* Legal Content */}
          <article className="max-w-4xl mx-auto prose prose-sage">
            {/* Medical Disclaimer - Critical Section */}
            <section className="mb-10">
              <Alert variant="warning">
                <AlertTitle>Medical Disclaimer</AlertTitle>
                <AlertDescription>
                  <strong>Rehabify is NOT a substitute for professional medical advice, diagnosis, or treatment.</strong> Always consult with a qualified healthcare provider, physical therapist, or physician before beginning any rehabilitation program or exercise routine. The AI-powered form correction and voice coaching are for informational and educational purposes only. If you experience pain, discomfort, dizziness, or any adverse symptoms during exercise, stop immediately and consult your healthcare provider.
                </AlertDescription>
              </Alert>
            </section>

            {/* User Responsibilities for Exercise Safety */}
            <section className="mb-10">
              <h2 className="text-xl md:text-2xl font-bold text-foreground mb-4">
                User Responsibilities for Exercise Safety
              </h2>
              <div className="space-y-4 text-base leading-relaxed text-foreground">
                <p>
                  By using Rehabify, you agree to the following safety responsibilities:
                </p>

                <h3 className="text-lg font-semibold text-foreground mt-6 mb-3">
                  Medical Clearance
                </h3>
                <p>
                  You must obtain clearance from your healthcare provider before using Rehabify, especially if you have:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Recent injuries, surgeries, or medical conditions</li>
                  <li>Chronic pain, cardiovascular issues, or respiratory conditions</li>
                  <li>Any condition that may be affected by physical activity</li>
                  <li>Pregnancy or recent childbirth</li>
                </ul>

                <h3 className="text-lg font-semibold text-foreground mt-6 mb-3">
                  Safe Exercise Environment
                </h3>
                <p>
                  You are responsible for ensuring:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Adequate space to perform exercises without obstruction</li>
                  <li>Stable, non-slip flooring suitable for exercise</li>
                  <li>Proper exercise equipment (yoga mat, props, etc.) when needed</li>
                  <li>Good lighting and ventilation</li>
                  <li>Access to water and emergency contact if needed</li>
                </ul>

                <h3 className="text-lg font-semibold text-foreground mt-6 mb-3">
                  Listening to Your Body
                </h3>
                <p>
                  You must:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li><strong>Stop immediately</strong> if you experience pain, dizziness, shortness of breath, or unusual discomfort</li>
                  <li>Never push through sharp or sudden pain</li>
                  <li>Modify exercises to match your current fitness and mobility level</li>
                  <li>Take breaks as needed and stay hydrated</li>
                  <li>Report any adverse effects to your healthcare provider promptly</li>
                </ul>

                <Alert variant="default" className="mt-6">
                  <AlertTitle>Important</AlertTitle>
                  <AlertDescription>
                    You assume all risk and liability for injuries or adverse effects resulting from use of Rehabify. We strongly recommend working with a licensed physical therapist or healthcare provider alongside using this app.
                  </AlertDescription>
                </Alert>
              </div>
            </section>

            {/* Acceptable Use of Voice AI */}
            <section className="mb-10">
              <h2 className="text-xl md:text-2xl font-bold text-foreground mb-4">
                Acceptable Use of Voice AI
              </h2>
              <div className="space-y-4 text-base leading-relaxed text-foreground">
                <p>
                  Rehabify&apos;s voice AI coaching feature is designed to provide real-time form correction and exercise guidance. You agree to use this feature appropriately:
                </p>

                <h3 className="text-lg font-semibold text-foreground mt-6 mb-3">
                  Permitted Uses
                </h3>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Receiving form correction during prescribed rehabilitation exercises</li>
                  <li>Asking questions about exercise technique and form</li>
                  <li>Requesting exercise modifications for comfort and safety</li>
                  <li>Tracking progress and exercise history</li>
                </ul>

                <h3 className="text-lg font-semibold text-foreground mt-6 mb-3">
                  Prohibited Uses
                </h3>
                <p>
                  You may NOT use Rehabify&apos;s voice AI for:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li><strong>Medical emergencies</strong> - Call emergency services (911) for urgent medical issues</li>
                  <li>Diagnosis of injuries, illnesses, or medical conditions</li>
                  <li>Prescription or recommendation of medications or medical treatments</li>
                  <li>Replacement for in-person physical therapy or medical care</li>
                  <li>Harassment, abuse, or inappropriate language</li>
                  <li>Attempting to manipulate, jailbreak, or misuse the AI system</li>
                  <li>Sharing harmful, illegal, or fraudulent content</li>
                </ul>

                <h3 className="text-lg font-semibold text-foreground mt-6 mb-3">
                  Voice Data Processing
                </h3>
                <p className="text-muted-foreground">
                  Your voice audio is transmitted to Vapi, Deepgram, OpenAI, and ElevenLabs via encrypted connections for speech-to-text, conversational AI, and text-to-speech processing. By using voice features, you consent to this data transmission as described in our <a href="/privacy" className="text-sage-600 hover:text-sage-700 underline">Privacy Policy</a>.
                </p>

                <Alert variant="warning" className="mt-6">
                  <AlertTitle>Warning</AlertTitle>
                  <AlertDescription>
                    Voice AI may occasionally provide inaccurate or incomplete guidance. Always prioritize your healthcare provider&apos;s instructions and your own body&apos;s signals over AI-generated advice.
                  </AlertDescription>
                </Alert>
              </div>
            </section>

            {/* Acceptance of Terms */}
            <section className="mb-10">
              <h2 className="text-xl md:text-2xl font-bold text-foreground mb-4">
                Acceptance of Terms
              </h2>
              <div className="space-y-4 text-base leading-relaxed text-foreground">
                <p>
                  By accessing or using Rehabify (the &ldquo;Service&rdquo;), you agree to be bound by these Terms of Service (&ldquo;Terms&rdquo;). If you do not agree to these Terms, you may not access or use the Service.
                </p>
                <p>
                  These Terms constitute a legally binding agreement between you and Rehabify (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;). We reserve the right to update these Terms at any time, and your continued use of the Service after changes are posted constitutes acceptance of the updated Terms.
                </p>
                <p>
                  You must be at least 13 years old to use Rehabify. Users between 13 and 18 must have parental consent and supervision.
                </p>
              </div>
            </section>

            {/* User Accounts */}
            <section className="mb-10">
              <h2 className="text-xl md:text-2xl font-bold text-foreground mb-4">
                User Accounts
              </h2>
              <div className="space-y-4 text-base leading-relaxed text-foreground">
                <p>
                  To access certain features of the Service, you must create an account. You agree to:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Provide accurate, current, and complete registration information</li>
                  <li>Maintain and promptly update your account information</li>
                  <li>Keep your password secure and confidential</li>
                  <li>Notify us immediately of any unauthorized account access</li>
                  <li>Accept responsibility for all activities under your account</li>
                  <li>Not share your account credentials with others</li>
                </ul>
                <p>
                  We reserve the right to suspend or terminate accounts that violate these Terms or engage in fraudulent, abusive, or illegal activity.
                </p>
              </div>
            </section>

            {/* Intellectual Property */}
            <section className="mb-10">
              <h2 className="text-xl md:text-2xl font-bold text-foreground mb-4">
                Intellectual Property
              </h2>
              <div className="space-y-4 text-base leading-relaxed text-foreground">
                <p>
                  The Service, including its software, design, logos, text, graphics, and other content (excluding user-generated content), is owned by Rehabify and protected by copyright, trademark, and other intellectual property laws.
                </p>

                <h3 className="text-lg font-semibold text-foreground mt-6 mb-3">
                  License to Use
                </h3>
                <p className="text-muted-foreground">
                  We grant you a limited, non-exclusive, non-transferable, revocable license to access and use the Service for personal, non-commercial rehabilitation purposes, subject to these Terms.
                </p>

                <h3 className="text-lg font-semibold text-foreground mt-6 mb-3">
                  Restrictions
                </h3>
                <p>
                  You may NOT:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Copy, modify, distribute, or reverse-engineer any part of the Service</li>
                  <li>Use the Service for commercial purposes without written permission</li>
                  <li>Remove or alter any copyright, trademark, or proprietary notices</li>
                  <li>Access the Service through automated means (bots, scrapers, etc.)</li>
                  <li>Interfere with or disrupt the Service&apos;s operation</li>
                </ul>

                <h3 className="text-lg font-semibold text-foreground mt-6 mb-3">
                  Your Content
                </h3>
                <p className="text-muted-foreground">
                  You retain ownership of your exercise data, progress metrics, and other content you create using the Service. By using the Service, you grant us a license to use, store, and process this data as described in our <a href="/privacy" className="text-sage-600 hover:text-sage-700 underline">Privacy Policy</a>.
                </p>
              </div>
            </section>

            {/* Limitation of Liability */}
            <section className="mb-10">
              <h2 className="text-xl md:text-2xl font-bold text-foreground mb-4">
                Limitation of Liability
              </h2>
              <div className="space-y-4 text-base leading-relaxed text-foreground">
                <p>
                  <strong>TO THE MAXIMUM EXTENT PERMITTED BY LAW:</strong>
                </p>
                <p>
                  Rehabify and its officers, directors, employees, and affiliates SHALL NOT BE LIABLE for any indirect, incidental, special, consequential, or punitive damages, including but not limited to:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Personal injury or medical complications arising from use of the Service</li>
                  <li>Loss of data, profits, revenue, or business opportunities</li>
                  <li>Service interruptions, errors, or technical failures</li>
                  <li>Reliance on AI-generated exercise guidance or form correction</li>
                  <li>Third-party actions or content (including Vapi, OpenAI, etc.)</li>
                </ul>
                <p>
                  The Service is provided &ldquo;AS IS&rdquo; and &ldquo;AS AVAILABLE&rdquo; without warranties of any kind, either express or implied, including but not limited to warranties of merchantability, fitness for a particular purpose, or non-infringement.
                </p>
                <p>
                  In jurisdictions that do not allow the exclusion of certain warranties or limitations of liability, our liability shall be limited to the maximum extent permitted by law. In no event shall our total liability exceed the amount you paid us (if any) in the 12 months preceding the claim.
                </p>
                <Alert variant="default" className="mt-6">
                  <AlertTitle>Acknowledgment</AlertTitle>
                  <AlertDescription>
                    You acknowledge and agree that you use Rehabify at your own risk. We strongly recommend consulting healthcare professionals before and during your rehabilitation journey.
                  </AlertDescription>
                </Alert>
              </div>
            </section>

            {/* Termination */}
            <section className="mb-10">
              <h2 className="text-xl md:text-2xl font-bold text-foreground mb-4">
                Termination
              </h2>
              <div className="space-y-4 text-base leading-relaxed text-foreground">
                <p>
                  You may terminate your account at any time by accessing your account settings or contacting us at support@rehabify.com. Upon termination, your right to access the Service will cease immediately.
                </p>
                <p>
                  We reserve the right to suspend or terminate your account, without notice, if:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>You violate these Terms of Service</li>
                  <li>You engage in fraudulent, abusive, or illegal activity</li>
                  <li>Your account has been inactive for an extended period</li>
                  <li>Required by law or legal process</li>
                  <li>Necessary to protect the safety or rights of Rehabify or other users</li>
                </ul>
                <p>
                  Upon termination, we will delete your personal data within 90 days, except where retention is required for legal compliance as described in our <a href="/privacy" className="text-sage-600 hover:text-sage-700 underline">Privacy Policy</a>.
                </p>
              </div>
            </section>

            {/* Changes to Terms */}
            <section className="mb-10">
              <h2 className="text-xl md:text-2xl font-bold text-foreground mb-4">
                Changes to These Terms
              </h2>
              <div className="space-y-4 text-base leading-relaxed text-foreground">
                <p>
                  We may update these Terms of Service from time to time to reflect changes in our practices, legal requirements, or service features.
                </p>
                <p>
                  When we make material changes, we will:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Update the &ldquo;Last Updated&rdquo; date at the top of this page</li>
                  <li>Send you an email notification if you have an account</li>
                  <li>Display a prominent notice on our website for 30 days</li>
                  <li>Request your acknowledgment of the updated Terms upon next login (for significant changes)</li>
                </ul>
                <p>
                  Your continued use of the Service after changes become effective constitutes acceptance of the updated Terms. If you do not agree with the changes, you must stop using the Service and may delete your account.
                </p>
              </div>
            </section>

            {/* Governing Law */}
            <section className="mb-10">
              <h2 className="text-xl md:text-2xl font-bold text-foreground mb-4">
                Governing Law and Dispute Resolution
              </h2>
              <div className="space-y-4 text-base leading-relaxed text-foreground">
                <p>
                  These Terms shall be governed by and construed in accordance with the laws of the State of California, United States, without regard to its conflict of law provisions.
                </p>

                <h3 className="text-lg font-semibold text-foreground mt-6 mb-3">
                  Informal Resolution
                </h3>
                <p className="text-muted-foreground">
                  Before pursuing formal legal action, you agree to contact us at legal@rehabify.com to attempt to resolve any dispute informally. We will work in good faith to address your concerns within 30 days.
                </p>

                <h3 className="text-lg font-semibold text-foreground mt-6 mb-3">
                  Arbitration
                </h3>
                <p className="text-muted-foreground">
                  Any disputes that cannot be resolved informally shall be resolved through binding arbitration in accordance with the rules of the American Arbitration Association. You waive your right to participate in class actions or class arbitrations.
                </p>

                <h3 className="text-lg font-semibold text-foreground mt-6 mb-3">
                  Exceptions
                </h3>
                <p className="text-muted-foreground">
                  Either party may seek injunctive relief or other equitable remedies in court for intellectual property disputes or to prevent unauthorized access to the Service.
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
                  If you have questions, concerns, or requests regarding these Terms of Service, please contact us:
                </p>
                <div className="bg-sage-50 p-6 rounded-lg border border-sage-200/50 space-y-2 text-muted-foreground">
                  <p><strong className="text-foreground">Legal Inquiries:</strong> legal@rehabify.com</p>
                  <p><strong className="text-foreground">General Support:</strong> support@rehabify.com</p>
                  <p><strong className="text-foreground">Privacy Concerns:</strong> privacy@rehabify.com</p>
                  <p><strong className="text-foreground">Security Issues:</strong> security@rehabify.com</p>
                </div>
                <p>
                  We are committed to addressing your concerns promptly and transparently. We will acknowledge your inquiry within 48 hours and provide a full response within 30 days.
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
