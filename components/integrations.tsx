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
    <section className="border-t border-border py-16">
      <div className="mx-auto max-w-6xl px-6">
        <p className="text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Works with every platform you already use
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
          {platforms.map((platform) => (
            <span
              key={platform}
              className="text-sm font-bold text-muted-foreground/40 transition-colors hover:text-foreground"
            >
              {platform}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
