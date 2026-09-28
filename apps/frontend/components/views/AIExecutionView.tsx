"use client";

import React from "react";
import { useTradingStore } from "../../store/useTradingStore";

export default function AIExecutionView() {
  const aiDecision = useTradingStore((state) => state.aiDecision);
  const aiExecution = useTradingStore((state) => state.aiExecution);
  const executionRisk = useTradingStore((state) => state.executionRisk);
  const orderBuilder = useTradingStore((state) => state.orderBuilder);
  const aiExecutionOrchestrator = useTradingStore(
    (state) => state.aiExecutionOrchestrator
  );
  const executionQueue = useTradingStore((state) => state.executionQueue);

  const decision = String(aiDecision?.decision ?? "HOLD");
  const confidence = Number(aiDecision?.confidence ?? 0);
  const decisionId = String(aiDecision?.decision_id ?? "—");
  const decisionReason = String(
    aiDecision?.reason ?? "No decision reason available"
  );

  const riskApproved = executionRisk?.approved === true;
  const riskReason = String(
    executionRisk?.reason ?? "Risk evaluation pending"
  );

  const orderReady = orderBuilder?.order_ready === true;
  const orderRequest = orderBuilder?.order_request ?? {};

  const executionStatus = String(
    aiExecution?.status ??
      aiExecutionOrchestrator?.status ??
      "STANDBY"
  );

  const executionSignal = String(
    aiExecution?.execution_signal ??
      aiExecutionOrchestrator?.execution_signal ??
      "NONE"
  );

  const executionAction = String(
    aiExecutionOrchestrator?.last_action ??
      aiExecution?.last_action ??
      "WAITING"
  );

  const queuedOrders = Number(executionQueue?.queued_orders ?? 0);
  const processedOrders = Number(
    executionQueue?.processed_orders ?? 0
  );

  const lifecycle = [
    {
      label: "AI DECISION",
      value: decision,
      active: Boolean(aiDecision?.decision_id),
    },
    {
      label: "RISK GATE",
      value: riskApproved ? "APPROVED" : "NOT APPROVED",
      active: riskApproved,
    },
    {
      label: "ORDER BUILDER",
      value: orderReady ? "READY" : "BLOCKED",
      active: orderReady,
    },
    {
      label: "EXECUTION",
      value: executionStatus,
      active:
        executionStatus === "READY" ||
        executionStatus === "QUEUED" ||
        executionStatus === "DISPATCHING" ||
        executionAction === "ORDER_SENT",
    },
    {
      label: "QUEUE",
      value: queuedOrders > 0 ? `${queuedOrders} QUEUED` : executionAction,
      active: queuedOrders > 0 || executionAction === "QUEUED",
    },
  ];

  return (
    <div className="space-y-4 min-h-[calc(100vh-140px)] font-mono text-xs">
      <div className="border border-zinc-800 bg-zinc-950/80 rounded-sm p-5 shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-900 pb-4">
          <div>
            <div className="text-emerald-400 text-[10px] uppercase tracking-[0.2em]">
              VolSim-Pro
            </div>
            <h1 className="text-zinc-100 text-lg font-bold uppercase tracking-wider mt-1">
              AI Execution Control Center
            </h1>
          </div>

          <div className="text-right">
            <div className="text-[9px] text-zinc-600 uppercase">
              Intelligence Core
            </div>
            <div className="text-emerald-400 font-bold mt-1">
              {String(aiDecision?.status ?? "OFFLINE")}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-5">
          <div className="border border-zinc-800 bg-zinc-900/40 rounded-sm p-4">
            <div className="text-[9px] text-zinc-600 uppercase">
              Decision
            </div>
            <div className="text-2xl text-zinc-100 font-bold mt-2">
              {decision}
            </div>
            <div className="text-zinc-500 mt-2">
              Confidence {confidence.toFixed(0)}%
            </div>
          </div>

          <div className="border border-zinc-800 bg-zinc-900/40 rounded-sm p-4">
            <div className="text-[9px] text-zinc-600 uppercase">
              Risk Gate
            </div>
            <div
              className={`text-xl font-bold mt-2 ${
                riskApproved ? "text-emerald-400" : "text-amber-400"
              }`}
            >
              {riskApproved ? "APPROVED" : "NOT APPROVED"}
            </div>
            <div className="text-zinc-500 mt-2">
              {riskReason}
            </div>
          </div>

          <div className="border border-zinc-800 bg-zinc-900/40 rounded-sm p-4">
            <div className="text-[9px] text-zinc-600 uppercase">
              Execution
            </div>
            <div className="text-xl text-zinc-100 font-bold mt-2">
              {executionStatus}
            </div>
            <div className="text-zinc-500 mt-2">
              Signal: {executionSignal}
            </div>
          </div>
        </div>
      </div>

      <div className="border border-zinc-800 bg-zinc-950/80 rounded-sm p-5 shadow-2xl">
        <div className="text-zinc-200 font-bold uppercase tracking-wider text-[11px] mb-4">
          Execution Pipeline
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
          {lifecycle.map((stage) => (
            <React.Fragment key={stage.label}>
              <div
                className={`border rounded-sm p-3 ${
                  stage.active
                    ? "border-emerald-900 bg-emerald-950/20"
                    : "border-zinc-800 bg-zinc-900/30"
                }`}
              >
                <div className="text-[9px] text-zinc-600">
                  {stage.label}
                </div>
                <div
                  className={`mt-2 font-bold ${
                    stage.active
                      ? "text-emerald-400"
                      : "text-zinc-500"
                  }`}
                >
                  {stage.value}
                </div>
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="border border-zinc-800 bg-zinc-950/80 rounded-sm p-5 shadow-xl">
          <div className="text-zinc-200 font-bold uppercase tracking-wider text-[11px] border-b border-zinc-900 pb-3">
            Decision Intelligence
          </div>

          <div className="space-y-4 mt-4">
            <div>
              <div className="text-[9px] text-zinc-600 uppercase">
                Decision ID
              </div>
              <div className="text-zinc-300 mt-1 break-all">
                {decisionId}
              </div>
            </div>

            <div>
              <div className="text-[9px] text-zinc-600 uppercase">
                Reason
              </div>
              <div className="text-zinc-300 mt-1">
                {decisionReason}
              </div>
            </div>

            <div>
              <div className="text-[9px] text-zinc-600 uppercase">
                Trend Signal
              </div>
              <div className="text-zinc-300 mt-1">
                {String(aiDecision?.trend_signal ?? "NONE")}
              </div>
            </div>

            <div>
              <div className="text-[9px] text-zinc-600 uppercase">
                Counter Trend
              </div>
              <div className="text-zinc-300 mt-1">
                {String(
                  aiDecision?.counter_trend_signal ?? "NONE"
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="border border-zinc-800 bg-zinc-950/80 rounded-sm p-5 shadow-xl">
          <div className="text-zinc-200 font-bold uppercase tracking-wider text-[11px] border-b border-zinc-900 pb-3">
            Order Builder
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <div className="text-[9px] text-zinc-600 uppercase">
                Status
              </div>
              <div className="text-zinc-300 mt-1">
                {orderReady ? "READY" : "BLOCKED"}
              </div>
            </div>

            <div>
              <div className="text-[9px] text-zinc-600 uppercase">
                Symbol
              </div>
              <div className="text-zinc-300 mt-1">
                {String(orderRequest.symbol ?? "—")}
              </div>
            </div>

            <div>
              <div className="text-[9px] text-zinc-600 uppercase">
                Type
              </div>
              <div className="text-zinc-300 mt-1">
                {String(orderRequest.type ?? "—")}
              </div>
            </div>

            <div>
              <div className="text-[9px] text-zinc-600 uppercase">
                Volume
              </div>
              <div className="text-zinc-300 mt-1">
                {String(orderRequest.volume ?? "—")}
              </div>
            </div>

            <div>
              <div className="text-[9px] text-zinc-600 uppercase">
                Entry
              </div>
              <div className="text-zinc-300 mt-1">
                {String(orderRequest.price ?? "—")}
              </div>
            </div>

            <div>
              <div className="text-[9px] text-zinc-600 uppercase">
                Stop Loss
              </div>
              <div className="text-zinc-300 mt-1">
                {String(orderRequest.stop_loss ?? "—")}
              </div>
            </div>

            <div>
              <div className="text-[9px] text-zinc-600 uppercase">
                Take Profit
              </div>
              <div className="text-zinc-300 mt-1">
                {String(orderRequest.take_profit ?? "—")}
              </div>
            </div>

            <div>
              <div className="text-[9px] text-zinc-600 uppercase">
                Queue
              </div>
              <div className="text-zinc-300 mt-1">
                {queuedOrders}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border border-zinc-800 bg-zinc-950/80 rounded-sm p-4">
          <div className="text-[9px] text-zinc-600 uppercase">
            Orchestrator
          </div>
          <div className="text-zinc-200 font-bold mt-2">
            {executionAction}
          </div>
        </div>

        <div className="border border-zinc-800 bg-zinc-950/80 rounded-sm p-4">
          <div className="text-[9px] text-zinc-600 uppercase">
            Queue
          </div>
          <div className="text-zinc-200 font-bold mt-2">
            {queuedOrders} queued
          </div>
        </div>

        <div className="border border-zinc-800 bg-zinc-950/80 rounded-sm p-4">
          <div className="text-[9px] text-zinc-600 uppercase">
            Processed
          </div>
          <div className="text-zinc-200 font-bold mt-2">
            {processedOrders}
          </div>
        </div>
      </div>
    </div>
  );
}
