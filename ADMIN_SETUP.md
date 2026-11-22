# StudentServe administrator setup

The Admin Login page is `/admin/login`. The student dashboard navigation and student login page both link to it.

## Set up an administrator (Firebase Console)

1. In **Authentication > Users**, create an email/password staff account using a real staff-owned inbox. Do not publish the credentials.
2. Sign in to the staff account once and complete Firebase email verification. (If using a Firebase Console-created account, verify the email through an appropriate trusted admin process; a user-created verified account can also be provisioned.)
3. Copy the account's Firebase **UID** from Authentication > Users.
4. In **Firestore Database > Data**, create collection `admins` and a document whose **document ID is exactly that UID**. Add a boolean field `active` with value `true`. **Only trusted Firebase project administrators** should create these documents.
5. Deploy `firestore.rules` BEFORE testing admin access: `firebase deploy --only firestore:rules`.
6. Enable **Google** sign-in in **Authentication > Sign-in method** to use the new student Google button. Add the Firebase Hosting domain to **Authorized domains** if needed.
7. Test as a normal student and as a staff member. Students must not be able to read others' requests or change status.

## Important security and deployment notes

- The `admins` collection is **not writable from the client**. Do not add an admin-registration button.
- Admin users must have verified email addresses. Google Sign-In authenticates a Google account, **not** a university student ID or university enrollment.
- Existing students can edit/delete their own requests according to the original rules. Only admins can update statuses.
- Real email notifications on request changes are **not yet implemented**. Firebase email verification is available for email/password registration.
- The project has not been deployed to your live Firebase project by this ZIP. After testing locally, run `npm run build`, `firebase deploy --only firestore:rules,hosting`.
- Before using this for real student records, obtain school authorization and review privacy, staff onboarding, audit logging, retention and abuse protection.
