// =====================================================
// src/components/globe/Compass.tsx
// SVG-компас с рисками и стрелкой севера
// =====================================================

// =====================================================
// === Пропсы ===
// =====================================================
interface CompassProps {
  heading: number;
  size: number;
  showTicks: boolean;
  northColor: string;
  ringColor: string;
  textColor: string;
  bgColor: string;
  borderColor: string;
}

// =====================================================
// === Компонент ===
// =====================================================
function Compass({
  heading,
  size,
  showTicks,
  northColor,
  ringColor,
  textColor,
  bgColor,
  borderColor,
}: CompassProps) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 3;
  const normalizedHeading = ((heading % 360) + 360) % 360;

  const ticks: JSX.Element[] = [];
  if (showTicks) {
    for (let a = 0; a < 360; a += 30) {
      const isMain = a % 90 === 0;
      const len = isMain ? 6 : 4;
      const rad1 = ((a - 90) * Math.PI) / 180;
      const x1 = cx + Math.cos(rad1) * r;
      const y1 = cy + Math.sin(rad1) * r;
      const x2 = cx + Math.cos(rad1) * (r - len);
      const y2 = cy + Math.sin(rad1) * (r - len);
      ticks.push(
        <line
          key={a}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke={ringColor}
          strokeWidth={isMain ? 1.6 : 1}
          strokeLinecap="round"
        />
      );
    }
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox={'0 0 ' + size + ' ' + size}
      style={{ display: 'block', pointerEvents: 'none' }}
    >
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill={bgColor}
        stroke={borderColor}
        strokeWidth={1}
      />
      {ticks}
      <g transform={'rotate(' + normalizedHeading + ' ' + cx + ' ' + cy + ')'}>
        <polygon
          points={
            cx + ',' + (cy - r * 0.55) + ' ' +
            (cx - 5) + ',' + (cy + 2) + ' ' +
            cx + ',' + (cy - 2) + ' ' +
            (cx + 5) + ',' + (cy + 2)
          }
          fill={northColor}
        />
        <polygon
          points={
            cx + ',' + (cy + r * 0.55) + ' ' +
            (cx - 5) + ',' + (cy - 2) + ' ' +
            cx + ',' + (cy + 2) + ' ' +
            (cx + 5) + ',' + (cy - 2)
          }
          fill={ringColor}
          opacity={0.65}
        />
      </g>
      <text
        x={cx}
        y={11}
        textAnchor="middle"
        fontSize={9}
        fontWeight="700"
        fill={northColor}
        style={{ userSelect: 'none' }}
      >
        N
      </text>
      <text
        x={cx}
        y={cy + 4}
        textAnchor="middle"
        fontSize={10}
        fontWeight="600"
        fill={textColor}
        style={{ userSelect: 'none', fontFamily: 'Consolas, monospace' }}
      >
        {Math.round(normalizedHeading)}°
      </text>
    </svg>
  );
}

export default Compass;