"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import TeacherPageContent from "../teacher/TeacherPageContent";
import StudentPageContent from "../student/StudentPageContent";
import {
	getStoredRole,
	isTeacherRole,
	setStoredRole,
	type RoleKey,
} from "@/lib/role-session";

const validRoles: RoleKey[] = [
	"teacher",
	"student",
];

const isValidRole = (value: string): value is RoleKey =>
	validRoles.includes(value as RoleKey);

export default function RoleClient() {
	const router = useRouter();
	const params = useParams<{ role: string }>();
	const [ready, setReady] = useState(false);
	const resolvedRole = useMemo(() => {
		if (params?.role && isValidRole(params.role)) return params.role;
		return getStoredRole();
	}, [params?.role]);

	useEffect(() => {
		if (!params?.role) return;
		if (!isValidRole(params.role)) {
			const fallback = getStoredRole();
			router.replace(`/${fallback}`);
			return;
		}
		setStoredRole(params.role);
		setReady(true);
	}, [params?.role, router]);

	if (!ready) return null;

<<<<<<< HEAD
return isTeacherRole(resolvedRole) ? (
		<TeacherPage />
	) : (
		<StudentPage />
=======
	return isTeacherRole(resolvedRole) ? (
		<TeacherPageContent forcedRole={resolvedRole} />
	) : (
		<StudentPageContent forcedRole={resolvedRole} />
>>>>>>> bd713b3 (conflict repair)
	);
}
