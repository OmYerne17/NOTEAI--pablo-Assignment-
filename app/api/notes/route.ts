import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Note from "@/models/Note";

// GET /api/notes — return all non-archived notes for the logged-in user
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const includeArchived = searchParams.get("archived") === "true";

    const query: Record<string, unknown> = { userId: session.user.id };
    if (!includeArchived) {
      query.isArchived = false;
    }

    const notes = await Note.find(query)
      .sort({ updatedAt: -1 })
      .select("title content tags category isArchived createdAt updatedAt")
      .lean();

    return NextResponse.json({ notes });
  } catch (error) {
    console.error("[GET /api/notes]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/notes — create a new note with default title
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const body = await req.json().catch(() => ({}));

    const note = await Note.create({
      title: body.title || "Untitled Note",
      content: body.content ?? "",
      tags: body.tags || [],
      category: body.category || "Personal",
      isArchived: false,
      isPublic: false,
      userId: session.user.id,
    });

    return NextResponse.json({ note }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/notes]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
