import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Classo — Modern Institute Management Platform',
  description:
    'One warm, reliable platform to run Schools, Colleges and Coaching Institutes seamlessly.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Nunito+Sans:ital,opsz,wght@0,6..12,300..900;1,6..12,300..900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#FAF7F2] min-h-screen text-[#1F2937] antialiased">
        {children}
      </body>
    </html>
  );
}
