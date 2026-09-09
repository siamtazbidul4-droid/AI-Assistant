import mongoose, { Schema, Document } from 'mongoose';

export interface IFileAttachmentDocument extends Document {
  userId: mongoose.Types.ObjectId;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  dataBase64?: string;
  createdAt: Date;
}

const FileAttachmentSchema = new Schema<IFileAttachmentDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    dataBase64: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

export const FileAttachmentModel =
  mongoose.models.FileAttachment ||
  mongoose.model<IFileAttachmentDocument>('FileAttachment', FileAttachmentSchema);
