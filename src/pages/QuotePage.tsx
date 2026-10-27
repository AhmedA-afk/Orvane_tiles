import { PageHero } from '../components/PageHero'
import { Quote } from '../components/Quote'

export default function QuotePage() {
  return (
    <>
      <PageHero
        l1="Ask for a"
        l2="container quote."
        sub="Tell us the designs, how many containers and your port. The message opens in WhatsApp, ready to send to our export desk."
      />
      <Quote />
    </>
  )
}
