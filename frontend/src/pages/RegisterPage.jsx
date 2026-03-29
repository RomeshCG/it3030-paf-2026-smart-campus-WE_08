import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { GraduationCap, Mail, Lock, User, Loader2, AlertCircle, ArrowRight } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await register(name, email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left Side: Branding / Background */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-linear-to-br from-slate-900 via-indigo-900 to-purple-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1541339907198-e08756ebafe3?auto=format&fit=crop&q=80')] opacity-10 bg-cover bg-center" />
        <div className="relative z-10 font-medium">
          <div className="flex items-center gap-2 mb-8">
            <div className="p-2 bg-indigo-500/20 rounded-xl backdrop-blur-md border border-indigo-500/30">
              <GraduationCap className="size-8 text-indigo-400" />
            </div>
            <span className="text-2xl font-bold tracking-tight">Smart Campus</span>
          </div>
          <h1 className="text-5xl font-extrabold leading-tight mb-6">
            Join the Next <br />
            <span className="text-indigo-400">Generation</span> of Learners
          </h1>
          <p className="text-lg text-slate-300 max-w-md leading-relaxed">
            Create your account today and get access to personlized learning tracks, expert mentorship, and a global student community.
          </p>
        </div>
        <div className="relative z-10 flex gap-4 p-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 max-w-sm">
          <div className="size-10 rounded-full bg-indigo-500 flex-shrink-0 flex items-center justify-center font-bold">JD</div>
          <div>
            <p className="text-sm font-semibold">"Best decision for my studies!"</p>
            <p className="text-xs text-slate-400">Romesh Gamadikari, Computer Science Major</p>
          </div>
        </div>
      </div>

      {/* Right Side: Register Form */}
      <div className="flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950">
        <Card className="w-full max-w-md border-slate-200/60 dark:border-slate-800 shadow-2xl shadow-indigo-500/10">
          <CardHeader className="space-y-1">
            <div className="lg:hidden flex justify-center mb-6">
              <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-500/30">
                <GraduationCap className="size-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-center">Create account</CardTitle>
            <CardDescription className="text-center text-slate-500">
              Join the Smart Campus community today
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
                <Label htmlFor="name">Full name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 size-4 text-slate-400" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Romesh Gamadikari"
                    className="pl-10"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 size-4 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="regnumber@my.sliit.lk"
                    className="pl-10"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
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
                <p className="text-[10px] text-slate-400 px-1">Must be at least 6 characters long</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 size-4 text-slate-400" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    className="pl-10"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full h-11 text-base font-semibold group transition-all active:scale-[0.98]" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  <>
                    Start Learing
                    <ArrowRight className="ml-2 size-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter>
            <p className="text-center text-sm text-slate-500 w-full font-medium">
              Already have an account?{' '}
              <Link to="/login" className="text-indigo-600 hover:text-indigo-700 font-bold transition-colors">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
