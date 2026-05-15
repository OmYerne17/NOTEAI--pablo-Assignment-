import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Note from "@/models/Note";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// PATCH /api/notes/[id] — update note fields, verify ownership
export async function PATCH(req: Request, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    await connectDB();

    const body = await req.json();
    const allowedFields = ["title", "content", "tags", "category", "isArchived", "isPublic"];
    const updates: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (field in body) {
        updates[field] = body[field];
      }
    }

    const note = await Note.findOneAndUpdate(
      { _id: id, userId: session.user.id },
      { $set: updates },
      { new: true, runValidators: true }
    ).lean();

    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    return NextResponse.json({ note });
  } catch (error) {
    console.error("[PATCH /api/notes/[id]]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/notes/[id] — delete note
// Optional ?permanent=true for hard delete, otherwise defaults to archiving
export async function DELETE(req: Request, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const { searchParams } = new URL(req.url);
    const permanent = searchParams.get("permanent") === "true";

    await connectDB();

    if (permanent) {
      const result = await Note.deleteOne({ _id: id, userId: session.user.id });
      if (result.deletedCount === 0) {
        return NextResponse.json({ error: "Note not found" }, { status: 404 });
      }
      return NextResponse.json({ message: "Note permanently deleted" });
    } else {
      const note = await Note.findOneAndUpdate(
        { _id: id, userId: session.user.id },
        { $set: { isArchived: true } },
        { new: true }
      ).lean();

      if (!note) {
        return NextResponse.json({ error: "Note not found" }, { status: 404 });
      }

      return NextResponse.json({ message: "Note archived", note });
    }
  } catch (error) {
    console.error("[DELETE /api/notes/[id]]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
