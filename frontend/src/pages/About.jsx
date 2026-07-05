import { motion } from 'framer-motion';
import { HiArrowRight } from 'react-icons/hi';

const techStack = [
  { name: 'React', desc: 'UI Framework', color: 'from-cyan-500 to-blue-500', icon: '⚛️' },
  { name: 'Node.js', desc: 'Backend Runtime', color: 'from-green-500 to-emerald-500', icon: '🟢' },
  { name: 'MongoDB', desc: 'Database', color: 'from-green-600 to-green-500', icon: '🍃' },
  { name: 'OpenAI', desc: 'AI Analysis', color: 'from-purple-500 to-pink-500', icon: '🤖' },
  { name: 'NLP Engine', desc: 'Text Processing', color: 'from-amber-500 to-orange-500', icon: '🧠' },
  { name: 'TF-IDF', desc: 'Similarity Scoring', color: 'from-blue-500 to-indigo-500', icon: '📊' },
];

const flowSteps = [
  { label: 'User', icon: '👤' },
  { label: 'Upload', icon: '📄' },
  { label: 'NLP Engine', icon: '🧠' },
  { label: 'AI Match', icon: '🤖' },
  { label: 'Score & Report', icon: '📊' },
  { label: 'Results', icon: '🎯' },
];

export default function About() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="px-4 py-8">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-heading font-black mb-3">About <span className="gradient-text">ResuPrep</span></h1>
          <p className="text-slate-400 max-w-2xl mx-auto">The intelligent career platform that bridges the gap between talent and opportunity through AI-powered analysis and personalized insights.</p>
        </div>

        {/* Description */}
        <div className="glass-card p-8 mb-10 !hover:transform-none">
          <h2 className="font-heading font-bold text-xl text-slate-200 mb-4">Our Platform</h2>
          <div className="space-y-4 text-slate-400 leading-relaxed">
            <p>ResuPrep is a comprehensive career toolkit that leverages artificial intelligence and natural language processing to help professionals at every stage of their career journey. From fresh graduates crafting their first resume to senior executives seeking their next role, our platform provides actionable insights that make a real difference.</p>
            <p>Our core technology combines keyword extraction, TF-IDF similarity scoring, and GPT-powered contextual analysis to deliver highly accurate resume-to-job compatibility assessments. Unlike simple keyword matchers, ResuPrep understands context, evaluates skill relevance, and provides specific, actionable recommendations for improvement.</p>
            <p>Beyond analysis, ResuPrep offers a complete suite of career tools — from AI-generated cover letters and professional resume templates to skill assessments and gap analysis — all designed to streamline the job search process and help you present your best professional self.</p>
          </div>
        </div>

        {/* Architecture Flow */}
        <div className="glass-card p-8 mb-10 !hover:transform-none">
          <h2 className="font-heading font-bold text-xl text-slate-200 mb-6">System Architecture</h2>
          <div className="flex items-center justify-between overflow-x-auto pb-4 gap-2">
            {flowSteps.map((step, i) => (
              <div key={step.label} className="flex items-center flex-shrink-0">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="flex flex-col items-center gap-2"
                >
                  <div className="w-16 h-16 rounded-2xl bg-dark-200 border border-white/5 flex items-center justify-center text-2xl">
                    {step.icon}
                  </div>
                  <span className="text-xs text-slate-400 font-medium whitespace-nowrap">{step.label}</span>
                </motion.div>
                {i < flowSteps.length - 1 && (
                  <HiArrowRight className="text-primary-500/50 mx-2 flex-shrink-0" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Tech Stack */}
        <div className="mb-10">
          <h2 className="text-2xl font-heading font-black text-center mb-6">Tech <span className="gradient-text">Stack</span></h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {techStack.map((tech, i) => (
              <motion.div
                key={tech.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="glass-card p-5 flex items-center gap-4"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tech.color} flex items-center justify-center text-xl`}>
                  {tech.icon}
                </div>
                <div>
                  <h3 className="font-heading font-bold text-slate-200">{tech.name}</h3>
                  <p className="text-xs text-slate-500">{tech.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Mission */}
        <div className="glass-card p-8 text-center !hover:transform-none">
          <h2 className="font-heading font-bold text-xl text-slate-200 mb-4">Our Mission</h2>
          <p className="text-slate-400 leading-relaxed max-w-2xl mx-auto">
            To democratize career advancement by making professional-grade resume analysis, job matching, and career guidance accessible to everyone. We believe that every professional deserves intelligent tools that help them present their best selves and find opportunities where they can truly thrive.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
