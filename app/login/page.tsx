'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { AtSign, Lock, AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const { user, signInWithEmail, signUpWithEmail, signIn } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);
  
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmail(email, password);
        router.push('/dashboard');
      } else {
        const data = await signUpWithEmail(email, password, name);
        if (data.session) {
          router.push('/dashboard');
        } else {
          setMessage('Please check your email to verify your account. If you just disabled verify email on Supabase, sign in instead.');
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#000000] text-zinc-50 font-sans flex flex-col selection:bg-blue-500/30">
      <div className="p-6">
        <Link href="/" className="inline-flex items-center text-sm font-medium text-zinc-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to home
        </Link>
      </div>
      
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="border border-zinc-800 bg-[#0a0a0a] rounded-2xl p-8 shadow-2xl relative overflow-hidden">
            {/* Abstract glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[150px] opacity-20 pointer-events-none">
              <div className="absolute inset-0 bg-blue-500 blur-[80px] mix-blend-screen rounded-full"></div>
            </div>

            <div className="relative z-10">
              <div className="flex justify-center mb-8">
                <div className="w-10 h-10 bg-white rounded flex items-center justify-center">
                  <div className="w-5 h-5 bg-black rounded-sm" />
                </div>
              </div>

              <h2 className="text-2xl font-bold text-center mb-2">
                {isLogin ? 'Welcome back' : 'Create your account'}
              </h2>
              <p className="text-zinc-400 text-center text-sm mb-8">
                {isLogin ? 'Enter your details to sign in.' : 'Start building faster than ever.'}
              </p>

              {error && (
                <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              {message && (
                <div className="mb-6 p-4 rounded-xl bg-green-500/10 border border-green-500/20 flex items-start gap-3">
                  <div className="w-5 h-5 shrink-0 rounded-full bg-green-500/20 border border-green-500/50 flex items-center justify-center mt-0.5">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                  </div>
                  <p className="text-sm text-green-400">{message}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4 shadow-sm">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5" htmlFor="email">
                    Email
                  </label>
                  <div className="relative">
                    <AtSign className="w-5 h-5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      required
                      className="w-full bg-[#000000] border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>

                {!isLogin && (
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-1.5" htmlFor="name">
                      Name
                    </label>
                    <div className="relative">
                      <input
                        id="name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="John Doe"
                        required
                        className="w-full bg-[#000000] border border-zinc-800 rounded-xl py-3 px-4 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5" htmlFor="password">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-5 h-5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full bg-[#000000] border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 bg-white text-black font-semibold rounded-xl hover:bg-zinc-200 focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-black transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 rounded-full border-2 border-black/30 border-t-black animate-spin" />
                      Please wait...
                    </div>
                  ) : (
                    isLogin ? 'Sign In' : 'Create Account'
                  )}
                </button>
              </form>

              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-sm text-zinc-400 hover:text-white transition-colors"
                >
                  {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
                </button>
              </div>

              <div className="my-6 flex items-center gap-4">
                <div className="flex-1 h-px bg-zinc-800" />
                <span className="text-xs font-medium text-zinc-500 uppercase tracking-widest">or</span>
                <div className="flex-1 h-px bg-zinc-800" />
              </div>

              <button
                type="button"
                onClick={signIn}
                className="w-full py-3 px-4 bg-[#000000] border border-zinc-800 text-white font-medium rounded-xl hover:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-800 focus:ring-offset-2 focus:ring-offset-black transition-all flex items-center justify-center gap-3"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
