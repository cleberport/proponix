export interface TextBoxLayout {
  left: number;
  top: number;
  width: number;
  height: number;
  fontSize: number;
  lineHeightPx: number;
  baseline: number;
  maxLines: number;
}

interface SingleLineOptions {
  width: number;
  height: number;
  fontSize: number;
  paddingX?: number;
  lineHeight?: number;
}

interface ServiceLayoutOptions {
  width: number;
  height: number;
  fontSize: number;
  hasDescription: boolean;
  hasPrice: boolean;
}

export interface ServiceLayout {
  name: TextBoxLayout;
  description: TextBoxLayout | null;
  price: TextBoxLayout | null;
  dividerY: number;
  paddingX: number;
  paddingY: number;
}

export function getSingleLineTextLayout({
  width,
  height,
  fontSize,
  paddingX = 4,
  lineHeight = 1.2,
}: SingleLineOptions): TextBoxLayout {
  const safeWidth = Math.max(0, width - paddingX * 2);
  const lineHeightPx = fontSize * lineHeight;
  const top = Math.max(0, (height - lineHeightPx) / 2);

  return {
    left: paddingX,
    top,
    width: safeWidth,
    height: Math.min(height, lineHeightPx),
    fontSize,
    lineHeightPx,
    baseline: top + fontSize * 0.82,
    maxLines: 1,
  };
}

export function getMultilineTextLayout({
  width,
  height,
  fontSize,
  paddingX = 0,
  paddingY = 0,
  lineHeight = 1.4,
}: SingleLineOptions & { paddingY?: number }): TextBoxLayout {
  const safeWidth = Math.max(0, width - paddingX * 2);
  const safeHeight = Math.max(0, height - paddingY * 2);
  const lineHeightPx = fontSize * lineHeight;
  const maxLines = Math.max(1, Math.floor(safeHeight / Math.max(lineHeightPx, 1)));

  return {
    left: paddingX,
    top: paddingY,
    width: safeWidth,
    height: safeHeight,
    fontSize,
    lineHeightPx,
    baseline: paddingY + fontSize * 0.82,
    maxLines,
  };
}

export function getServiceLayout({
  width,
  height,
  fontSize,
  hasDescription,
  hasPrice,
}: ServiceLayoutOptions): ServiceLayout {
  const paddingX = 8;
  const paddingY = 2;
  const nameLineHeightPx = fontSize * 1.25;
  const descFontSize = Math.max(fontSize - 2, 9);
  const descLineHeightPx = descFontSize * 1.16;
  const priceWidth = hasPrice ? Math.min(Math.max(width * 0.26, fontSize * 5.5), width * 0.38) : 0;
  const gap = hasPrice ? 10 : 0;
  const contentWidth = Math.max(0, width - paddingX * 2 - priceWidth - gap);
  const availableHeight = Math.max(0, height - paddingY * 2);
  const nameMaxLines = !hasDescription
    ? 2
    : availableHeight >= nameLineHeightPx * 2 + descLineHeightPx * 0.8
      ? 2
      : 1;
  const nameHeight = Math.min(availableHeight, nameLineHeightPx * nameMaxLines);
  const canShowDescription = hasDescription && availableHeight - nameHeight >= descLineHeightPx * 0.8;
  const descHeight = canShowDescription ? Math.max(0, availableHeight - nameHeight) : 0;

  return {
    name: {
      left: paddingX,
      top: paddingY,
      width: contentWidth,
      height: nameHeight,
      fontSize,
      lineHeightPx: nameLineHeightPx,
      baseline: paddingY + fontSize * 0.82,
      maxLines: nameMaxLines,
    },
    description: canShowDescription
      ? {
          left: paddingX,
          top: paddingY + nameHeight,
          width: contentWidth,
          height: descHeight,
          fontSize: descFontSize,
          lineHeightPx: descLineHeightPx,
          baseline: paddingY + nameHeight + descFontSize * 0.82,
          maxLines: Math.max(1, Math.floor(descHeight / Math.max(descLineHeightPx, 1))),
        }
      : null,
    price: hasPrice
      ? {
          left: width - paddingX - priceWidth,
          top: paddingY,
          width: priceWidth,
          height: Math.min(availableHeight, nameLineHeightPx),
          fontSize,
          lineHeightPx: nameLineHeightPx,
          baseline: paddingY + fontSize * 0.82,
          maxLines: 1,
        }
      : null,
    dividerY: Math.max(height - 1, 0),
    paddingX,
    paddingY,
  };
}