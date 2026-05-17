import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Note from "@/models/Note";
import AiUsage from "@/models/AiUsage";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!);

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(_req: Request, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    await connectDB();

    // Fetch note and verify ownership
    const note = await Note.findOne({ _id: id, userId: session.user.id });
    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    const content = `${note.title}\n\n${note.content}`.trim();
    if (content.length < 50) {
      return NextResponse.json(
        { error: "Note content is too short for AI analysis (minimum 50 characters)" },
        { status: 422 }
      );
    }

    // Call Google Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const prompt = `Analyze this note and respond ONLY with valid JSON 
          (no markdown fences, no explanation, no extra text) 
          in this exact format:
          {
            "summary": "2-3 sentence summary of the note",
            "action_items": ["item 1", "item 2", "item 3"],
            "suggested_title": "A concise title for this note"
          }
          
          Note content:
          ${content}`;
          
    const result = await model.generateContent(prompt);
    const rawText = result.response.text();

    // Safe JSON parse with fallback
    let parsed;
    try {
      const cleaned = rawText.replace(/```json|```/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch (err) {
      console.error("[generate-summary] Gemini JSON parse error:", err, rawText);
      return NextResponse.json(
        { error: "AI returned invalid response. Please try again." },
        { status: 500 }
      );
    }

    // Save AI output back to the note
    note.summary = parsed.summary || "";
    note.actionItems = Array.isArray(parsed.action_items) ? parsed.action_items : [];
    note.suggestedTitle = parsed.suggested_title || "";
    await note.save();

    // Log AI usage
    await AiUsage.create({
      userId: session.user.id,
      noteId: id,
      feature: "summary",
    });

    return NextResponse.json({
      summary: note.summary,
      actionItems: note.actionItems,
      suggestedTitle: note.suggestedTitle,
    });
  } catch (error) {
    console.error("[POST /api/notes/[id]/generate-summary]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
