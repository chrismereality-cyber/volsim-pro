import React from 'react';

export const metadata = {
  title: 'TITAN_V26_APEX',
  description: 'Whale-Tier Volume Simulator',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, backgroundColor: '#000' }}>
        {children}
      </body>
    </html>
  );
}
