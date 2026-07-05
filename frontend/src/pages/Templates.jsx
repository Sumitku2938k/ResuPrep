import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import TemplateCard from '../components/TemplateCard';

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

const tabs = ['all', 'tech', 'business', 'creative', 'fresher'];

export default function Templates() {
  const [activeTab, setActiveTab] = useState('all');
  const navigate = useNavigate();

  const filtered = activeTab === 'all' ? templates : templates.filter(t => t.category === activeTab);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-heading font-black mb-3">CV <span className="gradient-text">Templates</span></h1>
          <p className="text-slate-400">Choose from professionally designed templates and start building</p>
        </div>

        {/* Filter tabs */}
        <div className="flex justify-center gap-2 mb-10 flex-wrap">
          {tabs.map(tab => (
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

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map((template, i) => (
            <TemplateCard
              key={template.slug}
              template={template}
              index={i}
              onUse={() => navigate('/builder', { state: { template } })}
              onPreview={() => navigate('/builder', { state: { template } })}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}
