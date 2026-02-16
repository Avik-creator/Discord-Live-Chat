import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { Navbar } from "@/components/navbar"
import { Hero } from "@/components/hero"
import { Integrations } from "@/components/integrations"
import { HowItWorks } from "@/components/how-it-works"
import { Features } from "@/components/features"
import { CtaSection } from "@/components/cta-section"
import { Footer } from "@/components/footer"

export default async function Page() {
  let isLoggedIn = false
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })
    isLoggedIn = !!session
  } catch {
    // Not logged in
  }

  return (
    <main>
      <Navbar isLoggedIn={isLoggedIn} />
      <Hero isLoggedIn={isLoggedIn} />
      <Integrations />
      <HowItWorks />
      <Features />
      <CtaSection isLoggedIn={isLoggedIn} />
      <Footer />
    </main>
  )
}
