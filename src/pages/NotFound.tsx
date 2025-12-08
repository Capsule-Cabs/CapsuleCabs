import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Navigation } from "@/components/ui/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeftCircle } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Navigation />

      <main className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="space-y-3">
            <p className="text-sm font-mono text-emerald-400/80 tracking-[0.2em] uppercase">
              404 · Not Found
            </p>
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
              Oops! Page not found
            </h1>
            <p className="text-sm sm:text-base text-white/60">
              The page you’re looking for doesn’t exist or may have been moved.
              Check the URL, or go back to the home screen.
            </p>
          </div>

          <div className="flex justify-center">
            <Link to="/">
              <Button className="rounded-full bg-white text-black hover:bg-zinc-100 flex items-center gap-2">
                <ArrowLeftCircle className="h-4 w-4" />
                Return to Home
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default NotFound;
