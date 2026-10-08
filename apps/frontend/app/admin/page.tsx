"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../src/auth/AuthProvider";
import { hasPermission } from "../../src/auth/permissions";
import { TradingApiClient } from "../../lib/TradingApiClient";
import { useTradingStore } from "../../store/useTradingStore";

type AdminUser = {
  id: number;
  email: string;
  is_active: boolean;
  is_verified: boolean;
  roles: string[];
  created_at?: string;
  updated_at?: string;
};

type AdminSession = {
  session_id: number;
  user_id: number;
  email: string | null;
  created_at: string | null;
  expires_at: string | null;
  revoked_at: string | null;
  status: "ACTIVE" | "REVOKED" | "EXPIRED" | string;
};

type AdminCredential = {
  credential_record_id: number;
  user_id: number;
  email: string | null;
  credential_type: string | null;
  device_type: string | null;
  backed_up: boolean;
  user_verified: boolean;
  sign_count: number;
  created_at: string | null;
  last_used_at: string | null;
};

type AdminRole = {
  id: number;
  name: string;
  description: string | null;
  permissions: string[];
};

type AdminSummary = {
  status: string;
  statistics: {
    users: number;
    active_users: number;
    roles: number;
    role_assignments: number;
  };
  administrator: {
    user_id: number;
    username: string | null;
    roles: string[];
    permissions: string[];
  };
};

export default function AdminPortalPage() {
  const {
    identity,
    user,
    accessToken,
    isAuthenticated,
    isLoading,
  } = useAuth();

  const [data, setData] = useState<AdminSummary | null>(null);
  const [sessions, setSessions] = useState<AdminSession[]>([]);
  const [credentials, setCredentials] = useState<AdminCredential[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [roles, setRoles] = useState<AdminRole[]>([]);  const [loadingUsers, setLoadingUsers] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [busyUserId, setBusyUserId] = useState<number | null>(null);

  // ADMIN-01 consumes the existing canonical trading-state store.
  // No second WebSocket or duplicate trading-state pipeline is created.
  const equity = useTradingStore((state) => state.equity);
  const floatingPl = useTradingStore((state) => state.floatingPl);
  const currentDrawdown = useTradingStore((state) => state.currentDrawdown);
  const netExposure = useTradingStore((state) => state.netExposure);
  const riskStatus = useTradingStore((state) => state.riskStatus);
  const symbols = useTradingStore((state) => state.symbols);
  const aiDecisionBySymbol = useTradingStore((state) => state.aiDecisionBySymbol);
  const marketRegimeBySymbol = useTradingStore((state) => state.marketRegimeBySymbol);
  const marketFeaturesBySymbol = useTradingStore((state) => state.marketFeaturesBySymbol);
  const aiExecutionBySymbol = useTradingStore((state) => state.aiExecutionBySymbol);
  const executionRiskBySymbol = useTradingStore((state) => state.executionRiskBySymbol);
  const orderBuilderBySymbol = useTradingStore((state) => state.orderBuilderBySymbol);
  const aiExecutionOrchestratorBySymbol = useTradingStore(
    (state) => state.aiExecutionOrchestratorBySymbol,
  );
  const financialIntelligence = useTradingStore(
    (state) => state.financialIntelligence,
  );
  const vault = useTradingStore((state) => state.vault);
  const venueContext = useTradingStore((state) => state.venueContext);

  const loadAdminData = async () => {
    if (!accessToken || !identity) return;

    if (!hasPermission(identity, "users.read")) {
      setError("Access denied. The users.read permission is required.");
      return;
    }

    try {
      setError(null);
      setLoadingUsers(true);

      const [summaryResponse, usersResponse, sessionsResponse] = await Promise.all([
        TradingApiClient.getAuthenticated(
          "/api/admin/summary",
          accessToken
        ),
        TradingApiClient.getAuthenticated(
          "/api/admin/users",
          accessToken
        ),
        TradingApiClient.getAuthenticated(
          "/api/admin/sessions",
          accessToken
        ),
      ]);

      setData(summaryResponse);

      setSessions(
        Array.isArray(sessionsResponse?.sessions)
          ? sessionsResponse.sessions
          : []
      );

      const credentialsResponse = await TradingApiClient.getAuthenticated(
        "/api/admin/credentials",
        accessToken
      );

      setCredentials(
        Array.isArray(credentialsResponse?.credentials)
          ? credentialsResponse.credentials
          : []
      );

      const incomingUsers =
        Array.isArray(usersResponse)
          ? usersResponse
          : Array.isArray(usersResponse?.users)
            ? usersResponse.users
            : Array.isArray(usersResponse?.data)
              ? usersResponse.data
              : [];

      setUsers(incomingUsers);

      if (hasPermission(identity, "rbac.read")) {
        const rolesResponse = await TradingApiClient.getAuthenticated(
          "/api/admin/roles",
          accessToken
        );

        setRoles(
          Array.isArray(rolesResponse?.roles)
            ? rolesResponse.roles
            : []
        );
      } else {
        setRoles([]);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load administrative data."
      );
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (isLoading || !isAuthenticated || !accessToken || !identity) {
      return;
    }

    void loadAdminData();
  }, [
    accessToken,
    identity,
    isAuthenticated,
    isLoading,
  ]);

  const updateUserStatus = async (
    targetUser: AdminUser
  ) => {
    if (!accessToken) return;

    setBusyUserId(targetUser.id);
    setActionError(null);
    setActionMessage(null);

    try {
      await TradingApiClient.patchAuthenticated(
        `/api/admin/users/${targetUser.id}/status`,
        accessToken,
        {
          is_active: !targetUser.is_active,
        }
      );

      setActionMessage(
        `${targetUser.email} is now ${
          !targetUser.is_active ? "active" : "inactive"
        }.`
      );

      await loadAdminData();
    } catch (err) {
      setActionError(
        err instanceof Error
          ? err.message
          : "Unable to update user status."
      );
    } finally {
      setBusyUserId(null);
    }
  };

  const updateUserRole = async (
    targetUser: AdminUser,
    role: string
  ) => {
    if (!accessToken) return;

    setBusyUserId(targetUser.id);
    setActionError(null);
    setActionMessage(null);

    try {
      await TradingApiClient.putAuthenticated(
        `/api/admin/users/${targetUser.id}/roles`,
        accessToken,
        {
          roles: [role],
        }
      );

      setActionMessage(
        `${targetUser.email} role updated to ${role}.`
      );

      await loadAdminData();
    } catch (err) {
      setActionError(
        err instanceof Error
          ? err.message
          : "Unable to update user role."
      );
    } finally {
      setBusyUserId(null);
    }
  };

  const numberDisplay = (value: unknown, digits = 2) => {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric.toFixed(digits) : "?";
  };

  const textDisplay = (value: unknown, fallback = "?") => {
    if (value === null || value === undefined || value === "") {
      return fallback;
    }
    return String(value);
  };

  const objectValue = (
    source: Record<string, any> | undefined,
    key: string,
  ) => {
    if (!source || typeof source !== "object") {
      return undefined;
    }
    return source[key];
  };

  const decisionValue = (
    decision: Record<string, any> | undefined,
    keys: string[],
  ) => {
    if (!decision || typeof decision !== "object") {
      return undefined;
    }

    for (const key of keys) {
      if (
        decision[key] !== undefined &&
        decision[key] !== null &&
        decision[key] !== ""
      ) {
        return decision[key];
      }
    }

    return undefined;
  };

  const adminSymbols =
    symbols.length > 0
      ? symbols
      : Object.keys(aiDecisionBySymbol);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#02040A] text-white flex items-center justify-center">
        Loading Admin Portal...
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-[#02040A] text-white flex items-center justify-center px-6">
        <div className="w-full max-w-lg rounded-2xl border border-red-400/20 bg-white/[0.03] p-8 shadow-2xl">
          <p className="text-xs uppercase tracking-[0.35em] text-cyan-300">
            VOLSIM-PRO
          </p>

          <h1 className="mt-3 text-3xl font-bold">
            Admin Portal
          </h1>

          <p className="mt-4 text-sm leading-6 text-red-300">
            {error}
          </p>

          <button
            className="mt-6 rounded-lg border border-white/10 bg-white/[0.06] px-5 py-2.5 text-sm text-white transition hover:bg-white/[0.1]"
            onClick={() => window.location.assign("/")}
          >
            Return to Dashboard
          </button>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="min-h-screen bg-[#02040A] text-white flex items-center justify-center">
        Loading administrative data...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#02040A] text-white">
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-10">

        {/* HEADER */}
        <header className="flex flex-col gap-5 border-b border-white/10 pb-7 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-300">
              VOLSIM-PRO
            </p>

            <h1 className="mt-2 text-4xl font-bold tracking-tight">
              Admin Portal
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              Administrative identity, RBAC and user management.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-full border border-emerald-400/20 bg-emerald-400/[0.06] px-4 py-2 text-xs font-bold uppercase tracking-wider text-emerald-300">
              RBAC {data.status}
            </div>

            <button
              className="rounded-lg border border-white/10 bg-white/[0.05] px-5 py-2.5 text-sm text-white transition hover:bg-white/[0.09]"
              onClick={() => window.location.assign("/")}
            >
              Dashboard
            </button>
          </div>
        </header>

        {/* ADMIN-01 COMMAND CENTER */}
        <section className="mt-8 space-y-6">

          {/* SYSTEM STATUS STRIP */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="mr-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-500">
                  Command Center
                </p>
                <p className="mt-1 text-xs font-bold text-white">
                  Platform Control Plane
                </p>
              </div>

              {[
                ["PLATFORM", "ONLINE"],
                ["AI ENGINE", "ONLINE"],
                ["EXECUTION", "PAPER"],
                ["RISK", textDisplay(riskStatus, "UNKNOWN").toUpperCase()],
                ["MT5", textDisplay(venueContext?.provider_status?.status, "CONNECTED").toUpperCase()],
                ["AUTH", isAuthenticated ? "AUTHENTICATED" : "OFFLINE"],
                ["VAULT", textDisplay(vault?.sync_status, "SYNCED").toUpperCase()],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/20 px-3 py-2"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                    {label}
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-300">
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* EXECUTIVE METRICS */}
          <div>
            <div className="mb-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-cyan-300">
                Executive Command View
              </p>
              <h2 className="mt-1 text-xl font-bold tracking-tight text-white">
                Platform Financial State
              </h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ["EQUITY", numberDisplay(equity), "Canonical trading equity"],
                ["FLOATING P&L", numberDisplay(floatingPl), "Current unrealized result"],
                ["DRAWDOWN", numberDisplay(currentDrawdown), "Current portfolio drawdown"],
                ["NET EXPOSURE", numberDisplay(netExposure), "Aggregate portfolio exposure"],
              ].map(([label, value, description]) => (
                <div
                  key={label}
                  className="rounded-2xl border border-white/10 bg-white/[0.035] p-5"
                >
                  <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-500">
                    {label}
                  </p>
                  <p className="mt-3 text-3xl font-bold tracking-tight text-white">
                    {value}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* AI DECISION CENTER */}
          <div className="rounded-2xl border border-cyan-400/10 bg-white/[0.025] p-5">
            <div className="flex flex-col gap-2 border-b border-white/10 pb-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-cyan-300">
                  AI Decision Center
                </p>
                <h2 className="mt-1 text-xl font-bold text-white">
                  Machine Decision State
                </h2>
              </div>
              <p className="text-xs text-slate-500">
                Observation only ? AI remains the decision authority
              </p>
            </div>

            {adminSymbols.length === 0 ? (
              <div className="py-8 text-sm text-slate-500">
                No symbol decision state is currently available.
              </div>
            ) : (
              <div className="mt-4 grid gap-3">
                {adminSymbols.map((symbol) => {
                  const decision = aiDecisionBySymbol[symbol];
                  const regime = marketRegimeBySymbol[symbol];
                  const features = marketFeaturesBySymbol[symbol];
                  const execution = aiExecutionBySymbol[symbol];
                  const executionRisk = executionRiskBySymbol[symbol];
                  const orderBuilder = orderBuilderBySymbol[symbol];
                  const orchestrator = aiExecutionOrchestratorBySymbol[symbol];

                  const decisionName = decisionValue(
                    decision,
                    ["decision", "action", "signal", "direction"],
                  );

                  const confidence = decisionValue(
                    decision,
                    ["confidence", "confidence_score", "score"],
                  );

                  const approved = decisionValue(
                    decision,
                    ["approved", "is_approved", "authorization"],
                  );

                  const decisionId = decisionValue(
                    decision,
                    ["decision_id", "id"],
                  );

                  const regimeName =
                    decisionValue(regime, ["regime", "name", "state"]) ??
                    decisionValue(decision, ["regime", "market_regime"]);

                  const volatility =
                    decisionValue(features, ["volatility", "volatility_score"]) ??
                    decisionValue(decision, ["volatility"]);

                  const atr =
                    decisionValue(features, ["atr", "ATR"]) ??
                    decisionValue(decision, ["atr", "ATR"]);

                  const rsi =
                    decisionValue(features, ["rsi", "RSI"]) ??
                    decisionValue(decision, ["rsi", "RSI"]);

                  const ema20 =
                    decisionValue(features, ["ema20", "EMA20", "ema_20"]) ??
                    decisionValue(decision, ["ema20", "EMA20"]);

                  const ema50 =
                    decisionValue(features, ["ema50", "EMA50", "ema_50"]) ??
                    decisionValue(decision, ["ema50", "EMA50"]);

                  const ema200 =
                    decisionValue(features, ["ema200", "EMA200", "ema_200"]) ??
                    decisionValue(decision, ["ema200", "EMA200"]);

                  return (
                    <div
                      key={symbol}
                      className="rounded-xl border border-white/10 bg-black/20 p-4"
                    >
                      <div className="grid gap-4 xl:grid-cols-[1.1fr_1fr_1fr_1fr]">
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-300">
                            Instrument
                          </p>
                          <p className="mt-2 text-lg font-semibold text-white">
                            {symbol}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            Regime: {textDisplay(regimeName, "UNKNOWN")}
                          </p>
                        </div>

                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-300">
                            Decision
                          </p>
                          <p className="mt-2 text-lg font-semibold uppercase text-cyan-300">
                            {textDisplay(decisionName, "NO DATA")}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            Confidence: {numberDisplay(confidence, 2)}
                          </p>
                        </div>

                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-300">
                            Authorization
                          </p>
                          <p className="mt-2 text-lg font-semibold uppercase text-white">
                            {typeof approved === "boolean"
                              ? approved
                                ? "APPROVED"
                                : "BLOCKED"
                              : textDisplay(
                                  approved,
                                  textDisplay(
                                    executionRisk?.status,
                                    "PENDING",
                                  ),
                                )}
                          </p>
                          <p className="mt-1 truncate text-xs text-slate-500">
                            ID: {textDisplay(decisionId, "?")}
                          </p>
                        </div>

                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-300">
                            Execution Chain
                          </p>
                          <p className="mt-2 text-sm font-bold text-white">
                            {textDisplay(
                              orderBuilder?.status ??
                                execution?.status ??
                                orchestrator?.status,
                              "STANDBY",
                            )}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            Risk: {textDisplay(executionRisk?.status, "UNKNOWN")}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-2 border-t border-white/10 pt-4 sm:grid-cols-4 lg:grid-cols-7">
                        {[
                          ["VOL", volatility],
                          ["ATR", atr],
                          ["RSI", rsi],
                          ["EMA20", ema20],
                          ["EMA50", ema50],
                          ["EMA200", ema200],
                          ["REGIME", regimeName],
                        ].map(([label, value]) => (
                          <div
                            key={label}
                            className="rounded-lg border border-white/[0.07] bg-white/[0.02] px-3 py-2"
                          >
                            <p className="text-[9px] uppercase tracking-wider text-slate-600">
                              {label}
                            </p>
                            <p className="mt-1 truncate text-xs font-semibold text-slate-300">
                              {textDisplay(value)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* VFIA + NEURAL EXECUTION */}
          <div className="grid gap-6 lg:grid-cols-2">

            <div className="rounded-2xl border border-emerald-400/10 bg-white/[0.025] p-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-emerald-300">
                VFIA Control Center
              </p>
              <h2 className="mt-1 text-xl font-bold text-white">
                Financial Intelligence State
              </h2>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {[
                  [
                    "VFIA STATUS",
                    Number(financialIntelligence?.observation_count ?? 0) > 0
                      ? "ONLINE"
                      : "AWAITING DATA",
                  ],
                  [
                    "OBSERVATIONS",
                    financialIntelligence?.observation_count ?? 0,
                  ],
                  [
                    "SPECIALIST AGENTS",
                    Array.isArray(financialIntelligence?.registered_agents)
                      ? financialIntelligence.registered_agents.length
                      : 0,
                  ],
                  [
                    "MARKET REGIME",
                    financialIntelligence?.specialist_results?.market_analyst
                      ?.market_conditions?.market_regime?.regime ??
                      financialIntelligence?.specialist_results?.market_analyst
                        ?.market_conditions?.regime,
                  ],
                  [
                    "TREND ASSESSMENT",
                    financialIntelligence?.specialist_results?.market_analyst
                      ?.market_conditions?.trend?.trend,
                  ],
                  [
                    "TREND CONFIDENCE",
                    financialIntelligence?.specialist_results?.market_analyst
                      ?.market_conditions?.trend?.confidence,
                  ],
                  [
                    "EXECUTION AUTHORIZATION",
                    financialIntelligence?.execution_authorized === true
                      ? "AUTHORIZED"
                      : "DISABLED",
                  ],
                  [
                    "EXECUTION ALLOWED",
                    financialIntelligence?.execution_allowed === true
                      ? "ALLOWED"
                      : "DISABLED",
                  ],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-xl border border-white/[0.07] bg-black/20 p-3"
                  >
                    <p className="text-[9px] uppercase tracking-[0.2em] text-slate-600">
                      {label}
                    </p>
                    <p className="mt-2 text-sm font-bold text-slate-200">
                      {typeof value === "object"
                        ? value
                          ? "AVAILABLE"
                          : "PENDING"
                        : textDisplay(value, "PENDING")}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-xl border border-emerald-400/10 bg-emerald-400/[0.025] p-4">
                <p className="text-[10px] uppercase tracking-[0.25em] text-emerald-300">
                  Cognitive Foundation
                </p>
                <p className="mt-2 text-sm font-bold text-white">
                  VFIA-0.1 ? Cognitive Foundation
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Administrative observation of the canonical financial-intelligence state.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-amber-400/10 bg-white/[0.025] p-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-amber-300">
                Neural Execution Core
              </p>
              <h2 className="mt-1 text-xl font-bold text-white">
                Execution Governance Pipeline
              </h2>

              <div className="mt-5 space-y-2">
                {[
                  "AI Decision",
                  "AI Authorization",
                  "Risk Validation",
                  "Order Builder",
                  "Broker Validation",
                  "Transmission",
                ].map((step, index) => (
                  <div key={step}>
                    <div className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-black/20 px-4 py-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-amber-400/20 bg-amber-400/[0.06] text-[10px] font-semibold text-amber-300">
                        {index + 1}
                      </span>
                      <span className="text-sm font-semibold text-slate-100">
                        {step}
                      </span>
                    </div>

                    {index < 5 && (
                      <div className="ml-7 h-2 border-l border-dashed border-white/10" />
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-xl border border-amber-400/10 bg-amber-400/[0.025] p-4">
                <p className="text-[10px] uppercase tracking-[0.25em] text-amber-300">
                  Governance Rule
                </p>
                <p className="mt-2 text-xs leading-5 text-slate-400">
                  Administration observes and governs the execution pipeline.
                  It does not replace AI decision authority or bypass risk controls.
                </p>
              </div>
            </div>

          </div>

        </section>

        {/* STATISTICS */}
        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-300">
              Users
            </p>
            <p className="mt-3 text-3xl font-bold">
              {data.statistics.users}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Registered identities
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-300">
              Active Users
            </p>
            <p className="mt-3 text-3xl font-bold text-emerald-300">
              {data.statistics.active_users}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Currently active
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-300">
              Roles
            </p>
            <p className="mt-3 text-3xl font-bold">
              {data.statistics.roles}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Canonical RBAC roles
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-300">
              Assignments
            </p>
            <p className="mt-3 text-3xl font-bold">
              {data.statistics.role_assignments}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Active role mappings
            </p>
          </div>

        </section>

        {/* ADMINISTRATOR */}
        <section className="mt-6 grid gap-6 lg:grid-cols-2">

          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.25em] text-cyan-300">
                  Current Identity
                </p>
                <h2 className="mt-2 text-xl font-bold">
                  Administrator
                </h2>
              </div>

              <div className="rounded-full border border-cyan-300/20 bg-cyan-300/[0.05] px-3 py-1 text-xs font-semibold text-cyan-100">
                ID {data.administrator.user_id}
              </div>
            </div>

            <div className="mt-6 space-y-3 text-sm">
              <div className="flex justify-between gap-5 border-b border-white/[0.06] pb-3">
                <span className="text-slate-500">Email</span>
                <span className="text-right text-slate-200">
                  {user?.email ?? "—"}
                </span>
              </div>

              <div className="flex justify-between gap-5 border-b border-white/[0.06] pb-3">
                <span className="text-slate-500">Username</span>
                <span className="text-right text-slate-200">
                  {data.administrator.username ?? "—"}
                </span>
              </div>

              <div>
                <p className="text-slate-500">Roles</p>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {data.administrator.roles.map((role) => (
                    <span
                      key={role}
                      className="inline-flex items-center rounded-full border border-cyan-300/20 bg-cyan-300/[0.06] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-cyan-200 shadow-[0_0_18px_rgba(34,211,238,0.04)]"
                    >
                      {role}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-6">
            <p className="text-[11px] uppercase tracking-[0.25em] text-cyan-300">
              Effective Authorization
            </p>

            <h2 className="mt-2 text-xl font-bold">
              Permissions
            </h2>

            <div className="mt-5 max-h-52 overflow-auto pr-1">
              <div className="flex flex-wrap items-center gap-2">
                {data.administrator.permissions.map((permission) => (
                  <span
                    key={permission}
                    className="inline-flex items-center rounded-md border border-white/10 bg-black/25 px-2.5 py-1.5 text-[10px] font-semibold tracking-[0.03em] text-slate-300 transition hover:border-cyan-300/20 hover:bg-cyan-300/[0.04] hover:text-cyan-200"
                  >
                    {permission}
                  </span>
                ))}
              </div>
            </div>
          </div>

        </section>

        {/* RBAC GOVERNANCE */}
        {hasPermission(identity, "rbac.read") && (
          <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.025] p-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.25em] text-cyan-300">
                  RBAC Governance
                </p>
                <h2 className="mt-2 text-xl font-bold text-white">
                  Roles & Permissions
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Canonical authorization catalog sourced from the platform RBAC policy.
                </p>
              </div>

              <div className="rounded-full border border-emerald-400/20 bg-emerald-400/[0.05] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-300">
                {roles.length > 0 ? "RBAC ONLINE" : "RBAC DATA PENDING"}
              </div>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              {roles.map((role) => (
                <div
                  key={role.id}
                  className="rounded-xl border border-white/[0.07] bg-black/20 p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-bold uppercase tracking-[0.08em] text-white">
                        {role.name}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        {role.description ?? "No role description available."}
                      </p>
                    </div>

                    <span className="shrink-0 rounded-full border border-cyan-300/20 bg-cyan-300/[0.05] px-2.5 py-1 text-[10px] font-bold text-cyan-200">
                      {role.permissions.length} PERMISSIONS
                    </span>
                  </div>

                  <div className="mt-4 flex max-h-36 flex-wrap gap-2 overflow-auto pr-1">
                    {role.permissions.map((permission) => (
                      <span
                        key={permission}
                        className="inline-flex items-center rounded-md border border-white/10 bg-white/[0.025] px-2.5 py-1.5 text-[10px] font-semibold tracking-[0.02em] text-slate-300"
                      >
                        {permission}
                      </span>
                    ))}
                  </div>
                </div>
              ))}

              {roles.length === 0 && (
                <div className="lg:col-span-2 rounded-xl border border-white/[0.07] bg-black/20 p-5 text-sm text-slate-500">
                  No RBAC role data is available for the current identity.
                </div>
              )}
            </div>
          </section>
        )}

        {/* ACCESS & SESSION GOVERNANCE */}
        {hasPermission(identity, "users.read") && (
          <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.025] p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/40">
                  Access & Session Governance
                </p>
                <h2 className="mt-2 text-xl font-semibold text-white">
                  Authenticated Session Directory
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-white/50">
                  Administrative visibility into authenticated platform sessions.
                  Sensitive authentication material is never exposed.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/60">
                  {sessions.length} SESSIONS
                </span>
                <span className="rounded-full border border-emerald-400/20 bg-emerald-400/[0.06] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-300">
                  SESSION DIRECTORY ONLINE
                </span>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {(["ACTIVE", "REVOKED", "EXPIRED"] as const).map((status) => {
                const count = sessions.filter(
                  (session) => session.status === status
                ).length;

                return (
                  <div
                    key={status}
                    className="rounded-xl border border-white/10 bg-black/20 px-4 py-3"
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">
                      {status}
                    </p>
                    <p className="mt-1 text-2xl font-semibold text-white">
                      {count}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 overflow-x-auto rounded-xl border border-white/10">
              <table className="min-w-full text-left">
                <thead className="border-b border-white/10 bg-white/[0.025]">
                  <tr>
                    {["Session", "Identity", "Created", "Expires", "Status"].map(
                      (heading) => (
                        <th
                          key={heading}
                          className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35"
                        >
                          {heading}
                        </th>
                      )
                    )}
                  </tr>
                </thead>

                <tbody className="divide-y divide-white/5">
                  {sessions.length > 0 ? (
                    sessions.map((session) => (
                      <tr
                        key={session.session_id}
                        className="hover:bg-white/[0.02]"
                      >
                        <td className="px-4 py-4">
                          <p className="text-sm font-medium text-white">
                            #{session.session_id}
                          </p>
                          <p className="mt-1 text-[11px] text-white/35">
                            User #{session.user_id}
                          </p>
                        </td>

                        <td className="px-4 py-4">
                          <p className="text-sm text-white/80">
                            {session.email ?? "Unknown identity"}
                          </p>
                        </td>

                        <td className="px-4 py-4 text-xs text-white/50">
                          {session.created_at
                            ? new Date(session.created_at).toLocaleString()
                            : "—"}
                        </td>

                        <td className="px-4 py-4 text-xs text-white/50">
                          {session.expires_at
                            ? new Date(session.expires_at).toLocaleString()
                            : "—"}
                        </td>

                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${
                              session.status === "ACTIVE"
                                ? "border-emerald-400/20 bg-emerald-400/[0.06] text-emerald-300"
                                : session.status === "REVOKED"
                                  ? "border-red-400/20 bg-red-400/[0.06] text-red-300"
                                  : "border-amber-400/20 bg-amber-400/[0.06] text-amber-300"
                            }`}
                          >
                            {session.status}
                          </span>

                          {session.revoked_at && (
                            <p className="mt-1 text-[10px] text-white/30">
                              Revoked{" "}
                              {new Date(session.revoked_at).toLocaleString()}
                            </p>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-8 text-center text-sm text-white/35"
                      >
                        No authenticated sessions found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* BIOMETRIC CREDENTIAL GOVERNANCE */}
        {hasPermission(identity, "users.read") && (
          <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.025] p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/40">
                  Biometric Credential Governance
                </p>
                <h2 className="mt-2 text-xl font-semibold text-white">
                  Registered WebAuthn Credentials
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-white/50">
                  Administrative visibility into registered biometric authentication
                  credentials. Cryptographic credential material is never exposed.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/60">
                  {credentials.length} CREDENTIAL{credentials.length === 1 ? "" : "S"}
                </span>
                <span className="rounded-full border border-emerald-400/20 bg-emerald-400/[0.05] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-300">
                  CREDENTIAL DIRECTORY ONLINE
                </span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="rounded-xl border border-white/10 bg-black/10 p-4">
                <p className="text-[10px] uppercase tracking-[0.16em] text-white/35">
                  Verified
                </p>
                <p className="mt-2 text-2xl font-semibold text-white">
                  {credentials.filter((credential) => credential.user_verified).length}
                </p>
                <p className="mt-1 text-xs text-white/40">
                  User-verified credentials
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-black/10 p-4">
                <p className="text-[10px] uppercase tracking-[0.16em] text-white/35">
                  Backed Up
                </p>
                <p className="mt-2 text-2xl font-semibold text-white">
                  {credentials.filter((credential) => credential.backed_up).length}
                </p>
                <p className="mt-1 text-xs text-white/40">
                  Credentials reporting backup state
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-black/10 p-4">
                <p className="text-[10px] uppercase tracking-[0.16em] text-white/35">
                  Last Used
                </p>
                <p className="mt-2 text-2xl font-semibold text-white">
                  {credentials.filter((credential) => credential.last_used_at).length}
                </p>
                <p className="mt-1 text-xs text-white/40">
                  Credentials with authentication history
                </p>
              </div>
            </div>

            <div className="mt-6 overflow-x-auto rounded-xl border border-white/10">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-white/10 bg-white/[0.025]">
                  <tr className="text-[10px] uppercase tracking-[0.16em] text-white/35">
                    <th className="px-4 py-3 font-semibold">Credential</th>
                    <th className="px-4 py-3 font-semibold">Identity</th>
                    <th className="px-4 py-3 font-semibold">Type</th>
                    <th className="px-4 py-3 font-semibold">Device</th>
                    <th className="px-4 py-3 font-semibold">Verified</th>
                    <th className="px-4 py-3 font-semibold">Backup</th>
                    <th className="px-4 py-3 font-semibold">Last Used</th>
                    <th className="px-4 py-3 font-semibold">Created</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-white/5">
                  {credentials.map((credential) => (
                    <tr key={credential.credential_record_id} className="text-white/70">
                      <td className="whitespace-nowrap px-4 py-3">
                        <div className="font-medium text-white">
                          Credential #{credential.credential_record_id}
                        </div>
                        <div className="mt-1 text-xs text-white/35">
                          Sign count {credential.sign_count}
                        </div>
                      </td>

                      <td className="whitespace-nowrap px-4 py-3">
                        <div className="text-white/80">
                          {credential.email ?? "Unknown identity"}
                        </div>
                        <div className="mt-1 text-xs text-white/35">
                          User #{credential.user_id}
                        </div>
                      </td>

                      <td className="whitespace-nowrap px-4 py-3 text-white/60">
                        {credential.credential_type ?? "Unknown"}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3 text-white/60">
                        {credential.device_type ?? "Unknown"}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3">
                        <span
                          className={
                            credential.user_verified
                              ? "rounded-full border border-emerald-400/20 bg-emerald-400/[0.05] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-300"
                              : "rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/40"
                          }
                        >
                          {credential.user_verified ? "VERIFIED" : "UNVERIFIED"}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-4 py-3">
                        <span className="text-white/60">
                          {credential.backed_up ? "BACKED UP" : "DEVICE ONLY"}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-4 py-3 text-xs text-white/50">
                        {credential.last_used_at
                          ? new Date(credential.last_used_at).toLocaleString()
                          : "Never recorded"}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3 text-xs text-white/50">
                        {credential.created_at
                          ? new Date(credential.created_at).toLocaleString()
                          : "Unknown"}
                      </td>
                    </tr>
                  ))}

                  {credentials.length === 0 && (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-4 py-10 text-center text-sm text-white/35"
                      >
                        No registered biometric credentials found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* FEEDBACK */}
        {(actionError || actionMessage) && (
          <div className="mt-6">
            {actionError && (
              <div className="rounded-xl border border-red-400/20 bg-red-400/[0.05] px-5 py-4 text-sm text-red-300">
                {actionError}
              </div>
            )}

            {actionMessage && (
              <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/[0.05] px-5 py-4 text-sm text-emerald-300">
                {actionMessage}
              </div>
            )}
          </div>
        )}

        {/* USER MANAGEMENT */}
        <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.025] overflow-hidden">

          <div className="flex flex-col gap-4 border-b border-white/10 px-6 py-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.25em] text-cyan-300">
                Identity Control
              </p>

              <h2 className="mt-2 text-xl font-bold">
                User Management
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Manage account status and standard role assignments.
              </p>
            </div>

            <button
              disabled={loadingUsers}
              onClick={() => void loadAdminData()}
              className="rounded-lg border border-white/10 bg-white/[0.05] px-4 py-2 text-sm text-slate-200 transition hover:bg-white/[0.09] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loadingUsers ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left">
              <thead className="border-b border-white/10 bg-black/20">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-300">
                    Identity
                  </th>

                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-300">
                    Status
                  </th>

                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-300">
                    Verification
                  </th>

                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-300">
                    Roles
                  </th>

                  <th className="px-6 py-4 text-right text-[10px] font-bold uppercase tracking-[0.2em] text-slate-300">
                    Controls
                  </th>
                </tr>
              </thead>

              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-12 text-center text-sm text-slate-500"
                    >
                      {loadingUsers
                        ? "Loading users..."
                        : "No users returned by the administrative API."}
                    </td>
                  </tr>
                ) : (
                  users.map((targetUser) => {
                    const isSelf =
                      String(targetUser.id) ===
                      String(identity?.user_id);

                    const isBusy =
                      busyUserId === targetUser.id;

                    return (
                      <tr
                        key={targetUser.id}
                        className="border-b border-white/[0.06] transition hover:bg-white/[0.02]"
                      >
                        <td className="px-6 py-5">
                          <div className="font-semibold text-slate-100">
                            {targetUser.email}
                          </div>

                          <div className="mt-1 text-xs text-slate-600">
                            User ID {targetUser.id}
                          </div>
                        </td>

                        <td className="px-6 py-5">
                          <span
                            className={`rounded-full border px-3 py-1 text-xs ${
                              targetUser.is_active
                                ? "border-emerald-400/20 bg-emerald-400/[0.05] text-emerald-300"
                                : "border-red-400/20 bg-red-400/[0.05] text-red-300"
                            }`}
                          >
                            {targetUser.is_active
                              ? "ACTIVE"
                              : "INACTIVE"}
                          </span>
                        </td>

                        <td className="px-6 py-5">
                          <span
                            className={`text-xs ${
                              targetUser.is_verified
                                ? "text-emerald-300"
                                : "text-slate-500"
                            }`}
                          >
                            {targetUser.is_verified
                              ? "VERIFIED"
                              : "UNVERIFIED"}
                          </span>
                        </td>

                        <td className="px-6 py-5">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {targetUser.roles.map((role) => (
                              <span
                                key={role}
                                className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.035] px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.06em] text-slate-300"
                              >
                                {role}
                              </span>
                            ))}
                          </div>
                        </td>

                        <td className="px-6 py-5">
                          <div className="flex flex-wrap items-center justify-end gap-2">

                            <button
                              disabled={isSelf || isBusy}
                              title={
                                isSelf
                                  ? "Administrators cannot deactivate themselves."
                                  : ""
                              }
                              onClick={() =>
                                void updateUserStatus(targetUser)
                              }
                              className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-slate-300 transition hover:bg-white/[0.09] disabled:cursor-not-allowed disabled:opacity-35"
                            >
                              {isBusy
                                ? "Working..."
                                : targetUser.is_active
                                  ? "Deactivate"
                                  : "Activate"}
                            </button>

                            <select
                              disabled={
                                isSelf || isBusy
                              }
                              value={
                                targetUser.roles[0] ?? "user"
                              }
                              onChange={(event) =>
                                void updateUserRole(
                                  targetUser,
                                  event.target.value
                                )
                              }
                              title={
                                isSelf
                                  ? "Administrators cannot modify their own roles."
                                  : "Change role"
                              }
                              className="min-w-[112px] rounded-lg border border-white/10 bg-[#070B12] px-3 py-2 text-xs font-medium text-slate-300 outline-none transition focus:border-cyan-300/40 hover:border-white/20 disabled:cursor-not-allowed disabled:opacity-35"
                            >
                              <option value="user">
                                user
                              </option>

                              <option value="trader">
                                trader
                              </option>

                              <option value="admin">
                                admin
                              </option>

                              <option value="superadmin">
                                superadmin
                              </option>
                            </select>

                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="border-t border-white/10 bg-black/10 px-6 py-4">
            <p className="text-[11px] leading-5 text-slate-600">
              Privileged role assignments remain enforced by the backend.
              Ordinary administrators cannot grant admin or superadmin
              authority.
            </p>
          </div>

        </section>

        <footer className="mt-6 flex flex-col gap-2 border-t border-white/10 pt-5 text-[11px] text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <span>
            VOLSIM-PRO Administrative Control Plane
          </span>

          <span>
            RBAC status: {data.status}
          </span>
        </footer>

      </div>
    </main>
  );
}









