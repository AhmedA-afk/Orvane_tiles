import { PageHero } from '../components/PageHero'
import { Magnetic } from '../motion/Magnetic'

export default function NotFound() {
  return (
    <PageHero l1="This page" l2="isn’t in the catalog." sub="The link may be old. Start from the collections instead.">
      <div>
        <Magnetic to="/collections">Browse the collections</Magnetic>
      </div>
    </PageHero>
  )
}
