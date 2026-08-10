export type ThemeType = "dark" | "light";

import { create } from "zustand";


interface HedgingSignal {
    asset: string;
    status: string;
    action: string;
    reason?: string;
    target_delta_offset?: number;
}


interface TradingState {

    isFastApiConnected:boolean;

    theme:string;
    setTheme:(theme:string)=>void;


    balance:number;
    equity:number;
    floatingPl:number;


    currentDrawdown:number;
    maxDrawdown:number;


    winRate:number;
    profitFactor:number;
    expectancy:number;
    sharpeRatio:number;


    totalTrades:number;
    avgDurationMinutes:number;


    dailyPl:number;
    weeklyPl:number;
    monthlyPl:number;


    totalNetProfit:number;
    cagr:number;


    riskRewardRatio:number;


    positions:any[];


    riskPerTrade:number;
    maximumAllowedDrawdown:number;
    marginUsage:number;
    liquidationWarning:boolean;


    portfolioValue:number;
    netExposure:number;
    valueAtRisk:number;


    allocations:Record<string,number>;
    hedgingSignals:HedgingSignal[];


    riskStatus:string;

    updateTradingState: (payload: any) => void;
}

export const useTradingStore=create<TradingState>((set)=>({


    isFastApiConnected:false,


    theme:"dark",


    setTheme:(theme)=>
        set({
            theme
        }),



    balance:0,
    equity:0,
    floatingPl:0,


    currentDrawdown:0,
    maxDrawdown:0,


    winRate:0,
    profitFactor:0,
    expectancy:0,
    sharpeRatio:0,


    totalTrades:0,
    avgDurationMinutes:0,


    dailyPl:0,
    weeklyPl:0,
    monthlyPl:0,


    totalNetProfit:0,
    cagr:0,


    riskRewardRatio:0,


    positions:[],


    riskPerTrade:0,
    maximumAllowedDrawdown:0,
    marginUsage:0,
    liquidationWarning:false,


    portfolioValue:0,
    netExposure:0,
    valueAtRisk:0,


    allocations:{},


    hedgingSignals:[],


    riskStatus:"UNKNOWN",



    updateTradingState:(payload)=>{


        const account =
            payload.account ?? {};


        const portfolio =
            payload.portfolio ?? {};


        const positions =
            payload.positions ?? {};


        const risk =
            payload.risk ?? {};


        const statistics =
            payload.statistics ?? {};



        set({


            isFastApiConnected:true,



            // ACCOUNT

            balance:
                account.balance ?? 0,


            equity:
                account.equity ?? 0,



            // PORTFOLIO


            floatingPl:
                portfolio.floating_pl ?? 0,


            portfolioValue:
                portfolio.equity ??
                account.equity ??
                0,



            // POSITIONS


            positions:
                positions.open_positions ?? [],



            netExposure:
                positions.total_exposure ?? 0,



            // STATISTICS ENGINE


            winRate:
                statistics.win_rate ?? 0,


            profitFactor:
                statistics.profit_factor ?? 0,


            expectancy:
                statistics.expectancy ?? 0,


            sharpeRatio:
                statistics.sharpe_ratio ?? 0,


            totalTrades:
                statistics.trade_count ?? 0,



            // RISK ENGINE


            currentDrawdown:
                risk.current_drawdown ?? 0,


            maxDrawdown:
                risk.maximum_allowed_drawdown ?? 0,


            riskPerTrade:
                risk.risk_per_trade ?? 0,


            maximumAllowedDrawdown:
                risk.maximum_allowed_drawdown ?? 0,


            marginUsage:
                risk.margin_usage ?? 0,


            liquidationWarning:
                risk.liquidation_warning ?? false,


            riskStatus:
                risk.status ?? "HEALTHY"


        });


    }


}));
