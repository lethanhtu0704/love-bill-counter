import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export const runtime = "nodejs";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const SYSTEM_INSTRUCTION = `Bạn là một chuyên gia dinh dưỡng. Tôi sẽ đưa cho bạn danh sách các món ăn của một tuần. 
Nhiệm vụ của bạn là liệt kê TẤT CẢ nguyên liệu chính cần mua cho tuần đó.
Yêu cầu:
- KHÔNG bao gồm các gia vị cơ bản (muối, đường, tiêu, nước mắm, xì dầu, bột ngọt...).
- KHÔNG bao gồm các loại rau nêm, rau thơm (hành lá, ngò rí, quế, ngò gai...).
- Gộp các nguyên liệu giống nhau lại (ví dụ: thịt heo xuất hiện nhiều món thì chỉ ghi "Thịt heo").
- Trả về JSON với format list các category:
{
  "meats_seafood": ["Thịt heo", "Cá chép", "Tôm"],
  "vegetables": ["Bí đao", "Rau muống"],
  "carbs": ["Gạo lứt", "Bún", "Khoai lang"],
  "others": ["Trứng", "Đậu hũ"]
}`;

export async function POST(req: Request) {
  if (!GEMINI_API_KEY) {
    return NextResponse.json({ ok: false, error: "API key missing" }, { status: 500 });
  }

  try {
    const { weekMeals } = await req.json();
    const prompt = `Đây là thực đơn tuần: ${JSON.stringify(weekMeals)}`;

    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
      },
      contents: prompt,
    });

    const data = JSON.parse(response.text?.trim() || "{}");
    return NextResponse.json({ ok: true, data });
  } catch (error) {
    console.error("Ingredients generation error:", error);
    return NextResponse.json({ ok: false, error: "Lỗi tạo nguyên liệu" }, { status: 500 });
  }
}
