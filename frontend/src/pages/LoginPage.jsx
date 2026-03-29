import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { GraduationCap, Mail, Lock, Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function LoginPage() {
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setError('');
    setLoading(true);
    try {
      await loginWithGoogle(credentialResponse.credential);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left Side: Branding / Background */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-linear-to-br from-indigo-900 via-purple-900 to-slate-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1523050353010-38fe5730d9b5?auto=format&fit=crop&q=80')] opacity-10 bg-cover bg-center" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-8">
            <div className="p-2 bg-indigo-500/20 rounded-xl backdrop-blur-md border border-indigo-500/30">
              <GraduationCap className="size-8 text-indigo-400" />
            </div>
            <span className="text-2xl font-bold tracking-tight">Smart Campus</span>
          </div>
          <h1 className="text-5xl font-extrabold leading-tight mb-6">
            Elevate Your <br />
            <span className="text-indigo-400">Academic Journey</span>
          </h1>
          <p className="text-lg text-slate-300 max-w-md leading-relaxed">
            The all-in-one platform to manage your courses, track progress, and collaborate with peers in a modern digital environment.
          </p>
        </div>
        <div className="relative z-10 flex gap-12 text-sm text-slate-400 font-medium">
          <div>
            <p className="text-white font-semibold">10k+</p>
            <p>Active Students</p>
          </div>
          <div>
            <p className="text-white font-semibold">500+</p>
            <p>Top Rated Courses</p>
          </div>
          <div>
            <p className="text-white font-semibold">24/7</p>
            <p>Smart Support</p>
          </div>
        </div>
      </div>

      {/* Right Side: Login Form */}
      <div className="flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950">
        <Card className="w-full max-w-md border-slate-200/60 dark:border-slate-800 shadow-2xl shadow-indigo-500/10">
          <CardHeader className="space-y-2">
            <div className="lg:hidden flex justify-center mb-6">
              <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-500/30">
                <GraduationCap className="size-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-center">Welcome back</CardTitle>
            <CardDescription className="text-center text-slate-500">
              Enter your credentials to access your portal
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive" className="bg-destructive/5 border-destructive/20 py-3">
                <AlertCircle className="size-4" />
                <AlertDescription className="text-xs font-semibold">{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 size-4 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@university.com"
                    className="pl-10"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link to="#" className="text-xs text-indigo-500 hover:text-indigo-600 font-medium transition-colors">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 size-4 text-slate-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full h-11 text-base font-semibold transition-all active:scale-[0.98]" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-200 dark:border-slate-800" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white dark:bg-slate-950 px-2 text-slate-500">or continue with</span>
              </div>
            </div>

            <div className="flex justify-center">
              <div className="w-full max-w-sm rounded-[10px] overflow-hidden opacity-90 hover:opacity-100 transition-opacity">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => setError('Google sign-in was cancelled or failed')}
                  useOneTap={false}
                  width="100%"
                  theme="filled_blue"
                  shape="pill"
                />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <p className="text-center text-sm text-slate-500 w-full font-medium">
              Don&apos;t have an account?{' '}
              <Link to="/register" className="text-indigo-600 hover:text-indigo-700 font-bold transition-colors">
                Create one now
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
