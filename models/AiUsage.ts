import mongoose, { Document, Model, Schema, Types } from "mongoose";

export interface IAiUsage extends Document {
  userId: Types.ObjectId;
  feature: string;
  noteId?: string;
  createdAt: Date;
}

const AiUsageSchema = new Schema<IAiUsage>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    feature: { type: String, required: true },
    noteId: { type: String },
  },
  { timestamps: true }
);

const AiUsage: Model<IAiUsage> =
  mongoose.models.AiUsage || mongoose.model<IAiUsage>("AiUsage", AiUsageSchema);

export default AiUsage;
