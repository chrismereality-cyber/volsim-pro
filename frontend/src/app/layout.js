export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: 'black', color: 'white', fontFamily: 'sans-serif' }}>
        {children}
      </body>
    </html>
  )
}