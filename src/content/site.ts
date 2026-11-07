export type VerificationStatus = 'confirmed_core_focus' | 'unconfirmed_requires_clinic_verification';
export type ApprovalStatus = 'draft_pending_clinic_approval' | 'approved_by_clinic';

export interface HeroCategoryItem {
  id: string;
  label: string;
  slug: string;
  featuredProcedure: string;
  iconKey: 'facial' | 'hair' | 'body' | 'breast' | 'reconstructive';
  verificationStatus: VerificationStatus;
}

export interface TrustValueItem {
  id: string;
  title: string;
  subtitle: string;
  iconKey: 'surgeon' | 'shield' | 'plan' | 'lotus';
}

export interface TreatmentItem {
  slug: string;
  title: string;
  shortTitle: string;
  category: 'Facial Aesthetics' | 'Hair Restoration' | 'Body Contouring' | 'Aesthetic Dermatology' | 'Surgical Procedures';
  isSignature: boolean;
  approvalStatus: ApprovalStatus;
  verificationStatus: VerificationStatus;
  verificationNote?: string;
  cardImage: string;
  imageAlt: string;
  isIllustrativeAsset: true;
  summary: string;
  overview: string;
  consultationFocus: string[];
  candidacyConsiderations: string[];
  recoveryOverview: string;
  faqs: Array<{
    question: string;
    answer: string;
  }>;
}

export interface WhyChooseUsItem {
  number: string;
  title: string;
  description: string;
}

export interface ConsentedResultCase {
  id: string;
  treatmentSlug: string;
  treatmentTitle: string;
  beforeImage: string;
  afterImage: string;
  clinicalNotes: string;
  consentReference?: string;
  consentVerified: boolean;
  published?: boolean;
}

export interface ConsentedTestimonial {
  id: string;
  quote: string;
  patientIdentifier: string;
  procedureContext?: string;
  consentVerified: boolean;
  published?: boolean;
}

export interface BlogArticleShell {
  slug: string;
  title: string;
  category: string;
  status: 'editorial_guide' | 'awaiting_clinical_signoff';
  excerpt: string;
  readingTime: string;
  seoTitle?: string;
  seoDescription?: string;
  published?: boolean;
  keyTakeaways: string[];
}

export interface VerificationChecklistItem {
  id: string;
  category: 'Doctor Credentials' | 'Clinical Services' | 'Contact & Location' | 'Visual Media & Consent' | 'Legal & Compliance';
  item: string;
  currentPlaceholderState: string;
  requiredActionBeforeLaunch: string;
}

export interface SiteContent {
  brand: {
    name: string;
    eyebrow: string;
    specialtiesHeaderLine: string[];
    logos: {
      light: string;
      gold: string;
      dark: string;
      heroOverlay: string;
    };
  };
  bookingConfig: {
    isLiveIntegrationConfigured: boolean;
    endpoint: string;
    demoNoticeTitle: string;
    demoNoticeBody: string;
  };
  navigation: Array<{
    label: string;
    href: string;
    hasDropdown?: boolean;
  }>;
  hero: {
    eyebrow: string;
    headlineLine1: string;
    headlineItalicLine2: string;
    description: string;
    primaryCta: {
      label: string;
      href: string;
    };
    secondaryCta: {
      label: string;
      href: string;
    };
    portraitImage: string;
    portraitAlt: string;
    isIllustrativePortrait: true;
    defaultFloatingCard: {
      label: string;
      procedureName: string;
      href: string;
    };
    miniCategories: HeroCategoryItem[];
  };
  trustStrip: TrustValueItem[];
  doctor: {
    name: string;
    roleTitle: string;
    roleVerificationNote: string;
    portraitPath: string;
    portraitPlaceholderNote: string;
    shortIntro: string;
    extendedBio: string[];
    philosophyPoints: Array<{
      title: string;
      detail: string;
    }>;
    unverifiedCredentialsNotice: string;
    verificationFields: Array<{
      label: string;
      value: string;
      verified: boolean;
    }>;
  };
  treatments: TreatmentItem[];
  whyChooseUs: {
    eyebrow: string;
    heading: string;
    intro: string;
    items: WhyChooseUsItem[];
  };
  resultsGallery: {
    eyebrow: string;
    heading: string;
    ethicalPolicyNote: string;
    consentAndCmsExplanation: string;
    placeholderBadgeText: string;
    approvedCases: ConsentedResultCase[];
    placeholderCategories: Array<{
      slug: string;
      title: string;
      description: string;
    }>;
  };
  testimonialsSection: {
    eyebrow: string;
    heading: string;
    emptyStateTitle: string;
    emptyStateBody: string;
    emptyStateSubtext: string;
    consentExplanation: string;
    consentedTestimonials: ConsentedTestimonial[];
  };
  contact: {
    verificationBanner: string;
    phonePlaceholder: string;
    whatsappPlaceholder: string;
    isPhoneConfirmed: boolean;
    emailPlaceholder: string;
    addressPlaceholder: string;
    hoursPlaceholder: string;
    instagramUrlPlaceholder: string;
    instagramHandlePlaceholder: string;
  };
  resourcesBlog: {
    eyebrow: string;
    heading: string;
    intro: string;
    articles: BlogArticleShell[];
  };
  verificationChecklist: VerificationChecklistItem[];
}

export const siteContent: SiteContent = {
  brand: {
    name: 'N7 Aesthetics',
    eyebrow: 'N7 AESTHETICS',
    specialtiesHeaderLine: ['Plastic Surgery', 'Hair Restoration', 'Aesthetic Treatments'],
    logos: {
      light: '/assets/aistudio/n7-logo-light_2d8a2545.svg',
      gold: '/assets/aistudio/n7-logo-gold_896ba13f.svg',
      dark: '/assets/aistudio/n7-logo-dark_2f41ecd6.svg',
      heroOverlay: '/assets/aistudio/hero-overlay_caba4264.svg',
    },
  },
  bookingConfig: {
    isLiveIntegrationConfigured: false,
    endpoint: '/api/appointments',
    demoNoticeTitle: 'Demo Mode — Booking Integration Being Configured',
    demoNoticeBody:
      'Your consultation request passed validation. Live booking is not yet enabled. No enquiry has been sent or appointment booked.',
  },
  navigation: [
    { label: 'Home', href: '/' },
    { label: 'About', href: '/about' },
    { label: 'Treatments', href: '/treatments', hasDropdown: true },
    { label: 'Results', href: '/results' },
    { label: 'Resources', href: '/blog' },
    { label: 'Contact', href: '/contact' },
  ],
  hero: {
    eyebrow: 'N7 AESTHETICS',
    headlineLine1: 'Natural',
    headlineItalicLine2: 'Proportion',
    description:
      'A private atelier for those who seek subtlety — not transformation.',
    primaryCta: {
      label: 'Book Consultation',
      href: '/contact#book-consultation',
    },
    secondaryCta: {
      label: 'View Procedures',
      href: '/treatments',
    },
    portraitImage:
      '/assets/aistudio/Warm_Cinematic_Beauty_Portrait_b0cb43e0.png',
    portraitAlt:
      'Warm cinematic beauty portrait for N7 Aesthetics',
    isIllustrativePortrait: true,
    defaultFloatingCard: {
      label: 'Face',
      procedureName: 'Rhinoplasty',
      href: '/treatments/rhinoplasty',
    },
    miniCategories: [
      {
        id: 'facial-aesthetics',
        label: 'Facial Aesthetics',
        slug: 'rhinoplasty',
        featuredProcedure: 'Rhinoplasty',
        iconKey: 'facial',
        verificationStatus: 'confirmed_core_focus',
      },
      {
        id: 'hair-transplant',
        label: 'Hair Transplant',
        slug: 'hair-transplant',
        featuredProcedure: 'Hair Transplant',
        iconKey: 'hair',
        verificationStatus: 'confirmed_core_focus',
      },
      {
        id: 'body-contouring',
        label: 'Body Contouring',
        slug: 'body-contouring',
        featuredProcedure: 'Body Contouring',
        iconKey: 'body',
        verificationStatus: 'confirmed_core_focus',
      },
      {
        id: 'breast-procedures',
        label: 'Breast Procedures',
        slug: 'gynecomastia-correction',
        featuredProcedure: 'Gynecomastia Correction',
        iconKey: 'breast',
        verificationStatus: 'unconfirmed_requires_clinic_verification',
      },
      {
        id: 'reconstructive-surgery',
        label: 'Reconstructive Surgery',
        slug: 'reconstructive-consultation',
        featuredProcedure: 'Reconstructive Surgery',
        iconKey: 'reconstructive',
        verificationStatus: 'unconfirmed_requires_clinic_verification',
      },
    ],
  },
  trustStrip: [
    {
      id: 'surgeon-led',
      title: 'Surgeon-Led Consultations',
      subtitle: 'Individual Clinical Evaluation',
      iconKey: 'surgeon',
    },
    {
      id: 'safe-techniques',
      title: 'Advanced & Safe',
      subtitle: 'Techniques',
      iconKey: 'shield',
    },
    {
      id: 'personalised-plans',
      title: 'Personalised',
      subtitle: 'Treatment Plans',
      iconKey: 'plan',
    },
    {
      id: 'natural-results',
      title: 'Natural & Refined',
      subtitle: 'Aesthetic Approach',
      iconKey: 'lotus',
    },
  ],
  doctor: {
    name: 'Dr. Navjot Singh',
    roleTitle: 'Plastic & Cosmetic Surgeon',
    roleVerificationNote: 'Specialty description & formal credentials pending clinic confirmation',
    portraitPath: '/images/dr-navjot-singh-premium.png',
    portraitPlaceholderNote:
      'Official portrait of Dr. Navjot Singh for N7 Aesthetics.',
    shortIntro:
      'Associated with N7 Aesthetics for plastic and cosmetic surgery consultations, with a focus on patient safety, individual anatomy and personalised treatment planning.',
    extendedBio: [
      'Dr. Navjot Singh is associated with N7 Aesthetics, where consultations centre on individual anatomy, realistic expectations, and transparent clinical guidance.',
      'Rather than offering standardised packages or unverified claims, each consultation is conducted as a structured one-on-one evaluation. Surgical and non-surgical options are discussed openly alongside recovery timelines and clinical suitability.',
      'All formal academic degrees, medical council registration details, and hospital appointments are held in draft verification status until confirmed directly by the clinic.',
    ],
    philosophyPoints: [
      {
        title: 'Anatomical Proportion Over Trends',
        detail:
          'Treatment planning prioritises natural facial and body harmony suited to the individual rather than exaggerated changes.',
      },
      {
        title: 'Transparent Risk & Recovery Dialogue',
        detail:
          'Consultations cover candidacy, procedural steps, expected healing stages, and clinical limitations before any decision is made.',
      },
      {
        title: 'Ethical Medical Communication',
        detail:
          'Zero invented statistics, zero fabricated reviews, and strict adherence to documented patient consent for all clinical media.',
      },
    ],
    unverifiedCredentialsNotice:
      'Doctor name (Dr. Navjot Singh) is verified. Specific degrees, registration numbers, years of experience, and hospital affiliations are pending clinic confirmation.',
    verificationFields: [
      {
        label: 'Verified Name',
        value: 'Dr. Navjot Singh',
        verified: true,
      },
      {
        label: 'Specialty Description',
        value: 'Plastic & Cosmetic Surgery (Pending Clinic Confirmation)',
        verified: false,
      },
      {
        label: 'Degrees & Registration Number',
        value: 'Awaiting Official Clinic Sign-Off',
        verified: false,
      },
    ],
  },
  treatments: [
    {
      slug: 'hair-transplant',
      title: 'Hair Transplant',
      shortTitle: 'Hair Transplant',
      category: 'Hair Restoration',
      isSignature: true,
      approvalStatus: 'draft_pending_clinic_approval',
      verificationStatus: 'confirmed_core_focus',
      cardImage:
        '/assets/aistudio/8FK6v_tEi3eMvKGVWR3WMgpyDNLf6VWzPIpjcGDk_JipouMhKymEyBEK3bayWd61CJ2s39RtQZKgvNT9eXxnbR9AuHyYXBm3pDT3kFTMO5IcwBRbYlN2NxcC0t6mxtE6yb1U_JzdmIqxPS8cTTZ1qVl3fa8eGoRGr6D4ASIB6J9oqYee4t4a2qcBiuVn8mfb_77244af0.jpg',
      imageAlt: 'Pre-procedure hairline design marking for hair transplant consultation (illustrative asset)',
      isIllustrativeAsset: true,
      summary:
        'Draft service overview: Individualised hairline planning and follicular restoration focused on natural direction, density distribution, and donor preservation.',
      overview:
        'Hair restoration consultations evaluate hair loss pattern, donor area quality, scalp health, and long-term progression. All specific surgical techniques (such as FUE/DHI protocols) are in draft status pending final clinic approval.',
      consultationFocus: [
        'Assessment of donor hair calibre, density, and long-term sustainability',
        'Age-appropriate hairline design tailored to facial proportions',
        'Discussion of supportive medical care alongside surgical restoration',
      ],
      candidacyConsiderations: [
        'Adults with patterned hair loss and adequate healthy donor supply',
        'Realistic expectations regarding progressive graft maturation',
        'In-person scalp and medical evaluation required',
      ],
      recoveryOverview:
        'Post-procedure care involves gentle washing protocols, temporary scabbing resolution, and scheduled follow-up reviews.',
      faqs: [
        {
          question: 'How is a natural hairline planned?',
          answer:
            'Hairline planning accounts for forehead landmarks, facial proportions, natural temple angles, and soft anterior transition zones.',
        },
      ],
    },
    {
      slug: 'rhinoplasty',
      title: 'Rhinoplasty',
      shortTitle: 'Rhinoplasty',
      category: 'Facial Aesthetics',
      isSignature: true,
      approvalStatus: 'draft_pending_clinic_approval',
      verificationStatus: 'confirmed_core_focus',
      cardImage:
        '/assets/aistudio/HYXaJIOuTeFoptEJwejKPyHC-6cV7t14B0UBgJJSPkG9XB6HSsR8Pn7-XTD7mw7TJjv-3E622YIR8OT9SzNTBUijGMWYYQYa8xmJW3to5_8vn5QcCS5nI2UvWBevDK5HUcWcv-MtIwDtasisVlaedHmbtstcoTOXC3AlEE99M5vyj1-0McNT-8BzaBLgtrrs_a9c1bf80.jpg',
      imageAlt: 'Lateral facial profile portrait representing rhinoplasty and nasal harmony (illustrative asset)',
      isIllustrativeAsset: true,
      summary:
        'Draft service overview: Structural and aesthetic nasal refinement designed to bring balanced proportion to the facial profile while respecting nasal function.',
      overview:
        'Rhinoplasty consultations evaluate dorsal profile contours, nasal tip support, skin envelope thickness, and nasal airway function. Specific surgical protocols are in draft status and must be approved by the clinic before launch.',
      consultationFocus: [
        'Evaluation of nasal bridge, tip support, skin thickness, and facial profile balance',
        'Assessment of nasal breathing and septal anatomy',
        'Transparent discussion of gradual swelling resolution and anatomical boundaries',
      ],
      candidacyConsiderations: [
        'Individuals with completed facial growth seeking structural or proportional nasal refinement',
        'Realistic expectations regarding gradual tissue settling over months',
        'Comprehensive pre-operative medical clearance',
      ],
      recoveryOverview:
        'Initial nasal splinting and early swelling subside over the first weeks, while subtle tip definition continues to refine progressively.',
      faqs: [
        {
          question: 'Does rhinoplasty evaluation include nasal breathing?',
          answer:
            'Yes. Structural support and airway function are evaluated alongside external profile harmony.',
        },
      ],
    },
    {
      slug: 'gynecomastia-correction',
      title: 'Gynecomastia Correction',
      shortTitle: 'Gynecomastia Correction',
      category: 'Body Contouring',
      isSignature: true,
      approvalStatus: 'draft_pending_clinic_approval',
      verificationStatus: 'confirmed_core_focus',
      cardImage: '/media/treatment-gynecomastia.jpg',
      imageAlt: 'Editorial studio chest contour photograph for gynecomastia correction',
      isIllustrativeAsset: true,
      summary:
        'Draft service overview: Male chest contouring combining targeted glandular evaluation and proportion-focused sculpting for a flatter chest profile.',
      overview:
        'Gynecomastia correction addresses benign enlargement of male breast glandular tissue and surrounding contour. Service copy is in draft status pending clinic sign-off.',
      consultationFocus: [
        'Clinical examination of glandular tissue versus adipose fullness',
        'Evaluation of skin elasticity and chest wall symmetry',
        'Discussion of incision placement, compression garment wear, and recovery',
      ],
      candidacyConsiderations: [
        'Men with persistent chest fullness seeking surgical contour refinement',
        'Stable weight and good general medical health',
      ],
      recoveryOverview:
        'Supportive compression garment wear assists skin redraping during initial healing, with staged return to physical exercise.',
      faqs: [
        {
          question: 'Why is an in-person exam required for gynecomastia?',
          answer:
            'Physical examination distinguishes firm sub-areolar glandular tissue from fatty tissue to plan appropriate correction.',
        },
      ],
    },
    {
      slug: 'body-contouring',
      title: 'Body Contouring',
      shortTitle: 'Body Contouring',
      category: 'Body Contouring',
      isSignature: true,
      approvalStatus: 'draft_pending_clinic_approval',
      verificationStatus: 'confirmed_core_focus',
      cardImage: '/media/treatment-body-contouring.jpg',
      imageAlt: 'Editorial studio waistline proportion photograph for body contouring',
      isIllustrativeAsset: true,
      summary:
        'Draft service overview: Targeted sculpting and soft-tissue refinement designed to address localized fullness or skin laxity.',
      overview:
        'Body contouring procedures are planned around skin tone, muscular wall integrity, and stable baseline weight. Draft service details require clinic confirmation prior to launch.',
      consultationFocus: [
        'Distinguishing between localized fat deposits and skin laxity',
        'Evaluating skin recoil quality and natural anatomical transitions',
        'Clarifying that contouring refines shape rather than acting as weight loss',
      ],
      candidacyConsiderations: [
        'Individuals near a stable weight with localized contour concerns',
        'Clear understanding of scar placement, compression garments, and recovery',
      ],
      recoveryOverview:
        'Recovery timelines depend on the specific anatomical zones treated and are reviewed in detail during consultation.',
      faqs: [
        {
          question: 'Is body contouring a weight-loss procedure?',
          answer:
            'No. It is designed to refine localized proportions in patients who are already near a stable weight.',
        },
      ],
    },
    {
      slug: 'skin-rejuvenation',
      title: 'Skin Rejuvenation',
      shortTitle: 'Skin Rejuvenation',
      category: 'Aesthetic Dermatology',
      isSignature: true,
      approvalStatus: 'draft_pending_clinic_approval',
      verificationStatus: 'unconfirmed_requires_clinic_verification',
      verificationNote:
        'Draft service: Exact non-surgical modalities, lasers, peel protocols, and injectables require clinic approval before launch.',
      cardImage: '/media/treatment-skin-rejuvenation.jpg',
      imageAlt: 'Editorial close-up luminous facial skin portrait for skin rejuvenation',
      isIllustrativeAsset: true,
      summary:
        'Draft service overview: Medically guided facial rejuvenation focused on skin texture, tone, barrier health, and understated refreshment.',
      overview:
        'Non-surgical skin rejuvenation prioritises skin quality and natural expression. Exact in-clinic devices and protocols must be verified and approved by the clinic before publication.',
      consultationFocus: [
        'Evaluation of skin texture, pigmentation, barrier health, and photoageing',
        'Selection of evidence-based topical or procedural modalities',
      ],
      candidacyConsiderations: [
        'Assessed individually according to skin type and clinical goals',
      ],
      recoveryOverview:
        'Varies according to the specific clinical modality confirmed during consultation.',
      faqs: [
        {
          question: 'How are skin rejuvenation protocols chosen?',
          answer:
            'Protocols are selected only after an in-person clinical skin assessment.',
        },
      ],
    },
    {
      slug: 'reconstructive-consultation',
      title: 'Reconstructive Surgery Assessment',
      shortTitle: 'Reconstructive Surgery',
      category: 'Surgical Procedures',
      isSignature: false,
      approvalStatus: 'draft_pending_clinic_approval',
      verificationStatus: 'unconfirmed_requires_clinic_verification',
      verificationNote:
        'Draft service: Reconstructive and scar-revision scope requires clinic approval before launch.',
      cardImage:
        '/assets/aistudio/HYXaJIOuTeFoptEJwejKPyHC-6cV7t14B0UBgJJSPkG9XB6HSsR8Pn7-XTD7mw7TJjv-3E622YIR8OT9SzNTBUijGMWYYQYa8xmJW3to5_8vn5QcCS5nI2UvWBevDK5HUcWcv-MtIwDtasisVlaedHmbtstcoTOXC3AlEE99M5vyj1-0McNT-8BzaBLgtrrs_a9c1bf80.jpg',
      imageAlt: 'Illustrative profile graphic for reconstructive consultation',
      isIllustrativeAsset: true,
      summary:
        'Draft service overview: Individualised surgical assessment for scar revision, post-trauma restoration, or secondary aesthetic concerns.',
      overview:
        'Reconstructive evaluations focus on tissue coverage, scar maturation, and functional comfort. Scope is subject to clinic confirmation.',
      consultationFocus: [
        'Review of prior surgical or injury history and tissue healing',
        'Evaluation of functional and structural considerations',
      ],
      candidacyConsiderations: ['Determined strictly through in-person surgical examination'],
      recoveryOverview: 'Planned individually according to tissue reconstruction scope.',
      faqs: [],
    },
  ],
  whyChooseUs: {
    eyebrow: 'CLINICAL ETHOS',
    heading: 'Why Patients Choose N7 Aesthetics',
    intro:
      'Every stage of care is designed around clinical integrity, unhurried consultation, and respect for individual anatomy.',
    items: [
      {
        number: '01',
        title: 'Patient-Centred Care',
        description:
          'We listen first. Your goals, comfort, and questions guide the consultation without rushed decisions.',
      },
      {
        number: '02',
        title: 'Comprehensive Consultation',
        description:
          'Each appointment provides a structured anatomical evaluation and clear comparison of surgical and non-surgical options.',
      },
      {
        number: '03',
        title: 'Precision Surgical Planning',
        description:
          'Procedures are planned around balanced facial and body proportions, aiming for refined outcomes that look naturally yours.',
      },
      {
        number: '04',
        title: 'Ethical, Safety-Focused Communication',
        description:
          'We discuss suitability, recovery timelines, limitations, and clinical risks transparently before any treatment is scheduled.',
      },
    ],
  },
  resultsGallery: {
    eyebrow: 'CLINICAL OUTCOMES ARCHIVE',
    heading: 'Real Patient Results',
    ethicalPolicyNote:
      'N7 Aesthetics never displays fabricated before/after pairs, retouched previews, or stock imagery as clinical outcomes. This gallery is built as a consent-verified archive shell.',
    consentAndCmsExplanation:
      'How Image Consent & Content Management Works: Clinical photographs are published exclusively when (1) written, procedure-specific patient consent is documented on file, (2) pre- and post-procedure photographs are captured under standardised, unaltered clinical lighting, and (3) an authorised clinic administrator verifies the consent reference ID in the /admin portal.',
    placeholderBadgeText: 'Approved patient photos coming soon',
    approvedCases: [],
    placeholderCategories: [
      {
        slug: 'rhinoplasty',
        title: 'Rhinoplasty Case Archive',
        description:
          'Reserved for unaltered lateral and three-quarter clinical photographs once documented patient consent is verified in /admin.',
      },
      {
        slug: 'hair-transplant',
        title: 'Hair Restoration Archive',
        description:
          'Reserved for pre-procedure hairline design and matured growth photographs upon patient consent verification.',
      },
      {
        slug: 'gynecomastia-correction',
        title: 'Chest Contouring Archive',
        description:
          'Reserved for standardised pre- and post-operative chest contour comparisons with verified consent.',
      },
      {
        slug: 'body-contouring',
        title: 'Body Contouring Archive',
        description:
          'Reserved for consented clinical outcome series with documented follow-up intervals.',
      },
    ],
  },
  testimonialsSection: {
    eyebrow: 'AUTHENTIC PATIENT REFLECTIONS',
    heading: 'What Our Patients Say',
    emptyStateTitle: 'Authenticated Patient Reviews Pending Consent Verification',
    emptyStateBody:
      'We do not publish fictional reviews, anonymous star ratings, or unverified quotes. This testimonial showcase will populate only when authenticated, consented patient reflections are approved by the clinic.',
    emptyStateSubtext: 'Zero Fabricated Testimonials · Managed via /admin Consent Workflow',
    consentExplanation:
      'Editorial Review Policy: Every testimonial published on N7 Aesthetics must be linked to a real, consented patient record and approved by an administrator or editor in /admin.',
    consentedTestimonials: [],
  },
  contact: {
    verificationBanner:
      'Clinic telephone, WhatsApp number, street address, and reception email below are editable placeholders pending official confirmation from N7 Aesthetics.',
    phonePlaceholder: '[Clinic Phone — Pending Confirmation]',
    whatsappPlaceholder: '[WhatsApp Number — Pending Confirmation]',
    isPhoneConfirmed: false,
    emailPlaceholder: '[appointments@n7aesthetics.example — Pending Confirmation]',
    addressPlaceholder: '[Clinic Suite & Street Address — Pending Confirmation]',
    hoursPlaceholder: 'By Prior Appointment (Hours Pending Clinic Confirmation)',
    instagramUrlPlaceholder: 'https://instagram.com',
    instagramHandlePlaceholder: '@n7aesthetics (Pending Confirmation)',
  },
  resourcesBlog: {
    eyebrow: 'PATIENT EDUCATION',
    heading: 'Clinical Guides & Aesthetic Resources',
    intro:
      'Draft educational overviews prepared for clinic review to help prospective patients understand consultation preparation, anatomical planning, and recovery principles.',
    articles: [
      {
        slug: 'preparing-for-aesthetic-consultation',
        title: 'How to Prepare for Your First Plastic Surgery Consultation',
        category: 'Consultation Guide',
        status: 'awaiting_clinical_signoff',
        excerpt:
          'What questions to bring, how anatomical assessment works, and why honest communication about goals and recovery timelines matters.',
        readingTime: '4 min read',
        seoTitle: 'Preparing for a Plastic Surgery Consultation | N7 Aesthetics',
        seoDescription:
          'Learn how to prepare for your aesthetic consultation with Dr. Navjot Singh at N7 Aesthetics.',
        published: true,
        keyTakeaways: [
          'Focus on anatomical proportion rather than replicating another person’s features.',
          'Plan your schedule around realistic post-procedure recovery and follow-up visits.',
          'Ask clear questions about surgical alternatives, incisions, and expected healing phases.',
        ],
      },
      {
        slug: 'understanding-rhinoplasty-healing',
        title: 'Understanding Structural Rhinoplasty & Gradual Tissue Settling',
        category: 'Facial Aesthetics',
        status: 'awaiting_clinical_signoff',
        excerpt:
          'An overview of how nasal cartilage support, skin envelope thickness, and healing stages influence long-term nasal refinement.',
        readingTime: '5 min read',
        seoTitle: 'Understanding Rhinoplasty Healing Stages | N7 Aesthetics',
        seoDescription:
          'Educational guide to structural rhinoplasty planning and gradual soft-tissue refinement.',
        published: true,
        keyTakeaways: [
          'Nasal harmony is evaluated in relation to the forehead, eyes, lips, and chin profile.',
          'Breathing function and structural support are inseparable from aesthetic refinement.',
          'Subtle nasal tip refinement matures progressively over several months.',
        ],
      },
      {
        slug: 'hairline-design-principles',
        title: 'Principles of Natural Hairline Design in Hair Restoration',
        category: 'Hair Restoration',
        status: 'awaiting_clinical_signoff',
        excerpt:
          'Why follicular angle, transition-zone micro-irregularity, and donor stewardship define a natural-looking hair transplant.',
        readingTime: '4 min read',
        seoTitle: 'Natural Hairline Design Principles | N7 Aesthetics',
        seoDescription:
          'How hairline architecture, follicular angle, and donor stewardship guide hair restoration.',
        published: true,
        keyTakeaways: [
          'A natural hairline uses softer single-hair grafts at the anterior border and denser groupings behind.',
          'Long-term planning preserves donor supply and accounts for future hair patterns.',
          'Clinical consultation evaluates both surgical candidacy and supportive medical care.',
        ],
      },
    ],
  },
  verificationChecklist: [
    {
      id: 'verify-doctor-credentials',
      category: 'Doctor Credentials',
      item: 'Dr. Navjot Singh qualifications, degrees (MBBS/MS/MCh), and Medical Council Registration Number',
      currentPlaceholderState: 'Marked as "Plastic & Cosmetic Surgery (Pending Clinic Confirmation)" with zero invented years or counts',
      requiredActionBeforeLaunch: 'Verify official registration certificate and update via /admin -> Doctor & Site Settings',
    },
    {
      id: 'verify-doctor-portrait',
      category: 'Visual Media & Consent',
      item: 'Official clinic portrait photograph of Dr. Navjot Singh',
      currentPlaceholderState: 'Using illustrative surgeon placeholder photo with explicit "Placeholder Portrait" disclosure badge',
      requiredActionBeforeLaunch: 'Upload approved portrait of Dr. Navjot Singh in /admin or replace /public/media/doctor-portrait.jpg',
    },
    {
      id: 'verify-treatment-list',
      category: 'Clinical Services',
      item: 'Five Signature Treatments & procedure descriptions (Hair Transplant, Rhinoplasty, Gynecomastia Correction, Body Contouring, Skin Rejuvenation, Reconstructive Surgery)',
      currentPlaceholderState: 'Labelled as "Draft — Pending Clinic Approval" across cards and detail pages',
      requiredActionBeforeLaunch: 'Review clinical scope with Dr. Navjot Singh and switch status to "Approved by Clinic" in /admin -> Treatments',
    },
    {
      id: 'verify-contact-phone-whatsapp',
      category: 'Contact & Location',
      item: 'Official clinic reception phone, WhatsApp number, email address, physical street address, and consultation hours',
      currentPlaceholderState: 'Placeholders shown; mobile Call & WhatsApp buttons are locked until isPhoneConfirmed is enabled',
      requiredActionBeforeLaunch: 'Enter confirmed clinic phone, WhatsApp, and address in /admin -> Doctor & Site Settings and toggle "Phone Confirmed"',
    },
    {
      id: 'verify-before-after-gallery',
      category: 'Visual Media & Consent',
      item: 'Consented, unaltered clinical before-and-after patient photographs',
      currentPlaceholderState: 'Empty archive shell displaying "Approved patient photos coming soon" and consent policy',
      requiredActionBeforeLaunch: 'Upload only unaltered clinical photos with signed patient consent reference IDs in /admin -> Results Gallery',
    },
    {
      id: 'verify-patient-testimonials',
      category: 'Visual Media & Consent',
      item: 'Authenticated, consented patient testimonials',
      currentPlaceholderState: 'Neutral empty state in dark luxury carousel (zero fabricated reviews)',
      requiredActionBeforeLaunch: 'Add verified patient testimonials with documented consent in /admin -> Testimonials',
    },
    {
      id: 'verify-booking-live-notifications',
      category: 'Legal & Compliance',
      item: 'Live appointment dispatch & server-side email notification environment variables',
      currentPlaceholderState: 'Clearly labelled non-deceptive Demo Mode ("Booking integration is being configured")',
      requiredActionBeforeLaunch: 'Configure SMTP/Webhook variables in server environment and enable "Live Booking Mode" in /admin',
    },
  ],
};
