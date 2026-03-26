import RoleClient from "./RoleClient";

const validRoles = ["teacher", "student"] as const;

export const dynamicParams = false;

export function generateStaticParams() {
  return validRoles.map((role) => ({ role }));
}

export default function RolePage() {
  return <RoleClient />;
}
