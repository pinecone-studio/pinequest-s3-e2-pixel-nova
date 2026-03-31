import type { AuthUser } from "@/lib/backend-auth";
import type { RoleKey } from "@/lib/role-session";
import { getRoleLabel } from "@/lib/role-session";
import { Button } from "./ui/button";
import { ButtonGroup } from "./ui/button-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

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
        <Select
          value={activeUserId ?? undefined}
          disabled={loading}
          onValueChange={onChangeUser}>
          <SelectTrigger
            size="sm"
            className="min-w-40 rounded-xl border-[#dce5ef] bg-[#f8fafc] text-xs font-semibold text-slate-700 hover:bg-white">
            <SelectValue placeholder="Select user" />
          </SelectTrigger>
          <SelectContent className="rounded-2xl border border-[#dce5ef] bg-white p-2 shadow-[0_18px_40px_-24px_rgba(15,23,42,0.24)]">
            {users.map((user) => (
              <SelectItem
                key={user.id}
                value={user.id}
                className="rounded-xl px-3 py-2 text-sm text-slate-700 focus:bg-[#eff6ff] focus:text-slate-900 data-[state=checked]:bg-[#eff6ff] data-[state=checked]:text-slate-900"
              >
                {user.fullName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      {roles.map((role) => (
        <Button
          key={role}
          type="button"
          size="sm"
          variant={activeRole === role ? "default" : "outline"}
          className="rounded-xl text-xs font-semibold"
          onClick={() => onChangeRole(role)}>
          {getRoleLabel(role)}
        </Button>
      ))}
    </div>
  );
}
