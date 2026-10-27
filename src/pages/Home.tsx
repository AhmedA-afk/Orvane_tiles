import { Hero } from '../components/Hero'
import { CloseCta, Doorways } from '../components/home/Doorways'
import { LayingStory } from '../components/home/LayingStory'

export default function Home() {
  return (
    <>
      <Hero />
      <LayingStory />
      <Doorways />
      <CloseCta />
    </>
  )
}
