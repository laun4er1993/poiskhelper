// =====================================================
// src/components/settings/ui/Section.tsx
// Секция настроек — заголовок + тело
// =====================================================

interface SectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

function Section({ title, icon, children }: SectionProps) {
  return (
    <section style={styles.section}>
      <h3 style={styles.title}>
        {icon}
        {title}
      </h3>
      <div style={styles.body}>{children}</div>
    </section>
  );
}

const styles: Record<string, React.CSSProperties> = {
  section: {
    marginBottom: 20,
  },
  title: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--accent)',
    margin: '0 0 10px 0',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  body: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
};

export default Section;