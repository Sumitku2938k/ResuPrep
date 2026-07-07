import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { analyzeResume } from '../services/storage';
import ScoreChart from '../components/ScoreChart';
import { HiUpload, HiDocumentText, HiRefresh, HiCheckCircle, HiXCircle, HiLightningBolt, HiQuestionMarkCircle } from 'react-icons/hi';

const rotatingMessages = [
  'Parsing your resume...',
  'Running NLP analysis...',
  'Extracting keywords...',
  'Computing similarity scores...',
  'Analyzing skill gaps...',
  'Generating improvement tips...',
];

const sampleResume = `John Doe
Full Stack Developer | john.doe@email.com | (555) 123-4567 | San Francisco, CA

SUMMARY
Experienced Full Stack Developer with 5+ years building scalable web applications using React, Node.js, and cloud technologies. Strong background in agile methodologies and cross-functional team collaboration.

EXPERIENCE
Senior Full Stack Developer — Tech Solutions Inc. (2021 – Present)
• Led development of microservices architecture serving 1M+ users
• Built React dashboard reducing customer support tickets by 40%
• Implemented CI/CD pipelines using GitHub Actions and Docker
• Mentored 3 junior developers through code reviews and pair programming

Full Stack Developer — Digital Agency Co. (2019 – 2021)
• Developed RESTful APIs using Node.js and Express
• Built responsive front-end applications with React and TypeScript
• Integrated payment systems (Stripe) processing $2M+ monthly
• Optimized database queries improving response time by 60%

EDUCATION
BS Computer Science — University of California, Berkeley (2019)

SKILLS
JavaScript, TypeScript, React, Node.js, Express, Python, MongoDB, PostgreSQL, Docker, AWS, Git, Agile, REST APIs, GraphQL, CI/CD, Redis, HTML, CSS, Tailwind`;

const sampleJD = `Full Stack Developer — Innovate Corp

We are looking for an experienced Full Stack Developer to join our engineering team. You will work on building and scaling our cloud-based SaaS platform.

Requirements:
• 4+ years of experience in full-stack web development
• Strong proficiency in JavaScript/TypeScript, React, and Node.js
• Experience with cloud platforms (AWS, GCP, or Azure)
• Database experience with both SQL and NoSQL databases
• Familiarity with containerization (Docker, Kubernetes)
• Experience with CI/CD pipelines and DevOps practices
• Understanding of RESTful API design and microservices
• Strong problem-solving and communication skills
• Experience with Agile/Scrum methodologies
• Knowledge of testing frameworks (Jest, Cypress)

Nice to have:
• Experience with GraphQL
• Knowledge of machine learning concepts
• Open source contributions
• Mentoring or leadership experience`;

export default function Analyzer() {
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [result, setResult] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (f) {
      if (f.size > 5 * 1024 * 1024) {
        toast.error('File size must be under 5MB');
        return;
      }
      setFile(f);
      toast.success(`File "${f.name}" selected`);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) {
      if (!['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(f.type)) {
        toast.error('Only PDF and DOCX files are supported');
        return;
      }
      setFile(f);
      toast.success(`File "${f.name}" selected`);
    }
  };

  const analyze = async () => {
    if (!jobDescription.trim()) {
      toast.error('Please enter a job description');
      return;
    }
    if (!file && !resumeText.trim()) {
      toast.error('Please upload a resume or paste resume text');
      return;
    }

    setLoading(true);
    setResult(null);

    let msgIndex = 0;
    setLoadingMsg(rotatingMessages[0]);
    const interval = setInterval(() => {
      msgIndex = (msgIndex + 1) % rotatingMessages.length;
      setLoadingMsg(rotatingMessages[msgIndex]);
    }, 1500);

    try {
      let text = resumeText;
      if (file) {
        text = await file.text();
      }

      const analysisResult = analyzeResume(text, jobDescription);

      setResult(analysisResult);
      toast.success('Analysis complete!');
    } catch (error) {
      toast.error('Analysis failed. Please try again.');
    } finally {
      clearInterval(interval);
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-heading font-black mb-3">
            Resume <span className="gradient-text">Analyzer</span>
          </h1>
          <p className="text-slate-400 max-w-xl mx-auto">Upload your resume and paste a job description. Our AI will score compatibility and provide actionable insights.</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left: Input Panel */}
          <div className="space-y-6">
            {/* File Upload */}
            <div className="glass-card p-6 !hover:transform-none">
              <h3 className="font-heading font-bold text-slate-200 mb-4 flex items-center gap-2">
                <HiUpload className="text-primary-500" /> Upload Resume
              </h3>
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
                  dragOver ? 'border-primary-500 bg-primary-500/5' : 'border-dark-300 hover:border-primary-500/50'
                }`}
                onClick={() => document.getElementById('fileInput').click()}
              >
                <input id="fileInput" type="file" accept=".pdf,.docx" onChange={handleFileChange} className="hidden" />
                {file ? (
                  <div className="flex items-center justify-center gap-3">
                    <HiDocumentText className="text-primary-500 text-2xl" />
                    <div>
                      <p className="text-sm font-medium text-slate-200">{file.name}</p>
                      <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <HiUpload className="mx-auto text-3xl text-slate-500 mb-2" />
                    <p className="text-sm text-slate-400">Drag & drop or click to upload</p>
                    <p className="text-xs text-slate-500 mt-1">PDF or DOCX • Max 5MB</p>
                  </>
                )}
              </div>

              <div className="mt-4">
                <p className="text-xs text-slate-500 mb-2">Or paste resume text:</p>
                <textarea
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  placeholder="Paste your resume text here..."
                  rows={5}
                  className="glow-input resize-none text-sm p-2"
                />
              </div>

              <button onClick={() => { setResumeText(sampleResume); setFile(null); toast.success('Sample resume loaded'); }} className="mt-3 text-xs text-primary-400 hover:text-primary-300 transition-colors">
                ⚡ Load Sample Resume
              </button>
            </div>

            {/* Job Description */}
            <div className="glass-card p-6 !hover:transform-none">
              <h3 className="font-heading font-bold text-slate-200 mb-4 flex items-center gap-2">
                <HiDocumentText className="text-cyan-500" /> Job Description
              </h3>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the target job description here..."
                rows={8}
                className="glow-input resize-none text-sm p-2"
              />
              <button onClick={() => { setJobDescription(sampleJD); toast.success('Sample JD loaded'); }} className="mt-3 text-xs text-primary-400 hover:text-primary-300 transition-colors">
                ⚡ Load Sample JD
              </button>
            </div>

            {/* Analyze Button */}
            <button
              onClick={analyze}
              disabled={loading}
              className="w-full btn-primary text-lg !py-4 flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {loadingMsg}
                </>
              ) : (
                <>
                  <HiLightningBolt /> Analyze Now
                </>
              )}
            </button>
          </div>

          {/* Right: Results Panel */}
          <div>
            <AnimatePresence mode="wait">
              {loading && !result && (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="glass-card p-12 flex flex-col items-center justify-center min-h-[400px]"
                >
                  <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mb-6" />
                  <p className="text-slate-300 font-medium animate-pulse">{loadingMsg}</p>
                </motion.div>
              )}

              {!loading && !result && (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="glass-card p-12 flex flex-col items-center justify-center min-h-[400px] text-center"
                >
                  <HiChartBar className="text-5xl text-slate-600 mb-4" />
                  <p className="text-slate-400 text-lg font-medium">Results will appear here</p>
                  <p className="text-slate-500 text-sm mt-2">Upload your resume and paste a job description to get started</p>
                </motion.div>
              )}

              {result && (
                <motion.div
                  key="results"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  {/* Score */}
                  <div className="glass-card p-6 flex flex-col items-center">
                    <ScoreChart score={result.compatibilityScore} size={180} />
                    <p className="text-sm text-slate-400 mt-2">{result.summary}</p>
                  </div>

                  {/* Matched Keywords */}
                  {result.matchedKeywords?.length > 0 && (
                    <div className="glass-card p-5 !hover:transform-none">
                      <h4 className="font-heading font-bold text-sm text-emerald-400 mb-3 flex items-center gap-2">
                        <HiCheckCircle /> Matched Keywords
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {result.matchedKeywords.map((kw) => (
                          <span key={kw} className="badge-green badge">{kw}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Missing Keywords */}
                  {result.missingKeywords?.length > 0 && (
                    <div className="glass-card p-5 !hover:transform-none">
                      <h4 className="font-heading font-bold text-sm text-red-400 mb-3 flex items-center gap-2">
                        <HiXCircle /> Missing Keywords
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {result.missingKeywords.map((kw) => (
                          <span key={kw} className="badge-red badge">{kw}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Skill Gaps */}
                  {result.skillGaps?.length > 0 && (
                    <div className="glass-card p-5 !hover:transform-none">
                      <h4 className="font-heading font-bold text-sm text-amber-400 mb-3">⚠️ Skill Gaps</h4>
                      <ul className="space-y-2">
                        {result.skillGaps.map((gap, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-slate-400">
                            <span className="w-1.5 h-1.5 mt-2 rounded-full bg-amber-400 flex-shrink-0" />
                            {gap}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Improvement Tips */}
                  {result.improvementTips?.length > 0 && (
                    <div className="glass-card p-5 !hover:transform-none">
                      <h4 className="font-heading font-bold text-sm text-primary-400 mb-3">💡 Improvement Tips</h4>
                      <ol className="space-y-2">
                        {result.improvementTips.map((tip, i) => (
                          <li key={i} className="flex items-start gap-3 text-sm text-slate-400">
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-500/10 text-primary-400 text-xs font-bold flex items-center justify-center">
                              {i + 1}
                            </span>
                            {tip}
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {/* Interview Questions */}
                  {result.interviewQuestions && (
                    <div className="glass-card p-5 !hover:transform-none border-l-2 border-fuchsia-500">
                      <h4 className="font-heading font-bold text-sm text-fuchsia-400 mb-4 flex items-center gap-2">
                        <HiQuestionMarkCircle /> Potential Interview Questions
                      </h4>
                      <div className="space-y-5">
                        <div>
                          <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Technical</h5>
                          <ul className="space-y-2">
                            {result.interviewQuestions.technical.map((q, i) => (
                              <li key={`tech-${i}`} className="flex items-start gap-2 text-sm text-slate-300">
                                <span className="w-1.5 h-1.5 mt-2 rounded-full bg-fuchsia-500/50 flex-shrink-0" />
                                {q}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">HR & Behavioral</h5>
                          <ul className="space-y-2">
                            {result.interviewQuestions.hr.map((q, i) => (
                              <li key={`hr-${i}`} className="flex items-start gap-2 text-sm text-slate-300">
                                <span className="w-1.5 h-1.5 mt-2 rounded-full bg-cyan-500/50 flex-shrink-0" />
                                {q}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Project Based</h5>
                          <ul className="space-y-2">
                            {result.interviewQuestions.project.map((q, i) => (
                              <li key={`proj-${i}`} className="flex items-start gap-2 text-sm text-slate-300">
                                <span className="w-1.5 h-1.5 mt-2 rounded-full bg-amber-500/50 flex-shrink-0" />
                                {q}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function HiChartBar(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props} width="1em" height="1em">
      <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
    </svg>
  );
}
