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
  onChangeRole,
}: RoleNavbarProps) {
  return (
    <div className="flex items-center gap-2">
      {roles.map((role) => (
        <button
          key={role}
          className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${
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
