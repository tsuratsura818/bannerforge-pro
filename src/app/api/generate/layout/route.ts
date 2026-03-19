import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { GoogleGenAI } from "@google/genai";

export const maxDuration = 30;

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

interface ProductInput {
  index: number;
  base64: string;
  mimeType: string;
}

interface LayoutResult {
  index: number;
  xPct: number;
  yPct: number;
  wPct: number;
  hPct: number;
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { backgroundUrl, products } = await request.json() as {
      backgroundUrl: string;
      products: ProductInput[];
    };

    if (!backgroundUrl || !products?.length) {
      return NextResponse.json({ error: "backgroundUrl と products が必要です" }, { status: 400 });
    }

    // 背景画像を取得して base64 に変換
    const bgRes = await fetch(backgroundUrl);
    if (!bgRes.ok) throw new Error("背景画像の取得に失敗しました");
    const bgBuffer = Buffer.from(await bgRes.arrayBuffer());
    const bgBase64 = bgBuffer.toString("base64");

    // Gemini に配置を提案させる
    const prompt = `You are a professional graphic designer creating an advertisement banner.
The first image is the background banner.
The next ${products.length} image(s) are product photos that must be placed on the banner.

Analyze the background composition (colors, layout, empty space, focal points) and suggest the optimal placement for each product to create a professional, visually balanced advertisement.

Rules:
- Each product should be clearly visible and not cropped
- Products should not overlap significantly
- Use empty or negative space in the background for placement
- Scale products proportionally (typically 25-45% of canvas width)
- Create a natural, aesthetically pleasing composition

Reply ONLY with a valid JSON array, nothing else:
[{"index": 0, "xPct": 50, "yPct": 50, "wPct": 35, "hPct": 35}]
- xPct/yPct: center position percentage (0-100)
- wPct/hPct: size as percentage of canvas dimensions`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [{
        role: "user",
        parts: [
          { inlineData: { data: bgBase64, mimeType: "image/jpeg" } },
          ...products.map(p => ({
            inlineData: { data: p.base64, mimeType: p.mimeType }
          })),
          { text: prompt },
        ],
      }],
    });

    const rawText = response.candidates?.[0]?.content?.parts?.[0]?.text ?? "[]";

    // JSON を抽出（```json ... ``` のコードブロックにも対応）
    const jsonMatch = rawText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error("AIからのレイアウト応答が不正です");
    }

    const layout: LayoutResult[] = JSON.parse(jsonMatch[0]);

    return NextResponse.json({ layout });
  } catch (error) {
    console.error("Layout generation error:", error);
    const msg = error instanceof Error ? error.message : "レイアウト生成に失敗しました";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
