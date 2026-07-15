import type { Metadata, Viewport } from 'next'
import '../index.css'

const SITE_URL = 'https://medinsight-phi.vercel.app'
const SITE_NAME = 'MedInsight'
const TITLE = 'MedInsight - Gestion de Cas Cliniques Médicaux'
const DESCRIPTION =
  "PWA Offline-First de gestion de cas cliniques pour les hôpitaux et médecins de la RD Congo. Documentez, analysez et partagez vos cas en toute sécurité."
const OG_IMAGE = 'https://i.ibb.co/zWyNytSq/t-l-chargement.png'

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#0e384c' },
    { media: '(prefers-color-scheme: dark)', color: '#0a1929' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: DESCRIPTION,
  keywords: [
    'gestion cas cliniques',
    'médecine RD Congo',
    'PWA médicale',
    'dossier patient',
    'hôpital',
    'offline-first',
    'santé numérique',
  ],
  authors: [{ name: 'MedInsight' }],
  creator: 'MedInsight',
  publisher: 'MedInsight',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'fr_DZ',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: TITLE,
    description: DESCRIPTION,
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: 'MedInsight - Plateforme de gestion de cas cliniques médicaux',
        type: 'image/webp',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@medinsight',
    creator: '@medinsight',
    title: TITLE,
    description: DESCRIPTION,
    images: [OG_IMAGE],
  },
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/icon-192.png',
  },
  alternates: {
    canonical: SITE_URL,
  },
  other: {
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'apple-mobile-web-app-title': SITE_NAME,
    'application-name': SITE_NAME,
    'msapplication-TileColor': '#0e384c',
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'MedicalWebApplication',
  name: SITE_NAME,
  description: DESCRIPTION,
  url: SITE_URL,
  applicationCategory: 'MedicalApplication',
  operatingSystem: 'Web',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'DZD',
  },
  author: {
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
  },
  inLanguage: 'fr',
  countryOfOrigin: {
    '@type': 'Country',
    name: 'Algerie',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon-192.png" type="image/png" sizes="192x192" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <link rel="sitemap" type="application/xml" href="/sitemap.xml" />
        <link rel="alternate" type="text/plain" title="llms.txt" href="/llms.txt" />
        <link rel="alternate" hrefLang="fr" href={SITE_URL} />
        <link rel="dns-prefetch" href="https://neon.tech" />
        <link rel="preconnect" href="https://neon.tech" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  )
}
