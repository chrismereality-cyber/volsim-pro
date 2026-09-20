"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../src/auth/AuthProvider";
import { hasPermission } from "../../src/auth/permissions";
import { TradingApiClient } from "../../lib/TradingApiClient";

type AdminUser = {
  id: number;
  email: string;
  is_active: boolean;
  is_verified: boolean;
  roles: string[];
  created_at?: string;
  updated_at?: string;
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
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [busyUserId, setBusyUserId] = useState<number | null>(null);

  const loadAdminData = async () => {
    if (!accessToken || !identity) return;

    if (!hasPermission(identity, "users.read")) {
      setError("Access denied. The users.read permission is required.");
      return;
    }

    try {
      setError(null);
      setLoadingUsers(true);

      const [summaryResponse, usersResponse] = await Promise.all([
        TradingApiClient.getAuthenticated(
          "/api/admin/summary",
          accessToken
        ),
        TradingApiClient.getAuthenticated(
          "/api/admin/users",
          accessToken
        ),
      ]);

      setData(summaryResponse);

      const incomingUsers =
        Array.isArray(usersResponse)
          ? usersResponse
          : Array.isArray(usersResponse?.users)
            ? usersResponse.users
            : Array.isArray(usersResponse?.data)
              ? usersResponse.data
              : [];

      setUsers(incomingUsers);
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

          <h1 className="mt-3 text-3xl font-semibold">
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

            <h1 className="mt-2 text-4xl font-semibold tracking-tight">
              Admin Portal
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              Administrative identity, RBAC and user management.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-full border border-emerald-400/20 bg-emerald-400/[0.06] px-4 py-2 text-xs uppercase tracking-wider text-emerald-300">
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

        {/* STATISTICS */}
        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
            <p className="text-[11px] uppercase tracking-[0.25em] text-slate-500">
              Users
            </p>
            <p className="mt-3 text-3xl font-semibold">
              {data.statistics.users}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Registered identities
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
            <p className="text-[11px] uppercase tracking-[0.25em] text-slate-500">
              Active Users
            </p>
            <p className="mt-3 text-3xl font-semibold text-emerald-300">
              {data.statistics.active_users}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Currently active
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
            <p className="text-[11px] uppercase tracking-[0.25em] text-slate-500">
              Roles
            </p>
            <p className="mt-3 text-3xl font-semibold">
              {data.statistics.roles}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Canonical RBAC roles
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
            <p className="text-[11px] uppercase tracking-[0.25em] text-slate-500">
              Assignments
            </p>
            <p className="mt-3 text-3xl font-semibold">
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
                <h2 className="mt-2 text-xl font-semibold">
                  Administrator
                </h2>
              </div>

              <div className="rounded-full border border-cyan-300/20 bg-cyan-300/[0.05] px-3 py-1 text-xs text-cyan-200">
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
                      className="inline-flex items-center rounded-full border border-cyan-300/20 bg-cyan-300/[0.06] px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.08em] text-cyan-200 shadow-[0_0_18px_rgba(34,211,238,0.04)]"
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

            <h2 className="mt-2 text-xl font-semibold">
              Permissions
            </h2>

            <div className="mt-5 max-h-52 overflow-auto pr-1">
              <div className="flex flex-wrap items-center gap-2">
                {data.administrator.permissions.map((permission) => (
                  <span
                    key={permission}
                    className="inline-flex items-center rounded-md border border-white/10 bg-black/25 px-2.5 py-1.5 text-[10px] font-medium tracking-[0.03em] text-slate-300 transition hover:border-cyan-300/20 hover:bg-cyan-300/[0.04] hover:text-cyan-200"
                  >
                    {permission}
                  </span>
                ))}
              </div>
            </div>
          </div>

        </section>

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

              <h2 className="mt-2 text-xl font-semibold">
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
                  <th className="px-6 py-4 text-[10px] uppercase tracking-[0.2em] text-slate-500">
                    Identity
                  </th>

                  <th className="px-6 py-4 text-[10px] uppercase tracking-[0.2em] text-slate-500">
                    Status
                  </th>

                  <th className="px-6 py-4 text-[10px] uppercase tracking-[0.2em] text-slate-500">
                    Verification
                  </th>

                  <th className="px-6 py-4 text-[10px] uppercase tracking-[0.2em] text-slate-500">
                    Roles
                  </th>

                  <th className="px-6 py-4 text-right text-[10px] uppercase tracking-[0.2em] text-slate-500">
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
                          <div className="font-medium text-slate-200">
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


