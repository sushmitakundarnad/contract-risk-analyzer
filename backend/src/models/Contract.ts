import mongoose, { Document, Schema } from 'mongoose';

export interface IRisk {
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: 'legal' | 'financial' | 'compliance' | 'operational';
  description: string;
  mitigation: string;
  clauseLocation: string;
}

export interface IAnalysis {
  risks: IRisk[];
  summary: string;
  score: number;
  riskCategories: {
    legal: number;
    financial: number;
    compliance: number;
    operational: number;
  };
}

export interface IContract extends Document {
  userId: mongoose.Types.ObjectId;
  filename: string;
  content: string;
  analysis: IAnalysis;
  createdAt: Date;
  updatedAt: Date;
}

const riskSchema = new Schema<IRisk>(
  {
    title: { type: String, required: true },
    severity: {
      type: String,
      enum: ['critical', 'high', 'medium', 'low'],
      required: true,
    },
    category: {
      type: String,
      enum: ['legal', 'financial', 'compliance', 'operational'],
      required: true,
    },
    description: { type: String, required: true },
    mitigation: { type: String, required: true },
    clauseLocation: { type: String, required: true },
  },
  { _id: false }
);

const analysisSchema = new Schema<IAnalysis>(
  {
    risks: [riskSchema],
    summary: { type: String, required: true },
    score: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    riskCategories: {
      legal: { type: Number, default: 0 },
      financial: { type: Number, default: 0 },
      compliance: { type: Number, default: 0 },
      operational: { type: Number, default: 0 },
    },
  },
  { _id: false }
);

const contractSchema = new Schema<IContract>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    filename: {
      type: String,
      required: [true, 'Filename is required'],
      trim: true,
    },
    content: {
      type: String,
      required: [true, 'Contract content is required'],
    },
    analysis: {
      type: analysisSchema,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

contractSchema.index({ userId: 1, createdAt: -1 });

const Contract = mongoose.model<IContract>('Contract', contractSchema);
export default Contract;
