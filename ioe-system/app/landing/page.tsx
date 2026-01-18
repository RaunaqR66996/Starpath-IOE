"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Box, Brain, Cpu, Layers, Terminal, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

export default function LandingPage() {
    const [email, setEmail] = useState("");
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (email) {
            // Simulate API call
            setTimeout(() => setSubmitted(true), 800);
        }
    };

    return (
        <div className="min-h-screen bg-[#FAFAF9] text-[#1C1917] selection:bg-[#E7E5E4] font-sans overflow-x-hidden">
            {/* Navigation */}
            <nav className="fixed top-0 w-full z-50 bg-[#FAFAF9]/80 backdrop-blur-md border-b border-[#E7E5E4]">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="h-6 w-6 bg-[#1C1917] rounded-sm" />
                        <span className="font-bold tracking-tight text-lg">StarPath IOE</span>
                    </div>
                    <div className="hidden md:flex items-center gap-8 text-sm font-medium text-[#57534E]">
                        <a href="#features" className="hover:text-[#1C1917] transition-colors">Capabilities</a>
                        <a href="#tech" className="hover:text-[#1C1917] transition-colors">Technology</a>
                        <a href="#contact" className="hover:text-[#1C1917] transition-colors">Contact</a>
                    </div>
                    <button className="hidden md:block px-4 py-2 bg-[#1C1917] text-[#FAFAF9] text-sm font-medium rounded-sm hover:bg-[#292524] transition-colors">
                        Initialize Core
                    </button>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-20 md:pt-48 md:pb-32 px-6">
                <div className="max-w-4xl mx-auto text-center space-y-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E7E5E4]/50 border border-[#D6D3D1] text-xs font-medium text-[#57534E]"
                    >
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        System Online v2.4.0
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.1]"
                    >
                        Operational Reality Meets <br className="hidden md:block" />
                        <span className="text-[#57534E]">Generative AI.</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="text-xl md:text-2xl text-[#57534E] max-w-2xl mx-auto leading-relaxed"
                    >
                        The first production-ready <span className="text-[#1C1917] font-semibold">Operating System for Logistics</span> that doesn't just chat about data—it executes on it.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="pt-8 flex flex-col items-center gap-4"
                    >
                        {!submitted ? (
                            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
                                <input
                                    type="email"
                                    placeholder="enter.your@work.email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="flex-1 px-4 py-3 bg-white border-2 border-[#E7E5E4] rounded-sm text-[#1C1917] placeholder-[#A8A29E] focus:outline-none focus:border-[#1C1917] transition-colors"
                                />
                                <button
                                    type="submit"
                                    className="px-6 py-3 bg-[#1C1917] text-white font-medium rounded-sm hover:bg-[#292524] transition-colors flex items-center justify-center gap-2 group"
                                >
                                    Request Access
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </button>
                            </form>
                        ) : (
                            <div className="px-8 py-4 bg-emerald-50 border border-emerald-100 rounded-sm text-emerald-800 text-sm font-medium">
                                Access requested. We will contact you shortly.
                            </div>
                        )}
                        <p className="text-xs text-[#78716C]">
                            Strictly for enterprise pilots. No waitlist for consumers.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Feature Grid */}
            <section id="features" className="py-24 bg-[#F5F5F4]">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid md:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={<Brain className="w-6 h-6" />}
                            title="FAR Engine"
                            subtitle="Fission-Augmented Reasoning"
                            description="A proprietary 4-layer memory architecture that grounds AI in live database facts. Zero hallucinations."
                        />
                        <FeatureCard
                            icon={<Terminal className="w-6 h-6" />}
                            title="RightCopilot"
                            subtitle="Chat-to-Action Orchestrator"
                            description="Don't just query status. Create POs, book freight, and move inventory via natural language commands."
                        />
                        <FeatureCard
                            icon={<Box className="w-6 h-6" />}
                            title="Digital Twin"
                            subtitle="Real-time Visualization"
                            description="Render 10,000+ live warehouse bins at 60fps. Validated physical state sync within 5000ms."
                        />
                    </div>
                </div>
            </section>

            {/* Tech Specs */}
            <section id="tech" className="py-24 px-6 border-t border-[#E7E5E4]">
                <div className="max-w-5xl mx-auto">
                    <h2 className="text-3xl font-bold mb-16 tracking-tight">System Specifications</h2>

                    <div className="grid md:grid-cols-2 gap-x-16 gap-y-8">
                        <SpecRow label="Architecture" value="Event-Driven Microservices" />
                        <SpecRow label="Frontend Core" value="Next.js 16 (App Router)" />
                        <SpecRow label="State Machine" value="XState + Zustand" />
                        <SpecRow label="Database" value="PostgreSQL + Prisma ORM" />
                        <SpecRow label="Visualization" value="Three.js / R3F WebGL" />
                        <SpecRow label="Latency" value="< 120ms (Edge Compute)" />
                        <SpecRow label="Auth" value="RBAC Level 4 (Enterprise)" />
                        <SpecRow label="Deployment" value="Docker / Kubernetes Ready" />
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 px-6 border-t border-[#E7E5E4] bg-white">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2 opacity-80">
                        <div className="h-4 w-4 bg-[#1C1917] rounded-sm" />
                        <span className="font-bold tracking-tight text-sm">StarPath IOE</span>
                    </div>
                    <div className="text-xs text-[#78716C] font-mono">
                        © 2026 Blue Ship Sync. All systems nominal.
                    </div>
                </div>
            </footer>
        </div>
    );
}

function FeatureCard({ icon, title, subtitle, description }: { icon: React.ReactNode, title: string, subtitle: string, description: string }) {
    return (
        <div className="group p-8 bg-white rounded-sm shadow-[0_2px_4px_rgba(0,0,0,0.02),0_12px_24px_rgba(0,0,0,0.02)] hover:shadow-[0_4px_8px_rgba(0,0,0,0.04),0_24px_48px_rgba(0,0,0,0.04)] transition-all duration-300 border border-transparent hover:border-[#E7E5E4] h-full flex flex-col">
            <div className="mb-6 p-3 bg-[#FAFAF9] rounded-sm w-fit text-[#1C1917] group-hover:scale-110 transition-transform duration-300">
                {icon}
            </div>
            <h3 className="text-xl font-bold mb-1">{title}</h3>
            <div className="text-sm font-medium text-emerald-600 mb-4 font-mono">{subtitle}</div>
            <p className="text-[#57534E] leading-relaxed text-sm flex-1">
                {description}
            </p>
        </div>
    );
}

function SpecRow({ label, value }: { label: string, value: string }) {
    return (
        <div className="flex items-baseline justify-between py-4 border-b border-[#E7E5E4] group hover:bg-[#FAFAF9] px-2 transition-colors -mx-2 rounded-sm">
            <span className="text-[#57534E] font-medium">{label}</span>
            <span className="text-[#1C1917] font-mono text-sm">{value}</span>
        </div>
    );
}
