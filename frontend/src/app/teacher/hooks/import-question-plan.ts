import type { Question } from "../types";

export type ImportQuestionPlan = {
  mcqCount: number;
  textCount?: number;
  openCount: number;
  shuffleQuestions: boolean;
};

const clampCount = (value: number) =>
  Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;

const shuffleList = <T,>(items: T[]) => {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[randomIndex]] = [next[randomIndex], next[index]];
  }
  return next;
};

const toQuestionType = (question: Question, type: Question["type"]): Question => {
  if (type === "mcq") {
    return {
      ...question,
      type: "mcq",
      options:
        question.type === "mcq" && question.options && question.options.length >= 2
          ? question.options.slice(0, 6)
          : ["Сонголт A", "Сонголт B", "Сонголт C", "Сонголт D"],
      correctAnswer: question.correctAnswer?.trim() || "",
    };
  }

  return {
    ...question,
    type,
    options: undefined,
    correctAnswer: question.correctAnswer?.trim() || "",
  };
};

const buildRoundRobin = (groups: Question[][]) => {
  const queues = groups.map((group) => [...group]);
  const result: Question[] = [];
  let added = true;

  while (added) {
    added = false;
    for (const queue of queues) {
      const next = queue.shift();
      if (!next) continue;
      result.push(next);
      added = true;
    }
  }

  return result;
};

export const getImportQuestionPlanTotal = (plan: ImportQuestionPlan) =>
  clampCount(plan.mcqCount) + clampCount(plan.textCount ?? 0) + clampCount(plan.openCount);

export const applyImportQuestionPlan = (
  sourceQuestions: Question[],
  plan: ImportQuestionPlan,
) => {
  const desiredMcq = clampCount(plan.mcqCount);
  const desiredText = clampCount(plan.textCount ?? 0);
  const desiredOpen = clampCount(plan.openCount);

  const totalRequested = desiredMcq + desiredText + desiredOpen;
  if (totalRequested === 0) {
    return {
      questions: sourceQuestions,
      requestedTotal: 0,
      producedTotal: sourceQuestions.length,
    };
  }

  const available = [...sourceQuestions];
  const consume = (predicate: (question: Question) => boolean, count: number) => {
    const taken: Question[] = [];
    for (let index = 0; index < available.length && taken.length < count; ) {
      if (!predicate(available[index])) {
        index += 1;
        continue;
      }
      taken.push(available.splice(index, 1)[0]);
    }
    return taken;
  };

  const mcqBase = consume(
    (question) => question.type === "mcq" && (question.options?.length ?? 0) >= 2,
    desiredMcq,
  ).map((question) => toQuestionType(question, "mcq"));

  const textBase = consume(() => true, desiredText).map((question) =>
    toQuestionType(question, "text"),
  );

  const openBase = consume(() => true, desiredOpen).map((question) =>
    toQuestionType(question, "open"),
  );

  const groups = plan.shuffleQuestions
    ? [shuffleList(mcqBase), shuffleList(textBase), shuffleList(openBase)]
    : [mcqBase, textBase, openBase];

  const questions = plan.shuffleQuestions
    ? buildRoundRobin(groups)
    : [...mcqBase, ...textBase, ...openBase];

  return {
    questions,
    requestedTotal: totalRequested,
    producedTotal: questions.length,
  };
};
