const mockGetSessionUser = jest.fn();
const mockGetStudentProfile = jest.fn();
const mockUpdateStudentProfile = jest.fn();

jest.mock("@/lib/examGuard", () => ({
	getSessionUser: (...args: unknown[]) => mockGetSessionUser(...args),
}));

jest.mock("@/lib/backend-auth", () => ({
	getStudentProfile: (...args: unknown[]) => mockGetStudentProfile(...args),
	updateStudentProfile: (...args: unknown[]) => mockUpdateStudentProfile(...args),
}));

jest.mock("@/app/student/styles", () => ({
	cardClass: "mock-card",
}));

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import StudentSettingsTab from "@/app/student/components/StudentSettingsTab";

const originalError = console.error;
beforeAll(() => {
	console.error = (...args: unknown[]) => {
		if (typeof args[0] === "string" && args[0].includes("not wrapped in act")) return;
		originalError(...args);
	};
});
afterAll(() => {
	console.error = originalError;
});

const mockProfile = {
	fullName: "Бат",
	email: "bat@test.mn",
	phone: "99112233",
	school: "МКС",
	grade: "10A",
	bio: "Сурагч",
};

describe("StudentSettingsTab", () => {
	beforeEach(() => {
		mockGetSessionUser.mockReturnValue({ id: "u1", username: "Бат", role: "student" });
		mockGetStudentProfile.mockResolvedValue(mockProfile);
		mockUpdateStudentProfile.mockResolvedValue(mockProfile);
	});

	afterEach(() => jest.restoreAllMocks());

	it("renders profile section and settings", async () => {
		render(<StudentSettingsTab userId="u1" username="Бат" />);

		await waitFor(() => expect(screen.getByText("Миний профайл")).toBeInTheDocument());
		expect(screen.getByText("Тохиргоо")).toBeInTheDocument();
	});

	it("loads profile from backend", async () => {
		render(<StudentSettingsTab userId="u1" username="Бат" />);

		await waitFor(() => {
			expect(screen.getByDisplayValue("bat@test.mn")).toBeInTheDocument();
		});

		expect(screen.getByDisplayValue("99112233")).toBeInTheDocument();
		expect(screen.getByDisplayValue("МКС")).toBeInTheDocument();
		expect(screen.getByDisplayValue("10A")).toBeInTheDocument();
	});

	it("shows default profile on API error", async () => {
		mockGetStudentProfile.mockRejectedValue(new Error("fail"));

		render(<StudentSettingsTab userId="u1" username="Бат" />);

		await waitFor(() => {
			expect(screen.getByText("Профайл ачаалах үед алдаа гарлаа.")).toBeInTheDocument();
		});
	});

	it("allows editing form fields", async () => {
		render(<StudentSettingsTab userId="u1" username="Бат" />);

		await waitFor(() => expect(screen.getByDisplayValue("bat@test.mn")).toBeInTheDocument());

		const emailInput = screen.getByDisplayValue("bat@test.mn");
		fireEvent.change(emailInput, { target: { value: "new@test.mn" } });

		expect(screen.getByDisplayValue("new@test.mn")).toBeInTheDocument();
	});

	it("saves profile when Хадгалах button clicked", async () => {
		render(<StudentSettingsTab userId="u1" username="Бат" />);

		await waitFor(() => expect(screen.getByDisplayValue("bat@test.mn")).toBeInTheDocument());

		fireEvent.click(screen.getByText("Хадгалах"));

		await waitFor(() => expect(mockUpdateStudentProfile).toHaveBeenCalledTimes(1));
	});

	it("shows success message after save", async () => {
		render(<StudentSettingsTab userId="u1" username="Бат" />);

		await waitFor(() => expect(screen.getByDisplayValue("bat@test.mn")).toBeInTheDocument());

		fireEvent.click(screen.getByText("Хадгалах"));

		await waitFor(() => {
			expect(screen.getByText("Профайл амжилттай хадгалагдлаа.")).toBeInTheDocument();
		});
	});

	it("shows error on save failure", async () => {
		mockUpdateStudentProfile.mockRejectedValue(new Error("fail"));

		render(<StudentSettingsTab userId="u1" username="Бат" />);

		await waitFor(() => expect(screen.getByDisplayValue("bat@test.mn")).toBeInTheDocument());

		fireEvent.click(screen.getByText("Хадгалах"));

		await waitFor(() => {
			expect(screen.getByText("Профайл хадгалах үед алдаа гарлаа.")).toBeInTheDocument();
		});
	});

	it("displays settings options", async () => {
		render(<StudentSettingsTab userId="u1" username="Бат" />);

		expect(screen.getByText("Авто хадгалалт: Асаалттай")).toBeInTheDocument();
		expect(screen.getByText("Шалгалтын сануулга: Асаалттай")).toBeInTheDocument();
		expect(screen.getByText("Төвлөрөх горим: Идэвхтэй")).toBeInTheDocument();
	});
});
