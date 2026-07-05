const OpenAI = require('openai');
const logger = require('../utils/logger');

let openai;
try {
  if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'sk-your-openai-api-key-here') {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
} catch (e) {
  logger.warn('OpenAI API key not configured. Using fallback analysis.');
}

const analyzeResume = async (resumeText, jobDescription) => {
  if (openai) {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are an expert resume analyzer. Analyze the resume against the job description and return a JSON object with these exact keys:
            - compatibilityScore: number 0-100
            - matchedKeywords: array of strings (keywords found in both resume and JD)
            - missingKeywords: array of strings (keywords in JD but not in resume)
            - skillGaps: array of strings (skills the candidate should develop)
            - improvementTips: array of strings (actionable tips to improve the resume)
            - summary: string (brief overall assessment)
            Return ONLY valid JSON, no markdown or extra text.`,
          },
          {
            role: 'user',
            content: `Resume:\n${resumeText}\n\nJob Description:\n${jobDescription}`,
          },
        ],
        temperature: 0.3,
        max_tokens: 1500,
      });

      const content = response.choices[0].message.content;
      return JSON.parse(content);
    } catch (error) {
      logger.error(`OpenAI analysis error: ${error.message}`);
      return fallbackAnalysis(resumeText, jobDescription);
    }
  }

  return fallbackAnalysis(resumeText, jobDescription);
};

const generateCoverLetter = async ({ name, jobTitle, company, hiringManager, keySkills, achievement, tone }) => {
  if (openai) {
    try {
      const toneInstructions = {
        professional: 'Write in a formal, professional tone with measured confidence.',
        enthusiastic: 'Write in an energetic, passionate tone showing genuine excitement.',
        concise: 'Write in a brief, direct tone. Keep it under 200 words.',
      };

      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are an expert cover letter writer. ${toneInstructions[tone]} Generate a complete, ready-to-send cover letter. Do not include placeholder brackets.`,
          },
          {
            role: 'user',
            content: `Write a cover letter for:
Name: ${name}
Job Title: ${jobTitle}
Company: ${company}
Hiring Manager: ${hiringManager}
Key Skills: ${keySkills}
Notable Achievement: ${achievement}
Tone: ${tone}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      });

      return response.choices[0].message.content;
    } catch (error) {
      logger.error(`OpenAI cover letter error: ${error.message}`);
      return fallbackCoverLetter({ name, jobTitle, company, hiringManager, keySkills, achievement, tone });
    }
  }

  return fallbackCoverLetter({ name, jobTitle, company, hiringManager, keySkills, achievement, tone });
};

const analyzeSkillGap = async (currentSkills, targetRole) => {
  if (openai) {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are a career advisor. Analyze the skill gap between current skills and the target role requirements. Return a JSON array of objects with keys: skill (string), priority ("critical"/"high"/"medium"/"low"), resource (string - a recommended learning resource). Return ONLY valid JSON.`,
          },
          {
            role: 'user',
            content: `Current Skills: ${currentSkills.join(', ')}\nTarget Role: ${targetRole}`,
          },
        ],
        temperature: 0.3,
        max_tokens: 1000,
      });

      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      logger.error(`OpenAI skill gap error: ${error.message}`);
      return fallbackSkillGap(currentSkills, targetRole);
    }
  }

  return fallbackSkillGap(currentSkills, targetRole);
};

// ─── Fallback functions (when OpenAI is not available) ───

function fallbackAnalysis(resumeText, jobDescription) {
  const resumeWords = resumeText.toLowerCase().split(/\W+/).filter(w => w.length > 2);
  const jdWords = jobDescription.toLowerCase().split(/\W+/).filter(w => w.length > 2);

  const commonSkills = ['javascript', 'python', 'react', 'node', 'express', 'mongodb', 'sql', 'html', 'css',
    'typescript', 'java', 'docker', 'kubernetes', 'aws', 'git', 'agile', 'scrum',
    'api', 'rest', 'graphql', 'testing', 'ci/cd', 'linux', 'angular', 'vue',
    'machine learning', 'data', 'analytics', 'communication', 'leadership', 'teamwork',
    'problem-solving', 'management', 'excel', 'figma', 'design', 'ux', 'ui'];

  const jdKeywords = [...new Set(jdWords.filter(w => commonSkills.includes(w) || w.length > 4))].slice(0, 20);
  const resumeSet = new Set(resumeWords);

  const matched = jdKeywords.filter(k => resumeSet.has(k));
  const missing = jdKeywords.filter(k => !resumeSet.has(k));

  const score = jdKeywords.length > 0
    ? Math.min(95, Math.round((matched.length / jdKeywords.length) * 100) + Math.floor(Math.random() * 10))
    : 50;

  return {
    compatibilityScore: score,
    matchedKeywords: matched.slice(0, 10),
    missingKeywords: missing.slice(0, 10),
    skillGaps: missing.slice(0, 5).map(k => `Develop proficiency in ${k}`),
    improvementTips: [
      'Tailor your resume to match the job description keywords',
      'Add quantifiable achievements (e.g., "Increased efficiency by 30%")',
      'Use action verbs to start bullet points',
      'Keep your resume to 1-2 pages',
      'Include a professional summary at the top',
    ],
    summary: score >= 75
      ? 'Strong match! Your resume aligns well with the job requirements.'
      : score >= 50
        ? 'Moderate match. Consider adding more relevant keywords and experience.'
        : 'Low match. Significant improvements needed to align with this role.',
  };
}

function fallbackCoverLetter({ name, jobTitle, company, hiringManager, keySkills, achievement, tone }) {
  const openings = {
    professional: `Dear ${hiringManager},\n\nI am writing to express my strong interest in the ${jobTitle} position at ${company}. With my background and expertise, I am confident in my ability to contribute meaningfully to your team.`,
    enthusiastic: `Dear ${hiringManager},\n\nI am thrilled to apply for the ${jobTitle} role at ${company}! The opportunity to bring my passion and skills to your innovative team is incredibly exciting, and I can't wait to share how I can make an impact.`,
    concise: `Dear ${hiringManager},\n\nI am applying for the ${jobTitle} position at ${company}. My skills and experience make me a strong fit for this role.`,
  };

  const bodies = {
    professional: `\n\nThroughout my career, I have developed strong expertise in ${keySkills || 'relevant technical and interpersonal skills'}. ${achievement ? `Notably, ${achievement}.` : ''} These experiences have prepared me to deliver exceptional results in the ${jobTitle} role.\n\nI am particularly drawn to ${company}'s commitment to excellence and innovation. I believe my analytical mindset and proven track record would be valuable assets to your organization.\n\nI would welcome the opportunity to discuss how my qualifications align with your needs. Thank you for considering my application.\n\nSincerely,\n${name}`,
    enthusiastic: `\n\nWhat makes me especially excited about this opportunity is the chance to leverage my skills in ${keySkills || 'my areas of expertise'} to drive real results. ${achievement ? `I'm proud of achievements like ${achievement}, and I'm eager to bring that same energy to ${company}.` : `I bring boundless energy and dedication to everything I do.`}\n\n${company}'s mission truly resonates with me, and I can see myself thriving on your team. I would love the chance to show you what I can bring to the table!\n\nWith enthusiasm,\n${name}`,
    concise: `\n\nKey qualifications: ${keySkills || 'Relevant skills and experience'}. ${achievement ? `Achievement: ${achievement}.` : ''}\n\nI look forward to discussing this opportunity.\n\nBest regards,\n${name}`,
  };

  return openings[tone] + bodies[tone];
}

function fallbackSkillGap(currentSkills, targetRole) {
  const roleSkills = {
    'frontend developer': ['React', 'TypeScript', 'CSS/Sass', 'Testing (Jest)', 'Webpack/Vite', 'Accessibility', 'Performance Optimization'],
    'backend developer': ['Node.js', 'Python', 'SQL', 'REST APIs', 'Docker', 'CI/CD', 'System Design'],
    'full stack developer': ['React', 'Node.js', 'TypeScript', 'SQL & NoSQL', 'Docker', 'AWS/Cloud', 'CI/CD'],
    'data scientist': ['Python', 'Machine Learning', 'SQL', 'Statistics', 'TensorFlow/PyTorch', 'Data Visualization', 'NLP'],
    'devops engineer': ['Docker', 'Kubernetes', 'AWS/Azure', 'Terraform', 'CI/CD', 'Linux', 'Monitoring'],
    'product manager': ['Agile/Scrum', 'Data Analytics', 'User Research', 'Roadmap Planning', 'Stakeholder Management', 'A/B Testing'],
    default: ['Communication', 'Problem Solving', 'Technical Skills', 'Project Management', 'Teamwork', 'Adaptability'],
  };

  const targetSkills = roleSkills[targetRole.toLowerCase()] || roleSkills.default;
  const currentSet = new Set(currentSkills.map(s => s.toLowerCase()));

  const priorities = ['critical', 'high', 'medium', 'low'];
  return targetSkills.map((skill, i) => ({
    skill,
    priority: currentSet.has(skill.toLowerCase()) ? 'low' : priorities[Math.min(i, 3)],
    resource: `Search for "${skill} course" on Coursera, Udemy, or freeCodeCamp`,
  }));
}

module.exports = { analyzeResume, generateCoverLetter, analyzeSkillGap };
