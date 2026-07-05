import { Link } from 'react-router-dom';
import { HiHeart } from 'react-icons/hi';

const footerLinks = [
  {
    title: 'Product',
    links: [
      { name: 'Resume Analyzer', path: '/analyzer' },
      { name: 'Job Matcher', path: '/jobs' },
      { name: 'Resume Builder', path: '/builder' },
      { name: 'Cover Letter', path: '/cover-letter' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { name: 'CV Templates', path: '/templates' },
      { name: 'Skill Assessment', path: '/assessment' },
      { name: 'Skill Gap Analysis', path: '/skills' },
      { name: 'FAQ', path: '/faq' },
    ],
  },
  {
    title: 'Company',
    links: [
      { name: 'About', path: '/about' },
      { name: 'Feedback', path: '/feedback' },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-white/5 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <svg width="28" height="28" viewBox="0 0 36 36" fill="none">
                <defs>
                  <linearGradient id="footerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#2563EB" />
                    <stop offset="100%" stopColor="#06b6d4" />
                  </linearGradient>
                </defs>
                <path d="M18 2L32 10V26L18 34L4 26V10L18 2Z" fill="url(#footerGrad)" opacity="0.9"/>
                <path d="M18 8L26 13V23L18 28L10 23V13L18 8Z" fill="#060d1a" opacity="0.6"/>
                <path d="M18 14L22 16.5V21.5L18 24L14 21.5V16.5L18 14Z" fill="url(#footerGrad)"/>
              </svg>
              <span className="font-heading font-black text-lg">
                <span className="gradient-text">Resu</span>Prep
              </span>
            </Link>
            <p className="text-sm text-slate-500 leading-relaxed">
              AI-powered resume analysis and career toolkit to help you land your dream job.
            </p>
          </div>

          {footerLinks.map((group) => (
            <div key={group.title}>
              <h4 className="font-heading font-bold text-slate-300 mb-4">{group.title}</h4>
              <ul className="space-y-2">
                {group.links.map((link) => (
                  <li key={link.path}>
                    <Link
                      to={link.path}
                      className="text-sm text-slate-500 hover:text-primary-500 transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-white/5 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} ResuPrep. All rights reserved.
          </p>
          <p className="text-sm text-slate-500 flex items-center gap-1">
            Built with <HiHeart className="text-red-500" /> for job seekers everywhere
          </p>
        </div>
      </div>
    </footer>
  );
}
