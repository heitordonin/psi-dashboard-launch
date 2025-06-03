
import { SignedIn, SignedOut, SignOutButton } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

const Dashboard = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // No side effects needed here, just component mount
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <SignedIn>
          <h1 className="text-4xl font-bold mb-8">Setup OK</h1>
          <SignOutButton>
            <Button variant="outline" size="lg">Sair</Button>
          </SignOutButton>
        </SignedIn>
        <SignedOut>
          <div>
            {(() => {
              navigate("/");
              return null;
            })()}
          </div>
        </SignedOut>
      </div>
    </div>
  );
};

export default Dashboard;
