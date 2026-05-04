import './globals.css';
import { Analytics } from '@vercel/analytics/next';

import Navbar from './components/navbar';
import WhatsAppFloat from './components/whatsapp-float';

const themeScript = `
  try {
    const savedTheme = window.localStorage.getItem('theme-mode');
    const resolvedTheme = savedTheme === 'dark' ? 'dark' : 'light';
    document.documentElement.dataset.theme = resolvedTheme;
  } catch {
    document.documentElement.dataset.theme = 'light';
  }
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" data-theme="light" suppressHydrationWarning>
      <body className="antialiased">
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <Navbar />
        <main>{children}</main>
        <WhatsAppFloat />
        <Analytics />
      </body>
    </html>
  );
}
