import mongoose, { Schema, Document } from 'mongoose';

export interface ISong extends Document {
  title: string;
  votes: number;
  addedAt: Date;
  isRequested: boolean;
}

const SongSchema = new Schema<ISong>({
  title: { type: String, required: true, trim: true },
  votes: { type: Number, default: 0, min: 0 },
  addedAt: { type: Date, default: Date.now },
  isRequested: { type: Boolean, default: false },
});

SongSchema.index({ votes: -1, addedAt: 1 });

export default mongoose.models.Song || mongoose.model<ISong>('Song', SongSchema);
