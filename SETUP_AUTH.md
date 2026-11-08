# StudentServe authentication setup

1. Firebase Console → Authentication → Sign-in method: enable Email/Password.
2. Firebase Console → Authentication → Settings → Authorized domains: ensure `localhost` is authorized for local testing (add it if absent).
3. Firebase Console → Firestore Database → Rules: replace existing test-mode rules with the contents of `firestore.rules`, then click Publish. **This is required**: the React route guard alone is not data security.
4. Run `npm install`, then `npm start` and open `http://localhost:3000/login` (or the port shown in terminal).
5. Register with a test email, open its verification email, verify, then log in. Login redirects to `/services`. Direct visits to `/services`, `/services/1`, `/request/1` and `/requests` redirect to login if signed out.
6. New requests include `ownerUid`; My Requests only loads the signed-in user's records. Students may edit descriptions or delete their own requests; only university staff should manage status (staff management is not implemented in this version).

## Important
- Old requests created before login do not have `ownerUid` and will not show in My Requests. Do not relax security rules to expose them. Use new test requests.
- Existing Firestore test-mode rules must be replaced; otherwise anyone may access records even if pages require login.
- This is an academic prototype. Registering with any valid email does **not** establish university enrollment; the student ID is self-reported.
- Status management by authorized staff needs a separate staff role and secured admin interface; it is deliberately not exposed to students.
- If you get `Missing or insufficient permissions`, confirm you published the rules and verified your email.
