export const metadata = {
  title: 'APEX_TERMINAL',
  description: 'Quantum Ledger',
  appleWebApp: {
    capable: true,
    title: 'APEX_CORE',
    statusBarStyle: 'black-translucent',
  },
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0, viewport-fit=cover',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body style={{ margin: 0, padding: 0, background: '#000', overflow: 'hidden', overscrollBehavior: 'none' }}>
        {children}
      </body>
    </html>
  )
}