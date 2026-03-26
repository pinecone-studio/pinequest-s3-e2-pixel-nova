jest.mock("@/lib/examGuard", () => ({
	calculateXP: jest.fn((p: number) =>
		p >= 90 ? 100 : p >= 80 ? 80 : p >= 70 ? 60 : p >= 60 ? 40 : p >= 50 ? 20 : 10,
	),
	generateId: jest.fn(() => "mock-id-123"),
	getJSON: jest.fn(() => []),
	getJSONForRole: jest.fn(() => []),
	getLevel: jest.fn(() => ({ level: 1, name: "Анхдагч", minXP: 0, icon: "🌱" })),
	setJSON: jest.fn(() => true),
	setJSONForRole: jest.fn(() => true),
}));

jest.mock("@/lib/role-session", () => ({
	getTeacherRoles: jest.fn(() => ["teacher"]),
}));

import {
	buildAnswerReport,
	calculateSubmissionMetrics,
} from "@/app/student/hooks/student-exam-helpers";
import type { Exam, Question } from "@/app/student/types";

const makeQuestion = (overrides: Partial<Question> = {}): Question => ({
	id: "q1",
	text: "Sample question",
	type: "text",
	correctAnswer: "correct",
	points: 10,
	...overrides,
});

const makeExam = (questions: Question[], overrides: Partial<Exam> = {}): Exam => ({
	id: "exam-1",
	title: "Test Exam",
	scheduledAt: null,
	roomCode: "ROOM1",
	questions,
	createdAt: new Date().toISOString(),
	...overrides,
});

describe("buildAnswerReport", () => {
	it("should mark a correct MCQ answer as correct", () => {
		const question = makeQuestion({
			id: "q1",
			type: "mcq",
			options: ["Alpha", "Beta", "Gamma"],
			correctAnswer: "Beta",
		});
		const exam = makeExam([question]);
		const answers: Record<string, string> = { q1: "Beta" };

		const report = buildAnswerReport(exam, answers);

		expect(report).toHaveLength(1);
		expect(report[0].correct).toBe(true);
		expect(report[0].answer).toBe("Beta");
		expect(report[0].question).toBe(question);
	});

	it("should mark an incorrect MCQ answer as incorrect", () => {
		const question = makeQuestion({
			id: "q1",
			type: "mcq",
			options: ["Alpha", "Beta", "Gamma"],
			correctAnswer: "Beta",
		});
		const exam = makeExam([question]);
		const answers: Record<string, string> = { q1: "Gamma" };

		const report = buildAnswerReport(exam, answers);

		expect(report).toHaveLength(1);
		expect(report[0].correct).toBe(false);
		expect(report[0].answer).toBe("Gamma");
	});

	it("should compare answers case-insensitively", () => {
		const question = makeQuestion({
			id: "q1",
			type: "text",
			correctAnswer: "Hello World",
		});
		const exam = makeExam([question]);
		const answers: Record<string, string> = { q1: "hello world" };

		const report = buildAnswerReport(exam, answers);

		expect(report).toHaveLength(1);
		expect(report[0].correct).toBe(true);
	});

	it("should handle MCQ answers case-insensitively via options matching", () => {
		const question = makeQuestion({
			id: "q1",
			type: "mcq",
			options: ["Alpha", "Beta", "Gamma"],
			correctAnswer: "beta",
		});
		const exam = makeExam([question]);
		const answers: Record<string, string> = { q1: "BETA" };

		const report = buildAnswerReport(exam, answers);

		expect(report).toHaveLength(1);
		expect(report[0].correct).toBe(true);
	});

	it("should treat missing answers as empty string and mark incorrect", () => {
		const question = makeQuestion({
			id: "q1",
			type: "text",
			correctAnswer: "answer",
		});
		const exam = makeExam([question]);
		const answers: Record<string, string> = {};

		const report = buildAnswerReport(exam, answers);

		expect(report).toHaveLength(1);
		expect(report[0].answer).toBe("");
		expect(report[0].correct).toBe(false);
	});

	it("should handle multiple questions with mixed correct and incorrect answers", () => {
		const q1 = makeQuestion({
			id: "q1",
			type: "text",
			correctAnswer: "apple",
			points: 5,
		});
		const q2 = makeQuestion({
			id: "q2",
			type: "mcq",
			options: ["A", "B", "C"],
			correctAnswer: "B",
			points: 10,
		});
		const q3 = makeQuestion({
			id: "q3",
			type: "open",
			correctAnswer: "essay answer",
			points: 15,
		});
		const exam = makeExam([q1, q2, q3]);
		const answers: Record<string, string> = {
			q1: "apple",
			q2: "C",
			q3: "wrong answer",
		};

		const report = buildAnswerReport(exam, answers);

		expect(report).toHaveLength(3);
		expect(report[0].correct).toBe(true);
		expect(report[1].correct).toBe(false);
		expect(report[2].correct).toBe(false);
	});

	it("should trim whitespace from both student and correct answers", () => {
		const question = makeQuestion({
			id: "q1",
			type: "text",
			correctAnswer: "  trimmed  ",
		});
		const exam = makeExam([question]);
		const answers: Record<string, string> = { q1: "  trimmed  " };

		const report = buildAnswerReport(exam, answers);

		expect(report[0].correct).toBe(true);
		expect(report[0].answer).toBe("trimmed");
	});
});

describe("calculateSubmissionMetrics", () => {
	it("should return 100% and grade A when all answers are correct", () => {
		const q1 = makeQuestion({ id: "q1", points: 10 });
		const q2 = makeQuestion({ id: "q2", points: 10 });
		const exam = makeExam([q1, q2]);
		const report = [
			{ question: q1, correct: true },
			{ question: q2, correct: true },
		];

		const result = calculateSubmissionMetrics(exam, report, false);

		expect(result.score).toBe(20);
		expect(result.totalPoints).toBe(20);
		expect(result.percentage).toBe(100);
		expect(result.grade).toBe("A");
	});

	it("should return grade C for 75%", () => {
		const q1 = makeQuestion({ id: "q1", points: 25 });
		const q2 = makeQuestion({ id: "q2", points: 25 });
		const q3 = makeQuestion({ id: "q3", points: 25 });
		const q4 = makeQuestion({ id: "q4", points: 25 });
		const exam = makeExam([q1, q2, q3, q4]);
		const report = [
			{ question: q1, correct: true },
			{ question: q2, correct: true },
			{ question: q3, correct: true },
			{ question: q4, correct: false },
		];

		const result = calculateSubmissionMetrics(exam, report, false);

		expect(result.score).toBe(75);
		expect(result.totalPoints).toBe(100);
		expect(result.percentage).toBe(75);
		expect(result.grade).toBe("C");
	});

	it("should return score=0, percentage=0 when terminated is true", () => {
		const q1 = makeQuestion({ id: "q1", points: 10 });
		const q2 = makeQuestion({ id: "q2", points: 10 });
		const exam = makeExam([q1, q2]);
		const report = [
			{ question: q1, correct: true },
			{ question: q2, correct: true },
		];

		const result = calculateSubmissionMetrics(exam, report, true);

		expect(result.score).toBe(0);
		expect(result.percentage).toBe(0);
		expect(result.totalPoints).toBe(20);
		expect(result.grade).toBe("F");
	});

	describe("grade boundaries", () => {
		const buildExamAndReport = (correctPoints: number, totalPoints: number) => {
			const questions: Question[] = [];
			const report: { question: Question; correct: boolean }[] = [];

			for (let i = 0; i < totalPoints; i++) {
				const q = makeQuestion({ id: `q${i}`, points: 1 });
				questions.push(q);
				report.push({ question: q, correct: i < correctPoints });
			}

			return { exam: makeExam(questions), report };
		};

		it("should return grade A for exactly 90%", () => {
			const { exam, report } = buildExamAndReport(90, 100);
			const result = calculateSubmissionMetrics(exam, report, false);

			expect(result.percentage).toBe(90);
			expect(result.grade).toBe("A");
		});

		it("should return grade B for exactly 80%", () => {
			const { exam, report } = buildExamAndReport(80, 100);
			const result = calculateSubmissionMetrics(exam, report, false);

			expect(result.percentage).toBe(80);
			expect(result.grade).toBe("B");
		});

		it("should return grade C for exactly 70%", () => {
			const { exam, report } = buildExamAndReport(70, 100);
			const result = calculateSubmissionMetrics(exam, report, false);

			expect(result.percentage).toBe(70);
			expect(result.grade).toBe("C");
		});

		it("should return grade D for exactly 60%", () => {
			const { exam, report } = buildExamAndReport(60, 100);
			const result = calculateSubmissionMetrics(exam, report, false);

			expect(result.percentage).toBe(60);
			expect(result.grade).toBe("D");
		});

		it("should return grade F for 59%", () => {
			const { exam, report } = buildExamAndReport(59, 100);
			const result = calculateSubmissionMetrics(exam, report, false);

			expect(result.percentage).toBe(59);
			expect(result.grade).toBe("F");
		});

		it("should return grade B for 89% (just below A threshold)", () => {
			const { exam, report } = buildExamAndReport(89, 100);
			const result = calculateSubmissionMetrics(exam, report, false);

			expect(result.percentage).toBe(89);
			expect(result.grade).toBe("B");
		});
	});

	it("should return grade F and 0% for an exam with all incorrect answers", () => {
		const q1 = makeQuestion({ id: "q1", points: 10 });
		const q2 = makeQuestion({ id: "q2", points: 10 });
		const exam = makeExam([q1, q2]);
		const report = [
			{ question: q1, correct: false },
			{ question: q2, correct: false },
		];

		const result = calculateSubmissionMetrics(exam, report, false);

		expect(result.score).toBe(0);
		expect(result.totalPoints).toBe(20);
		expect(result.percentage).toBe(0);
		expect(result.grade).toBe("F");
	});

	it("should handle questions with different point values", () => {
		const q1 = makeQuestion({ id: "q1", points: 5 });
		const q2 = makeQuestion({ id: "q2", points: 15 });
		const exam = makeExam([q1, q2]);
		const report = [
			{ question: q1, correct: true },
			{ question: q2, correct: false },
		];

		const result = calculateSubmissionMetrics(exam, report, false);

		expect(result.score).toBe(5);
		expect(result.totalPoints).toBe(20);
		expect(result.percentage).toBe(25);
		expect(result.grade).toBe("F");
	});
});
