import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { analyzeResumeApi, getResumeHistoryApi, deleteResumeAnalysisApi } from '../api/resume';
import ScoreChart from '../components/ScoreChart';
import {
  HiUpload,
  HiDocumentText,
  HiRefresh,
  HiCheckCircle,
  HiXCircle,
  HiLightningBolt,
  HiQuestionMarkCircle,
  HiX,
  HiClock,
  HiTrash,
  HiEye,
} from 'react-icons/hi';

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

/**
 * Safely validate and normalize the backend analysis response.
 * Preserves the backend response as the authoritative source of truth.
 * Guards against malformed data, non-numeric scores, and missing arrays.
 */
function normalizeAnalysisResult(rawResult) {
  if (!rawResult || typeof rawResult !== 'object') {
    throw new Error('We received an unexpected analysis response. Please try again.');
  }

  // Validate score: must be a number or numeric string between 0 and 100
  const rawScore = rawResult.compatibilityScore;
  if (rawScore === undefined || rawScore === null) {
    throw new Error('We received an unexpected analysis response (missing score). Please try again.');
  }

  const parsedScore = typeof rawScore === 'number'
    ? rawScore
    : typeof rawScore === 'string' && !isNaN(Number(rawScore))
      ? Number(rawScore)
      : NaN;

  if (isNaN(parsedScore) || !isFinite(parsedScore) || parsedScore < 0 || parsedScore > 100) {
    throw new Error('We received an unexpected analysis response (invalid score). Please try again.');
  }

  // Array validations: ensure clean arrays without creating artificial items
  const matchedKeywords = Array.isArray(rawResult.matchedKeywords)
    ? rawResult.matchedKeywords.filter((k) => typeof k === 'string' && k.trim().length > 0)
    : [];

  const missingKeywords = Array.isArray(rawResult.missingKeywords)
    ? rawResult.missingKeywords.filter((k) => typeof k === 'string' && k.trim().length > 0)
    : [];

  const skillGaps = Array.isArray(rawResult.skillGaps)
    ? rawResult.skillGaps.filter((g) => typeof g === 'string' && g.trim().length > 0)
    : [];

  const improvementTips = Array.isArray(rawResult.improvementTips)
    ? rawResult.improvementTips.filter((t) => typeof t === 'string' && t.trim().length > 0)
    : [];

  const summary = typeof rawResult.summary === 'string' ? rawResult.summary.trim() : '';

  let interviewQuestions = null;
  if (rawResult.interviewQuestions && typeof rawResult.interviewQuestions === 'object') {
    const iq = rawResult.interviewQuestions;
    const technical = Array.isArray(iq.technical) ? iq.technical.filter((q) => typeof q === 'string') : [];
    const hr = Array.isArray(iq.hr) ? iq.hr.filter((q) => typeof q === 'string') : [];
    const project = Array.isArray(iq.project) ? iq.project.filter((q) => typeof q === 'string') : [];
    if (technical.length > 0 || hr.length > 0 || project.length > 0) {
      interviewQuestions = { technical, hr, project };
    }
  }

  return {
    compatibilityScore: Math.round(parsedScore),
    matchedKeywords,
    missingKeywords,
    skillGaps,
    improvementTips,
    summary,
    interviewQuestions,
  };
}

export default function Analyzer() {
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState(null);
  const [selectedHistoryId, setSelectedHistoryId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const fetchHistory = async () => {
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const res = await getResumeHistoryApi();
      if (res?.success && Array.isArray(res?.data?.analyses)) {
        setHistory(res.data.analyses);
      } else {
        setHistory([]);
      }
    } catch (err) {
      setHistoryError(err?.message || 'Failed to load analysis history');
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleDeleteHistory = async (e, id) => {
    e.stopPropagation();
    if (!id) return;
    setDeletingId(id);
    try {
      const res = await deleteResumeAnalysisApi(id);
      if (res?.success) {
        setHistory((prev) => prev.filter((item) => item._id !== id));
        toast.success('Analysis deleted from history');
        if (selectedHistoryId === id) {
          setSelectedHistoryId(null);
        }
      } else {
        toast.error(res?.message || 'Failed to delete analysis');
      }
    } catch (err) {
      toast.error(err?.message || 'Failed to delete analysis');
    } finally {
      setDeletingId(null);
    }
  };

  const handleSelectHistory = (item) => {
    if (!item?.result) return;
    try {
      const validated = normalizeAnalysisResult(item.result);
      setResult(validated);
      setSelectedHistoryId(item._id);
      setError(null);
      toast.success(`Loaded analysis from ${new Date(item.createdAt).toLocaleDateString()}`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      toast.error('Could not display this saved analysis');
    }
  };

  const isResultEmpty = Boolean(
    result &&
    (!result.matchedKeywords || result.matchedKeywords.length === 0) &&
    (!result.missingKeywords || result.missingKeywords.length === 0) &&
    (!result.skillGaps || result.skillGaps.length === 0) &&
    (!result.improvementTips || result.improvementTips.length === 0) &&
    !result.summary
  );

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (f) {
      if (f.size > 5 * 1024 * 1024) {
        toast.error('File size must be under 5MB');
        return;
      }
      setFile(f);
      setError(null);
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
      if (f.size > 5 * 1024 * 1024) {
        toast.error('File size must be under 5MB');
        return;
      }
      setFile(f);
      setError(null);
      toast.success(`File "${f.name}" selected`);
    }
  };

  const handleClearFile = (e) => {
    if (e) e.stopPropagation();
    setFile(null);
    const fileInput = document.getElementById('fileInput');
    if (fileInput) fileInput.value = '';
  };

  const handleReset = () => {
    setFile(null);
    setResumeText('');
    setJobDescription('');
    setResult(null);
    setError(null);
    setSelectedHistoryId(null);
    const fileInput = document.getElementById('fileInput');
    if (fileInput) fileInput.value = '';
    toast.success('Reset ready for new analysis');
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
    setError(null);
    setResult(null);

    try {
      let response;
      if (file) {
        response = await analyzeResumeApi({ file, jobDescription: jobDescription.trim() });
      } else {
        response = await analyzeResumeApi({ resumeText: resumeText.trim(), jobDescription: jobDescription.trim() });
      }

      if (!response || typeof response !== 'object') {
        throw new Error('We received an unexpected analysis response. Please try again.');
      }

      const rawResult = response?.data?.analysis?.result;
      if (!rawResult || typeof rawResult !== 'object') {
        throw new Error('We received an unexpected analysis response. Please try again.');
      }

      const validatedResult = normalizeAnalysisResult(rawResult);

      setResult(validatedResult);
      setSelectedHistoryId(response?.data?.analysis?._id || null);
      toast.success('Analysis complete!');
      fetchHistory();
    } catch (err) {
      const errMsg = err?.message || 'Analysis failed. Please try again.';
      setError(errMsg);
      toast.error(errMsg);
    } finally {
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
                    <div className="text-left">
                      <p className="text-sm font-medium text-slate-200">{file.name}</p>
                      <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleClearFile}
                      className="ml-2 p-1 text-slate-400 hover:text-red-400 transition-colors"
                      title="Remove file"
                    >
                      <HiX className="text-lg" />
                    </button>
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
                  onChange={(e) => {
                    setResumeText(e.target.value);
                    setError(null);
                  }}
                  placeholder="Paste your resume text here..."
                  rows={5}
                  className="glow-input resize-none text-sm p-2"
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  setResumeText(sampleResume);
                  setFile(null);
                  setError(null);
                  const fileInput = document.getElementById('fileInput');
                  if (fileInput) fileInput.value = '';
                  toast.success('Sample resume loaded');
                }}
                className="mt-3 text-xs text-primary-400 hover:text-primary-300 transition-colors"
              >
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
                onChange={(e) => {
                  setJobDescription(e.target.value);
                  setError(null);
                }}
                placeholder="Paste the target job description here..."
                rows={8}
                className="glow-input resize-none text-sm p-2"
              />
              <button
                type="button"
                onClick={() => {
                  setJobDescription(sampleJD);
                  setError(null);
                  toast.success('Sample JD loaded');
                }}
                className="mt-3 text-xs text-primary-400 hover:text-primary-300 transition-colors"
              >
                ⚡ Load Sample JD
              </button>
            </div>

            {/* Analyze & Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={analyze}
                disabled={loading}
                className="flex-1 btn-primary text-lg !py-4 flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Analyzing resume...
                  </>
                ) : (
                  <>
                    <HiLightningBolt /> Analyze Now
                  </>
                )}
              </button>
              {(file || resumeText || jobDescription || result || error) && (
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={loading}
                  className="px-4 btn-secondary text-sm flex items-center justify-center gap-1.5 hover:text-red-400 transition-colors disabled:opacity-50"
                  title="Reset all inputs"
                >
                  <HiRefresh /> Reset
                </button>
              )}
            </div>
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
                  <p className="text-slate-300 font-medium">Analyzing resume against job description...</p>
                  <p className="text-xs text-slate-500 mt-2">Extracting skills, computing compatibility & generating tips</p>
                </motion.div>
              )}

              {!loading && error && !result && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-card p-8 border-red-500/30 flex flex-col items-center justify-center min-h-[400px] text-center"
                >
                  <HiXCircle className="text-5xl text-red-400 mb-4" />
                  <h3 className="text-lg font-bold text-slate-200 mb-2">Analysis Failed</h3>
                  <p className="text-sm text-red-300 max-w-md mb-6">{error}</p>
                  <button
                    type="button"
                    onClick={analyze}
                    className="btn-primary text-sm !py-2 px-6 flex items-center gap-2"
                  >
                    <HiRefresh /> Try Again
                  </button>
                </motion.div>
              )}

              {!loading && !result && !error && (
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
                  {/* Result Header Action */}
                  <div className="flex items-center justify-between px-1">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Analysis Result</span>
                    <button
                      type="button"
                      onClick={handleReset}
                      className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1 transition-colors"
                    >
                      <HiRefresh /> New Analysis
                    </button>
                  </div>

                  {/* Score & Summary */}
                  <div className="glass-card p-6 flex flex-col items-center text-center">
                    <ScoreChart score={result.compatibilityScore} size={180} />
                    {result.summary ? (
                      <p className="text-sm text-slate-400 mt-3 max-w-lg">{result.summary}</p>
                    ) : isResultEmpty ? (
                      <p className="text-sm text-slate-400 mt-3 max-w-lg">
                        No detailed keywords, skill gaps, or recommendations were found for this comparison.
                      </p>
                    ) : null}
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

        {/* Analysis History Section */}
        <div className="mt-14 pt-10 border-t border-dark-300/60">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-heading font-black flex items-center gap-2">
                <HiClock className="text-primary-500" /> Analysis <span className="gradient-text">History</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Your past resume analyses saved securely in your account.
              </p>
            </div>
            <button
              type="button"
              onClick={fetchHistory}
              disabled={historyLoading}
              className="btn-secondary text-xs sm:text-sm flex items-center gap-1.5 px-3 py-2 self-start sm:self-auto disabled:opacity-50"
              title="Refresh history"
            >
              <HiRefresh className={historyLoading ? 'animate-spin' : ''} /> Refresh History
            </button>
          </div>

          {/* Loading State */}
          {historyLoading && history.length === 0 && (
            <div className="glass-card p-10 flex flex-col items-center justify-center text-center">
              <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-slate-300 text-sm font-medium">Loading your analysis history...</p>
            </div>
          )}

          {/* Error State */}
          {!historyLoading && historyError && (
            <div className="glass-card p-8 border-red-500/30 text-center">
              <HiXCircle className="text-4xl text-red-400 mx-auto mb-2" />
              <p className="text-red-300 text-sm mb-4">{historyError}</p>
              <button
                type="button"
                onClick={fetchHistory}
                className="btn-primary text-xs px-4 py-2"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Empty State */}
          {!historyLoading && !historyError && history.length === 0 && (
            <div className="glass-card p-10 text-center">
              <HiDocumentText className="text-4xl text-slate-600 mx-auto mb-2" />
              <p className="text-slate-300 font-medium">No previous analyses found</p>
              <p className="text-slate-500 text-xs mt-1 max-w-md mx-auto">
                Upload a resume and job description above to generate and save your first analysis.
              </p>
            </div>
          )}

          {/* History Grid */}
          {!historyError && history.length > 0 && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {history.map((item) => {
                const score = item.result?.compatibilityScore ?? 0;
                const scoreColor =
                  score >= 75
                    ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
                    : score >= 50
                      ? 'text-amber-400 border-amber-500/30 bg-amber-500/10'
                      : 'text-red-400 border-red-500/30 bg-red-500/10';
                const isSelected = selectedHistoryId === item._id;

                return (
                  <div
                    key={item._id}
                    className={`glass-card p-5 transition-all flex flex-col justify-between ${
                      isSelected ? 'border-primary-500 ring-1 ring-primary-500' : 'hover:border-primary-500/40'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <HiDocumentText className="text-primary-400 text-lg flex-shrink-0" />
                          <span
                            className="text-sm font-semibold text-slate-200 truncate"
                            title={item.fileName || 'Text Resume Analysis'}
                          >
                            {item.fileName || 'Text Resume Analysis'}
                          </span>
                        </div>
                        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${scoreColor}`}>
                          {score}%
                        </span>
                      </div>

                      <p className="text-xs text-slate-400 line-clamp-2 mb-4">
                        {item.result?.summary || 'No summary available.'}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-700/50 text-xs">
                      <span className="text-slate-500 flex items-center gap-1">
                        <HiClock className="text-slate-500 text-xs" />
                        {new Date(item.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleSelectHistory(item)}
                          className="text-primary-400 hover:text-primary-300 font-medium flex items-center gap-1 transition-colors px-2 py-1 rounded hover:bg-primary-500/10"
                          title="View this analysis in result panel"
                        >
                          <HiEye /> View
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteHistory(e, item._id)}
                          disabled={deletingId === item._id}
                          className="text-slate-400 hover:text-red-400 transition-colors p-1 rounded hover:bg-red-500/10 disabled:opacity-50"
                          title="Delete this analysis"
                        >
                          {deletingId === item._id ? (
                            <div className="w-3.5 h-3.5 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <HiTrash className="text-sm" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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
