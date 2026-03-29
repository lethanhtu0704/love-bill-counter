import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export const runtime = "nodejs";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const SYSTEM_INSTRUCTION = `Bạn là một nhà dinh dưỡng học chuyên nghiệp. Nhiệm vụ của bạn là thiết kế thực đơn cho 7 ngày trong tuần (Thứ Hai đến Chủ Nhật).

Quy tắc:
- Mỗi ngày gồm 3 bữa: breakfast, lunch, dinner.
- Mỗi bữa có tối đa 3 món ăn, mỗi món là một chuỗi ngắn gọn (ví dụ: "Cơm gạo lứt", "Canh bí đao").
- Trả về duy nhất một JSON object hợp lệ, KHÔNG kèm markdown, KHÔNG giải thích thêm.
- JSON phải có đúng 7 key là các ngày trong tuần theo thứ tự: "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday".
- Mỗi ngày là một object có 3 key: "breakfast", "lunch", "dinner", mỗi key là một mảng string.

Output format (strict JSON):
{
  "monday": { "breakfast": ["món 1", "món 2"], "lunch": ["món 1", "món 2", "món 3"], "dinner": ["món 1"] },
  "tuesday": { "breakfast": ["..."], "lunch": ["..."], "dinner": ["..."] },
  "wednesday": { "breakfast": ["..."], "lunch": ["..."], "dinner": ["..."] },
  "thursday": { "breakfast": ["..."], "lunch": ["..."], "dinner": ["..."] },
  "friday": { "breakfast": ["..."], "lunch": ["..."], "dinner": ["..."] },
  "saturday": { "breakfast": ["..."], "lunch": ["..."], "dinner": ["..."] },
  "sunday": { "breakfast": ["..."], "lunch": ["..."], "dinner": ["..."] }
}`;

const DAY_ORDER = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;

type DayMeals = { breakfast: string[]; lunch: string[]; dinner: string[] };
type GeneratedWeek = Record<string, DayMeals>;

function validateMealArray(arr: unknown): string[] {
  if (!Array.isArray(arr)) return [];
  return arr
    .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    .map((s) => s.trim())
    .slice(0, 3);
}

function validateGeneratedWeek(data: unknown): GeneratedWeek | null {
  if (typeof data !== "object" || data === null) return null;

  const record = data as Record<string, unknown>;
  const result: GeneratedWeek = {};

  for (const day of DAY_ORDER) {
    const dayData = record[day];
    if (typeof dayData !== "object" || dayData === null) return null;

    const d = dayData as Record<string, unknown>;
    const breakfast = validateMealArray(d.breakfast);
    const lunch = validateMealArray(d.lunch);
    const dinner = validateMealArray(d.dinner);

    if (breakfast.length === 0 && lunch.length === 0 && dinner.length === 0) return null;

    result[day] = { breakfast, lunch, dinner };
  }

  return result;
}

export async function POST(req: Request) {
  if (!GEMINI_API_KEY) {
    return NextResponse.json({ ok: false, error: "Gemini API key not configured" }, { status: 500 });
  }

  let prompt: string;
  try {
    const body = (await req.json()) as { prompt?: string };
    prompt = body.prompt?.trim() || "";
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  if (!prompt || prompt.length > 2000) {
    return NextResponse.json(
      { ok: false, error: "Prompt is required and must be under 2000 characters" },
      { status: 400 }
    );
  }

  try {
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
      },
      contents: prompt,
    });

    const text = response.text?.trim();
    if (!text) {
      return NextResponse.json({ ok: false, error: "Empty response from AI" }, { status: 502 });
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      return NextResponse.json({ ok: false, error: "AI returned invalid JSON" }, { status: 502 });
    }

    const validated = validateGeneratedWeek(parsed);
    if (!validated) {
      return NextResponse.json(
        { ok: false, error: "AI response did not match expected meal format" },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true, data: validated });
  } catch (error: unknown) {
    console.error("Gemini API error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
