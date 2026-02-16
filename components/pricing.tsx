import Link from "next/link"
import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"

const plans = [
  {
    name: "Starter",
    price: "Free",
    period: "forever",
    description: "Perfect for personal sites and side projects.",
    features: [
      "1 website",
      "1 Discord server",
      "Unlimited messages",
      "Basic customization",
      "Community support",
    ],
    cta: "Get Started Free",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$19",
    period: "/month",
    description: "For growing teams that need more power.",
    features: [
      "Unlimited websites",
      "Unlimited Discord servers",
      "Unlimited messages",
      "Full brand customization",
      "Offline message queue",
      "Priority support",
      "Analytics dashboard",
    ],
    cta: "Start Free Trial",
    highlighted: true,
  },
  {
    name: "Team",
    price: "$49",
    period: "/month",
    description: "For larger teams with advanced needs.",
    features: [
      "Everything in Pro",
      "Multiple team channels",
      "Auto-routing rules",
      "Canned responses",
      "API access",
      "Dedicated support",
      "Custom integrations",
    ],
    cta: "Start Free Trial",
    highlighted: false,
  },
]

export function Pricing() {
  return (
    <section
      id="pricing"
      className="border-t border-border py-24 lg:py-32"
    >
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Pricing
          </p>
          <h2 className="mt-4 text-2xl font-bold tracking-tight text-foreground sm:text-3xl text-balance">
            Simple pricing, no surprises
          </h2>
          <p className="mt-4 text-sm text-muted-foreground">
            Start free. Upgrade when you need more.
          </p>
        </div>

        <div className="mt-16 grid gap-px border border-border bg-border lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col bg-card p-8 ${
                plan.highlighted ? "bg-accent/30" : ""
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-px left-0 right-0 h-px bg-foreground" />
              )}
              {plan.highlighted && (
                <span className="mb-4 inline-flex w-fit bg-foreground px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-background">
                  Most Popular
                </span>
              )}

              <div className="mb-6">
                <h3 className="text-xs font-bold uppercase tracking-widest text-foreground">
                  {plan.name}
                </h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-foreground">
                    {plan.price}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {plan.period}
                  </span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {plan.description}
                </p>
              </div>

              <ul className="mb-8 flex flex-1 flex-col gap-2.5">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-2.5 text-xs text-foreground"
                  >
                    <Check className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Button
                className={`w-full text-xs ${
                  plan.highlighted
                    ? ""
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
                asChild
              >
                <Link href="/login">{plan.cta}</Link>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
