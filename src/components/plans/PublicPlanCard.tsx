import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { Link } from "react-router-dom";

interface PlanFeature {
  text: string;
  isBold?: boolean;
}

interface PublicPlanCardProps {
  name: string;
  description: string;
  price: string;
  period: string;
  features: PlanFeature[];
  icon: React.ReactNode;
  isPopular?: boolean;
  buttonVariant?: "default" | "outline";
  buttonText?: string;
  priceColor?: string;
}

const PublicPlanCard = ({
  name,
  description,
  price,
  period,
  features,
  icon,
  isPopular = false,
  buttonVariant = "default",
  buttonText = "Escolher Plano",
  priceColor = "text-gray-900"
}: PublicPlanCardProps) => {
  return (
    <Card className={`relative ${isPopular ? 'ring-2 ring-psiclo-accent scale-105' : ''}`}>
      {isPopular && (
        <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-psiclo-accent text-psiclo-primary">
          Mais Popular
        </Badge>
      )}
      
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          {icon}
        </div>
        <CardTitle className="text-2xl">{name}</CardTitle>
        <CardDescription>{description}</CardDescription>
        <div className="mt-4">
          <div className={`text-4xl font-bold ${priceColor}`}>{price}</div>
          <div className="text-sm text-gray-500">{period}</div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3 mb-6">
          {features.map((feature, index) => (
            <div key={index} className="flex items-center">
              <Check className="w-4 h-4 text-green-500 mr-2" />
              <span className={`text-sm ${feature.isBold ? 'font-medium' : ''}`}>
                {feature.text}
              </span>
            </div>
          ))}
        </div>
        
        <Link to="/signup">
          <Button 
            className={`w-full ${isPopular ? 'bg-psiclo-accent hover:bg-psiclo-accent/90 text-psiclo-primary' : ''}`}
            variant={buttonVariant}
          >
            {buttonText}
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
};

export default PublicPlanCard;