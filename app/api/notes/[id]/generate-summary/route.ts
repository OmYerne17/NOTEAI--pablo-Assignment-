import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Note from "@/models/Note";
import AiUsage from "@/models/AiUsage";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || "");

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

    const contentToAnalyze = `${note.title}\n\n${note.content}`.trim();
    if (contentToAnalyze.length < 50) {
      return NextResponse.json(
        { error: "Note content is too short for AI analysis (minimum 50 characters)" },
        { status: 422 }
      );
    }

    // Call Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
    const prompt = `Analyze this note and respond ONLY with valid JSON (no markdown, no explanation, no code fences) in this exact format: {"summary": "...", "action_items": [...], "suggested_title": "..."}\n\nNote content:\n${contentToAnalyze}`;
    
    const result = await model.generateContent(prompt);
    const rawText = result.response.text();

    // Safely parse JSON — strip any accidental markdown fences
    const cleaned = rawText.replace(/```json\n?/gi, "").replace(/```\n?/gi, "").trim();
    let parsed: { summary: string; action_items: string[]; suggested_title: string };
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("[generate-summary] Failed to parse AI JSON:", cleaned);
      return NextResponse.json({ error: "AI returned malformed response. Please try again." }, { status: 502 });
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
