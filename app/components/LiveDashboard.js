'use client';

import { useEffect, useState } from 'react';

export default function LiveDashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/status', { cache: 'no-store' });
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error(err);
      }
    }

    fetchData();
    const interval = setInterval(fetchData, 3000);

    return () => clearInterval(interval);
  }, []);

  if (!data) return <p>Loading Volsim-Pro...</p>;

  return (
    <pre style={{ color: '#00ffcc' }}>
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}
