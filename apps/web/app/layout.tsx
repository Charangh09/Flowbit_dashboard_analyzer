import './globals.css';
import Link from 'next/link';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { ThemeToggle } from '@/components/theme-toggle';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Flowbit Analytics Dashboard',
  description: 'Data Analytics Dashboard with Chat Integration',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta
          httpEquiv="Content-Security-Policy"
          content="default-src 'self' http://localhost:* https://localhost:*;
                  script-src 'self' 'unsafe-inline' 'unsafe-eval';
                  style-src 'self' 'unsafe-inline';
                  img-src 'self' data: blob:;
                  font-src 'self' data:;
                  connect-src 'self' http://localhost:* ws://localhost:* https://localhost:*;"
        />
      </head>
      <body className={`${inter.className} min-h-screen bg-background`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <header className="flex justify-between items-center p-4 bg-card shadow-sm">
            <h1 className="text-xl font-bold text-primary flex items-center gap-2">
              📊 Flowbit Analytics Dashboard
            </h1>
            <nav className="flex items-center space-x-4">
              <Link
                href="/"
                className="text-sm font-medium text-muted-foreground hover:text-primary transition"
              >
                Dashboard
              </Link>
              <Link
                href="/chat"
                className="text-sm font-medium text-muted-foreground hover:text-primary transition"
              >
                Chat with Data
              </Link>
              <ThemeToggle />
            </nav>
          </header>

          <main className="max-w-7xl mx-auto p-6">{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}
