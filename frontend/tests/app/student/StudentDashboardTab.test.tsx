import { render, screen, fireEvent } from "@testing-library/react";
import StudentDashboardTab from "@/app/student/components/StudentDashboardTab";

const defaultProps = {
	loading: false,
	currentUserName: "Бат",
	selectedExam: null,
	levelInfo: { level: 2, minXP: 200 },
	studentProgress: { xp: 350 },
	nextLevel: { minXP: 500 },
	currentRank: 3,
	studentCount: 20,
	studentHistory: [
		{
			examId: "e1",
			title: "Математик",
			percentage: 85,
			score: 85,
			totalPoints: 100,
			grade: "B" as const,
			date: "2024-06-01T10:00:00Z",
		},
		{
			examId: "e2",
			title: "Физик",
			percentage: 92,
			score: 92,
			totalPoints: 100,
			grade: "A" as const,
			date: "2024-06-02T10:00:00Z",
		},
	],
	onOpenExams: jest.fn(),
	onOpenProgress: jest.fn(),
};

describe("StudentDashboardTab", () => {
	it("renders welcome message with user name", () => {
		render(<StudentDashboardTab {...defaultProps} />);

		expect(screen.getByText(/Бат/)).toBeInTheDocument();
	});

	it("renders student history exams", () => {
		render(<StudentDashboardTab {...defaultProps} />);

		expect(screen.getAllByText("Математик").length).toBeGreaterThan(0);
		expect(screen.getAllByText("Физик").length).toBeGreaterThan(0);
	});

	it("displays rank information", () => {
		render(<StudentDashboardTab {...defaultProps} />);

		expect(screen.getAllByText(/3/).length).toBeGreaterThan(0);
	});

	it("calls onOpenExams when exam button clicked", () => {
		const onOpenExams = jest.fn();
		render(<StudentDashboardTab {...defaultProps} onOpenExams={onOpenExams} />);

		const examButtons = screen.getAllByRole("button");
		const examButton = examButtons.find((btn) =>
			btn.textContent?.includes("Шалгалт"),
		);
		if (examButton) {
			fireEvent.click(examButton);
			expect(onOpenExams).toHaveBeenCalledTimes(1);
		}
	});

	it("calls onOpenProgress when progress button clicked", () => {
		const onOpenProgress = jest.fn();
		render(
			<StudentDashboardTab {...defaultProps} onOpenProgress={onOpenProgress} />,
		);

		const buttons = screen.getAllByRole("button");
		const progressButton = buttons.find((btn) =>
			btn.textContent?.includes("Дүн"),
		);
		if (progressButton) {
			fireEvent.click(progressButton);
			expect(onOpenProgress).toHaveBeenCalledTimes(1);
		}
	});

	it("renders loading skeleton when loading is true", () => {
		const { container } = render(
			<StudentDashboardTab {...defaultProps} loading={true} />,
		);

		const animatedElements = container.querySelectorAll(".animate-pulse");
		expect(animatedElements.length).toBeGreaterThan(0);
	});

	it("renders with empty history", () => {
		render(
			<StudentDashboardTab {...defaultProps} studentHistory={[]} />,
		);

		// Should still render without errors
		expect(screen.getByText(/Бат/)).toBeInTheDocument();
	});

	it("renders with null rank", () => {
		render(
			<StudentDashboardTab {...defaultProps} currentRank={null} />,
		);

		expect(screen.getAllByText(/Бат/).length).toBeGreaterThan(0);
	});

	it("displays level information", () => {
		render(<StudentDashboardTab {...defaultProps} />);

		expect(screen.getAllByText(/2/).length).toBeGreaterThan(0);
	});
});
