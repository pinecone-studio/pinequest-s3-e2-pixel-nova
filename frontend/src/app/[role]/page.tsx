import RoleClient from "./RoleClient";

const validRoles = ["teacher", "student"];

export function generateStaticParams() {
	return validRoles.map((role) => ({ role }));
}

export default function RolePage() {
	return <RoleClient />;
}
