"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { assignRole, removeRole } from "./actions";

interface RoleActionsProps {
  userId: string;
  currentRoles: string[];
}

export function RoleActions({ userId, currentRoles }: RoleActionsProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const isAdmin = currentRoles.includes("admin");
  const isMod = currentRoles.includes("moderator");

  async function handleToggleAdmin() {
    setLoading(true);
    if (isAdmin) {
      await removeRole(userId, "admin");
    } else {
      await assignRole(userId, "admin");
    }
    router.refresh();
    setLoading(false);
  }

  async function handleToggleMod() {
    setLoading(true);
    if (isMod) {
      await removeRole(userId, "moderator");
    } else {
      await assignRole(userId, "moderator");
    }
    router.refresh();
    setLoading(false);
  }

  return (
    <div className="flex gap-2 shrink-0">
      <button
        onClick={handleToggleAdmin}
        disabled={loading}
        className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-50"
      >
        {isAdmin ? "- Admin" : "+ Admin"}
      </button>
      <button
        onClick={handleToggleMod}
        disabled={loading}
        className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-50"
      >
        {isMod ? "- Mod" : "+ Mod"}
      </button>
    </div>
  );
}
