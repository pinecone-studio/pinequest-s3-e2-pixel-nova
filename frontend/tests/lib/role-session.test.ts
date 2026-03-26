jest.mock("@/lib/backend-auth", () => ({}));

import {
	getStoredRole,
	setStoredRole,
	isTeacherRole,
	getRoleLabel,
	getLinkedTeacherRole,
	getStoredSelectedUserId,
	setStoredSelectedUserId,
	getTeacherRoles,
	buildSessionUser,
} from "@/lib/role-session";

describe("getStoredRole / setStoredRole", () => {
	it("defaults to student", () => {
		expect(getStoredRole()).toBe("student");
	});

	it("stores and retrieves a role", () => {
		setStoredRole("teacher");
		expect(getStoredRole()).toBe("teacher");
		setStoredRole("student");
	});
});

describe("isTeacherRole", () => {
	it("returns true for teacher", () => {
		expect(isTeacherRole("teacher")).toBe(true);
	});

	it("returns false for student", () => {
		expect(isTeacherRole("student")).toBe(false);
	});
});

describe("getRoleLabel", () => {
	it("returns Багш for teacher", () => {
		expect(getRoleLabel("teacher")).toBe("Багш");
	});

	it("returns Сурагч for student", () => {
		expect(getRoleLabel("student")).toBe("Сурагч");
	});
});

describe("getLinkedTeacherRole", () => {
	it("returns teacher for student", () => {
		expect(getLinkedTeacherRole("student")).toBe("teacher");
	});

	it("returns teacher for teacher", () => {
		expect(getLinkedTeacherRole("teacher")).toBe("teacher");
	});
});

describe("getStoredSelectedUserId / setStoredSelectedUserId", () => {
	it("returns null when no user stored for role", () => {
		expect(getStoredSelectedUserId("teacher")).toBeNull();
	});

	it("stores and retrieves user id per role", () => {
		setStoredSelectedUserId("teacher", "t-1");
		setStoredSelectedUserId("student", "s-1");
		expect(getStoredSelectedUserId("teacher")).toBe("t-1");
		expect(getStoredSelectedUserId("student")).toBe("s-1");
	});
});

describe("getTeacherRoles", () => {
	it("returns array with teacher only", () => {
		expect(getTeacherRoles()).toEqual(["teacher"]);
	});
});

describe("buildSessionUser", () => {
	it("maps AuthUser to User format", () => {
		const authUser = {
			id: "u-123",
			fullName: "Бат",
			role: "student" as const,
			code: "S-1001",
		};

		const user = buildSessionUser(authUser);

		expect(user.id).toBe("u-123");
		expect(user.username).toBe("Бат");
		expect(user.password).toBe("");
		expect(user.role).toBe("student");
		expect(user.createdAt).toBeTruthy();
	});
});
