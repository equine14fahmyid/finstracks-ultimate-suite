
import { useState, useEffect } from 'react';
import { useAuthSession } from '@/hooks/useAuthSession';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Clock } from 'lucide-react';

const SessionWarning = () => {
  const { lastActivity } = useAuthSession();
  const [showWarning, setShowWarning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  // Warning threshold: 5 minutes before timeout
  const WARNING_THRESHOLD = 25 * 60 * 1000; // 25 minutes
  const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const timeSinceActivity = now - lastActivity;
      const remaining = SESSION_TIMEOUT - timeSinceActivity;

      if (timeSinceActivity > WARNING_THRESHOLD && remaining > 0) {
        setShowWarning(true);
        setTimeLeft(Math.ceil(remaining / 1000));
      } else {
        setShowWarning(false);
        setTimeLeft(0);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [lastActivity]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStayLoggedIn = () => {
    // Trigger activity update
    const event = new MouseEvent('click', { bubbles: true });
    document.dispatchEvent(event);
    setShowWarning(false);
  };

  if (!showWarning) return null;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md">
      <Alert className="border-warning bg-warning/10">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span className="font-medium">
              Sesi akan berakhir dalam {formatTime(timeLeft)}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Aktivitas Anda akan disimpan jika Anda tetap login.
          </p>
          <Button
            size="sm"
            onClick={handleStayLoggedIn}
            className="w-full"
          >
            Tetap Login
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default SessionWarning;
