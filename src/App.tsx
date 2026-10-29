import { MotionConfig } from 'motion/react'
import { useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router'
import { Cursor } from './components/Cursor'
import { Nav } from './components/Nav'
import { Preloader } from './components/Preloader'
import { SiteFooter } from './components/SiteFooter'
import { setRevealed, usePageReady } from './lib/ready'
import { QuoteProvider } from './lib/quote'
import { SmoothScroll } from './motion/SmoothScroll'
import { TransitionProvider } from './motion/Transition'
import Collections from './pages/Collections'
import DesignPage from './pages/DesignPage'
import Lines, { LinePage } from './pages/Lines'
import { designById, LINES } from './data/range'
import ExportPage from './pages/ExportPage'
import FactoryPage from './pages/FactoryPage'
import Home from './pages/Home'
import NotFound from './pages/NotFound'
import QuotePage from './pages/QuotePage'
import ScalePage from './pages/ScalePage'
import VeinPage from './pages/VeinPage'
import SurfaceLab from './pages/SurfaceLab'
import Technology from './pages/Technology'
import Spaces, { SpacePage } from './pages/Spaces'
import { spaceById } from './data/spaces'
import StudioPage from './pages/StudioPage'
import PhotoStudio from './pages/PhotoStudio'
import UploadPage from './pages/UploadPage'
import InsightsPage from './pages/InsightsPage'
import DealerPortal from './pages/DealerPortal'
import Downloads from './pages/Downloads'

const TITLES: Record<string, string> = {
  '/': 'Porcelain Slabs from Morbi, India',
  '/collections': 'The Collection',
  '/lines': 'The Lines',
  '/studio': 'Orvane Studio, a Room to Lay Stone In',
  '/studio/photo': 'Your Room, in Stone',
  '/studio/upload': 'Your Design, in a Room',
  '/studio/insights': 'Studio Insights',
  '/downloads': 'Catalogues and Downloads',
  '/export': 'Export and Container Loading',
  '/factory': 'The Factory in Morbi',
  '/quote': 'Samples, Prices and Visits',
  '/spaces': 'Spaces',
  '/technology': 'Technology',
  '/technology/scale': 'The Largest Slab, 1800 × 3600 mm',
  '/technology/surface-lab': 'Surface Lab',
  '/technology/vein': 'Continuous Vein and Bookmatching',
}

function PageTitle() {
  const { pathname } = useLocation()
  useEffect(() => {
    const [, a, b] = pathname.split('/')
    const named =
      a === 'collections' && b
        ? designById(b)?.name
        : a === 'lines' && b
          ? LINES.find((l) => l.id === b)?.name
          : a === 'spaces' && b
            ? spaceById(b)?.name
            : a === 'dealers'
              ? 'Dealer Portal'
              : undefined
    document.title = `${named ?? TITLES[pathname] ?? 'Page not found'} | Orvane Ceramica`
  }, [pathname])
  return null
}

export default function App() {
  const ready = usePageReady()
  return (
    <MotionConfig reducedMotion="user">
      <QuoteProvider>
        <TransitionProvider>
          <PageTitle />
          <SmoothScroll />
          <a className="skip" href="#main">
            Skip to content
          </a>
          <Preloader ready={ready} onDone={setRevealed} />
          <Cursor />
          <Nav />
          <main id="main">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/collections" element={<Collections />} />
              <Route path="/collections/:id" element={<DesignPage />} />
              <Route path="/lines" element={<Lines />} />
              <Route path="/lines/:id" element={<LinePage />} />
              <Route path="/spaces" element={<Spaces />} />
              <Route path="/spaces/:id" element={<SpacePage />} />
              <Route path="/technology" element={<Technology />} />
              <Route path="/technology/scale" element={<ScalePage />} />
              <Route path="/technology/vein" element={<VeinPage />} />
              <Route path="/technology/surface-lab" element={<SurfaceLab />} />
              <Route path="/studio" element={<StudioPage />} />
              <Route path="/studio/photo" element={<PhotoStudio />} />
              <Route path="/studio/upload" element={<UploadPage />} />
              <Route path="/studio/insights" element={<InsightsPage />} />
              <Route path="/dealers/*" element={<DealerPortal />} />
              <Route path="/visualizer" element={<Navigate to="/studio" replace />} />
              <Route path="/downloads" element={<Downloads />} />
              <Route path="/export" element={<ExportPage />} />
              <Route path="/factory" element={<FactoryPage />} />
              <Route path="/quote" element={<QuotePage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <SiteFooter />
        </TransitionProvider>
      </QuoteProvider>
    </MotionConfig>
  )
}
