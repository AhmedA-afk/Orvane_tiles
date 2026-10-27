import { Catalog } from '../components/Catalog'
import { CloseCta } from '../components/home/Doorways'
import { PageHero } from '../components/PageHero'

export default function Collections() {
  return (
    <>
      <PageHero
        l1="Every design,"
        l2="to scale."
        sub="Filter by size, finish, body and room. Each tile stands on the rack at its true size, so a 600 × 600 sits next to an 800 × 1600 the way it would in a showroom. Open a design for its spec sheet and packing list."
      />
      <Catalog />
      <CloseCta />
    </>
  )
}
