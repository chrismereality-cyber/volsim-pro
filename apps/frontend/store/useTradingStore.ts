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

export interface MarketQuote {
    symbol: string;
    bid: number;
    ask: number;
    last: number;
    spread: number;
    point: number;
    digits: number;
    timestamp: number;
}

export type MarketState = Record<string, MarketQuote>;

export interface VaultState {
    status: string;
    allocation_profile: string;
    trading_equity_balance: number;
    vault_balance: number;
    pending_allocation: number;
    total_allocated: number;
    total_transferred: number;
    last_realized_profit: number;
    equity_percentage: number;
    vault_percentage: number;
    sync_status: string;
    wallet_address: string | null;
    last_tx_hash: string | null;
    blockchain_network: string | null;
    last_sync_time: number | null;
    database_state_id: number | null;
    last_persist_time: number | null;
    last_persist_error: string | null;
    persistence_enabled: boolean;
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

    // MARKET
    market: MarketState;

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

    // ALLOCATION / VAULT / HEDGING
    allocations: Record<string, number>;
    vault: VaultState;
    hedgingSignals: HedgingSignal[];

    // RAW STATE VERSION
    stateVersion: number | null;
    lastStateTimestamp: string | number | null;

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

const normalizeVault = (
    value: any
): VaultState => {

    const vault = objectValue(value);

    return {
        status: String(
            vault.status ?? "UNKNOWN"
        ),

        allocation_profile: String(
            vault.allocation_profile ??
            "CORE_SATELLITE_70_30"
        ),

        trading_equity_balance:
            numberOrZero(
                vault.trading_equity_balance
            ),

        vault_balance:
            numberOrZero(
                vault.vault_balance
            ),

        pending_allocation:
            numberOrZero(
                vault.pending_allocation
            ),

        total_allocated:
            numberOrZero(
                vault.total_allocated
            ),

        total_transferred:
            numberOrZero(
                vault.total_transferred
            ),

        last_realized_profit:
            numberOrZero(
                vault.last_realized_profit
            ),

        equity_percentage:
            numberOrZero(
                vault.equity_percentage
            ),

        vault_percentage:
            numberOrZero(
                vault.vault_percentage
            ),

        sync_status: String(
            vault.sync_status ?? "UNKNOWN"
        ),

        wallet_address:
            vault.wallet_address ?? null,

        last_tx_hash:
            vault.last_tx_hash ?? null,

        blockchain_network:
            vault.blockchain_network ?? null,

        last_sync_time:
            vault.last_sync_time == null
                ? null
                : numberOrZero(
                    vault.last_sync_time
                ),

        database_state_id:
            vault.database_state_id == null
                ? null
                : numberOrZero(
                    vault.database_state_id
                ),

        last_persist_time:
            vault.last_persist_time == null
                ? null
                : numberOrZero(
                    vault.last_persist_time
                ),

        last_persist_error:
            vault.last_persist_error ?? null,

        persistence_enabled:
            booleanValue(
                vault.persistence_enabled
            ),
    };
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

        // MARKET
        market: {},

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

        // ALLOCATION
        allocations: {},

        // VAULT
        vault: normalizeVault(null),

        // HEDGING
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

            const market =
                objectValue(payload.market);

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

            const vault =
                normalizeVault(
                    payload.vault
                );

            const hedging =
                payload.hedging_signals ??
                payload.hedgingSignals ??
                [];

            const metadata =
                objectValue(
                    payload.metadata
                );

            const normalizedMarket: MarketState = {};

            for (const [symbol, quote] of Object.entries(market)) {
                if (!quote || typeof quote !== "object") {
                    continue;
                }

                const raw = quote as Record<string, any>;

                normalizedMarket[symbol] = {
                    symbol: String(raw.symbol ?? symbol),
                    bid: numberOrZero(raw.bid),
                    ask: numberOrZero(raw.ask),
                    last: numberOrZero(raw.last),
                    spread: numberOrZero(raw.spread),
                    point: numberOrZero(raw.point),
                    digits: numberOrZero(raw.digits),
                    timestamp: numberOrZero(raw.timestamp),
                };
            }

            set({

                // CONNECTION
                isFastApiConnected: true,

                // MARKET
                market: normalizedMarket,

                // ACCOUNT
                balance: numberOrZero(
                    payload.balance ?? account.balance
                ),

                equity: numberOrZero(
                    payload.equity ?? account.equity
                ),

                // PORTFOLIO
                floatingPl: numberOrZero(
                    payload.floatingPl ?? portfolio.floating_pl ??
                    portfolio.floatingPl
                ),

                portfolioValue: numberOrZero(
                    portfolio.equity ??
                    portfolio.portfolio_value ??
                    payload.equity ?? account.equity
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
                    payload.winRate ?? statistics.win_rate ??
                    performance.win_rate
                ),

                profitFactor: numberOrZero(
                    payload.profitFactor ?? statistics.profit_factor ??
                    performance.profit_factor
                ),

                expectancy: numberOrZero(
                    payload.expectancy ?? statistics.expectancy ??
                    performance.expectancy
                ),

                sharpeRatio: numberOrZero(
                    payload.sharpeRatio ?? statistics.sharpe_ratio ??
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
                    payload.currentDrawdown ?? risk.current_drawdown
                ),

                maxDrawdown: numberOrZero(
                    payload.maxDrawdown ?? risk.maximum_drawdown ??
                    risk.max_drawdown ??
                    statistics.maximum_drawdown
                ),

                maximumAllowedDrawdown: numberOrZero(
                    risk.maximum_allowed_drawdown
                ),

                riskPerTrade: numberOrZero(
                    payload.riskPerTrade ?? risk.risk_per_trade
                ),

                marginUsage: numberOrZero(
                    payload.marginUsage ?? risk.margin_usage
                ),

                liquidationWarning:
                    booleanValue(
                        payload.liquidationWarning ?? risk.liquidation_warning
                    ),

                valueAtRisk: numberOrZero(
                    payload.valueAtRisk ?? risk.value_at_risk ??
                    risk.var_1d_95 ??
                    risk.var
                ),

                riskStatus:
                    String(
                        payload.riskStatus ?? risk.status ??
                        "UNKNOWN"
                    ),

                // ALLOCATIONS
                allocations:
                    objectValue(allocation),

                // VAULT
                vault,

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


