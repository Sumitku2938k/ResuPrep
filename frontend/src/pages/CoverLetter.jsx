import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  HiDownload,
  HiSparkles,
  HiTrash,
  HiOutlineDocumentText,
  HiCheck,
  HiLockClosed,
  HiRefresh,
  HiPencil,
  HiEye,
} from 'react-icons/hi';
import { useAuth } from '../hooks/useAuth.js';
import {
  generateCoverLetterApi,
  getCoverLettersApi,
  updateCoverLetterApi,
  deleteCoverLetterApi,
} from '../api/coverLetter.js';

const tones = [
  { id: 'professional', label: 'Professional', emoji: '👔' },
  { id: 'enthusiastic', label: 'Enthusiastic', emoji: '🔥' },
  { id: 'concise', label: 'Concise', emoji: '⚡' },
];

export default function CoverLetter() {
  const { user } = useAuth();

  const [form, setForm] = useState({
    name: '',
    jobTitle: '',
    company: '',
    hiringManager: 'Hiring Manager',
    keySkills: '',
    achievement: '',
    tone: 'professional',
  });

  const [letter, setLetter] = useState('');
  const [activeLetterId, setActiveLetterId] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Saved cover letters state
  const [savedLetters, setSavedLetters] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const previewRef = useRef(null);

  // Fetch saved letters from backend
  const fetchSavedLetters = useCallback(async () => {
    if (!user) {
      setSavedLetters([]);
      setHistoryLoading(false);
      return;
    }

    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const res = await getCoverLettersApi();
      if (res?.success && Array.isArray(res?.data?.coverLetters)) {
        setSavedLetters(res.data.coverLetters);
      } else {
        setSavedLetters([]);
      }
    } catch (err) {
      setHistoryError(err?.message || 'Failed to load saved cover letters');
    } finally {
      setHistoryLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSavedLetters();
  }, [fetchSavedLetters]);

  // Form input changes
  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (activeLetterId) {
      setIsDirty(true);
    }
  };

  // Generate cover letter via backend AI pipeline
  const handleGenerateLetter = async () => {
    const { name, jobTitle, company, hiringManager, keySkills, achievement, tone } = form;

    if (!name.trim()) {
      toast.error('Please enter your full name');
      return;
    }
    if (!jobTitle.trim()) {
      toast.error('Please enter the target job title');
      return;
    }
    if (!company.trim()) {
      toast.error('Please enter the target company name');
      return;
    }

    setGenerating(true);
    try {
      const payload = {
        name: name.trim(),
        jobTitle: jobTitle.trim(),
        company: company.trim(),
        hiringManager: hiringManager.trim() || 'Hiring Manager',
        keySkills: keySkills.trim(),
        achievement: achievement.trim(),
        tone,
      };

      const res = await generateCoverLetterApi(payload);
      const generated = res?.data?.coverLetter;

      if (!generated || !generated.generatedLetter) {
        throw new Error('Backend did not return generated letter text');
      }

      setLetter(generated.generatedLetter);
      setActiveLetterId(generated._id || null);
      setIsDirty(false);
      setIsEditing(false);

      toast.success(
        user
          ? 'Cover letter generated & saved to your account!'
          : 'Cover letter generated successfully!'
      );

      // Refresh saved letters for authenticated users
      if (user) {
        fetchSavedLetters();
      }
    } catch (err) {
      toast.error(err?.message || 'Failed to generate cover letter. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  // Save manual updates to existing letter
  const handleUpdateLetter = async () => {
    if (!activeLetterId) {
      toast.error('No saved cover letter is currently selected');
      return;
    }

    if (!letter.trim()) {
      toast.error('Cover letter content cannot be empty');
      return;
    }

    setSaving(true);
    try {
      const updatePayload = {
        name: form.name.trim() || undefined,
        jobTitle: form.jobTitle.trim() || undefined,
        company: form.company.trim() || undefined,
        hiringManager: form.hiringManager.trim() || undefined,
        keySkills: form.keySkills.trim() || undefined,
        achievement: form.achievement.trim() || undefined,
        tone: form.tone,
        generatedLetter: letter,
      };

      const res = await updateCoverLetterApi(activeLetterId, updatePayload);
      const updatedDoc = res?.data?.coverLetter;

      setIsDirty(false);
      setIsEditing(false);
      toast.success('Cover letter updated successfully!');

      if (updatedDoc) {
        setSavedLetters((prev) =>
          prev.map((item) => (item._id === activeLetterId ? { ...item, ...updatedDoc } : item))
        );
      } else {
        fetchSavedLetters();
      }
    } catch (err) {
      toast.error(err?.message || 'Failed to update cover letter');
    } finally {
      setSaving(false);
    }
  };

  // Open a saved letter from history
  const handleOpenSavedLetter = (savedItem) => {
    if (isDirty) {
      const confirmOpen = window.confirm(
        'You have unsaved changes in the active letter. Open another letter anyway?'
      );
      if (!confirmOpen) return;
    }

    setForm({
      name: savedItem.name || '',
      jobTitle: savedItem.jobTitle || '',
      company: savedItem.company || '',
      hiringManager: savedItem.hiringManager || 'Hiring Manager',
      keySkills: savedItem.keySkills || '',
      achievement: savedItem.achievement || '',
      tone: savedItem.tone || 'professional',
    });

    setLetter(savedItem.generatedLetter || '');
    setActiveLetterId(savedItem._id);
    setIsDirty(false);
    setIsEditing(false);

    toast.success(`Loaded letter for ${savedItem.company || 'saved role'}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Delete a saved letter
  const handleDeleteSavedLetter = async (id, e) => {
    e.stopPropagation();

    const confirmed = window.confirm('Are you sure you want to delete this saved cover letter?');
    if (!confirmed) return;

    setDeletingId(id);
    try {
      await deleteCoverLetterApi(id);
      setSavedLetters((prev) => prev.filter((item) => item._id !== id));
      toast.success('Cover letter deleted successfully');

      if (activeLetterId === id) {
        setActiveLetterId(null);
        setIsDirty(false);
      }
    } catch (err) {
      toast.error(err?.message || 'Failed to delete cover letter');
    } finally {
      setDeletingId(null);
    }
  };

  // Reset form to write a new cover letter
  const handleNewLetter = () => {
    if (isDirty) {
      const confirmed = window.confirm('Discard unsaved changes and start a new cover letter?');
      if (!confirmed) return;
    }

    setForm({
      name: '',
      jobTitle: '',
      company: '',
      hiringManager: 'Hiring Manager',
      keySkills: '',
      achievement: '',
      tone: 'professional',
    });
    setLetter('');
    setActiveLetterId(null);
    setIsDirty(false);
    setIsEditing(false);
  };

  // Download PDF
  const downloadPDF = async () => {
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      html2pdf()
        .set({
          margin: 10,
          filename: `cover-letter-${form.company || 'output'}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2 },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        })
        .from(previewRef.current)
        .save();
      toast.success('Downloading PDF...');
    } catch (err) {
      toast.error('PDF download failed');
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="px-4 py-8">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl sm:text-4xl font-heading font-black mb-3">
            Cover Letter <span className="gradient-text">Generator</span>
          </h1>
          <p className="text-slate-400 max-w-xl mx-auto">
            Generate AI-tailored cover letters powered by OpenAI and manage your saved applications in one place.
          </p>
        </div>

        {/* Main Grid: Form + Live Preview */}
        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* Left Column: Form */}
          <div className="glass-card p-6 !hover:transform-none space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-dark-300">
              <h2 className="text-lg font-heading font-bold text-white flex items-center gap-2">
                <HiSparkles className="text-primary-400" /> Application Details
              </h2>
              {(activeLetterId || letter) && (
                <button
                  type="button"
                  onClick={handleNewLetter}
                  className="text-xs text-primary-400 hover:text-primary-300 font-medium transition-colors"
                >
                  + New Letter
                </button>
              )}
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1 font-medium">Your Full Name *</label>
              <input
                placeholder="e.g. Alex Morgan"
                value={form.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="glow-input text-sm p-2.5 w-full"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1 font-medium">Target Job Title *</label>
                <input
                  placeholder="e.g. Senior Frontend Engineer"
                  value={form.jobTitle}
                  onChange={(e) => handleChange('jobTitle', e.target.value)}
                  className="glow-input text-sm p-2.5 w-full"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1 font-medium">Target Company *</label>
                <input
                  placeholder="e.g. Acme Corporation"
                  value={form.company}
                  onChange={(e) => handleChange('company', e.target.value)}
                  className="glow-input text-sm p-2.5 w-full"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1 font-medium">Hiring Manager Name (Optional)</label>
              <input
                placeholder="e.g. Jane Smith (defaults to 'Hiring Manager')"
                value={form.hiringManager}
                onChange={(e) => handleChange('hiringManager', e.target.value)}
                className="glow-input text-sm p-2.5 w-full"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1 font-medium">Key Skills & Technologies</label>
              <input
                placeholder="e.g. React, TypeScript, Node.js, Cloud Architecture"
                value={form.keySkills}
                onChange={(e) => handleChange('keySkills', e.target.value)}
                className="glow-input text-sm p-2.5 w-full"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1 font-medium">Notable Achievement / Project</label>
              <textarea
                placeholder="e.g. Spearheaded frontend refactor that cut bundle size by 42% and boosted core web vitals"
                rows={2}
                value={form.achievement}
                onChange={(e) => handleChange('achievement', e.target.value)}
                className="glow-input text-sm p-2.5 w-full resize-none"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-2 font-medium">Writing Tone:</label>
              <div className="flex gap-2">
                {tones.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleChange('tone', t.id)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      form.tone === t.id
                        ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25 ring-2 ring-primary-400'
                        : 'bg-dark-200 text-slate-400 hover:bg-dark-300'
                    }`}
                  >
                    {t.emoji} {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Generate Action Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleGenerateLetter}
                disabled={generating || !form.name.trim() || !form.jobTitle.trim() || !form.company.trim()}
                className="btn-primary w-full py-3 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-primary-500/20"
              >
                {generating ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Generating Cover Letter...
                  </>
                ) : (
                  <>
                    <HiSparkles className="text-lg" /> Generate Cover Letter with AI
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Column: Preview & Editor */}
          <div className="space-y-3">
            {/* Action Bar Above Preview */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {activeLetterId && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <HiCheck /> Saved to Cloud
                  </span>
                )}
                {isDirty && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    Unsaved Edits
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {letter && (
                  <button
                    type="button"
                    onClick={() => setIsEditing(!isEditing)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-dark-200 text-slate-300 hover:bg-dark-300 transition-colors flex items-center gap-1.5"
                  >
                    {isEditing ? (
                      <>
                        <HiEye className="text-sm" /> Preview View
                      </>
                    ) : (
                      <>
                        <HiPencil className="text-sm" /> Edit Text
                      </>
                    )}
                  </button>
                )}

                {activeLetterId && isDirty && (
                  <button
                    type="button"
                    onClick={handleUpdateLetter}
                    disabled={saving}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors flex items-center gap-1.5 shadow-md shadow-emerald-600/20 disabled:opacity-50"
                  >
                    {saving ? (
                      'Saving...'
                    ) : (
                      <>
                        <HiCheck className="text-sm" /> Save Changes
                      </>
                    )}
                  </button>
                )}

                <button
                  type="button"
                  onClick={downloadPDF}
                  disabled={!letter}
                  className="btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <HiDownload className="text-sm" /> Download PDF
                </button>
              </div>
            </div>

            {/* Letter Paper Container */}
            <div className="glass-card p-1 !hover:transform-none">
              <div ref={previewRef} className="resume-paper rounded-lg p-8 min-h-[460px] relative">
                {letter ? (
                  isEditing ? (
                    <div>
                      <p className="text-xs text-gray-500 mb-2 font-mono">
                        // Editing mode: Type below to adjust your letter directly
                      </p>
                      <textarea
                        value={letter}
                        onChange={(e) => {
                          setLetter(e.target.value);
                          setIsDirty(true);
                        }}
                        rows={16}
                        className="w-full text-sm text-gray-800 leading-relaxed font-sans bg-transparent border border-gray-300 rounded p-3 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-y"
                        style={{ fontFamily: 'DM Sans, sans-serif' }}
                      />
                    </div>
                  ) : (
                    <div
                      className="text-sm text-gray-800 leading-relaxed whitespace-pre-line"
                      style={{ fontFamily: 'DM Sans, sans-serif' }}
                    >
                      {letter}
                    </div>
                  )
                ) : (
                  <div className="flex flex-col items-center justify-center h-80 text-center px-4 text-gray-400">
                    <HiOutlineDocumentText className="text-5xl text-gray-300 mb-3" />
                    <p className="font-medium text-gray-600 mb-1">Your AI-generated cover letter will appear here</p>
                    <p className="text-xs text-gray-400 max-w-sm">
                      Complete your name, job title, and company on the left, then click{' '}
                      <span className="font-semibold text-primary-600">"Generate Cover Letter with AI"</span>.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Section: Saved Cover Letters */}
        <div className="space-y-4 pt-4 border-t border-dark-300">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-heading font-bold text-white flex items-center gap-2">
                <HiOutlineDocumentText className="text-primary-400" /> Saved Cover Letters
              </h2>
              <p className="text-xs text-slate-400">
                Access, edit, or export your saved cover letters from previous applications.
              </p>
            </div>
            {user && (
              <button
                type="button"
                onClick={fetchSavedLetters}
                disabled={historyLoading}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors"
                title="Refresh saved letters"
              >
                <HiRefresh className={historyLoading ? 'animate-spin' : ''} /> Refresh
              </button>
            )}
          </div>

          {/* Unauthenticated View */}
          {!user ? (
            <div className="glass-card p-6 text-center space-y-3">
              <HiLockClosed className="mx-auto text-3xl text-amber-400" />
              <h3 className="text-base font-semibold text-white">Save & Manage Cover Letters</h3>
              <p className="text-sm text-slate-400 max-w-md mx-auto">
                Sign in or create an account to automatically save your generated cover letters, edit them across
                sessions, and download them anytime.
              </p>
              <div>
                <Link to="/login" className="btn-primary inline-flex items-center gap-2 text-xs py-2 px-4 font-semibold">
                  Sign In to View Saved Letters
                </Link>
              </div>
            </div>
          ) : historyLoading ? (
            /* Loading State */
            <div className="glass-card p-8 text-center space-y-3">
              <svg
                className="animate-spin h-6 w-6 text-primary-400 mx-auto"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <p className="text-sm text-slate-400">Loading your saved cover letters...</p>
            </div>
          ) : historyError ? (
            /* Error State */
            <div className="glass-card p-6 text-center space-y-3 border border-red-500/20 bg-red-500/5">
              <p className="text-sm text-red-400">{historyError}</p>
              <button
                type="button"
                onClick={fetchSavedLetters}
                className="px-4 py-1.5 rounded-lg text-xs font-medium bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : savedLetters.length === 0 ? (
            /* Empty State */
            <div className="glass-card p-8 text-center space-y-2">
              <HiOutlineDocumentText className="mx-auto text-3xl text-slate-500" />
              <p className="text-sm font-medium text-slate-300">No saved cover letters found</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Fill in the form above and click "Generate Cover Letter with AI" to automatically save your first letter.
              </p>
            </div>
          ) : (
            /* Saved Letters Grid */
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedLetters.map((item) => {
                const isActive = activeLetterId === item._id;
                const toneObj = tones.find((t) => t.id === item.tone) || tones[0];
                const dateStr = item.createdAt
                  ? new Date(item.createdAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })
                  : 'Recent';

                return (
                  <div
                    key={item._id}
                    className={`glass-card p-4 space-y-3 transition-all ${
                      isActive ? 'ring-2 ring-primary-500/80 bg-primary-500/5' : 'hover:border-primary-500/30'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-white truncate">{item.company || 'Untitled Company'}</h4>
                        <p className="text-xs text-slate-400 truncate">{item.jobTitle || 'Untitled Role'}</p>
                      </div>
                      <span className="shrink-0 px-2 py-0.5 rounded-md text-[11px] font-medium bg-dark-200 text-slate-300 border border-dark-300">
                        {toneObj.emoji} {toneObj.label}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1">
                      <span>Created {dateStr}</span>
                      {isActive && <span className="text-primary-400 font-medium">Active in editor</span>}
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-dark-300">
                      <button
                        type="button"
                        onClick={() => handleOpenSavedLetter(item)}
                        className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium transition-colors ${
                          isActive
                            ? 'bg-primary-500 text-white'
                            : 'bg-dark-200 hover:bg-dark-300 text-slate-200'
                        }`}
                      >
                        {isActive ? 'Editing Now' : 'Open & Edit'}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteSavedLetter(item._id, e)}
                        disabled={deletingId === item._id}
                        className="p-1.5 rounded-lg text-xs text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40"
                        title="Delete cover letter"
                      >
                        <HiTrash className="text-sm" />
                      </button>
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
