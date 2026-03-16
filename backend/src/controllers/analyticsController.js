const Issue = require('../models/Issue');

// @desc    Get infrastructure issues analytics
// @route   GET /api/analytics
// @access  Private/Authority
exports.getAnalytics = async (req, res, next) => {
  try {
    const totalIssues = await Issue.countDocuments();
    
    // Group by category
    const byCategory = await Issue.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    // Group by status
    const byStatus = await Issue.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Group by ward
    const byWard = await Issue.aggregate([
      { $group: { _id: '$ward', count: { $sum: 1 } } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalIssues,
        byCategory,
        byStatus,
        byWard
      }
    });

  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};
