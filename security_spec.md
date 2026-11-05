# N7 Aesthetics — Security Specification (`security_spec.md`)

## 1. Data Invariants
1. **Default-Deny Catch-All**: Any path not explicitly matched is unconditionally denied (`allow read, write: if false;`).
2. **Role-Based Access Control (`admin` & `editor`)**:
   - Bootstrapped primary admin requires `request.auth != null && request.auth.token.email_verified == true && request.auth.token.email == 'dilseinvite@gmail.com'`.
   - Additional staff roles are stored in `/staff_roles/{userId}` where `role in ['admin', 'editor']`. Only a verified `isAdmin()` can create, update, or delete `/staff_roles/{userId}` documents (preventing self-assigned privilege escalation).
3. **PII Isolation on `/appointment_enquiries/{enquiryId}`**:
   - Prospective patients can `create` an enquiry only if `isValidEnquiry(incoming())` passes, `status == 'new'`, `privacyConsent == true`, and `createdAt == request.time`.
   - Public or non-staff users can NEVER `get` or `list` `/appointment_enquiries/{enquiryId}` (strictly restricted to `isStaff()`, protecting PII `name`, `phone`, `email`).
4. **Consent Enforcement on Clinical Results & Testimonials**:
   - Public `get` / `list` on `/testimonials/{testimonialId}` and `/clinical_results/{resultId}` is permitted ONLY when `resource.data.published == true && resource.data.consentVerified == true` (or if the caller is `isStaff()`).
5. **Temporal & Identity Integrity**:
   - Every staff write (`treatments`, `testimonials`, `clinical_results`, `blog_posts`, `site_settings`) must set `authorUid == request.auth.uid` and `updatedAt == request.time`.

## 2. The "Dirty Dozen" Adversarial Payloads
1. **Unverified Admin Email Spoof**: Caller has `email == 'dilseinvite@gmail.com'` but `email_verified == false` attempting to read `/appointment_enquiries`. -> `PERMISSION_DENIED`.
2. **Self-Assigned Admin Role**: Authenticated non-admin user writes `{ uid: auth.uid, email: 'attacker@example.com', role: 'admin' }` to `/staff_roles/{uid}`. -> `PERMISSION_DENIED`.
3. **PII Scraping on Enquiries**: Authenticated non-staff user runs `list` or `get` on `/appointment_enquiries`. -> `PERMISSION_DENIED`.
4. **Ghost Field Shadow Update on Enquiries**: Staff updates `/appointment_enquiries/e1` with `{ status: 'contacted', isSuperVerified: true }`. -> `PERMISSION_DENIED` (`hasOnly` blocks shadow keys).
5. **Oversized Denial-of-Wallet ID**: Creating `/appointment_enquiries/{200_char_id}` -> `PERMISSION_DENIED` (`isValidId` blocks > 128 chars or invalid regex).
6. **Unconsented Public Testimonial Read**: Public user queries `/testimonials` where `consentVerified == false`. -> `PERMISSION_DENIED`.
7. **Unconsented Clinical Result Creation as Published**: Staff attempts to create `/clinical_results/r1` with `published: true` while `consentVerified: false`. -> `PERMISSION_DENIED`.
8. **Client-Spoofed Timestamp**: Creating `/appointment_enquiries/e1` with a past/future `createdAt` != `request.time`. -> `PERMISSION_DENIED`.
9. **Immutable `createdAt` Tampering**: Staff updates `createdAt` on an existing `/appointment_enquiries/e1`. -> `PERMISSION_DENIED`.
10. **Author UID Spoofing on Treatment Update**: Editor updates `/treatments/rhinoplasty` setting `authorUid: 'someone_else'`. -> `PERMISSION_DENIED`.
11. **Value Poisoning on Treatment Summary**: Editor updates `/treatments/rhinoplasty` with a 50,000-character `summary`. -> `PERMISSION_DENIED` (`summary.size() <= 600`).
12. **Medical History / Oversized Message Injection**: Public user submits an enquiry with a 5,000-character `message` or `privacyConsent: false`. -> `PERMISSION_DENIED`.
