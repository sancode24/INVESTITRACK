import './globals.css';
import Nav from '@/components/Nav';

export const metadata = { title: 'InvestiTrack', description: 'Investment Portfolio Database' };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Nav />
        <main>{children}</main>
      </body>
    </html>
  );
}
