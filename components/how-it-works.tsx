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
    <section
      id="how-it-works"
      className="border-t border-border py-24 lg:py-32"
    >
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
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

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {steps.map((step) => (
            <div
              key={step.step}
              className="group relative border border-border bg-card p-8 transition-colors hover:bg-accent/50"
            >
              <div className="mb-6 flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center bg-foreground">
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
