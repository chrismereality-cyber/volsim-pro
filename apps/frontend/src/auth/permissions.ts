import type { Identity } from "./types";

export function hasPermission(
    identity: Identity | null,
    permission: string,
): boolean {
    if (!identity?.is_active) {
        return false;
    }

    return (
        identity.permissions.includes("*") ||
        identity.permissions.includes(permission)
    );
}
