import type { QuestionType } from "@/lib/types";

export interface ImportedAssessmentQuestion {
  type: QuestionType;
  prompt: string;
  marks: number;
  imageUrl: string;
  options: Array<{ key: string; text: string }>;
  correctAnswer: string | string[];
  explanation: string;
}

const typeAliases: Record<string, QuestionType> = {
  mcq: "single_choice",
  single: "single_choice",
  single_choice: "single_choice",
  multiple: "multiple_choice",
  multiple_choice: "multiple_choice",
  true_false: "true_false",
  truefalse: "true_false",
  short: "short_answer",
  short_answer: "short_answer",
  structured: "structured",
};

function parseRows(csv: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < csv.length; index += 1) {
    const character = csv[index];
    if (quoted) {
      if (character === '"' && csv[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        field += character;
      }
      continue;
    }
    if (character === '"') {
      quoted = true;
    } else if (character === ",") {
      row.push(field);
      field = "";
    } else if (character === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (character !== "\r") {
      field += character;
    }
  }

  if (quoted) throw new Error("The CSV contains an unclosed quoted value.");
  row.push(field);
  if (row.some((value) => value.trim())) rows.push(row);
  return rows;
}

function normalizedHeader(value: string) {
  return value.replace(/^\uFEFF/, "").trim().toLowerCase().replace(/[\s-]+/g, "_");
}

function normalizedType(value: string) {
  return normalizedHeader(value);
}

export function parseAssessmentQuestionsCsv(csv: string): ImportedAssessmentQuestion[] {
  const rows = parseRows(csv);
  if (rows.length < 2) throw new Error("The CSV must contain a header and at least one question.");

  const headers = rows[0].map(normalizedHeader);
  const headerIndex = new Map(headers.map((header, index) => [header, index]));
  const value = (row: string[], ...names: string[]) => {
    const index = names.map((name) => headerIndex.get(name)).find((item) => item !== undefined);
    return index === undefined ? "" : String(row[index] ?? "").trim();
  };

  if (!headerIndex.has("type")) throw new Error('The CSV needs a "type" column.');
  if (!headerIndex.has("prompt") && !headerIndex.has("question")) throw new Error('The CSV needs a "prompt" column.');
  if (!headerIndex.has("marks")) throw new Error('The CSV needs a "marks" column.');
  if (!headerIndex.has("correct_answer") && !headerIndex.has("answer")) throw new Error('The CSV needs a "correct_answer" column.');

  const questions: ImportedAssessmentQuestion[] = [];
  rows.slice(1).forEach((row, rowIndex) => {
    if (!row.some((cell) => cell.trim())) return;
    const line = rowIndex + 2;
    const rawType = normalizedType(value(row, "type"));
    const type = typeAliases[rawType];
    if (!type) throw new Error(`Row ${line}: unsupported question type "${rawType || "blank"}".`);

    const prompt = value(row, "prompt", "question");
    if (!prompt) throw new Error(`Row ${line}: add the question prompt.`);
    const marks = Number(value(row, "marks"));
    if (!Number.isFinite(marks) || marks <= 0) throw new Error(`Row ${line}: marks must be greater than zero.`);

    const imageUrl = value(row, "image_url", "image");
    if (imageUrl) {
      try {
        const parsed = new URL(imageUrl);
        if (!["https:", "http:"].includes(parsed.protocol)) throw new Error();
      } catch {
        throw new Error(`Row ${line}: image_url must be a valid web address.`);
      }
    }

    const rawAnswer = value(row, "correct_answer", "answer");
    let options: Array<{ key: string; text: string }> = [];
    let correctAnswer: string | string[] = rawAnswer;

    if (type === "true_false") {
      options = [{ key: "True", text: "True" }, { key: "False", text: "False" }];
      const answer = rawAnswer.toLowerCase();
      if (!["true", "false"].includes(answer)) throw new Error(`Row ${line}: correct_answer must be True or False.`);
      correctAnswer = answer === "true" ? "True" : "False";
    } else if (type === "single_choice" || type === "multiple_choice") {
      options = ["A", "B", "C", "D", "E", "F"]
        .map((key) => ({ key, text: value(row, `option_${key.toLowerCase()}`) }))
        .filter((option) => option.text);
      if (options.length < 2) throw new Error(`Row ${line}: add at least two answer options.`);
      const availableKeys = new Set(options.map((option) => option.key));
      const answers = rawAnswer.split(/[|;]/).map((answer) => answer.trim().toUpperCase()).filter(Boolean);
      if (!answers.length || answers.some((answer) => !availableKeys.has(answer))) {
        throw new Error(`Row ${line}: correct_answer must use an available option letter.`);
      }
      if (type === "single_choice" && answers.length !== 1) {
        throw new Error(`Row ${line}: a single-answer MCQ needs exactly one correct answer.`);
      }
      correctAnswer = type === "multiple_choice" ? answers : answers[0];
    } else if (type === "short_answer" && !rawAnswer) {
      throw new Error(`Row ${line}: add the expected short answer.`);
    }

    questions.push({
      type,
      prompt,
      marks,
      imageUrl,
      options,
      correctAnswer,
      explanation: value(row, "explanation", "marking_guidance"),
    });
  });

  if (!questions.length) throw new Error("The CSV does not contain any question rows.");
  return questions;
}
