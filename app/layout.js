import './globals.css';
import { PwaRegister } from '../components/pwa-register';

export const metadata = {
  title: 'Expense Tracker Pro',
  description: 'Android-first expense, pending balance, and payment tracker with web and PWA support.'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body><PwaRegister />{children}</body>
    </html>
  );
}
