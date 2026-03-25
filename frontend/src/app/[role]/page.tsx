import RoleClient from "./RoleClient";

const validRoles = ["teacher-1", "teacher-2", "student-1", "student-2"];

export function generateStaticParams() {
	return validRoles.map((role) => ({ role }));
}

export default function RolePage() {
	return <RoleClient />;
}
