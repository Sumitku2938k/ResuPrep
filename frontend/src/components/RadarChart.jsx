import { Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from 'chart.js';
import { Radar } from 'react-chartjs-2';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

export default function RadarChart({ labels = [], yourData = [], requiredData = [] }) {
  const data = {
    labels,
    datasets: [
      {
        label: 'Your Skills',
        data: yourData,
        backgroundColor: 'rgba(37, 99, 235, 0.15)',
        borderColor: '#2563EB',
        borderWidth: 2,
        pointBackgroundColor: '#2563EB',
        pointBorderColor: '#fff',
        pointBorderWidth: 1,
        pointRadius: 4,
      },
      {
        label: 'Required',
        data: requiredData,
        backgroundColor: 'rgba(6, 182, 212, 0.1)',
        borderColor: '#06b6d4',
        borderWidth: 2,
        borderDash: [5, 5],
        pointBackgroundColor: '#06b6d4',
        pointBorderColor: '#fff',
        pointBorderWidth: 1,
        pointRadius: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    scales: {
      r: {
        beginAtZero: true,
        max: 100,
        ticks: {
          stepSize: 20,
          color: '#64748b',
          backdropColor: 'transparent',
          font: { size: 10 },
        },
        grid: { color: 'rgba(148, 163, 184, 0.1)' },
        angleLines: { color: 'rgba(148, 163, 184, 0.1)' },
        pointLabels: {
          color: '#94a3b8',
          font: { size: 11, family: 'DM Sans' },
        },
      },
    },
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#94a3b8',
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle',
          font: { size: 12, family: 'DM Sans' },
        },
      },
    },
  };

  return <Radar data={data} options={options} />;
}
