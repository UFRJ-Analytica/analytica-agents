import { Suspense } from 'react'
import LandingPage from '../src/components/pages/LandingPage'

export default function Home() {
  return (
    <Suspense fallback={null}>
      <LandingPage />
    </Suspense>
  )
}
