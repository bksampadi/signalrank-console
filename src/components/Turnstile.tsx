import { useEffect, useRef } from 'react'

type TurnstileAPI = {
  render: (
    element: HTMLElement,
    options: Record<string, unknown>,
  ) => string
  reset: (id: string) => void
  remove: (id: string) => void
}

declare global {
  interface Window {
    turnstile?: TurnstileAPI
  }
}

type Props = {
  onVerify: (token: string) => void
  resetCount: number
}

export function Turnstile({ onVerify, resetCount }: Props) {
  const container = useRef<HTMLDivElement>(null)
  const widgetId = useRef<string | null>(null)
  const onVerifyRef = useRef(onVerify)

  useEffect(() => {
    onVerifyRef.current = onVerify
  }, [onVerify])

  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY

  useEffect(() => {
    if (!siteKey) return

    let cancelled = false

    const renderWidget = () => {
      if (
        cancelled ||
        !window.turnstile ||
        !container.current ||
        widgetId.current !== null
      ) {
        return
      }

      widgetId.current = window.turnstile.render(
        container.current,
        {
          sitekey: siteKey,
          action: 'retrieve',
          callback: (token: string) =>
            onVerifyRef.current(token),
          'expired-callback': () =>
            onVerifyRef.current(''),
          'error-callback': () =>
            onVerifyRef.current(''),
        },
      )
    }

    let script = document.getElementById(
      'cloudflare-turnstile',
    ) as HTMLScriptElement | null

    if (!script) {
      script = document.createElement('script')
      script.id = 'cloudflare-turnstile'
      script.src =
        'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
      script.async = true
      document.head.appendChild(script)
    }

    script.addEventListener('load', renderWidget)
    renderWidget()

    return () => {
      cancelled = true
      script?.removeEventListener('load', renderWidget)

      if (widgetId.current !== null) {
        window.turnstile?.remove(widgetId.current)
        widgetId.current = null
      }
    }
  }, [siteKey])

  useEffect(() => {
    if (resetCount > 0 && widgetId.current !== null) {
      window.turnstile?.reset(widgetId.current)
    }
  }, [resetCount])

  if (!siteKey) {
    return <p>Human verification is not configured.</p>
  }

  return <div ref={container} />
}