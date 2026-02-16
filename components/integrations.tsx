const platforms = [
  "Shopify",
  "WordPress",
  "Webflow",
  "React",
  "Next.js",
  "Squarespace",
  "Wix",
  "Custom HTML",
]

export function Integrations() {
  return (
    <section className="border-t border-border py-20">
      <div className="mx-auto max-w-6xl px-6">
        <p className="text-center text-sm font-medium text-muted-foreground">
          Works with every platform you already use
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-10 gap-y-6">
          {platforms.map((platform) => (
            <span
              key={platform}
              className="font-display text-lg font-semibold text-muted-foreground/60 transition-colors hover:text-foreground"
            >
              {platform}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
