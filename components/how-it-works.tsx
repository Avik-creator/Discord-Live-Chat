"use client"

import { MessageSquare, Hash, Zap } from "lucide-react"
import { useRef, useState, useEffect } from "react"

const steps = [
  {
    icon: MessageSquare,
    step: "01",
    title: "Visitor sends a message",
    description:
      "A customer clicks the chat widget on your website and types their question. No sign-up needed on their end.",
  },
  {
    icon: Hash,
    step: "02",
    title: "It appears in Discord",
    description:
      "The message lands instantly in a dedicated channel in your Discord server. Your whole team can see it.",
  },
  {
    icon: Zap,
    step: "03",
    title: "You reply from Discord",
    description:
      "Type your response in Discord. The visitor sees it on your website in real-time. Conversation done.",
  },
]

export function HowItWorks() {
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
      { threshold: 0.15 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <section
      id="how-it-works"
      className="border-t border-border py-24 lg:py-32"
      ref={ref}
    >
      <div className="mx-auto max-w-6xl px-6">
        <div className={`mx-auto max-w-2xl text-center transition-all duration-600 ${visible ? "animate-fade-in-up" : "opacity-0"}`}>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            How it works
          </p>
          <h2 className="mt-4 text-2xl font-bold tracking-tight text-foreground sm:text-3xl text-balance">
            Three steps. Five minutes. Done.
          </h2>
          <p className="mt-4 text-sm text-muted-foreground">
            No complex onboarding. Just connect your server, paste one
            snippet, and start chatting.
          </p>
        </div>

        <div className={`mt-16 grid gap-6 md:grid-cols-3 ${visible ? "stagger-children" : "opacity-0"}`}>
          {steps.map((step) => (
            <div
              key={step.step}
              className="group relative border border-border bg-card p-8 transition-all duration-300 hover:bg-accent/50 hover:-translate-y-0.5"
            >
              <div className="mb-6 flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center bg-foreground transition-transform duration-300 group-hover:scale-110">
                  <step.icon className="h-4 w-4 text-background" />
                </div>
                <span className="text-[10px] font-bold tracking-widest text-muted-foreground">
                  {step.step}
                </span>
              </div>
              <h3 className="text-sm font-bold text-foreground">
                {step.title}
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
