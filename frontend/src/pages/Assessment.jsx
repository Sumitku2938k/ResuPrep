import { useState } from 'react';
import { motion } from 'framer-motion';

const tracks = {
  Python: [
    { q: 'What is the output of: print(type([]))?', options: ["<class 'list'>", "<class 'array'>", "<class 'tuple'>", "<class 'dict'>"], correct: 0 },
    { q: 'Which keyword is used to define a function in Python?', options: ['function', 'func', 'def', 'define'], correct: 2 },
    { q: 'What does "len()" do?', options: ['Returns data type', 'Returns length', 'Returns index', 'Returns boolean'], correct: 1 },
    { q: 'Which is a mutable data type in Python?', options: ['Tuple', 'String', 'List', 'Integer'], correct: 2 },
    { q: 'What is a decorator in Python?', options: ['A loop construct', 'A function modifier', 'A variable type', 'An error handler'], correct: 1 },
  ],
  'Machine Learning': [
    { q: 'Which algorithm is used for classification?', options: ['Linear Regression', 'K-Means', 'Random Forest', 'PCA'], correct: 2 },
    { q: 'What does "overfitting" mean?', options: ['Model is too simple', 'Model memorizes training data', 'Model runs too slowly', 'Model lacks data'], correct: 1 },
    { q: 'What is the purpose of cross-validation?', options: ['Feature selection', 'Model evaluation', 'Data cleaning', 'Hyperparameter tuning'], correct: 1 },
    { q: 'Which metric is best for imbalanced datasets?', options: ['Accuracy', 'F1 Score', 'MSE', 'R-squared'], correct: 1 },
    { q: 'What is gradient descent?', options: ['A data structure', 'An optimization algorithm', 'A neural network type', 'A regularization method'], correct: 1 },
  ],
  SQL: [
    { q: 'Which SQL clause filters rows?', options: ['SELECT', 'WHERE', 'ORDER BY', 'GROUP BY'], correct: 1 },
    { q: 'What does JOIN do?', options: ['Deletes rows', 'Combines tables', 'Creates indexes', 'Filters columns'], correct: 1 },
    { q: 'Which is not an aggregate function?', options: ['COUNT', 'SUM', 'CONCAT', 'AVG'], correct: 2 },
    { q: 'What does DISTINCT do?', options: ['Sorts results', 'Removes duplicates', 'Limits output', 'Creates aliases'], correct: 1 },
    { q: 'Which statement modifies existing data?', options: ['INSERT', 'UPDATE', 'ALTER', 'CREATE'], correct: 1 },
  ],
  'Web Dev': [
    { q: 'What does CSS stand for?', options: ['Computer Style Sheets', 'Cascading Style Sheets', 'Colorful Style Sheets', 'Creative Style Sheets'], correct: 1 },
    { q: 'Which HTML tag is used for the largest heading?', options: ['<header>', '<h6>', '<h1>', '<heading>'], correct: 2 },
    { q: 'What is the virtual DOM?', options: ['A browser feature', 'A lightweight copy of the real DOM', 'A CSS technique', 'A server component'], correct: 1 },
    { q: 'Which HTTP method is idempotent?', options: ['POST', 'PATCH', 'GET', 'None'], correct: 2 },
    { q: 'What is a closure in JavaScript?', options: ['A CSS property', 'A function with access to outer scope', 'An HTML element', 'A database query'], correct: 1 },
  ],
  Communication: [
    { q: 'What is active listening?', options: ['Hearing words', 'Fully concentrating and responding', 'Waiting to speak', 'Taking notes only'], correct: 1 },
    { q: 'Which improves presentation delivery?', options: ['Reading slides verbatim', 'Eye contact and pauses', 'Speaking very fast', 'Using all caps on slides'], correct: 1 },
    { q: 'What is the best way to give feedback?', options: ['Public criticism', 'Specific and constructive', 'Only positive comments', 'Written emails only'], correct: 1 },
    { q: 'Which is a barrier to effective communication?', options: ['Empathy', 'Assumptions', 'Clarity', 'Feedback'], correct: 1 },
    { q: 'What does non-verbal communication include?', options: ['Only words', 'Body language and tone', 'Written text', 'Formal reports'], correct: 1 },
  ],
};

export default function Assessment() {
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);

  const questions = selectedTrack ? tracks[selectedTrack] : [];
  const question = questions[currentQ];

  const handleAnswer = (idx) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(idx);
    setAnswers(prev => [...prev, idx === question.correct]);
  };

  const nextQuestion = () => {
    if (currentQ + 1 < questions.length) {
      setCurrentQ(prev => prev + 1);
      setSelectedAnswer(null);
    } else {
      setShowResult(true);
    }
  };

  const retry = () => {
    setSelectedTrack(null);
    setCurrentQ(0);
    setAnswers([]);
    setSelectedAnswer(null);
    setShowResult(false);
  };

  const score = answers.filter(Boolean).length;
  const pct = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;
  const level = pct >= 80 ? 'Expert' : pct >= 60 ? 'Proficient' : 'Beginner';

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-heading font-black mb-3">Skill <span className="gradient-text">Assessment</span></h1>
          <p className="text-slate-400">Test your knowledge and get scored across multiple domains</p>
        </div>

        {!selectedTrack && !showResult && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-8 text-center">
            <span className="text-5xl mb-4 block">🧠</span>
            <h2 className="font-heading font-bold text-xl text-slate-200 mb-2">Choose a Track</h2>
            <p className="text-sm text-slate-400 mb-1">5 questions per track • ~5 minutes • Free</p>
            <span className="badge-green badge mb-6">Free</span>
            <div className="flex flex-wrap justify-center gap-3 mt-4">
              {Object.keys(tracks).map(track => (
                <button key={track} onClick={() => setSelectedTrack(track)} className="btn-outline !px-6">{track}</button>
              ))}
            </div>
          </motion.div>
        )}

        {selectedTrack && !showResult && question && (
          <motion.div key={currentQ} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="glass-card p-8">
            {/* Progress */}
            <div className="mb-6">
              <div className="flex justify-between text-sm text-slate-400 mb-2">
                <span>{selectedTrack}</span>
                <span>{currentQ + 1} / {questions.length}</span>
              </div>
              <div className="h-2 bg-dark-200 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${((currentQ + 1) / questions.length) * 100}%` }}
                  className="h-full bg-gradient-to-r from-primary-500 to-cyan-500 rounded-full"
                />
              </div>
            </div>

            <h3 className="font-heading font-bold text-lg text-slate-200 mb-6">{question.q}</h3>

            <div className="space-y-3">
              {question.options.map((opt, idx) => {
                let bg = 'bg-dark-200 hover:bg-dark-300 border-transparent';
                if (selectedAnswer !== null) {
                  if (idx === question.correct) bg = 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400';
                  else if (idx === selectedAnswer && idx !== question.correct) bg = 'bg-red-500/10 border-red-500/50 text-red-400';
                }
                return (
                  <button
                    key={idx}
                    onClick={() => handleAnswer(idx)}
                    className={`w-full text-left px-5 py-3.5 rounded-xl border transition-all text-sm font-medium ${bg}`}
                  >
                    <span className="font-bold mr-3 text-slate-500">{['A', 'B', 'C', 'D'][idx]}.</span>
                    {opt}
                  </button>
                );
              })}
            </div>

            {selectedAnswer !== null && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 flex justify-end">
                <button onClick={nextQuestion} className="btn-primary">
                  {currentQ + 1 < questions.length ? 'Next Question →' : 'See Results'}
                </button>
              </motion.div>
            )}
          </motion.div>
        )}

        {showResult && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-10 text-center">
            <span className="text-6xl mb-4 block">{pct >= 80 ? '🏆' : pct >= 60 ? '👏' : '📚'}</span>
            <h2 className="text-5xl font-heading font-black gradient-text mb-2">{pct}%</h2>
            <p className="text-lg font-heading font-bold text-slate-200 mb-1">{level}</p>
            <p className="text-sm text-slate-400 mb-6">{score}/{questions.length} correct in {selectedTrack}</p>
            <div className="flex flex-wrap justify-center gap-2 mb-8">
              {pct >= 80 && <span className="badge-green badge text-sm px-4 py-1.5">🎖 Expert Badge</span>}
              {pct >= 60 && <span className="badge-blue badge text-sm px-4 py-1.5">📊 Proficient</span>}
              <span className="badge-cyan badge text-sm px-4 py-1.5">✅ {selectedTrack}</span>
            </div>
            <button onClick={retry} className="btn-primary text-lg !px-8">Try Another Track</button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
