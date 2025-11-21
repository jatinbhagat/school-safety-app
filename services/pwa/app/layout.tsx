import './globals.css';

export const metadata = {
  title: 'SafelyNotify - Anonymous Incident Reporting Platform for Schools',
  description: 'AI-powered anonymous incident reporting platform for schools. Students report safely, staff respond instantly, patterns emerge clearly. FERPA compliant with 85-90% AI routing accuracy.',
  keywords: 'school safety reporting, anonymous incident reporting, school safety platform, FERPA compliant, AI incident management, educational safety software',
  authors: [{ name: 'SafelyNotify' }],
  creator: 'SafelyNotify',
  publisher: 'SafelyNotify',
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://safelynotify.com',
    title: 'SafelyNotify - Anonymous Incident Reporting Platform for Schools',
    description: 'AI-powered anonymous incident reporting platform for schools. Students report safely, staff respond instantly, patterns emerge clearly.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'SafelyNotify - Anonymous School Safety Reporting Platform',
      },
    ],
    siteName: 'SafelyNotify',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SafelyNotify - Anonymous Incident Reporting Platform for Schools',
    description: 'AI-powered anonymous incident reporting platform for schools. Students report safely, staff respond instantly.',
    images: ['/og-image.jpg'],
  },
  verification: {
    google: 'your-google-site-verification-code',
  },
  alternates: {
    canonical: 'https://safelynotify.com',
  },
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon.ico' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/site.webmanifest',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Additional PWA meta tags not handled by metadata */}
        <meta name="theme-color" content="#2563eb" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="SafelyNotify" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#2563eb" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
