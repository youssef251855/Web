'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Code, Zap, Globe, Layers, Shield, ChevronRight } from 'lucide-react';

export default function Home() {
  const { user, signIn, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && !loading) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#000000] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-zinc-800 border-t-white animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#000000] text-zinc-50 font-sans selection:bg-blue-500/30">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-zinc-800/50 bg-[#000000]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-white rounded flex items-center justify-center">
              <div className="w-3.5 h-3.5 bg-black rounded-sm" />
            </div>
            <span className="font-semibold text-xl tracking-tight text-white">Joex</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-zinc-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#templates" className="hover:text-white transition-colors">Templates</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          </div>
          <div>
            <button
              onClick={signIn}
              className="text-sm font-medium px-4 py-2 bg-white text-black rounded-full hover:bg-zinc-200 transition-colors"
            >
              Sign In
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden px-6">
        {/* Abstract shapes/glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] opacity-20 pointer-events-none">
          <div className="absolute inset-0 bg-blue-500 blur-[120px] mix-blend-screen rounded-full"></div>
        </div>

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-zinc-800 bg-zinc-900/50 text-zinc-300 text-sm font-medium mb-8"
          >
            <span className="flex h-2 w-2 rounded-full bg-blue-500"></span>
            Welcome to the new standard in web building
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter text-white mb-6 leading-tight"
          >
            Build the web. <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-b from-zinc-300 to-zinc-600">
              Faster than ever.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto mb-10"
          >
            Joex is the professional website builder for ambitious teams. Create stunning, high-performance websites with a visual canvas that scales to any complexity.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <button
              onClick={signIn}
              className="w-full sm:w-auto px-8 py-4 bg-white text-black font-semibold rounded-full hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2"
            >
              Start Building <ArrowRight className="w-4 h-4" />
            </button>
            <button className="w-full sm:w-auto px-8 py-4 bg-zinc-900 border border-zinc-800 text-white font-semibold rounded-full hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>
          </motion.div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-20 border-t border-zinc-800/50 bg-[#0a0a0a]" id="features">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-16">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">Engineered for growth.</h2>
            <p className="text-zinc-400 text-lg max-w-2xl">Everything you need to build logic, design systems, and fast scalable landing pages without touching a line of code until you need to.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-8 border border-zinc-800 bg-[#000000] rounded-2xl hover:border-zinc-700 transition duration-300">
              <Zap className="w-8 h-8 text-blue-500 mb-6" />
              <h3 className="text-xl font-semibold mb-3 text-white">Lightning Fast</h3>
              <p className="text-zinc-400">Deployed automatically on edge networks for instant global performance and seamless interactions.</p>
            </div>
            <div className="p-8 border border-zinc-800 bg-[#000000] rounded-2xl hover:border-zinc-700 transition duration-300">
              <Code className="w-8 h-8 text-blue-500 mb-6" />
              <h3 className="text-xl font-semibold mb-3 text-white">Full Customization</h3>
              <p className="text-zinc-400">Visual drag-and-drop combined with deep layout properties gives you pixel-perfect control.</p>
            </div>
            <div className="p-8 border border-zinc-800 bg-[#000000] rounded-2xl hover:border-zinc-700 transition duration-300">
              <Layers className="w-8 h-8 text-blue-500 mb-6" />
              <h3 className="text-xl font-semibold mb-3 text-white">Dynamic Data</h3>
              <p className="text-zinc-400">Connect to built-in databases to build user authentication flows and dynamic content lists easily.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] to-[#000000]"></div>
        <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
          <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">Ready to create?</h2>
          <p className="text-xl text-zinc-400 mb-10">Join thousands of creators shaping the future of the web.</p>
          <button
            onClick={signIn}
            className="px-8 py-4 bg-white text-black font-semibold rounded-full hover:bg-zinc-200 transition-colors inline-flex items-center gap-2"
          >
            Deploy your first site <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800/50 py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-zinc-800 rounded flex items-center justify-center">
              <div className="w-2.5 h-2.5 bg-zinc-400 rounded-sm" />
            </div>
            <span className="font-semibold text-zinc-400">Joex © {new Date().getFullYear()}</span>
          </div>
          <div className="flex gap-6 text-sm text-zinc-500">
            <a href="#" className="hover:text-zinc-300">Privacy Policy</a>
            <a href="#" className="hover:text-zinc-300">Terms of Service</a>
            <a href="#" className="hover:text-zinc-300">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
