import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Note from "@/models/Note";
import { nanoid } from "nanoid";

// POST /api/notes/[id]/share — Enable sharing and generate shareId
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;

    const note = await Note.findOne({ _id: id, userId: session.user.id });
    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    // Idempotent generation of shareId
    if (!note.shareId) {
      note.shareId = nanoid(8);
    }
    note.isPublic = true;
    await note.save();

    return NextResponse.json({ shareId: note.shareId });
  } catch (error) {
    console.error("[POST /api/notes/[id]/share]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/notes/[id]/share — Revoke sharing
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;

    const note = await Note.findOne({ _id: id, userId: session.user.id });
    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    note.isPublic = false;
    note.shareId = undefined; 
    
    await note.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/notes/[id]/share]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
