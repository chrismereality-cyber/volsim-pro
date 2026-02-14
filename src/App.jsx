import React, { useState } from 'react';
import Dashboard from './Dashboard';

export default function App() {
    const [auth, setAuth] = useState(false);
    const [val, setVal] = useState('');

    if (auth) return <Dashboard />;

    return (
        <div style={{background:'#000', color:'#0f0', height:'100vh', display:'flex', justifyContent:'center', alignItems:'center', fontFamily:'monospace'}}>
            <form onSubmit={(e) => { e.preventDefault(); if(val === '1337') setAuth(true); }}>
                <div>CORE_ACCESS_REQUIRED</div>
                <input type="password" value={val} onChange={e=>setVal(e.target.value)} style={{background:'#000', border:'1px solid #0f0', color:'#0f0', padding:'5px', marginTop:'10px', textAlign:'center'}} autoFocus />
            </form>
        </div>
    );
}
