import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { getTemplatesApi } from '../api/templates';
import TemplateCard from '../components/TemplateCard';
import { HiRefresh, HiExclamationCircle, HiDocumentText } from 'react-icons/hi';

const tabs = ['all', 'tech', 'business', 'creative', 'fresher'];

export default function Templates() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const navigate = useNavigate();

  const fetchTemplates = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getTemplatesApi();
      if (res?.success && Array.isArray(res?.data?.templates)) {
        setTemplates(res.data.templates);
      } else {
        setTemplates([]);
      }
    } catch (err) {
      setError(err?.message || 'Failed to load templates. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const filtered =
    activeTab === 'all'
      ? templates
      : templates.filter((t) => t.category === activeTab);

  const handleSelectTemplate = (template) => {
    if (!template?.slug) return;
    navigate('/builder', { state: { template } });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-heading font-black mb-3">
            CV <span className="gradient-text">Templates</span>
          </h1>
          <p className="text-slate-400">Choose from professionally designed templates and start building</p>
        </div>

        {/* Filter tabs */}
        <div className="flex justify-center gap-2 mb-10 flex-wrap">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-xl text-sm font-medium capitalize transition-all ${
                activeTab === tab
                  ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
                  : 'bg-dark-200 text-slate-400 hover:bg-dark-300 hover:text-slate-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin mb-4" />
            <p className="text-slate-400 text-sm">Loading template catalogue...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="glass-card max-w-md mx-auto p-8 text-center my-8">
            <HiExclamationCircle className="w-12 h-12 text-rose-400 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-200 mb-2">Unable to Load Templates</h3>
            <p className="text-sm text-slate-400 mb-6">{error}</p>
            <button
              onClick={fetchTemplates}
              className="btn-primary inline-flex items-center gap-2 px-6 py-2.5 text-sm"
            >
              <HiRefresh className="w-4 h-4" /> Try Again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filtered.length === 0 && (
          <div className="glass-card max-w-md mx-auto p-8 text-center my-8">
            <HiDocumentText className="w-12 h-12 text-slate-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-200 mb-2">
              {templates.length === 0 ? 'No Templates Found' : `No ${activeTab} Templates Available`}
            </h3>
            <p className="text-sm text-slate-400 mb-4">
              {templates.length === 0
                ? 'There are currently no active resume templates in the catalogue.'
                : 'Try selecting another category tab to view available designs.'}
            </p>
            {activeTab !== 'all' && (
              <button
                onClick={() => setActiveTab('all')}
                className="btn-outline text-sm px-4 py-2"
              >
                Show All Templates
              </button>
            )}
          </div>
        )}

        {/* Success Grid */}
        {!loading && !error && filtered.length > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map((template, i) => (
              <TemplateCard
                key={template.slug || template._id || i}
                template={template}
                index={i}
                onUse={() => handleSelectTemplate(template)}
                onPreview={() => handleSelectTemplate(template)}
              />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
