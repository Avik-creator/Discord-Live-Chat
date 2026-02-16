"use client"

import { useRef, useState, useEffect } from "react"

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
      { threshold: 0.2 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <section className="border-t border-border py-16" ref={ref}>
      <div className="mx-auto max-w-6xl px-6">
        <p className={`text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground transition-all duration-500 ${visible ? "animate-fade-in" : "opacity-0"}`}>
          Works with every platform you already use
        </p>
        <div className={`mt-8 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 ${visible ? "stagger-children" : "opacity-0"}`}>
          {platforms.map((platform) => (
            <span
              key={platform}
              className="text-sm font-bold text-muted-foreground/40 transition-all duration-300 hover:text-foreground hover:scale-105"
            >
              {platform}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
