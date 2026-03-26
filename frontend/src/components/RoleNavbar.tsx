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
  loading,
  onChangeRole,
  onChangeUser,
}: RoleNavbarProps) {
  return (
    <div className="flex items-center gap-2">
      {users.length > 0 && (
        <select
          className="rounded-xl border border-border bg-muted px-3 py-2 text-xs font-semibold text-foreground focus:outline-none"
          value={activeUserId ?? ""}
          disabled={loading}
          onChange={(e) => onChangeUser(e.target.value)}
        >
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.fullName}
            </option>
          ))}
        </select>
      )}
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
