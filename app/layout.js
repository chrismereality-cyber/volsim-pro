export const metadata = {
  title: 'APEX_TERMINAL',
  description: 'Quantum Ledger',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, background: '#000', overflow: 'hidden' }}>{children}</body>
    </html>
  )
}