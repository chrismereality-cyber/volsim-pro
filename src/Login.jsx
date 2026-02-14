import React, { useState } from 'react';

const Login = ({ onLogin }) => {
    const [alias, setAlias] = useState('');
    const [key, setKey] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        // Post to our Render Backend
        const response = await fetch('https://volsim-pro.onrender.com/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ alias, security_key: key })
        });
        const data = await response.json();
        if (data.success) {
            localStorage.setItem('token', data.token);
            onLogin();
        } else {
            alert('ACCESS_DENIED: INVALID_CREDENTIALS');
        }
    };

    return (
        <div style={{background:'#000', color:'#0f0', height:'100vh', display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center', fontFamily:'monospace'}}>
            <h1 style={{letterSpacing:'10px', borderBottom:'2px solid #0f0'}}>SYSTEM_AUTH</h1>
            <form onSubmit={handleSubmit} style={{display:'flex', flexDirection:'column', gap:'20px', marginTop:'50px'}}>
                <input placeholder="ALIAS" value={alias} onChange={e => setAlias(e.target.value)} style={{background:'#000', border:'1px solid #0f0', color:'#0f0', padding:'10px', textAlign:'center'}} />
                <input type="password" placeholder="SECURITY_KEY" value={key} onChange={e => setKey(e.target.value)} style={{background:'#000', border:'1px solid #0f0', color:'#0f0', padding:'10px', textAlign:'center'}} />
                <button type="submit" style={{background:'#0f0', color:'#000', border:'none', padding:'10px', cursor:'pointer', fontWeight:'bold'}}>INITIALIZE_LINK</button>
            </form>
        </div>
    );
};

export default Login;
