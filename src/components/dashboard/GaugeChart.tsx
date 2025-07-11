
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

interface GaugeChartProps {
  percentage: number;
  hasData: boolean;
}

export function GaugeChart({ percentage, hasData }: GaugeChartProps) {
  const getColor = (value: number) => {
    if (value <= 10) return "#16A34A"; // green
    if (value <= 15) return "#eab308"; // yellow
    return "#ef4444"; // red
  };

  const data = [
    { name: "filled", value: percentage },
    { name: "empty", value: 25 - percentage }
  ];

  return (
    <Card className="bg-white rounded-2xl shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold text-psiclo-primary">
          Alíquota efetiva
        </CardTitle>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <div className="flex flex-col items-center justify-center mt-4">
            <div className="relative w-48 h-24">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="90%"
                    startAngle={180}
                    endAngle={0}
                    innerRadius={60}
                    outerRadius={80}
                    dataKey="value"
                    stroke="none"
                  >
                    <Cell fill={getColor(percentage)} />
                    <Cell fill="#e5e7eb" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2">
              <span className="text-3xl font-bold text-psiclo-primary">
                {percentage.toFixed(1)}%
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-32 mt-4">
            <p className="text-gray-500 text-center">Sem informação registrada</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
