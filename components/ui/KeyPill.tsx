interface Props {
  label: string
  highlight?: boolean
}

export default function KeyPill({ label, highlight }: Props) {
  return (
    <div
      className="px-3 py-1 rounded-pill border font-mono text-[10px] uppercase tracking-[0.8px]"
      style={{
        background: highlight ? 'rgba(245,245,247,0.08)' : 'transparent',
        borderColor: 'rgba(255,255,255,0.14)',
        color: highlight ? '#F5F5F7' : 'rgba(245,245,247,0.38)',
      }}
    >
      {label}
    </div>
  )
}
