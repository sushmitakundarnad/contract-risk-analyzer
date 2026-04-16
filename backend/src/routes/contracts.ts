import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { protect, AuthRequest } from '../middleware/auth';
import Contract from '../models/Contract';
import User from '../models/User';
import { analyzeContract } from '../utils/openai';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedTypes = [
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, TXT, and DOC files are allowed.'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// Helper to extract text from uploaded file
async function extractTextFromFile(filePath: string, mimetype: string): Promise<string> {
  if (mimetype === 'text/plain') {
    return fs.readFileSync(filePath, 'utf-8');
  }

  if (mimetype === 'application/pdf') {
    try {
      const pdfParse = require('pdf-parse');
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);
      return data.text;
    } catch {
      throw new Error('Failed to parse PDF file. Please try pasting the text directly.');
    }
  }

  // For DOC/DOCX, read as text (basic fallback)
  return fs.readFileSync(filePath, 'utf-8');
}

// @route   POST /api/contracts/analyze
// @desc    Analyze a contract (file upload or text)
// @access  Private
router.post(
  '/analyze',
  protect,
  upload.single('file'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      let contractText = '';
      let filename = 'Pasted Text';

      if (req.file) {
        filename = req.file.originalname;
        contractText = await extractTextFromFile(req.file.path, req.file.mimetype);

        // Clean up uploaded file
        fs.unlinkSync(req.file.path);
      } else if (req.body.text) {
        contractText = req.body.text;
        filename = req.body.filename || 'Pasted Text';
      } else {
        res.status(400).json({ message: 'Please upload a file or provide contract text' });
        return;
      }

      if (contractText.trim().length < 50) {
        res.status(400).json({
          message: 'Contract text is too short. Please provide at least 50 characters.',
        });
        return;
      }

      // Truncate to ~15000 chars for API limits
      const truncatedText = contractText.substring(0, 15000);

      // Analyze with OpenAI
      const analysis = await analyzeContract(truncatedText);

      // Save to database
      const contract = await Contract.create({
        userId: req.user?._id,
        filename,
        content: truncatedText,
        analysis,
      });

      // Update user's contract count
      await User.findByIdAndUpdate(req.user?._id, {
        $inc: { contractsAnalyzed: 1 },
      });

      res.status(201).json({
        _id: contract._id,
        filename: contract.filename,
        analysis: contract.analysis,
        createdAt: contract.createdAt,
      });
    } catch (error) {
      const err = error as Error;
      res.status(500).json({ message: 'Analysis failed', error: err.message });
    }
  }
);

// @route   GET /api/contracts
// @desc    Get user's contract history
// @access  Private
router.get('/', protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const severity = req.query.severity as string;
    const search = req.query.search as string;
    const sortBy = (req.query.sortBy as string) || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

    const query: Record<string, unknown> = { userId: req.user?._id };

    if (search) {
      query.filename = { $regex: search, $options: 'i' };
    }

    if (severity) {
      query['analysis.risks.severity'] = severity;
    }

    const total = await Contract.countDocuments(query);
    const contracts = await Contract.find(query)
      .select('filename analysis.score analysis.summary analysis.risks createdAt')
      .sort({ [sortBy]: sortOrder })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    res.json({
      contracts,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    const err = error as Error;
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// @route   GET /api/contracts/:id
// @desc    Get a single contract by ID
// @access  Private
router.get('/:id', protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const contract = await Contract.findOne({
      _id: req.params.id,
      userId: req.user?._id,
    });

    if (!contract) {
      res.status(404).json({ message: 'Contract not found' });
      return;
    }

    res.json(contract);
  } catch (error) {
    const err = error as Error;
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// @route   DELETE /api/contracts/:id
// @desc    Delete a contract
// @access  Private
router.delete('/:id', protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const contract = await Contract.findOneAndDelete({
      _id: req.params.id,
      userId: req.user?._id,
    });

    if (!contract) {
      res.status(404).json({ message: 'Contract not found' });
      return;
    }

    await User.findByIdAndUpdate(req.user?._id, {
      $inc: { contractsAnalyzed: -1 },
    });

    res.json({ message: 'Contract deleted successfully' });
  } catch (error) {
    const err = error as Error;
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

export default router;
