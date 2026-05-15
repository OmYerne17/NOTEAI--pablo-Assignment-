import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Note from "@/models/Note";
import AiUsage from "@/models/AiUsage";
import { Types } from "mongoose";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const userId = session.user.id;

    const { searchParams } = new URL(req.url);
    const range = searchParams.get("range") || "weekly"; // daily, weekly, monthly

    // 1. totalNotes (non-archived)
    const totalNotes = await Note.countDocuments({ userId, isArchived: false });

    // 2. notesThisWeek (always last 7 days for the stat card)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);
    const notesThisWeek = await Note.countDocuments({ 
      userId, 
      createdAt: { $gte: sevenDaysAgo } 
    });

    // 3. recentlyEdited (last 5)
    const recentlyEdited = await Note.find({ userId })
      .sort({ updatedAt: -1 })
      .limit(5)
      .select("_id title updatedAt")
      .lean();

    // 4. topTags (aggregate from tags array)
    const topTags = await Note.aggregate([
      { $match: { userId: new Types.ObjectId(userId) } },
      { $unwind: "$tags" },
      { $group: { _id: "$tags", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      { $project: { name: "$_id", count: 1, _id: 0 } }
    ]);

    // 5. aiUsageCount
    const aiUsageCount = await AiUsage.countDocuments({ userId });

    // 6. Activity Chart Data based on range
    const activityData = [];
    let intervals = 7;
    let step = "day"; // "hour", "day"

    if (range === "daily") {
      intervals = 24;
      step = "hour";
    } else if (range === "monthly") {
      intervals = 30;
      step = "day";
    }

    for (let i = intervals - 1; i >= 0; i--) {
      const start = new Date();
      if (step === "hour") {
        start.setHours(start.getHours() - i, 0, 0, 0);
      } else {
        start.setDate(start.getDate() - i);
        start.setHours(0, 0, 0, 0);
      }
      
      const end = new Date(start);
      if (step === "hour") {
        end.setHours(start.getHours(), 59, 59, 999);
      } else {
        end.setHours(23, 59, 59, 999);
      }

      const count = await Note.countDocuments({
        userId,
        $or: [
          { createdAt: { $gte: start, $lte: end } },
          { updatedAt: { $gte: start, $lte: end } }
        ]
      });

      activityData.push({
        label: step === "hour" 
          ? `${start.getHours()}:00` 
          : start.toLocaleDateString('en-US', { weekday: range === 'monthly' ? undefined : 'short', day: 'numeric', month: range === 'monthly' ? 'short' : undefined }),
        date: start.toISOString(),
        count
      });
    }

    return NextResponse.json({
      totalNotes,
      notesThisWeek,
      recentlyEdited,
      topTags,
      aiUsageCount,
      activity: activityData,
      range
    });
  } catch (error) {
    console.error("[GET /api/insights]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
