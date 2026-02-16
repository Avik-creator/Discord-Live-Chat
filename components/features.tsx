import {
  Globe,
  Bell,
  Users,
  Shield,
  Paintbrush,
  Clock,
} from "lucide-react"

const features = [
  {
    icon: Globe,
    title: "Works everywhere",
    description:
      "Shopify, WordPress, Webflow, React, Next.js, or any custom site. One script tag is all it takes.",
  },
  {
    icon: Bell,
    title: "Instant notifications",
    description:
      "Get pinged in Discord the moment a visitor sends a message. Never miss a conversation again.",
  },
  {
    icon: Users,
    title: "Team-friendly",
    description:
      "Any team member in your Discord server can jump in and reply. No seat limits, no extra logins.",
  },
  {
    icon: Shield,
    title: "Private & secure",
    description:
      "Messages are encrypted in transit. Visitor data never leaves your control. GDPR-friendly by design.",
  },
  {
    icon: Paintbrush,
    title: "Fully customizable",
    description:
      "Match the chat widget to your brand. Colors, position, welcome message — all configurable.",
  },
  {
    icon: Clock,
    title: "Offline mode",
    description:
      "Not online? Visitors can still leave a message. It queues in Discord for you to answer later.",
  },
]

export function Features() {
  return (
    <section id="features" className="border-t border-border py-24 lg:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">Features</p>
          <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl text-balance">
            Everything you need, nothing you don&apos;t
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Built for teams that want real-time support without the bloat of enterprise tools.
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group rounded-2xl border border-border bg-card p-7 transition-colors hover:border-primary/30"
            >
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                <feature.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-display text-lg font-semibold text-foreground">{feature.title}</h3>
              <p className="mt-2 leading-relaxed text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
