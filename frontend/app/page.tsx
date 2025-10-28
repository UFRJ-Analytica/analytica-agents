import CardLink from '../src/components/molecules/CardLink'

export default function Home() {
  return (
    <main style={{ padding: 24, maxWidth: 980, margin: '0 auto' }}>
      <h1 style={{ marginBottom: 16 }}>Analytica Agents</h1>
      <p style={{ color: '#555', marginBottom: 24 }}>
        Selecione um módulo para continuar.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <CardLink href="/map" title="Mapa Iterativo" description="Visualize as unidades em mapa e explore." />
        <CardLink href="/chat" title="Susana IA" description="Converse com a assistente e obtenha insights." />
      </div>
    </main>
  )
}

// Cards migrados para Atomic (CardLink)
