"use client";

import React from "react";
import { useTradingStore } from "../../store/useTradingStore";

export default function RiskManagementView() {

    const {

        isFastApiConnected,

        portfolioValue,
        netExposure,
        valueAtRisk,

        allocations,
        hedgingSignals,

        riskStatus

    } = useTradingStore();

    if (!isFastApiConnected) {

        return (

            <div className="telemetry-shell p-6 text-sm text-zinc-500 animate-pulse">

                Awaiting Global Trading State...

            </div>

        );

    }

    return (

        <div className="telemetry-shell p-6 max-w-7xl mx-auto space-y-6">

            <div className="flex justify-between items-center border-b border-zinc-800 pb-4">

                <div>

                    <h1 className="text-xl md:text-2xl font-black tracking-[0.08em] text-white uppercase">

                        // RISK MANAGEMENT ENGINE

                    </h1>

                    <p className="text-[10px] text-zinc-500 uppercase tracking-[0.12em] font-bold mt-1">

                        Enterprise Global Risk Monitor

                    </p>

                </div>

                <div className="flex items-center gap-4">

                    <span className="text-xs">

                        FASTAPI

                    </span>

                    <span className={isFastApiConnected ? "text-emerald-400" : "text-red-500"}>

                        {isFastApiConnected ? "ONLINE" : "OFFLINE"}

                    </span>

                    <span className="text-xs">

                        {riskStatus}

                    </span>

                </div>

            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

                <div className="telemetry-card">

                    <div className="telemetry-label">

                        Portfolio Value

                    </div>

                    <div className="telemetry-value-lg mt-2">

                        ${portfolioValue.toFixed(2)}

                    </div>

                </div>

                <div className="telemetry-card">

                    <div className="telemetry-label">

                        Net Exposure

                    </div>

                    <div className="telemetry-value-lg mt-2">

                        ${netExposure.toFixed(2)}

                    </div>

                </div>

                <div className="telemetry-card">

                    <div className="telemetry-label">

                        Value At Risk

                    </div>

                    <div className="telemetry-value-lg mt-2">

                        ${valueAtRisk.toFixed(2)}

                    </div>

                </div>

                <div className="telemetry-card">

                    <div className="telemetry-label">

                        Asset Allocations

                    </div>

                    <div className="telemetry-value-lg mt-2">

                        {Object.keys(allocations).length}

                    </div>

                </div>

            </div>

            <div className="grid lg:grid-cols-2 gap-6">

                <div className="telemetry-card">

                    <h2 className="telemetry-section mb-4">

                        Asset Exposure

                    </h2>

                    {

                        Object.entries(allocations).map(

                            ([asset,value])=>(

                                <div
                                    key={asset}
                                    className="flex justify-between py-2 border-b border-zinc-800 text-xs"
                                >

                                    <span>{asset}</span>

                                    <span>{Number(value).toFixed(2)}</span>

                                </div>

                            )

                        )

                    }

                </div>

                <div className="telemetry-card">

                    <h2 className="telemetry-section mb-4">

                        Hedge Signals

                    </h2>

                    {

                        hedgingSignals.length===0

                        ?

                        <div className="text-zinc-500 text-xs">

                            No active hedge recommendations

                        </div>

                        :

                        hedgingSignals.map(

                            (signal,index)=>(

                                <div
                                    key={index}
                                    className="border border-zinc-800 p-3 mb-3 text-xs"
                                >

                                    <div>

                                        <strong>

                                            {signal.asset}

                                        </strong>

                                    </div>

                                    <div>

                                        {signal.status}

                                    </div>

                                    <div>

                                        {signal.action}

                                    </div>

                                    {

                                        signal.reason &&

                                        <div>

                                            {signal.reason}

                                        </div>

                                    }

                                </div>

                            )

                        )

                    }

                </div>

            </div>

        </div>

    );

}
