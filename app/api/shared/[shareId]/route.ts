import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Note from "@/models/Note";
import User from "@/models/User"; // To get author name

export async function GET(
  req: Request,
  { params }: { params: Promise<{ shareId: string }> }
) {
  try {
    await connectDB();
    const { shareId } = await params;

    // Find note by shareId where isPublic is true
    const note = await Note.findOne({ shareId, isPublic: true })
      .select("title content tags summary isPublic updatedAt userId")
      .lean();

    if (!note) {
      return NextResponse.json({ error: "Note not found or private" }, { status: 404 });
    }

    // Get author name
    const author = await User.findById(note.userId).select("name").lean();

    return NextResponse.json({
      note: {
        ...note,
        authorName: author?.name || "Anonymous",
      }
    });
  } catch (error) {
    console.error("[GET /api/shared/[shareId]]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
