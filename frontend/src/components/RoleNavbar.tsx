import { useState } from "react";
import type { RoleKey } from "@/lib/role-session";
import { getRoleLabel } from "@/lib/role-session";

type RoleNavbarProps = {
  activeRole: RoleKey;
  onChange: (role: RoleKey) => void;
};

const roles: RoleKey[] = ["teacher-1", "teacher-2", "student-1", "student-2"];

export default function RoleNavbar({ activeRole, onChange }: RoleNavbarProps) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border/60 bg-card/80 px-4 py-3 shadow-sm backdrop-blur">
      <span className="text-xs font-semibold text-muted-foreground">
        Роль сонгох
      </span>
      <div
        className="relative"
        tabIndex={0}
        onBlur={() => setOpen(false)}
      >
        <button
          className="flex items-center gap-2 rounded-xl border border-border bg-muted px-3 py-2 text-xs font-semibold text-foreground transition hover:bg-muted/70"
          onClick={() => setOpen((prev) => !prev)}
        >
          {getRoleLabel(activeRole)}
          <svg
            className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
        <div
          className={`absolute left-0 z-20 mt-2 w-40 rounded-2xl border border-border bg-card p-2 text-xs shadow-xl transition ${
            open
              ? "opacity-100 translate-y-0"
              : "pointer-events-none opacity-0 -translate-y-1"
          }`}
        >
          {roles.map((role) => (
            <button
              key={role}
              className={`w-full rounded-xl px-3 py-2 text-left font-semibold transition ${
                activeRole === role
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground hover:bg-muted"
              }`}
              onClick={() => {
                onChange(role);
                setOpen(false);
              }}
            >
              {getRoleLabel(role)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
