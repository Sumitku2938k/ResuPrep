import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiStar, HiChartBar, HiBriefcase, HiAcademicCap, HiDocumentText, HiTemplate, HiLightningBolt, HiQuestionMarkCircle, HiChat, HiClipboardCheck } from 'react-icons/hi';

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.08 } },
};

const features = [
  { icon: HiChartBar, title: 'Resume Analyzer', desc: 'AI-powered resume scoring with keyword matching and improvement tips', path: '/analyzer', color: 'from-blue-500 to-cyan-500' },
  { icon: HiBriefcase, title: 'Job Matcher', desc: 'Find roles that match your skills and experience level', path: '/jobs', color: 'from-purple-500 to-pink-500' },
  { icon: HiLightningBolt, title: 'Skill Gap Analysis', desc: 'Identify skills to develop with a radar chart comparison', path: '/skills', color: 'from-amber-500 to-orange-500' },
  { icon: HiDocumentText, title: 'Resume Builder', desc: 'Create professional resumes with live preview and PDF export', path: '/builder', color: 'from-emerald-500 to-teal-500' },
  { icon: HiClipboardCheck, title: 'Cover Letter', desc: 'Generate tailored cover letters with AI in 3 tones', path: '/cover-letter', color: 'from-rose-500 to-pink-500' },
  { icon: HiTemplate, title: 'CV Templates', desc: 'Choose from 8+ professionally designed resume templates', path: '/templates', color: 'from-indigo-500 to-blue-500' },
  { icon: HiAcademicCap, title: 'Skill Assessment', desc: 'Test your skills with interactive quizzes and get scored', path: '/assessment', color: 'from-cyan-500 to-blue-500' },
  { icon: HiQuestionMarkCircle, title: 'FAQ', desc: 'Common questions about resumes, ATS, and career strategy', path: '/faq', color: 'from-slate-500 to-gray-500' },
  { icon: HiChat, title: 'AI Chatbot', desc: 'Get instant career advice from Vio, your AI assistant', path: '#chatbot', color: 'from-green-500 to-emerald-500' },
];

const steps = [
  { num: '01', title: 'Upload Resume', desc: 'Upload your PDF/DOCX resume or paste text', icon: '📄' },
  { num: '02', title: 'Describe the Job', desc: 'Paste the target job description', icon: '📋' },
  { num: '03', title: 'AI Analyzes', desc: 'Our NLP engine compares and scores your match', icon: '🤖' },
  { num: '04', title: 'Get Results', desc: 'Receive score, gaps, and actionable tips', icon: '🎯' },
];

const testimonials = [
  { name: 'Sarah Chen', role: 'Software Engineer', text: 'CVIsionary helped me optimize my resume and land 3 interviews in one week. The keyword matching is incredibly accurate!', rating: 5 },
  { name: 'Marcus Johnson', role: 'Product Manager', text: 'The skill gap analysis showed me exactly what to learn. I got certified in the recommended areas and got promoted within 6 months.', rating: 5 },
  { name: 'Priya Sharma', role: 'Data Scientist', text: 'The AI cover letter generator saved me hours. Each letter was tailored perfectly, and I loved the different tone options.', rating: 4 },
  { name: 'Alex Rodriguez', role: 'UX Designer', text: 'Beautiful templates and the resume builder preview is so smooth. Exported a PDF that got me compliments in interviews!', rating: 5 },
];

export default function Home() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
      {/* Hero */}
      <section className="relative px-4 pt-16 pb-20 sm:pt-24 sm:pb-28 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '-3s' }} />
        </div>

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <motion.div {...fadeUp}>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-400 text-sm font-medium mb-6">
              <HiLightningBolt className="text-amber-400" /> AI-Powered Career Toolkit
            </span>
          </motion.div>

          <motion.h1
            {...fadeUp}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-7xl font-heading font-black leading-tight mb-6"
          >
            Match Your Resume.{' '}
            <span className="gradient-text">Land Your Dream Job.</span>
          </motion.h1>

          <motion.p {...fadeUp} transition={{ delay: 0.2 }} className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            CVIsionary uses AI & NLP to analyze, match, and guide your career. Get instant scoring, skill gap insights, and professional tools — all in one platform.
          </motion.p>

          <motion.div {...fadeUp} transition={{ delay: 0.3 }} className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/analyzer" className="btn-primary text-lg !px-8 !py-4 shadow-lg shadow-primary-500/25">
              Analyze My Resume
            </Link>
            <Link to="/templates" className="btn-outline text-lg !px-8 !py-4">
              Browse Templates
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="px-4 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto glass-card p-6 !hover:transform-none"
        >
          <div className="grid grid-cols-3 divide-x divide-white/5">
            {[
              { value: '500+', label: 'Resumes Analyzed' },
              { value: '92%', label: 'Accuracy Rate' },
              { value: '3x', label: 'Faster Hiring' },
            ].map((stat) => (
              <div key={stat.label} className="text-center px-4">
                <p className="text-2xl sm:text-3xl font-heading font-black gradient-text">{stat.value}</p>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section className="px-4 py-16">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-heading font-black mb-4">
              Everything You Need to <span className="gradient-text">Stand Out</span>
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto">Complete career toolkit powered by AI to help you from resume to offer letter</p>
          </motion.div>

          <motion.div variants={staggerContainer} initial="initial" whileInView="animate" viewport={{ once: true }} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <motion.div key={f.title} variants={fadeUp}>
                <Link to={f.path} className="block glass-card p-6 h-full group">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <f.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-heading font-bold text-lg text-slate-200 mb-2">{f.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="px-4 py-16">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-heading font-black mb-4">
              How It <span className="gradient-text">Works</span>
            </h2>
            <p className="text-slate-400">Four simple steps to career clarity</p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="glass-card p-6 text-center relative"
              >
                <span className="text-4xl mb-4 block">{step.icon}</span>
                <span className="absolute top-4 right-4 text-xs font-heading font-black text-primary-500/30">{step.num}</span>
                <h3 className="font-heading font-bold text-slate-200 mb-2">{step.title}</h3>
                <p className="text-sm text-slate-400">{step.desc}</p>
                {i < 3 && (
                  <div className="hidden lg:block absolute top-1/2 -right-3 w-6 h-0.5 bg-gradient-to-r from-primary-500/50 to-transparent" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="px-4 py-16">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-heading font-black mb-4">
              What People <span className="gradient-text">Say</span>
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass-card p-5"
              >
                <div className="flex gap-0.5 mb-3">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <HiStar key={s} className={`w-4 h-4 ${s <= t.rating ? 'text-amber-400' : 'text-slate-600'}`} />
                  ))}
                </div>
                <p className="text-sm text-slate-400 mb-4 leading-relaxed">"{t.text}"</p>
                <div>
                  <p className="font-heading font-bold text-sm text-slate-200">{t.name}</p>
                  <p className="text-xs text-slate-500">{t.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </motion.div>
  );
}
