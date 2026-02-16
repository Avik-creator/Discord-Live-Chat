export const metadata = {
  title: "Bridgecord Widget",
}

export default function WidgetLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <div className="h-screen bg-background">{children}</div>
}
