# N7 Aesthetics — Media & Asset Placement Guide

Place approved production photography in `/public/media/` using the filenames below. All components automatically detect real photography and fall back gracefully to editorial placeholders when a photo is not yet provided.

## 1. Brand Logos (`/public/brand/` & `/public/assets/aistudio/`)
- **Light Logo (Navbar & Dark Footer)**: `/public/brand/n7-logo-light.svg` (also at `/public/assets/aistudio/n7-logo-light_2d8a2545.svg`)
- **Gold Logo (Accents & Badges)**: `/public/brand/n7-logo-gold.svg` (also at `/public/assets/aistudio/n7-logo-gold_896ba13f.svg`)
- **Dark Logo (Light Surfaces)**: `/public/brand/n7-logo-dark.svg` (also at `/public/assets/aistudio/n7-logo-dark_2d8a2545.svg`)
- **Hero Gradient Overlay**: `/public/assets/aistudio/hero-overlay_caba4264.svg`

## 2. Hero & Doctor Photography (`/public/media/`)
- **Hero Portrait (Right Side of 90vh Hero)**:
  - Currently using illustrative local asset: `/public/media/hero-portrait.svg`
  - When replacing with a licensed studio beauty portrait: save as `/public/media/hero-portrait.jpg` (or `.webp`, recommended `1200x1400px` portrait orientation) and update `hero.portraitImage` in `src/content/site.ts`.
- **Dr. Navjot Singh Official Portrait**:
  - Reserved path: `/public/media/doctor-portrait.jpg` (currently an empty placeholder file as required until an approved photo is supplied).
  - Recommended dimensions: `900x1100px` (4:5 or 3:4 vertical portrait). Once a valid non-empty `.jpg` image is placed at `/public/media/doctor-portrait.jpg`, the arched portrait frame in "Meet Dr. Navjot Singh" and `/doctor` will automatically display the photograph instead of the reserved placeholder state.

## 3. Signature Treatment Cards (`/public/media/`)
- **Hair Transplant**: `/public/media/treatment-hair-transplant.svg` (replace with `/public/media/treatment-hair-transplant.jpg`, `800x960px`)
- **Rhinoplasty**: `/public/media/treatment-rhinoplasty.svg` (replace with `/public/media/treatment-rhinoplasty.jpg`, `800x960px`)
- **Gynecomastia Correction**: `/public/media/treatment-gynecomastia.svg` (replace with `/public/media/treatment-gynecomastia.jpg`, `800x960px`)
- **Body Contouring**: `/public/media/treatment-body-contouring.svg` (replace with `/public/media/treatment-body-contouring.jpg`, `800x960px`)
- **Skin Rejuvenation**: `/public/media/treatment-skin-rejuvenation.svg` (replace with `/public/media/treatment-skin-rejuvenation.jpg`, `800x960px`)

## 4. Consented Clinical Results (`/public/media/results/`)
- Never upload stock or unconsented before/after images here.
- Once documented patient consent is obtained, place standardised clinical photographs in `/public/media/results/` and add the verified entry to `resultsGallery.approvedCases` in `src/content/site.ts`.
