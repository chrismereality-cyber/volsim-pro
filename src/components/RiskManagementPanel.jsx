import React, { useEffect, useState } from "react";
import { useGlobalState } from "../context/GlobalStateContext";

const RiskManagementPanel = () => {
    const {
        globalState,
        connectionState,
    } = useGlobalState();

    const [riskState, setRiskState] = useState({});

    useEffect(() => {
        if (!globalState) return;

        setRiskState(
            globalState.risk ||
            globalState.riskState ||
            {}
        );
    }, [globalState]);

    return (
        <section className="risk-management-panel">
            <div className="risk-management-header">
                <h2>Risk Management</h2>

                <span
                    className={`connection-status ${connectionState?.toLowerCase()}`}
                >
                    {connectionState}
                </span>
            </div>

            <div className="risk-management-content">
                <div>
                    <strong>Drawdown</strong>
                    <span>
                        {riskState.drawdown ?? 0}
                    </span>
                </div>

                <div>
                    <strong>Daily Loss</strong>
                    <span>
                        {riskState.dailyLoss ?? 0}
                    </span>
                </div>

                <div>
                    <strong>Risk Status</strong>
                    <span>
                        {riskState.status ?? "UNKNOWN"}
                    </span>
                </div>
            </div>
        </section>
    );
};

export default RiskManagementPanel;
