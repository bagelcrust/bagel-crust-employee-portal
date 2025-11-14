/**
 * TrainingTab - Educational resources and training materials
 * Placeholder for future training content
 */

interface TrainingTabProps {
  t: any
}

export function TrainingTab({ }: TrainingTabProps) {
  return (
    <div className="bg-white/90 backdrop-blur-md rounded-[10px] p-5 shadow-[0_4px_12px_rgba(0,0,0,0.06)] border border-white/50">
      <h2 className="text-[28px] font-bold text-gray-800 mb-8 tracking-tight">
        Training
      </h2>
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500 text-lg">Coming soon</p>
      </div>
    </div>
  )
}
