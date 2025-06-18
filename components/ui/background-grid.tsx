export function BackgroundGrid() {
  return (
    <div className="absolute inset-0 -z-10 h-full w-full bg-white bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:4rem_4rem]">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-blue-50 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
    </div>
  )
} 