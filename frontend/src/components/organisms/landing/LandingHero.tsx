"use client"

import Link from 'next/link'
import React, { useRef, useState } from 'react'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import { ArrowRight, Sparkles, Send, Bot, MapPin, AlertTriangle, CheckCircle } from 'lucide-react'
import LandingButton from '../../atoms/LandingButton'
import { type AuthMode } from '../AuthModal'

// Mock Data for Rio de Janeiro Regions
const RJ_REGIONS = [
  { 
    id: 'norte', 
    name: 'Norte/Noroeste', 
    path: 'M140,20 L190,10 L230,50 L210,80 L160,70 L140,50 Z', 
    occupancy: 65,
    status: 'stable',
    color: '#38bdf8' // brand-400
  },
  { 
    id: 'serrana', 
    name: 'Região Serrana', 
    path: 'M90,40 L140,20 L160,70 L110,90 L80,70 Z', 
    occupancy: 45,
    status: 'good',
    color: '#10b981' // emerald-500
  },
  { 
    id: 'sul', 
    name: 'Sul Fluminense', 
    path: 'M10,100 L60,80 L80,70 L90,110 L40,140 L10,120 Z', 
    occupancy: 82,
    status: 'warning',
    color: '#f59e0b' // amber-500
  },
  { 
    id: 'metro', 
    name: 'Metropolitana', 
    path: 'M80,70 L110,90 L150,100 L130,130 L90,110 Z', 
    occupancy: 94,
    status: 'critical',
    color: '#ef4444' // red-500
  },
  { 
    id: 'lagos', 
    name: 'Região dos Lagos', 
    path: 'M150,100 L210,80 L240,95 L190,130 L130,130 Z', 
    occupancy: 55,
    status: 'stable',
    color: '#38bdf8' // brand-400
  }
] as const

type Props = {
  onAuthClick: (mode?: AuthMode) => void
  isAuthenticated: boolean
}

const ChatMessage: React.FC<{ text: string; isAi?: boolean }> = ({ text, isAi = false }) => (
  <div className={`flex gap-3 ${isAi ? 'flex-row' : 'flex-row-reverse'}`}>
    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isAi ? 'bg-brand-100' : 'bg-slate-100'}`}>
      {isAi ? <Bot className="w-4 h-4 text-brand-600" /> : <div className="w-4 h-4 bg-slate-400 rounded-full" />}
    </div>
    <div className={`p-3 rounded-2xl text-sm max-w-[80%] ${isAi ? 'bg-brand-50 text-slate-700 rounded-tl-none' : 'bg-white text-slate-600 border border-slate-100 rounded-tr-none shadow-sm'}`}>
      {text}
    </div>
  </div>
);

export default function LandingHero({ onAuthClick, isAuthenticated }: Props) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"]
  });

  // Parallax & Zoom effects
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.15]);
  const y = useTransform(scrollYProgress, [0, 1], [0, 100]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0.8]);

  // Map Interaction State
  const [hoveredRegion, setHoveredRegion] = useState<(typeof RJ_REGIONS)[number] | null>(null);

  return (
    <section
      ref={sectionRef}
      className="relative min-h-[100vh] flex items-center pt-36 pb-24 md:pt-40 md:pb-28 overflow-hidden bg-slate-50"
    >
      
      {/* Dynamic Background Gradient */}
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[800px] h-[800px] rounded-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-brand-100/40 via-transparent to-transparent blur-3xl" />
        <div className="absolute bottom-[10%] left-[-20%] w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-accent-100/40 via-transparent to-transparent blur-3xl" />
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          
          {/* Left Column: Text & Value Prop */}
          <div className="space-y-8 relative z-20">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 bg-white/80 backdrop-blur border border-brand-100 px-4 py-1.5 rounded-full shadow-sm"
            >
              <Sparkles className="w-4 h-4 text-brand-500" />
              <span className="text-xs font-bold text-brand-700 uppercase tracking-wider">IA Generativa para Saúde</span>
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-5xl md:text-6xl lg:text-7xl font-bold text-slate-900 tracking-tight leading-[1.1]"
            >
              Gestão que <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-accent-500">
                Cuida e Resolve.
              </span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg md:text-xl text-slate-600 max-w-lg leading-relaxed"
            >
              A Susana IA conecta dados dispersos, prevê gargalos e automatiza a burocracia.
              <span className="block mt-2 text-slate-800 font-medium">Mais eficiência para o hospital. Mais tempo para o paciente.</span>
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-wrap gap-4"
            >
              {isAuthenticated ? (
                <>
                  <LandingButton asChild variant="primary" size="lg" className="group shadow-xl shadow-brand-500/20">
                    <Link href="/chat">
                      Abrir Susana IA
                      <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </LandingButton>
                  <LandingButton asChild variant="secondary" size="lg">
                    <Link href="/map">Ir para o mapa</Link>
                  </LandingButton>
                </>
              ) : (
                <>
                  <LandingButton
                    variant="primary"
                    size="lg"
                    className="group shadow-xl shadow-brand-500/20"
                    onClick={() => onAuthClick('signup')}
                  >
                    Agendar Demo
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </LandingButton>
                  <LandingButton asChild variant="secondary" size="lg">
                    <a href="#solucoes">Conhecer Soluções</a>
                  </LandingButton>
                </>
              )}
            </motion.div>

            <div className="pt-6 border-t border-slate-200/60 flex gap-6">
               <div>
                 <div className="text-2xl font-bold text-slate-900">2.5x</div>
                 <div className="text-sm text-slate-500">Mais Agilidade</div>
               </div>
               <div>
                 <div className="text-2xl font-bold text-slate-900">-30%</div>
                 <div className="text-sm text-slate-500">Tempo de Fila</div>
               </div>
            </div>
          </div>

          {/* Right Column: 3D Dashboard Visualization */}
          <div className="relative h-[700px] flex items-center justify-center perspective-[1200px]">
            
            {/* Wrapper for Scroll Effects */}
            <motion.div 
              style={{ scale, y, opacity, transformStyle: 'preserve-3d' }} 
              className="relative z-10 w-full max-w-lg"
            >
              {/* Main Glass Panel - Tilted */}
              <motion.div 
                initial={{ opacity: 0, rotateY: -10, rotateX: 10, scale: 0.9 }}
                animate={{ opacity: 1, rotateY: -5, rotateX: 5, scale: 1 }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-[0_30px_60px_-12px_rgba(0,0,0,0.15)] border border-white/60 p-6 flex flex-col gap-6"
              >
                
                {/* --- TOP BLOCK: 3D MAP --- */}
                <div className="relative w-full bg-slate-50/50 rounded-2xl p-4 border border-slate-100 overflow-hidden group">
                  <div className="flex justify-between items-center mb-4 relative z-10">
                     <div>
                        <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-brand-500" />
                          Monitoramento Regional
                        </h3>
                        <p className="text-[10px] text-slate-500 uppercase tracking-wide">Estado do Rio de Janeiro</p>
                     </div>
                     <div className="flex gap-2">
                        <span className="flex items-center gap-1 text-[10px] font-medium text-slate-500"><div className="w-2 h-2 rounded-full bg-red-500"></div>Crítico</span>
                        <span className="flex items-center gap-1 text-[10px] font-medium text-slate-500"><div className="w-2 h-2 rounded-full bg-green-500"></div>Normal</span>
                     </div>
                  </div>

                  {/* 3D Map Container */}
                  <div className="h-[220px] w-full flex items-center justify-center perspective-[800px] relative">
                     <div
                       className="relative w-full h-full transition-transform duration-500"
                       style={{ transformStyle: 'preserve-3d', transform: 'rotateX(12deg)' }}
                     >
                        <svg viewBox="0 0 260 160" className="w-full h-full drop-shadow-2xl">
                          <defs>
                            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                              <feGaussianBlur stdDeviation="3" result="blur" />
                              <feComposite in="SourceGraphic" in2="blur" operator="over" />
                            </filter>
                          </defs>
                          
                          {RJ_REGIONS.map((region) => {
                            const isHovered = hoveredRegion?.id === region.id;
                            return (
                              <g key={region.id} 
                                 onMouseEnter={() => setHoveredRegion(region)}
                                 onMouseLeave={() => setHoveredRegion(null)}
                                 className="cursor-pointer transition-all duration-300"
                                 style={{ 
                                   transform: isHovered ? 'translateY(-10px)' : 'translateY(0)',
                                   transition: 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                                 }}
                              >
                                {/* Shadow layer for depth */}
                                <path 
                                  d={region.path} 
                                  fill="rgba(0,0,0,0.2)" 
                                  transform="translate(4, 8)"
                                  className="blur-[2px]"
                                />
                                {/* Main Region Shape */}
                                <path 
                                  d={region.path} 
                                  fill={region.color}
                                  stroke="white"
                                  strokeWidth={isHovered ? 2 : 1}
                                  fillOpacity={isHovered ? 0.9 : 0.6}
                                  className="transition-all duration-300 ease-out"
                                  filter={isHovered ? "url(#glow)" : ""}
                                />
                              </g>
                            );
                          })}
                        </svg>

                        {/* Floating Tooltip - positioned absolutely based on hover or fixed for demo */}
                        <AnimatePresence>
                          {hoveredRegion && (
                            <motion.div 
                              initial={{ opacity: 0, scale: 0.8, y: 10 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-50"
                            >
                               <div className="bg-slate-900/90 text-white p-3 rounded-xl backdrop-blur-md shadow-2xl border border-slate-700 min-w-[140px]">
                                  <p className="font-bold text-sm mb-1">{hoveredRegion.name}</p>
                                  <div className="flex justify-between text-xs text-slate-300 mb-1">
                                    <span>Ocupação</span>
                                    <span className={`font-mono font-bold ${hoveredRegion.occupancy > 80 ? 'text-red-400' : 'text-green-400'}`}>{hoveredRegion.occupancy}%</span>
                                  </div>
                                  <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                    <div className="h-full bg-current transition-all duration-300" style={{ width: `${hoveredRegion.occupancy}%`, color: hoveredRegion.color }} />
                                  </div>
                                  {hoveredRegion.status === 'critical' && (
                                    <div className="mt-2 flex items-center gap-1 text-[10px] text-red-300 bg-red-900/30 px-1.5 py-0.5 rounded">
                                      <AlertTriangle className="w-3 h-3" />
                                      <span>Sobrecarga Detectada</span>
                                    </div>
                                  )}
                               </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                     </div>
                  </div>
                </div>

                {/* --- BOTTOM BLOCK: SUSANA CHAT --- */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col overflow-hidden flex-grow">
                  {/* Chat Header */}
                  <div className="px-4 py-3 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-xs font-bold text-slate-700">Susana Assistant</span>
                    </div>
                    <LandingButton variant="ghost" size="sm" className="h-7 px-3 text-xs">
                      Ver Detalhes
                    </LandingButton>
                  </div>

                  {/* Chat Body */}
                  <div className="p-4 space-y-3 bg-white min-h-[200px]">
                     <ChatMessage isAi text="Olá! Analisei os dados da Região Metropolitana em tempo real." />
                     
                     <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.5 }}
                     >
                        <div className="flex flex-row gap-3">
                           <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-brand-100">
                              <Bot className="w-4 h-4 text-brand-600" />
                           </div>
                           <div className="space-y-2 max-w-[85%]">
                              <div className="p-3 rounded-2xl rounded-tl-none bg-brand-50 text-slate-700 text-sm">
                                 <p className="mb-2">⚠️ <strong>Alerta Crítico:</strong> A ocupação de leitos na Metropolitana atingiu 94%. Sugiro redirecionar novas admissões eletivas para a Região Serrana, que opera com 45% de capacidade.</p>
                                 <div className="flex gap-2 mt-3">
                                    <button className="flex items-center gap-1 px-3 py-1.5 bg-white border border-brand-200 rounded-lg text-xs font-medium text-brand-700 hover:bg-brand-50 transition-colors shadow-sm">
                                       <CheckCircle className="w-3 h-3" /> Autorizar Redirecionamento
                                    </button>
                                 </div>
                              </div>
                           </div>
                        </div>
                     </motion.div>

                     <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 3 }}
                     >
                        <ChatMessage text="Qual o tempo estimado de transporte?" />
                     </motion.div>
                     
                     <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 4.5 }}
                     >
                        <ChatMessage isAi text="O tempo médio via ambulância UTI é de 55 minutos. As condições de tráfego na BR-040 estão normais." />
                     </motion.div>

                     {/* Typing Indicator */}
                     <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 6 }}
                        className="flex gap-2 items-center ml-11"
                     >
                        <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" />
                        <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce delay-75" />
                        <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce delay-150" />
                     </motion.div>
                  </div>

                  {/* Input Area */}
                  <div className="p-3 border-t border-slate-100 bg-slate-50/30">
                    <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm focus-within:border-brand-300 focus-within:ring-2 focus-within:ring-brand-100 transition-all">
                       <Sparkles className="w-4 h-4 text-brand-400" />
                       <input 
                          type="text" 
                          placeholder="Pergunte à Susana..." 
                          className="flex-1 bg-transparent border-none outline-none text-sm text-slate-700 placeholder:text-slate-400"
                       />
                       <button className="p-1.5 bg-brand-600 rounded-lg text-white hover:bg-brand-700 transition-colors">
                          <Send className="w-3 h-3" />
                       </button>
                    </div>
                  </div>
                </div>

              </motion.div>
            </motion.div>

          </div>
        </div>
      </div>
    </section>
  )
}
