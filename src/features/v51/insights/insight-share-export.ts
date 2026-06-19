import {
  getInsightPromptHeader,
  getLatestCompanyItem,
  getProfileByInsight,
  getProfileJobTitle,
  getProviderExportSubtitle,
  getPublishedInsightBySlugOrId,
  type PublishedInsight
} from "@/features/v51/data/experience-discovery";
import { DEFAULT_AVATAR_SRC } from "@/components/ui/avatar-constants";

export type InsightShareExportData = Readonly<{
  insight: {
    id: string;
    slug: string;
    sourceType: PublishedInsight["sourceType"];
    promptHeader: string;
    answerText: string;
    canonicalUrl: string;
    publishedAt: string | null;
  };
  provider: {
    id: string;
    name: string;
    avatarUrl?: string;
    initials: string;
    jobTitle: string;
    companyName: string;
    subtitle: string;
    publicProfileUrl: string;
  };
  brand: {
    logoAssetUrl: string;
  };
}>;

type ClipboardWriter = Pick<Clipboard, "writeText">;

export const insightShareBrand = {
  logoAssetUrl: "/brand/useravaa/useravaa-responsive-narrow-wordmark-navy-transparent.png"
} as const;

export const insightShareImageDimensions = {
  width: 1600,
  height: 900
} as const;

export const insightShareVisualSpec = {
  providerAvatarSize: 252,
  answerFontSize: 44,
  answerMinimumFontSize: 26,
  answerMaxLines: 7,
  answerSafeCharacterCount: 300,
  footerUrlFontSize: 22,
  promptPillFontSize: 26,
  logoDrawWidth: 210
} as const;

const UA_COLORS = {
  navy: "#091B49",
  blue: "#245FFD",
  teal: "#01C3B9",
  white: "#FFFFFF",
  softBlue: "#EEF4FF",
  softTeal: "#E9FBF8",
  surface: "#FFFFFF",
  line: "#D7E0EE",
  muted: "#667085"
} as const;

export const insightSharePersianFontFamily = '"Yekan Bakh", Tahoma, Arial, sans-serif';
export const insightShareLatinFontFamily = '"Manrope", Arial, sans-serif';
export const insightShareFontFamily = insightSharePersianFontFamily;

export type InsightShareAnswerSizeClass = "short" | "medium" | "long" | "stress";

export function countInsightShareCharacters(value: string) {
  return Array.from(value).length;
}

export function getInsightShareAnswerTypography(answerText: string) {
  const length = countInsightShareCharacters(answerText);

  if (length <= 120) {
    return {
      sizeClass: "short" as InsightShareAnswerSizeClass,
      fontSize: 44,
      lineHeight: 72,
      fontWeight: 600
    };
  }

  if (length <= 200) {
    return {
      sizeClass: "medium" as InsightShareAnswerSizeClass,
      fontSize: 38,
      lineHeight: 62,
      fontWeight: 600
    };
  }

  if (length <= insightShareVisualSpec.answerSafeCharacterCount) {
    return {
      sizeClass: "long" as InsightShareAnswerSizeClass,
      fontSize: 32,
      lineHeight: 52,
      fontWeight: 560
    };
  }

  return {
    sizeClass: "stress" as InsightShareAnswerSizeClass,
    fontSize: 30,
    lineHeight: 50,
    fontWeight: 560
  };
}

export function getInsightShareAnswerTextForRender(answerText: string) {
  const characters = Array.from(answerText);

  if (characters.length <= insightShareVisualSpec.answerSafeCharacterCount) {
    return answerText;
  }

  return `${characters.slice(0, insightShareVisualSpec.answerSafeCharacterCount).join("")}…`;
}

export function buildInsightShareExportData(insightSlugOrId: string): InsightShareExportData | null {
  const insight = getPublishedInsightBySlugOrId(insightSlugOrId);

  if (!insight) {
    return null;
  }

  return buildInsightShareExportDataFromInsight(insight);
}

export function buildInsightShareExportDataFromInsight(insight: PublishedInsight): InsightShareExportData | null {
  const profile = getProfileByInsight(insight);

  if (!profile) {
    return null;
  }

  const companyName = getLatestCompanyItem(profile)?.companyName ?? "";

  return {
    insight: {
      id: insight.id,
      slug: insight.slug,
      sourceType: insight.sourceType,
      promptHeader: getInsightPromptHeader(insight),
      answerText: insight.answerText,
      canonicalUrl: insight.canonicalUrl,
      publishedAt: insight.publishedAt
    },
    provider: {
      id: profile.id,
      name: profile.name,
      avatarUrl: "avatarUrl" in profile ? profile.avatarUrl || DEFAULT_AVATAR_SRC : DEFAULT_AVATAR_SRC,
      initials: profile.initials,
      jobTitle: getProfileJobTitle(profile),
      companyName,
      subtitle: getProviderExportSubtitle(profile),
      publicProfileUrl: `/profiles/${profile.id}`
    },
    brand: insightShareBrand
  };
}

export function getInsightShareFilename(data: InsightShareExportData) {
  return `useravaa-insight-${data.insight.slug || data.insight.id}.png`;
}

export async function copyInsightCanonicalUrl(
  data: InsightShareExportData,
  clipboard: ClipboardWriter | undefined = typeof navigator !== "undefined" ? navigator.clipboard : undefined
) {
  if (!clipboard?.writeText) {
    return false;
  }

  await clipboard.writeText(data.insight.canonicalUrl);
  return true;
}

export async function ensureInsightShareFontsLoaded() {
  if (typeof document === "undefined" || !("fonts" in document)) {
    return;
  }

  const fontSet = (document as Document & { fonts: FontFaceSet }).fonts;
  await Promise.all([
    fontSet.load('600 32px "Yekan Bakh"'),
    fontSet.load('800 30px "Manrope"')
  ]);
  await fontSet.ready;
}

function resolveAssetUrl(url: string) {
  if (/^(https?:|data:|blob:)/.test(url) || typeof window === "undefined") {
    return url;
  }

  return new URL(url, window.location.origin).toString();
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Unable to load image: ${src}`));
    image.src = src;
  });
}

function drawRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  const safeRadius = Math.min(radius, width / 2, height / 2);

  ctx.beginPath();
  ctx.moveTo(x + safeRadius, y);
  ctx.lineTo(x + width - safeRadius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + safeRadius);
  ctx.lineTo(x + width, y + height - safeRadius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - safeRadius, y + height);
  ctx.lineTo(x + safeRadius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - safeRadius);
  ctx.lineTo(x, y + safeRadius);
  ctx.quadraticCurveTo(x, y, x + safeRadius, y);
  ctx.closePath();
}

function wrapTextLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let currentLine = "";

  words.forEach((word) => {
    const candidate = currentLine ? `${currentLine} ${word}` : word;

    if (ctx.measureText(candidate).width <= maxWidth || !currentLine) {
      currentLine = candidate;
      return;
    }

    lines.push(currentLine);
    currentLine = word;
  });

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

function drawTextLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number
) {
  const lines = wrapTextLines(ctx, text, maxWidth);

  const visibleLines = lines.slice(0, maxLines);
  visibleLines.forEach((line, index) => {
    const renderedLine = index === maxLines - 1 && lines.length > maxLines ? `${line}…` : line;
    ctx.fillText(renderedLine, x, y + index * lineHeight);
  });

  return visibleLines.length;
}

function getCanvasAnswerTextFit(ctx: CanvasRenderingContext2D, answerText: string, maxWidth: number, maxHeight: number) {
  const renderText = getInsightShareAnswerTextForRender(answerText);
  const base = getInsightShareAnswerTypography(renderText);

  for (let fontSize = base.fontSize; fontSize >= insightShareVisualSpec.answerMinimumFontSize; fontSize -= 2) {
    const lineHeight = Math.round(fontSize * (fontSize <= 32 ? 1.58 : 1.64));
    ctx.font = `${base.fontWeight} ${fontSize}px ${insightShareFontFamily}`;
    const lines = wrapTextLines(ctx, renderText, maxWidth);

    if (lines.length * lineHeight <= maxHeight) {
      return {
        fontSize,
        lineHeight,
        fontWeight: base.fontWeight,
        lines
      };
    }
  }

  const fontSize = insightShareVisualSpec.answerMinimumFontSize;
  const lineHeight = Math.round(fontSize * 1.56);
  ctx.font = `${base.fontWeight} ${fontSize}px ${insightShareFontFamily}`;

  return {
    fontSize,
    lineHeight,
    fontWeight: base.fontWeight,
    lines: wrapTextLines(ctx, renderText, maxWidth)
  };
}

function blobFromCanvas(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
          return;
        }

        reject(new Error("Unable to render insight share image."));
      },
      "image/png",
      0.94
    );
  });
}

async function drawProviderAvatar(ctx: CanvasRenderingContext2D, data: InsightShareExportData, x: number, y: number, size: number) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, size / 2 + 16, 0, Math.PI * 2);
  ctx.strokeStyle = UA_COLORS.line;
  ctx.lineWidth = 8;
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, size / 2 + 5, 0, Math.PI * 2);
  ctx.strokeStyle = UA_COLORS.white;
  ctx.lineWidth = 10;
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();

  const avatarUrl = data.provider.avatarUrl || DEFAULT_AVATAR_SRC;

  try {
    const avatar = await loadImage(resolveAssetUrl(avatarUrl));
    ctx.drawImage(avatar, x, y, size, size);
    ctx.restore();
    return;
  } catch {
    if (avatarUrl !== DEFAULT_AVATAR_SRC) {
      try {
        const fallbackAvatar = await loadImage(resolveAssetUrl(DEFAULT_AVATAR_SRC));
        ctx.drawImage(fallbackAvatar, x, y, size, size);
        ctx.restore();
        return;
      } catch {
        // Fall through to a neutral brand-colored avatar surface.
      }
    }
  }

  ctx.restore();

  ctx.save();
  ctx.fillStyle = UA_COLORS.softTeal;
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

async function drawBrand(ctx: CanvasRenderingContext2D, data: InsightShareExportData) {
  try {
    const logo = await loadImage(resolveAssetUrl(data.brand.logoAssetUrl));
    const targetWidth = insightShareVisualSpec.logoDrawWidth;
    const targetHeight = Math.round(targetWidth * (logo.height / logo.width));

    ctx.drawImage(logo, 1294, 94, targetWidth, targetHeight);
    return;
  } catch {
    return;
  }
}

function drawBackgroundDots(ctx: CanvasRenderingContext2D) {
  ctx.save();
  ctx.fillStyle = UA_COLORS.softBlue;

  for (let row = 0; row < 5; row += 1) {
    for (let col = 0; col < 6; col += 1) {
      ctx.beginPath();
      ctx.arc(122 + col * 24, 112 + row * 23, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

function drawFooterUrl(ctx: CanvasRenderingContext2D, canonicalUrl: string) {
  ctx.save();
  ctx.strokeStyle = UA_COLORS.line;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(118, 760);
  ctx.lineTo(1482, 760);
  ctx.stroke();

  ctx.fillStyle = UA_COLORS.softBlue;
  ctx.beginPath();
  ctx.arc(140, 804, 24, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = UA_COLORS.blue;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(140, 804, 11, 0, Math.PI * 2);
  ctx.moveTo(129, 804);
  ctx.lineTo(151, 804);
  ctx.moveTo(140, 793);
  ctx.quadraticCurveTo(132, 804, 140, 815);
  ctx.moveTo(140, 793);
  ctx.quadraticCurveTo(148, 804, 140, 815);
  ctx.stroke();

  ctx.direction = "ltr";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillStyle = UA_COLORS.muted;
  ctx.font = `600 ${insightShareVisualSpec.footerUrlFontSize}px ${insightShareLatinFontFamily}`;
  ctx.fillText(canonicalUrl.replace(/^https:\/\//, ""), 184, 804);
  ctx.restore();
}

export async function renderInsightShareImage(data: InsightShareExportData) {
  if (typeof document === "undefined") {
    throw new Error("Insight share image rendering requires a browser document.");
  }

  const canvas = document.createElement("canvas");
  canvas.width = insightShareImageDimensions.width;
  canvas.height = insightShareImageDimensions.height;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Canvas rendering context is not available.");
  }

  await ensureInsightShareFontsLoaded();

  const gradient = ctx.createLinearGradient(0, 0, insightShareImageDimensions.width, insightShareImageDimensions.height);
  gradient.addColorStop(0, UA_COLORS.softTeal);
  gradient.addColorStop(0.58, UA_COLORS.white);
  gradient.addColorStop(1, UA_COLORS.softBlue);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, insightShareImageDimensions.width, insightShareImageDimensions.height);

  ctx.save();
  drawRoundedRect(ctx, 54, 56, 1492, 792, 44);
  ctx.fillStyle = UA_COLORS.surface;
  ctx.fill();
  ctx.strokeStyle = UA_COLORS.line;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();

  drawBackgroundDots(ctx);
  await drawBrand(ctx, data);

  ctx.save();
  drawRoundedRect(ctx, 108, 206, 948, 492, 28);
  ctx.fillStyle = UA_COLORS.surface;
  ctx.fill();
  ctx.strokeStyle = UA_COLORS.line;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();

  const pillWidth = Math.min(510, Math.max(300, ctx.measureText(data.insight.promptHeader).width + 92));
  const pillX = 556 - pillWidth / 2;

  ctx.save();
  drawRoundedRect(ctx, pillX, 178, pillWidth, 68, 34);
  ctx.fillStyle = UA_COLORS.softBlue;
  ctx.fill();
  ctx.strokeStyle = UA_COLORS.line;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();

  ctx.direction = "rtl";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = UA_COLORS.blue;
  ctx.font = `700 ${insightShareVisualSpec.promptPillFontSize}px ${insightShareFontFamily}`;
  drawTextLines(ctx, data.insight.promptHeader, 556, 212, pillWidth - 78, 32, 1);

  ctx.fillStyle = UA_COLORS.blue;
  ctx.font = "800 74px Georgia, serif";
  ctx.textAlign = "right";
  ctx.textBaseline = "top";
  ctx.direction = "ltr";
  ctx.fillText("”", 1010, 244);

  ctx.direction = "rtl";
  ctx.textAlign = "right";
  ctx.textBaseline = "top";
  ctx.fillStyle = UA_COLORS.navy;
  const answerFit = getCanvasAnswerTextFit(ctx, data.insight.answerText, 760, 356);
  ctx.font = `${answerFit.fontWeight} ${answerFit.fontSize}px ${insightShareFontFamily}`;
  answerFit.lines.forEach((line, index) => {
    ctx.fillText(line, 968, 314 + index * answerFit.lineHeight);
  });

  ctx.fillStyle = UA_COLORS.blue;
  ctx.font = "800 76px Georgia, serif";
  ctx.textAlign = "left";
  ctx.direction = "ltr";
  ctx.fillText("“", 150, 620);

  const avatarSize = insightShareVisualSpec.providerAvatarSize;
  await drawProviderAvatar(ctx, data, 1192, 196, avatarSize);

  ctx.direction = "rtl";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillStyle = UA_COLORS.navy;
  ctx.font = `800 42px ${insightShareFontFamily}`;
  ctx.fillText(data.provider.name, 1318, 494);
  ctx.fillStyle = UA_COLORS.blue;
  ctx.font = `700 26px ${insightShareFontFamily}`;
  drawTextLines(ctx, data.provider.subtitle, 1318, 558, 310, 40, 2);

  drawFooterUrl(ctx, data.insight.canonicalUrl);

  return blobFromCanvas(canvas);
}

export async function downloadInsightShareImage(
  data: InsightShareExportData,
  renderer: (shareData: InsightShareExportData) => Promise<Blob> = renderInsightShareImage
) {
  if (typeof document === "undefined" || typeof URL === "undefined") {
    throw new Error("Insight share image download requires a browser document.");
  }

  const blob = await renderer(data);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = getInsightShareFilename(data);
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
