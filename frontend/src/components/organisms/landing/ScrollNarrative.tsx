"use client"

import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Database, Cpu, ClipboardCheck, Activity } from 'lucide-react';

interface NarrativeStepProps {
  title: string;
  desc: string;
  icon: React.ReactNode;
  align: 'left' | 'right';
  index: number;
}

const NarrativeStep: React.FC<NarrativeStepProps> = ({ title, desc, icon, align, index }) => {
  const isLeft = align === 'left';
  
  return (
    <div className={`flex w-full ${isLeft ? 'justify-start' : 'justify-end'} relative mb-32 md:mb-48`}>
      {/* Connector Dot on Mobile (hidden on desktop as line handles it) */}
      <div className="absolute left-0 md:left-1/2 top-0 w-4 h-4 bg-brand-500 rounded-full transform -translate-x-1/2 md:-translate-x-1/2 mt-6 z-10 border-4 border-white shadow-md"></div>
      
      <motion.div 
        initial={{ opacity: 0, x: isLeft ? -50 : 50 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className={`w-full md:w-5/12 pl-8 md:pl-0 ${isLeft ? 'md:pr-12 text-left' : 'md:pl-12 md:text-left'}`}
      >
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100 hover:shadow-2xl hover:border-brand-200 transition-all duration-300 group">
          <div className="w-14 h-14 bg-brand-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-brand-500 transition-colors duration-500">
            <div className="text-brand-600 group-hover:text-white transition-colors duration-300">
              {/* We clone the icon to pass props if needed, or just render */}
              {React.isValidElement(icon) && React.cloneElement(icon as React.ReactElement<any>, { size: 28 })}
            </div>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-3">{title}</h3>
          <p className="text-slate-600 text-lg leading-relaxed">{desc}</p>
          
          {/* Decorative number background */}
          <span className="absolute top-4 right-8 text-9xl font-bold text-slate-50 opacity-[0.06] pointer-events-none select-none">
            0{index}
          </span>
        </div>
      </motion.div>
    </div>
  );
};

export default function ScrollNarrative() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 20%", "end 80%"]
  });

  const lineHeight = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <section id="narrativa" ref={containerRef} className="relative py-32 bg-slate-50 overflow-hidden">
      <div className="max-w-6xl mx-auto px-6 relative">
        
        <div className="text-center max-w-3xl mx-auto mb-32">
          <span className="text-brand-600 font-bold tracking-wide uppercase text-sm bg-brand-50 px-3 py-1 rounded-full">O Fluxo da Inteligência</span>
          <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mt-4">Do Dado Bruto à Decisão Clínica</h2>
          <p className="mt-6 text-slate-600 text-lg">A Susana IA não é apenas um software. É um pipeline cognitivo que transforma a complexidade hospitalar em clareza operacional.</p>
        </div>

        {/* Central Timeline Line */}
        <div className="absolute left-0 md:left-1/2 transform md:-translate-x-1/2 top-32 bottom-0 w-1 bg-slate-200 h-[80%]">
          <motion.div 
            style={{ height: lineHeight }}
            className="w-full bg-gradient-to-b from-brand-400 via-brand-600 to-accent-500 origin-top"
          />
        </div>

        <div className="relative z-10">
          <NarrativeStep 
            index={1}
            align="left"
            icon={<Database />}
            title="Ingestão Unificada"
            desc="Conectamos ao seu ERP, Prontuário Eletrônico e dispositivos IoT. A Susana cria um 'Data Lake' vivo, eliminando silos de informação entre departamentos."
          />

          <NarrativeStep 
            index={2}
            align="right"
            icon={<Cpu />}
            title="Processamento Cognitivo"
            desc="Nossos modelos de LLM (Large Language Models) analisam textos clínicos não estruturados, entendendo nuances que softwares tradicionais ignoram."
          />

          <NarrativeStep 
            index={3}
            align="left"
            icon={<Activity />}
            title="Monitoramento em Tempo Real"
            desc="Painéis vivos que atualizam a cada segundo. Visualize gargalos na emergência ou na farmácia antes que eles se tornem críticos."
          />

          <NarrativeStep 
            index={4}
            align="right"
            icon={<ClipboardCheck />}
            title="Ação Prescritiva"
            desc="A IA não apenas mostra o problema, ela sugere a solução. Alocação de staff, bloqueio de agendas ou alertas de risco clínico automatizados."
          />
        </div>
      </div>
    </section>
  );
}
