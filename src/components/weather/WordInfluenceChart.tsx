
import { BarChart, Bar, XAxis, ResponsiveContainer, Tooltip, LabelList } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface WordInfluenceChartProps {
  factorContributions: Record<string, number>;
}

interface ChartData {
  name: string;
  value: number;
  label: string;
}

const WordInfluenceChart = ({ factorContributions }: WordInfluenceChartProps) => {
  const chartData: ChartData[] = Object.entries(factorContributions)
    .map(([name, value]) => ({
      name: getFactorDisplayName(name),
      value: Math.round(value * 100),
      label: `${Math.round(value * 100)}%`
    }))
    .sort((a, b) => b.value - a.value);

  if (chartData.length === 0) return null;

  return (
    <Card className="w-full mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Word Selection Factors</CardTitle>
        <CardDescription>
          How each weather condition influenced the selection of your weather word
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 40 }}>
              <XAxis 
                dataKey="name" 
                fontSize={11} 
                tickMargin={5}
                angle={-45}
                textAnchor="end"
              />
              <Tooltip 
                formatter={(value) => [`${value}% influence`, 'Contribution']}
                contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)' }}
              />
              <Bar 
                dataKey="value" 
                fill="#82ca9d" 
                radius={[4, 4, 0, 0]} 
                name="Influence" 
              >
                <LabelList dataKey="label" position="top" fontSize={11} fill="#666" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="text-xs text-gray-500 mt-4">
          Note: Each weather factor affects the word selection algorithm based on its current intensity and 
          predefined weight. Higher percentages indicate greater influence on the chosen word.
        </p>
      </CardContent>
    </Card>
  );
};

function getFactorDisplayName(key: string): string {
  const nameMap: Record<string, string> = {
    temperature: "Temperature",
    humidity: "Humidity",
    wind: "Wind Speed",
    sky: "Sky Condition",
    time: "Time of Day"
  };
  
  return nameMap[key] || key;
}

export default WordInfluenceChart;
