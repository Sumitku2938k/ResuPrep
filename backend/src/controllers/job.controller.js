const mongoose = require('mongoose');
const Job = require('../models/Job');
const ResumeBuilder = require('../models/ResumeBuilder');
const ApiResponse = require('../utils/apiResponse');
const {
  extractSkillsFromJD,
  calculateJobMatch,
} = require('../services/jobMatcher.service');

/**
 * Escapes special regex characters in user search input to prevent ReDoS / injection.
 * @param {string} text - Raw search term
 * @returns {string} Safe escaped string
 */
function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

/**
 * GET /api/v1/jobs
 * List active jobs with pagination, multi-field filtering, and safe text search.
 */
exports.getJobs = async (req, res, next) => {
  try {
    const {
      search,
      category,
      jobType,
      workMode,
      experienceLevel,
      location,
      page = 1,
      limit = 10,
    } = req.query;

    const filter = { isActive: true };

    // Search query across title, company, description
    if (search && search.trim()) {
      const safeSearch = escapeRegex(search.trim());
      filter.$or = [
        { title: { $regex: safeSearch, $options: 'i' } },
        { company: { $regex: safeSearch, $options: 'i' } },
        { description: { $regex: safeSearch, $options: 'i' } },
      ];
    }

    if (category) filter.category = category;
    if (jobType) filter.jobType = jobType;
    if (workMode) filter.workMode = workMode;
    if (experienceLevel) filter['experience.level'] = experienceLevel;
    if (location && location.trim()) {
      filter.location = { $regex: escapeRegex(location.trim()), $options: 'i' };
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(Math.max(1, parseInt(limit, 10) || 10), 50);
    const skip = (pageNum - 1) * limitNum;

    const [jobs, total] = await Promise.all([
      Job.find(filter)
        .select('-__v')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Job.countDocuments(filter),
    ]);

    const pages = Math.ceil(total / limitNum) || 1;

    return ApiResponse.success(
      res,
      {
        jobs,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          pages,
        },
      },
      'Jobs fetched successfully'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/jobs/:id
 * Retrieve details of a single active job by MongoDB ObjectId.
 */
exports.getJobById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return ApiResponse.badRequest(res, 'Invalid job ID format');
    }

    const job = await Job.findOne({ _id: id, isActive: true }).select('-__v').lean();

    if (!job) {
      return ApiResponse.notFound(res, 'Job not found');
    }

    return ApiResponse.success(res, { job }, 'Job fetched successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/jobs/match
 * Match authenticated user's saved resume against an active job in the catalogue.
 */
exports.matchJob = async (req, res, next) => {
  try {
    const { resumeId, jobId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(resumeId)) {
      return ApiResponse.badRequest(res, 'Invalid resume ID format');
    }
    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      return ApiResponse.badRequest(res, 'Invalid job ID format');
    }

    // Strict user ownership verification: user MUST own the resume
    const resume = await ResumeBuilder.findOne({
      _id: resumeId,
      user: req.user._id,
    }).lean();

    if (!resume) {
      return ApiResponse.notFound(res, 'Resume not found');
    }

    const job = await Job.findOne({
      _id: jobId,
      isActive: true,
    }).lean();

    if (!job) {
      return ApiResponse.notFound(res, 'Job not found');
    }

    // Calculate match using deterministic pure matching service
    const matchResult = calculateJobMatch(resume, job);

    const responseData = {
      jobId: job._id.toString(),
      jobTitle: job.title,
      company: job.company,
      resumeId: resume._id.toString(),
      resumeTitle: resume.title || 'Untitled Resume',
      matchPercentage: matchResult.matchPercentage,
      matchedRequiredSkills: matchResult.matchedRequiredSkills,
      missingRequiredSkills: matchResult.missingRequiredSkills,
      matchedPreferredSkills: matchResult.matchedPreferredSkills,
      missingPreferredSkills: matchResult.missingPreferredSkills,
      partialSkills: matchResult.partialSkills || [],
      breakdown: matchResult.breakdown,
      experienceCompatibility: matchResult.experienceCompatibility,
      status: matchResult.status,
    };

    return ApiResponse.success(res, responseData, 'Job match calculated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/jobs/match-pasted
 * Match authenticated user's saved resume against arbitrary pasted job description text.
 */
exports.matchPastedJobDescription = async (req, res, next) => {
  try {
    const { resumeId, jobDescription, jobTitle } = req.body;

    if (!mongoose.Types.ObjectId.isValid(resumeId)) {
      return ApiResponse.badRequest(res, 'Invalid resume ID format');
    }

    // Strict user ownership verification: user MUST own the resume
    const resume = await ResumeBuilder.findOne({
      _id: resumeId,
      user: req.user._id,
    }).lean();

    if (!resume) {
      return ApiResponse.notFound(res, 'Resume not found');
    }

    // Extract skills and categorize sections
    const extractedSkills = extractSkillsFromJD(jobDescription);

    const cleanTitle = jobTitle && typeof jobTitle === 'string' && jobTitle.trim()
      ? jobTitle.trim()
      : 'Custom Job Description';

    const tempJob = {
      title: cleanTitle,
      requiredSkills: extractedSkills.requiredSkills,
      preferredSkills: extractedSkills.preferredSkills,
      experience: { level: 'mid', min: 0, max: null },
    };

    const matchResult = calculateJobMatch(resume, tempJob);

    const message = extractedSkills.status === 'no-skills-found'
      ? 'No recognizable skills found in job description'
      : 'Job description matched successfully';

    const responseData = {
      resumeId: resume._id.toString(),
      resumeTitle: resume.title || 'Untitled Resume',
      jobTitle: cleanTitle,
      extractedSkills: {
        requiredSkills: extractedSkills.requiredSkills,
        preferredSkills: extractedSkills.preferredSkills,
        extractedSkillsCount: extractedSkills.extractedSkillsCount,
        status: extractedSkills.status,
      },
      matchPercentage: matchResult.matchPercentage,
      matchedRequiredSkills: matchResult.matchedRequiredSkills,
      missingRequiredSkills: matchResult.missingRequiredSkills,
      matchedPreferredSkills: matchResult.matchedPreferredSkills,
      missingPreferredSkills: matchResult.missingPreferredSkills,
      partialSkills: matchResult.partialSkills || [],
      breakdown: matchResult.breakdown,
      experienceCompatibility: matchResult.experienceCompatibility,
      status: matchResult.status,
    };

    return ApiResponse.success(res, responseData, message);
  } catch (error) {
    next(error);
  }
};

