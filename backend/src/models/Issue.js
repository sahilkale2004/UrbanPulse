const mongoose = require('mongoose');

const IssueSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please add a title'],
      trim: true,
      maxlength: [100, 'Title cannot be more than 100 characters']
    },
    description: {
      type: String,
      required: [true, 'Please add a description'],
      maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    category: {
      type: String,
      required: [true, 'Please add a category'],
      enum: ['pothole', 'drainage', 'waterlogging', 'streetlight', 'garbage', 'other']
    },
    ward: {
      type: String,
      required: [true, 'Please specify the ward']
    },
    location: {
      type: String,
      required: [true, 'Please specify a location']
    },
    latitude: {
      type: Number,
      required: [true, 'Please specify latitude']
    },
    longitude: {
      type: Number,
      required: [true, 'Please specify longitude']
    },
    status: {
      type: String,
      enum: ['reported', 'assigned', 'in-progress', 'resolved', 'closed'],
      default: 'reported'
    },
    images: {
      type: [String],
      default: []
    },
    reportedBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true
    },
    riskScore: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Issue', IssueSchema);
