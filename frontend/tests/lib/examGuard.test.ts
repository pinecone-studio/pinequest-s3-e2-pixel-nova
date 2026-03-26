import {
	generateId,
	generateRoomCode,
	getJSON,
	setJSON,
	getJSONForRole,
	setJSONForRole,
	calculateXP,
	getLevel,
	defaultViolations,
	getSessionUser,
	setSessionUser,
	clearSession,
	ensureDemoAccounts,
	LEVELS,
	STORAGE_KEYS,
	sleep,
} from "@/lib/examGuard";

describe("generateId", () => {
	it("returns a string with timestamp and random suffix", () => {
		const id = generateId();
		expect(typeof id).toBe("string");
		expect(id).toMatch(/^\d+-[a-z0-9]+$/);
	});

	it("generates unique ids", () => {
		const ids = new Set(Array.from({ length: 20 }, () => generateId()));
		expect(ids.size).toBe(20);
	});
});

describe("generateRoomCode", () => {
	it("returns a 6-character alphanumeric uppercase string", () => {
		const code = generateRoomCode();
		expect(code).toMatch(/^[A-Z0-9]{1,6}$/);
		expect(code.length).toBeGreaterThan(0);
		expect(code.length).toBeLessThanOrEqual(6);
	});
});

describe("defaultViolations", () => {
	it("returns zeroed violation counters", () => {
		const v = defaultViolations();
		expect(v.tabSwitch).toBe(0);
		expect(v.windowBlur).toBe(0);
		expect(v.copyAttempt).toBe(0);
		expect(v.pasteAttempt).toBe(0);
		expect(v.suspiciousSpeed).toBe(0);
		expect(v.fullscreenExit).toBe(0);
		expect(v.keyboardShortcut).toBe(0);
		expect(v.log).toEqual([]);
	});

	it("returns a new object each call", () => {
		const a = defaultViolations();
		const b = defaultViolations();
		expect(a).not.toBe(b);
	});
});

describe("getJSON / setJSON", () => {
	it("stores and retrieves a value", () => {
		setJSON("test-key", { a: 1 });
		expect(getJSON("test-key", null)).toEqual({ a: 1 });
	});

	it("returns fallback when key not found", () => {
		expect(getJSON("nonexistent", "default")).toBe("default");
	});

	it("returns true on successful set", () => {
		expect(setJSON("ok-key", 42)).toBe(true);
	});
});

describe("getJSONForRole / setJSONForRole", () => {
	it("stores values scoped by role", () => {
		setJSONForRole("exams", [1, 2], "teacher");
		setJSONForRole("exams", [3, 4], "student");
		expect(getJSONForRole("exams", [], "teacher")).toEqual([1, 2]);
		expect(getJSONForRole("exams", [], "student")).toEqual([3, 4]);
	});

	it("returns fallback for missing role-scoped key", () => {
		expect(getJSONForRole("missing", "fb", "admin")).toBe("fb");
	});
});

describe("calculateXP", () => {
	it.each([
		[100, 100],
		[95, 100],
		[90, 100],
		[89, 80],
		[80, 80],
		[79, 60],
		[70, 60],
		[69, 40],
		[60, 40],
		[59, 20],
		[50, 20],
		[49, 10],
		[0, 10],
	])("returns %i XP for %i%%", (percentage, expectedXP) => {
		expect(calculateXP(percentage)).toBe(expectedXP);
	});
});

describe("getLevel", () => {
	it("returns level 1 for 0 XP", () => {
		const level = getLevel(0);
		expect(level.level).toBe(1);
		expect(level.name).toBe("Анхдагч");
	});

	it("returns level 5 for 2000 XP", () => {
		expect(getLevel(2000).level).toBe(5);
	});

	it("returns level 10 for 12000+ XP", () => {
		expect(getLevel(15000).level).toBe(10);
	});

	it("stays at current level below next threshold", () => {
		expect(getLevel(199).level).toBe(1);
		expect(getLevel(200).level).toBe(2);
	});
});

describe("session management", () => {
	beforeEach(() => {
		clearSession();
	});

	it("returns null when no session", () => {
		expect(getSessionUser()).toBeNull();
	});

	it("stores and retrieves a session user", () => {
		const user = {
			id: "u1",
			username: "test",
			password: "pass",
			role: "student" as const,
			createdAt: "2024-01-01",
		};
		setSessionUser(user);
		expect(getSessionUser()).toEqual(user);
	});

	it("clearSession removes the user", () => {
		setSessionUser({
			id: "u2",
			username: "x",
			password: "p",
			role: "teacher",
			createdAt: "2024-01-01",
		});
		clearSession();
		expect(getSessionUser()).toBeNull();
	});
});

describe("ensureDemoAccounts", () => {
	it("creates demo accounts when store is empty", () => {
		setJSON(STORAGE_KEYS.users, []);
		ensureDemoAccounts();
		const users = getJSON<{ username: string; role: string }[]>(STORAGE_KEYS.users, []);
		expect(users.length).toBe(2);
		expect(users[0].role).toBe("teacher");
		expect(users[1].role).toBe("student");
	});

	it("does not overwrite existing users", () => {
		const existing = [{ id: "1", username: "existing", password: "p", role: "teacher", createdAt: "" }];
		setJSON(STORAGE_KEYS.users, existing);
		ensureDemoAccounts();
		const users = getJSON<{ username: string }[]>(STORAGE_KEYS.users, []);
		expect(users.length).toBe(1);
		expect(users[0].username).toBe("existing");
	});
});

describe("LEVELS", () => {
	it("has 10 levels sorted by minXP", () => {
		expect(LEVELS).toHaveLength(10);
		for (let i = 1; i < LEVELS.length; i++) {
			expect(LEVELS[i].minXP).toBeGreaterThan(LEVELS[i - 1].minXP);
		}
	});
});

describe("sleep", () => {
	beforeEach(() => jest.useFakeTimers());
	afterEach(() => jest.useRealTimers());

	it("resolves after specified ms", async () => {
		const p = sleep(1000);
		jest.advanceTimersByTime(1000);
		await expect(p).resolves.toBeUndefined();
	});
});
