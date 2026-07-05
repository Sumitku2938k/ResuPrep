import { motion } from 'framer-motion';

export default function SkillBar({ name, current, required, index = 0 }) {
  const pct = Math.min(100, Math.round((current / required) * 100));
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className="mb-4"
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-medium text-slate-300">{name}</span>
        <span className="text-xs text-slate-500">{current}/{required}</span>
      </div>
      <div className="relative h-3 bg-dark-200 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, delay: index * 0.1, ease: 'easeOut' }}
          className={`h-full rounded-full ${
            pct >= 80 ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' :
            pct >= 50 ? 'bg-gradient-to-r from-amber-500 to-amber-400' :
            'bg-gradient-to-r from-red-500 to-red-400'
          }`}
        />
        {/* Required marker */}
        <div 
          className="absolute top-0 h-full w-0.5 bg-amber-400" 
          style={{ left: `${Math.min(100, required)}%` }}
          title={`Required: ${required}`}
        />
      </div>
    </motion.div>
  );
}
