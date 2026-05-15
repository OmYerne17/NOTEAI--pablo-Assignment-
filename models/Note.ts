import mongoose, { Document, Model, Schema, Types } from "mongoose";

export interface INote extends Document {
  title: string;
  content: string;
  summary?: string;
  actionItems?: string[];
  suggestedTitle?: string;
  tags: string[];
  category?: string;
  isArchived: boolean;
  isPublic: boolean;
  shareId?: string;
  userId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const NoteSchema = new Schema<INote>(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, required: false, default: "" },
    summary: { type: String },
    actionItems: [{ type: String }],
    suggestedTitle: { type: String },
    tags: [{ type: String }],
    category: { type: String },
    isArchived: { type: Boolean, default: false },
    isPublic: { type: Boolean, default: false },
    shareId: { type: String, unique: true, sparse: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  },
  { timestamps: true }
);

const Note: Model<INote> =
  mongoose.models.Note || mongoose.model<INote>("Note", NoteSchema);

export default Note;
