const Joi = require('joi');

const signupSchema = Joi.object({
  name: Joi.string().trim().min(2).max(50).required(),
  email: Joi.string().email().lowercase().trim().required(),
  password: Joi.string().min(6).max(128).required(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().lowercase().trim().required(),
  password: Joi.string().required(),
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(6).max(128).required(),
});

const feedbackSchema = Joi.object({
  name: Joi.string().trim().min(2).max(50).required(),
  role: Joi.string().trim().max(50).default('User'),
  rating: Joi.number().integer().min(1).max(5).required(),
  feature: Joi.string().valid('resume-analyzer', 'job-matcher', 'resume-builder', 'cover-letter', 'skill-assessment', 'general').default('general'),
  message: Joi.string().trim().min(10).max(1000).required(),
});

const coverLetterSchema = Joi.object({
  name: Joi.string().trim().required(),
  jobTitle: Joi.string().trim().required(),
  company: Joi.string().trim().required(),
  hiringManager: Joi.string().trim().default('Hiring Manager'),
  keySkills: Joi.string().trim().allow(''),
  achievement: Joi.string().trim().allow(''),
  tone: Joi.string().valid('professional', 'enthusiastic', 'concise').default('professional'),
});

const resumeBuilderSchema = Joi.object({
  title: Joi.string().trim().default('Untitled Resume'),
  personalInfo: Joi.object({
    fullName: Joi.string().allow(''),
    email: Joi.string().allow(''),
    phone: Joi.string().allow(''),
    location: Joi.string().allow(''),
    linkedin: Joi.string().allow(''),
    website: Joi.string().allow(''),
  }),
  summary: Joi.string().allow(''),
  education: Joi.array().items(Joi.object({
    institution: Joi.string().allow(''),
    degree: Joi.string().allow(''),
    field: Joi.string().allow(''),
    startDate: Joi.string().allow(''),
    endDate: Joi.string().allow(''),
    gpa: Joi.string().allow(''),
  })),
  experience: Joi.array().items(Joi.object({
    company: Joi.string().allow(''),
    position: Joi.string().allow(''),
    location: Joi.string().allow(''),
    startDate: Joi.string().allow(''),
    endDate: Joi.string().allow(''),
    current: Joi.boolean().default(false),
    description: Joi.string().allow(''),
  })),
  skills: Joi.array().items(Joi.string()),
  projects: Joi.array().items(Joi.object({
    name: Joi.string().allow(''),
    description: Joi.string().allow(''),
    technologies: Joi.string().allow(''),
    link: Joi.string().allow(''),
  })),
  certifications: Joi.array().items(Joi.object({
    name: Joi.string().allow(''),
    issuer: Joi.string().allow(''),
    date: Joi.string().allow(''),
    link: Joi.string().allow(''),
  })),
  template: Joi.string().default('modern'),
});

const jobQuerySchema = Joi.object({
  search: Joi.string().trim().max(100).allow(''),
  category: Joi.string().valid('tech', 'data', 'design', 'product', 'business', 'devops'),
  jobType: Joi.string().valid('Full-time', 'Part-time', 'Contract', 'Internship'),
  workMode: Joi.string().valid('On-site', 'Remote', 'Hybrid'),
  experienceLevel: Joi.string().valid('entry', 'mid', 'senior', 'lead'),
  location: Joi.string().trim().max(100),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(10),
});

const jobIdParamSchema = Joi.object({
  id: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'Invalid job ID format',
      'any.required': 'Job ID is required',
    }),
});

const matchJobSchema = Joi.object({
  resumeId: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'Invalid resume ID format',
      'any.required': 'resumeId is required',
    }),
  jobId: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'Invalid job ID format',
      'any.required': 'jobId is required',
    }),
});

const matchPastedJdSchema = Joi.object({
  resumeId: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'Invalid resume ID format',
      'any.required': 'resumeId is required',
    }),
  jobDescription: Joi.string()
    .trim()
    .min(20)
    .max(10000)
    .required()
    .messages({
      'string.empty': 'Job description is required',
      'string.min': 'Job description must be at least 20 characters long',
      'string.max': 'Job description cannot exceed 10,000 characters',
      'any.required': 'jobDescription is required',
    }),
  jobTitle: Joi.string().trim().max(150).allow('').default('Custom Job Description'),
});

module.exports = {
  signupSchema,
  loginSchema,
  changePasswordSchema,
  feedbackSchema,
  coverLetterSchema,
  resumeBuilderSchema,
  jobQuerySchema,
  jobIdParamSchema,
  matchJobSchema,
  matchPastedJdSchema,
};
