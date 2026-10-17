// =====================================================
// src/components/project-details/ui.tsx
// Мелкие UI-элементы для диалога сведений о проекте
// =====================================================

// -----------------------------------------------------
// Section — заголовок + тело
// -----------------------------------------------------
interface SectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

export function Section({ title, icon, children }: SectionProps) {
  return (
    <section style={styles.section}>
      <h3 style={styles.sectionTitle}>
        {icon}
        <span>{title}</span>
      </h3>
      <div style={styles.sectionBody}>{children}</div>
    </section>
  );
}

// -----------------------------------------------------
// FieldRow — строка «label : контрол»
// -----------------------------------------------------
interface FieldRowProps {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}

export function FieldRow({ label, required, children }: FieldRowProps) {
  return (
    <div style={styles.fieldRow}>
      <label style={styles.fieldLabel}>
        {label}
        {required && <span style={styles.required}>*</span>}
      </label>
      <div style={styles.fieldControl}>{children}</div>
    </div>
  );
}

// -----------------------------------------------------
// SegmentButton — сегментная кнопка
// -----------------------------------------------------
interface SegmentButtonProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

export function SegmentButton({
  label,
  active,
  onClick,
}: SegmentButtonProps) {
  return (
    <button
      style={{
        ...styles.segmentBtn,
        backgroundColor: active ? 'var(--accent)' : 'transparent',
        color: active ? 'var(--accent-text)' : 'var(--text-secondary)',
        borderColor: active ? 'var(--accent)' : 'var(--border)',
      }}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

// -----------------------------------------------------
// StatCard — карточка статистики
// -----------------------------------------------------
interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}

export function StatCard({ icon, label, value, color }: StatCardProps) {
  return (
    <div style={styles.statCard}>
      <span style={{ color: color }}>{icon}</span>
      <span style={styles.statValue}>{value}</span>
      <span style={styles.statLabel}>{label}</span>
    </div>
  );
}

// =====================================================
// === Стили ===
// =====================================================
const styles: Record<string, React.CSSProperties> = {
  section: {
    marginBottom: 14,
  },
  sectionTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 11.5,
    fontWeight: 700,
    color: 'var(--accent)',
    margin: '0 0 8px 0',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    paddingBottom: 4,
    borderBottom: '1px solid var(--border)',
  },
  sectionBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  fieldRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    minHeight: 30,
  },
  fieldLabel: {
    fontSize: 12,
    color: 'var(--text-secondary)',
    minWidth: 140,
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    gap: 3,
  },
  required: {
    color: 'var(--danger)',
    fontSize: 14,
    lineHeight: 1,
  },
  fieldControl: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
  },
  segmentBtn: {
    padding: '5px 12px',
    fontSize: 11.5,
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-small)',
    cursor: 'pointer',
    fontFamily: 'inherit',
    backgroundColor: 'transparent',
    minWidth: 36,
  },
  statCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 3,
    padding: '10px 6px',
    backgroundColor: 'var(--bg-surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-small)',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 700,
    color: 'var(--text-primary)',
    fontFamily: 'Consolas, monospace',
  },
  statLabel: {
    fontSize: 10,
    color: 'var(--text-muted)',
    textAlign: 'center',
  },
};