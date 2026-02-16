export default function Page({ data = {} }) {
  return (
    <div style={{ padding: '20px', fontFamily: 'monospace', color: '#0f0', background: '#000', minHeight: '100vh' }}>
      
      <h2>VOLSIM-PRO TITAN v119</h2>

      <div style={{ flexGrow: 1, border: '1px solid #111', borderRadius: '10px', padding: '20px', fontSize: '0.8rem' }}>
        
        <div style={{ color: '#040' }}>[STREAM_DATA]</div>

        <div style={{ color: '#080' }}>
          {'>'} RECOVERY_PROGRESS: {
            (((parseFloat(data.balance || 0) - 9400) / 600) * 100).toFixed(1)
          }%
        </div>

        <div style={{ color: '#080' }}>
          {'>'} SHIELD_STATUS: 8-TICK_READY
        </div>

        <div style={{ color: '#080' }}>
          {'>'} STAKE_AMNT: $5.00
        </div>

      </div>

    </div>
  );
}
