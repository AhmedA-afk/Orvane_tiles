import { MotionConfig } from 'motion/react'
import { useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router'
import { Footer } from './components/Footer'
import { Nav } from './components/Nav'
import { QuoteProvider } from './lib/quote'
import { ScrollRail } from './motion/ScrollRail'
import { SmoothScroll } from './motion/SmoothScroll'
import { TransitionProvider } from './motion/Transition'
import Collections from './pages/Collections'
import ExportPage from './pages/ExportPage'
import FactoryPage from './pages/FactoryPage'
import Home from './pages/Home'
import NotFound from './pages/NotFound'
import QuotePage from './pages/QuotePage'
import VisualizerPage from './pages/VisualizerPage'

const TITLES: Record<string, string> = {
  '/': 'PGVT and Porcelain Tiles Manufacturer in Morbi, India',
  '/collections': 'Tile Collections: GVT, PGVT, Double Charge and Porcelain',
  '/visualizer': 'Tile Visualizer',
  '/export': 'Container Load Calculator and Export Shipping',
  '/factory': 'Our Factory in Morbi',
  '/quote': 'Container Quote on WhatsApp',
}

function PageTitle() {
  const { pathname } = useLocation()
  useEffect(() => {
    document.title = `${TITLES[pathname] ?? 'Page not found'} | Morbi Tiles Market`
  }, [pathname])
  return null
}

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <QuoteProvider>
        <TransitionProvider>
          <PageTitle />
          <SmoothScroll />
          <ScrollRail />
          <a className="skip" href="#main">
            Skip to content
          </a>
          <Nav />
          <main id="main">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/collections" element={<Collections />} />
              <Route path="/visualizer" element={<VisualizerPage />} />
              <Route path="/export" element={<ExportPage />} />
              <Route path="/factory" element={<FactoryPage />} />
              <Route path="/quote" element={<QuotePage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <Footer />
        </TransitionProvider>
      </QuoteProvider>
    </MotionConfig>
  )
}
