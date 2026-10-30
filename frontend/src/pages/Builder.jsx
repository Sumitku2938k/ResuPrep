import { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  HiPlus,
  HiTrash,
  HiDownload,
  HiDocumentText,
  HiRefresh,
  HiClock,
  HiEye,
  HiCheck,
} from 'react-icons/hi';
import {
  createResumeApi,
  getResumesApi,
  getResumeByIdApi,
  updateResumeApi,
  deleteResumeApi,
} from '../api/builder';
import { getTemplateBySlugApi } from '../api/templates';

const emptyResume = {
  title: 'Untitled Resume',
  personalInfo: { fullName: '', email: '', phone: '', location: '', linkedin: '', website: '', photo: '' },
  summary: '',
  education: [{ institution: '', degree: '', field: '', startDate: '', endDate: '', gpa: '' }],
  experience: [{ company: '', position: '', location: '', startDate: '', endDate: '', current: false, description: '' }],
  skills: [''],
  projects: [{ name: '', description: '', technologies: '', link: '' }],
  certifications: [{ name: '', issuer: '', date: '', link: '' }],
  template: 'modern',
};

/**
 * Strips frontend-only properties (like base64 photo) and ensures
 * arrays conform to the backend ResumeBuilder schema.
 */
function sanitizeResumePayload(data) {
  const personalInfo = { ...(data.personalInfo || {}) };
  delete personalInfo.photo; // Photo is kept in frontend state for preview/PDF only

  return {
    title: data.title?.trim() || 'Untitled Resume',
    personalInfo: {
      fullName: personalInfo.fullName || '',
      email: personalInfo.email || '',
      phone: personalInfo.phone || '',
      location: personalInfo.location || '',
      linkedin: personalInfo.linkedin || '',
      website: personalInfo.website || '',
    },
    summary: data.summary || '',
    education: (data.education || []).map((e) => ({
      institution: e.institution || '',
      degree: e.degree || '',
      field: e.field || '',
      startDate: e.startDate || '',
      endDate: e.endDate || '',
      gpa: e.gpa || '',
    })),
    experience: (data.experience || []).map((e) => ({
      company: e.company || '',
      position: e.position || '',
      location: e.location || '',
      startDate: e.startDate || '',
      endDate: e.endDate || '',
      current: Boolean(e.current),
      description: e.description || '',
    })),
    skills: (data.skills || []).map((s) => (typeof s === 'string' ? s : '')),
    projects: (data.projects || []).map((p) => ({
      name: p.name || '',
      description: p.description || '',
      technologies: p.technologies || '',
      link: p.link || '',
    })),
    certifications: (data.certifications || []).map((c) => ({
      name: c.name || '',
      issuer: c.issuer || '',
      date: c.date || '',
      link: c.link || '',
    })),
    template: data.template || 'modern',
  };
}

/**
 * Normalizes loaded backend resume data to ensure all form arrays and
 * nested structures exist with default fallbacks.
 */
function normalizeLoadedResume(raw) {
  return {
    title: raw.title || 'Untitled Resume',
    personalInfo: {
      fullName: raw.personalInfo?.fullName || '',
      email: raw.personalInfo?.email || '',
      phone: raw.personalInfo?.phone || '',
      location: raw.personalInfo?.location || '',
      linkedin: raw.personalInfo?.linkedin || '',
      website: raw.personalInfo?.website || '',
      photo: '', // Stored as frontend-only; initialized empty on load
    },
    summary: raw.summary || '',
    education:
      Array.isArray(raw.education) && raw.education.length > 0
        ? raw.education.map((e) => ({
            institution: e.institution || '',
            degree: e.degree || '',
            field: e.field || '',
            startDate: e.startDate || '',
            endDate: e.endDate || '',
            gpa: e.gpa || '',
          }))
        : [{ institution: '', degree: '', field: '', startDate: '', endDate: '', gpa: '' }],
    experience:
      Array.isArray(raw.experience) && raw.experience.length > 0
        ? raw.experience.map((e) => ({
            company: e.company || '',
            position: e.position || '',
            location: e.location || '',
            startDate: e.startDate || '',
            endDate: e.endDate || '',
            current: Boolean(e.current),
            description: e.description || '',
          }))
        : [{ company: '', position: '', location: '', startDate: '', endDate: '', current: false, description: '' }],
    skills:
      Array.isArray(raw.skills) && raw.skills.length > 0
        ? raw.skills.map((s) => (typeof s === 'string' ? s : String(s)))
        : [''],
    projects:
      Array.isArray(raw.projects) && raw.projects.length > 0
        ? raw.projects.map((p) => ({
            name: p.name || '',
            description: p.description || '',
            technologies: p.technologies || '',
            link: p.link || '',
          }))
        : [{ name: '', description: '', technologies: '', link: '' }],
    certifications:
      Array.isArray(raw.certifications) && raw.certifications.length > 0
        ? raw.certifications.map((c) => ({
            name: c.name || '',
            issuer: c.issuer || '',
            date: c.date || '',
            link: c.link || '',
          }))
        : [{ name: '', issuer: '', date: '', link: '' }],
    template: raw.template || 'modern',
  };
}

export default function Builder() {
  const [resume, setResume] = useState(emptyResume);
  const [activeResumeId, setActiveResumeId] = useState(null);
  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  // Saved resumes state
  const [savedResumes, setSavedResumes] = useState([]);
  const [resumesLoading, setResumesLoading] = useState(false);
  const [resumesError, setResumesError] = useState(null);
  const [loadingDraftId, setLoadingDraftId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const previewRef = useRef(null);
  const location = useLocation();

  const [templateConfig, setTemplateConfig] = useState({
    accentColor: '#2563EB',
    layout: 'modern',
    fontFamily: 'Plus Jakarta Sans',
  });

  // Handle template selection coming from Templates page
  useEffect(() => {
    if (location.state?.template?.previewConfig) {
      setTemplateConfig(location.state.template.previewConfig);
    }
    if (location.state?.template?.slug) {
      setResume((prev) => ({ ...prev, template: location.state.template.slug }));
      setIsDirty(true);
    }
  }, [location.state]);

  // Handle draft loading if requested via navigation state or query params
  const loadDraftById = useCallback(async (id) => {
    if (!id) return;
    setLoadingDraftId(id);
    try {
      const res = await getResumeByIdApi(id);
      const raw = res?.data?.resume;
      if (!raw) throw new Error('Resume not found');

      const normalized = normalizeLoadedResume(raw);
      setResume(normalized);
      setActiveResumeId(raw._id);
      setIsDirty(false);

      if (raw.template) {
        try {
          const tplRes = await getTemplateBySlugApi(raw.template);
          if (tplRes?.data?.template?.previewConfig) {
            setTemplateConfig(tplRes.data.template.previewConfig);
          }
        } catch {
          // Fallback gracefully to existing templateConfig
        }
      }
      toast.success(`Loaded draft "${raw.title || 'Untitled'}"`);
    } catch (err) {
      toast.error(err?.message || 'Failed to load resume draft');
      setActiveResumeId(null);
    } finally {
      setLoadingDraftId(null);
    }
  }, []);

  // Fetch saved drafts list
  const fetchSavedResumes = useCallback(async () => {
    setResumesLoading(true);
    setResumesError(null);
    try {
      const res = await getResumesApi();
      if (res?.success && Array.isArray(res?.data?.resumes)) {
        setSavedResumes(res.data.resumes);
      } else {
        setSavedResumes([]);
      }
    } catch (err) {
      setResumesError(err?.message || 'Failed to load saved resumes');
    } finally {
      setResumesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSavedResumes();

    // Check if location state has a resumeId to load
    const urlParams = new URLSearchParams(location.search);
    const targetId = location.state?.resumeId || urlParams.get('id');
    if (targetId) {
      loadDraftById(targetId);
    }
  }, [fetchSavedResumes, loadDraftById, location.search, location.state]);

  // Unsaved changes warning on tab close/reload
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // Form modification helpers
  const updatePersonal = (key, value) => {
    setResume((prev) => ({ ...prev, personalInfo: { ...prev.personalInfo, [key]: value } }));
    setIsDirty(true);
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        toast.error('Photo size must be under 1MB to save locally');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        updatePersonal('photo', reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const updateArray = (section, index, key, value) => {
    setResume((prev) => {
      const arr = [...prev[section]];
      arr[index] = { ...arr[index], [key]: value };
      return { ...prev, [section]: arr };
    });
    setIsDirty(true);
  };

  const addItem = (section, template) => {
    setResume((prev) => ({ ...prev, [section]: [...prev[section], template] }));
    setIsDirty(true);
  };

  const removeItem = (section, index) => {
    setResume((prev) => ({ ...prev, [section]: prev[section].filter((_, i) => i !== index) }));
    setIsDirty(true);
  };

  // Save / Update Handler
  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const payload = sanitizeResumePayload(resume);
      if (activeResumeId) {
        // Update existing draft
        const res = await updateResumeApi(activeResumeId, payload);
        const updated = res?.data?.resume;
        setIsDirty(false);
        toast.success('Resume updated successfully!');
        if (updated) {
          setSavedResumes((prev) =>
            prev.map((r) => (r._id === activeResumeId ? { ...r, ...updated } : r))
          );
        }
      } else {
        // Create new draft
        const res = await createResumeApi(payload);
        const created = res?.data?.resume;
        if (created?._id) {
          setActiveResumeId(created._id);
          setIsDirty(false);
          toast.success('Resume saved successfully!');
          setSavedResumes((prev) => [created, ...prev.filter((r) => r._id !== created._id)]);
        }
      }
    } catch (err) {
      toast.error(err?.message || 'Failed to save resume');
    } finally {
      setSaving(false);
    }
  };

  // Reset to New Resume
  const handleNewResume = () => {
    if (isDirty) {
      const confirmDiscard = window.confirm(
        'You have unsaved changes in your current resume. Are you sure you want to discard them and start a new resume?'
      );
      if (!confirmDiscard) return;
    }
    setResume(emptyResume);
    setActiveResumeId(null);
    setIsDirty(false);
    toast.success('Started a new resume');
  };

  // Open Draft Handler
  const handleOpenDraft = (id) => {
    if (!id || id === activeResumeId) return;
    if (isDirty) {
      const confirmDiscard = window.confirm(
        'You have unsaved changes in your current resume. Are you sure you want to discard them and open another draft?'
      );
      if (!confirmDiscard) return;
    }
    loadDraftById(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Delete Draft Handler
  const handleDeleteDraft = async (e, id, title) => {
    e.stopPropagation();
    if (!id) return;
    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${title || 'this resume'}"? This action cannot be undone.`
    );
    if (!confirmDelete) return;

    setDeletingId(id);
    try {
      const res = await deleteResumeApi(id);
      if (res?.success) {
        setSavedResumes((prev) => prev.filter((r) => r._id !== id));
        toast.success('Resume deleted successfully');
        if (activeResumeId === id) {
          setActiveResumeId(null);
          setIsDirty(true);
        }
      } else {
        toast.error(res?.message || 'Failed to delete resume');
      }
    } catch (err) {
      toast.error(err?.message || 'Failed to delete resume');
    } finally {
      setDeletingId(null);
    }
  };

  const downloadPDF = async () => {
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      html2pdf()
        .set({
          margin: 0,
          filename: `${resume.personalInfo.fullName || resume.title || 'resume'}.pdf`,
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

  const p = resume.personalInfo;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-heading font-black mb-3">
            Resume <span className="gradient-text">Builder</span>
          </h1>
          <p className="text-slate-400">Build your professional resume with live preview and cloud draft sync</p>
        </div>

        {/* Top Control Bar */}
        <div className="glass-card p-4 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleNewResume}
              className="btn-secondary text-sm flex items-center gap-1.5 px-3.5 py-2"
              title="Start a fresh blank resume"
            >
              <HiPlus className="text-base" /> New Resume
            </button>
            <span
              className={`text-xs px-3 py-1 rounded-full font-semibold border ${
                activeResumeId
                  ? isDirty
                    ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                    : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                  : 'bg-primary-500/10 text-primary-300 border-primary-500/30'
              }`}
            >
              {activeResumeId ? (isDirty ? '● Unsaved Edits' : '✓ Synced with Cloud') : '● New Draft'}
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className={`btn-primary text-sm flex items-center gap-2 px-5 py-2 ${
                saving ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <HiCheck className="text-base" /> {activeResumeId ? 'Save Changes' : 'Save Draft'}
                </>
              )}
            </button>
            <button
              type="button"
              onClick={downloadPDF}
              className="btn-secondary text-sm flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200"
            >
              <HiDownload className="text-base" /> Download PDF
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Form Column */}
          <div className="space-y-5 max-h-[80vh] overflow-y-auto pr-2">
            {/* Title & Document Info */}
            <div className="glass-card p-5 !hover:transform-none">
              <h3 className="font-heading font-bold text-slate-200 mb-3">📄 Resume Title</h3>
              <input
                placeholder="e.g. Senior Software Engineer Resume"
                value={resume.title}
                onChange={(e) => {
                  setResume((prev) => ({ ...prev, title: e.target.value }));
                  setIsDirty(true);
                }}
                className="glow-input text-sm p-2 w-full font-semibold"
              />
            </div>

            {/* Personal Info */}
            <div className="glass-card p-5 !hover:transform-none">
              <h3 className="font-heading font-bold text-slate-200 mb-4">👤 Personal Info</h3>
              <div className="mb-4">
                <label className="block text-sm text-slate-400 mb-1">Passport Photo (Optional)</label>
                <div className="flex items-center gap-3">
                  {p.photo && (
                    <img
                      src={p.photo}
                      alt="Preview"
                      className="w-12 h-12 object-cover rounded-md border border-white/10"
                    />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="text-sm text-slate-400 file:mr-4 file:py-1.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-500/10 file:text-primary-400 hover:file:bg-primary-500/20 file:transition-colors cursor-pointer"
                  />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <input
                  placeholder="Full Name"
                  value={p.fullName}
                  onChange={(e) => updatePersonal('fullName', e.target.value)}
                  className="glow-input text-sm p-2"
                />
                <input
                  placeholder="Email"
                  value={p.email}
                  onChange={(e) => updatePersonal('email', e.target.value)}
                  className="glow-input text-sm p-2"
                />
                <input
                  placeholder="Phone"
                  value={p.phone}
                  onChange={(e) => updatePersonal('phone', e.target.value)}
                  className="glow-input text-sm p-2"
                />
                <input
                  placeholder="Location"
                  value={p.location}
                  onChange={(e) => updatePersonal('location', e.target.value)}
                  className="glow-input text-sm p-2"
                />
                <input
                  placeholder="LinkedIn URL"
                  value={p.linkedin}
                  onChange={(e) => updatePersonal('linkedin', e.target.value)}
                  className="glow-input text-sm p-2"
                />
                <input
                  placeholder="Website"
                  value={p.website}
                  onChange={(e) => updatePersonal('website', e.target.value)}
                  className="glow-input text-sm p-2"
                />
              </div>
            </div>

            {/* Summary */}
            <div className="glass-card p-5 !hover:transform-none">
              <h3 className="font-heading font-bold text-slate-200 mb-4">📝 Summary</h3>
              <textarea
                rows={3}
                placeholder="Professional summary..."
                value={resume.summary}
                onChange={(e) => {
                  setResume((prev) => ({ ...prev, summary: e.target.value }));
                  setIsDirty(true);
                }}
                className="glow-input text-sm p-2 resize-none"
              />
            </div>

            {/* Education */}
            <div className="glass-card p-5 !hover:transform-none">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-heading font-bold text-slate-200">🎓 Education</h3>
                <button
                  type="button"
                  onClick={() =>
                    addItem('education', {
                      institution: '',
                      degree: '',
                      field: '',
                      startDate: '',
                      endDate: '',
                      gpa: '',
                    })
                  }
                  className="text-primary-400 hover:text-primary-300 text-sm flex items-center gap-1"
                >
                  <HiPlus /> Add
                </button>
              </div>
              {resume.education.map((edu, i) => (
                <div key={i} className="space-y-2 mb-4 pb-4 border-b border-white/5 last:border-0 last:mb-0 last:pb-0">
                  <div className="flex justify-between">
                    <input
                      placeholder="Institution"
                      value={edu.institution}
                      onChange={(e) => updateArray('education', i, 'institution', e.target.value)}
                      className="glow-input text-sm p-2 flex-1"
                    />
                    {i > 0 && (
                      <button
                        type="button"
                        onClick={() => removeItem('education', i)}
                        className="ml-2 text-red-400 hover:text-red-300"
                      >
                        <HiTrash />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      placeholder="Degree"
                      value={edu.degree}
                      onChange={(e) => updateArray('education', i, 'degree', e.target.value)}
                      className="glow-input text-sm p-2"
                    />
                    <input
                      placeholder="Field"
                      value={edu.field}
                      onChange={(e) => updateArray('education', i, 'field', e.target.value)}
                      className="glow-input text-sm p-2"
                    />
                    <input
                      placeholder="Start Year"
                      value={edu.startDate}
                      onChange={(e) => updateArray('education', i, 'startDate', e.target.value)}
                      className="glow-input text-sm p-2"
                    />
                    <input
                      placeholder="End Year"
                      value={edu.endDate}
                      onChange={(e) => updateArray('education', i, 'endDate', e.target.value)}
                      className="glow-input text-sm p-2"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Experience */}
            <div className="glass-card p-5 !hover:transform-none">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-heading font-bold text-slate-200">💼 Experience</h3>
                <button
                  type="button"
                  onClick={() =>
                    addItem('experience', {
                      company: '',
                      position: '',
                      location: '',
                      startDate: '',
                      endDate: '',
                      current: false,
                      description: '',
                    })
                  }
                  className="text-primary-400 hover:text-primary-300 text-sm flex items-center gap-1"
                >
                  <HiPlus /> Add
                </button>
              </div>
              {resume.experience.map((exp, i) => (
                <div key={i} className="space-y-2 mb-4 pb-4 border-b border-white/5 last:border-0 last:mb-0 last:pb-0">
                  <div className="flex justify-between">
                    <input
                      placeholder="Position"
                      value={exp.position}
                      onChange={(e) => updateArray('experience', i, 'position', e.target.value)}
                      className="glow-input text-sm p-2 flex-1"
                    />
                    {i > 0 && (
                      <button
                        type="button"
                        onClick={() => removeItem('experience', i)}
                        className="ml-2 text-red-400 hover:text-red-300"
                      >
                        <HiTrash />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      placeholder="Company"
                      value={exp.company}
                      onChange={(e) => updateArray('experience', i, 'company', e.target.value)}
                      className="glow-input text-sm p-2"
                    />
                    <input
                      placeholder="Location"
                      value={exp.location}
                      onChange={(e) => updateArray('experience', i, 'location', e.target.value)}
                      className="glow-input text-sm p-2"
                    />
                    <input
                      placeholder="Start Date"
                      value={exp.startDate}
                      onChange={(e) => updateArray('experience', i, 'startDate', e.target.value)}
                      className="glow-input text-sm p-2"
                    />
                    <input
                      placeholder="End Date"
                      value={exp.endDate}
                      onChange={(e) => updateArray('experience', i, 'endDate', e.target.value)}
                      className="glow-input text-sm p-2"
                    />
                  </div>
                  <textarea
                    rows={3}
                    placeholder="Description (bullet points)"
                    value={exp.description}
                    onChange={(e) => updateArray('experience', i, 'description', e.target.value)}
                    className="glow-input text-sm p-2 resize-none"
                  />
                </div>
              ))}
            </div>

            {/* Skills */}
            <div className="glass-card p-5 !hover:transform-none">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-heading font-bold text-slate-200">🛠 Skills</h3>
                <button
                  type="button"
                  onClick={() => {
                    setResume((prev) => ({ ...prev, skills: [...prev.skills, ''] }));
                    setIsDirty(true);
                  }}
                  className="text-primary-400 hover:text-primary-300 text-sm flex items-center gap-1"
                >
                  <HiPlus /> Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {resume.skills.map((skill, i) => (
                  <div key={i} className="flex items-center gap-1">
                    <input
                      placeholder="Skill"
                      value={skill}
                      onChange={(e) => {
                        const arr = [...resume.skills];
                        arr[i] = e.target.value;
                        setResume((prev) => ({ ...prev, skills: arr }));
                        setIsDirty(true);
                      }}
                      className="glow-input text-sm p-2 !w-32 !py-1.5 !px-2"
                    />
                    {i > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setResume((prev) => ({
                            ...prev,
                            skills: prev.skills.filter((_, j) => j !== i),
                          }));
                          setIsDirty(true);
                        }}
                        className="text-red-400 text-xs"
                      >
                        <HiTrash />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Projects */}
            <div className="glass-card p-5 !hover:transform-none">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-heading font-bold text-slate-200">🚀 Projects</h3>
                <button
                  type="button"
                  onClick={() =>
                    addItem('projects', {
                      name: '',
                      description: '',
                      technologies: '',
                      link: '',
                    })
                  }
                  className="text-primary-400 hover:text-primary-300 text-sm flex items-center gap-1"
                >
                  <HiPlus /> Add
                </button>
              </div>
              {resume.projects.map((proj, i) => (
                <div key={i} className="space-y-2 mb-4 pb-4 border-b border-white/5 last:border-0 last:mb-0 last:pb-0">
                  <div className="flex justify-between">
                    <input
                      placeholder="Project Name"
                      value={proj.name}
                      onChange={(e) => updateArray('projects', i, 'name', e.target.value)}
                      className="glow-input text-sm p-2 flex-1"
                    />
                    {i > 0 && (
                      <button
                        type="button"
                        onClick={() => removeItem('projects', i)}
                        className="ml-2 text-red-400 hover:text-red-300"
                      >
                        <HiTrash />
                      </button>
                    )}
                  </div>
                  <textarea
                    rows={2}
                    placeholder="Description"
                    value={proj.description}
                    onChange={(e) => updateArray('projects', i, 'description', e.target.value)}
                    className="glow-input text-sm p-2 resize-none"
                  />
                  <input
                    placeholder="Technologies"
                    value={proj.technologies}
                    onChange={(e) => updateArray('projects', i, 'technologies', e.target.value)}
                    className="glow-input text-sm p-2"
                  />
                </div>
              ))}
            </div>

            {/* Certifications */}
            <div className="glass-card p-5 !hover:transform-none">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-heading font-bold text-slate-200">📜 Certifications</h3>
                <button
                  type="button"
                  onClick={() =>
                    addItem('certifications', {
                      name: '',
                      issuer: '',
                      date: '',
                      link: '',
                    })
                  }
                  className="text-primary-400 hover:text-primary-300 text-sm flex items-center gap-1"
                >
                  <HiPlus /> Add
                </button>
              </div>
              {resume.certifications.map((cert, i) => (
                <div key={i} className="space-y-2 mb-4 pb-4 border-b border-white/5 last:border-0 last:mb-0 last:pb-0">
                  <div className="flex justify-between">
                    <input
                      placeholder="Certification Name"
                      value={cert.name}
                      onChange={(e) => updateArray('certifications', i, 'name', e.target.value)}
                      className="glow-input text-sm p-2 flex-1"
                    />
                    {i > 0 && (
                      <button
                        type="button"
                        onClick={() => removeItem('certifications', i)}
                        className="ml-2 text-red-400 hover:text-red-300"
                      >
                        <HiTrash />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      placeholder="Issuer"
                      value={cert.issuer}
                      onChange={(e) => updateArray('certifications', i, 'issuer', e.target.value)}
                      className="glow-input text-sm p-2"
                    />
                    <input
                      placeholder="Date"
                      value={cert.date}
                      onChange={(e) => updateArray('certifications', i, 'date', e.target.value)}
                      className="glow-input text-sm p-2"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Live Preview Column */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <div
              ref={previewRef}
              className="resume-paper rounded-lg text-[11px] leading-relaxed min-h-[600px] bg-white overflow-hidden shadow-2xl"
              style={{ maxHeight: '75vh', overflow: 'auto', fontFamily: templateConfig.fontFamily }}
            >
              {templateConfig.layout === 'sidebar' ? (
                <div className="flex min-h-full">
                  <div className="w-1/3 p-6 text-white" style={{ backgroundColor: templateConfig.accentColor }}>
                    {p.photo && (
                      <img
                        src={p.photo}
                        alt="Profile"
                        className="w-24 h-24 object-cover rounded-full border-2 border-white mx-auto mb-4 shadow-md"
                      />
                    )}
                    <h1 className="text-xl font-bold text-center mb-6 leading-tight">{p.fullName || 'Your Name'}</h1>

                    <div className="space-y-4">
                      <div>
                        <h2 className="text-[10px] font-bold uppercase tracking-widest border-b border-white/20 pb-1 mb-2">
                          Contact
                        </h2>
                        <div className="space-y-1 opacity-90 text-[10px]">
                          {p.email && <p>{p.email}</p>}
                          {p.phone && <p>{p.phone}</p>}
                          {p.location && <p>{p.location}</p>}
                          {p.linkedin && <p>{p.linkedin}</p>}
                          {p.website && <p>{p.website}</p>}
                        </div>
                      </div>

                      {resume.skills.some((s) => s) && (
                        <div>
                          <h2 className="text-[10px] font-bold uppercase tracking-widest border-b border-white/20 pb-1 mb-2">
                            Skills
                          </h2>
                          <div className="flex flex-wrap gap-1">
                            {resume.skills.filter(Boolean).map((s, i) => (
                              <span key={i} className="px-1.5 py-0.5 bg-white/10 rounded text-[10px]">
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="w-2/3 p-6 text-gray-800">
                    {resume.summary && (
                      <div className="mb-4">
                        <h2
                          className="text-xs font-bold uppercase tracking-wider mb-1"
                          style={{ color: templateConfig.accentColor }}
                        >
                          Profile
                        </h2>
                        <p className="text-gray-600">{resume.summary}</p>
                      </div>
                    )}

                    {resume.experience.some((e) => e.position || e.company) && (
                      <div className="mb-4">
                        <h2
                          className="text-xs font-bold uppercase tracking-wider mb-2"
                          style={{ color: templateConfig.accentColor }}
                        >
                          Experience
                        </h2>
                        {resume.experience
                          .filter((e) => e.position || e.company)
                          .map((exp, i) => (
                            <div key={i} className="mb-3">
                              <div className="flex justify-between font-bold">
                                <span className="text-gray-800">{exp.position}</span>
                                <span className="text-gray-500 font-normal text-[9px]">
                                  {[exp.startDate, exp.endDate || 'Present'].filter(Boolean).join(' – ')}
                                </span>
                              </div>
                              <div className="text-gray-500 font-medium mb-1">
                                {exp.company} {exp.location ? `• ${exp.location}` : ''}
                              </div>
                              {exp.description && (
                                <p className="text-gray-600 whitespace-pre-line">{exp.description}</p>
                              )}
                            </div>
                          ))}
                      </div>
                    )}

                    {resume.education.some((e) => e.institution) && (
                      <div className="mb-4">
                        <h2
                          className="text-xs font-bold uppercase tracking-wider mb-2"
                          style={{ color: templateConfig.accentColor }}
                        >
                          Education
                        </h2>
                        {resume.education
                          .filter((e) => e.institution)
                          .map((edu, i) => (
                            <div key={i} className="mb-2">
                              <div className="flex justify-between font-bold">
                                <span className="text-gray-800">
                                  {edu.degree} {edu.field ? `in ${edu.field}` : ''}
                                </span>
                                <span className="text-gray-500 font-normal text-[9px]">
                                  {[edu.startDate, edu.endDate].filter(Boolean).join(' – ')}
                                </span>
                              </div>
                              <div className="text-gray-600">{edu.institution}</div>
                            </div>
                          ))}
                      </div>
                    )}

                    {resume.projects.some((pr) => pr.name) && (
                      <div className="mb-4">
                        <h2
                          className="text-xs font-bold uppercase tracking-wider mb-2"
                          style={{ color: templateConfig.accentColor }}
                        >
                          Projects
                        </h2>
                        {resume.projects
                          .filter((pr) => pr.name)
                          .map((proj, i) => (
                            <div key={i} className="mb-2">
                              <div className="font-bold text-gray-800">
                                {proj.name}{' '}
                                {proj.technologies && (
                                  <span className="font-normal text-gray-400 text-[9px]">| {proj.technologies}</span>
                                )}
                              </div>
                              {proj.description && <p className="text-gray-600">{proj.description}</p>}
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-gray-800">
                  <div
                    className={`${
                      templateConfig.layout === 'creative'
                        ? 'p-8 px-10 text-white'
                        : `pt-8 px-8 mb-6 ${
                            templateConfig.layout === 'classic'
                              ? 'text-center'
                              : templateConfig.layout === 'modern'
                              ? 'border-l-4 ml-8'
                              : ''
                          }`
                    }`}
                    style={
                      templateConfig.layout === 'creative'
                        ? { backgroundColor: templateConfig.accentColor }
                        : {
                            borderColor:
                              templateConfig.layout === 'modern' ? templateConfig.accentColor : 'transparent',
                          }
                    }
                  >
                    <div
                      className={`flex ${
                        templateConfig.layout === 'classic' ? 'flex-col items-center' : 'justify-between items-center'
                      }`}
                    >
                      <div>
                        <h1
                          className={`font-bold ${
                            templateConfig.layout === 'creative'
                              ? 'text-4xl text-white mb-2'
                              : 'text-3xl text-gray-900'
                          }`}
                        >
                          {p.fullName || 'Your Name'}
                        </h1>
                        <div
                          className={`flex flex-wrap gap-2 text-[10px] mt-2 ${
                            templateConfig.layout === 'classic' ? 'justify-center' : ''
                          }`}
                          style={{
                            color:
                              templateConfig.layout === 'creative'
                                ? '#ffffff'
                                : templateConfig.layout === 'minimal'
                                ? '#9ca3af'
                                : '#6b7280',
                          }}
                        >
                          {[p.email, p.phone, p.location, p.linkedin, p.website].filter(Boolean).map((info, i) => (
                            <span
                              key={i}
                              className={`flex items-center ${
                                templateConfig.layout === 'creative' ? 'mr-3 opacity-90' : ''
                              }`}
                            >
                              {i > 0 && templateConfig.layout !== 'creative' && <span className="mx-2 opacity-50">•</span>}
                              {info}
                            </span>
                          ))}
                        </div>
                      </div>
                      {p.photo && templateConfig.layout !== 'classic' && (
                        <img
                          src={p.photo}
                          alt="Profile"
                          className={`object-cover ${
                            templateConfig.layout === 'creative'
                              ? 'w-24 h-24 rounded-full border-4 border-white shadow-md'
                              : 'w-16 h-16 rounded shadow-sm'
                          } ml-4`}
                        />
                      )}
                    </div>
                  </div>

                  <div className={`${templateConfig.layout === 'creative' ? 'p-8 px-10' : 'px-8 pb-8'}`}>
                    {[
                      { id: 'summary', title: 'Professional Summary', content: resume.summary, type: 'text' },
                      { id: 'experience', title: 'Experience', content: resume.experience, type: 'experience' },
                      { id: 'education', title: 'Education', content: resume.education, type: 'education' },
                      { id: 'skills', title: 'Skills', content: resume.skills, type: 'skills' },
                      { id: 'projects', title: 'Projects', content: resume.projects, type: 'projects' },
                    ].map((section) => {
                      const hasContent =
                        section.type === 'text'
                          ? Boolean(section.content)
                          : section.content.some((item) => {
                              if (section.type === 'skills') return Boolean(item);
                              return item.name || item.company || item.institution || item.position;
                            });

                      if (!hasContent) return null;

                      return (
                        <div key={section.id} className="mb-4">
                          <h2
                            className={`text-xs font-bold uppercase tracking-widest mb-2 ${
                              templateConfig.layout === 'classic'
                                ? 'text-center border-b border-gray-300 pb-1'
                                : templateConfig.layout === 'minimal'
                                ? 'text-gray-400'
                                : 'border-b pb-1'
                            }`}
                            style={{
                              color:
                                templateConfig.layout === 'minimal'
                                  ? '#9ca3af'
                                  : templateConfig.layout === 'classic'
                                  ? '#374151'
                                  : templateConfig.accentColor,
                              borderColor:
                                templateConfig.layout === 'modern' || templateConfig.layout === 'creative'
                                  ? `${templateConfig.accentColor}40`
                                  : '#e5e7eb',
                            }}
                          >
                            {section.title}
                          </h2>

                          {section.type === 'text' && <p className="text-gray-600">{section.content}</p>}

                          {section.type === 'skills' && (
                            <div
                              className={`flex flex-wrap gap-1.5 ${
                                templateConfig.layout === 'classic' ? 'justify-center' : ''
                              }`}
                            >
                              {section.content.filter(Boolean).map((s, i) => (
                                <span
                                  key={i}
                                  className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                                    templateConfig.layout === 'minimal' ? 'text-gray-600 bg-gray-100' : ''
                                  }`}
                                  style={
                                    templateConfig.layout !== 'minimal'
                                      ? {
                                          backgroundColor: `${templateConfig.accentColor}15`,
                                          color: templateConfig.accentColor,
                                        }
                                      : {}
                                  }
                                >
                                  {s}
                                </span>
                              ))}
                            </div>
                          )}

                          {section.type === 'experience' &&
                            section.content
                              .filter((e) => e.position || e.company)
                              .map((exp, i) => (
                                <div key={i} className="mb-3">
                                  <div className="flex justify-between items-baseline">
                                    <span className="font-bold text-gray-800">{exp.position}</span>
                                    <span className="text-gray-500 font-medium text-[9px]">
                                      {[exp.startDate, exp.endDate || 'Present'].filter(Boolean).join(' – ')}
                                    </span>
                                  </div>
                                  <div
                                    className="text-gray-600 font-medium mb-0.5"
                                    style={{
                                      color:
                                        templateConfig.layout === 'creative'
                                          ? templateConfig.accentColor
                                          : '#4b5563',
                                    }}
                                  >
                                    {exp.company} {exp.location ? `• ${exp.location}` : ''}
                                  </div>
                                  {exp.description && (
                                    <p className="text-gray-600 whitespace-pre-line mt-1">{exp.description}</p>
                                  )}
                                </div>
                              ))}

                          {section.type === 'education' &&
                            section.content
                              .filter((e) => e.institution)
                              .map((edu, i) => (
                                <div key={i} className="mb-2">
                                  <div className="flex justify-between items-baseline">
                                    <span className="font-bold text-gray-800">
                                      {edu.degree} {edu.field ? `in ${edu.field}` : ''}
                                    </span>
                                    <span className="text-gray-500 font-medium text-[9px]">
                                      {[edu.startDate, edu.endDate].filter(Boolean).join(' – ')}
                                    </span>
                                  </div>
                                  <div
                                    className="text-gray-600"
                                    style={{
                                      color:
                                        templateConfig.layout === 'creative'
                                          ? templateConfig.accentColor
                                          : '#4b5563',
                                    }}
                                  >
                                    {edu.institution}
                                  </div>
                                </div>
                              ))}

                          {section.type === 'projects' &&
                            section.content
                              .filter((pr) => pr.name)
                              .map((proj, i) => (
                                <div key={i} className="mb-2">
                                  <div className="font-bold text-gray-800">
                                    {proj.name}{' '}
                                    {proj.technologies && (
                                      <span className="font-normal text-gray-500 text-[9px]">
                                        | {proj.technologies}
                                      </span>
                                    )}
                                  </div>
                                  {proj.description && <p className="text-gray-600 mt-0.5">{proj.description}</p>}
                                </div>
                              ))}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Saved Resumes / Cloud Drafts Section */}
        <div className="mt-12 pt-8 border-t border-slate-700/50">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <HiDocumentText className="text-xl text-primary-400" />
              <h2 className="text-xl font-heading font-bold text-slate-200">Saved Resumes</h2>
              {savedResumes.length > 0 && (
                <span className="text-xs bg-primary-500/20 text-primary-400 px-2.5 py-0.5 rounded-full font-semibold border border-primary-500/30">
                  {savedResumes.length}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={fetchSavedResumes}
              disabled={resumesLoading}
              className="text-xs text-slate-400 hover:text-primary-400 flex items-center gap-1 transition-colors px-2.5 py-1 rounded hover:bg-white/5 disabled:opacity-50"
            >
              <HiRefresh className={`text-sm ${resumesLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {resumesLoading && savedResumes.length === 0 ? (
            <div className="glass-card p-8 text-center">
              <div className="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-slate-400">Loading saved resumes...</p>
            </div>
          ) : resumesError ? (
            <div className="glass-card p-6 border-red-500/30 text-center">
              <p className="text-sm text-red-400 mb-3">{resumesError}</p>
              <button
                type="button"
                onClick={fetchSavedResumes}
                className="btn-secondary text-xs px-3 py-1.5"
              >
                Try Again
              </button>
            </div>
          ) : savedResumes.length === 0 ? (
            <div className="glass-card p-8 text-center">
              <HiDocumentText className="text-4xl text-slate-600 mx-auto mb-2" />
              <h3 className="text-base font-bold text-slate-300 mb-1">No saved resumes yet</h3>
              <p className="text-sm text-slate-400 max-w-md mx-auto mb-4">
                Fill in your details above and click &quot;Save Draft&quot; to save your resume to the cloud.
              </p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedResumes.map((draft) => {
                const isActive = activeResumeId === draft._id;
                const dateStr = draft.updatedAt
                  ? new Date(draft.updatedAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : 'Recent';

                return (
                  <div
                    key={draft._id}
                    className={`glass-card p-5 transition-all flex flex-col justify-between ${
                      isActive
                        ? 'border-primary-500 ring-1 ring-primary-500'
                        : 'hover:border-primary-500/40'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <HiDocumentText className="text-primary-400 text-lg flex-shrink-0" />
                          <span
                            className="text-sm font-bold text-slate-200 truncate"
                            title={draft.title || 'Untitled Resume'}
                          >
                            {draft.title || 'Untitled Resume'}
                          </span>
                        </div>
                        {draft.template && (
                          <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-primary-500/10 text-primary-300 border border-primary-500/20 whitespace-nowrap">
                            {draft.template}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-400 line-clamp-2 mb-3">
                        {draft.personalInfo?.fullName
                          ? `${draft.personalInfo.fullName} • ${draft.personalInfo.email || ''}`
                          : draft.summary || 'No summary entered'}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-700/50 text-xs">
                      <span className="text-slate-500 flex items-center gap-1">
                        <HiClock className="text-slate-500 text-xs" />
                        {dateStr}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenDraft(draft._id)}
                          disabled={loadingDraftId === draft._id || isActive}
                          className={`font-semibold flex items-center gap-1 transition-colors px-2.5 py-1 rounded ${
                            isActive
                              ? 'text-emerald-400 bg-emerald-500/10 cursor-default'
                              : 'text-primary-400 hover:text-primary-300 hover:bg-primary-500/10'
                          }`}
                          title={isActive ? 'Currently editing' : 'Open this resume'}
                        >
                          {loadingDraftId === draft._id ? (
                            <div className="w-3.5 h-3.5 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
                          ) : isActive ? (
                            <>
                              <HiCheck /> Active
                            </>
                          ) : (
                            <>
                              <HiEye /> Open
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteDraft(e, draft._id, draft.title)}
                          disabled={deletingId === draft._id}
                          className="text-slate-400 hover:text-red-400 transition-colors p-1.5 rounded hover:bg-red-500/10 disabled:opacity-50"
                          title="Delete this resume"
                        >
                          {deletingId === draft._id ? (
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
