interface Props {
  name: string
  size?: number
  onClick?: () => void
}

function initials(name: string) {
  return name
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export default function Avatar({ name, size = 28, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className="rounded-full flex items-center justify-center font-mono font-500 shrink-0 cursor-pointer"
      style={{
        width: size,
        height: size,
        background: '#F5D96B',
        color: '#3A2E0A',
        fontSize: size * 0.38,
        letterSpacing: '0.02em',
      }}
      aria-label="Account menu"
    >
      {initials(name || 'U')}
    </button>
  )
}
