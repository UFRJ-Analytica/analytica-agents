import React from 'react'
import { Stethoscope, BarChart3, Clock, Shield, Users, FileText } from 'lucide-react'
import { FeatureCardProps } from '../../../types'

const FeatureCard: React.FC<FeatureCardProps> = ({ title, description, icon, className }) => (
  <div
    className={`group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 transition-all duration-300 hover:border-brand-300 hover:shadow-xl ${className}`}
  >
    <div className="absolute top-0 right-0 -mr-8 -mt-8 h-32 w-32 rounded-bl-full bg-brand-50 transition-transform group-hover:scale-110"></div>

    <div className="relative z-10">
      <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl border border-slate-100 bg-white shadow-sm transition-colors duration-300 group-hover:bg-brand-600">
        <div className="text-brand-600 transition-colors duration-300 group-hover:text-white">{icon}</div>
      </div>
      <h3 className="mb-3 text-xl font-bold text-slate-900 transition-colors group-hover:text-brand-700">{title}</h3>
      <p className="text-sm leading-relaxed text-slate-600 md:text-base">{description}</p>
    </div>
  </div>
)

export default function FeaturesSection() {
  return (
    <section id="solucoes" className="py-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
          <div className="max-w-2xl">
            <span className="text-brand-600 font-semibold tracking-wide uppercase text-sm">Funcionalidades</span>
            <h2 className="text-4xl font-bold text-slate-900 mt-2">O Sistema Nervoso Central da sua Operação</h2>
          </div>
          <p className="text-slate-600 max-w-md text-right md:text-left">
            Uma suíte completa de ferramentas cognitivas desenhadas especificamente para a complexidade do setor de saúde.
          </p>
        </div>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Large Card */}
          <FeatureCard 
            className="md:col-span-2 bg-gradient-to-br from-white to-brand-50/50"
            title="Análise Preditiva de Demanda"
            description="Antecipe picos de demanda no pronto-socorro e internação com 95% de precisão. Nossa IA cruza dados históricos, sazonais e epidemiológicos para prever a ocupação das próximas 24h, permitindo ajustes proativos de escala."
            icon={<BarChart3 className="w-6 h-6" />}
          />
          
          <FeatureCard
            title="Gestão de Filas Inteligente"
            description="Algoritmos que reorganizam triagem e cirurgia para reduzir tempo de espera e maximizar o uso de salas."
            icon={<Clock className="w-6 h-6" />}
          />

          <FeatureCard
            title="Auditoria de Contas"
            description="Identificação automática de inconsistências em faturamentos, reduzindo glosas antes do envio."
            icon={<Shield className="w-6 h-6" />}
          />

          <FeatureCard
            className="md:col-span-2 bg-gradient-to-br from-white to-accent-50/50"
            title="Resumos Clínicos (GenAI)"
            description="A Susana lê centenas de páginas de histórico do paciente e gera um resumo executivo em segundos. Alergias, últimas internações e medicamentos em uso destacados automaticamente para o médico."
            icon={<FileText className="w-6 h-6" />}
          />

          <FeatureCard
            title="Staffing Dinâmico"
            description="Sugestão de dimensionamento de equipes baseada na complexidade real (acuidade) dos pacientes internados."
            icon={<Users className="w-6 h-6" />}
          />
        </div>
      </div>
    </section>
  )
}
