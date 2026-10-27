import { Factory } from '../components/Factory'
import { CloseCta } from '../components/home/Doorways'
import { PageHero } from '../components/PageHero'

export default function FactoryPage() {
  return (
    <>
      <PageHero
        l1="From clay"
        l2="to carton."
        sub="Every slab is pressed, printed, fired, polished and packed on one line in Morbi, so shade and caliber stay consistent from the first container to the fortieth."
      />
      <Factory />
      <CloseCta />
    </>
  )
}
