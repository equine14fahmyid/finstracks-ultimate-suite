import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Lock, Mail, TrendingUp, User, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import heroImage from '@/assets/hero-fintracks.jpg';
const Login = () => {
  const {
    signIn,
    signUp,
    resetPassword,
    user,
    loading: authLoading
  } = useAuth();
  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'reset'>('login');

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Register form state
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');

  // Reset password state
  const [resetEmail, setResetEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Redirect if already logged in
  if (user && !authLoading) {
    return <Navigate to="/" replace />;
  }
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    if (!email || !password) {
      setError('Email dan password wajib diisi');
      setLoading(false);
      return;
    }
    const {
      error
    } = await signIn(email, password);
    if (error) {
      setError(error.message);
    }
    setLoading(false);
  };
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    if (!regEmail || !regPassword || !regConfirmPassword || !fullName) {
      setError('Semua field wajib diisi');
      setLoading(false);
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setError('Password dan konfirmasi password tidak sama');
      setLoading(false);
      return;
    }
    if (regPassword.length < 6) {
      setError('Password minimal 6 karakter');
      setLoading(false);
      return;
    }
    const {
      error
    } = await signUp(regEmail, regPassword, fullName);
    if (error) {
      setError(error.message);
    } else {
      setSuccess('Registrasi berhasil! Silakan cek email untuk konfirmasi.');
      // Clear form
      setRegEmail('');
      setRegPassword('');
      setRegConfirmPassword('');
      setFullName('');
    }
    setLoading(false);
  };
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    if (!resetEmail) {
      setError('Email wajib diisi');
      setLoading(false);
      return;
    }
    const {
      error
    } = await resetPassword(resetEmail);
    if (error) {
      setError(error.message);
    } else {
      setSuccess('Email reset password telah dikirim. Silakan cek email Anda.');
      setResetEmail('');
    }
    setLoading(false);
  };
  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Memuat aplikasi...</p>
        </div>
      </div>;
  }
  return <div className="min-h-screen flex">
      {/* Left Side - Hero Image */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="w-full h-full bg-cover bg-center relative" style={{
        backgroundImage: `url(${heroImage})`
      }}>
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
              <CardTitle className="text-2xl font-bold">
                {activeTab === 'login' && 'Masuk ke Sistem'}
                {activeTab === 'register' && 'Daftar Akun Baru'}
                {activeTab === 'reset' && 'Reset Password'}
              </CardTitle>
              <CardDescription>
                {activeTab === 'login' && 'Masukkan kredensial Anda untuk mengakses dashboard'}
                {activeTab === 'register' && 'Buat akun baru untuk mulai menggunakan FINTracks'}
                {activeTab === 'reset' && 'Masukkan email untuk reset password'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={value => setActiveTab(value as any)}>
                <TabsList className="grid w-full grid-cols-3 mb-6">
                  <TabsTrigger value="login">Masuk</TabsTrigger>
                  <TabsTrigger value="register">Daftar</TabsTrigger>
                  <TabsTrigger value="reset">Reset</TabsTrigger>
                </TabsList>

                {(error || success) && <Alert variant={error ? "destructive" : "default"} className="mb-4">
                    <AlertDescription>{error || success}</AlertDescription>
                  </Alert>}

                <TabsContent value="login">
                  <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="login-email" className="text-sm font-medium">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input id="login-email" type="email" placeholder="nama@perusahaan.com" value={email} onChange={e => setEmail(e.target.value)} className="pl-10 glass-card border-0" required />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="login-password" className="text-sm font-medium">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input id="login-password" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} className="pl-10 glass-card border-0" required />
                      </div>
                    </div>

                    <Button type="submit" className="w-full gradient-primary hover:opacity-90 font-medium py-3" disabled={loading}>
                      {loading ? <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Memproses...
                        </> : 'Masuk ke Dashboard'}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="register">
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="full-name" className="text-sm font-medium">Nama Lengkap</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input id="full-name" type="text" placeholder="Nama lengkap Anda" value={fullName} onChange={e => setFullName(e.target.value)} className="pl-10 glass-card border-0" required />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="reg-email" className="text-sm font-medium">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input id="reg-email" type="email" placeholder="nama@perusahaan.com" value={regEmail} onChange={e => setRegEmail(e.target.value)} className="pl-10 glass-card border-0" required />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="reg-password" className="text-sm font-medium">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input id="reg-password" type="password" placeholder="Minimal 6 karakter" value={regPassword} onChange={e => setRegPassword(e.target.value)} className="pl-10 glass-card border-0" required />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirm-password" className="text-sm font-medium">Konfirmasi Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input id="confirm-password" type="password" placeholder="Ulangi password" value={regConfirmPassword} onChange={e => setRegConfirmPassword(e.target.value)} className="pl-10 glass-card border-0" required />
                      </div>
                    </div>

                    <Button type="submit" className="w-full gradient-primary hover:opacity-90 font-medium py-3" disabled={loading}>
                      {loading ? <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Mendaftar...
                        </> : 'Daftar Akun'}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="reset">
                  <form onSubmit={handleResetPassword} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="reset-email" className="text-sm font-medium">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input id="reset-email" type="email" placeholder="nama@perusahaan.com" value={resetEmail} onChange={e => setResetEmail(e.target.value)} className="pl-10 glass-card border-0" required />
                      </div>
                    </div>

                    <Button type="submit" className="w-full gradient-primary hover:opacity-90 font-medium py-3" disabled={loading}>
                      {loading ? <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Mengirim...
                        </> : 'Kirim Email Reset'}
                    </Button>

                    <Button type="button" variant="ghost" className="w-full" onClick={() => setActiveTab('login')}>
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Kembali ke Login
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>

              {/* Demo Credentials - Show only on login tab */}
              {activeTab === 'login'}
            </CardContent>
          </Card>

          <div className="mt-8 text-center text-sm text-muted-foreground">
            <p>© 2024 FINTracks Ultimate. Semua hak dilindungi.</p>
          </div>
        </div>
      </div>
    </div>;
};
export default Login;