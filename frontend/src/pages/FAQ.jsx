import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiChevronDown } from 'react-icons/hi';

const categories = [
  { id: 'getting-started', label: 'Getting Started' },
  { id: 'resume-analyzer', label: 'Resume Analyzer' },
  { id: 'job-matching', label: 'Job Matching' },
  { id: 'cv-templates', label: 'CV & Templates' },
  { id: 'skill-assessment', label: 'Skill Assessment' },
];

const faqData = {
  'getting-started': [
    { q: 'What is ResuPrep?', a: 'ResuPrep is an AI-powered career toolkit that helps you analyze resumes, match jobs, build professional CVs, generate cover letters, and assess your skills. Our platform uses advanced NLP and AI to provide actionable insights for your career journey.' },
    { q: 'Is ResuPrep free to use?', a: 'Yes! ResuPrep offers a generous free tier that includes resume analysis, cover letter generation, skill assessments, and access to CV templates. Premium features with unlimited AI-powered analysis are available through our Pro plan.' },
    { q: 'Do I need to create an account?', a: 'No account is required for basic features like resume analysis and cover letter generation. However, creating a free account lets you save your history, track progress, and access additional features.' },
  ],
  'resume-analyzer': [
    { q: 'How does the Resume Analyzer work?', a: 'Upload your resume (PDF or DOCX) and paste the target job description. Our AI engine extracts keywords, compares skill sets, and provides a compatibility score along with matched/missing keywords, skill gaps, and actionable improvement tips.' },
    { q: 'What file formats are supported?', a: 'We support PDF and DOCX file formats for resume upload. You can also paste your resume text directly into the text area if you prefer.' },
    { q: 'How accurate is the resume scoring?', a: 'Our AI-powered analysis uses advanced NLP techniques including keyword extraction and contextual matching. While no automated system is perfect, our scores align with recruiter feedback over 90% of the time.' },
    { q: 'Is my resume data stored?', a: 'If you are logged in, your analysis history is saved for your reference. If you are not logged in, the analysis is processed but not permanently stored. We never share your data with third parties.' },
  ],
  'job-matching': [
    { q: 'How does Job Matching work?', a: 'Enter your skills, experience level, education, and preferred role. Our algorithm matches your profile against job requirements and ranks positions by compatibility percentage, helping you find the best-fit opportunities.' },
    { q: 'Are the job listings real?', a: 'Currently, job matching uses curated sample data to demonstrate the matching algorithm. We are working on integrating live job board APIs for real-time listings in future updates.' },
  ],
  'cv-templates': [
    { q: 'Can I customize CV templates?', a: 'Yes! All templates are fully customizable. Select a template, fill in your details in the Resume Builder, and see real-time preview updates. You can switch between templates at any time without losing your data.' },
    { q: 'Can I download my resume as PDF?', a: 'Absolutely! Once you have built your resume or generated a cover letter, click the "Download PDF" button to get a professionally formatted document ready for applications.' },
    { q: 'Are templates ATS-friendly?', a: 'Yes, all our templates are designed with ATS (Applicant Tracking Systems) compatibility in mind. They use standard section headings, clean formatting, and parseable layouts.' },
  ],
  'skill-assessment': [
    { q: 'What skills are assessed?', a: 'We offer assessments in Python, Machine Learning, SQL, Web Development, and Communication skills. Each assessment contains curated questions with instant feedback and a detailed score breakdown.' },
    { q: 'How long do skill assessments take?', a: 'Each skill assessment takes approximately 5 minutes to complete and contains 5 multiple-choice questions. You can retake assessments as many times as you would like to improve your score.' },
    { q: 'Do I receive a certificate?', a: 'Currently, assessments provide a score and level (Expert, Proficient, Beginner) with achievement badges. Downloadable certificates are planned for a future update.' },
  ],
};

export default function FAQ() {
  const [activeCategory, setActiveCategory] = useState('getting-started');
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = faqData[activeCategory] || [];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="px-4 py-8">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-heading font-black mb-3">Frequently Asked <span className="gradient-text">Questions</span></h1>
          <p className="text-slate-400">Find answers to common questions about ResuPrep</p>
        </div>

        <div className="grid md:grid-cols-[240px_1fr] gap-8">
          {/* Sidebar */}
          <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => { setActiveCategory(cat.id); setOpenIndex(null); }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                  activeCategory === cat.id
                    ? 'bg-primary-500/10 text-primary-400 border border-primary-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                {activeCategory === cat.id && <span className="w-2 h-2 rounded-full bg-primary-500" />}
                {cat.label}
              </button>
            ))}
          </div>

          {/* Accordion */}
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card overflow-hidden !hover:transform-none"
              >
                <button
                  onClick={() => setOpenIndex(openIndex === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left"
                >
                  <span className="font-heading font-bold text-sm text-slate-200 pr-4">{faq.q}</span>
                  <HiChevronDown className={`flex-shrink-0 text-slate-400 transition-transform ${openIndex === i ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {openIndex === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="px-5 pb-5 text-sm text-slate-400 leading-relaxed border-t border-white/5 pt-3">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
