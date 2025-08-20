import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);


const Chart = () => {
  const data = {
    labels: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
    datasets: [
      {
        label: 'Dataset 1',
        data: [8, 5, 4, 9, 1, 7, 6, 3, 2, 0],
        borderColor: 'red',
        backgroundColor: 'rgba(255, 0, 0, 0.1)',
        tension: 0.1,
      },
      {
        label: 'Dataset 2',
        data: [8, 5, 4, 9, 1, 7, 6, 3, 2, 0],
        borderColor: 'purple',
        backgroundColor: 'rgba(128, 0, 128, 0.1)',
        tension: 0.1,
      },
      {
        label: 'Dataset 3',
        data: [8, 5, 4, 9, 1, 7, 6, 3, 2, 0],
        borderColor: 'yellow',
        backgroundColor: 'rgba(255, 255, 0, 0.1)',
        tension: 0.1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Analytics Chart',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
    <div style={{ marginTop: "15px", width: "300px", height: "300px" }}>
      <Line data={data} options={options} />
    </div>
  );
};

export default Chart;
