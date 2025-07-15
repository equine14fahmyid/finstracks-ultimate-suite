import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Lock, Mail, TrendingUp } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import heroImage from '@/assets/hero-fintracks.jpg';

const Login = () => {
  const { signIn, user, loading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect if already logged in
  if (user && !authLoading) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email || !password) {
      setError('Email dan password wajib diisi');
      setLoading(false);
      return;
    }

    const { error } = await signIn(email, password);
    
    if (error) {
      setError(error.message);
    }
    
    setLoading(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Memuat aplikasi...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Hero Image */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div 
          className="w-full h-full bg-cover bg-center relative"
          style={{ backgroundImage: `url(${heroImage})` }}
        >
          <div className="absolute inset-0 bg-gradient-hero opacity-90"></div>
          <div className="absolute inset-0 flex flex-col justify-center items-center text-white p-12">
            <div className="max-w-md text-center">
              <TrendingUp className="h-20 w-20 mx-auto mb-6 animate-glow" />
              <h1 className="text-4xl font-bold font-display mb-4">
                FINTracks Ultimate
              </h1>
              <p className="text-xl mb-6 opacity-90">
                Sistem Manajemen Keuangan Modern untuk UMKM Tasikmalaya
              </p>
              <div className="glass-card p-6 text-left">
                <h3 className="text-lg font-semibold mb-3">Fitur Unggulan:</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-white rounded-full mr-3"></div>
                    Dashboard Analytics Real-time
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-white rounded-full mr-3"></div>
                    Manajemen Stok Otomatis
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-white rounded-full mr-3"></div>
                    Laporan Keuangan Lengkap
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-white rounded-full mr-3"></div>
                    Multi-Platform E-commerce
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <TrendingUp className="h-12 w-12 mx-auto mb-4 text-primary" />
            <h1 className="text-2xl font-bold font-display gradient-text">
              FINTracks Ultimate
            </h1>
            <p className="text-muted-foreground">UMKM Tasikmalaya</p>
          </div>

          <Card className="glass-card border-0 shadow-glow">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold">Masuk ke Sistem</CardTitle>
              <CardDescription>
                Masukkan kredensial Anda untuk mengakses dashboard
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="nama@perusahaan.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 glass-card border-0"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 glass-card border-0"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full gradient-primary hover:opacity-90 font-medium py-3"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    'Masuk ke Dashboard'
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Tidak memiliki akses? Hubungi administrator sistem
                </p>
              </div>

              {/* Demo Credentials */}
              <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground text-center mb-2">
                  Demo Credentials (untuk testing):
                </p>
                <div className="text-xs space-y-1">
                  <div>Superadmin: admin@fintracks.com</div>
                  <div>Staff: staff@fintracks.com</div>
                  <div>Password: password123</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="mt-8 text-center text-sm text-muted-foreground">
            <p>© 2024 FINTracks Ultimate. Semua hak dilindungi.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;