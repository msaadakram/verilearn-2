export function AuthBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-gradient-to-br from-[var(--teal-50)] via-white to-[var(--teal-100)]">
      {/* Large gradient orbs */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-[var(--teal-200)] rounded-full opacity-30 blur-3xl animate-pulse"></div>
      <div className="absolute top-1/4 -right-32 w-80 h-80 bg-[var(--teal-300)] rounded-full opacity-20 blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      <div className="absolute -bottom-32 left-1/4 w-96 h-96 bg-[var(--teal-100)] rounded-full opacity-40 blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>

      {/* Floating shapes */}
      <div className="absolute top-20 left-1/4 w-16 h-16 border-2 border-[var(--teal-300)]/30 rounded-xl rotate-12 animate-float"></div>
      <div className="absolute top-1/3 right-1/4 w-20 h-20 border-2 border-[var(--teal-400)]/20 rounded-full animate-float" style={{ animationDelay: '1.5s' }}></div>
      <div className="absolute bottom-1/4 left-1/3 w-12 h-12 bg-[var(--teal-200)]/20 rounded-lg rotate-45 animate-float" style={{ animationDelay: '3s' }}></div>
      <div className="absolute top-2/3 right-1/3 w-24 h-24 border-2 border-[var(--teal-300)]/25 rounded-2xl -rotate-12 animate-float" style={{ animationDelay: '2.5s' }}></div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: `
          linear-gradient(var(--navy-900) 1px, transparent 1px),
          linear-gradient(90deg, var(--navy-900) 1px, transparent 1px)
        `,
        backgroundSize: '60px 60px'
      }}></div>

      {/* Decorative dots */}
      <div className="absolute top-1/4 left-20">
        <div className="flex gap-2">
          <div className="w-2 h-2 bg-[var(--teal-300)]/40 rounded-full animate-pulse"></div>
          <div className="w-2 h-2 bg-[var(--teal-400)]/30 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
          <div className="w-2 h-2 bg-[var(--teal-300)]/40 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>
      </div>

      <div className="absolute bottom-1/3 right-20">
        <div className="flex flex-col gap-2">
          <div className="w-2 h-2 bg-[var(--teal-400)]/30 rounded-full animate-pulse"></div>
          <div className="w-2 h-2 bg-[var(--teal-300)]/40 rounded-full animate-pulse" style={{ animationDelay: '0.7s' }}></div>
          <div className="w-2 h-2 bg-[var(--teal-400)]/30 rounded-full animate-pulse" style={{ animationDelay: '1.4s' }}></div>
        </div>
      </div>

      {/* Gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent"></div>
    </div>
  );
}
