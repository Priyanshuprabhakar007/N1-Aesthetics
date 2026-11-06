import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  where,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import {
  auth,
  db,
  googleProvider,
  handleFirestoreError,
  OperationType,
} from '../lib/firebase';
import {
  siteContent,
  TreatmentItem,
  ConsentedTestimonial,
  ConsentedResultCase,
  BlogArticleShell,
} from '../content/site';

export type StaffRoleType = 'admin' | 'editor' | 'unauthorized' | null;

export interface LiveSiteSettings {
  doctorName: string;
  doctorRole: string;
  doctorShortIntro: string;
  doctorPortraitUrl: string;
  credentialsVerified: boolean;
  phone: string;
  whatsappNumber: string;
  isPhoneConfirmed: boolean;
  email: string;
  address: string;
  hours: string;
  bookingLiveMode: boolean;
}

export interface AppointmentEnquiryRecord {
  id: string;
  name: string;
  phone: string;
  email?: string;
  treatment: string;
  preferredDate: string;
  message?: string;
  privacyConsent: boolean;
  status: 'new' | 'contacted' | 'scheduled' | 'archived';
  assignedTo: string;
  createdAt?: any;
  updatedAt?: any;
}

interface CmsContextValue {
  user: User | null;
  authReady: boolean;
  role: StaffRoleType;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  settings: LiveSiteSettings;
  treatments: TreatmentItem[];
  consentedTestimonials: ConsentedTestimonial[];
  consentedResults: ConsentedResultCase[];
  blogArticles: BlogArticleShell[];
  submitEnquiryToCms: (payload: {
    name: string;
    phone: string;
    email?: string;
    treatment: string;
    preferredDate: string;
    message?: string;
    privacyConsent: boolean;
  }) => Promise<string>;
  saveSiteSettings: (next: LiveSiteSettings) => Promise<void>;
  upsertTreatment: (treatment: TreatmentItem) => Promise<void>;
  deleteTreatment: (slug: string) => Promise<void>;
  upsertTestimonial: (item: {
    id?: string;
    patientIdentifier: string;
    procedureContext: string;
    quote: string;
    consentVerified: boolean;
    published: boolean;
  }) => Promise<void>;
  deleteTestimonial: (id: string) => Promise<void>;
  upsertClinicalResult: (item: {
    id?: string;
    treatmentSlug: string;
    treatmentTitle: string;
    beforeImage: string;
    afterImage: string;
    clinicalNotes: string;
    consentReference: string;
    consentVerified: boolean;
    published: boolean;
  }) => Promise<void>;
  deleteClinicalResult: (id: string) => Promise<void>;
  upsertBlogPost: (item: {
    slug: string;
    title: string;
    category: string;
    excerpt: string;
    readingTime: string;
    seoTitle: string;
    seoDescription: string;
    published: boolean;
  }) => Promise<void>;
  deleteBlogPost: (slug: string) => Promise<void>;
}

const defaultSettings: LiveSiteSettings = {
  doctorName: siteContent.doctor.name,
  doctorRole: siteContent.doctor.roleTitle,
  doctorShortIntro: siteContent.doctor.shortIntro,
  doctorPortraitUrl: siteContent.doctor.portraitPath,
  credentialsVerified: false,
  phone: siteContent.contact.phonePlaceholder,
  whatsappNumber: siteContent.contact.whatsappPlaceholder,
  isPhoneConfirmed: siteContent.contact.isPhoneConfirmed,
  email: siteContent.contact.emailPlaceholder,
  address: siteContent.contact.addressPlaceholder,
  hours: siteContent.contact.hoursPlaceholder,
  bookingLiveMode: siteContent.bookingConfig.isLiveIntegrationConfigured,
};

const CmsContext = createContext<CmsContextValue | null>(null);

export function CmsProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [role, setRole] = useState<StaffRoleType>(null);

  const [settings, setSettings] = useState<LiveSiteSettings>(defaultSettings);
  const [treatments, setTreatments] = useState<TreatmentItem[]>(siteContent.treatments);
  const [consentedTestimonials, setConsentedTestimonials] = useState<ConsentedTestimonial[]>(
    siteContent.testimonialsSection.consentedTestimonials
  );
  const [consentedResults, setConsentedResults] = useState<ConsentedResultCase[]>(
    siteContent.resultsGallery.approvedCases
  );
  const [blogArticles, setBlogArticles] = useState<BlogArticleShell[]>(
    siteContent.resourcesBlog.articles
  );

  // 1. Track Firebase Auth & Staff Role (requires verified email)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setRole(null);
        setAuthReady(true);
        return;
      }

      // Enforce verified email before any role assignment or role document lookup
      if (!currentUser.emailVerified) {
        setRole('unauthorized');
        setAuthReady(true);
        return;
      }

      // Check bootstrapped admin email first (flagged for clinic owner confirmation)
      if (currentUser.email === 'dilseinvite@gmail.com') {
        setRole('admin');
        setAuthReady(true);
        return;
      }

      // Otherwise check /staff_roles/{uid}
      try {
        const roleSnap = await getDoc(doc(db, 'staff_roles', currentUser.uid));
        if (roleSnap.exists()) {
          const data = roleSnap.data();
          if (data.role === 'admin' || data.role === 'editor') {
            setRole(data.role);
          } else {
            setRole('unauthorized');
          }
        } else {
          setRole('unauthorized');
        }
      } catch {
        setRole('unauthorized');
      } finally {
        setAuthReady(true);
      }
    });

    return () => unsubscribe();
  }, []);

  // 2. Public / Live Site Settings listener
  useEffect(() => {
    const unsubSettings = onSnapshot(
      doc(db, 'site_settings', 'main'),
      (snap) => {
        if (snap.exists()) {
          const d = snap.data();
          setSettings({
            doctorName: d.doctorName || defaultSettings.doctorName,
            doctorRole:
              !d.doctorRole || d.doctorRole === 'Plastic & Cosmetic Surgery'
                ? defaultSettings.doctorRole
                : d.doctorRole,
            doctorShortIntro:
              !d.doctorShortIntro ||
              d.doctorShortIntro.includes('anatomical balance')
                ? defaultSettings.doctorShortIntro
                : d.doctorShortIntro,
            doctorPortraitUrl:
              !d.doctorPortraitUrl ||
              d.doctorPortraitUrl.includes('NcUyALnbrKfnL1') ||
              d.doctorPortraitUrl.includes('doctor-portrait') ||
              d.doctorPortraitUrl === '/images/dr-navjot-singh.png' ||
              d.doctorPortraitUrl.includes('ChatGPT_Image')
                ? defaultSettings.doctorPortraitUrl
                : d.doctorPortraitUrl,
            credentialsVerified: Boolean(d.credentialsVerified),
            phone: d.phone || defaultSettings.phone,
            whatsappNumber: d.whatsappNumber || defaultSettings.whatsappNumber,
            isPhoneConfirmed: Boolean(d.isPhoneConfirmed),
            email: d.email || defaultSettings.email,
            address: d.address || defaultSettings.address,
            hours: d.hours || defaultSettings.hours,
            bookingLiveMode: Boolean(d.bookingLiveMode),
          });
        }
      },
      () => {
        // Keep static defaults if not yet initialized
      }
    );

    // Public Consented Testimonials listener
    const qTestimonials = query(
      collection(db, 'testimonials'),
      where('published', '==', true),
      where('consentVerified', '==', true)
    );
    const unsubTestimonials = onSnapshot(
      qTestimonials,
      (snap) => {
        const list: ConsentedTestimonial[] = snap.docs.map((docSnap) => {
          const d = docSnap.data();
          return {
            id: docSnap.id,
            patientIdentifier: d.patientIdentifier,
            procedureContext: d.procedureContext,
            quote: d.quote,
            consentVerified: Boolean(d.consentVerified),
            published: Boolean(d.published),
          };
        });
        setConsentedTestimonials(list);
      },
      () => {}
    );

    // Public Consented Results listener
    const qResults = query(
      collection(db, 'clinical_results'),
      where('published', '==', true),
      where('consentVerified', '==', true)
    );
    const unsubResults = onSnapshot(
      qResults,
      (snap) => {
        const list: ConsentedResultCase[] = snap.docs.map((docSnap) => {
          const d = docSnap.data();
          return {
            id: docSnap.id,
            treatmentSlug: d.treatmentSlug,
            treatmentTitle: d.treatmentTitle,
            beforeImage: d.beforeImage,
            afterImage: d.afterImage,
            clinicalNotes: d.clinicalNotes,
            consentReference: d.consentReference,
            consentVerified: Boolean(d.consentVerified),
            published: Boolean(d.published),
          };
        });
        setConsentedResults(list);
      },
      () => {}
    );

    // Public Blog Posts listener
    const qBlog = query(collection(db, 'blog_posts'), where('published', '==', true));
    const unsubBlog = onSnapshot(
      qBlog,
      (snap) => {
        if (!snap.empty) {
          const list: BlogArticleShell[] = snap.docs.map((docSnap) => {
            const d = docSnap.data();
            const existing = siteContent.resourcesBlog.articles.find((a) => a.slug === d.slug);
            return {
              slug: d.slug,
              title: d.title,
              category: d.category,
              status: 'editorial_guide',
              excerpt: d.excerpt,
              readingTime: d.readingTime,
              seoTitle: d.seoTitle,
              seoDescription: d.seoDescription,
              published: Boolean(d.published),
              keyTakeaways: existing?.keyTakeaways || [
                'Schedule an in-person consultation with Dr. Navjot Singh for personalised guidance.',
              ],
            };
          });
          setBlogArticles(list);
        }
      },
      () => {}
    );

    return () => {
      unsubSettings();
      unsubTestimonials();
      unsubResults();
      unsubBlog();
    };
  }, []);

  // 3. Treatments listener:
  // - Public / unauthenticated visitors query ONLY `approvalStatus == 'approved_by_clinic'`
  // - Verified staff (admin / editor) query both `draft_pending_clinic_approval` and `approved_by_clinic`
  useEffect(() => {
    const isVerifiedStaff = authReady && (role === 'admin' || role === 'editor');

    const qTreatments = isVerifiedStaff
      ? query(
          collection(db, 'treatments'),
          where('approvalStatus', 'in', ['draft_pending_clinic_approval', 'approved_by_clinic'])
        )
      : query(
          collection(db, 'treatments'),
          where('approvalStatus', '==', 'approved_by_clinic')
        );

    const unsubTreatments = onSnapshot(
      qTreatments,
      (snap) => {
        if (!snap.empty) {
          const dbDocs: TreatmentItem[] = snap.docs.map((docSnap) => {
            const d = docSnap.data();
            const existingMatch = siteContent.treatments.find((t) => t.slug === d.slug);
            const rawCardImage = typeof d.cardImage === 'string' ? d.cardImage : '';
            const resolvedCardImage =
              !rawCardImage || rawCardImage.endsWith('.svg')
                ? existingMatch?.cardImage || '/media/treatment-skin-rejuvenation.jpg'
                : rawCardImage;
            return {
              slug: d.slug,
              title: d.title,
              shortTitle: d.shortTitle,
              category: d.category || existingMatch?.category || 'Surgical Procedures',
              isSignature: Boolean(d.isSignature),
              approvalStatus: d.approvalStatus,
              verificationStatus:
                d.approvalStatus === 'approved_by_clinic'
                  ? 'confirmed_core_focus'
                  : existingMatch?.verificationStatus || 'unconfirmed_requires_clinic_verification',
              cardImage: resolvedCardImage,
              imageAlt: existingMatch?.imageAlt || `${d.title} editorial photograph`,
              isIllustrativeAsset: true as const,
              summary: d.summary,
              overview: d.overview,
              consultationFocus: existingMatch?.consultationFocus || [
                'Individualised anatomical assessment and clinical evaluation',
              ],
              candidacyConsiderations: existingMatch?.candidacyConsiderations || [
                'Assessed in person during surgical consultation',
              ],
              recoveryOverview:
                existingMatch?.recoveryOverview ||
                'Discussed individually during consultation based on surgical scope.',
              faqs: existingMatch?.faqs || [],
            } satisfies TreatmentItem;
          });

          const bySlug = new Map(dbDocs.map((item) => [item.slug, item]));
          const mergedBase = siteContent.treatments.map(
            (staticItem) => bySlug.get(staticItem.slug) || staticItem
          );
          const customDocs = dbDocs.filter(
            (item) => !siteContent.treatments.some((s) => s.slug === item.slug)
          );
          setTreatments([...mergedBase, ...customDocs]);
        } else {
          setTreatments(siteContent.treatments);
        }
      },
      () => {}
    );

    return () => {
      unsubTreatments();
    };
  }, [authReady, role]);

  const signInWithGoogle = async () => {
    await signInWithPopup(auth, googleProvider);
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  const requireStaffUser = () => {
    const currentUser = auth.currentUser;
    if (!currentUser || !currentUser.emailVerified || (role !== 'admin' && role !== 'editor')) {
      throw new Error('Verified staff authentication (admin or editor) is required.');
    }
    return currentUser;
  };

  const requireAdminUser = () => {
    const currentUser = auth.currentUser;
    if (!currentUser || !currentUser.emailVerified || role !== 'admin') {
      throw new Error('Verified administrator authorization is required.');
    }
    return currentUser;
  };

  // Submit public consultation enquiry to Firestore (with strict volumetric & schema validation)
  const submitEnquiryToCms = async (payload: {
    name: string;
    phone: string;
    email?: string;
    treatment: string;
    preferredDate: string;
    message?: string;
    privacyConsent: boolean;
  }): Promise<string> => {
    const trimmedName = payload.name.trim().slice(0, 120);
    const trimmedPhone = payload.phone.trim().slice(0, 30);
    const trimmedTreatment = payload.treatment.trim().slice(0, 120);
    const trimmedDate = payload.preferredDate.trim().slice(0, 20);

    if (
      trimmedName.length < 2 ||
      trimmedPhone.length < 7 ||
      !/^[0-9+()\- \s]{7,30}$/.test(trimmedPhone) ||
      trimmedTreatment.length < 2 ||
      !/^\d{4}-\d{2}-\d{2}$/.test(trimmedDate) ||
      payload.privacyConsent !== true
    ) {
      throw new Error('Invalid consultation enquiry fields or missing privacy consent.');
    }

    const randomPart = Math.random().toString(36).replace(/[^a-z0-9]/g, '').slice(0, 8) || 'n7enq1';
    const enquiryId = `enq_${Date.now()}_${randomPart}`;
    const docData: Record<string, any> = {
      name: trimmedName,
      phone: trimmedPhone,
      treatment: trimmedTreatment,
      preferredDate: trimmedDate,
      privacyConsent: true,
      status: 'new',
      assignedTo: 'unassigned',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    if (payload.email && payload.email.trim()) {
      const trimmedEmail = payload.email.trim().slice(0, 254);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
        throw new Error('Invalid optional email address format.');
      }
      docData.email = trimmedEmail;
    }
    if (payload.message && payload.message.trim()) {
      docData.message = payload.message.trim().slice(0, 500);
    }

    const path = `appointment_enquiries/${enquiryId}`;
    try {
      await setDoc(doc(db, 'appointment_enquiries', enquiryId), docData);
      return enquiryId;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  const saveSiteSettings = async (next: LiveSiteSettings) => {
    const currentUser = requireStaffUser();
    const doctorName = next.doctorName.trim().slice(0, 120);
    if (doctorName.length < 2) {
      throw new Error('Doctor name must be at least 2 characters.');
    }
    const path = 'site_settings/main';
    try {
      await setDoc(doc(db, 'site_settings', 'main'), {
        doctorName,
        doctorRole: next.doctorRole.trim().slice(0, 160),
        doctorShortIntro: next.doctorShortIntro.trim().slice(0, 800),
        doctorPortraitUrl: next.doctorPortraitUrl.trim().slice(0, 1000) || defaultSettings.doctorPortraitUrl,
        credentialsVerified: Boolean(next.credentialsVerified),
        phone: next.phone.trim().slice(0, 60),
        whatsappNumber: next.whatsappNumber.trim().slice(0, 40),
        isPhoneConfirmed: Boolean(next.isPhoneConfirmed),
        email: next.email.trim().slice(0, 160),
        address: next.address.trim().slice(0, 300),
        hours: next.hours.trim().slice(0, 160),
        bookingLiveMode: Boolean(next.bookingLiveMode),
        authorUid: currentUser.uid,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const upsertTreatment = async (t: TreatmentItem) => {
    const currentUser = requireStaffUser();
    const safeSlug = t.slug
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 100);
    if (safeSlug.length < 2) {
      throw new Error('Treatment slug must be at least 2 alphanumeric characters.');
    }
    const title = t.title.trim().slice(0, 140);
    const shortTitle = (t.shortTitle || t.title).trim().slice(0, 80);
    const summary = t.summary.trim().slice(0, 600);
    const overview = t.overview.trim().slice(0, 2500);
    if (title.length < 2 || shortTitle.length < 2 || summary.length < 2 || overview.length < 2) {
      throw new Error('Treatment title, short title, summary, and overview must each be at least 2 characters.');
    }

    const path = `treatments/${safeSlug}`;
    try {
      await setDoc(doc(db, 'treatments', safeSlug), {
        slug: safeSlug,
        title,
        shortTitle,
        category: (t.category || 'Surgical Procedures').trim().slice(0, 80),
        summary,
        overview,
        cardImage: t.cardImage.trim().slice(0, 1000) || '/media/treatment-skin-rejuvenation.jpg',
        approvalStatus: t.approvalStatus,
        isSignature: Boolean(t.isSignature),
        authorUid: currentUser.uid,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const deleteTreatment = async (slug: string) => {
    requireAdminUser();
    const path = `treatments/${slug}`;
    try {
      await deleteDoc(doc(db, 'treatments', slug));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const upsertTestimonial = async (item: {
    id?: string;
    patientIdentifier: string;
    procedureContext: string;
    quote: string;
    consentVerified: boolean;
    published: boolean;
  }) => {
    const currentUser = requireStaffUser();
    const patientIdentifier = item.patientIdentifier.trim().slice(0, 100);
    const quote = item.quote.trim().slice(0, 1200);
    if (patientIdentifier.length < 2) {
      throw new Error('Patient identifier must be at least 2 characters.');
    }
    if (quote.length < 10) {
      throw new Error('Testimonial quote must be at least 10 characters.');
    }
    const docId = item.id && /^[a-zA-Z0-9_-]{1,128}$/.test(item.id) ? item.id : `test_${Date.now()}`;
    const path = `testimonials/${docId}`;
    try {
      await setDoc(doc(db, 'testimonials', docId), {
        patientIdentifier,
        procedureContext: item.procedureContext.trim().slice(0, 120),
        quote,
        consentVerified: Boolean(item.consentVerified),
        published: Boolean(item.consentVerified && item.published),
        authorUid: currentUser.uid,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const deleteTestimonial = async (id: string) => {
    requireAdminUser();
    const path = `testimonials/${id}`;
    try {
      await deleteDoc(doc(db, 'testimonials', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const upsertClinicalResult = async (item: {
    id?: string;
    treatmentSlug: string;
    treatmentTitle: string;
    beforeImage: string;
    afterImage: string;
    clinicalNotes: string;
    consentReference: string;
    consentVerified: boolean;
    published: boolean;
  }) => {
    const currentUser = requireStaffUser();
    const safeSlug = item.treatmentSlug
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 100);
    const treatmentTitle = item.treatmentTitle.trim().slice(0, 140);
    const consentReference = item.consentReference.trim().slice(0, 160);
    if (safeSlug.length < 2 || treatmentTitle.length < 2 || consentReference.length < 2) {
      throw new Error('Treatment title, slug, and signed consent reference ID (min 2 chars) are required.');
    }
    const docId = item.id && /^[a-zA-Z0-9_-]{1,128}$/.test(item.id) ? item.id : `res_${Date.now()}`;
    const path = `clinical_results/${docId}`;
    try {
      await setDoc(doc(db, 'clinical_results', docId), {
        treatmentSlug: safeSlug,
        treatmentTitle,
        beforeImage: item.beforeImage.trim().slice(0, 1000),
        afterImage: item.afterImage.trim().slice(0, 1000),
        clinicalNotes: item.clinicalNotes.trim().slice(0, 1000),
        consentReference,
        consentVerified: Boolean(item.consentVerified),
        published: Boolean(item.consentVerified && item.published),
        authorUid: currentUser.uid,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const deleteClinicalResult = async (id: string) => {
    requireAdminUser();
    const path = `clinical_results/${id}`;
    try {
      await deleteDoc(doc(db, 'clinical_results', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const upsertBlogPost = async (item: {
    slug: string;
    title: string;
    category: string;
    excerpt: string;
    readingTime: string;
    seoTitle: string;
    seoDescription: string;
    published: boolean;
  }) => {
    const currentUser = requireStaffUser();
    const safeSlug = item.slug
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 120);
    const title = item.title.trim().slice(0, 180);
    if (safeSlug.length < 2 || title.length < 3) {
      throw new Error('Blog article slug (min 2 chars) and title (min 3 chars) are required.');
    }
    const path = `blog_posts/${safeSlug}`;
    try {
      await setDoc(doc(db, 'blog_posts', safeSlug), {
        slug: safeSlug,
        title,
        category: item.category.trim().slice(0, 80),
        excerpt: item.excerpt.trim().slice(0, 600),
        readingTime: item.readingTime.trim().slice(0, 40),
        seoTitle: item.seoTitle.trim().slice(0, 120),
        seoDescription: item.seoDescription.trim().slice(0, 240),
        published: Boolean(item.published),
        authorUid: currentUser.uid,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const deleteBlogPost = async (slug: string) => {
    requireAdminUser();
    const path = `blog_posts/${slug}`;
    try {
      await deleteDoc(doc(db, 'blog_posts', slug));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  return (
    <CmsContext.Provider
      value={{
        user,
        authReady,
        role,
        signInWithGoogle,
        signOut,
        settings,
        treatments,
        consentedTestimonials,
        consentedResults,
        blogArticles,
        submitEnquiryToCms,
        saveSiteSettings,
        upsertTreatment,
        deleteTreatment,
        upsertTestimonial,
        deleteTestimonial,
        upsertClinicalResult,
        deleteClinicalResult,
        upsertBlogPost,
        deleteBlogPost,
      }}
    >
      {children}
    </CmsContext.Provider>
  );
}

export function useCms() {
  const ctx = useContext(CmsContext);
  if (!ctx) {
    throw new Error('useCms must be used inside CmsProvider');
  }
  return ctx;
}
