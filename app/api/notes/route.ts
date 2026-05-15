import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Note from "@/models/Note";

// GET /api/notes — return notes for the logged-in user with filtering and sorting
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const tags = searchParams.get("tags")?.split(",").filter(Boolean) || [];
    const sort = searchParams.get("sort") || "updatedAt"; // updatedAt or createdAt
    const archived = searchParams.get("archived") === "true";

    const query: any = { userId: session.user.id };

    // Archive filter
    query.isArchived = archived;

    // Search filter (title or content)
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { content: { $regex: search, $options: "i" } },
      ];
    }

    // Multi-tag filter (using $all)
    if (tags.length > 0) {
      query.tags = { $all: tags };
    }

    const notes = await Note.find(query)
      .sort({ [sort]: -1 })
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
