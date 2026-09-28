import { TradingApiClient } from "./TradingApiClient";

export interface MT5Instrument {
    symbol: string;
    path?: string;
    category?: string;
    description?: string;
    visible?: boolean;
    trade_mode?: number;
    quoteable?: boolean;
    bid?: number;
    ask?: number;
    last?: number;
    tick_timestamp?: number;
    volume_min?: number;
    volume_max?: number;
    volume_step?: number;
    digits?: number;
    point?: number;
    trade_tick_size?: number;
    trade_tick_value?: number;
    contract_size?: number;
    stops_level?: number;
    freeze_level?: number;
    filling_mode?: number;
    execution_ready?: boolean;
    provider?: string;
    venue?: string;
    [key: string]: unknown;
}

export interface MT5InstrumentRegistryResponse {
    status: string;
    provider: string;
    count: number;
    instruments: MT5Instrument[];
}

export interface MT5InstrumentActivationResponse {
    status: string;
    provider: string;
    activation: {
        status: string;
        symbol: string;
        activated: boolean;
        visible: boolean;
        reason: string;
        [key: string]: unknown;
    };
}

export class InstrumentRegistryClient {
    static async listMT5(
        accessToken: string,
    ): Promise<MT5InstrumentRegistryResponse> {
        return TradingApiClient.getAuthenticated(
            "/api/instruments/mt5",
            accessToken,
        );
    }

    static async activateMT5(
        symbol: string,
        accessToken: string,
    ): Promise<MT5InstrumentActivationResponse> {
        const encodedSymbol = encodeURIComponent(symbol);

        return TradingApiClient.post(
            `/api/instruments/mt5/${encodedSymbol}/activate`,
            {},
            {
                Authorization: `Bearer ${accessToken}`,
            },
        );
    }
}
