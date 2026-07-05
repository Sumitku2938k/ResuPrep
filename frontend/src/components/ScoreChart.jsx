import { useEffect, useRef } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function ScoreChart({ score = 0, size = 200 }) {
  const getColor = (s) => {
    if (s >= 75) return ['#10b981', 'rgba(16, 185, 129, 0.1)'];
    if (s >= 50) return ['#f59e0b', 'rgba(245, 158, 11, 0.1)'];
    return ['#ef4444', 'rgba(239, 68, 68, 0.1)'];
  };

  const [color, bgColor] = getColor(score);

  const data = {
    datasets: [
      {
        data: [score, 100 - score],
        backgroundColor: [color, bgColor],
        borderWidth: 0,
        cutout: '78%',
        borderRadius: 8,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false },
    },
    animation: {
      animateRotate: true,
      duration: 1500,
    },
  };

  const getLabel = (s) => {
    if (s >= 80) return 'Excellent Match';
    if (s >= 65) return 'Good Match';
    if (s >= 50) return 'Fair Match';
    return 'Needs Work';
  };

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <Doughnut data={data} options={options} />
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-heading font-black" style={{ color }}>{score}%</span>
        <span className="text-xs text-slate-400 font-medium">{getLabel(score)}</span>
      </div>
    </div>
  );
}
