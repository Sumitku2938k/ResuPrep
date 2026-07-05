import { motion } from 'framer-motion';

export default function TemplateCard({ template, index = 0, onUse, onPreview }) {
  const categoryColors = {
    tech: 'badge-blue',
    business: 'badge-amber',
    creative: 'badge-cyan',
    fresher: 'badge-green',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.3 }}
      className="glass-card overflow-hidden group"
    >
      {/* Mini preview */}
      <div className="h-48 p-4 bg-white relative overflow-hidden">
        <div className="transform scale-[0.45] origin-top-left w-[220%] h-[220%]">
          
          {template.previewConfig?.layout === 'sidebar' ? (
            <div className="flex h-full">
              <div className="w-1/3 p-4 text-white" style={{ backgroundColor: template.previewConfig?.accentColor || '#2563EB' }}>
                <div className="w-12 h-12 bg-white/20 rounded-full mx-auto mb-2" />
                <h3 className="text-center font-bold text-[10px] mb-2 leading-tight">John Anderson</h3>
                <div className="space-y-1 mb-2">
                  <div className="h-1 bg-white/40 w-full" />
                  <div className="h-1 bg-white/40 w-3/4" />
                </div>
                <div className="flex flex-wrap gap-1 mt-3">
                  <div className="h-2 w-6 bg-white/20 rounded" />
                  <div className="h-2 w-8 bg-white/20 rounded" />
                </div>
              </div>
              <div className="w-2/3 p-4">
                <h4 className="text-[10px] font-bold mb-1" style={{ color: template.previewConfig?.accentColor }}>Profile</h4>
                <div className="h-1 bg-gray-200 w-full mb-1"/><div className="h-1 bg-gray-200 w-5/6 mb-3"/>
                <h4 className="text-[10px] font-bold mb-1" style={{ color: template.previewConfig?.accentColor }}>Experience</h4>
                <div className="flex justify-between mb-1"><div className="h-2 bg-gray-800 w-16"/><div className="h-1 bg-gray-400 w-8"/></div>
                <div className="h-1 bg-gray-500 w-20 mb-1"/>
                <div className="h-1 bg-gray-200 w-full mb-1"/><div className="h-1 bg-gray-200 w-4/5"/>
              </div>
            </div>
          ) : template.previewConfig?.layout === 'creative' ? (
            <div className="h-full">
              <div className="p-4 text-white flex justify-between items-center" style={{ backgroundColor: template.previewConfig?.accentColor || '#2563EB' }}>
                <div>
                  <h3 className="text-xl font-black mb-1">John Anderson</h3>
                  <div className="flex gap-2 text-[8px] opacity-90">
                    <span>john@email.com</span><span>(555) 123-4567</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-full border-2 border-white shadow-sm" />
              </div>
              <div className="p-4">
                <h4 className="text-xs font-bold mb-2 uppercase border-b pb-1" style={{ color: template.previewConfig?.accentColor, borderColor: `${template.previewConfig?.accentColor}40` }}>Experience</h4>
                <div className="flex justify-between mb-1"><div className="h-2 bg-gray-800 w-24"/><div className="h-2 bg-gray-400 w-12"/></div>
                <div className="h-2 bg-gray-500 w-20 mb-2"/>
                <div className="h-1 bg-gray-200 w-full mb-1"/><div className="h-1 bg-gray-200 w-full mb-1"/><div className="h-1 bg-gray-200 w-4/5 mb-3"/>
              </div>
            </div>
          ) : (
            <div className={`p-4 ${template.previewConfig?.layout === 'classic' ? 'text-center' : template.previewConfig?.layout === 'modern' ? 'border-l-4 pl-4' : ''}`} style={{ borderColor: template.previewConfig?.layout === 'modern' ? template.previewConfig.accentColor : 'transparent', fontFamily: template.previewConfig?.fontFamily || 'Plus Jakarta Sans' }}>
              <h3 className="text-lg font-bold text-gray-900 mb-1">John Anderson</h3>
              <p className={`text-[9px] text-gray-500 mb-2 ${template.previewConfig?.layout === 'classic' ? 'flex justify-center gap-2' : ''}`}>
                <span>john@email.com</span>
                {template.previewConfig?.layout === 'classic' && <span>•</span>}
                <span className={template.previewConfig?.layout !== 'classic' ? "ml-2" : ""}> (555) 123-4567</span>
              </p>
              {template.previewConfig?.layout === 'classic' && <div className="border-b border-gray-300 w-full mb-2" />}
              
              <h4 className={`text-[10px] font-bold uppercase tracking-wider mb-1 mt-3 ${template.previewConfig?.layout === 'classic' ? 'border-b border-gray-300 pb-1' : template.previewConfig?.layout === 'minimal' ? 'text-gray-400' : 'border-b border-gray-200 pb-1'}`} style={{ color: template.previewConfig?.layout === 'minimal' ? '#9ca3af' : template.previewConfig?.layout === 'classic' ? '#374151' : template.previewConfig?.accentColor }}>
                Experience
              </h4>
              <div className="flex justify-between mt-2 mb-1">
                <div className="h-2 bg-gray-800 w-20"/>
                <div className="h-2 bg-gray-400 w-10"/>
              </div>
              <div className="h-2 bg-gray-500 w-16 mb-2"/>
              <div className="h-1 bg-gray-200 w-full mb-1"/><div className="h-1 bg-gray-200 w-5/6 mb-3"/>
              
              <h4 className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${template.previewConfig?.layout === 'classic' ? 'border-b border-gray-300 pb-1' : template.previewConfig?.layout === 'minimal' ? 'text-gray-400' : 'border-b border-gray-200 pb-1'}`} style={{ color: template.previewConfig?.layout === 'minimal' ? '#9ca3af' : template.previewConfig?.layout === 'classic' ? '#374151' : template.previewConfig?.accentColor }}>
                Skills
              </h4>
              <div className={`flex flex-wrap gap-1 mt-2 ${template.previewConfig?.layout === 'classic' ? 'justify-center' : ''}`}>
                {['React', 'Node.js', 'AWS'].map(s => (
                  <span key={s} className={`px-1.5 py-0.5 text-[8px] rounded font-medium ${template.previewConfig?.layout === 'minimal' ? 'bg-gray-100 text-gray-600' : ''}`} style={template.previewConfig?.layout !== 'minimal' ? { backgroundColor: `${template.previewConfig?.accentColor}15`, color: template.previewConfig?.accentColor } : {}}>
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-white/90 to-transparent pointer-events-none" />
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-heading font-bold text-slate-200">{template.name}</h3>
          <span className={`badge ${categoryColors[template.category] || 'badge-blue'}`}>
            {template.category}
          </span>
        </div>
        <p className="text-sm text-slate-500 mb-4 line-clamp-2">{template.description}</p>
        <div className="flex gap-2">
          <button onClick={() => onPreview?.(template)} className="flex-1 btn-outline text-sm !py-2">Preview</button>
          <button onClick={() => onUse?.(template)} className="flex-1 btn-primary text-sm !py-2">Use Template</button>
        </div>
      </div>
    </motion.div>
  );
}
