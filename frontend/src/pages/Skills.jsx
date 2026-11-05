import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { getSkillsTaxonomyApi, analyzeSkillGapApi } from '../api/skills.js';
import SkillBar from '../components/SkillBar';
import RadarChart from '../components/RadarChart';
import {
  HiRefresh,
  HiExclamationCircle,
  HiCheckCircle,
  HiSparkles,
  HiLightBulb,
  HiExternalLink,
  HiCheck,
  HiDownload,
  HiAcademicCap,
} from 'react-icons/hi';

const ROLES = [
  { slug: 'frontend-developer', label: 'Frontend Developer' },
  { slug: 'backend-developer', label: 'Backend Developer' },
  { slug: 'full-stack-developer', label: 'Full Stack Developer' },
  { slug: 'data-scientist', label: 'Data Scientist' },
  { slug: 'devops-engineer', label: 'DevOps Engineer' },
];

const priorityColors = {
  critical: 'badge-red',
  high: 'badge-amber',
  medium: 'badge-blue',
  low: 'badge-green',
};

export default function Skills() {
  const [selectedRoleSlug, setSelectedRoleSlug] = useState('frontend-developer');
  const [taxonomy, setTaxonomy] = useState(null);
  const [taxonomyLoading, setTaxonomyLoading] = useState(true);
  const [taxonomyError, setTaxonomyError] = useState(null);

  const [selectedSkills, setSelectedSkills] = useState([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);

  // Fetch taxonomy whenever selectedRoleSlug changes
  const fetchTaxonomy = useCallback(async (roleSlug) => {
    setTaxonomyLoading(true);
    setTaxonomyError(null);
    try {
      const res = await getSkillsTaxonomyApi(roleSlug);
      const taxData = res?.data?.taxonomy;
      if (res?.success && taxData && Array.isArray(taxData.skills)) {
        setTaxonomy(taxData);

        // Safely prune selected skills so obsolete skills from another role are dropped
        const validSkills = new Set(taxData.skills.map((s) => s.name.toLowerCase()));
        setSelectedSkills((prev) => prev.filter((s) => validSkills.has(s.toLowerCase())));
        setAnalysisResult(null);
        setAnalysisError(null);
      } else {
        throw new Error('Unexpected taxonomy response structure from backend.');
      }
    } catch (err) {
      setTaxonomyError(err?.message || 'Failed to load skill taxonomy for this role.');
    } finally {
      setTaxonomyLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTaxonomy(selectedRoleSlug);
  }, [selectedRoleSlug, fetchTaxonomy]);

  // Toggle skill selection
  const toggleSkill = (skillName) => {
    setSelectedSkills((prev) =>
      prev.includes(skillName)
        ? prev.filter((s) => s !== skillName)
        : [...prev, skillName]
    );
  };

  // Select all / clear all convenience actions
  const selectAllSkills = () => {
    if (!taxonomy?.skills) return;
    setSelectedSkills(taxonomy.skills.map((s) => s.name));
  };

  const clearAllSkills = () => {
    setSelectedSkills([]);
  };

  // Submit gap analysis
  const handleAnalyze = async () => {
    if (selectedSkills.length === 0) {
      toast.error('Please select at least one skill you currently possess.');
      return;
    }

    setAnalyzing(true);
    setAnalysisError(null);

    try {
      const targetRoleTitle =
        taxonomy?.role ||
        ROLES.find((r) => r.slug === selectedRoleSlug)?.label ||
        'Full Stack Developer';

      const res = await analyzeSkillGapApi({
        currentSkills: selectedSkills,
        targetRole: targetRoleTitle,
      });

      if (res?.success && res?.data) {
        setAnalysisResult(res.data);
        toast.success('Skill gap analysis complete!');
      } else {
        throw new Error(res?.message || 'Failed to analyze skill gap.');
      }
    } catch (err) {
      const msg = err?.message || 'Failed to complete skill gap analysis.';
      setAnalysisError(msg);
      toast.error(msg);
    } finally {
      setAnalyzing(false);
    }
  };

  // Group taxonomy skills by category for chip display
  const groupedSkills = useMemo(() => {
    if (!taxonomy?.skills) return {};
    const groups = {};
    for (const skill of taxonomy.skills) {
      const cat = skill.category || 'general';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(skill);
    }
    return groups;
  }, [taxonomy]);

  // Category-level coverage calculation for honest charts
  const categoryCoverage = useMemo(() => {
    if (!taxonomy?.skills || taxonomy.skills.length === 0) return [];
    const catMap = {};
    for (const skill of taxonomy.skills) {
      const cat = skill.category || 'general';
      if (!catMap[cat]) catMap[cat] = { category: cat, total: 0, selected: 0 };
      catMap[cat].total++;
      if (selectedSkills.includes(skill.name)) {
        catMap[cat].selected++;
      }
    }
    return Object.values(catMap);
  }, [taxonomy, selectedSkills]);

  // Radar chart props
  const radarLabels = categoryCoverage.map(
    (c) => c.category.charAt(0).toUpperCase() + c.category.slice(1)
  );
  const radarYourData = categoryCoverage.map((c) =>
    Math.round((c.selected / c.total) * 100)
  );
  const radarRequiredData = categoryCoverage.map(() => 100);

  // Map of taxonomy levels for easy reference in comparison table
  const taxonomyLevelMap = useMemo(() => {
    const map = new Map();
    if (taxonomy?.skills) {
      for (const skill of taxonomy.skills) {
        map.set(skill.name.toLowerCase(), skill.level);
      }
    }
    return map;
  }, [taxonomy]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="px-4 py-8"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-heading font-black mb-3">
            Skill Gap <span className="gradient-text">Analysis</span>
          </h1>
          <p className="text-slate-400">
            Compare your current skills against role requirements and find learning paths
          </p>
        </div>

        {/* Target Role Selector */}
        <div className="glass-card p-6 mb-8 !hover:transform-none">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <h2 className="text-lg font-heading font-bold text-slate-200">
                1. Select Target Role
              </h2>
              <p className="text-xs text-slate-400">
                Choose a role to load its core skill taxonomy requirements
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">Active Role:</span>
              <span className="badge badge-blue">
                {taxonomy?.role || ROLES.find((r) => r.slug === selectedRoleSlug)?.label}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {ROLES.map((role) => (
              <button
                key={role.slug}
                onClick={() => setSelectedRoleSlug(role.slug)}
                disabled={taxonomyLoading || analyzing}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                  selectedRoleSlug === role.slug
                    ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
                    : 'bg-dark-200 text-slate-400 hover:bg-dark-300 hover:text-slate-200'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {role.label}
              </button>
            ))}
          </div>
        </div>

        {/* Taxonomy Loading State */}
        {taxonomyLoading && (
          <div className="glass-card p-12 text-center mb-8 !hover:transform-none">
            <div className="w-10 h-10 border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-slate-300 font-medium">
              Loading {ROLES.find((r) => r.slug === selectedRoleSlug)?.label} taxonomy...
            </p>
          </div>
        )}

        {/* Taxonomy Error State */}
        {taxonomyError && !taxonomyLoading && (
          <div className="glass-card p-8 text-center mb-8 border border-rose-500/30 !hover:transform-none">
            <HiExclamationCircle className="w-10 h-10 text-rose-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-200 mb-1">
              Failed to load skill taxonomy
            </h3>
            <p className="text-xs text-slate-400 mb-4">{taxonomyError}</p>
            <button
              onClick={() => fetchTaxonomy(selectedRoleSlug)}
              className="btn-secondary text-xs inline-flex items-center gap-2"
            >
              <HiRefresh className="w-4 h-4" /> Retry Loading Taxonomy
            </button>
          </div>
        )}

        {/* Interactive Skill Selection */}
        {!taxonomyLoading && !taxonomyError && taxonomy && (
          <div className="glass-card p-6 mb-8 !hover:transform-none">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5 border-b border-white/5 pb-4">
              <div>
                <h2 className="text-lg font-heading font-bold text-slate-200">
                  2. Select Your Current Skills
                </h2>
                <p className="text-xs text-slate-400">
                  Select the skills you already possess to identify your gaps
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-dark-200 text-slate-300">
                  Selected: <span className="text-primary-400">{selectedSkills.length}</span> / {taxonomy.skills.length}
                </span>
                <button
                  onClick={selectAllSkills}
                  disabled={analyzing}
                  className="text-xs text-primary-400 hover:text-primary-300 underline font-medium disabled:opacity-50"
                >
                  Select All
                </button>
                <button
                  onClick={clearAllSkills}
                  disabled={analyzing}
                  className="text-xs text-slate-400 hover:text-slate-300 underline font-medium disabled:opacity-50"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Skill Badges by Category */}
            <div className="space-y-4 mb-6">
              {Object.entries(groupedSkills).map(([category, skills]) => (
                <div key={category}>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    {category}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {skills.map((skill) => {
                      const isSelected = selectedSkills.includes(skill.name);
                      return (
                        <button
                          key={skill.name}
                          onClick={() => toggleSkill(skill.name)}
                          disabled={analyzing}
                          className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all flex items-center gap-2 ${
                            isSelected
                              ? 'bg-primary-500/20 text-primary-300 border border-primary-500/50 shadow-sm shadow-primary-500/20'
                              : 'bg-dark-200/80 text-slate-400 border border-white/5 hover:bg-dark-300 hover:text-slate-200'
                          } disabled:opacity-50`}
                        >
                          <span
                            className={`w-3.5 h-3.5 rounded flex items-center justify-center text-[10px] ${
                              isSelected
                                ? 'bg-primary-500 text-white'
                                : 'border border-slate-600'
                            }`}
                          >
                            {isSelected && <HiCheck className="w-3 h-3" />}
                          </span>
                          <span>{skill.name}</span>
                          <span className="text-[10px] opacity-60 capitalize">
                            ({skill.level})
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Action Row */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-white/5">
              <span className="text-xs text-slate-400">
                {selectedSkills.length === 0
                  ? 'Select at least 1 skill to run the analysis.'
                  : `${selectedSkills.length} skill(s) selected for ${taxonomy.role}.`}
              </span>
              <button
                onClick={handleAnalyze}
                disabled={selectedSkills.length === 0 || analyzing}
                className="btn-primary w-full sm:w-auto inline-flex items-center justify-center gap-2 !px-6 !py-2.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {analyzing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    Analyzing Skill Gap...
                  </>
                ) : (
                  <>
                    <HiSparkles className="w-4 h-4" /> Analyze Skill Gap
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Analysis Error State */}
        {analysisError && !analyzing && (
          <div className="glass-card p-6 mb-8 border border-rose-500/30 text-center !hover:transform-none">
            <HiExclamationCircle className="w-8 h-8 text-rose-400 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-200 mb-1">
              Skill Gap Analysis Error
            </h3>
            <p className="text-xs text-slate-400 mb-3">{analysisError}</p>
            <button
              onClick={handleAnalyze}
              className="btn-secondary text-xs inline-flex items-center gap-2"
            >
              <HiRefresh className="w-3.5 h-3.5" /> Retry Analysis
            </button>
          </div>
        )}

        {/* Visual Charts: Category Skill Progress & Radar Comparison */}
        {!taxonomyLoading && !taxonomyError && taxonomy && (
          <div className="grid lg:grid-cols-2 gap-8 mb-10">
            {/* Category Progress Bars */}
            <div className="glass-card p-6 !hover:transform-none">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-heading font-bold text-slate-200">
                  Category Skill Coverage
                </h3>
                <span className="text-xs text-slate-400">
                  {selectedSkills.length} / {taxonomy.skills.length} skills acquired
                </span>
              </div>
              {categoryCoverage.map((cat, i) => (
                <SkillBar
                  key={cat.category}
                  name={cat.category.charAt(0).toUpperCase() + cat.category.slice(1)}
                  current={cat.selected}
                  required={cat.total}
                  index={i}
                />
              ))}
            </div>

            {/* Radar Comparison Chart */}
            <div className="glass-card p-6 !hover:transform-none">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-heading font-bold text-slate-200">
                  Category Coverage Radar
                </h3>
                <span className="text-xs text-slate-400">Target: 100% per category</span>
              </div>
              <RadarChart
                labels={radarLabels}
                yourData={radarYourData}
                requiredData={radarRequiredData}
              />
            </div>
          </div>
        )}

        {/* Analysis Results Section */}
        {analysisResult && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-10 mb-10"
          >
            {/* Detailed Gaps Table */}
            <div className="glass-card p-6 !hover:transform-none overflow-x-auto">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-5">
                <div>
                  <h3 className="font-heading font-bold text-slate-200">
                    Skill Gap Breakdown — {analysisResult.targetRole}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Identified gaps prioritized by impact on role readiness
                  </p>
                </div>
                <span className="badge badge-amber self-start sm:self-auto">
                  {analysisResult.gaps?.length || 0} Gap(s) Identified
                </span>
              </div>

              {analysisResult.gaps && analysisResult.gaps.length > 0 ? (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="text-left py-3 px-4 text-slate-400 font-medium">Skill</th>
                      <th className="text-center py-3 px-4 text-slate-400 font-medium">Target Level</th>
                      <th className="text-center py-3 px-4 text-slate-400 font-medium">Priority</th>
                      <th className="text-left py-3 px-4 text-slate-400 font-medium">Recommendation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analysisResult.gaps.map((row) => (
                      <tr
                        key={row.skill}
                        className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="py-3 px-4 font-medium text-slate-200">
                          {row.skill}
                        </td>
                        <td className="py-3 px-4 text-center text-slate-300 capitalize text-xs">
                          {taxonomyLevelMap.get(row.skill.toLowerCase()) || 'Required'}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`badge ${priorityColors[row.priority] || 'badge-blue'}`}>
                            {row.priority}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-400 text-xs">
                          {row.resource}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="py-12 text-center">
                  <HiCheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                  <h4 className="text-base font-bold text-slate-200 mb-1">
                    Outstanding Match!
                  </h4>
                  <p className="text-xs text-slate-400">
                    No critical skill gaps identified for {analysisResult.targetRole}. You meet all key taxonomy requirements.
                  </p>
                </div>
              )}
            </div>

            {/* Recommended Learning Paths */}
            {analysisResult.gaps && analysisResult.gaps.length > 0 && (
              <div>
                <h3 className="text-2xl font-heading font-black mb-6">
                  Recommended <span className="gradient-text">Learning Paths</span>
                </h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {analysisResult.gaps.map((gap, i) => (
                    <motion.div
                      key={gap.skill}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.05 }}
                      className="glass-card p-5 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-bold text-primary-400 flex items-center gap-1">
                            <HiAcademicCap className="w-4 h-4" /> Learning Resource
                          </span>
                          <span className={`badge ${priorityColors[gap.priority] || 'badge-blue'}`}>
                            {gap.priority}
                          </span>
                        </div>
                        <h4 className="font-heading font-bold text-slate-200 mb-2">
                          {gap.skill}
                        </h4>
                        <p className="text-xs text-slate-400 leading-relaxed mb-4">
                          {gap.resource}
                        </p>
                      </div>

                      <a
                        href={`https://www.google.com/search?q=${encodeURIComponent(gap.resource || `${gap.skill} course`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary-400 hover:text-primary-300 font-medium inline-flex items-center gap-1.5 pt-3 border-t border-white/5"
                      >
                        Explore Course Options <HiExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Download Report Button */}
            <div className="text-center pt-4">
              <button
                className="btn-primary text-base !px-8 inline-flex items-center gap-2"
                onClick={() => window.print()}
              >
                <HiDownload className="w-5 h-5" /> Download Report
              </button>
            </div>
          </motion.div>
        )}

        {/* Prompt when analysis has not run yet */}
        {!analysisResult && !taxonomyLoading && !taxonomyError && (
          <div className="glass-card p-8 text-center !hover:transform-none border border-white/5">
            <HiLightBulb className="w-8 h-8 text-amber-400 mx-auto mb-2 opacity-80" />
            <h4 className="text-sm font-bold text-slate-300 mb-1">Ready for Skill Gap Analysis</h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Select your current skills from the taxonomy above and click &quot;Analyze Skill Gap&quot; to identify learning paths and priority areas.
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
