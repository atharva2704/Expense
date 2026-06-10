/** @type {import('@capacitor/cli').CapacitorConfig} */
const serverUrl = process.env.CAPACITOR_SERVER_URL || '';
const config = {
  appId: 'com.expensetracker.pro',
  appName: 'Expense Tracker Pro',
  webDir: 'public',
  bundledWebRuntime: false,
  server: serverUrl
    ? {
        url: serverUrl,
        cleartext: serverUrl.startsWith('http://')
      }
    : undefined
};

module.exports = config;
