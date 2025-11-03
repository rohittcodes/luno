export function GradientTexture() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" suppressHydrationWarning aria-hidden>
      {/* Gradient overlays inspired by Figma design */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-transparent" />

      {/* Radial gradient spots */}
      <div className="absolute top-0 left-[30%] w-[320px] h-[320px] bg-primary/5 rounded-full blur-3xl opacity-20" />
      <div className="absolute bottom-0 right-[30%] w-[260px] h-[260px] bg-primary/5 rounded-full blur-3xl opacity-20" />

      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `
            linear-gradient(to right, hsl(var(--foreground) / 0.1) 1px, transparent 1px),
            linear-gradient(to bottom, hsl(var(--foreground) / 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }}
      />
    </div>
  )
}
