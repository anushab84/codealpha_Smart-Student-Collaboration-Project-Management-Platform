const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['Owner', 'Manager', 'Member'],
      default: 'Member'
    }
  },
  { _id: false }
);

const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please add a project title'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters']
    },
    description: {
      type: String,
      required: [true, 'Please add a project description'],
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters']
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    members: [memberSchema],
    status: {
      type: String,
      enum: ['Planning', 'Active', 'Completed', 'Archived'],
      default: 'Planning'
    },
    startDate: {
      type: Date,
      default: Date.now
    },
    dueDate: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

projectSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Project', projectSchema);
