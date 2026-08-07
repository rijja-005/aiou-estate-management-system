import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '../components/theme-provider';

export const metadata: Metadata = {
  title: 'AIOU Estate Management System',
  description: 'Estate management platform for Allama Iqbal Open University.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>): React.ReactElement {
  return (
    <html lang="en" suppressHydrationWarning>
      <body><ThemeProvider>{children}</ThemeProvider></body>
    </html>
  );
}
