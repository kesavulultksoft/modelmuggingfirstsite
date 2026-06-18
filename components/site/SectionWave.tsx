export function WaveTopSky() {
  return (
    <div className="relative h-12 w-full bg-[#FAFBFC] md:h-16" aria-hidden>
      <svg
        className="absolute bottom-0 left-0 h-8 w-full text-[#E8F4FD] md:h-12"
        preserveAspectRatio="none"
        viewBox="0 0 1440 48"
        fill="currentColor"
      >
        <path d="M0 48h1440V0C1152 32 720 48 0 24v24z" />
      </svg>
    </div>
  )
}

export function WaveBottomWhite() {
  return (
    <div className="relative h-12 w-full bg-[#E8F4FD]/70 md:h-14" aria-hidden>
      <svg
        className="absolute top-0 left-0 h-8 w-full text-white md:h-12"
        preserveAspectRatio="none"
        viewBox="0 0 1440 48"
        fill="currentColor"
      >
        <path d="M0 0h1440v24C1248 8 576 0 0 32V0z" />
      </svg>
    </div>
  )
}
