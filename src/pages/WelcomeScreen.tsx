import { useNavigate } from "react-router-dom";

const WelcomeScreen = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6">
      <div className="text-center animate-fade-in">
        <h1 className="text-4xl md:text-5xl font-semibold text-foreground mb-4 tracking-tight">
          ContriMeter
        </h1>
        <p className="text-lg text-muted-foreground mb-12">
          Measure contribution. Ensure fairness.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button 
            onClick={() => navigate("/auth?mode=login")}
            className="btn-primary min-w-[140px]"
          >
            Log In
          </button>
          <button 
            onClick={() => navigate("/auth?mode=signup")}
            className="btn-secondary min-w-[140px]"
          >
            Sign Up
          </button>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;
