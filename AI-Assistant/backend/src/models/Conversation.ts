import mongoose, { Schema, Document } from 'mongoose';

export interface IConversationDocument extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

const ConversationSchema = new Schema<IConversationDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      default: 'New Conversation',
      trim: true,
      maxlength: [120, 'Title cannot exceed 120 characters'],
    },
  },
  {
    timestamps: true,
  }
);

ConversationSchema.index({ userId: 1, updatedAt: -1 });

export const ConversationModel =
  mongoose.models.Conversation ||
  mongoose.model<IConversationDocument>('Conversation', ConversationSchema);
