interface Props {
  label: string;
  action?: string;
  onAction?: () => void;
}

export default function EmptyState({ label, action, onAction }: Props) {
  if (!label && !action) return null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 64, color: 'var(--fg-dim)', textAlign: 'center' }}>
      {label && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase' }}>{label}</div>}
      {action && onAction && (
        <button className="btn btn-ghost" onClick={onAction} style={{ marginTop: 8 }}>{action}</button>
      )}
    </div>
  );
}
