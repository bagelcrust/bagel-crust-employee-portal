import { QRCodeSVG } from 'qrcode.react'
import { Camera } from 'lucide-react'

/**
 * QR Code linking to Employee Portal
 * Positioned in top-left corner of clock in/out page
 * Bilingual label for English and Spanish speakers
 */
export function PortalQRCode() {
  const portalUrl = 'https://bagelcrust.biz/employee-portal'

  return (
    <div className="fixed left-6 top-[calc(1rem+env(safe-area-inset-top))] flex flex-col items-center gap-2 z-20">
      <div className="bg-white p-2 rounded-lg shadow-md">
        <QRCodeSVG
          value={portalUrl}
          size={100}
          level="M"
          bgColor="#ffffff"
          fgColor="#1e293b"
        />
      </div>
      <div className="text-center">
        <div className="flex items-center justify-center gap-1 text-slate-700">
          <Camera className="w-5 h-5" />
          <span className="text-sm font-medium">View Hours</span>
        </div>
        <div className="text-sm text-slate-500">Ver Horas</div>
      </div>
    </div>
  )
}
