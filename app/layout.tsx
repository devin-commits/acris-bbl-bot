import './globals.css';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'Manhattan Rent-Stabilized Finder',
  description:
    'Scour the web for likely rent-stabilized apartments in Manhattan using stabilized-building intel and smart search filters.'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900">
        {children}
      </body>
    </html>
  );
}

