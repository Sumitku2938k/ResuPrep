import { motion } from 'framer-motion';

export default function JobCard({ job, index = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.3 }}
      className="glass-card p-5"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{job.logo}</span>
          <div>
            <h3 className="font-heading font-bold text-slate-200">{job.title}</h3>
            <p className="text-sm text-slate-400">{job.company}</p>
          </div>
        </div>
        <span className="badge bg-gradient-to-r from-primary-500/20 to-cyan-500/20 text-cyan-400 font-bold px-3 py-1">
          {job.matchPercent}% Match
        </span>
      </div>

      <div className="flex items-center gap-4 text-xs text-slate-500 mb-3">
        <span>📍 {job.location}</span>
        <span>💼 {job.type}</span>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-4">
        {job.skills?.map((skill) => (
          <span key={skill} className="badge-blue badge">{skill}</span>
        ))}
      </div>

      <div className="flex gap-2">
        <button className="flex-1 btn-outline text-sm !py-2">View Details</button>
        <button className="flex-1 btn-primary text-sm !py-2">Apply Now</button>
      </div>
    </motion.div>
  );
}
