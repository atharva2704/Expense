export default function manifest() {
  return {
    name: 'Expense Tracker Pro',
    short_name: 'Expense Pro',
    description: 'Track expenses, balances, payments, and reports securely.',
    start_url: '/dashboard',
    scope: '/',
    display: 'standalone',
    background_color: '#000000',
    theme_color: '#09090b',
    icons: [
    {
      src: '/icon.svg',
      sizes: 'any',
      type: 'image/svg+xml',
      purpose: 'any'
    },
    {
      src: '/apple-icon.svg',
      sizes: 'any',
      type: 'image/svg+xml'
    }
  ]
  };
}
