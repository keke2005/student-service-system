
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { setGlobalOptions } = require("firebase-functions/v2");
const admin = require("firebase-admin");

admin.initializeApp();

setGlobalOptions({
  maxInstances: 10,
  region: "us-central1"
});

const db = admin.firestore();

exports.createStudent = onCall(
  { enforceAppCheck: false },
  async (request) => {
    // Check authentication
    if (!request.auth) {
      throw new HttpsError(
        "unauthenticated",
        "Please sign in as an administrator."
      );
    }

    // Check administrator permissions
    const adminDoc = await db
      .collection("admins")
      .doc(request.auth.uid)
      .get();

    if (
      !adminDoc.exists ||
      adminDoc.data().active !== true
    ) {
      throw new HttpsError(
        "permission-denied",
        "Only administrators can create student accounts."
      );
    }

    const { fullName, studentId, email } = request.data || {};

    const name = String(fullName || "").trim();
    const id = String(studentId || "").trim();
    const address = String(email || "").trim().toLowerCase();

    // Validate student details
    if (!/^[\p{L} ]+$/u.test(name) || name.length > 100) {
      throw new HttpsError(
        "invalid-argument",
        "Enter a valid student name."
      );
    }

    if (!/^\d{4,20}$/.test(id)) {
      throw new HttpsError(
        "invalid-argument",
        "Student ID must contain 4 to 20 digits."
      );
    }

    if (
      address.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)
    ) {
      throw new HttpsError(
        "invalid-argument",
        "Enter a valid email address."
      );
    }

    // Check for duplicate student ID
    const duplicate = await db
      .collection("users")
      .where("studentId", "==", id)
      .limit(1)
      .get();

    if (!duplicate.empty) {
      throw new HttpsError(
        "already-exists",
        "This student ID is already registered."
      );
    }

    let student;

    try {
      // Create the Firebase Authentication account
      student = await admin.auth().createUser({
        email: address,
        displayName: name,
        emailVerified: false,
        disabled: false
      });

      // Store the student profile
      await db.collection("users").doc(student.uid).set({
        fullName: name,
        studentId: id,
        email: address,
        role: "student",
        active: true,
        invitationStatus: "pending",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        createdBy: request.auth.uid
      });

      // Generate a password-setup link
      const invitationLink =
        await admin.auth().generatePasswordResetLink(address);

      // An email delivery service must send this link.
      // Do not return the link to the browser or log it.

      return {
        success: true,
        studentId: student.uid,
        invitationStatus: "pending",
        message: "Student account created. Email delivery is not configured yet."
      };
    } catch (error) {
      // Avoid leaving a partial account after a setup failure
      if (student) {
        await Promise.allSettled([
          admin.auth().deleteUser(student.uid),
          db.collection("users").doc(student.uid).delete()
        ]);
      }

      if (error.code === "auth/email-already-exists") {
        throw new HttpsError(
          "already-exists",
          "This email is already registered."
        );
      }

      if (error instanceof HttpsError) {
        throw error;
      }

      throw new HttpsError(
        "internal",
        "Could not create the student account."
      );
    }
  }
);
