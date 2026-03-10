import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://kotm.app"),

  /* ── Core ──────────────────────────────────────────────────────────── */
  title: {
    template: "%s | King of the Market – ملك السوق",
    default:  "King of the Market | ملك السوق – سوق السيارات الأول في البحرين",
  },
  description:
    "King of the Market (ملك السوق) هو تطبيق سوق السيارات الأول في البحرين. بيع واشترِ سيارتك بسهولة مع آلاف الإعلانات من الأفراد والمعارض. حمّل التطبيق مجاناً الآن على iOS وAndroid.",

  keywords: [
    "سيارات البحرين", "بيع سيارات البحرين", "شراء سيارات البحرين",
    "سوق السيارات البحرين", "سيارات مستعملة البحرين",
    "معارض سيارات البحرين", "اعلانات سيارات", "تطبيق سيارات البحرين",
    "King of the Market", "ملك السوق", "KOM", "KOTM", "kotm.app",
    "car market Bahrain", "used cars Bahrain", "buy car Bahrain",
    "sell car Bahrain", "car dealerships Bahrain", "Bahrain car app",
    "سيارات للبيع", "سيارات بالتقسيط البحرين",
  ],

  authors:     [{ name: "King of the Market", url: "https://kotm.app" }],
  creator:     "King of the Market",
  publisher:   "King of the Market",
  category:    "automotive",
  applicationName: "King of the Market",
  referrer:    "origin-when-cross-origin",

  /* ── Robots / Indexing ─────────────────────────────────────────────── */
  robots: {
    index:  true,
    follow: true,
    googleBot: {
      index:  true,
      follow: true,
      "max-video-preview":   -1,
      "max-image-preview":   "large",
      "max-snippet":         -1,
    },
  },

  /* ── Open Graph (Facebook, WhatsApp, LinkedIn…) ───────────────────── */
  openGraph: {
    type:            "website",
    locale:          "ar_BH",
    alternateLocale: ["ar_SA", "ar_AE", "ar_KW", "en_US"],
    url:             "https://kotm.app",
    siteName:        "King of the Market | ملك السوق",
    title:           "King of the Market | ملك السوق – سوق السيارات الأول في البحرين",
    description:
      "تطبيق سوق السيارات الأول في البحرين. بيع واشترِ سيارتك بسهولة مع آلاف الإعلانات من الأفراد والمعارض. مجاناً على iOS وAndroid.",
    images: [
      {
        url:    "/og-image.png",
        width:  1200,
        height: 630,
        alt:    "King of the Market – ملك السوق | سوق السيارات في البحرين",
        type:   "image/png",
      },
      {
        url:    "/logo.png",
        width:  1024,
        height: 1024,
        alt:    "King of the Market Logo شعار ملك السوق",
        type:   "image/png",
      },
    ],
  },

  /* ── Twitter / X ───────────────────────────────────────────────────── */
  twitter: {
    card:        "summary_large_image",
    site:        "@kotm_app",
    creator:     "@kotm_app",
    title:       "King of the Market | ملك السوق – سوق السيارات في البحرين",
    description: "سوق السيارات الأول في البحرين – بيع واشترِ سيارتك الآن بكل سهولة",
    images: [{
      url: "/og-image.png",
      alt: "King of the Market – ملك السوق",
    }],
  },

  /* ── Canonical + hreflang ──────────────────────────────────────────── */
  alternates: {
    canonical: "https://kotm.app",
    languages: {
      "ar":    "https://kotm.app",
      "ar-BH": "https://kotm.app",
      "en":    "https://kotm.app",
      "x-default": "https://kotm.app",
    },
  },

  /* ── Icons (Favicon, Apple Touch, PWA) ────────────────────────────── */
  icons: {
    icon: [
      { url: "/favicon.ico",  sizes: "any",       type: "image/x-icon" },
      { url: "/logo.png",     sizes: "512x512",   type: "image/png" },
      { url: "/logo.png",     sizes: "192x192",   type: "image/png" },
    ],
    apple:    [{ url: "/logo.png", sizes: "180x180", type: "image/png" }],
    shortcut: "/favicon.ico",
    other: [
      { rel: "mask-icon",       url: "/logo.png", color: "#D4AF37" },
      { rel: "apple-touch-icon-precomposed", url: "/logo.png" },
    ],
  },

  /* ── PWA Manifest ──────────────────────────────────────────────────── */
  manifest: "/manifest.json",

  /* ── Verification ──────────────────────────────────────────────────── */
  // verification: { google: "YOUR_GOOGLE_VERIFICATION_CODE" },

  /* ── Extra meta ────────────────────────────────────────────────────── */
  other: {
    /* Geo targeting – Bahrain */
    "geo.region":    "BH",
    "geo.placename": "Bahrain",
    "geo.position":  "26.0667;50.5577",
    "ICBM":          "26.0667, 50.5577",

    /* Mobile web app */
    "mobile-web-app-capable":              "yes",
    "apple-mobile-web-app-capable":        "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "apple-mobile-web-app-title":          "King of the Market",
    "msapplication-TileColor":             "#D4AF37",
    "msapplication-TileImage":             "/logo.png",
    "theme-color":                         "#0f172a",

    /* AI crawlers — answer engines (ChatGPT, Perplexity, Gemini…) */
    "ai:description":
      "King of the Market (ملك السوق) is Bahrain's #1 car marketplace app. Users can buy and sell new and used cars, browse thousands of listings from individuals and dealers, chat directly, and subscribe to featured listing packages. Available free on iOS and Android. Website: kotm.app. Support: info@kotm.app.",
    "ai:keywords":
      "Bahrain car marketplace, used cars Bahrain, buy sell car Bahrain, car app, ملك السوق, سوق سيارات البحرين",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  /* ─── JSON-LD Organisation + Website ─────────────────────────────── */
  const orgSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id":   "https://kotm.app/#organization",
        name:    "King of the Market",
        alternateName: ["ملك السوق", "KOM", "KOTM"],
        url:     "https://kotm.app",
        logo: {
          "@type":  "ImageObject",
          url:      "https://kotm.app/logo.png",
          width:    1024,
          height:   1024,
        },
        sameAs: [
          "https://apps.apple.com/app/kom/id0000000000",
          "https://play.google.com/store/apps/details?id=app.kotm.kom",
        ],
        contactPoint: {
          "@type":       "ContactPoint",
          email:         "info@kotm.app",
          contactType:   "customer support",
          availableLanguage: ["Arabic", "English"],
          areaServed: "BH",
        },
        address: {
          "@type":           "PostalAddress",
          addressCountry:    "BH",
          addressLocality:   "Manama",
          addressRegion:     "Capital Governorate",
        },
        foundingLocation: { "@type": "Country", name: "Bahrain" },
        knowsAbout: ["سيارات", "Car Marketplace", "Used Cars", "Automotive"],
      },
      {
        "@type":           "WebSite",
        "@id":             "https://kotm.app/#website",
        url:               "https://kotm.app",
        name:              "King of the Market | ملك السوق",
        description:       "سوق السيارات الأول في البحرين",
        publisher:         { "@id": "https://kotm.app/#organization" },
        inLanguage:        ["ar", "en"],
        potentialAction: {
          "@type":       "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: "https://kotm.app/?q={search_term_string}",
          },
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };

  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        {/* ── JSON-LD ─────────────────────────────────────────────── */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
