import { useEffect, useRef } from 'react'
import { Html5Qrcode } from 'html5-qrcode'

const REGION_ID = 'qr-scanner-region'

export default function QrScanner({ onScan, onError }) {
  const stoppedRef = useRef(false)
  const onScanRef = useRef(onScan)
  const onErrorRef = useRef(onError)

  useEffect(() => {
    onScanRef.current = onScan
    onErrorRef.current = onError
  }, [onScan, onError])

  useEffect(() => {
    stoppedRef.current = false
    const html5QrCode = new Html5Qrcode(REGION_ID)

    html5QrCode
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: 220 },
        (decodedText) => {
          if (stoppedRef.current) return
          stoppedRef.current = true
          html5QrCode.stop().then(() => html5QrCode.clear()).catch(() => {})
          onScanRef.current(decodedText)
        },
        () => {} // per-frame decode failure, expected while searching for a code
      )
      .catch((err) => {
        onErrorRef.current?.(err)
      })

    return () => {
      if (!stoppedRef.current) {
        stoppedRef.current = true
        html5QrCode.stop().then(() => html5QrCode.clear()).catch(() => {})
      }
    }
  }, [])

  return <div id={REGION_ID} className="w-full rounded-xl overflow-hidden" />
}
