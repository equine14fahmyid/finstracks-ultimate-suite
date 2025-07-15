import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, Home } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-hero p-4">
      <Card className="glass-card border-0 max-w-md w-full">
        <CardContent className="pt-6 text-center">
          <AlertTriangle className="h-16 w-16 mx-auto mb-4 text-warning" />
          <h1 className="text-3xl font-bold gradient-text mb-2">404</h1>
          <h2 className="text-xl font-semibold mb-4">Halaman Tidak Ditemukan</h2>
          <p className="text-muted-foreground mb-6">
            Maaf, halaman yang Anda cari tidak dapat ditemukan atau telah dipindahkan.
          </p>
          <Button 
            asChild 
            className="gradient-primary w-full"
          >
            <a href="/">
              <Home className="h-4 w-4 mr-2" />
              Kembali ke Dashboard
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotFound;
