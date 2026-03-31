import { render, screen, fireEvent } from "@testing-library/react";
import StudentResultView from "@/app/student/components/StudentResultView";
import type { Submission } from "@/app/student/types";

const defaultResultProps = {
	resultPending: false,
	resultCountdown: "00:00",
	resultReleaseAt: null,
};

const mockSubmission: Submission = {
	id: "sub-1",
	examId: "e1",
	studentId: "s1",
	studentНэр: "Бат",
	answers: [
		{ questionId: "q1", selectedAnswer: "A", correct: true },
		{ questionId: "q2", selectedAnswer: "C", correct: false },
	],
	score: 85,
	totalPoints: 100,
	percentage: 85,
	submittedAt: "2024-06-01T10:00:00Z",
};

const mockAnswerReport = [
	{
		question: { id: "q1", text: "Нэг дээр нэг нэмэхэд?", correctAnswer: "2" },
		answer: "2",
		correct: true,
	},
	{
		question: { id: "q2", text: "Хоёроос нэгийг хасахад?", correctAnswer: "1" },
		answer: "3",
		correct: false,
	},
];

describe("StudentResultView", () => {
	it("shows loading message when lastSubmission is null", () => {
		const onBack = jest.fn();
		render(
			<StudentResultView
				lastSubmission={null}
				answerReport={[]}
				{...defaultResultProps}
				onBack={onBack}
			/>,
		);

		expect(screen.getByText("Дүн боловсруулж байна...")).toBeInTheDocument();
	});

	it("shows back button when no submission and calls onBack", () => {
		const onBack = jest.fn();
		render(
			<StudentResultView
				lastSubmission={null}
				answerReport={[]}
				{...defaultResultProps}
				onBack={onBack}
			/>,
		);

		fireEvent.click(screen.getByText("Самбар руу буцах"));
		expect(onBack).toHaveBeenCalledTimes(1);
	});

	it("renders result summary with percentage and score", () => {
		render(
			<StudentResultView
				lastSubmission={mockSubmission}
				answerReport={mockAnswerReport}
				{...defaultResultProps}
				onBack={jest.fn()}
			/>,
		);

		expect(screen.getByText("Дүнгийн хураангуй")).toBeInTheDocument();
		expect(screen.getByText("85%")).toBeInTheDocument();
		expect(screen.getByText("85/100")).toBeInTheDocument();
	});

	it("renders answer report with correct/incorrect labels", () => {
		render(
			<StudentResultView
				lastSubmission={mockSubmission}
				answerReport={mockAnswerReport}
				{...defaultResultProps}
				onBack={jest.fn()}
			/>,
		);

		expect(screen.getByText(/Нэг дээр нэг нэмэхэд/)).toBeInTheDocument();
		expect(screen.getByText(/Хоёроос нэгийг хасахад/)).toBeInTheDocument();
		expect(screen.getAllByText("Зөв").length).toBeGreaterThan(0);
		expect(screen.getAllByText("Буруу").length).toBeGreaterThan(0);
	});

	it("shows correct answer for incorrect questions", () => {
		render(
			<StudentResultView
				lastSubmission={mockSubmission}
				answerReport={mockAnswerReport}
				{...defaultResultProps}
				onBack={jest.fn()}
			/>,
		);

		expect(screen.getByText(/Зөв хариулт: 1/)).toBeInTheDocument();
	});

	it("does not show correct answer for correct questions", () => {
		render(
			<StudentResultView
				lastSubmission={mockSubmission}
				answerReport={mockAnswerReport}
				{...defaultResultProps}
				onBack={jest.fn()}
			/>,
		);

		// Only one "Зөв хариулт:" should appear (for the incorrect one)
		const hints = screen.getAllByText(/Зөв хариулт:/);
		expect(hints).toHaveLength(1);
	});

	it("calls onBack when button clicked on result view", () => {
		const onBack = jest.fn();
		render(
			<StudentResultView
				lastSubmission={mockSubmission}
				answerReport={mockAnswerReport}
				{...defaultResultProps}
				onBack={onBack}
			/>,
		);

		fireEvent.click(screen.getByText("Самбар руу буцах"));
		expect(onBack).toHaveBeenCalledTimes(1);
	});

	it("renders with empty answer report", () => {
		render(
			<StudentResultView
				lastSubmission={mockSubmission}
				answerReport={[]}
				{...defaultResultProps}
				onBack={jest.fn()}
			/>,
		);

		expect(screen.getByText("Дүнгийн хураангуй")).toBeInTheDocument();
		expect(screen.getByText("Асуултын тайлан")).toBeInTheDocument();
	});
});
