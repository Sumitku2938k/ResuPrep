import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { HiPlus, HiTrash, HiDownload } from 'react-icons/hi';

const emptyResume = {
  personalInfo: { fullName: '', email: '', phone: '', location: '', linkedin: '', website: '', photo: '' },
  summary: '',
  education: [{ institution: '', degree: '', field: '', startDate: '', endDate: '', gpa: '' }],
  experience: [{ company: '', position: '', location: '', startDate: '', endDate: '', current: false, description: '' }],
  skills: [''],
  projects: [{ name: '', description: '', technologies: '', link: '' }],
  certifications: [{ name: '', issuer: '', date: '', link: '' }],
};

export default function Builder() {
  const [resume, setResume] = useState(emptyResume);
  const previewRef = useRef(null);
  const location = useLocation();
  
  const [templateConfig, setTemplateConfig] = useState({
    accentColor: '#2563EB',
    layout: 'modern',
    fontFamily: 'Plus Jakarta Sans'
  });

  useEffect(() => {
    if (location.state?.template?.previewConfig) {
      setTemplateConfig(location.state.template.previewConfig);
    }
  }, [location]);

  const updatePersonal = (key, value) => {
    setResume(prev => ({ ...prev, personalInfo: { ...prev.personalInfo, [key]: value } }));
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        toast.error('Photo size must be under 1MB to save locally');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        updatePersonal('photo', reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const updateArray = (section, index, key, value) => {
    setResume(prev => {
      const arr = [...prev[section]];
      arr[index] = { ...arr[index], [key]: value };
      return { ...prev, [section]: arr };
    });
  };

  const addItem = (section, template) => {
    setResume(prev => ({ ...prev, [section]: [...prev[section], template] }));
  };

  const removeItem = (section, index) => {
    setResume(prev => ({ ...prev, [section]: prev[section].filter((_, i) => i !== index) }));
  };

  const downloadPDF = async () => {
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      html2pdf().set({
        margin: 0,
        filename: `${resume.personalInfo.fullName || 'resume'}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      }).from(previewRef.current).save();
      toast.success('Downloading PDF...');
    } catch (err) {
      toast.error('PDF download failed');
    }
  };

  const p = resume.personalInfo;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-heading font-black mb-3">Resume <span className="gradient-text">Builder</span></h1>
          <p className="text-slate-400">Build your professional resume with live preview</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Form */}
          <div className="space-y-5 max-h-[80vh] overflow-y-auto pr-2">
            {/* Personal Info */}
            <div className="glass-card p-5 !hover:transform-none">
              <h3 className="font-heading font-bold text-slate-200 mb-4">👤 Personal Info</h3>
              <div className="mb-4">
                <label className="block text-sm text-slate-400 mb-1">Passport Photo (Optional)</label>
                <div className="flex items-center gap-3">
                  {p.photo && <img src={p.photo} alt="Preview" className="w-12 h-12 object-cover rounded-md border border-white/10" />}
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} className="text-sm text-slate-400 file:mr-4 file:py-1.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-500/10 file:text-primary-400 hover:file:bg-primary-500/20 file:transition-colors cursor-pointer" />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <input placeholder="Full Name" value={p.fullName} onChange={e => updatePersonal('fullName', e.target.value)} className="glow-input text-sm p-2" />
                <input placeholder="Email" value={p.email} onChange={e => updatePersonal('email', e.target.value)} className="glow-input text-sm p-2" />
                <input placeholder="Phone" value={p.phone} onChange={e => updatePersonal('phone', e.target.value)} className="glow-input text-sm p-2" />
                <input placeholder="Location" value={p.location} onChange={e => updatePersonal('location', e.target.value)} className="glow-input text-sm p-2" />
                <input placeholder="LinkedIn URL" value={p.linkedin} onChange={e => updatePersonal('linkedin', e.target.value)} className="glow-input text-sm p-2" />
                <input placeholder="Website" value={p.website} onChange={e => updatePersonal('website', e.target.value)} className="glow-input text-sm p-2" />
              </div>
            </div>

            {/* Summary */}
            <div className="glass-card p-5 !hover:transform-none">
              <h3 className="font-heading font-bold text-slate-200 mb-4">📝 Summary</h3>
              <textarea rows={3} placeholder="Professional summary..." value={resume.summary} onChange={e => setResume(prev => ({ ...prev, summary: e.target.value }))} className="glow-input text-sm p-2 resize-none" />
            </div>

            {/* Education */}
            <div className="glass-card p-5 !hover:transform-none">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-heading font-bold text-slate-200">🎓 Education</h3>
                <button onClick={() => addItem('education', { institution: '', degree: '', field: '', startDate: '', endDate: '', gpa: '' })} className="text-primary-400 hover:text-primary-300 text-sm flex items-center gap-1"><HiPlus /> Add</button>
              </div>
              {resume.education.map((edu, i) => (
                <div key={i} className="space-y-2 mb-4 pb-4 border-b border-white/5 last:border-0 last:mb-0 last:pb-0">
                  <div className="flex justify-between"><input placeholder="Institution" value={edu.institution} onChange={e => updateArray('education', i, 'institution', e.target.value)} className="glow-input text-sm p-2 flex-1" />{i > 0 && <button onClick={() => removeItem('education', i)} className="ml-2 text-red-400 hover:text-red-300"><HiTrash /></button>}</div>
                  <div className="grid grid-cols-2 gap-2">
                    <input placeholder="Degree" value={edu.degree} onChange={e => updateArray('education', i, 'degree', e.target.value)} className="glow-input text-sm p-2" />
                    <input placeholder="Field" value={edu.field} onChange={e => updateArray('education', i, 'field', e.target.value)} className="glow-input text-sm p-2" />
                    <input placeholder="Start Year" value={edu.startDate} onChange={e => updateArray('education', i, 'startDate', e.target.value)} className="glow-input text-sm p-2" />
                    <input placeholder="End Year" value={edu.endDate} onChange={e => updateArray('education', i, 'endDate', e.target.value)} className="glow-input text-sm p-2" />
                  </div>
                </div>
              ))}
            </div>

            {/* Experience */}
            <div className="glass-card p-5 !hover:transform-none">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-heading font-bold text-slate-200">💼 Experience</h3>
                <button onClick={() => addItem('experience', { company: '', position: '', location: '', startDate: '', endDate: '', current: false, description: '' })} className="text-primary-400 hover:text-primary-300 text-sm flex items-center gap-1"><HiPlus /> Add</button>
              </div>
              {resume.experience.map((exp, i) => (
                <div key={i} className="space-y-2 mb-4 pb-4 border-b border-white/5 last:border-0 last:mb-0 last:pb-0">
                  <div className="flex justify-between"><input placeholder="Position" value={exp.position} onChange={e => updateArray('experience', i, 'position', e.target.value)} className="glow-input text-sm p-2 flex-1" />{i > 0 && <button onClick={() => removeItem('experience', i)} className="ml-2 text-red-400 hover:text-red-300"><HiTrash /></button>}</div>
                  <div className="grid grid-cols-2 gap-2">
                    <input placeholder="Company" value={exp.company} onChange={e => updateArray('experience', i, 'company', e.target.value)} className="glow-input text-sm p-2" />
                    <input placeholder="Location" value={exp.location} onChange={e => updateArray('experience', i, 'location', e.target.value)} className="glow-input text-sm p-2" />
                    <input placeholder="Start Date" value={exp.startDate} onChange={e => updateArray('experience', i, 'startDate', e.target.value)} className="glow-input text-sm p-2" />
                    <input placeholder="End Date" value={exp.endDate} onChange={e => updateArray('experience', i, 'endDate', e.target.value)} className="glow-input text-sm p-2" />
                  </div>
                  <textarea rows={3} placeholder="Description (bullet points)" value={exp.description} onChange={e => updateArray('experience', i, 'description', e.target.value)} className="glow-input text-sm p-2 resize-none" />
                </div>
              ))}
            </div>

            {/* Skills */}
            <div className="glass-card p-5 !hover:transform-none">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-heading font-bold text-slate-200">🛠 Skills</h3>
                <button onClick={() => setResume(prev => ({ ...prev, skills: [...prev.skills, ''] }))} className="text-primary-400 hover:text-primary-300 text-sm flex items-center gap-1"><HiPlus /> Add</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {resume.skills.map((skill, i) => (
                  <div key={i} className="flex items-center gap-1">
                    <input placeholder="Skill" value={skill} onChange={e => { const arr = [...resume.skills]; arr[i] = e.target.value; setResume(prev => ({ ...prev, skills: arr })); }} className="glow-input text-sm p-2 !w-32 !py-1.5 !px-2" />
                    {i > 0 && <button onClick={() => setResume(prev => ({ ...prev, skills: prev.skills.filter((_, j) => j !== i) }))} className="text-red-400 text-xs"><HiTrash /></button>}
                  </div>
                ))}
              </div>
            </div>

            {/* Projects */}
            <div className="glass-card p-5 !hover:transform-none">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-heading font-bold text-slate-200">🚀 Projects</h3>
                <button onClick={() => addItem('projects', { name: '', description: '', technologies: '', link: '' })} className="text-primary-400 hover:text-primary-300 text-sm flex items-center gap-1"><HiPlus /> Add</button>
              </div>
              {resume.projects.map((proj, i) => (
                <div key={i} className="space-y-2 mb-4 pb-4 border-b border-white/5 last:border-0 last:mb-0 last:pb-0">
                  <div className="flex justify-between"><input placeholder="Project Name" value={proj.name} onChange={e => updateArray('projects', i, 'name', e.target.value)} className="glow-input text-sm p-2 flex-1" />{i > 0 && <button onClick={() => removeItem('projects', i)} className="ml-2 text-red-400 hover:text-red-300"><HiTrash /></button>}</div>
                  <textarea rows={2} placeholder="Description" value={proj.description} onChange={e => updateArray('projects', i, 'description', e.target.value)} className="glow-input text-sm p-2 resize-none" />
                  <input placeholder="Technologies" value={proj.technologies} onChange={e => updateArray('projects', i, 'technologies', e.target.value)} className="glow-input text-sm p-2" />
                </div>
              ))}
            </div>
          </div>

          {/* Live Preview */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="flex justify-end mb-3">
              <button onClick={downloadPDF} className="btn-primary text-sm flex items-center gap-2"><HiDownload /> Download PDF</button>
            </div>
            <div ref={previewRef} className="resume-paper rounded-lg text-[11px] leading-relaxed min-h-[600px] bg-white overflow-hidden" style={{ maxHeight: '75vh', overflow: 'auto', fontFamily: templateConfig.fontFamily }}>
              
              {templateConfig.layout === 'sidebar' ? (
                <div className="flex min-h-full">
                  <div className="w-1/3 p-6 text-white" style={{ backgroundColor: templateConfig.accentColor }}>
                    {p.photo && <img src={p.photo} alt="Profile" className="w-24 h-24 object-cover rounded-full border-2 border-white mx-auto mb-4 shadow-md" />}
                    <h1 className="text-xl font-bold text-center mb-6 leading-tight">{p.fullName || 'Your Name'}</h1>
                    
                    <div className="space-y-4">
                      <div>
                        <h2 className="text-[10px] font-bold uppercase tracking-widest border-b border-white/20 pb-1 mb-2">Contact</h2>
                        <div className="space-y-1 opacity-90 text-[10px]">
                          {p.email && <p>{p.email}</p>}
                          {p.phone && <p>{p.phone}</p>}
                          {p.location && <p>{p.location}</p>}
                          {p.linkedin && <p>{p.linkedin}</p>}
                          {p.website && <p>{p.website}</p>}
                        </div>
                      </div>

                      {resume.skills.some(s => s) && (
                        <div>
                          <h2 className="text-[10px] font-bold uppercase tracking-widest border-b border-white/20 pb-1 mb-2">Skills</h2>
                          <div className="flex flex-wrap gap-1">
                            {resume.skills.filter(Boolean).map((s, i) => (
                              <span key={i} className="px-1.5 py-0.5 bg-white/10 rounded text-[10px]">{s}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="w-2/3 p-6 text-gray-800">
                    {resume.summary && (
                      <div className="mb-4">
                        <h2 className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: templateConfig.accentColor }}>Profile</h2>
                        <p className="text-gray-600">{resume.summary}</p>
                      </div>
                    )}
                    
                    {resume.experience.some(e => e.position || e.company) && (
                      <div className="mb-4">
                        <h2 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: templateConfig.accentColor }}>Experience</h2>
                        {resume.experience.filter(e => e.position || e.company).map((exp, i) => (
                          <div key={i} className="mb-3">
                            <div className="flex justify-between font-bold"><span className="text-gray-800">{exp.position}</span><span className="text-gray-500 font-normal text-[9px]">{[exp.startDate, exp.endDate || 'Present'].filter(Boolean).join(' – ')}</span></div>
                            <div className="text-gray-500 font-medium mb-1">{exp.company} {exp.location ? `• ${exp.location}` : ''}</div>
                            {exp.description && <p className="text-gray-600 whitespace-pre-line">{exp.description}</p>}
                          </div>
                        ))}
                      </div>
                    )}

                    {resume.education.some(e => e.institution) && (
                      <div className="mb-4">
                        <h2 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: templateConfig.accentColor }}>Education</h2>
                        {resume.education.filter(e => e.institution).map((edu, i) => (
                          <div key={i} className="mb-2">
                            <div className="flex justify-between font-bold"><span className="text-gray-800">{edu.degree} {edu.field ? `in ${edu.field}` : ''}</span><span className="text-gray-500 font-normal text-[9px]">{[edu.startDate, edu.endDate].filter(Boolean).join(' – ')}</span></div>
                            <div className="text-gray-600">{edu.institution}</div>
                          </div>
                        ))}
                      </div>
                    )}

                    {resume.projects.some(p => p.name) && (
                      <div className="mb-4">
                        <h2 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: templateConfig.accentColor }}>Projects</h2>
                        {resume.projects.filter(p => p.name).map((proj, i) => (
                          <div key={i} className="mb-2">
                            <div className="font-bold text-gray-800">{proj.name} {proj.technologies && <span className="font-normal text-gray-400 text-[9px]">| {proj.technologies}</span>}</div>
                            {proj.description && <p className="text-gray-600">{proj.description}</p>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-gray-800">
                  <div 
                    className={`${templateConfig.layout === 'creative' ? 'p-8 px-10 text-white' : `pt-8 px-8 mb-6 ${templateConfig.layout === 'classic' ? 'text-center' : templateConfig.layout === 'modern' ? 'border-l-4 ml-8' : ''}`}`} 
                    style={templateConfig.layout === 'creative' ? { backgroundColor: templateConfig.accentColor } : { borderColor: templateConfig.layout === 'modern' ? templateConfig.accentColor : 'transparent' }}
                  >
                    <div className={`flex ${templateConfig.layout === 'classic' ? 'flex-col items-center' : 'justify-between items-center'}`}>
                      <div>
                        <h1 className={`font-bold ${templateConfig.layout === 'creative' ? 'text-4xl text-white mb-2' : 'text-3xl text-gray-900'}`}>
                          {p.fullName || 'Your Name'}
                        </h1>
                        <div className={`flex flex-wrap gap-2 text-[10px] mt-2 ${templateConfig.layout === 'classic' ? 'justify-center' : ''}`} style={{ color: templateConfig.layout === 'creative' ? '#ffffff' : templateConfig.layout === 'minimal' ? '#9ca3af' : '#6b7280' }}>
                          {[p.email, p.phone, p.location, p.linkedin, p.website].filter(Boolean).map((info, i) => (
                            <span key={i} className={`flex items-center ${templateConfig.layout === 'creative' ? 'mr-3 opacity-90' : ''}`}>
                              {i > 0 && templateConfig.layout !== 'creative' && <span className="mx-2 opacity-50">•</span>}
                              {info}
                            </span>
                          ))}
                        </div>
                      </div>
                      {p.photo && templateConfig.layout !== 'classic' && (
                        <img src={p.photo} alt="Profile" className={`object-cover ${templateConfig.layout === 'creative' ? 'w-24 h-24 rounded-full border-4 border-white shadow-md' : 'w-16 h-16 rounded shadow-sm'} ml-4`} />
                      )}
                    </div>
                  </div>

                  <div className={`${templateConfig.layout === 'creative' ? 'p-8 px-10' : 'px-8 pb-8'}`}>
                  {[
                    { id: 'summary', title: 'Professional Summary', content: resume.summary, type: 'text' },
                    { id: 'experience', title: 'Experience', content: resume.experience, type: 'experience' },
                    { id: 'education', title: 'Education', content: resume.education, type: 'education' },
                    { id: 'skills', title: 'Skills', content: resume.skills, type: 'skills' },
                    { id: 'projects', title: 'Projects', content: resume.projects, type: 'projects' }
                  ].map(section => {
                    const hasContent = section.type === 'text' ? !!section.content : section.content.some(item => {
                      if (section.type === 'skills') return !!item;
                      return item.name || item.company || item.institution || item.position;
                    });
                    
                    if (!hasContent) return null;

                    return (
                      <div key={section.id} className="mb-4">
                        <h2 
                          className={`text-xs font-bold uppercase tracking-widest mb-2 ${templateConfig.layout === 'classic' ? 'text-center border-b border-gray-300 pb-1' : templateConfig.layout === 'minimal' ? 'text-gray-400' : 'border-b pb-1'}`}
                          style={{ 
                            color: templateConfig.layout === 'minimal' ? '#9ca3af' : templateConfig.layout === 'classic' ? '#374151' : templateConfig.accentColor,
                            borderColor: templateConfig.layout === 'modern' || templateConfig.layout === 'creative' ? `${templateConfig.accentColor}40` : '#e5e7eb'
                          }}
                        >
                          {section.title}
                        </h2>

                        {section.type === 'text' && <p className="text-gray-600">{section.content}</p>}
                        
                        {section.type === 'skills' && (
                          <div className={`flex flex-wrap gap-1.5 ${templateConfig.layout === 'classic' ? 'justify-center' : ''}`}>
                            {section.content.filter(Boolean).map((s, i) => (
                              <span key={i} className={`px-2 py-0.5 rounded text-[10px] font-medium ${templateConfig.layout === 'minimal' ? 'text-gray-600 bg-gray-100' : ''}`} style={templateConfig.layout !== 'minimal' ? { backgroundColor: `${templateConfig.accentColor}15`, color: templateConfig.accentColor } : {}}>
                                {s}
                              </span>
                            ))}
                          </div>
                        )}

                        {section.type === 'experience' && section.content.filter(e => e.position || e.company).map((exp, i) => (
                          <div key={i} className="mb-3">
                            <div className="flex justify-between items-baseline">
                              <span className="font-bold text-gray-800">{exp.position}</span>
                              <span className="text-gray-500 font-medium text-[9px]">{[exp.startDate, exp.endDate || 'Present'].filter(Boolean).join(' – ')}</span>
                            </div>
                            <div className="text-gray-600 font-medium mb-0.5" style={{ color: templateConfig.layout === 'creative' ? templateConfig.accentColor : '#4b5563' }}>{exp.company} {exp.location ? `• ${exp.location}` : ''}</div>
                            {exp.description && <p className="text-gray-600 whitespace-pre-line mt-1">{exp.description}</p>}
                          </div>
                        ))}

                        {section.type === 'education' && section.content.filter(e => e.institution).map((edu, i) => (
                          <div key={i} className="mb-2">
                            <div className="flex justify-between items-baseline">
                              <span className="font-bold text-gray-800">{edu.degree} {edu.field ? `in ${edu.field}` : ''}</span>
                              <span className="text-gray-500 font-medium text-[9px]">{[edu.startDate, edu.endDate].filter(Boolean).join(' – ')}</span>
                            </div>
                            <div className="text-gray-600" style={{ color: templateConfig.layout === 'creative' ? templateConfig.accentColor : '#4b5563' }}>{edu.institution}</div>
                          </div>
                        ))}

                        {section.type === 'projects' && section.content.filter(p => p.name).map((proj, i) => (
                          <div key={i} className="mb-2">
                            <div className="font-bold text-gray-800">{proj.name} {proj.technologies && <span className="font-normal text-gray-500 text-[9px]">| {proj.technologies}</span>}</div>
                            {proj.description && <p className="text-gray-600 mt-0.5">{proj.description}</p>}
                          </div>
                        ))}
                      </div>
                    );
                  })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
