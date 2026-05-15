import mongoose, { Document, Model, Schema, Types } from "mongoose";

export interface ITag extends Document {
  name: string;
  userId: Types.ObjectId;
  usageCount: number;
}

const TagSchema = new Schema<ITag>({
  name: { type: String, required: true, trim: true },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  usageCount: { type: Number, default: 0 },
});

TagSchema.index({ name: 1, userId: 1 }, { unique: true });

const Tag: Model<ITag> =
  mongoose.models.Tag || mongoose.model<ITag>("Tag", TagSchema);

export default Tag;
