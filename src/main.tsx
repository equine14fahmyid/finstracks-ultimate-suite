import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App.tsx'
import './index.css'
import { AuthProvider } from '@/hooks/useAuth';
import { NotificationProvider } from '@/hooks/useNotifications';
import { Toaster } from '@/components/ui/toaster';

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <NotificationProvider>
      <QueryClientProvider client={queryClient}>
        <App />
        <Toaster />
      </QueryClientProvider>
    </NotificationProvider>
  </AuthProvider>
);
