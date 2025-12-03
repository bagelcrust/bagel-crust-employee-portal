import { QRCodeSVG } from 'qrcode.react'

/**
 * QR Code linking to Employee Portal
 * Positioned in top-left corner of clock in/out page
 * Bilingual label for English and Spanish speakers
 */
export function PortalQRCode() {
  const portalUrl = 'https://bagelcrust.biz/employee-portal'

  return (
    <div className="fixed top-4 left-4 flex flex-col items-center gap-2 z-20">
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
        <div className="text-sm font-medium text-slate-700">View Hours</div>
        <div className="text-sm font-medium text-slate-500">Ver Horas</div>
      </div>
    </div>
  )
}
