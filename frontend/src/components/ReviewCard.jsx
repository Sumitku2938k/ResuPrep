import { HiStar } from 'react-icons/hi';

export default function ReviewCard({ review }) {
  const initials = review.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const colors = ['from-primary-500 to-cyan-500', 'from-purple-500 to-pink-500', 'from-amber-500 to-orange-500', 'from-emerald-500 to-teal-500'];
  const colorClass = colors[review.name.length % colors.length];

  return (
    <div className="glass-card p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${colorClass} flex items-center justify-center text-white text-sm font-bold`}>
          {initials}
        </div>
        <div className="flex-1">
          <h4 className="font-heading font-bold text-sm text-slate-200">{review.name}</h4>
          <p className="text-xs text-slate-500">{review.role}</p>
        </div>
        {review.feature && (
          <span className="badge-cyan badge">{review.feature}</span>
        )}
      </div>

      <div className="flex gap-0.5 mb-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <HiStar
            key={star}
            className={`w-4 h-4 ${star <= review.rating ? 'text-amber-400' : 'text-slate-600'}`}
          />
        ))}
      </div>

      <p className="text-sm text-slate-400 leading-relaxed">{review.message}</p>
    </div>
  );
}
