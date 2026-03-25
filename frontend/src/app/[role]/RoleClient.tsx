"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import TeacherPage from "../teacher/page";
import StudentPage from "../student/page";
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

	return isTeacherRole(resolvedRole) ? (
		<TeacherPage forcedRole={resolvedRole} />
	) : (
		<StudentPage forcedRole={resolvedRole} />
	);
}
