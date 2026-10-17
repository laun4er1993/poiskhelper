// =====================================================
// src/components/tree/IconPreviewMini.tsx
// Мини-превью метки в строке дерева
// =====================================================

interface IconPreviewMiniProps {
  iconHref: string;
  sizePx: number;
  fillColor: string;
  outlineColor: string;
  outlineFraction: number;
  visible: boolean;
  opacity: number;
}

function IconPreviewMini({
  iconHref,
  sizePx,
  fillColor,
  outlineColor,
  outlineFraction,
  visible,
  opacity,
}: IconPreviewMiniProps) {
  const effectiveOpacity = visible ? Math.max(0.35, opacity) : 0.3;

  // Без иконки — просто кружок
  if (!iconHref || iconHref.length === 0) {
    const borderPx = Math.max(0, Math.round(sizePx * outlineFraction));
    return (
      <span
        style={{
          width: sizePx,
          height: sizePx,
          borderRadius: '50%',
          backgroundColor: fillColor,
          border: borderPx + 'px solid ' + outlineColor,
          boxSizing: 'content-box',
          display: 'inline-block',
          opacity: effectiveOpacity,
          flexShrink: 0,
        }}
      />
    );
  }

  // С иконкой — двухслойное превью через mask
  const outlineSize = sizePx * (1 + outlineFraction);
  return (
    <span
      style={{
        position: 'relative',
        width: outlineSize,
        height: outlineSize,
        flexShrink: 0,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: effectiveOpacity,
      }}
    >
      {outlineFraction > 0.005 && (
        <span
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: outlineSize,
            height: outlineSize,
            backgroundColor: outlineColor,
            WebkitMaskImage: 'url(' + iconHref + ')',
            WebkitMaskSize: 'contain',
            WebkitMaskRepeat: 'no-repeat',
            WebkitMaskPosition: 'center',
            maskImage: 'url(' + iconHref + ')',
            maskSize: 'contain',
            maskRepeat: 'no-repeat',
            maskPosition: 'center',
            pointerEvents: 'none',
          }}
        />
      )}
      <span
        style={{
          position: 'relative',
          width: sizePx,
          height: sizePx,
          backgroundColor: fillColor,
          WebkitMaskImage: 'url(' + iconHref + ')',
          WebkitMaskSize: 'contain',
          WebkitMaskRepeat: 'no-repeat',
          WebkitMaskPosition: 'center',
          maskImage: 'url(' + iconHref + ')',
          maskSize: 'contain',
          maskRepeat: 'no-repeat',
          maskPosition: 'center',
          pointerEvents: 'none',
        }}
      />
    </span>
  );
}

export default IconPreviewMini;