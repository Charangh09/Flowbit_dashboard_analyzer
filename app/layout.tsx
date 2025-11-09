import './globals.css';
import Link from 'next/link';

export const metadata = {
  title: 'Flowbit Analytics Dashboard',
  description: 'Data Analytics Dashboard with Chat Integration',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
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
      <body className="bg-gray-50 min-h-screen">
        <header className="flex justify-between items-center p-4 bg-white shadow-sm">
          <h1 className="text-xl font-bold text-blue-600 flex items-center gap-2">
            📊 Flowbit Analytics Dashboard
          </h1>
          <nav className="space-x-4">
            <Link
              href="/"
              className="text-sm font-medium text-gray-700 hover:text-blue-600 transition"
            >
              Dashboard
            </Link>
            <Link
              href="/chat"
              className="text-sm font-medium text-gray-700 hover:text-blue-600 transition"
            >
              Chat with Data
            </Link>
          </nav>
        </header>

        <main className="max-w-7xl mx-auto p-6">{children}</main>
      </body>
    </html>
  );
}
