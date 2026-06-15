type Face = 'question' | 'answer'

interface Props {
  face: Face
  onChange: (face: Face) => void
}

export default function QAToggle({ face, onChange }: Props) {
  return (
    <div className="flex items-center gap-1 px-1 py-1 rounded-pill bg-surface-card">
      {(['question', 'answer'] as Face[]).map(f => (
        <button
          key={f}
          type="button"
          onClick={() => onChange(f)}
          className={`px-4 py-1.5 rounded-pill text-[12px] font-mono uppercase tracking-[0.8px] transition-colors ${
            face === f
              ? 'bg-[#F5F5F7] text-[#0A0A0B]'
              : 'bg-transparent text-[rgba(245,245,247,0.4)]'
          }`}
        >
          {f === 'question' ? 'Q' : 'A'}
        </button>
      ))}
    </div>
  )
}
