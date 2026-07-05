import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiX, HiPaperAirplane } from 'react-icons/hi';

const knowledgeBase = {
  'resume tips': "Here are my top resume tips:\n\n1. **Tailor your resume** — customize it for each job application\n2. **Use action verbs** — Start bullets with: Led, Developed, Increased, Designed\n3. **Quantify achievements** — \"Increased sales by 35%\" beats \"Improved sales\"\n4. **Keep it concise** — 1 page for < 5 years experience, 2 pages max\n5. **Use a clean layout** — consistent fonts, proper spacing, clear sections\n6. **Add a professional summary** — 2-3 sentences at the top\n7. **Include relevant keywords** — match the job description terminology",
  'ats tips': "**ATS (Applicant Tracking System) Tips:**\n\n1. Use standard section headings: Education, Experience, Skills\n2. Avoid tables, graphics, or text boxes — ATS can't read them\n3. Use a simple, clean format (no columns)\n4. Include keywords from the job description naturally\n5. Submit in PDF or DOCX format\n6. Don't use headers or footers for important info\n7. Spell out acronyms at least once\n8. Use standard fonts like Arial, Calibri, or Times New Roman",
  'interview prep': "**Interview Preparation Guide:**\n\n1. **Research the company** — mission, products, recent news, culture\n2. **Practice STAR method** — Situation, Task, Action, Result for behavioral questions\n3. **Prepare questions to ask** — shows genuine interest\n4. **Common questions to prepare:**\n   - Tell me about yourself\n   - Why this company/role?\n   - Describe a challenge you overcame\n   - Where do you see yourself in 5 years?\n5. **Technical prep** — review fundamentals, practice coding challenges\n6. **Mock interviews** — practice with friends or online platforms\n7. **Dress code** — when in doubt, dress one level up",
  'skill gaps': "**How to Address Skill Gaps:**\n\n1. **Identify gaps** — Use our Skill Gap Analysis tool to find what you're missing\n2. **Free learning resources:**\n   - freeCodeCamp (programming)\n   - Coursera (free audits)\n   - Khan Academy (fundamentals)\n   - YouTube channels (Fireship, Traversy Media)\n3. **Build projects** — Nothing beats hands-on experience\n4. **Get certified** — AWS, Google, Microsoft certifications add credibility\n5. **Contribute to open source** — Great for experience + networking\n6. **Join communities** — Discord, Reddit, local meetups",
  'salary tips': "**Salary Negotiation Tips:**\n\n1. **Research market rates** — Use Glassdoor, Levels.fyi, Payscale\n2. **Know your value** — list your unique skills and achievements\n3. **Never give a number first** — let them make the initial offer\n4. **Consider total compensation** — salary, equity, benefits, PTO, remote work\n5. **Practice your pitch** — rehearse with confidence\n6. **Get it in writing** — always confirm the offer letter details\n7. **Be ready to walk away** — have a BATNA (Best Alternative)",
  'find jobs': "**Job Search Strategies:**\n\n1. **Job boards:** LinkedIn, Indeed, Glassdoor, AngelList (startups)\n2. **Company career pages** — apply directly for better visibility\n3. **Networking** — 70% of jobs are found through connections\n4. **LinkedIn optimization:**\n   - Professional photo\n   - Compelling headline\n   - #OpenToWork badge\n   - Engage with industry content\n5. **Recruiters** — connect with technical recruiters in your field\n6. **Referrals** — ask contacts at target companies\n7. **Job alerts** — set them up on multiple platforms",
  'default': "I'm **Vio**, your career assistant! 🎯 I can help with:\n\n• **Resume Tips** — How to write a winning resume\n• **ATS Tips** — Beat applicant tracking systems\n• **Interview Prep** — Ace your next interview\n• **Skill Gaps** — How to upskill effectively\n• **Salary Tips** — Negotiate your worth\n• **Find Jobs** — Job search strategies\n\nClick a topic above or type your question!"
};

const quickChips = ['Resume Tips', 'ATS Tips', 'Interview Prep', 'Skill Gaps', 'Salary Tips', 'Find Jobs'];

function getResponse(message) {
  const lower = message.toLowerCase();
  for (const [key, value] of Object.entries(knowledgeBase)) {
    if (key !== 'default' && lower.includes(key.replace(' ', ''))) return value;
    if (key !== 'default' && lower.includes(key)) return value;
  }
  if (lower.includes('resume') || lower.includes('cv')) return knowledgeBase['resume tips'];
  if (lower.includes('ats') || lower.includes('tracking')) return knowledgeBase['ats tips'];
  if (lower.includes('interview')) return knowledgeBase['interview prep'];
  if (lower.includes('skill') || lower.includes('learn') || lower.includes('gap')) return knowledgeBase['skill gaps'];
  if (lower.includes('salary') || lower.includes('negotiate') || lower.includes('pay')) return knowledgeBase['salary tips'];
  if (lower.includes('job') || lower.includes('search') || lower.includes('find') || lower.includes('apply')) return knowledgeBase['find jobs'];
  if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) return "Hey there! 👋 I'm Vio, your career assistant. How can I help you today? Pick a topic or ask me anything about careers!";
  if (lower.includes('thank')) return "You're welcome! 😊 Feel free to ask anything else about your career journey. Good luck! 🚀";
  return knowledgeBase['default'];
}

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'bot', text: knowledgeBase['default'], time: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const sendMessage = (text) => {
    if (!text.trim()) return;
    const userMsg = { role: 'user', text: text.trim(), time: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const response = getResponse(text);
      setMessages(prev => [...prev, { role: 'bot', text: response, time: new Date() }]);
      setIsTyping(false);
    }, 800 + Math.random() * 700);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-r from-primary-500 to-cyan-500 
          text-white shadow-lg shadow-primary-500/30 flex items-center justify-center text-2xl 
          hover:scale-110 transition-all duration-300 ${isOpen ? 'hidden' : ''}`}
      >
        🤖
        <span className="absolute top-1 right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse border-2 border-dark" />
      </button>

      {/* Chat panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 right-6 z-50 w-[360px] h-[520px] flex flex-col 
              rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-black/40"
            style={{ background: 'rgba(10, 22, 40, 0.97)', backdropFilter: 'blur(20px)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-gradient-to-r from-primary-500/10 to-cyan-500/10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-r from-primary-500 to-cyan-500 flex items-center justify-center text-lg">
                  🤖
                </div>
                <div>
                  <p className="font-heading font-bold text-sm text-slate-200">Vio — Career Assistant</p>
                  <p className="text-xs text-green-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full" /> Online
                  </p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-slate-200 transition-colors">
                <HiX size={18} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-primary-500 text-white rounded-br-md'
                      : 'bg-dark-200 text-slate-300 rounded-bl-md border border-white/5'
                  }`}>
                    <div className="whitespace-pre-wrap" dangerouslySetInnerHTML={{ 
                      __html: msg.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>') 
                    }} />
                    <p className={`text-[10px] mt-1.5 ${msg.role === 'user' ? 'text-blue-200' : 'text-slate-500'}`}>
                      {formatTime(msg.time)}
                    </p>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-dark-200 rounded-2xl rounded-bl-md px-4 py-3 border border-white/5">
                    <div className="flex gap-1.5">
                      <span className="typing-dot w-2 h-2 bg-slate-400 rounded-full" />
                      <span className="typing-dot w-2 h-2 bg-slate-400 rounded-full" />
                      <span className="typing-dot w-2 h-2 bg-slate-400 rounded-full" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick chips */}
            <div className="px-4 py-2 flex gap-1.5 overflow-x-auto border-t border-white/5 no-scrollbar">
              {quickChips.map((chip) => (
                <button
                  key={chip}
                  onClick={() => sendMessage(chip)}
                  className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium 
                    bg-dark-200 text-slate-400 hover:text-primary-400 hover:bg-primary-500/10 
                    border border-white/5 transition-all"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Input */}
            <div className="px-4 py-3 border-t border-white/5">
              <div className="flex items-center gap-2">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask me anything..."
                  rows={1}
                  className="flex-1 bg-dark-200 border border-white/5 rounded-xl px-3 py-2.5 text-sm text-slate-200 
                    placeholder-slate-500 resize-none outline-none focus:border-primary-500 transition-colors"
                />
                <button
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim()}
                  className="p-2.5 rounded-xl bg-primary-500 text-white hover:bg-primary-600 
                    transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <HiPaperAirplane size={16} className="rotate-90" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
