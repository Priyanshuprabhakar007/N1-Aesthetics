import React, { useEffect, useState } from 'react';
import {
  Shield,
  LogOut,
  Download,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Upload,
  Users,
  FileText,
  Sparkles,
  Image as ImageIcon,
  MessageSquareQuote,
  CalendarClock,
  Settings,
} from 'lucide-react';
import {
  collection,
  doc,
  onSnapshot,
  query,
  where,
  updateDoc,
  deleteDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { ref as storageRef, uploadString, getDownloadURL } from 'firebase/storage';
import { auth, db, storage, handleFirestoreError, OperationType } from '../lib/firebase';
import { useCms, AppointmentEnquiryRecord, LiveSiteSettings } from '../context/CmsContext';
import { siteContent, TreatmentItem } from '../content/site';
import { SeoHead } from '../components/SeoHead';
import styles from '../styles/luxury.module.css';

type AdminTab =
  | 'enquiries'
  | 'treatments'
  | 'doctor_settings'
  | 'testimonials'
  | 'results'
  | 'blog_seo'
  | 'roles_checklist';

type AllowedStorageFolder =
  | 'treatments'
  | 'doctor'
  | 'clinical_results_consented'
  | 'clinical_results_private';

const ALLOWED_STORAGE_FOLDERS = new Set<AllowedStorageFolder>([
  'treatments',
  'doctor',
  'clinical_results_consented',
  'clinical_results_private',
]);

/**
 * Client-side media validation & optimization utility:
 * - Verifies authenticated & email-verified staff user
 * - Validates MIME type (JPEG/PNG/WebP), file extension, and size (> 0 and <= 5MB)
 * - Validates allowed storage folder and sanitizes path to prevent path traversal or overwrites
 * - Attaches custom metadata (uploadedByUid, consentVerified, published, consentReference)
 */
async function optimizeAndUploadMedia(
  file: File,
  folder: AllowedStorageFolder,
  staffRole: 'admin' | 'editor' | 'unauthorized',
  options?: {
    consentVerified?: boolean;
    published?: boolean;
    consentReference?: string;
  }
): Promise<string> {
  const currentUser = auth.currentUser;
  if (!currentUser || !currentUser.emailVerified) {
    throw new Error('Verified staff authentication is required to upload media.');
  }

  if (staffRole !== 'admin' && staffRole !== 'editor') {
    throw new Error('Only authorized clinic staff (admin or editor) can upload media.');
  }

  if (!ALLOWED_STORAGE_FOLDERS.has(folder)) {
    throw new Error('Invalid storage destination folder.');
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Invalid file type. Only JPEG, PNG, and WebP images are permitted.');
  }

  if (!/\.(jpe?g|png|webp)$/i.test(file.name)) {
    throw new Error('Invalid file extension. Only .jpg, .jpeg, .png, and .webp files are allowed.');
  }

  if (file.size <= 0 || file.size > 5 * 1024 * 1024) {
    throw new Error('File must be non-empty and not exceed the 5MB limit.');
  }

  const trimmedConsentRef = (options?.consentReference || '').trim().slice(0, 160);

  if (folder === 'clinical_results_consented') {
    if (!options?.consentVerified || trimmedConsentRef.length < 2) {
      throw new Error(
        'Clinical photographs cannot be uploaded to the consented archive without documented patient consent and a valid Consent Reference ID (2–160 characters).'
      );
    }
  }

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });

  const optimizedDataUrl = await new Promise<string>((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => {
      const maxDim = 1000;
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Browser canvas context is unavailable for WebP image optimization.'));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/webp', 0.82));
    };
    img.onerror = () => reject(new Error('Invalid image content'));
    img.src = dataUrl;
  });

  const baseName =
    file.name
      .replace(/\.[^/.]+$/, '')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 48) || 'image';
  const randomSuffix =
    Math.random().toString(36).replace(/[^a-z0-9]/g, '').slice(0, 8) || 'asset';
  const filename = `${Date.now()}_${randomSuffix}_${baseName}.webp`;
  const path = `n7_media/${folder}/${filename}`;

  const isConsentedFolder = folder === 'clinical_results_consented';
  const isPrivateClinicalFolder = folder === 'clinical_results_private';

  const sRef = storageRef(storage, path);
  await uploadString(sRef, optimizedDataUrl, 'data_url', {
    contentType: 'image/webp',
    customMetadata: {
      uploadedByUid: currentUser.uid,
      consentVerified: isConsentedFolder && options?.consentVerified ? 'true' : 'false',
      published:
        isPrivateClinicalFolder
          ? 'false'
          : isConsentedFolder && options?.published
          ? 'true'
          : 'false',
      consentReference: trimmedConsentRef,
    },
  });
  return await getDownloadURL(sRef);
}

export function AdminPage() {
  const {
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
    saveSiteSettings,
    upsertTreatment,
    deleteTreatment,
    upsertTestimonial,
    deleteTestimonial,
    upsertClinicalResult,
    deleteClinicalResult,
    upsertBlogPost,
    deleteBlogPost,
  } = useCms();

  const [activeTab, setActiveTab] = useState<AdminTab>('enquiries');
  const [statusBanner, setStatusBanner] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  // Enquiries state
  const [enquiries, setEnquiries] = useState<AppointmentEnquiryRecord[]>([]);
  const [enquiryFilter, setEnquiryFilter] = useState<string>('all');

  // Staff roles state
  const [staffRoles, setStaffRoles] = useState<
    Array<{ uid: string; email: string; role: 'admin' | 'editor' }>
  >([]);
  const [newStaffUid, setNewStaffUid] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<'admin' | 'editor'>('editor');

  // Doctor & Site Settings form state
  const [settingsForm, setSettingsForm] = useState<LiveSiteSettings>(settings);

  useEffect(() => {
    setSettingsForm(settings);
  }, [settings]);

  // Treatment Editor form state
  const [treatmentForm, setTreatmentForm] = useState<TreatmentItem>(siteContent.treatments[0]);

  // Testimonial Editor form state
  const [testimonialForm, setTestimonialForm] = useState({
    patientIdentifier: '',
    procedureContext: 'Rhinoplasty',
    quote: '',
    consentVerified: false,
    published: false,
  });

  // Clinical Result Editor form state
  const [resultForm, setResultForm] = useState({
    treatmentSlug: 'rhinoplasty',
    treatmentTitle: 'Rhinoplasty',
    beforeImage: '/media/treatment-rhinoplasty.svg',
    afterImage: '/media/treatment-rhinoplasty.svg',
    clinicalNotes: '',
    consentReference: '',
    consentVerified: false,
    published: false,
  });

  // Blog & SEO Editor form state
  const [blogForm, setBlogForm] = useState({
    slug: '',
    title: '',
    category: 'Consultation Guide',
    excerpt: '',
    readingTime: '4 min read',
    seoTitle: '',
    seoDescription: '',
    published: true,
  });

  // Attach staff-only listeners when authenticated as admin or editor
  useEffect(() => {
    if (!authReady || (role !== 'admin' && role !== 'editor')) return;

    const qEnquiries = query(
      collection(db, 'appointment_enquiries'),
      where('status', 'in', ['new', 'contacted', 'scheduled', 'archived'])
    );
    const unsubEnquiries = onSnapshot(
      qEnquiries,
      (snap) => {
        const list: AppointmentEnquiryRecord[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<AppointmentEnquiryRecord, 'id'>),
        }));
        setEnquiries(list);
      },
      (err) => {
        console.error('Enquiries listener error:', err);
      }
    );

    let unsubStaff: (() => void) | undefined;
    if (role === 'admin') {
      const qStaff = query(
        collection(db, 'staff_roles'),
        where('role', 'in', ['admin', 'editor'])
      );
      unsubStaff = onSnapshot(
        qStaff,
        (snap) => {
          setStaffRoles(
            snap.docs.map((d) => ({
              uid: d.id,
              email: d.data().email,
              role: d.data().role,
            }))
          );
        },
        () => {}
      );
    }

    return () => {
      unsubEnquiries();
      if (unsubStaff) unsubStaff();
    };
  }, [authReady, role]);

  const showNotice = (type: 'success' | 'error', text: string) => {
    setStatusBanner({ type, text });
    window.setTimeout(() => setStatusBanner(null), 5000);
  };

  // Update enquiry status / assignment
  const handleUpdateEnquiry = async (
    enquiry: AppointmentEnquiryRecord,
    nextStatus: AppointmentEnquiryRecord['status'],
    nextAssignedTo: string
  ) => {
    const path = `appointment_enquiries/${enquiry.id}`;
    try {
      await updateDoc(doc(db, 'appointment_enquiries', enquiry.id), {
        status: nextStatus,
        assignedTo: nextAssignedTo.trim().slice(0, 120) || 'unassigned',
        updatedAt: serverTimestamp(),
      });
      showNotice('success', `Enquiry ${enquiry.name} updated.`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const handleDeleteEnquiry = async (id: string) => {
    if (role !== 'admin') return;
    const path = `appointment_enquiries/${id}`;
    try {
      await deleteDoc(doc(db, 'appointment_enquiries', id));
      showNotice('success', 'Enquiry deleted.');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  // Export enquiries to CSV
  const handleExportCsv = () => {
    const headers = ['ID', 'Name', 'Phone', 'Email', 'Treatment', 'PreferredDate', 'Status', 'AssignedTo'];
    const rows = enquiries.map((e) => [
      e.id,
      `"${(e.name || '').replace(/"/g, '""')}"`,
      `"${(e.phone || '').replace(/"/g, '""')}"`,
      `"${(e.email || '').replace(/"/g, '""')}"`,
      `"${(e.treatment || '').replace(/"/g, '""')}"`,
      e.preferredDate,
      e.status,
      `"${(e.assignedTo || '').replace(/"/g, '""')}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `n7-aesthetics-enquiries-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Add or update staff role (Admin only, preserving immutable createdAt on update)
  const handleAddStaffRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (role !== 'admin') return;
    const uid = newStaffUid.trim();
    const email = newStaffEmail.trim();
    if (!/^[a-zA-Z0-9_-]{1,128}$/.test(uid)) {
      showNotice('error', 'Please enter a valid Firebase User UID (1–128 alphanumeric characters).');
      return;
    }
    if (email.length < 3 || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showNotice('error', 'Please enter a valid staff email address.');
      return;
    }
    const path = `staff_roles/${uid}`;
    const existsAlready = staffRoles.some((sr) => sr.uid === uid);
    try {
      if (existsAlready) {
        await updateDoc(doc(db, 'staff_roles', uid), {
          email,
          role: newStaffRole,
        });
      } else {
        await setDoc(doc(db, 'staff_roles', uid), {
          uid,
          email,
          role: newStaffRole,
          createdAt: serverTimestamp(),
        });
      }
      setNewStaffUid('');
      setNewStaffEmail('');
      showNotice('success', `Assigned ${newStaffRole} role to ${email}`);
    } catch (error) {
      showNotice('error', 'Failed to assign staff role. Verify admin permissions.');
      handleFirestoreError(error, existsAlready ? OperationType.UPDATE : OperationType.CREATE, path);
    }
  };

  if (!authReady) {
    return (
      <section className="bg-[#F5EEE8] py-24 min-h-[70vh] flex items-center justify-center">
        <p className="text-sm text-[#30251F]">Verifying authentication session...</p>
      </section>
    );
  }

  // Unauthenticated Login Gate
  if (!user) {
    return (
      <>
        <SeoHead
          title="Clinic Admin CMS Portal"
          description="Role-protected administrative portal for N7 Aesthetics content, enquiries, and consent verification."
          canonicalPath="/admin"
        />
        <section className="bg-[#F5EEE8] py-20 min-h-[75vh] flex items-center">
          <div className={`${styles.containerLuxury} max-w-lg mx-auto`}>
            <div className="bg-[#211A17] text-[#F5EEE8] rounded-[24px] p-8 sm:p-10 border border-[#E6CDB5]/20 shadow-xl space-y-6 text-center">
              <div className="w-12 h-12 rounded-full bg-[#30251F] border border-[#BA9876]/40 flex items-center justify-center mx-auto">
                <Shield className="w-6 h-6 text-[#E6CDB5]" />
              </div>
              <div className="space-y-2">
                <span className="text-xs uppercase tracking-[0.26em] text-[#E6CDB5]/75">
                  ROLE-PROTECTED PORTAL
                </span>
                <h1 className="font-heading text-3xl sm:text-4xl text-[#F5EEE8]">
                  N7 Aesthetics Admin CMS
                </h1>
                <p className="text-xs sm:text-sm text-[#F5EEE8]/75 leading-relaxed">
                  Sign in with an authorised clinic Google account (<code className="text-[#E6CDB5]">admin</code> or{' '}
                  <code className="text-[#E6CDB5]">editor</code> role) to manage appointment enquiries, draft
                  treatments, doctor profile, consented clinical results, and testimonials.
                </p>
              </div>
              <button
                type="button"
                onClick={() => signInWithGoogle()}
                className="w-full inline-flex items-center justify-center gap-2 bg-[#E6CDB5] hover:bg-[#dfbfa0] text-[#211A17] font-medium text-sm py-3.5 px-6 rounded-full transition-colors cursor-pointer"
              >
                <span>Sign In with Google</span>
              </button>
            </div>
          </div>
        </section>
      </>
    );
  }

  // Unauthorized Role Gate
  if (role !== 'admin' && role !== 'editor') {
    return (
      <section className="bg-[#F5EEE8] py-20 min-h-[75vh] flex items-center">
        <div className={`${styles.containerLuxury} max-w-xl mx-auto`}>
          <div className="bg-[#FAF5F0] border border-[#30251F]/15 rounded-[24px] p-8 space-y-5">
            <div className="flex items-center gap-3 text-amber-900">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <h1 className="font-heading text-2xl text-[#211A17]">
                Staff Role Authorization Required
              </h1>
            </div>
            <p className="text-sm text-[#30251F]/85 leading-relaxed">
              You are signed in as <strong>{user.email}</strong>, but your account does not yet have
              an <code className="font-mono">admin</code> or <code className="font-mono">editor</code>{' '}
              role in <code className="font-mono">/staff_roles</code>.
            </p>
            <div className="p-4 rounded-xl bg-[#F5EEE8] text-xs font-mono text-[#211A17] break-all">
              Your User UID: {user.uid}
            </div>
            <button
              type="button"
              onClick={() => signOut()}
              className="inline-flex items-center gap-2 bg-[#30251F] text-[#F5EEE8] text-xs font-medium px-5 py-2.5 rounded-full cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </section>
    );
  }

  const filteredEnquiries =
    enquiryFilter === 'all'
      ? enquiries
      : enquiries.filter((e) => e.status === enquiryFilter);

  return (
    <>
      <SeoHead
        title="Clinic Admin CMS Dashboard"
        description="N7 Aesthetics CMS dashboard for managing enquiries, treatments, doctor profile, consented results, and SEO."
        canonicalPath="/admin"
      />

      <section className="bg-[#211A17] text-[#F5EEE8] py-8 border-b border-[#E6CDB5]/15">
        <div className={`${styles.containerLuxury} flex flex-wrap items-center justify-between gap-4`}>
          <div>
            <div className="flex items-center gap-2 text-xs text-[#E6CDB5]">
              <Shield className="w-4 h-4 text-[#BA9876]" />
              <span className="uppercase tracking-[0.2em]">
                N7 Aesthetics CMS · Role: {role.toUpperCase()}
              </span>
            </div>
            <h1 className="font-heading text-3xl sm:text-4xl text-[#F5EEE8] mt-1">
              Clinic Content &amp; Enquiry Administration
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-[#E6CDB5]/80 hidden sm:inline">{user.email}</span>
            <button
              type="button"
              onClick={() => signOut()}
              className="inline-flex items-center gap-1.5 border border-[#E6CDB5]/30 hover:border-[#E6CDB5] text-xs text-[#F5EEE8] px-4 py-2 rounded-full transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </section>

      <section className="bg-[#F5EEE8] py-10 min-h-[75vh]">
        <div className={styles.containerLuxury}>
          {statusBanner && (
            <div
              role="status"
              className={`mb-6 rounded-2xl p-4 border text-xs font-medium flex items-center justify-between ${
                statusBanner.type === 'success'
                  ? 'bg-emerald-950/10 border-emerald-800/30 text-[#211A17]'
                  : 'bg-red-950/10 border-red-800/30 text-red-950'
              }`}
            >
              <span>{statusBanner.text}</span>
              <button
                type="button"
                onClick={() => setStatusBanner(null)}
                className="underline ml-4 cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="flex flex-wrap items-center gap-2 pb-6 mb-8 border-b border-[#30251F]/12">
            {[
              { id: 'enquiries', label: 'Enquiries & Export', icon: CalendarClock },
              { id: 'treatments', label: 'Treatments (Draft/Approve)', icon: Sparkles },
              { id: 'doctor_settings', label: 'Doctor & Clinic Contact', icon: Settings },
              { id: 'testimonials', label: 'Consented Testimonials', icon: MessageSquareQuote },
              { id: 'results', label: 'Consented Results Gallery', icon: ImageIcon },
              { id: 'blog_seo', label: 'Blog & SEO', icon: FileText },
              { id: 'roles_checklist', label: 'Roles & Launch Checklist', icon: Users },
            ].map((t) => {
              const Icon = t.icon;
              const active = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveTab(t.id as AdminTab)}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                    active
                      ? 'bg-[#30251F] text-[#F5EEE8]'
                      : 'bg-[#FAF5F0] text-[#30251F] border border-[#30251F]/15 hover:border-[#30251F]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>

          {/* TAB 1: APPOINTMENT ENQUIRIES */}
          {activeTab === 'enquiries' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-2">
                  {['all', 'new', 'contacted', 'scheduled', 'archived'].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setEnquiryFilter(st)}
                      className={`px-3.5 py-1.5 rounded-full text-xs capitalize cursor-pointer ${
                        enquiryFilter === st
                          ? 'bg-[#211A17] text-[#E6CDB5]'
                          : 'bg-[#FAF5F0] text-[#30251F] border border-[#30251F]/15'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleExportCsv}
                  disabled={enquiries.length === 0}
                  className="inline-flex items-center gap-2 bg-[#30251F] text-[#F5EEE8] disabled:opacity-40 text-xs font-medium px-5 py-2.5 rounded-full cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-[#E6CDB5]" />
                  <span>Export CSV ({enquiries.length})</span>
                </button>
              </div>

              {filteredEnquiries.length === 0 ? (
                <div className="bg-[#FAF5F0] border border-[#30251F]/12 rounded-[18px] p-8 text-center space-y-2">
                  <p className="font-heading text-2xl text-[#211A17]">No Enquiries in This View</p>
                  <p className="text-xs text-[#30251F]/75 max-w-md mx-auto">
                    Enable &ldquo;Live Booking Mode&rdquo; under the Doctor &amp; Clinic Contact tab
                    to log live consultation requests directly into this queue.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredEnquiries.map((enq) => (
                    <div
                      key={enq.id}
                      className="bg-[#FAF5F0] border border-[#30251F]/12 rounded-[18px] p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <span className="font-semibold text-sm text-[#211A17]">{enq.name}</span>
                          <span className="text-xs text-[#30251F]/80">· {enq.phone}</span>
                          {enq.email && (
                            <span className="text-xs text-[#30251F]/70">· {enq.email}</span>
                          )}
                        </div>
                        <p className="text-xs text-[#30251F]">
                          Procedure: <strong>{enq.treatment}</strong> · Preferred Date:{' '}
                          <strong className="tabular-nums">{enq.preferredDate}</strong>
                        </p>
                        {enq.message && (
                          <p className="text-xs text-[#30251F]/75 italic">Note: &ldquo;{enq.message}&rdquo;</p>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <select
                          aria-label="Enquiry Status"
                          value={enq.status}
                          onChange={(e) =>
                            handleUpdateEnquiry(
                              enq,
                              e.target.value as AppointmentEnquiryRecord['status'],
                              enq.assignedTo
                            )
                          }
                          className="rounded-full bg-[#F5EEE8] border border-[#30251F]/20 px-3.5 py-1.5 text-xs text-[#211A17]"
                        >
                          <option value="new">New</option>
                          <option value="contacted">Contacted</option>
                          <option value="scheduled">Scheduled</option>
                          <option value="archived">Archived</option>
                        </select>

                        <input
                          type="text"
                          aria-label="Assigned coordinator"
                          defaultValue={enq.assignedTo}
                          placeholder="Assign staff..."
                          onBlur={(e) => handleUpdateEnquiry(enq, enq.status, e.target.value)}
                          className="rounded-full bg-[#F5EEE8] border border-[#30251F]/20 px-3.5 py-1.5 text-xs text-[#211A17] w-36"
                        />

                        {role === 'admin' && (
                          <button
                            type="button"
                            onClick={() => handleDeleteEnquiry(enq.id)}
                            aria-label="Delete enquiry"
                            className="p-2 text-red-800 hover:bg-red-950/10 rounded-full cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: TREATMENTS CRUD */}
          {activeTab === 'treatments' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-5 bg-[#FAF5F0] border border-[#30251F]/12 rounded-[22px] p-6 space-y-4">
                <h2 className="font-heading text-2xl text-[#211A17]">
                  Create / Edit Treatment Procedure
                </h2>
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block font-medium mb-1">Slug (URL identifier)</label>
                    <input
                      type="text"
                      value={treatmentForm.slug}
                      onChange={(e) =>
                        setTreatmentForm({ ...treatmentForm, slug: e.target.value })
                      }
                      className="w-full rounded-xl bg-[#F5EEE8] border border-[#30251F]/20 px-3.5 py-2"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-medium mb-1">Full Title</label>
                      <input
                        type="text"
                        value={treatmentForm.title}
                        onChange={(e) =>
                          setTreatmentForm({ ...treatmentForm, title: e.target.value })
                        }
                        className="w-full rounded-xl bg-[#F5EEE8] border border-[#30251F]/20 px-3.5 py-2"
                      />
                    </div>
                    <div>
                      <label className="block font-medium mb-1">Short Card Title</label>
                      <input
                        type="text"
                        value={treatmentForm.shortTitle}
                        onChange={(e) =>
                          setTreatmentForm({ ...treatmentForm, shortTitle: e.target.value })
                        }
                        className="w-full rounded-xl bg-[#F5EEE8] border border-[#30251F]/20 px-3.5 py-2"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-medium mb-1">Approval Status</label>
                      <select
                        value={treatmentForm.approvalStatus}
                        onChange={(e) =>
                          setTreatmentForm({
                            ...treatmentForm,
                            approvalStatus: e.target.value as TreatmentItem['approvalStatus'],
                          })
                        }
                        className="w-full rounded-xl bg-[#F5EEE8] border border-[#30251F]/20 px-3.5 py-2"
                      >
                        <option value="draft_pending_clinic_approval">
                          Draft — Pending Clinic Approval
                        </option>
                        <option value="approved_by_clinic">Approved by Clinic</option>
                      </select>
                    </div>
                    <div className="flex items-end pb-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={treatmentForm.isSignature}
                          onChange={(e) =>
                            setTreatmentForm({ ...treatmentForm, isSignature: e.target.checked })
                          }
                        />
                        <span>Show in Homepage Signature 5</span>
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="block font-medium mb-1">Card Image Path or Upload</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={treatmentForm.cardImage}
                        onChange={(e) =>
                          setTreatmentForm({ ...treatmentForm, cardImage: e.target.value })
                        }
                        className="flex-1 rounded-xl bg-[#F5EEE8] border border-[#30251F]/20 px-3.5 py-2"
                      />
                      <label className="inline-flex items-center gap-1.5 bg-[#30251F] text-[#F5EEE8] px-3 py-2 rounded-xl cursor-pointer shrink-0">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload</span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="sr-only"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            try {
                              const url = await optimizeAndUploadMedia(file, 'treatments', role);
                              setTreatmentForm({ ...treatmentForm, cardImage: url });
                              showNotice('success', 'Image optimized & attached.');
                            } catch (err: any) {
                              showNotice('error', err.message);
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="block font-medium mb-1">Summary (Max 600 chars)</label>
                    <textarea
                      rows={2}
                      value={treatmentForm.summary}
                      onChange={(e) =>
                        setTreatmentForm({ ...treatmentForm, summary: e.target.value })
                      }
                      className="w-full rounded-xl bg-[#F5EEE8] border border-[#30251F]/20 p-3"
                    />
                  </div>
                  <div>
                    <label className="block font-medium mb-1">Clinical Overview</label>
                    <textarea
                      rows={4}
                      value={treatmentForm.overview}
                      onChange={(e) =>
                        setTreatmentForm({ ...treatmentForm, overview: e.target.value })
                      }
                      className="w-full rounded-xl bg-[#F5EEE8] border border-[#30251F]/20 p-3"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await upsertTreatment(treatmentForm);
                        showNotice('success', `Saved treatment ${treatmentForm.title}`);
                      } catch (err: any) {
                        showNotice('error', err?.message || 'Unable to save treatment.');
                      }
                    }}
                    className="w-full bg-[#30251F] hover:bg-[#211A17] text-[#F5EEE8] py-3 rounded-full font-medium cursor-pointer"
                  >
                    Save Treatment to CMS
                  </button>
                </div>
              </div>

              <div className="lg:col-span-7 space-y-3">
                {treatments.map((t) => (
                  <div
                    key={t.slug}
                    className="bg-[#FAF5F0] border border-[#30251F]/12 rounded-[18px] p-5 flex items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm text-[#211A17]">{t.title}</h3>
                        <span className="text-[11px] text-[#30251F]/70">
                          ·{' '}
                          {t.approvalStatus === 'approved_by_clinic'
                            ? 'Approved by Clinic'
                            : 'Draft (Pending Approval)'}
                        </span>
                      </div>
                      <p className="text-xs text-[#30251F]/80 mt-1 line-clamp-2">{t.summary}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setTreatmentForm(t)}
                        className="text-xs border border-[#30251F]/25 px-3.5 py-1.5 rounded-full hover:bg-[#E6CDB5]/30 cursor-pointer"
                      >
                        Edit
                      </button>
                      {role === 'admin' && (
                        <button
                          type="button"
                          onClick={() => deleteTreatment(t.slug)}
                          className="p-2 text-red-800 hover:bg-red-950/10 rounded-full cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: DOCTOR PROFILE & CLINIC CONTACT SETTINGS */}
          {activeTab === 'doctor_settings' && (
            <div className="bg-[#FAF5F0] border border-[#30251F]/12 rounded-[22px] p-6 sm:p-8 max-w-3xl space-y-5">
              <h2 className="font-heading text-2xl sm:text-3xl text-[#211A17]">
                Doctor Profile &amp; Clinic Contact Settings
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-medium mb-1">Doctor Name</label>
                  <input
                    type="text"
                    value={settingsForm.doctorName}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, doctorName: e.target.value })
                    }
                    className="w-full rounded-xl bg-[#F5EEE8] border border-[#30251F]/20 px-3.5 py-2.5"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">Specialty Description</label>
                  <input
                    type="text"
                    value={settingsForm.doctorRole}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, doctorRole: e.target.value })
                    }
                    className="w-full rounded-xl bg-[#F5EEE8] border border-[#30251F]/20 px-3.5 py-2.5"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-medium mb-1">Doctor Portrait Image URL</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={settingsForm.doctorPortraitUrl}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, doctorPortraitUrl: e.target.value })
                      }
                      className="flex-1 rounded-xl bg-[#F5EEE8] border border-[#30251F]/20 px-3.5 py-2.5"
                    />
                    <label className="inline-flex items-center gap-1.5 bg-[#30251F] text-[#F5EEE8] px-4 py-2.5 rounded-xl cursor-pointer">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Photo</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="sr-only"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          try {
                            const url = await optimizeAndUploadMedia(file, 'doctor', role);
                            setSettingsForm({ ...settingsForm, doctorPortraitUrl: url });
                            showNotice('success', 'Doctor portrait optimized & uploaded.');
                          } catch (err: any) {
                            showNotice('error', err.message);
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-medium mb-1">Short Introduction</label>
                  <textarea
                    rows={3}
                    value={settingsForm.doctorShortIntro}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, doctorShortIntro: e.target.value })
                    }
                    className="w-full rounded-xl bg-[#F5EEE8] border border-[#30251F]/20 p-3"
                  />
                </div>

                {/* ROW 1: WhatsApp Number | Consultation Hours */}
                <div>
                  <label className="block font-medium mb-1">WhatsApp Number</label>
                  <input
                    type="text"
                    value={settingsForm.whatsappNumber}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, whatsappNumber: e.target.value })
                    }
                    placeholder="+91 98765 43210"
                    className="w-full rounded-xl bg-[#F5EEE8] border border-[#30251F]/20 px-3.5 py-2.5"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">Consultation Hours</label>
                  <input
                    type="text"
                    value={settingsForm.hours}
                    onChange={(e) => setSettingsForm({ ...settingsForm, hours: e.target.value })}
                    placeholder="By Prior Appointment"
                    className="w-full rounded-xl bg-[#F5EEE8] border border-[#30251F]/20 px-3.5 py-2.5"
                  />
                </div>

                {/* ROW 2: Clinic Address (full width) */}
                <div className="sm:col-span-2">
                  <label className="block font-medium mb-1">Clinic Address</label>
                  <input
                    type="text"
                    value={settingsForm.address}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, address: e.target.value })
                    }
                    className="w-full rounded-xl bg-[#F5EEE8] border border-[#30251F]/20 px-3.5 py-2.5"
                  />
                </div>
              </div>

              <div className="pt-2 space-y-2.5 text-xs border-t border-[#30251F]/10">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settingsForm.credentialsVerified}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, credentialsVerified: e.target.checked })
                    }
                  />
                  <span>
                    Mark Doctor Credentials &amp; Official Portrait as Verified by Clinic
                  </span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settingsForm.isPhoneConfirmed}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, isPhoneConfirmed: e.target.checked })
                    }
                  />
                  <span>
                    Confirm Official WhatsApp Number
                  </span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settingsForm.bookingLiveMode}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, bookingLiveMode: e.target.checked })
                    }
                  />
                  <span>
                    Enable Live CMS Enquiry Queue (Switches form from Demo Mode to CMS Queue)
                  </span>
                </label>
              </div>

              <button
                type="button"
                onClick={async () => {
                  try {
                    await saveSiteSettings(settingsForm);
                    showNotice('success', 'Doctor profile & clinic contact settings saved.');
                  } catch (err: any) {
                    showNotice('error', err?.message || 'Unable to save clinic settings.');
                  }
                }}
                className="bg-[#30251F] hover:bg-[#211A17] text-[#F5EEE8] text-xs font-medium px-6 py-3.5 rounded-full cursor-pointer"
              >
                Save Global Clinic Settings
              </button>
            </div>
          )}

          {/* TAB 4: CONSENTED TESTIMONIALS */}
          {activeTab === 'testimonials' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-5 bg-[#FAF5F0] border border-[#30251F]/12 rounded-[22px] p-6 space-y-4 text-xs">
                <h2 className="font-heading text-2xl text-[#211A17]">
                  Add Consented Patient Reflection
                </h2>
                <div>
                  <label className="block font-medium mb-1">
                    Patient Identifier (e.g., Initials &amp; Consent ID)
                  </label>
                  <input
                    type="text"
                    value={testimonialForm.patientIdentifier}
                    onChange={(e) =>
                      setTestimonialForm({
                        ...testimonialForm,
                        patientIdentifier: e.target.value,
                      })
                    }
                    placeholder="A. K. (Consented Patient)"
                    className="w-full rounded-xl bg-[#F5EEE8] border border-[#30251F]/20 px-3.5 py-2"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">Procedure Context</label>
                  <input
                    type="text"
                    value={testimonialForm.procedureContext}
                    onChange={(e) =>
                      setTestimonialForm({
                        ...testimonialForm,
                        procedureContext: e.target.value,
                      })
                    }
                    className="w-full rounded-xl bg-[#F5EEE8] border border-[#30251F]/20 px-3.5 py-2"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">Authenticated Quote</label>
                  <textarea
                    rows={4}
                    value={testimonialForm.quote}
                    onChange={(e) =>
                      setTestimonialForm({ ...testimonialForm, quote: e.target.value })
                    }
                    className="w-full rounded-xl bg-[#F5EEE8] border border-[#30251F]/20 p-3"
                  />
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={testimonialForm.consentVerified}
                    onChange={(e) =>
                      setTestimonialForm({
                        ...testimonialForm,
                        consentVerified: e.target.checked,
                        published: e.target.checked ? testimonialForm.published : false,
                      })
                    }
                  />
                  <span>Written patient consent is documented and verified *</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    disabled={!testimonialForm.consentVerified}
                    checked={testimonialForm.published}
                    onChange={(e) =>
                      setTestimonialForm({ ...testimonialForm, published: e.target.checked })
                    }
                  />
                  <span>Publish to Website Carousel</span>
                </label>
                <button
                  type="button"
                  disabled={!testimonialForm.consentVerified || testimonialForm.quote.length < 10}
                  onClick={async () => {
                    try {
                      await upsertTestimonial(testimonialForm);
                      setTestimonialForm({
                        patientIdentifier: '',
                        procedureContext: 'Rhinoplasty',
                        quote: '',
                        consentVerified: false,
                        published: false,
                      });
                      showNotice('success', 'Consented testimonial saved.');
                    } catch (err: any) {
                      showNotice('error', err?.message || 'Unable to save testimonial.');
                    }
                  }}
                  className="w-full bg-[#30251F] disabled:opacity-40 text-[#F5EEE8] py-3 rounded-full font-medium cursor-pointer"
                >
                  Save Consented Testimonial
                </button>
              </div>

              <div className="lg:col-span-7 space-y-3">
                {consentedTestimonials.length === 0 ? (
                  <div className="bg-[#FAF5F0] border border-[#30251F]/12 rounded-[18px] p-8 text-center">
                    <p className="text-sm text-[#30251F]/80">
                      No published testimonials yet. Website displays neutral empty state.
                    </p>
                  </div>
                ) : (
                  consentedTestimonials.map((item) => (
                    <div
                      key={item.id}
                      className="bg-[#FAF5F0] border border-[#30251F]/12 rounded-[18px] p-5 flex items-start justify-between gap-4"
                    >
                      <div>
                        <p className="font-heading italic text-lg text-[#211A17]">
                          &ldquo;{item.quote}&rdquo;
                        </p>
                        <p className="text-xs text-[#30251F]/75 mt-1">
                          — {item.patientIdentifier} · {item.procedureContext}
                        </p>
                      </div>
                      {role === 'admin' && (
                        <button
                          type="button"
                          onClick={() => deleteTestimonial(item.id)}
                          className="p-2 text-red-800 hover:bg-red-950/10 rounded-full cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 5: CONSENTED RESULTS GALLERY */}
          {activeTab === 'results' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-5 bg-[#FAF5F0] border border-[#30251F]/12 rounded-[22px] p-6 space-y-3.5 text-xs">
                <h2 className="font-heading text-2xl text-[#211A17]">
                  Add Consented Clinical Before/After Case
                </h2>
                <div>
                  <label className="block font-medium mb-1">Treatment Title</label>
                  <input
                    type="text"
                    value={resultForm.treatmentTitle}
                    onChange={(e) =>
                      setResultForm({ ...resultForm, treatmentTitle: e.target.value })
                    }
                    className="w-full rounded-xl bg-[#F5EEE8] border border-[#30251F]/20 px-3.5 py-2"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">
                    Signed Consent Form Reference ID *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., CONSENT-2026-0042"
                    value={resultForm.consentReference}
                    onChange={(e) =>
                      setResultForm({ ...resultForm, consentReference: e.target.value })
                    }
                    className="w-full rounded-xl bg-[#F5EEE8] border border-[#30251F]/20 px-3.5 py-2"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">Clinical Notes &amp; Follow-Up Interval</label>
                  <textarea
                    rows={2}
                    value={resultForm.clinicalNotes}
                    onChange={(e) =>
                      setResultForm({ ...resultForm, clinicalNotes: e.target.value })
                    }
                    className="w-full rounded-xl bg-[#F5EEE8] border border-[#30251F]/20 p-3"
                  />
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={resultForm.consentVerified}
                    onChange={(e) =>
                      setResultForm({
                        ...resultForm,
                        consentVerified: e.target.checked,
                        published: e.target.checked ? resultForm.published : false,
                      })
                    }
                  />
                  <span>Unaltered clinical photos with documented patient consent *</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    disabled={!resultForm.consentVerified}
                    checked={resultForm.published}
                    onChange={(e) =>
                      setResultForm({ ...resultForm, published: e.target.checked })
                    }
                  />
                  <span>Publish to Results Archive</span>
                </label>
                <button
                  type="button"
                  disabled={!resultForm.consentVerified || !resultForm.consentReference.trim()}
                  onClick={async () => {
                    try {
                      await upsertClinicalResult(resultForm);
                      showNotice('success', 'Consented clinical case saved.');
                    } catch (err: any) {
                      showNotice('error', err?.message || 'Unable to save clinical case.');
                    }
                  }}
                  className="w-full bg-[#30251F] disabled:opacity-40 text-[#F5EEE8] py-3 rounded-full font-medium cursor-pointer"
                >
                  Save Consented Case
                </button>
              </div>

              <div className="lg:col-span-7 space-y-3">
                {consentedResults.length === 0 ? (
                  <div className="bg-[#FAF5F0] border border-[#30251F]/12 rounded-[18px] p-8 text-center">
                    <p className="text-sm text-[#30251F]/80">
                      No consented before/after cases published yet. Archive displays placeholder shells.
                    </p>
                  </div>
                ) : (
                  consentedResults.map((r) => (
                    <div
                      key={r.id}
                      className="bg-[#FAF5F0] border border-[#30251F]/12 rounded-[18px] p-5 flex items-center justify-between gap-4"
                    >
                      <div>
                        <p className="font-semibold text-sm text-[#211A17]">{r.treatmentTitle}</p>
                        <p className="text-xs text-[#30251F]/75">
                          Consent Ref: {r.consentReference} · {r.clinicalNotes}
                        </p>
                      </div>
                      {role === 'admin' && (
                        <button
                          type="button"
                          onClick={() => deleteClinicalResult(r.id)}
                          className="p-2 text-red-800 hover:bg-red-950/10 rounded-full cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 6: BLOG & SEO */}
          {activeTab === 'blog_seo' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-5 bg-[#FAF5F0] border border-[#30251F]/12 rounded-[22px] p-6 space-y-3.5 text-xs">
                <h2 className="font-heading text-2xl text-[#211A17]">
                  Create / Edit Resource &amp; SEO Metadata
                </h2>
                <div>
                  <label className="block font-medium mb-1">Slug</label>
                  <input
                    type="text"
                    value={blogForm.slug}
                    onChange={(e) => setBlogForm({ ...blogForm, slug: e.target.value })}
                    placeholder="rhinoplasty-consultation-guide"
                    className="w-full rounded-xl bg-[#F5EEE8] border border-[#30251F]/20 px-3.5 py-2"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">Article Title</label>
                  <input
                    type="text"
                    value={blogForm.title}
                    onChange={(e) => setBlogForm({ ...blogForm, title: e.target.value })}
                    className="w-full rounded-xl bg-[#F5EEE8] border border-[#30251F]/20 px-3.5 py-2"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">Excerpt</label>
                  <textarea
                    rows={3}
                    value={blogForm.excerpt}
                    onChange={(e) => setBlogForm({ ...blogForm, excerpt: e.target.value })}
                    className="w-full rounded-xl bg-[#F5EEE8] border border-[#30251F]/20 p-3"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">SEO Meta Title</label>
                  <input
                    type="text"
                    value={blogForm.seoTitle}
                    onChange={(e) => setBlogForm({ ...blogForm, seoTitle: e.target.value })}
                    className="w-full rounded-xl bg-[#F5EEE8] border border-[#30251F]/20 px-3.5 py-2"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">SEO Meta Description</label>
                  <textarea
                    rows={2}
                    value={blogForm.seoDescription}
                    onChange={(e) => setBlogForm({ ...blogForm, seoDescription: e.target.value })}
                    className="w-full rounded-xl bg-[#F5EEE8] border border-[#30251F]/20 p-3"
                  />
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await upsertBlogPost(blogForm);
                      showNotice('success', 'Blog resource & SEO saved.');
                    } catch (err: any) {
                      showNotice('error', err?.message || 'Unable to save blog resource.');
                    }
                  }}
                  className="w-full bg-[#30251F] text-[#F5EEE8] py-3 rounded-full font-medium cursor-pointer"
                >
                  Save Resource &amp; SEO
                </button>
              </div>

              <div className="lg:col-span-7 space-y-3">
                {blogArticles.map((b) => (
                  <div
                    key={b.slug}
                    className="bg-[#FAF5F0] border border-[#30251F]/12 rounded-[18px] p-5 flex items-center justify-between gap-4"
                  >
                    <div>
                      <h3 className="font-semibold text-sm text-[#211A17]">{b.title}</h3>
                      <p className="text-xs text-[#30251F]/75 mt-1">{b.excerpt}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          setBlogForm({
                            slug: b.slug,
                            title: b.title,
                            category: b.category,
                            excerpt: b.excerpt,
                            readingTime: b.readingTime,
                            seoTitle: b.seoTitle || b.title,
                            seoDescription: b.seoDescription || b.excerpt,
                            published: true,
                          })
                        }
                        className="text-xs border border-[#30251F]/25 px-3 py-1.5 rounded-full cursor-pointer"
                      >
                        Edit
                      </button>
                      {role === 'admin' && (
                        <button
                          type="button"
                          onClick={() => deleteBlogPost(b.slug)}
                          className="p-2 text-red-800 hover:bg-red-950/10 rounded-full cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 7: ROLES & PRE-LAUNCH VERIFICATION CHECKLIST */}
          {activeTab === 'roles_checklist' && (
            <div className="space-y-10">
              {role === 'admin' && (
                <div className="bg-[#FAF5F0] border border-[#30251F]/12 rounded-[22px] p-6 sm:p-8 space-y-5">
                  <h2 className="font-heading text-2xl text-[#211A17]">
                    Staff Role Management (RBAC: Admin &amp; Editor)
                  </h2>
                  <form onSubmit={handleAddStaffRole} className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                    <input
                      type="text"
                      placeholder="Firebase User UID"
                      value={newStaffUid}
                      onChange={(e) => setNewStaffUid(e.target.value)}
                      className="rounded-xl bg-[#F5EEE8] border border-[#30251F]/20 px-3.5 py-2.5"
                    />
                    <input
                      type="email"
                      placeholder="staff@n7aesthetics.example"
                      value={newStaffEmail}
                      onChange={(e) => setNewStaffEmail(e.target.value)}
                      className="rounded-xl bg-[#F5EEE8] border border-[#30251F]/20 px-3.5 py-2.5"
                    />
                    <select
                      value={newStaffRole}
                      onChange={(e) => setNewStaffRole(e.target.value as 'admin' | 'editor')}
                      className="rounded-xl bg-[#F5EEE8] border border-[#30251F]/20 px-3.5 py-2.5"
                    >
                      <option value="editor">Editor</option>
                      <option value="admin">Admin</option>
                    </select>
                    <button
                      type="submit"
                      className="inline-flex items-center justify-center gap-1.5 bg-[#30251F] text-[#F5EEE8] rounded-xl px-4 py-2.5 font-medium cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Assign Role</span>
                    </button>
                  </form>

                  {staffRoles.length > 0 && (
                    <div className="space-y-2 pt-2">
                      {staffRoles.map((sr) => (
                        <div
                          key={sr.uid}
                          className="flex items-center justify-between text-xs bg-[#F5EEE8] px-4 py-2.5 rounded-xl"
                        >
                          <span>
                            <strong>{sr.email}</strong> ({sr.uid}) — Role: <strong>{sr.role}</strong>
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Pre-Launch Clinic Verification Checklist */}
              <div className="bg-[#FAF5F0] border border-[#30251F]/12 rounded-[22px] p-6 sm:p-8 space-y-5">
                <div>
                  <span className="text-xs uppercase tracking-[0.22em] text-[#30251F]/70 font-medium">
                    MANDATORY LAUNCH AUDIT
                  </span>
                  <h2 className="font-heading text-2xl sm:text-3xl text-[#211A17] mt-1">
                    Items Requiring Clinic Verification Before Deployment
                  </h2>
                </div>

                <div className="space-y-3">
                  {siteContent.verificationChecklist.map((item) => (
                    <div
                      key={item.id}
                      className="bg-[#F5EEE8] border border-[#30251F]/12 rounded-[16px] p-4 space-y-1.5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-[#211A17] flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-[#BA9876] shrink-0" />
                          <span>{item.item}</span>
                        </span>
                        <span className="text-[11px] text-[#30251F]/70">{item.category}</span>
                      </div>
                      <p className="text-xs text-[#30251F]/80">
                        <strong>Current Safe State:</strong> {item.currentPlaceholderState}
                      </p>
                      <p className="text-xs text-[#30251F]">
                        <strong>Action Before Launch:</strong> {item.requiredActionBeforeLaunch}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
