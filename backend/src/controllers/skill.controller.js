const { analyzeSkillGap } = require('../services/ai.service');
const ApiResponse = require('../utils/apiResponse');

const roleTaxonomy = {
  'frontend-developer': {
    role: 'Frontend Developer',
    skills: [
      { name: 'HTML/CSS', level: 'advanced', category: 'core' },
      { name: 'JavaScript', level: 'advanced', category: 'core' },
      { name: 'React', level: 'advanced', category: 'framework' },
      { name: 'TypeScript', level: 'intermediate', category: 'language' },
      { name: 'Testing (Jest/Cypress)', level: 'intermediate', category: 'testing' },
      { name: 'Responsive Design', level: 'advanced', category: 'core' },
      { name: 'Git', level: 'intermediate', category: 'tools' },
      { name: 'Performance Optimization', level: 'intermediate', category: 'advanced' },
    ],
  },
  'backend-developer': {
    role: 'Backend Developer',
    skills: [
      { name: 'Node.js', level: 'advanced', category: 'runtime' },
      { name: 'Python', level: 'intermediate', category: 'language' },
      { name: 'SQL', level: 'advanced', category: 'database' },
      { name: 'REST API Design', level: 'advanced', category: 'core' },
      { name: 'Docker', level: 'intermediate', category: 'devops' },
      { name: 'Authentication/Security', level: 'advanced', category: 'security' },
      { name: 'System Design', level: 'intermediate', category: 'architecture' },
      { name: 'CI/CD', level: 'intermediate', category: 'devops' },
    ],
  },
  'data-scientist': {
    role: 'Data Scientist',
    skills: [
      { name: 'Python', level: 'advanced', category: 'language' },
      { name: 'Machine Learning', level: 'advanced', category: 'core' },
      { name: 'Statistics', level: 'advanced', category: 'math' },
      { name: 'SQL', level: 'intermediate', category: 'database' },
      { name: 'TensorFlow/PyTorch', level: 'intermediate', category: 'framework' },
      { name: 'Data Visualization', level: 'intermediate', category: 'tools' },
      { name: 'NLP', level: 'intermediate', category: 'specialization' },
      { name: 'Big Data (Spark)', level: 'basic', category: 'tools' },
    ],
  },
  'full-stack-developer': {
    role: 'Full Stack Developer',
    skills: [
      { name: 'React', level: 'advanced', category: 'frontend' },
      { name: 'Node.js', level: 'advanced', category: 'backend' },
      { name: 'TypeScript', level: 'intermediate', category: 'language' },
      { name: 'MongoDB/SQL', level: 'intermediate', category: 'database' },
      { name: 'Docker', level: 'intermediate', category: 'devops' },
      { name: 'AWS/Cloud', level: 'intermediate', category: 'cloud' },
      { name: 'Git', level: 'intermediate', category: 'tools' },
      { name: 'Testing', level: 'intermediate', category: 'quality' },
    ],
  },
  'devops-engineer': {
    role: 'DevOps Engineer',
    skills: [
      { name: 'Docker', level: 'advanced', category: 'containerization' },
      { name: 'Kubernetes', level: 'advanced', category: 'orchestration' },
      { name: 'AWS/Azure/GCP', level: 'advanced', category: 'cloud' },
      { name: 'Terraform', level: 'intermediate', category: 'iac' },
      { name: 'CI/CD Pipelines', level: 'advanced', category: 'automation' },
      { name: 'Linux', level: 'advanced', category: 'os' },
      { name: 'Monitoring (Grafana)', level: 'intermediate', category: 'observability' },
      { name: 'Scripting (Bash/Python)', level: 'intermediate', category: 'tools' },
    ],
  },
};

exports.getTaxonomy = async (req, res, next) => {
  try {
    const { role } = req.params;
    const taxonomy = roleTaxonomy[role] || roleTaxonomy['full-stack-developer'];
    ApiResponse.success(res, { taxonomy });
  } catch (error) {
    next(error);
  }
};

exports.gapAnalysis = async (req, res, next) => {
  try {
    const { currentSkills, targetRole } = req.body;

    if (!currentSkills || !targetRole) {
      return ApiResponse.badRequest(res, 'currentSkills (array) and targetRole (string) are required');
    }

    const gaps = await analyzeSkillGap(currentSkills, targetRole);
    ApiResponse.success(res, { gaps, targetRole });
  } catch (error) {
    next(error);
  }
};
