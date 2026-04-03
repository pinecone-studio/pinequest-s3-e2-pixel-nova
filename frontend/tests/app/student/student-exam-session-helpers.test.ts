import {
	EVENT_TYPE_MAP,
	EMPTY_VIOLATIONS,
	mapResultToReport,
	mapSessionToExam,
} from "@/app/student/hooks/student-exam-session-helpers";

describe("student exam session helpers", () => {
	it("normalizes empty violations", () => {
		expect(EMPTY_VIOLATIONS.tabSwitch).toBe(0);
		expect(EMPTY_VIOLATIONS.log).toEqual([]);
	});

	it("maps session payload to exam shape", () => {
		const session = {
			exam: {
				id: "exam-1",
				title: "Demo Exam",
				description: null,
				durationMin: 45,
			},
			questions: [
				{
					id: "q-1",
					type: "mcq",
					questionText: "Q1?",
					points: 2,
					options: [
						{ id: "o1", label: "A", text: "Answer A" },
						{ id: "o2", label: "B", text: "Answer B" },
					],
				},
			],
		};

		const exam = mapSessionToExam(session, " ab12 ");
		expect(exam.roomCode).toBe("AB12");
		expect(exam.questions[0].text).toBe("Q1?");
		expect(exam.questions[0].options).toEqual(["Answer A", "Answer B"]);
		expect(exam.duration).toBe(45);
	});

	it("maps backend question types to student exam question types", () => {
		const session = {
			exam: {
				id: "exam-1",
				title: "Demo Exam",
				description: null,
				durationMin: 45,
			},
			questions: [
				{
					id: "q-1",
					type: "multiple_choice",
					questionText: "Choose one",
					points: 1,
					options: [
						{ id: "o1", label: "A", text: "One" },
						{ id: "o2", label: "B", text: "Two" },
					],
				},
				{
					id: "q-2",
					type: "short_answer",
					questionText: "Write the answer",
					points: 1,
				},
				{
					id: "q-3",
					type: "true_false",
					questionText: "True or false?",
					points: 1,
					options: [
						{ id: "o3", label: "A", text: "True" },
						{ id: "o4", label: "B", text: "False" },
					],
				},
			],
		};

		const exam = mapSessionToExam(session, "ab12");

		expect(exam.questions[0].type).toBe("mcq");
		expect(exam.questions[1].type).toBe("open");
		expect(exam.questions[2].type).toBe("mcq");
	});

	it("maps result payload to report entries", () => {
		const result = {
			score: 3,
			totalPoints: 5,
			answers: [
				{
					questionText: "Q1",
					selectedAnswer: "A",
					correctAnswer: "A",
					isCorrect: true,
					points: 1,
					pointsEarned: 1,
				},
			],
		};
		const report = mapResultToReport(result);
		expect(report[0].question.text).toBe("Q1");
		expect(report[0].answer).toBe("A");
		expect(report[0].correct).toBe(true);
	});

	it("contains known event mappings", () => {
		expect(EVENT_TYPE_MAP.TAB_SWITCH).toBe("tab_switch");
		expect(EVENT_TYPE_MAP.KEYBOARD_SHORTCUT).toBe("devtools_open");
	});
});
