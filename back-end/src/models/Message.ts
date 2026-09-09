import mongoose, { Schema, Document } from 'mongoose';

export interface IAttachmentSubdoc {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  dataUrl?: string;
  createdAt: Date;
}

export interface IMessageDocument extends Document {
  conversationId: mongoose.Types.ObjectId;
  role: 'user' | 'assistant' | 'system';
  content: string;
  attachments: IAttachmentSubdoc[];
  language?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AttachmentSchema = new Schema<IAttachmentSubdoc>(
  {
    id: { type: String, required: true },
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    dataUrl: { type: String },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const MessageSchema = new Schema<IMessageDocument>(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ['user', 'assistant', 'system'],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    attachments: [AttachmentSchema],
    language: {
      type: String,
      default: 'auto',
    },
  },
  {
    timestamps: true,
  }
);

MessageSchema.index({ conversationId: 1, createdAt: 1 });

export const MessageModel =
  mongoose.models.Message ||
  mongoose.model<IMessageDocument>('Message', MessageSchema);
