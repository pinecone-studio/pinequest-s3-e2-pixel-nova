import { useState } from "react";
import type { AuthUser } from "@/lib/backend-auth";
import type { RoleKey } from "@/lib/role-session";
import { getRoleLabel } from "@/lib/role-session";

type RoleNavbarProps = {
  activeRole: RoleKey;
  activeUserId: string | null;
  users: AuthUser[];
  loading?: boolean;
  onChangeRole: (role: RoleKey) => void;
  onChangeUser: (userId: string) => void;
};

const roles: RoleKey[] = ["teacher", "student"];

export default function RoleNavbar({
  activeRole,
  activeUserId,
  users,
  loading = false,
  onChangeRole,
  onChangeUser,
}: RoleNavbarProps) {
  const [open, setOpen] = useState(false);
  const activeUser =
    users.find((user) => user.id === activeUserId) ?? users[0] ?? null;

  return (
    <div className="flex items-center gap-1.5">
      {roles.map((role) => (
        <button
          key={role}
          className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
            activeRole === role
              ? "bg-primary text-primary-foreground"
              : "border border-border bg-muted text-foreground hover:bg-muted/70"
          }`}
          onClick={() => onChangeRole(role)}
        >
          {getRoleLabel(role)}
        </button>
      ))}
    </div>
  );
}
