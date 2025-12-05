import { QRCodeSVG } from 'qrcode.react'
import { Camera } from 'lucide-react'

/**
 * QR Code Widget for Clock In/Out sidebar
 * Links to Employee Portal for viewing hours
 * Bilingual label (English/Spanish)
 *
 * WIDGET VERSION: Non-fixed, flows in sidebar layout
 * Uses shared glassmorphism styling
 */
export function PortalQRCode() {
  const portalUrl = 'https://bagelcrust.biz/employee-portal'

  return (
    <div className="bg-white/70 backdrop-blur-md border border-white/80 rounded-[10px] shadow-[0_4px_16px_rgba(0,0,0,0.08)] p-3">
      {/* Header */}
      <div className="text-xs font-bold tracking-[0.15em] text-gray-400 uppercase mb-2 text-center">
        Employee Portal
      </div>

      {/* QR Code - centered */}
      <div className="flex justify-center mb-2">
        <div className="bg-white p-2 rounded-lg shadow-sm">
          <QRCodeSVG
            value={portalUrl}
            size={72}
            level="M"
            bgColor="#ffffff"
            fgColor="#1e293b"
          />
        </div>
      </div>

      {/* Footer: what you can access */}
      <div className="flex items-center justify-center gap-1.5 text-xs text-slate-600">
        <Camera className="w-3.5 h-3.5 text-slate-500" />
        <span>Schedule</span>
        <span className="text-slate-400">•</span>
        <span>Hours</span>
        <span className="text-slate-400">•</span>
        <span>Time Off</span>
      </div>
    </div>
  )
}
