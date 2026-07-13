import { NextResponse } from "next/server";
import { requireApiAdmin } from "@/lib/server/api-auth";

function parseCsvLine(line: string) {
  const cells: string[] = [];
  let current = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"') {
      if (quoted && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === "," && !quoted) {
      cells.push(current.trim());
      current = "";
    } else {
      current += character;
    }
  }
  if (quoted) throw new Error("A CSV row contains an unclosed quotation mark.");
  cells.push(current.trim());
  return cells;
}

function parseCsv(text: string) {
  if (text.length > 1_000_000) throw new Error("CSV import must be smaller than 1 MB.");
  const lines = text.replace(/^\uFEFF/, "").trim().split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) throw new Error("CSV needs a header and at least one result row.");
  if (lines.length > 1001) throw new Error("Import no more than 1,000 result rows at a time.");
  const headers = parseCsvLine(lines[0]).map((item) => item.toLowerCase());
  const required = ["student_phone", "obtained_marks", "total_marks"];
  for (const key of required) if (!headers.includes(key)) throw new Error(`Missing CSV column: ${key}`);

  return lines.slice(1).map((line, rowIndex) => {
    const cells = parseCsvLine(line);
    const record = Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? ""]));
    const obtained = Number(record.obtained_marks);
    const total = Number(record.total_marks);
    if (!record.student_phone) throw new Error(`Row ${rowIndex + 2}: student_phone is required.`);
    if (!Number.isFinite(obtained) || !Number.isFinite(total) || total <= 0 || obtained < 0 || obtained > total) {
      throw new Error(`Row ${rowIndex + 2}: enter valid obtained_marks and total_marks.`);
    }
    return record;
  });
}

export async function POST(request: Request) {
  const auth = await requireApiAdmin();
  if ("error" in auth) return auth.error;
  try {
    const body = await request.json();
    const rows = parseCsv(String(body.csv || ""));
    const { data, error } = await auth.supabase.rpc("import_offline_results", {
      p_assessment_id: String(body.assessmentId),
      p_rows: rows,
    });
    if (error) throw error;
    return NextResponse.json({ imported: data });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not import results." }, { status: 400 });
  }
}
