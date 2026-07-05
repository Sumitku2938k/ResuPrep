import { useState } from 'react';
import { motion } from 'framer-motion';
import SkillBar from '../components/SkillBar';
import RadarChart from '../components/RadarChart';

const skillData = [
  { name: 'React', current: 85, required: 90 },
  { name: 'Node.js', current: 70, required: 85 },
  { name: 'TypeScript', current: 60, required: 80 },
  { name: 'Python', current: 40, required: 75 },
  { name: 'Docker', current: 50, required: 70 },
  { name: 'SQL', current: 75, required: 80 },
  { name: 'AWS', current: 35, required: 70 },
  { name: 'CI/CD', current: 55, required: 65 },
];

const comparisonTable = [
  { skill: 'React', yours: 85, required: 90, gap: 5, priority: 'low' },
  { skill: 'Node.js', yours: 70, required: 85, gap: 15, priority: 'high' },
  { skill: 'TypeScript', yours: 60, required: 80, gap: 20, priority: 'critical' },
  { skill: 'Python', yours: 40, required: 75, gap: 35, priority: 'critical' },
  { skill: 'Docker', yours: 50, required: 70, gap: 20, priority: 'high' },
  { skill: 'SQL', yours: 75, required: 80, gap: 5, priority: 'low' },
  { skill: 'AWS', yours: 35, required: 70, gap: 35, priority: 'critical' },
  { skill: 'CI/CD', yours: 55, required: 65, gap: 10, priority: 'medium' },
];

const courses = [
  { platform: 'Coursera', title: 'Advanced React & TypeScript', duration: '40 hours', level: 'Intermediate', free: false },
  { platform: 'freeCodeCamp', title: 'Node.js & Express Complete', duration: '12 hours', level: 'Beginner', free: true },
  { platform: 'Udemy', title: 'AWS Certified Developer 2024', duration: '30 hours', level: 'Intermediate', free: false },
  { platform: 'YouTube', title: 'Docker Crash Course', duration: '4 hours', level: 'Beginner', free: true },
  { platform: 'Coursera', title: 'Python for Data Science', duration: '20 hours', level: 'Beginner', free: false },
  { platform: 'freeCodeCamp', title: 'SQL & Database Design', duration: '8 hours', level: 'Beginner', free: true },
];

const priorityColors = {
  critical: 'badge-red',
  high: 'badge-amber',
  medium: 'badge-blue',
  low: 'badge-green',
};

export default function Skills() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-heading font-black mb-3">Skill Gap <span className="gradient-text">Analysis</span></h1>
          <p className="text-slate-400">Compare your current skills against role requirements and find learning paths</p>
        </div>

        {/* Skill Bars */}
        <div className="grid lg:grid-cols-2 gap-8 mb-10">
          <div className="glass-card p-6 !hover:transform-none">
            <h3 className="font-heading font-bold text-slate-200 mb-5">Skill Progress</h3>
            {skillData.map((skill, i) => (
              <SkillBar key={skill.name} name={skill.name} current={skill.current} required={skill.required} index={i} />
            ))}
          </div>

          <div className="glass-card p-6 !hover:transform-none">
            <h3 className="font-heading font-bold text-slate-200 mb-5">Radar Comparison</h3>
            <RadarChart
              labels={skillData.map(s => s.name)}
              yourData={skillData.map(s => s.current)}
              requiredData={skillData.map(s => s.required)}
            />
          </div>
        </div>

        {/* Comparison Table */}
        <div className="glass-card p-6 mb-10 !hover:transform-none overflow-x-auto">
          <h3 className="font-heading font-bold text-slate-200 mb-5">Detailed Comparison</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left py-3 px-4 text-slate-400 font-medium">Skill</th>
                <th className="text-center py-3 px-4 text-slate-400 font-medium">Your Level</th>
                <th className="text-center py-3 px-4 text-slate-400 font-medium">Required</th>
                <th className="text-center py-3 px-4 text-slate-400 font-medium">Gap</th>
                <th className="text-center py-3 px-4 text-slate-400 font-medium">Priority</th>
              </tr>
            </thead>
            <tbody>
              {comparisonTable.map((row) => (
                <tr key={row.skill} className="border-b border-white/5 hover:bg-white/[0.02]">
                  <td className="py-3 px-4 font-medium text-slate-200">{row.skill}</td>
                  <td className="py-3 px-4 text-center text-slate-300">{row.yours}%</td>
                  <td className="py-3 px-4 text-center text-slate-300">{row.required}%</td>
                  <td className="py-3 px-4 text-center font-bold" style={{ color: row.gap >= 20 ? '#ef4444' : row.gap >= 10 ? '#f59e0b' : '#10b981' }}>
                    -{row.gap}%
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`badge ${priorityColors[row.priority]}`}>{row.priority}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Recommended Courses */}
        <div className="mb-10">
          <h3 className="text-2xl font-heading font-black mb-6">Recommended <span className="gradient-text">Courses</span></h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {courses.map((course, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="glass-card p-5"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-primary-400">{course.platform}</span>
                  <span className={`badge ${course.free ? 'badge-green' : 'badge-amber'}`}>
                    {course.free ? 'Free' : 'Paid'}
                  </span>
                </div>
                <h4 className="font-heading font-bold text-slate-200 mb-2">{course.title}</h4>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span>⏱ {course.duration}</span>
                  <span>📊 {course.level}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="text-center">
          <button className="btn-primary text-lg !px-8" onClick={() => window.print()}>📥 Download Report</button>
        </div>
      </div>
    </motion.div>
  );
}
