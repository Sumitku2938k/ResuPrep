import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import ReviewCard from '../components/ReviewCard';
import { HiStar } from 'react-icons/hi';
import { saveFeedback, getFeedback } from '../services/storage';

const defaultReviews = [
  { name: 'Sarah Chen', role: 'Software Engineer', rating: 5, feature: 'resume-analyzer', message: 'The resume analyzer gave me incredibly detailed feedback. I improved my score from 62% to 89% in just two iterations!' },
  { name: 'Marcus Johnson', role: 'Product Manager', rating: 5, feature: 'skill-assessment', message: 'Skill assessments are concise but thorough. Great way to validate your knowledge and identify areas to improve.' },
  { name: 'Priya Sharma', role: 'Data Scientist', rating: 4, feature: 'cover-letter', message: 'The AI cover letter generator saved me hours. Each letter felt personalized and the tone options are fantastic.' },
  { name: 'Alex Rodriguez', role: 'UX Designer', rating: 5, feature: 'resume-builder', message: 'Beautiful templates and the live preview is so smooth. My exported PDF got compliments in interviews!' },
];

const features = ['general', 'resume-analyzer', 'job-matcher', 'resume-builder', 'cover-letter', 'skill-assessment'];

export default function Feedback() {
  const [reviews, setReviews] = useState(() => {
    const saved = getFeedback();
    return saved.length > 0 ? [...saved, ...defaultReviews] : defaultReviews;
  });
  const [form, setForm] = useState({ name: '', role: '', rating: 0, feature: 'general', message: '' });
  const [hoverRating, setHoverRating] = useState(0);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.message || form.rating === 0) {
      toast.error('Please fill in name, rating, and message');
      return;
    }
    const newReview = { ...form };
    saveFeedback(newReview);
    setReviews(prev => [newReview, ...prev]);
    setForm({ name: '', role: '', rating: 0, feature: 'general', message: '' });
    toast.success('Thank you for your feedback!');
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-heading font-black mb-3">Your <span className="gradient-text">Feedback</span></h1>
          <p className="text-slate-400">Help us improve ResuPrep with your thoughts and suggestions</p>
        </div>

        <div className="grid lg:grid-cols-[400px_1fr] gap-8">
          {/* Form */}
          <div className="glass-card p-6 !hover:transform-none lg:sticky lg:top-24 lg:self-start">
            <h3 className="font-heading font-bold text-slate-200 mb-5">Submit Feedback</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input placeholder="Your Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="glow-input text-sm p-2" />
              <input placeholder="Your Role (optional)" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="glow-input text-sm p-2" />

              <div>
                <p className="text-sm text-slate-400 mb-2">Rating</p>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(s => (
                    <button
                      key={s}
                      type="button"
                      onMouseEnter={() => setHoverRating(s)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setForm({ ...form, rating: s })}
                    >
                      <HiStar className={`w-7 h-7 transition-colors ${s <= (hoverRating || form.rating) ? 'text-amber-400' : 'text-slate-600'}`} />
                    </button>
                  ))}
                </div>
              </div>

              <select value={form.feature} onChange={e => setForm({ ...form, feature: e.target.value })} className="glow-input text-sm p-2">
                {features.map(f => (
                  <option key={f} value={f}>{f.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ')}</option>
                ))}
              </select>

              <textarea rows={4} placeholder="Your feedback message..." value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} className="glow-input text-sm p-2 resize-none" />

              <button type="submit" className="w-full btn-primary">Submit Feedback</button>
            </form>
          </div>

          {/* Reviews */}
          <div className="grid sm:grid-cols-2 gap-5 auto-rows-min">
            {reviews.map((review, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <ReviewCard review={review} />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
