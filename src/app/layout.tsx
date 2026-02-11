import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/toast";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://rehabify.app"),
  title: {
    default: "Rehabify - AI Physical Therapy Coach",
    template: "%s | Rehabify",
  },
  description: "AI-Powered Physical Therapy Coach with Real-Time Form Correction for low back rehabilitation. Privacy-first computer vision in your browser.",
  keywords: ["physical therapy", "AI coach", "form correction", "back pain", "rehabilitation", "exercise guidance", "computer vision"],
  authors: [{ name: "Rehabify" }],
  creator: "Rehabify",
  publisher: "Rehabify",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "Rehabify",
    title: "Rehabify - AI Physical Therapy Coach",
    description: "AI-Powered Physical Therapy Coach with Real-Time Form Correction for low back rehabilitation.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Rehabify - AI Physical Therapy Coach",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Rehabify - AI Physical Therapy Coach",
    description: "AI-Powered Physical Therapy Coach with Real-Time Form Correction for low back rehabilitation.",
    images: ["/og-image.png"],
    creator: "@rehabify",
  },
  verification: {
    // Add verification codes when available
    // google: "verification_code",
    // yandex: "verification_code",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${jakarta.variable} font-sans font-medium antialiased`}>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
