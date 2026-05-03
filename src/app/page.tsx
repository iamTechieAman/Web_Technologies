'use client';
import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Code2, Sparkles, Activity, Library, Play, Terminal, Layers } from 'lucide-react';
import Header from '@/components/Header';

export default function LandingPage() {
  return (
    <div className="min-h-screen w-full bg-[#050507] text-white selection:bg-cyan-500/30 flex flex-col">
      <Header />
      
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[20%] right-[-10%] w-[30%] h-[30%] bg-blue-500/10 rounded-full blur-[100px]" />
      </div>

      <main>
        {/* Hero Section */}
        <section className="relative pt-32 pb-24 px-6">
          <div className="max-w-6xl mx-auto text-center flex flex-col items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gray-900 border border-gray-800 text-[10px] font-black uppercase tracking-[0.2em] text-cyan-500 mb-8"
            >
              <Sparkles size={14} /> The Future of Algorithm Learning
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-6xl md:text-8xl font-black tracking-tighter mb-8 leading-[0.9]"
            >
              Visualize. Debug. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 via-cyan-400 to-yellow-500">Master DSA.</span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-gray-400 text-lg md:text-xl max-w-2xl mb-12 leading-relaxed"
            >
              A high-performance IDE built for algorithmic excellence. 
              Integrated Monaco editor, real-time code visualization, and an AI mentor that actually codes.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Link href="/problems">
                <button className="px-12 py-4 bg-white text-black font-black uppercase tracking-widest text-xs rounded-2xl flex items-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-[0_0_40px_rgba(255,255,255,0.15)]">
                  Explore Library <Library size={18} />
                </button>
              </Link>
              <Link href="/workspace">
                <button className="px-12 py-4 bg-gray-900 border border-gray-800 text-white font-black uppercase tracking-widest text-xs rounded-2xl flex items-center gap-3 hover:bg-gray-800 active:scale-95 transition-all shadow-2xl hover:shadow-cyan-500/10">
                  Open IDE <Play size={18} fill="currentColor" />
                </button>
              </Link>
            </motion.div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-24 px-6 border-t border-gray-800/50 bg-[#07070a]/50">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: <Activity className="text-cyan-500" />,
                  title: "Step-by-Step Visuals",
                  desc: "Watch your algorithms come to life with animated state transitions for arrays, trees, and recursion."
                },
                {
                  icon: <Terminal className="text-blue-500" />,
                  title: "Multi-Language Engine",
                  desc: "Execute code in 15+ languages with our high-speed Piston-backed execution environment."
                },
                {
                  icon: <Sparkles className="text-purple-500" />,
                  title: "AI Mentor",
                  desc: "Integrated GPT-3.5 assistant to explain complex concepts, optimize your code, and generate hints."
                }
              ].map((f, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  style={{ transform: 'translateZ(0)' }}
                  className="p-8 bg-gray-900/30 border border-gray-800 rounded-3xl hover:border-cyan-500/30 transition-all duration-300 group cursor-default"
                >
                  <div className="w-12 h-12 rounded-2xl bg-gray-900 border border-gray-800 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-xl">
                    {f.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-4">{f.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* IDE Preview Section */}
        <section className="py-24 px-6 overflow-hidden">
          <div className="max-w-6xl mx-auto">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-[2.5rem] blur opacity-20 group-hover:opacity-40 transition-opacity" />
              <div className="relative bg-[#0a0a0c] border border-gray-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
                {/* Mock Browser Header */}
                <div className="h-12 border-b border-gray-800 flex items-center px-6 gap-2 bg-black/40">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
                    <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50" />
                  </div>
                  <div className="ml-4 h-6 px-4 bg-gray-900 rounded-lg flex items-center border border-gray-800">
                    <span className="text-[10px] text-gray-600">codevisualizer.ai/ide/two-sum</span>
                  </div>
                </div>
                {/* Image Placeholder - Since I can't generate screenshot here, I'll use a stylized div */}
                <div className="h-[500px] flex items-center justify-center bg-grid-white/[0.02] relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0a0a0c]" />
                  <div className="z-10 text-center">
                    <Layers size={64} className="text-cyan-500 mx-auto mb-6 opacity-20" />
                    <h2 className="text-3xl font-black mb-4">A Truly Professional Experience</h2>
                    <p className="text-gray-600 text-sm italic">Monaco Editor • React Flow • Force Graph • xterm.js</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24 px-6 text-center">
          <div className="max-w-4xl mx-auto bg-gradient-to-b from-gray-900/50 to-transparent border border-gray-800 p-16 rounded-[4rem]">
            <h2 className="text-4xl font-black mb-8">Ready to evolve your coding?</h2>
            <Link href="/problems">
              <button className="px-16 py-5 bg-cyan-500 text-white font-black uppercase tracking-[0.3em] text-xs rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-[0_0_50px_rgba(249,115,22,0.3)]">
                Start Solving Now
              </button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="py-12 px-6 border-t border-gray-800 text-center">
        <div className="flex items-center justify-center gap-2 mb-6">
          <Code2 size={24} className="text-cyan-500" />
          <span className="text-lg font-black tracking-tighter">CodeVisualizer</span>
        </div>
        <p className="text-gray-600 text-xs font-bold uppercase tracking-widest">
          Built for the next generation of software engineers.
        </p>
      </footer>
    </div>
  );
}
