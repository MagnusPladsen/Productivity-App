import type { Metadata } from 'next';
import { JetBrains_Mono } from 'next/font/google';
import './globals.css';
import PointerGlow from '@/components/PointerGlow';

const display = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['600', '700']
});

const body = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['400', '500', '600']
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
        <PointerGlow />
        {children}
      </body>
    </html>
  );
}
