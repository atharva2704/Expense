/** @type {import('@capacitor/cli').CapacitorConfig} */

const config = {
  appId: 'com.expensetracker.pro',
  appName: 'Expense Tracker Pro',
  webDir: 'public',
  bundledWebRuntime: false,

  server: {
    url: 'https://expense-six-orcin.vercel.app/',
    cleartext: false
  }
};

module.exports = config;