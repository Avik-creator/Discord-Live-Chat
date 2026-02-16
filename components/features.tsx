"use client"

import {
  Globe,
  Bell,
  Users,
  Shield,
  Paintbrush,
  Clock,
} from "lucide-react"
import { useRef, useState, useEffect } from "react"

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
      "Match the chat widget to your brand. Colors, position, welcome message -- all configurable.",
  },
  {
    icon: Clock,
    title: "Offline mode",
    description:
      "Not online? Visitors can still leave a message. It queues in Discord for you to answer later.",
  },
]

export function Features() {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <section
      id="features"
      className="border-t border-border py-24 lg:py-32"
      ref={ref}
    >
      <div className="mx-auto max-w-6xl px-6">
        <div className={`mx-auto max-w-2xl text-center transition-all duration-600 ${visible ? "animate-fade-in-up" : "opacity-0"}`}>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Features
          </p>
          <h2 className="mt-4 text-2xl font-bold tracking-tight text-foreground sm:text-3xl text-balance">
            {"Everything you need, nothing you don't"}
          </h2>
          <p className="mt-4 text-sm text-muted-foreground">
            Built for teams that want real-time support without the bloat
            of enterprise tools.
          </p>
        </div>

        <div className={`mt-16 grid gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-3 ${visible ? "stagger-children" : "opacity-0"}`}>
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group bg-card p-7 transition-all duration-300 hover:bg-accent/50"
            >
              <div className="mb-5 flex h-9 w-9 items-center justify-center bg-foreground transition-transform duration-300 group-hover:scale-110">
                <feature.icon className="h-4 w-4 text-background" />
              </div>
              <h3 className="text-xs font-bold text-foreground">
                {feature.title}
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
