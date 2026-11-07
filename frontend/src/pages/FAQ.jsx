import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiChevronDown, HiRefresh, HiExclamationCircle, HiQuestionMarkCircle } from 'react-icons/hi';
import { getFAQsApi } from '../api/faq.js';

const categories = [
  { id: 'all', label: 'All Questions' },
  { id: 'getting-started', label: 'Getting Started' },
  { id: 'resume-analyzer', label: 'Resume Analyzer' },
  { id: 'job-matching', label: 'Job Matching' },
  { id: 'cv-templates', label: 'CV & Templates' },
  { id: 'skill-assessment', label: 'Skill Assessment' },
];

export default function FAQ() {
  const [activeCategory, setActiveCategory] = useState('getting-started');
  const [openIndex, setOpenIndex] = useState(null);
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchFaqs = useCallback(async (cat = activeCategory) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getFAQsApi({ category: cat });
      if (res?.success && Array.isArray(res?.data?.faqs)) {
        setFaqs(res.data.faqs);
      } else {
        setFaqs([]);
      }
    } catch (err) {
      setError(err?.message || 'Failed to load FAQs. Please try again.');
      setFaqs([]);
    } finally {
      setLoading(false);
    }
  }, [activeCategory]);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    getFAQsApi({ category: activeCategory })
      .then((res) => {
        if (!isMounted) return;
        if (res?.success && Array.isArray(res?.data?.faqs)) {
          setFaqs(res.data.faqs);
        } else {
          setFaqs([]);
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err?.message || 'Failed to load FAQs. Please try again.');
        setFaqs([]);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [activeCategory]);

  const handleSelectCategory = (categoryId) => {
    setActiveCategory(categoryId);
    setOpenIndex(null);
  };

  const handleRetry = () => {
    fetchFaqs(activeCategory);
  };

  // Safely filter and normalize FAQ items
  const validFaqs = useMemo(() => {
    if (!Array.isArray(faqs)) return [];
    return faqs.filter(
      (item) => item && (item.question || item.q) && (item.answer || item.a)
    );
  }, [faqs]);

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
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleSelectCategory(cat.id)}
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

          {/* Content Area */}
          <div>
            {/* Loading State */}
            {loading && (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="w-10 h-10 border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin mb-4" />
                <p className="text-slate-400 text-sm">Loading frequently asked questions...</p>
              </div>
            )}

            {/* Error State */}
            {error && !loading && (
              <div className="glass-card p-8 text-center my-4 border border-rose-500/30 !hover:transform-none">
                <HiExclamationCircle className="w-10 h-10 text-rose-400 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-200 mb-2">Unable to Load FAQs</h3>
                <p className="text-sm text-slate-400 mb-5">{error}</p>
                <button
                  onClick={handleRetry}
                  className="btn-primary text-sm inline-flex items-center gap-2 !px-5 !py-2"
                >
                  <HiRefresh className="w-4 h-4" /> Retry
                </button>
              </div>
            )}

            {/* Empty State */}
            {!loading && !error && validFaqs.length === 0 && (
              <div className="glass-card p-12 text-center my-4 !hover:transform-none border border-white/5">
                <HiQuestionMarkCircle className="w-10 h-10 text-slate-500 mx-auto mb-3 opacity-60" />
                <h3 className="text-base font-bold text-slate-300 mb-1">No FAQs Found</h3>
                <p className="text-sm text-slate-400 max-w-md mx-auto">
                  There are currently no frequently asked questions in this category.
                </p>
              </div>
            )}

            {/* Accordion */}
            {!loading && !error && validFaqs.length > 0 && (
              <div className="space-y-3">
                {validFaqs.map((faq, i) => {
                  const q = faq.question || faq.q;
                  const a = faq.answer || faq.a;
                  const key = faq._id || faq.id || `${q}-${i}`;
                  const isOpen = openIndex === i;

                  return (
                    <motion.div
                      key={key}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="glass-card overflow-hidden !hover:transform-none"
                    >
                      <button
                        onClick={() => setOpenIndex(isOpen ? null : i)}
                        className="w-full flex items-center justify-between p-5 text-left transition-colors hover:bg-white/[0.02]"
                        aria-expanded={isOpen}
                      >
                        <span className="font-heading font-bold text-sm text-slate-200 pr-4">{q}</span>
                        <HiChevronDown className={`flex-shrink-0 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                      </button>
                      <AnimatePresence>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <div className="px-5 pb-5 text-sm text-slate-400 leading-relaxed border-t border-white/5 pt-3">
                              {a}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
