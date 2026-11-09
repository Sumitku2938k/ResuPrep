import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import ReviewCard from '../components/ReviewCard';
import { HiStar, HiRefresh, HiExclamationCircle, HiChatAlt2 } from 'react-icons/hi';
import { createFeedbackApi, getFeedbackApi, VALID_FEEDBACK_FEATURES } from '../api/feedback.js';

const features = VALID_FEEDBACK_FEATURES || [
  'general',
  'resume-analyzer',
  'job-matcher',
  'resume-builder',
  'cover-letter',
  'skill-assessment',
];

export default function Feedback() {
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [reviewsError, setReviewsError] = useState(null);

  const [form, setForm] = useState({
    name: '',
    role: '',
    rating: 0,
    feature: 'general',
    message: '',
  });
  const [hoverRating, setHoverRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Fetch public reviews from backend
  const fetchReviews = useCallback(async () => {
    setLoadingReviews(true);
    setReviewsError(null);
    try {
      const res = await getFeedbackApi();
      if (res?.success && Array.isArray(res?.data?.feedback)) {
        setReviews(res.data.feedback);
      } else {
        setReviews([]);
      }
    } catch (err) {
      setReviewsError(err?.message || 'Failed to load community feedback.');
      setReviews([]);
    } finally {
      setLoadingReviews(false);
    }
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  // Form submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Prevent duplicate submissions
    if (submitting) return;

    // Client-side validations conforming to backend Joi contract
    const trimmedName = form.name.trim();
    const trimmedMessage = form.message.trim();
    const trimmedRole = form.role.trim();

    if (!trimmedName || trimmedName.length < 2) {
      toast.error('Please enter a name with at least 2 characters.');
      return;
    }
    if (trimmedName.length > 50) {
      toast.error('Name cannot exceed 50 characters.');
      return;
    }
    if (!form.rating || form.rating < 1 || form.rating > 5) {
      toast.error('Please select a rating between 1 and 5 stars.');
      return;
    }
    if (trimmedRole.length > 50) {
      toast.error('Role cannot exceed 50 characters.');
      return;
    }
    if (!trimmedMessage || trimmedMessage.length < 10) {
      toast.error('Please provide a message with at least 10 characters.');
      return;
    }
    if (trimmedMessage.length > 1000) {
      toast.error('Message cannot exceed 1000 characters.');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const payload = {
        name: trimmedName,
        rating: form.rating,
        message: trimmedMessage,
        ...(trimmedRole && { role: trimmedRole }),
        ...(form.feature && { feature: form.feature }),
      };

      const res = await createFeedbackApi(payload);

      if (res?.success) {
        toast.success(res.message || 'Thank you for your feedback!');
        // Reset form after verified successful submission
        setForm({ name: '', role: '', rating: 0, feature: 'general', message: '' });
        setHoverRating(0);
        // Refresh reviews list from backend
        await fetchReviews();
      } else {
        throw new Error(res?.message || 'Failed to submit feedback.');
      }
    } catch (err) {
      const msg = err?.message || 'Failed to submit feedback. Please try again.';
      setSubmitError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-heading font-black mb-3">
            Your <span className="gradient-text">Feedback</span>
          </h1>
          <p className="text-slate-400">Help us improve ResuPrep with your thoughts and suggestions</p>
        </div>

        <div className="grid lg:grid-cols-[400px_1fr] gap-8">
          {/* Submission Form */}
          <div className="glass-card p-6 !hover:transform-none lg:sticky lg:top-24 lg:self-start">
            <h3 className="font-heading font-bold text-slate-200 mb-5">Submit Feedback</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <input
                  placeholder="Your Name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  disabled={submitting}
                  className="glow-input text-sm p-2 w-full disabled:opacity-50"
                  maxLength={50}
                />
              </div>

              <div>
                <input
                  placeholder="Your Role (optional, e.g. Software Engineer)"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  disabled={submitting}
                  className="glow-input text-sm p-2 w-full disabled:opacity-50"
                  maxLength={50}
                />
              </div>

              <div>
                <p className="text-sm text-slate-400 mb-2">Rating</p>
                <div className="flex gap-1" role="group" aria-label="Rating selection">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      disabled={submitting}
                      onMouseEnter={() => setHoverRating(s)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setForm({ ...form, rating: s })}
                      className="disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label={`${s} star`}
                    >
                      <HiStar
                        className={`w-7 h-7 transition-colors ${
                          s <= (hoverRating || form.rating) ? 'text-amber-400' : 'text-slate-600'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <select
                  value={form.feature}
                  onChange={(e) => setForm({ ...form, feature: e.target.value })}
                  disabled={submitting}
                  className="glow-input text-sm p-2 w-full disabled:opacity-50"
                >
                  {features.map((f) => (
                    <option key={f} value={f}>
                      {f.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <textarea
                  rows={4}
                  placeholder="Your feedback message (min 10 characters)..."
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  disabled={submitting}
                  className="glow-input text-sm p-2 resize-none w-full disabled:opacity-50"
                  maxLength={1000}
                />
              </div>

              {submitError && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                  {submitError}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full btn-primary inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Feedback'
                )}
              </button>
            </form>
          </div>

          {/* Reviews List */}
          <div>
            {/* Reviews Loading State */}
            {loadingReviews && (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-10 h-10 border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin mb-4" />
                <p className="text-slate-400 text-sm">Loading community feedback...</p>
              </div>
            )}

            {/* Reviews Error State */}
            {reviewsError && !loadingReviews && (
              <div className="glass-card p-8 text-center my-4 border border-rose-500/30 !hover:transform-none">
                <HiExclamationCircle className="w-10 h-10 text-rose-400 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-200 mb-2">Unable to Load Feedback</h3>
                <p className="text-sm text-slate-400 mb-5">{reviewsError}</p>
                <button
                  onClick={fetchReviews}
                  className="btn-primary text-sm inline-flex items-center gap-2 !px-5 !py-2"
                >
                  <HiRefresh className="w-4 h-4" /> Try Again
                </button>
              </div>
            )}

            {/* Empty State */}
            {!loadingReviews && !reviewsError && reviews.length === 0 && (
              <div className="glass-card p-12 text-center my-4 !hover:transform-none border border-white/5">
                <HiChatAlt2 className="w-12 h-12 text-slate-500 mx-auto mb-3 opacity-60" />
                <h3 className="text-base font-bold text-slate-300 mb-1">No Feedback Yet</h3>
                <p className="text-sm text-slate-400 max-w-md mx-auto">
                  Be the first to share your thoughts on ResuPrep using the form on the left!
                </p>
              </div>
            )}

            {/* Reviews Grid */}
            {!loadingReviews && !reviewsError && reviews.length > 0 && (
              <div className="grid sm:grid-cols-2 gap-5 auto-rows-min">
                {reviews.map((review, i) => (
                  <motion.div
                    key={review._id || review.id || `${review.name}-${i}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.04, 0.4) }}
                  >
                    <ReviewCard review={review} />
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
