import * as React from "react"

const MOBILE_BREAKPOINT = 768

function detectMobileNow() {
  if (typeof window === "undefined") return false
  const mqlPointer = window.matchMedia("(pointer: coarse)")
  const mqlWidth = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
  const ua = navigator.userAgent || navigator.vendor || (window as any).opera || ""
  const uaIsMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(ua)
  return mqlPointer.matches || mqlWidth.matches || uaIsMobile
}

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(() => (typeof window !== "undefined" ? detectMobileNow() : false))

  React.useEffect(() => {
    const update = () => {
      const val = detectMobileNow()
      setIsMobile(val)
      document.documentElement.classList.toggle("is-mobile", val)
    }

    const mqlPointer = window.matchMedia("(pointer: coarse)")
    const mqlWidth = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)

    // Init
    update()

    // Listeners
    mqlPointer.addEventListener("change", update)
    mqlWidth.addEventListener("change", update)
    window.addEventListener("resize", update)
    window.addEventListener("orientationchange", update)

    return () => {
      mqlPointer.removeEventListener("change", update)
      mqlWidth.removeEventListener("change", update)
      window.removeEventListener("resize", update)
      window.removeEventListener("orientationchange", update)
    }
  }, [])

  return isMobile
}
