import { Router, Response } from 'express';
import { protect, admin, AuthRequest } from '../middleware/auth';
import Contract from '../models/Contract';
import User from '../models/User';

const router = Router();

// @route   GET /api/dashboard/stats
// @desc    Get dashboard statistics for the current user
// @access  Private
router.get('/stats', protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;

    // Get total contracts
    const totalContracts = await Contract.countDocuments({ userId });

    // Get all contracts for analysis
    const contracts = await Contract.find({ userId })
      .select('analysis.score analysis.risks createdAt')
      .lean();

    // Calculate average risk score
    let avgScore = 0;
    if (contracts.length > 0) {
      const totalScore = contracts.reduce((sum, c) => sum + (c.analysis?.score || 0), 0);
      avgScore = Math.round(totalScore / contracts.length);
    }

    // Count high/critical risks
    let highCriticalCount = 0;
    const severityDistribution = { critical: 0, high: 0, medium: 0, low: 0 };

    contracts.forEach((contract) => {
      if (contract.analysis?.risks) {
        contract.analysis.risks.forEach((risk) => {
          if (risk.severity === 'critical' || risk.severity === 'high') {
            highCriticalCount++;
          }
          if (risk.severity in severityDistribution) {
            severityDistribution[risk.severity as keyof typeof severityDistribution]++;
          }
        });
      }
    });

    // Calculate growth trend (compare last 7 days vs previous 7 days)
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const recentContracts = contracts.filter(
      (c) => new Date(c.createdAt) >= sevenDaysAgo
    ).length;
    const previousContracts = contracts.filter(
      (c) => new Date(c.createdAt) >= fourteenDaysAgo && new Date(c.createdAt) < sevenDaysAgo
    ).length;

    let growthPercentage = 0;
    if (previousContracts > 0) {
      growthPercentage = Math.round(
        ((recentContracts - previousContracts) / previousContracts) * 100
      );
    } else if (recentContracts > 0) {
      growthPercentage = 100;
    }

    // Contracts analyzed per day (last 7 days)
    const dailyData: { date: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      const count = contracts.filter((c) => {
        const cDate = new Date(c.createdAt).toISOString().split('T')[0];
        return cDate === dateStr;
      }).length;
      dailyData.push({ date: dateStr, count });
    }

    // Average score by category
    const categoryScores: Record<string, number[]> = {
      legal: [],
      financial: [],
      compliance: [],
      operational: [],
    };
    contracts.forEach((contract) => {
      if (contract.analysis?.risks) {
        contract.analysis.risks.forEach((risk) => {
          const severityScore =
            risk.severity === 'critical'
              ? 10
              : risk.severity === 'high'
                ? 30
                : risk.severity === 'medium'
                  ? 60
                  : 85;
          if (risk.category in categoryScores) {
            categoryScores[risk.category].push(severityScore);
          }
        });
      }
    });

    const avgCategoryScores: Record<string, number> = {};
    Object.entries(categoryScores).forEach(([category, scores]) => {
      avgCategoryScores[category] =
        scores.length > 0
          ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
          : 0;
    });

    res.json({
      totalContracts,
      avgScore,
      highCriticalCount,
      growthPercentage,
      severityDistribution,
      dailyData,
      avgCategoryScores,
    });
  } catch (error) {
    const err = error as Error;
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// @route   GET /api/dashboard/admin
// @desc    Get admin dashboard (all users & contracts)
// @access  Admin
router.get(
  '/admin',
  protect,
  admin,
  async (_req: AuthRequest, res: Response): Promise<void> => {
    try {
      const totalUsers = await User.countDocuments();
      const totalContracts = await Contract.countDocuments();

      const users = await User.find()
        .select('name email role contractsAnalyzed createdAt')
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();

      const recentContracts = await Contract.find()
        .select('userId filename analysis.score analysis.summary createdAt')
        .populate('userId', 'name email')
        .sort({ createdAt: -1 })
        .limit(20)
        .lean();

      res.json({
        totalUsers,
        totalContracts,
        users,
        recentContracts,
      });
    } catch (error) {
      const err = error as Error;
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  }
);

export default router;
