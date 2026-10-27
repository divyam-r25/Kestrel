import './globals.css';

export const metadata = {
  title: 'Kestrel — Local-First AI Assistant for Windows',
  description: 'A private, local AI assistant that runs entirely on your Windows laptop. Voice or text input, local language models, and a full audit trail of everything it does.',
  keywords: 'local AI, private AI assistant, Windows AI, offline AI, secure AI, no cloud',
  openGraph: {
    title: 'Kestrel — Local-First AI Assistant',
    description: 'Private. Auditable. Runs on your laptop.',
    type: 'website',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#0a0e1a" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🦅</text></svg>" />
      </head>
      <body>{children}</body>
    </html>
  );
}
