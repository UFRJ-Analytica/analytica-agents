import React from 'react';

const MetricItem: React.FC<{ value: string; label: string }> = ({ value, label }) => (
  <div className="flex flex-col items-center justify-center p-6">
    <div className="mb-4 bg-gradient-to-b from-white to-slate-400 bg-clip-text text-5xl font-bold tracking-tight text-transparent md:text-7xl">
      {value}
    </div>
    <div className="text-center text-lg font-medium uppercase tracking-wider text-brand-300">{label}</div>
  </div>
)

export default function MetricsSection() {
  return (
    <section id="metricas" className="bg-slate-900 py-32 relative overflow-hidden">
      {/* Background gradient/mesh */}
      <div className="absolute top-0 left-0 w-full h-full opacity-30 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-800 via-slate-900 to-slate-900 pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-1/2 h-1/2 opacity-10 bg-accent-600 blur-[120px] rounded-full pointer-events-none"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
           <h2 className="text-white text-3xl font-bold">Impacto Mensurável</h2>
           <p className="text-slate-400 mt-2">Resultados reais em parceiros piloto</p>
        </div>

        <div className="grid md:grid-cols-3 gap-12 border-t border-slate-800 pt-12">
          <MetricItem value="-30%" label="Tempo de Espera" />
          <MetricItem value="95%" label="Acurácia Preditiva" />
          <MetricItem value="12h" label="Economia Semanal/Médico" />
        </div>
        
        <div className="mt-20 bg-slate-800/50 rounded-2xl p-8 backdrop-blur-sm border border-slate-700 flex flex-col md:flex-row items-center justify-between gap-6">
           <div>
             <p className="text-white font-bold text-lg">Segurança em Primeiro Lugar</p>
             <p className="text-slate-400 text-sm">Compliance total com LGPD e HIPAA. Seus dados nunca saem do ambiente seguro.</p>
           </div>
           <div className="flex gap-4">
              <div className="bg-slate-900 px-4 py-2 rounded border border-slate-600 text-slate-300 text-sm font-mono">AES-256 Encryption</div>
              <div className="bg-slate-900 px-4 py-2 rounded border border-slate-600 text-slate-300 text-sm font-mono">ISO 27001</div>
           </div>
        </div>
      </div>
    </section>
  )
}
