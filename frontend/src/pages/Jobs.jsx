import { useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import JobCard from '../components/JobCard';

const mockJobs = [
  { logo: '🚀', title: 'Senior Frontend Developer', company: 'TechFlow Inc.', location: 'San Francisco, CA', type: 'Full-time', matchPercent: 92, skills: ['React', 'TypeScript', 'CSS', 'Testing'] },
  { logo: '🏢', title: 'Full Stack Engineer', company: 'DataVault Corp', location: 'New York, NY', type: 'Full-time', matchPercent: 87, skills: ['Node.js', 'React', 'PostgreSQL', 'Docker'] },
  { logo: '🌐', title: 'Web Developer', company: 'CloudNine Studios', location: 'Remote', type: 'Remote', matchPercent: 81, skills: ['JavaScript', 'HTML/CSS', 'React', 'APIs'] },
  { logo: '⚡', title: 'Software Engineer', company: 'InnovateTech', location: 'Austin, TX', type: 'Hybrid', matchPercent: 78, skills: ['Python', 'JavaScript', 'AWS', 'Microservices'] },
  { logo: '🎯', title: 'Frontend Engineer', company: 'DesignLab AI', location: 'Seattle, WA', type: 'Full-time', matchPercent: 75, skills: ['React', 'Figma', 'Tailwind', 'Next.js'] },
  { logo: '💎', title: 'Junior Developer', company: 'StartupGrid', location: 'Remote', type: 'Remote', matchPercent: 70, skills: ['JavaScript', 'React', 'Git', 'REST APIs'] },
];

export default function Jobs() {
  const [form, setForm] = useState({ name: '', skills: '', experience: '', education: '', role: '' });
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.skills || !form.role) {
      toast.error('Please fill in skills and preferred role');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      const shuffled = [...mockJobs].sort(() => Math.random() - 0.5);
      setJobs(shuffled.map(j => ({ ...j, matchPercent: Math.max(60, j.matchPercent + Math.floor(Math.random() * 10 - 5)) })));
      setLoading(false);
      toast.success(`Found ${shuffled.length} matching jobs!`);
    }, 1200);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-heading font-black mb-3">Job <span className="gradient-text">Matcher</span></h1>
          <p className="text-slate-400">Enter your profile details and we'll find the best matching opportunities</p>
        </div>

        <div className="grid lg:grid-cols-[360px_1fr] gap-8">
          {/* Profile form */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <form onSubmit={handleSubmit} className="glass-card p-6 space-y-4 !hover:transform-none">
              <h3 className="font-heading font-bold text-slate-200">Your Profile</h3>
              <input type="text" placeholder="Full Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="glow-input text-sm" />
              <input type="text" placeholder="Skills (comma separated)" value={form.skills} onChange={e => setForm({...form, skills: e.target.value})} className="glow-input text-sm" />
              <select value={form.experience} onChange={e => setForm({...form, experience: e.target.value})} className="glow-input text-sm">
                <option value="">Experience Level</option>
                <option value="entry">Entry Level (0-2 years)</option>
                <option value="mid">Mid Level (3-5 years)</option>
                <option value="senior">Senior Level (5+ years)</option>
                <option value="lead">Lead/Principal (8+ years)</option>
              </select>
              <input type="text" placeholder="Education" value={form.education} onChange={e => setForm({...form, education: e.target.value})} className="glow-input text-sm" />
              <input type="text" placeholder="Preferred Role" value={form.role} onChange={e => setForm({...form, role: e.target.value})} className="glow-input text-sm" />
              <button type="submit" disabled={loading} className="w-full btn-primary flex items-center justify-center gap-2">
                {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : '🔍'} Find Matching Jobs
              </button>
            </form>
          </div>

          {/* Results */}
          <div>
            {jobs.length === 0 && !loading && (
              <div className="glass-card p-12 text-center">
                <span className="text-5xl mb-4 block">💼</span>
                <p className="text-slate-400 text-lg">No jobs yet</p>
                <p className="text-slate-500 text-sm mt-2">Fill in your profile and click "Find Matching Jobs"</p>
              </div>
            )}
            {loading && (
              <div className="glass-card p-12 flex flex-col items-center justify-center">
                <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-slate-400">Searching for matches...</p>
              </div>
            )}
            {!loading && jobs.length > 0 && (
              <div className="grid sm:grid-cols-2 gap-5">
                {jobs.map((job, i) => <JobCard key={i} job={job} index={i} />)}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
