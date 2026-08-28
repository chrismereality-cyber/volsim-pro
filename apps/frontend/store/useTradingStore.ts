import { create } from "zustand";

export type ThemeType = "dark" | "light" | "hacker";

export interface HedgingSignal {
    asset: string;
    status: string;
    action: string;
    reason?: string;
    target_delta_offset?: number;
}

export interface TradingPosition {
    [key: string]: any;
}

export interface TradingState {

    // CONNECTION
    isFastApiConnected: boolean;

    // UI
    theme: ThemeType;
    setTheme: (theme: ThemeType) => void;

    // ACCOUNT
    balance: number;
    equity: number;
    floatingPl: number;

    // DRAWDOWN
    currentDrawdown: number;
    maxDrawdown: number;
    maximumAllowedDrawdown: number;

    // PERFORMANCE
    winRate: number;
    profitFactor: number;
    expectancy: number;
    sharpeRatio: number;
    riskRewardRatio: number;

    totalTrades: number;
    avgDurationMinutes: number;

    dailyPl: number;
    weeklyPl: number;
    monthlyPl: number;

    totalNetProfit: number;
    cagr: number;

    // POSITIONS / PORTFOLIO
    positions: TradingPosition[];
    portfolioValue: number;
    netExposure: number;

    // RISK
    riskPerTrade: number;
    marginUsage: number;
    liquidationWarning: boolean;
    valueAtRisk: number;
    riskStatus: string;

    // ALLOCATION / HEDGING
    allocations: Record<string, number>;
    hedgingSignals: HedgingSignal[];

    // RAW STATE VERSION
    stateVersion: number | null;
    lastStateTimestamp: string | null;

    // CENTRAL STATE INGESTION
    updateTradingState: (payload: any) => void;
}

const numberOrZero = (value: any): number => {
    const parsed = Number(value);

    return Number.isFinite(parsed)
        ? parsed
        : 0;
};

const booleanValue = (value: any): boolean => {
    if (typeof value === "boolean") {
        return value;
    }

    if (typeof value === "string") {
        return value.toLowerCase() === "true";
    }

    return Boolean(value);
};

const arrayValue = <T,>(
    value: any,
    fallback: T[] = []
): T[] => {
    return Array.isArray(value)
        ? value
        : fallback;
};

const objectValue = (
    value: any
): Record<string, any> => {
    return value &&
        typeof value === "object" &&
        !Array.isArray(value)
        ? value
        : {};
};

export const useTradingStore = create<TradingState>(
    (set) => ({

        // CONNECTION
        isFastApiConnected: false,

        // UI
        theme: "dark",

        setTheme: (theme) =>
            set({
                theme,
            }),

        // ACCOUNT
        balance: 0,
        equity: 0,
        floatingPl: 0,

        // DRAWDOWN
        currentDrawdown: 0,
        maxDrawdown: 0,
        maximumAllowedDrawdown: 0,

        // PERFORMANCE
        winRate: 0,
        profitFactor: 0,
        expectancy: 0,
        sharpeRatio: 0,
        riskRewardRatio: 0,

        totalTrades: 0,
        avgDurationMinutes: 0,

        dailyPl: 0,
        weeklyPl: 0,
        monthlyPl: 0,

        totalNetProfit: 0,
        cagr: 0,

        // POSITIONS / PORTFOLIO
        positions: [],
        portfolioValue: 0,
        netExposure: 0,

        // RISK
        riskPerTrade: 0,
        marginUsage: 0,
        liquidationWarning: false,
        valueAtRisk: 0,
        riskStatus: "UNKNOWN",

        // ALLOCATION / HEDGING
        allocations: {},
        hedgingSignals: [],

        // STATE METADATA
        stateVersion: null,
        lastStateTimestamp: null,

        updateTradingState: (payload) => {

            if (!payload || typeof payload !== "object") {
                return;
            }

            // Socket lifecycle events are handled separately
            // by useDataStream.
            if (payload.__socket_status) {
                return;
            }

            const account =
                objectValue(payload.account);

            const portfolio =
                objectValue(payload.portfolio);

            const positions =
                objectValue(payload.positions);

            const risk =
                objectValue(payload.risk);

            const statistics =
                objectValue(payload.statistics);

            const performance =
                objectValue(payload.performance);

            const allocation =
                objectValue(
                    payload.allocations ??
                    payload.allocation
                );

            const hedging =
                payload.hedging_signals ??
                payload.hedgingSignals ??
                [];

            const metadata =
                objectValue(
                    payload.metadata
                );

            set({

                // CONNECTION
                isFastApiConnected: true,

                // ACCOUNT
                balance: numberOrZero(
                    account.balance
                ),

                equity: numberOrZero(
                    account.equity
                ),

                // PORTFOLIO
                floatingPl: numberOrZero(
                    portfolio.floating_pl ??
                    portfolio.floatingPl
                ),

                portfolioValue: numberOrZero(
                    portfolio.equity ??
                    portfolio.portfolio_value ??
                    account.equity
                ),

                // POSITIONS
                positions: arrayValue<TradingPosition>(
                    positions.open_positions ??
                    positions.positions
                ),

                netExposure: numberOrZero(
                    positions.total_exposure ??
                    positions.net_exposure
                ),

                // PERFORMANCE
                winRate: numberOrZero(
                    statistics.win_rate ??
                    performance.win_rate
                ),

                profitFactor: numberOrZero(
                    statistics.profit_factor ??
                    performance.profit_factor
                ),

                expectancy: numberOrZero(
                    statistics.expectancy ??
                    performance.expectancy
                ),

                sharpeRatio: numberOrZero(
                    statistics.sharpe_ratio ??
                    performance.sharpe_ratio
                ),

                riskRewardRatio: numberOrZero(
                    statistics.risk_reward_ratio ??
                    performance.risk_reward_ratio
                ),

                totalTrades: numberOrZero(
                    statistics.trade_count ??
                    statistics.total_trades ??
                    performance.total_trades
                ),

                avgDurationMinutes: numberOrZero(
                    statistics.avg_duration_minutes ??
                    performance.avg_duration_minutes
                ),

                dailyPl: numberOrZero(
                    statistics.daily_pl ??
                    performance.daily_pl
                ),

                weeklyPl: numberOrZero(
                    statistics.weekly_pl ??
                    performance.weekly_pl
                ),

                monthlyPl: numberOrZero(
                    statistics.monthly_pl ??
                    performance.monthly_pl
                ),

                totalNetProfit: numberOrZero(
                    statistics.total_net_profit ??
                    performance.total_net_profit
                ),

                cagr: numberOrZero(
                    statistics.cagr ??
                    performance.cagr
                ),

                // RISK
                currentDrawdown: numberOrZero(
                    risk.current_drawdown
                ),

                maxDrawdown: numberOrZero(
                    risk.maximum_drawdown ??
                    risk.max_drawdown ??
                    statistics.maximum_drawdown
                ),

                maximumAllowedDrawdown: numberOrZero(
                    risk.maximum_allowed_drawdown
                ),

                riskPerTrade: numberOrZero(
                    risk.risk_per_trade
                ),

                marginUsage: numberOrZero(
                    risk.margin_usage
                ),

                liquidationWarning:
                    booleanValue(
                        risk.liquidation_warning
                    ),

                valueAtRisk: numberOrZero(
                    risk.value_at_risk ??
                    risk.var_1d_95 ??
                    risk.var
                ),

                riskStatus:
                    String(
                        risk.status ??
                        "UNKNOWN"
                    ),

                // ALLOCATIONS
                allocations:
                    objectValue(allocation),

                // HEDGING
                hedgingSignals:
                    arrayValue<HedgingSignal>(
                        hedging
                    ),

                // METADATA
                stateVersion:
                    payload.state_version ??
                    metadata.state_version ??
                    null,

                lastStateTimestamp:
                    payload.timestamp ??
                    payload.updated_at ??
                    metadata.timestamp ??
                    null,
            });
        },
    })
);
