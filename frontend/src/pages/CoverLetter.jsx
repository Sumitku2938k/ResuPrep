import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { HiDownload } from 'react-icons/hi';

const tones = [
  { id: 'professional', label: 'Professional', emoji: '👔' },
  { id: 'enthusiastic', label: 'Enthusiastic', emoji: '🔥' },
  { id: 'concise', label: 'Concise', emoji: '⚡' },
];

export default function CoverLetter() {
  const [form, setForm] = useState({ name: '', jobTitle: '', company: '', hiringManager: 'Hiring Manager', keySkills: '', achievement: '', tone: 'professional' });
  const [letter, setLetter] = useState('');
  const [loading, setLoading] = useState(false);
  const previewRef = useRef(null);

  const generateLetter = () => {
    const { name, jobTitle, company, hiringManager, keySkills, achievement, tone } = form;
    if (!name || !jobTitle || !company) return;

    const openings = {
      professional: `Dear ${hiringManager},\n\nI am writing to express my strong interest in the ${jobTitle} position at ${company}. With my background and expertise, I am confident in my ability to contribute meaningfully to your team.`,
      enthusiastic: `Dear ${hiringManager},\n\nI am thrilled to apply for the ${jobTitle} role at ${company}! The opportunity to bring my passion and skills to your innovative team is incredibly exciting.`,
      concise: `Dear ${hiringManager},\n\nI am applying for the ${jobTitle} position at ${company}. My qualifications make me a strong candidate for this role.`,
    };

    const bodies = {
      professional: `\n\nThroughout my career, I have developed strong expertise in ${keySkills || 'relevant technical and interpersonal skills'}. ${achievement ? `Notably, ${achievement}.` : ''} These experiences have prepared me to deliver exceptional results.\n\nI am particularly drawn to ${company}'s commitment to excellence and innovation. I believe my analytical mindset and proven track record would be valuable assets to your organization.\n\nI would welcome the opportunity to discuss how my qualifications align with your needs. Thank you for considering my application.\n\nSincerely,\n${name}`,
      enthusiastic: `\n\nWhat excites me most is leveraging my skills in ${keySkills || 'my areas of expertise'} to drive real results. ${achievement ? `I'm proud of achievements like ${achievement}, and I'm eager to bring that energy to ${company}.` : `I bring dedication and enthusiasm to every project.`}\n\nI would love the chance to show you what I can bring to the table!\n\nWith enthusiasm,\n${name}`,
      concise: `\n\nKey qualifications: ${keySkills || 'Relevant skills and experience'}. ${achievement ? `Key achievement: ${achievement}.` : ''}\n\nI look forward to discussing this opportunity.\n\nBest regards,\n${name}`,
    };

    setLetter(openings[tone] + bodies[tone]);
  };

  const handleChange = (key, value) => {
    const newForm = { ...form, [key]: value };
    setForm(newForm);
    if (newForm.name && newForm.jobTitle && newForm.company) {
      const f = newForm;
      const openings = {
        professional: `Dear ${f.hiringManager},\n\nI am writing to express my strong interest in the ${f.jobTitle} position at ${f.company}. With my background and expertise, I am confident in my ability to contribute meaningfully to your team.`,
        enthusiastic: `Dear ${f.hiringManager},\n\nI am thrilled to apply for the ${f.jobTitle} role at ${f.company}! The opportunity to bring my passion and skills to your innovative team is incredibly exciting.`,
        concise: `Dear ${f.hiringManager},\n\nI am applying for the ${f.jobTitle} position at ${f.company}. My qualifications make me a strong candidate for this role.`,
      };
      const bodies = {
        professional: `\n\nThroughout my career, I have developed strong expertise in ${f.keySkills || 'relevant technical and interpersonal skills'}. ${f.achievement ? `Notably, ${f.achievement}.` : ''} These experiences have prepared me to deliver exceptional results.\n\nI am particularly drawn to ${f.company}'s commitment to excellence and innovation. I believe my analytical mindset and proven track record would be valuable assets to your organization.\n\nI would welcome the opportunity to discuss how my qualifications align with your needs. Thank you for considering my application.\n\nSincerely,\n${f.name}`,
        enthusiastic: `\n\nWhat excites me most is leveraging my skills in ${f.keySkills || 'my areas of expertise'} to drive real results. ${f.achievement ? `I'm proud of achievements like ${f.achievement}, and I'm eager to bring that energy to ${f.company}.` : `I bring dedication and enthusiasm to every project.`}\n\nI would love the chance to show you what I can bring to the table!\n\nWith enthusiasm,\n${f.name}`,
        concise: `\n\nKey qualifications: ${f.keySkills || 'Relevant skills and experience'}. ${f.achievement ? `Key achievement: ${f.achievement}.` : ''}\n\nI look forward to discussing this opportunity.\n\nBest regards,\n${f.name}`,
      };
      setLetter(openings[f.tone] + bodies[f.tone]);
    }
  };

  const downloadPDF = async () => {
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      html2pdf().set({
        margin: 10,
        filename: `cover-letter-${form.company || 'output'}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      }).from(previewRef.current).save();
      toast.success('Downloading PDF...');
    } catch (err) {
      toast.error('PDF download failed');
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-heading font-black mb-3">Cover Letter <span className="gradient-text">Generator</span></h1>
          <p className="text-slate-400">Fill in the details and watch your cover letter generate in real-time</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Form */}
          <div className="glass-card p-6 !hover:transform-none space-y-4">
            <input placeholder="Your Full Name" value={form.name} onChange={e => handleChange('name', e.target.value)} className="glow-input text-sm p-2" />
            <input placeholder="Job Title" value={form.jobTitle} onChange={e => handleChange('jobTitle', e.target.value)} className="glow-input text-sm p-2" />
            <input placeholder="Company Name" value={form.company} onChange={e => handleChange('company', e.target.value)} className="glow-input text-sm p-2" />
            <input placeholder="Hiring Manager Name" value={form.hiringManager} onChange={e => handleChange('hiringManager', e.target.value)} className="glow-input text-sm p-2" />
            <input placeholder="Key Skills (comma separated)" value={form.keySkills} onChange={e => handleChange('keySkills', e.target.value)} className="glow-input text-sm p-2" />
            <textarea placeholder="Notable Achievement" rows={2} value={form.achievement} onChange={e => handleChange('achievement', e.target.value)} className="glow-input text-sm p-2 resize-none" />

            <div>
              <p className="text-sm text-slate-400 mb-2">Tone:</p>
              <div className="flex gap-2">
                {tones.map(t => (
                  <button
                    key={t.id}
                    onClick={() => handleChange('tone', t.id)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      form.tone === t.id
                        ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
                        : 'bg-dark-200 text-slate-400 hover:bg-dark-300'
                    }`}
                  >
                    {t.emoji} {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Preview */}
          <div>
            <div className="flex justify-end mb-3">
              <button onClick={downloadPDF} disabled={!letter} className="btn-primary text-sm flex items-center gap-2 disabled:opacity-30"><HiDownload /> Download PDF</button>
            </div>
            <div ref={previewRef} className="resume-paper rounded-lg p-8 min-h-[400px]">
              {letter ? (
                <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                  {letter}
                </div>
              ) : (
                <div className="flex items-center justify-center h-64 text-gray-400">
                  <p>Start filling in the form to see your preview...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
