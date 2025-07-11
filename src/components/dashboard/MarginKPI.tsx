
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface MarginKPIProps {
  margin: number;
  hasData: boolean;
}

export function MarginKPI({ margin, hasData }: MarginKPIProps) {
  return (
    <Card className="bg-white rounded-2xl shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold text-psiclo-primary">
          Margem
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center h-32">
          {hasData ? (
            <span className="text-4xl font-bold text-psiclo-primary">
              {margin.toFixed(1)}%
            </span>
          ) : (
            <p className="text-gray-500 text-center">Sem informação registrada</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
