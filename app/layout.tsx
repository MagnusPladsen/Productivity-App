import type { Metadata } from 'next';
import { Instrument_Serif, Karla } from 'next/font/google';
import './globals.css';

const display = Instrument_Serif({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['400']
});

const body = Karla({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['400', '500', '600', '700']
});

export const metadata: Metadata = {
  title: 'Productivity Stack',
  description: 'A curated productivity stack with tools that turn ideas into momentum.'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body className="font-body antialiased">
        {children}
      </body>
    </html>
  );
}
