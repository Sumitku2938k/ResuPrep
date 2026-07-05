import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { HiUpload, HiVideoCamera, HiMicrophone, HiLightningBolt, HiCheckCircle, HiXCircle } from 'react-icons/hi';
import ScoreChart from '../components/ScoreChart';

const rotatingMessages = [
  'Analyzing audio waves...',
  'Processing speech patterns...',
  'Evaluating eye contact (video)...',
  'Detecting filler words...',
  'Measuring confidence levels...',
  'Generating feedback...',
];

const mockResults = [
  {
    score: 85,
    mistakes: ['Used "um" and "like" frequently', 'Spoke a bit too fast in the middle section', 'Lost eye contact while explaining technical concept'],
    improvements: ['Pause instead of using filler words', 'Practice pacing your delivery', 'Maintain virtual eye contact by looking at the camera'],
    strengths: ['Clear articulation', 'Enthusiastic tone', 'Strong structured answers using STAR method']
  },
  {
    score: 65,
    mistakes: ['Very low speaking volume', 'Monotone delivery', 'Rambled for 3 minutes on one question'],
    improvements: ['Speak up and project your voice', 'Vary your pitch to show enthusiasm', 'Keep answers concise (1-2 minutes)'],
    strengths: ['Good technical knowledge demonstrated', 'Honest about areas of weakness']
  },
  {
    score: 92,
    mistakes: ['Slightly fidgety hands'],
    improvements: ['Keep hands rested when not actively gesturing to emphasize a point'],
    strengths: ['Excellent confidence', 'Perfect pacing', 'Strong, clear, and concise answers']
  }
];

export default function MockInterview() {
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [result, setResult] = useState(null);

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    processFileSelection(f);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    processFileSelection(f);
  };

  const processFileSelection = (f) => {
    if (f) {
      if (!f.type.startsWith('video/') && !f.type.startsWith('audio/')) {
        toast.error('Only video and audio files are supported');
        return;
      }
      setFile(f);
      toast.success(`Media "${f.name}" selected`);
    }
  };

  const analyze = () => {
    if (!file) {
      toast.error('Please upload a video or audio file first');
      return;
    }

    setLoading(true);
    setResult(null);

    let msgIndex = 0;
    setLoadingMsg(rotatingMessages[0]);
    const interval = setInterval(() => {
      msgIndex = (msgIndex + 1) % rotatingMessages.length;
      setLoadingMsg(rotatingMessages[msgIndex]);
    }, 1500);

    // Simulate AI processing time
    setTimeout(() => {
      clearInterval(interval);
      const randomResult = mockResults[Math.floor(Math.random() * mockResults.length)];
      setResult(randomResult);
      setLoading(false);
      toast.success('Interview analysis complete!');
    }, 6000);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-heading font-black mb-3">
            Mock <span className="gradient-text">Interview AI</span>
          </h1>
          <p className="text-slate-400 max-w-xl mx-auto">
            Upload a recording of your mock interview. Our AI will analyze your speech, tone, and confidence to provide actionable feedback.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left: Upload Panel */}
          <div className="space-y-6">
            <div className="glass-card p-6 !hover:transform-none">
              <h3 className="font-heading font-bold text-slate-200 mb-4 flex items-center gap-2">
                <HiVideoCamera className="text-primary-500" /> Upload Recording
              </h3>
              
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer ${
                  dragOver ? 'border-primary-500 bg-primary-500/5' : 'border-dark-300 hover:border-primary-500/50'
                }`}
                onClick={() => document.getElementById('mediaInput').click()}
              >
                <input id="mediaInput" type="file" accept="video/*,audio/*" onChange={handleFileChange} className="hidden" />
                {file ? (
                  <div className="flex flex-col items-center justify-center gap-3">
                    {file.type.startsWith('video/') ? (
                       <HiVideoCamera className="text-primary-500 text-4xl" />
                    ) : (
                       <HiMicrophone className="text-primary-500 text-4xl" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-slate-200">{file.name}</p>
                      <p className="text-xs text-slate-500">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <HiUpload className="mx-auto text-4xl text-slate-500 mb-3" />
                    <p className="text-sm text-slate-300 font-medium mb-1">Drag & drop your media file</p>
                    <p className="text-xs text-slate-500">MP4, WEBM, MP3, WAV</p>
                  </>
                )}
              </div>
            </div>

            <button
              onClick={analyze}
              disabled={loading || !file}
              className="w-full btn-primary text-lg !py-4 flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <HiLightningBolt /> Analyze Performance
                </>
              )}
            </button>
          </div>

          {/* Right: Results Panel */}
          <div>
            <AnimatePresence mode="wait">
              {loading && !result && (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="glass-card p-12 flex flex-col items-center justify-center min-h-[400px]"
                >
                  <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mb-6" />
                  <p className="text-slate-300 font-medium animate-pulse">{loadingMsg}</p>
                </motion.div>
              )}

              {!loading && !result && (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="glass-card p-12 flex flex-col items-center justify-center min-h-[400px] text-center"
                >
                  <HiLightningBolt className="text-6xl text-slate-700 mb-4" />
                  <p className="text-slate-400 text-lg font-medium">Feedback will appear here</p>
                  <p className="text-slate-500 text-sm mt-2">Upload a video or audio to start the analysis</p>
                </motion.div>
              )}

              {result && (
                <motion.div
                  key="results"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  {/* Score */}
                  <div className="glass-card p-6 flex flex-col items-center">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Overall Confidence Score</h3>
                    <ScoreChart score={result.score} size={160} />
                    <p className="text-sm text-slate-400 mt-4 text-center">
                      {result.score >= 80 ? 'Excellent performance! You came across as very confident and articulate.' : 
                       result.score >= 60 ? 'Good effort. There are a few areas to refine before the real interview.' : 
                       'Needs practice. Focus on the core improvements below to build your confidence.'}
                    </p>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                     {/* Strengths */}
                    <div className="glass-card p-5 !hover:transform-none border-l-2 border-emerald-500">
                      <h4 className="font-heading font-bold text-sm text-emerald-400 mb-3 flex items-center gap-2">
                        <HiCheckCircle /> Strengths
                      </h4>
                      <ul className="space-y-2">
                        {result.strengths.map((s, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                            <span className="w-1.5 h-1.5 mt-2 rounded-full bg-emerald-500 flex-shrink-0" />
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Mistakes */}
                    <div className="glass-card p-5 !hover:transform-none border-l-2 border-red-500">
                      <h4 className="font-heading font-bold text-sm text-red-400 mb-3 flex items-center gap-2">
                        <HiXCircle /> Mistakes Noticed
                      </h4>
                      <ul className="space-y-2">
                        {result.mistakes.map((m, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                            <span className="w-1.5 h-1.5 mt-2 rounded-full bg-red-500 flex-shrink-0" />
                            {m}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Improvements */}
                  <div className="glass-card p-5 !hover:transform-none border-l-2 border-primary-500">
                    <h4 className="font-heading font-bold text-sm text-primary-400 mb-3">💡 Areas for Improvement</h4>
                    <ol className="space-y-3">
                      {result.improvements.map((imp, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-500/10 text-primary-400 text-xs font-bold flex items-center justify-center">
                            {i + 1}
                          </span>
                          {imp}
                        </li>
                      ))}
                    </ol>
                  </div>

                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
