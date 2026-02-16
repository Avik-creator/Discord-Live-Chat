import { MessageSquare, Hash, Zap } from "lucide-react"

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
  return (
    <section id="how-it-works" className="border-t border-border py-24 lg:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">How it works</p>
          <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl text-balance">
            Three steps. Five minutes. Done.
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            No complex onboarding. Just connect your server, paste one snippet, and start chatting.
          </p>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {steps.map((step) => (
            <div
              key={step.step}
              className="group relative rounded-2xl border border-border bg-card p-8 transition-colors hover:border-primary/30"
            >
              <div className="mb-6 flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <step.icon className="h-6 w-6 text-primary" />
                </div>
                <span className="font-display text-sm font-bold text-muted-foreground">{step.step}</span>
              </div>
              <h3 className="font-display text-xl font-semibold text-foreground">{step.title}</h3>
              <p className="mt-3 leading-relaxed text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
