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
            className="min-w-40 rounded-xl bg-muted text-xs font-semibold">
            <SelectValue placeholder="Select user" />
          </SelectTrigger>
          <SelectContent>
            {users.map((user) => (
              <SelectItem key={user.id} value={user.id}>
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
