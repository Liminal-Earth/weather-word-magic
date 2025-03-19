
import { BarChart, Bar, XAxis, ResponsiveContainer, Tooltip } from "recharts";

interface WordInfluenceChartProps {
  factorContributions: Record<string, number>;
}

interface ChartData {
  name: string;
  value: number;
}

const WordInfluenceChart = ({ factorContributions }: WordInfluenceChartProps) => {
  const chartData: ChartData[] = Object.entries(factorContributions)
    .map(([name, value]) => ({
      name: getFactorDisplayName(name),
      value: Math.round(value * 100)
    }))
    .sort((a, b) => b.value - a.value);

  if (chartData.length === 0) return null;

  return (
    <div className="h-[350px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 20, right: 10, left: 10, bottom: 5 }}>
          <XAxis dataKey="name" fontSize={11} tickMargin={5} />
          <Tooltip 
            formatter={(value) => [`${value}%`, 'Influence']}
            contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)' }}
          />
          <Bar 
            dataKey="value" 
            fill="#82ca9d" 
            radius={[4, 4, 0, 0]} 
            name="Influence" 
            label={{ position: 'top', fontSize: 11, fill: '#666', formatter: (value) => `${value}%` }}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

function getFactorDisplayName(key: string): string {
  const nameMap: Record<string, string> = {
    temperature: "Temperature",
    humidity: "Humidity",
    wind: "Wind",
    sky: "Sky Condition",
    time: "Time of Day"
  };
  
  return nameMap[key] || key;
}

export default WordInfluenceChart;
