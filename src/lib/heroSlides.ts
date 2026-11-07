import type { TreatmentItem } from '../content/site';

export interface ImageNormalizedAnnotation {
  /** Hotspot landmark in normalized image coordinates (0..1 of natural image width/height) */
  hotspotU: number;
  hotspotV: number;
  /** Connector bend point in normalized image coordinates (0..1 of natural image width/height) */
  elbowU: number;
  elbowV: number;
  /** Connector label endpoint in normalized image coordinates (0..1 of natural image width/height) */
  labelU: number;
  labelV: number;
  /** Alignment of the editorial text callout relative to labelU/labelV */
  labelAlign: 'left' | 'right';
}

export interface ObjectPositionPoint {
  /** Normalized horizontal object-position (0..1, e.g. 0.5 = 50%) */
  x: number;
  /** Normalized vertical object-position (0..1, e.g. 0.2 = 20%) */
  y: number;
}

export interface ProtectedFacialZone {
  /** Bounding box in normalized image coordinates (0..100%) for eyes, nose center, and mouth */
  label: 'eyes' | 'eyebrows' | 'lips';
  minU: number;
  maxU: number;
  minV: number;
  maxV: number;
}

export interface PointerCoordinates {
  /** Fine-line circular origin point (percentage 0-100 of hero container) */
  pointX: number;
  pointY: number;
  /** Intermediate elbow point of the thin hairline connector (percentage 0-100) */
  elbowX: number;
  elbowY: number;
  /** Terminal point of the connector where the editorial label sits in negative space (percentage 0-100) */
  endX: number;
  endY: number;
  /** Alignment of the text label relative to endX/endY */
  labelAlign: 'left' | 'right';
}

export interface ComputedSlideAnnotationGeometry {
  viewport: 'desktop' | 'tablet' | 'mobile';
  containerWidth: number;
  containerHeight: number;
  /** Exact pixel coordinates in the displayed hero container */
  hotspotX: number;
  hotspotY: number;
  elbowX: number;
  elbowY: number;
  labelX: number;
  labelY: number;
  /** Percentage coordinates (0..100) in the displayed hero container */
  hotspotPercentX: number;
  hotspotPercentY: number;
  elbowPercentX: number;
  elbowPercentY: number;
  labelPercentX: number;
  labelPercentY: number;
  /** Single continuous SVG <path> d attribute connecting label -> elbow -> hotspot in pixel space */
  svgPathD: string;
  labelAlign: 'left' | 'right';
  /** False on mobile (<640px) or if the landmark is cropped / lacks safe negative space */
  showFacialPointer: boolean;
}

export interface HeroSlideConfig {
  id: string;
  slideNumber: '01' | '02' | '03' | '04';
  eyebrow: string;
  heading: string;
  treatmentSlug: string;
  route: string;
  imageSrc: string;
  fallbackImageSrc?: string;
  imageAlt: string;
  /** Natural pixel dimensions of the source photograph for exact object-fit: cover math */
  imageWidth: number;
  imageHeight: number;
  /** Responsive object-position focal points used by both <img> and annotation projection */
  objectPosition: {
    desktop: ObjectPositionPoint;
    tablet: ObjectPositionPoint;
    mobile: ObjectPositionPoint;
  };
  objectPositionClass: string;
  /** Subtle radial/linear atmospheric vignette to maintain the signature N7 dark brown cinematic mood */
  atmosphereOverlayClass: string;
  /** Image-relative normalized landmark and connector coordinates (0..1) */
  imageAnnotation: ImageNormalizedAnnotation;
  /** Pre-computed reference coordinates at standard desktop (1440x828), tablet (768x660), and mobile (390x660) */
  coordinates: {
    desktop: PointerCoordinates;
    tablet: PointerCoordinates;
    mobile: PointerCoordinates & {
      useTextOnlySafeLabel: boolean;
    };
  };
  /** Protected facial feature zones in normalized image coordinates (0..100%) */
  protectedZones: ProtectedFacialZone[];
}

export const HERO_AUTOPLAY_INTERVAL_MS = 5500;
export const HERO_CROSSFADE_DURATION_SEC = 1.05;
export const HERO_KEN_BURNS_MAX_SCALE = 1.02;

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function resolveHeroViewportBreakpoint(
  containerWidth: number
): 'desktop' | 'tablet' | 'mobile' {
  if (containerWidth < 640) return 'mobile';
  if (containerWidth < 1024) return 'tablet';
  return 'desktop';
}

/**
 * Projects image-relative normalized coordinates (0..1) into the actual displayed
 * hero container pixel & percentage coordinates, accounting for `object-fit: cover`
 * and responsive `object-position`.
 */
export function computeSlideAnnotationGeometry(
  slide: Pick<
    HeroSlideConfig,
    'imageWidth' | 'imageHeight' | 'objectPosition' | 'imageAnnotation'
  >,
  containerWidth: number,
  containerHeight: number
): ComputedSlideAnnotationGeometry {
  const safeW = Math.max(1, containerWidth);
  const safeH = Math.max(1, containerHeight);
  const viewport = resolveHeroViewportBreakpoint(safeW);
  const objPos = slide.objectPosition[viewport];

  // object-fit: cover scale and crop offsets
  const scale = Math.max(safeW / slide.imageWidth, safeH / slide.imageHeight);
  const renderedWidth = slide.imageWidth * scale;
  const renderedHeight = slide.imageHeight * scale;
  const offsetX = (safeW - renderedWidth) * objPos.x;
  const offsetY = (safeH - renderedHeight) * objPos.y;

  const { hotspotU, hotspotV, elbowU, elbowV, labelU, labelAlign } = slide.imageAnnotation;

  const hotspotX = offsetX + hotspotU * renderedWidth;
  const hotspotY = offsetY + hotspotV * renderedHeight;

  const rawElbowX = offsetX + elbowU * renderedWidth;
  const rawElbowY = offsetY + elbowV * renderedHeight;

  // Ensure the elbow remains on the intended side of the hotspot even under extreme aspect ratios
  const minHorizontalLead = Math.max(26, safeW * 0.035);
  const elbowX =
    labelAlign === 'left'
      ? Math.min(rawElbowX, hotspotX - minHorizontalLead)
      : Math.max(rawElbowX, hotspotX + minHorizontalLead);
  const elbowY = rawElbowY;

  const rawLabelX = offsetX + labelU * renderedWidth;
  const minHorizontalSegment = Math.max(36, safeW * 0.045);
  const safeEdgePadding = viewport === 'desktop' ? 195 : 165;

  const labelX =
    labelAlign === 'left'
      ? Math.max(safeEdgePadding, Math.min(rawLabelX, elbowX - minHorizontalSegment))
      : Math.min(safeW - safeEdgePadding, Math.max(rawLabelX, elbowX + minHorizontalSegment));

  // Keep the outer segment strictly horizontal into the label anchor
  const labelY = elbowY;

  const hotspotInBounds =
    hotspotX >= 48 &&
    hotspotX <= safeW - 48 &&
    hotspotY >= 72 &&
    hotspotY <= safeH - 120;

  const hasSafeHorizontalSpace =
    labelAlign === 'left'
      ? hotspotX - safeEdgePadding >= 56
      : safeW - safeEdgePadding - hotspotX >= 56;

  const showFacialPointer =
    viewport !== 'mobile' && hotspotInBounds && hasSafeHorizontalSpace;

  const svgPathD = `M ${round2(labelX)} ${round2(labelY)} L ${round2(elbowX)} ${round2(
    elbowY
  )} L ${round2(hotspotX)} ${round2(hotspotY)}`;

  return {
    viewport,
    containerWidth: safeW,
    containerHeight: safeH,
    hotspotX: round2(hotspotX),
    hotspotY: round2(hotspotY),
    elbowX: round2(elbowX),
    elbowY: round2(elbowY),
    labelX: round2(labelX),
    labelY: round2(labelY),
    hotspotPercentX: round2((hotspotX / safeW) * 100),
    hotspotPercentY: round2((hotspotY / safeH) * 100),
    elbowPercentX: round2((elbowX / safeW) * 100),
    elbowPercentY: round2((elbowY / safeH) * 100),
    labelPercentX: round2((labelX / safeW) * 100),
    labelPercentY: round2((labelY / safeH) * 100),
    svgPathD,
    labelAlign,
    showFacialPointer,
  };
}

function buildResponsiveCoordinates(
  slide: Pick<
    HeroSlideConfig,
    'imageWidth' | 'imageHeight' | 'objectPosition' | 'imageAnnotation'
  >
): HeroSlideConfig['coordinates'] {
  const desktopGeom = computeSlideAnnotationGeometry(slide, 1440, 828);
  const tabletGeom = computeSlideAnnotationGeometry(slide, 768, 660);
  const mobileGeom = computeSlideAnnotationGeometry(slide, 390, 660);

  return {
    desktop: {
      pointX: desktopGeom.hotspotPercentX,
      pointY: desktopGeom.hotspotPercentY,
      elbowX: desktopGeom.elbowPercentX,
      elbowY: desktopGeom.elbowPercentY,
      endX: desktopGeom.labelPercentX,
      endY: desktopGeom.labelPercentY,
      labelAlign: desktopGeom.labelAlign,
    },
    tablet: {
      pointX: tabletGeom.hotspotPercentX,
      pointY: tabletGeom.hotspotPercentY,
      elbowX: tabletGeom.elbowPercentX,
      elbowY: tabletGeom.elbowPercentY,
      endX: tabletGeom.labelPercentX,
      endY: tabletGeom.labelPercentY,
      labelAlign: tabletGeom.labelAlign,
    },
    mobile: {
      pointX: mobileGeom.hotspotPercentX,
      pointY: mobileGeom.hotspotPercentY,
      elbowX: mobileGeom.elbowPercentX,
      elbowY: mobileGeom.elbowPercentY,
      endX: mobileGeom.labelPercentX,
      endY: mobileGeom.labelPercentY,
      labelAlign: mobileGeom.labelAlign,
      useTextOnlySafeLabel: true,
    },
  };
}

const SLIDE_01_BASE = {
  imageWidth: 1672,
  imageHeight: 941,
  objectPosition: {
    desktop: { x: 0.5, y: 0.2 },
    tablet: { x: 0.58, y: 0.5 },
    mobile: { x: 0.64, y: 0.5 },
  },
  // Calibrated to the nasal tip / left nasal sidewall on Warm_Cinematic_Beauty_Portrait (1672x941):
  // Viewer-left eye is at (u=0.490, v=0.382); nasal tip/sidewall is at (u=0.506, v=0.458); lips at (v=0.545).
  imageAnnotation: {
    hotspotU: 0.506,
    hotspotV: 0.458,
    elbowU: 0.442,
    elbowV: 0.436,
    labelU: 0.352,
    labelV: 0.436,
    labelAlign: 'left' as const,
  },
};

const SLIDE_02_BASE = {
  imageWidth: 2121,
  imageHeight: 1414,
  objectPosition: {
    desktop: { x: 0.5, y: 0.22 },
    tablet: { x: 0.5, y: 0.5 },
    mobile: { x: 0.48, y: 0.5 },
  },
  // Calibrated to the malar cheek highlight on slide-02-skin-rejuvenation.jpg (2121x1414)
  imageAnnotation: {
    hotspotU: 0.538,
    hotspotV: 0.435,
    elbowU: 0.635,
    elbowV: 0.405,
    labelU: 0.725,
    labelV: 0.405,
    labelAlign: 'right' as const,
  },
};

const SLIDE_03_BASE = {
  imageWidth: 2200,
  imageHeight: 1467,
  objectPosition: {
    desktop: { x: 0.5, y: 0.18 },
    tablet: { x: 0.5, y: 0.2 },
    mobile: { x: 0.5, y: 0.22 },
  },
  // Calibrated to the anterior hairline temple border on slide-03-hair-restoration.jpg (2200x1467)
  imageAnnotation: {
    hotspotU: 0.585,
    hotspotV: 0.245,
    elbowU: 0.678,
    elbowV: 0.218,
    labelU: 0.755,
    labelV: 0.218,
    labelAlign: 'right' as const,
  },
};

const SLIDE_04_BASE = {
  imageWidth: 2048,
  imageHeight: 1365,
  objectPosition: {
    desktop: { x: 0.5, y: 0.24 },
    tablet: { x: 0.46, y: 0.5 },
    mobile: { x: 0.42, y: 0.5 },
  },
  // Calibrated to the sculpted mandibular jawline on slide-04-facial-contouring.jpg (2048x1365)
  imageAnnotation: {
    hotspotU: 0.415,
    hotspotV: 0.478,
    elbowU: 0.325,
    elbowV: 0.452,
    labelU: 0.235,
    labelV: 0.452,
    labelAlign: 'left' as const,
  },
};

export const HERO_SLIDES: readonly HeroSlideConfig[] = [
  {
    id: 'slide-01-rhinoplasty',
    slideNumber: '01',
    eyebrow: 'FACE · 01',
    heading: 'Rhinoplasty',
    treatmentSlug: 'rhinoplasty',
    route: '/treatments/rhinoplasty',
    imageSrc: '/assets/aistudio/Warm_Cinematic_Beauty_Portrait_b0cb43e0.png',
    fallbackImageSrc: '/media/hero-slides/slide-01-rhinoplasty.png',
    imageAlt:
      'Editorial beauty portrait illustrating natural nasal harmony for Rhinoplasty consultation at N7 Aesthetics',
    ...SLIDE_01_BASE,
    objectPositionClass: 'object-[64%_center] sm:object-[58%_center] lg:object-[center_20%]',
    atmosphereOverlayClass:
      'bg-gradient-to-r from-[#1D1613]/55 via-transparent to-[#1D1613]/30',
    coordinates: buildResponsiveCoordinates(SLIDE_01_BASE),
    protectedZones: [
      { label: 'eyebrows', minU: 46.5, maxU: 63.5, minV: 27.0, maxV: 33.5 },
      { label: 'eyes', minU: 47.0, maxU: 62.5, minV: 34.0, maxV: 40.5 },
      { label: 'lips', minU: 49.0, maxU: 58.5, minV: 52.0, maxV: 60.5 },
    ],
  },
  {
    id: 'slide-02-skin-rejuvenation',
    slideNumber: '02',
    eyebrow: 'SKIN · 02',
    heading: 'Skin Rejuvenation',
    treatmentSlug: 'skin-rejuvenation',
    route: '/treatments/skin-rejuvenation',
    imageSrc: '/media/hero-slides/slide-02-skin-rejuvenation.jpg',
    imageAlt:
      'Editorial beauty portrait with luminous natural skin texture for Skin Rejuvenation at N7 Aesthetics',
    ...SLIDE_02_BASE,
    objectPositionClass: 'object-[48%_center] sm:object-[50%_center] lg:object-[center_22%]',
    atmosphereOverlayClass:
      'bg-gradient-to-r from-[#1D1613]/72 via-[#1D1613]/18 to-[#1D1613]/58',
    coordinates: buildResponsiveCoordinates(SLIDE_02_BASE),
    protectedZones: [
      { label: 'eyebrows', minU: 34.0, maxU: 53.5, minV: 21.0, maxV: 27.0 },
      { label: 'eyes', minU: 34.0, maxU: 52.5, minV: 27.0, maxV: 35.5 },
      { label: 'lips', minU: 35.0, maxU: 46.0, minV: 46.5, maxV: 55.0 },
    ],
  },
  {
    id: 'slide-03-hair-restoration',
    slideNumber: '03',
    eyebrow: 'HAIR · 03',
    heading: 'Hair Restoration',
    treatmentSlug: 'hair-transplant',
    route: '/treatments/hair-transplant',
    imageSrc: '/media/hero-slides/slide-03-hair-restoration.jpg',
    imageAlt:
      'Editorial male portrait with natural hairline density for Hair Restoration consultation at N7 Aesthetics',
    ...SLIDE_03_BASE,
    objectPositionClass: 'object-[center_22%] sm:object-[center_20%] lg:object-[center_18%]',
    atmosphereOverlayClass:
      'bg-gradient-to-r from-[#1D1613]/74 via-[#1D1613]/20 to-[#1D1613]/62',
    coordinates: buildResponsiveCoordinates(SLIDE_03_BASE),
    protectedZones: [
      { label: 'eyebrows', minU: 35.0, maxU: 64.5, minV: 38.0, maxV: 43.0 },
      { label: 'eyes', minU: 36.0, maxU: 64.0, minV: 43.0, maxV: 52.0 },
      { label: 'lips', minU: 41.5, maxU: 58.5, minV: 72.0, maxV: 82.0 },
    ],
  },
  {
    id: 'slide-04-facial-contouring',
    slideNumber: '04',
    eyebrow: 'FACE · 04',
    heading: 'Facial Contouring',
    treatmentSlug: 'body-contouring',
    route: '/treatments/body-contouring',
    imageSrc: '/media/hero-slides/slide-04-facial-contouring.jpg',
    imageAlt:
      'Editorial side-profile beauty portrait highlighting jawline proportion and Facial Contouring at N7 Aesthetics',
    ...SLIDE_04_BASE,
    objectPositionClass: 'object-[42%_center] sm:object-[46%_center] lg:object-[center_24%]',
    atmosphereOverlayClass:
      'bg-gradient-to-r from-[#1D1613]/72 via-[#1D1613]/16 to-[#1D1613]/52',
    coordinates: buildResponsiveCoordinates(SLIDE_04_BASE),
    protectedZones: [
      { label: 'eyebrows', minU: 36.5, maxU: 44.5, minV: 19.0, maxV: 23.5 },
      { label: 'eyes', minU: 36.5, maxU: 43.5, minV: 23.5, maxV: 30.0 },
      { label: 'lips', minU: 32.0, maxU: 37.5, minV: 37.0, maxV: 44.0 },
    ],
  },
];

/**
 * Filters hero slides so ONLY slides whose corresponding treatment has
 * `approvalStatus === 'approved_by_clinic'` are displayed publicly.
 * Draft-only treatments (`draft_pending_clinic_approval`) are never shown publicly.
 */
export function getApprovedHeroSlides(
  slides: readonly HeroSlideConfig[],
  treatments: readonly Pick<TreatmentItem, 'slug' | 'approvalStatus'>[]
): HeroSlideConfig[] {
  const approvedSlugs = new Set(
    treatments
      .filter((t) => t.approvalStatus === 'approved_by_clinic')
      .map((t) => t.slug)
  );

  return slides.filter(
    (slide) => approvedSlugs.has(slide.treatmentSlug) && Boolean(slide.imageSrc)
  );
}

/**
 * Verifies that a slide's image-normalized hotspot, elbow, and label anchor do not fall inside
 * any protected facial zone (eyebrows, eyes, or lips), and that the connector line segment
 * does not cross through the eyes.
 */
export function isSlidePointerClearOfFacialFeatures(
  slide: HeroSlideConfig,
  _viewport?: 'desktop' | 'tablet'
): boolean {
  const uHotspot = slide.imageAnnotation.hotspotU * 100;
  const vHotspot = slide.imageAnnotation.hotspotV * 100;
  const uElbow = slide.imageAnnotation.elbowU * 100;
  const vElbow = slide.imageAnnotation.elbowV * 100;
  const uLabel = slide.imageAnnotation.labelU * 100;
  const vLabel = slide.imageAnnotation.labelV * 100;

  for (const zone of slide.protectedZones) {
    const hotspotInside =
      uHotspot >= zone.minU &&
      uHotspot <= zone.maxU &&
      vHotspot >= zone.minV &&
      vHotspot <= zone.maxV;
    const elbowInside =
      uElbow >= zone.minU &&
      uElbow <= zone.maxU &&
      vElbow >= zone.minV &&
      vElbow <= zone.maxV;
    const labelInside =
      uLabel >= zone.minU &&
      uLabel <= zone.maxU &&
      vLabel >= zone.minV &&
      vLabel <= zone.maxV;

    if (hotspotInside || elbowInside || labelInside) {
      return false;
    }

    // Also verify the connector segments do not pass through the eyes zone
    if (zone.label === 'eyes') {
      for (let t = 0; t <= 1; t += 0.05) {
        const seg1U = uLabel + (uElbow - uLabel) * t;
        const seg1V = vLabel + (vElbow - vLabel) * t;
        const seg2U = uElbow + (uHotspot - uElbow) * t;
        const seg2V = vElbow + (vHotspot - vElbow) * t;
        if (
          (seg1U >= zone.minU && seg1U <= zone.maxU && seg1V >= zone.minV && seg1V <= zone.maxV) ||
          (seg2U >= zone.minU && seg2U <= zone.maxU && seg2V >= zone.minV && seg2V <= zone.maxV)
        ) {
          return false;
        }
      }
    }
  }
  return true;
}
