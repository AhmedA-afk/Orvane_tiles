import { CloseCta } from '../components/home/Doorways'
import { PageHero } from '../components/PageHero'
import { Visualizer } from '../components/Visualizer'

export default function VisualizerPage() {
  return (
    <>
      <PageHero
        l1="Lay it in a room"
        l2="before it ships."
        sub="Pick a design and the floor relays itself at the true tile size, in straight lay or half offset."
      />
      <Visualizer />
      <CloseCta />
    </>
  )
}
