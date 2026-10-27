import { ContainerCalc } from '../components/ContainerCalc'
import { Export } from '../components/Export'
import { CloseCta } from '../components/home/Doorways'
import { PageHero } from '../components/PageHero'

export default function ExportPage() {
  return (
    <>
      <PageHero
        l1="Ship it by"
        l2="the container."
        sub="How much fits in a 20 or 40 ft container, how long it sails, and the papers that travel with it."
      />
      <ContainerCalc />
      <Export />
      <CloseCta />
    </>
  )
}
