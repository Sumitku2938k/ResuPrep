const mongoose = require('mongoose');

const experienceSchema = new mongoose.Schema(
  {
    min: {
      type: Number,
      min: [0, 'Minimum experience cannot be negative'],
      default: 0,
    },
    max: {
      type: Number,
      default: null,
      validate: [
        {
          validator: function (val) {
            if (val === null || val === undefined) return true;
            return val >= 0;
          },
          message: 'Maximum experience cannot be negative',
        },
        {
          validator: function (val) {
            if (val === null || val === undefined) return true;
            const minVal = this.min !== undefined ? this.min : 0;
            return val >= minVal;
          },
          message: 'Maximum experience cannot be less than minimum experience',
        },
      ],
    },
    level: {
      type: String,
      enum: {
        values: ['entry', 'mid', 'senior', 'lead'],
        message: '{VALUE} is not a valid experience level',
      },
      default: 'mid',
    },
  },
  { _id: false }
);

const salarySchema = new mongoose.Schema(
  {
    min: {
      type: Number,
      min: [0, 'Minimum salary cannot be negative'],
      default: null,
    },
    max: {
      type: Number,
      default: null,
      validate: [
        {
          validator: function (val) {
            if (val === null || val === undefined) return true;
            return val >= 0;
          },
          message: 'Maximum salary cannot be negative',
        },
        {
          validator: function (val) {
            if (val === null || val === undefined) return true;
            if (this.min === null || this.min === undefined) return true;
            return val >= this.min;
          },
          message: 'Maximum salary cannot be less than minimum salary',
        },
      ],
    },
    currency: {
      type: String,
      default: 'USD',
      trim: true,
      uppercase: true,
    },
    display: {
      type: String,
      default: '',
      trim: true,
    },
  },
  { _id: false }
);

const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true,
      maxlength: [150, 'Job title cannot exceed 150 characters'],
    },
    slug: {
      type: String,
      required: [true, 'Slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    company: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
      maxlength: [120, 'Company name cannot exceed 120 characters'],
    },
    companyLogo: {
      type: String,
      default: '💼',
      trim: true,
    },
    shortDescription: {
      type: String,
      default: '',
      trim: true,
      maxlength: [300, 'Short description cannot exceed 300 characters'],
    },
    description: {
      type: String,
      required: [true, 'Job description is required'],
      trim: true,
    },
    requiredSkills: {
      type: [String],
      default: [],
      validate: {
        validator: function (skills) {
          if (!Array.isArray(skills)) return false;
          return skills.every((s) => typeof s === 'string' && s.trim().length > 0);
        },
        message: 'Required skills must not contain empty strings',
      },
    },
    preferredSkills: {
      type: [String],
      default: [],
      validate: {
        validator: function (skills) {
          if (!Array.isArray(skills)) return false;
          return skills.every((s) => typeof s === 'string' && s.trim().length > 0);
        },
        message: 'Preferred skills must not contain empty strings',
      },
    },
    experience: {
      type: experienceSchema,
      default: () => ({ min: 0, max: null, level: 'mid' }),
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
    },
    jobType: {
      type: String,
      enum: {
        values: ['Full-time', 'Part-time', 'Contract', 'Internship'],
        message: '{VALUE} is not a valid job type',
      },
      default: 'Full-time',
    },
    workMode: {
      type: String,
      enum: {
        values: ['On-site', 'Remote', 'Hybrid'],
        message: '{VALUE} is not a valid work mode',
      },
      default: 'On-site',
    },
    salary: {
      type: salarySchema,
      default: () => ({ min: null, max: null, currency: 'USD', display: '' }),
    },
    category: {
      type: String,
      enum: {
        values: ['tech', 'data', 'design', 'product', 'business', 'devops'],
        message: '{VALUE} is not a valid job category',
      },
      default: 'tech',
    },
    responsibilities: {
      type: [String],
      default: [],
    },
    qualifications: {
      type: [String],
      default: [],
    },
    applicationUrl: {
      type: String,
      default: '',
      trim: true,
      validate: {
        validator: function (v) {
          if (!v || v.trim() === '') return true;
          return /^https?:\/\/[^\s$.?#].[^\s]*$/i.test(v.trim());
        },
        message: 'Application URL must be a valid HTTP or HTTPS URL',
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Pre-validate hook for cross-field consistency and skill trimming
jobSchema.pre('validate', function (next) {
  // Trim skills
  if (Array.isArray(this.requiredSkills)) {
    this.requiredSkills = this.requiredSkills.map((s) => (typeof s === 'string' ? s.trim() : s));
  }
  if (Array.isArray(this.preferredSkills)) {
    this.preferredSkills = this.preferredSkills.map((s) => (typeof s === 'string' ? s.trim() : s));
  }

  // Cross-field experience validation
  if (
    this.experience &&
    this.experience.max !== null &&
    this.experience.max !== undefined &&
    this.experience.min !== null &&
    this.experience.min !== undefined
  ) {
    if (this.experience.max < this.experience.min) {
      this.invalidate('experience.max', 'Maximum experience cannot be less than minimum experience');
    }
  }

  // Cross-field salary validation
  if (
    this.salary &&
    this.salary.max !== null &&
    this.salary.max !== undefined &&
    this.salary.min !== null &&
    this.salary.min !== undefined
  ) {
    if (this.salary.max < this.salary.min) {
      this.invalidate('salary.max', 'Maximum salary cannot be less than minimum salary');
    }
  }

  next();
});

// Indexes for query performance and uniqueness (slug uniqueness declared on field)
jobSchema.index({ isActive: 1 });
jobSchema.index({ category: 1 });
jobSchema.index({ jobType: 1 });
jobSchema.index({ workMode: 1 });
jobSchema.index({ location: 1 });
jobSchema.index({ 'experience.level': 1 });

// Single text index for full-text search across title, company, and description
jobSchema.index(
  {
    title: 'text',
    company: 'text',
    description: 'text',
  },
  {
    weights: {
      title: 10,
      company: 5,
      description: 1,
    },
    name: 'JobTextIndex',
  }
);

module.exports = mongoose.model('Job', jobSchema);
