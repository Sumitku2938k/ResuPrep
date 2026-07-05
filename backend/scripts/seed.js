const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Template = require('../src/models/Template');
const FAQ = require('../src/models/FAQ');

const templates = [
  { name: 'Modern Professional', slug: 'modern-professional', description: 'Clean, modern layout with blue accents. Perfect for tech and corporate roles.', category: 'tech', previewConfig: { accentColor: '#2563EB', layout: 'modern', fontFamily: 'Plus Jakarta Sans' } },
  { name: 'Executive Classic', slug: 'executive-classic', description: 'Timeless design with serif fonts. Ideal for senior management positions.', category: 'business', previewConfig: { accentColor: '#1e3a5f', layout: 'classic', fontFamily: 'Georgia' } },
  { name: 'Creative Portfolio', slug: 'creative-portfolio', description: 'Bold, colorful layout with sidebar. Great for designers and creatives.', category: 'creative', previewConfig: { accentColor: '#8b5cf6', layout: 'sidebar', fontFamily: 'Poppins' } },
  { name: 'Minimal Clean', slug: 'minimal-clean', description: 'Minimalist design that lets your content shine. Works for any industry.', category: 'tech', previewConfig: { accentColor: '#06b6d4', layout: 'minimal', fontFamily: 'Inter' } },
  { name: 'Fresh Graduate', slug: 'fresh-graduate', description: 'Designed for new graduates with focus on education and projects.', category: 'fresher', previewConfig: { accentColor: '#10b981', layout: 'modern', fontFamily: 'DM Sans' } },
  { name: 'Business Formal', slug: 'business-formal', description: 'Professional layout for banking, consulting, and finance roles.', category: 'business', previewConfig: { accentColor: '#0f172a', layout: 'classic', fontFamily: 'Merriweather' } },
  { name: 'Tech Startup', slug: 'tech-startup', description: 'Dynamic layout with skill bars and project highlights for startup roles.', category: 'tech', previewConfig: { accentColor: '#f59e0b', layout: 'sidebar', fontFamily: 'Space Grotesk' } },
  { name: 'Design Studio', slug: 'design-studio', description: 'Visually striking with large type and creative spacing.', category: 'creative', previewConfig: { accentColor: '#ec4899', layout: 'creative', fontFamily: 'Outfit' } },
];

const faqs = [
  { question: 'What is ResuPrep?', 
    answer: 'ResuPrep is an AI-powered career platform that helps you analyze resumes, match jobs, build professional resumes, generate cover letters, identify skill gaps, practice AI mock interviews with gesture analysis, and improve your career readiness.', 
    category: 'getting-started', 
    order: 1 
  },
  { question: 'Is ResuPrep free to use?', 
    answer: 'Yes! ResuPrep offers a free tier that includes resume analysis, resume building, cover letter generation, skill assessments, and limited AI mock interviews. Premium plans unlock advanced AI features, unlimited analyses, and additional interview sessions.', 
    category: 'getting-started', 
    order: 2 
  },
  { question: 'How does the Resume Analyzer work?', 
    answer: 'Upload your resume (PDF or DOCX) and paste the target job description. Our AI engine extracts keywords, compares skill sets, and provides a compatibility score along with matched/missing keywords, skill gaps, and actionable improvement tips.', 
    category: 'resume-analyzer', 
    order: 1 
  },
  { question: 'What file formats are supported?', 
    answer: 'We support PDF and DOCX file formats for resume upload. You can also paste your resume text directly into the text area if you prefer.', 
    category: 'resume-analyzer', 
    order: 2 
  },
  { question: 'How accurate is the resume scoring?', 
    answer: 'Our AI uses advanced NLP techniques such as keyword extraction, semantic similarity, and contextual matching to evaluate your resume against job requirements. The results provide actionable insights to help you optimize your resume for ATS and recruiters.', 
    category: 'resume-analyzer', 
    order: 3 
  },
  { question: 'How does Job Matching work?', 
    answer: 'Enter your skills, experience level, education, and preferred role. Our algorithm matches your profile against job requirements and ranks positions by compatibility percentage, helping you find the best-fit opportunities.', 
    category: 'job-matching', 
    order: 1 
  },
  { question: 'Can I customize CV templates?', 
    answer: 'Yes! All templates are fully customizable. Select a template, fill in your details in the Resume Builder, and see real-time preview updates. You can switch between templates at any time without losing your data.', 
    category: 'cv-templates', 
    order: 1 
  },
  { question: 'Can I download my resume as PDF?', 
    answer: 'Absolutely! Once you\'ve built your resume or generated a cover letter, click the "Download PDF" button to get a professionally formatted document ready for applications.', 
    category: 'cv-templates', 
    order: 2 
  },
  { question: 'What skills are assessed?', 
    answer: 'We offer assessments in Python, Machine Learning, SQL, Web Development, and Communication skills. Each assessment contains curated questions with instant feedback and a detailed score breakdown.', 
    category: 'skill-assessment', 
    order: 1 
  },
  { question: 'How long do skill assessments take?', 
    answer: 'Each skill assessment takes approximately 5 minutes to complete and contains 5 multiple-choice questions. You can retake assessments as many times as you\'d like to improve your score.', 
    category: 'skill-assessment', 
    order: 2 
  },
  
  // AI Mock Interview FAQs
  {
    question: 'What is the AI Mock Interview?',
    answer: 'The AI Mock Interview simulates real interview scenarios by asking role-specific technical and behavioral questions. It evaluates your answers and provides detailed feedback to help you improve your interview performance.',
    category: 'mock-interview',
    order: 1
  },
  {
    question: 'How does gesture and confidence analysis work?',
    answer: 'During the mock interview, our AI analyzes non-verbal communication such as eye contact, facial expressions, posture, and confidence indicators through your webcam. You receive personalized feedback to improve your overall interview presence.',
    category: 'mock-interview',
    order: 2
  },
  {
    question: 'Does the AI provide interview feedback?',
    answer: 'Yes. After each interview, you receive a detailed performance report covering communication skills, technical accuracy, confidence, body language, strengths, weaknesses, and personalized improvement suggestions.',
    category: 'mock-interview',
    order: 3
  },
  {
    question: 'Can I practice interviews for different job roles?',
    answer: 'Yes. You can choose different job roles and experience levels to practice customized interviews. The AI adapts its questions based on your selected role and difficulty level.',
    category: 'mock-interview',
    order: 4
  },
  {
    question: 'Is my webcam data stored?',
    answer: 'No. By default, webcam footage is processed only during the interview session for real-time analysis and is not permanently stored unless you explicitly choose to save recordings.',
    category: 'mock-interview',
    order: 5
  },
];

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ResuPrep');
    console.log('Connected to MongoDB');

    await Template.deleteMany({});
    await FAQ.deleteMany({});

    await Template.insertMany(templates);
    await FAQ.insertMany(faqs);

    console.log('✅ Seed data inserted successfully');
    console.log(`   ${templates.length} templates`);
    console.log(`   ${faqs.length} FAQs`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error.message);
    process.exit(1);
  }
};

seed();
