'use client';

import React, { useState, useEffect } from 'react';
import RiskManagementPanel from '@/components/RiskManagementPanel';

export default function DashboardPage() {
    const [activeTab, setActiveTab] = useState('risk');
    const [backendStatus, setBackendStatus] = useState('CONNECTING...');

    useEffect(() => {
        fetch('http://127.0.0.1:10000/')
            .then(res => res.json())
            .then(data => setBackendStatus(data.status || 'ONLINE'))
            .catch(() => setBackendStatus('OFFLINE'));
    }, []);

    return (
        <div className="flex h-screen bg-slate-950 text-slate-100 font-mono">
            {/* Sidebar Navigation */}
            <aside className="w-64 border-r border-slate-800 bg-slate-900/50 flex flex-col justify-between p-4">
                <div>
                    <div className="mb-6">
                        <h1 className="text-xl font-black text-amber-400 tracking-wider">VOLSIM-PRO</h1>
                        <p className="text-xs text-slate-400">ENTERPRISE EDITION</p>
                    </div>

                    <nav className="space-y-1">
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={w-full text-left px-3 py-2 rounded text-sm transition-colors }
                        >
                            Overview Console
                        </button>
                        <button
                            onClick={() => setActiveTab('risk')}
                            className={w-full text-left px-3 py-2 rounded text-sm transition-colors }
                        >
                            Risk Management
                        </button>
                    </nav>
                </div>

                <div className="border-t border-slate-800 pt-3">
                    <div className="flex items-center space-x-2 text-xs">
                        <span className={w-2 h-2 rounded-full }></span>
                        <span className="text-slate-400">FASTAPI PORT 10000 {backendStatus}</span>
                    </div>
                </div>
            </aside>

            {/* Main Panel Content Area */}
            <main className="flex-1 p-8 overflow-y-auto bg-slate-950">
                <div className="max-w-5xl mx-auto">
                    {activeTab === 'risk' && <RiskManagementPanel />}
                    {activeTab === 'overview' && (
                        <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl">
                            <h2 className="text-xl font-bold text-amber-400 mb-2">Overview Console</h2>
                            <p className="text-sm text-slate-400">Global Trading State Engine is online and broadcasting synchronized data streams.</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
