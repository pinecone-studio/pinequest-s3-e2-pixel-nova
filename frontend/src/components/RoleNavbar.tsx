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
<<<<<<< Updated upstream
  const [open, setOpen] = useState(false);
  const activeUser =
    users.find((user) => user.id === activeUserId) ?? users[0] ?? null;
  const activeUserName =
    typeof activeUser?.fullName === "string" ? activeUser.fullName : "";

=======
>>>>>>> Stashed changes
  return (
    <div className="flex items-center gap-2">
      {roles.map((role) => (
        <button
<<<<<<< Updated upstream
          disabled={loading || users.length === 0}
          className="flex items-center gap-2 rounded-xl border border-border bg-muted px-3 py-2 text-xs font-semibold text-foreground transition hover:bg-muted/70 disabled:cursor-not-allowed disabled:opacity-70"
          onClick={() => setOpen((prev) => !prev)}
        >
          {loading
            ? "Ачааллаж байна..."
            : activeUserName || `${getRoleLabel(activeRole)} байхгүй`}
          <svg
            className={`h-3.5 w-3.5 transition-transform ${
              open ? "rotate-180" : ""
            }`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
        <div
          className={`absolute left-0 z-20 mt-2 w-56 rounded-2xl border border-border bg-card p-2 text-xs shadow-xl transition ${
            open
              ? "translate-y-0 opacity-100"
              : "pointer-events-none -translate-y-1 opacity-0"
=======
          key={role}
          className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${
            activeRole === role
              ? "bg-primary text-primary-foreground"
              : "border border-border bg-muted text-foreground hover:bg-muted/70"
>>>>>>> Stashed changes
          }`}
          onClick={() => onChangeRole(role)}
        >
<<<<<<< Updated upstream
          {users.map((user) => (
            <button
              key={user.id}
              className={`w-full rounded-xl px-3 py-2 text-left font-semibold transition ${
                activeUserId === user.id
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground hover:bg-muted"
              }`}
              onClick={() => {
                onChangeUser(user.id);
                setOpen(false);
              }}
            >
              <div>{user.fullName}</div>
              <div className="text-[10px] opacity-70">
                {user.code ?? user.id}
              </div>
            </button>
          ))}
        </div>
      </div>
=======
          {getRoleLabel(role)}
        </button>
      ))}
>>>>>>> Stashed changes
    </div>
  );
}
