#pragma once
#include <atomic>

struct RiskParameters {
    std::atomic<double> max_exposure;
    std::atomic<double> hedge_trigger_dd_pct;
    std::atomic<double> rr_ratio;
};

class LiveRiskEngine {
public:
    void update_parameters(double max_exp, double dd_pct, double rr);
    bool on_tick(double price, double volume);
private:
    RiskParameters params;
};
