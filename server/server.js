
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const crypto = require("node:crypto");
const { rateLimit } = require("express-rate-limit");

const {
  initializeApp,
  applicationDefault,
  cert
} = require("firebase-admin/app");

const { getAuth } = require("firebase-admin/auth");
const { getFirestore } = require("firebase-admin/firestore");

const serviceAccountJson =
  process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

initializeApp({
  credential: serviceAccountJson
    ? cert(JSON.parse(serviceAccountJson))
    : applicationDefault()
});

const app = express();
const db = getFirestore();
const firebaseAuth = getAuth();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://student-service-system.web.app",
      "https://student-service-system.firebaseapp.com"
    ]
  })
);

app.use(express.json({ limit: "15kb" }));

function emailKey(email) {
  return crypto
    .createHash("sha256")
    .update(email.trim().toLowerCase())
    .digest("hex");
}

function sendError(res, status, message) {
  return res.status(status).json({
    success: false,
    message
  });
}

function requestError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function validName(value) {
  return /^[\p{L} ]{2,120}$/u.test(value);
}

function validGmail(value) {
  return /^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(value);
}

app.get("/api/health", async (req, res) => {
  try {
    await db.collection("admins").limit(1).get();

    return res.json({
      success: true,
      message: "StudentServe backend connected to Firebase!"
    });
  } catch (error) {
    console.error("Health check failed:", error.message);

    return sendError(
      res,
      500,
      "Firebase connection failed."
    );
  }
});

async function requireLogin(req, res, next) {
  try {
    const authorization =
      req.headers.authorization || "";

    if (!authorization.startsWith("Bearer ")) {
      return sendError(res, 401, "Please sign in.");
    }

    req.decoded = await firebaseAuth.verifyIdToken(
      authorization.substring(7),
      true
    );

    next();
  } catch (error) {
    return sendError(
      res,
      401,
      "Invalid or expired login session."
    );
  }
}

async function requireAdmin(req, res, next) {
  try {
    const adminDoc = await db
      .collection("admins")
      .doc(req.decoded.uid)
      .get();

    if (
      !adminDoc.exists ||
      adminDoc.data().active !== true
    ) {
      return sendError(
        res,
        403,
        "Administrator access denied."
      );
    }

    req.adminUid = req.decoded.uid;
    next();
  } catch (error) {
    return sendError(
      res,
      500,
      "Unable to verify administrator permissions."
    );
  }
}

const creationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false
});

const claimLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-7",
  legacyHeaders: false
});

const managementLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  standardHeaders: "draft-7",
  legacyHeaders: false
});

app.get(
  "/api/auth/role",
  requireLogin,
  async (req, res) => {
    try {
      const uid = req.decoded.uid;

      const adminDoc = await db
        .collection("admins")
        .doc(uid)
        .get();

      if (
        adminDoc.exists &&
        adminDoc.data().active === true
      ) {
        return res.json({
          success: true,
          role: "admin",
          redirect: "/admin/dashboard"
        });
      }

      const studentDoc = await db
        .collection("users")
        .doc(uid)
        .get();

      const student = studentDoc.exists
        ? studentDoc.data()
        : null;

      const email = String(
        req.decoded.email || ""
      ).toLowerCase();

      if (
        student &&
        student.role === "student" &&
        student.active === true &&
        student.emailVerified === true &&
        req.decoded.email_verified === true &&
        student.email === email
      ) {
        return res.json({
          success: true,
          role: "student",
          redirect: "/home"
        });
      }

      return sendError(
        res,
        403,
        "Your account is not approved or active."
      );
    } catch (error) {
      console.error("Role check failed:", error);

      return sendError(
        res,
        500,
        "Unable to verify account role."
      );
    }
  }
);

app.post(
  "/api/students",
  requireLogin,
  requireAdmin,
  creationLimiter,
  async (req, res) => {
    const fullName = String(
      req.body.fullName || ""
    ).trim();

    const studentId = String(
      req.body.studentId || ""
    ).trim();

    const email = String(
      req.body.email || ""
    ).trim().toLowerCase();

    const programme = String(
      req.body.programme || ""
    ).trim();

    const department = String(
      req.body.department || ""
    ).trim();

    const phone = String(
      req.body.phone || ""
    ).trim();

    const yearOfStudy = Number(
      req.body.yearOfStudy
    );

    const semester = Number(
      req.body.semester
    );

    if (
      !validName(fullName) ||
      !/^\d{4,20}$/.test(studentId) ||
      !validGmail(email)
    ) {
      return sendError(
        res,
        400,
        "Enter a valid name, student ID and Gmail address."
      );
    }

    if (
      !programme ||
      programme.length > 120 ||
      !department ||
      department.length > 120 ||
      !Number.isInteger(yearOfStudy) ||
      yearOfStudy < 1 ||
      yearOfStudy > 4 ||
      ![1, 2].includes(semester) ||
      (phone && !/^\d{7,15}$/.test(phone))
    ) {
      return sendError(
        res,
        400,
        "Enter valid academic and contact details."
      );
    }

    const key = emailKey(email);

    const pendingRef = db
      .collection("pendingStudents")
      .doc(key);

    const studentIdRef = db
      .collection("studentIds")
      .doc(studentId);

    const emailRef = db
      .collection("studentEmails")
      .doc(key);

    try {
      await db.runTransaction(async (transaction) => {
        const [pendingDoc, idDoc, emailDoc] =
          await transaction.getAll(
            pendingRef,
            studentIdRef,
            emailRef
          );

        if (
          pendingDoc.exists ||
          idDoc.exists ||
          emailDoc.exists
        ) {
          throw requestError(
            "Student ID or Gmail address is already registered.",
            409
          );
        }

        const student = {
          fullName,
          studentId,
          email,
          programme,
          department,
          yearOfStudy,
          semester,
          phone,
          role: "student",
          active: false,
          invitationStatus: "pending_verification",
          createdBy: req.adminUid,
          createdAt: new Date().toISOString()
        };

        transaction.create(pendingRef, student);

        transaction.create(studentIdRef, {
          emailKey: key,
          status: "pending_verification"
        });

        transaction.create(emailRef, {
          studentId,
          status: "pending_verification"
        });
      });

      return res.status(201).json({
        success: true,
        message:
          "Student registered. They can activate their account using verified Google Sign-In or a verified email/password account."
      });
    } catch (error) {
      console.error(
        "Student registration failed:",
        error.message
      );

      return sendError(
        res,
        error.statusCode || 500,
        error.statusCode
          ? error.message
          : "Unable to register student."
      );
    }
  }
);

app.post(
  "/api/students/activate",
  requireLogin,
  claimLimiter,
  async (req, res) => {
    const decoded = req.decoded;

    const email = String(
      decoded.email || ""
    ).trim().toLowerCase();

    const provider =
      decoded.firebase?.sign_in_provider;

    if (
      decoded.email_verified !== true ||
      !validGmail(email) ||
      !["google.com", "password"].includes(provider)
    ) {
      return sendError(
        res,
        403,
        "Please verify your Gmail address before activating your account."
      );
    }

    const key = emailKey(email);

    const pendingRef = db
      .collection("pendingStudents")
      .doc(key);

    const userRef = db
      .collection("users")
      .doc(decoded.uid);

    const emailRef = db
      .collection("studentEmails")
      .doc(key);

    const adminRef = db
      .collection("admins")
      .doc(decoded.uid);

    try {
      const result = await db.runTransaction(
        async (transaction) => {
          const [
            adminDoc,
            pendingDoc,
            userDoc,
            emailDoc
          ] = await transaction.getAll(
            adminRef,
            pendingRef,
            userRef,
            emailRef
          );

          if (adminDoc.exists) {
            throw requestError(
              "Administrator accounts do not require student activation.",
              403
            );
          }

          if (userDoc.exists) {
            const student = userDoc.data();

            if (
              student.role !== "student" ||
              student.email !== email ||
              student.active !== true ||
              student.emailVerified !== true
            ) {
              throw requestError(
                "Student access denied.",
                403
              );
            }

            return student;
          }

          if (
            !pendingDoc.exists ||
            !emailDoc.exists ||
            ![
              "pending_google",
              "pending_verification"
            ].includes(emailDoc.data().status)
          ) {
            throw requestError(
              "No approved student registration found for this Gmail address.",
              403
            );
          }

          const student = pendingDoc.data();

          if (
            student.email !== email ||
            student.role !== "student" ||
            student.active !== false ||
            ![
              "pending_google",
              "pending_verification"
            ].includes(student.invitationStatus) ||
            emailDoc.data().studentId !== student.studentId
          ) {
            throw requestError(
              "Student registration is not eligible.",
              403
            );
          }

          const idRef = db
            .collection("studentIds")
            .doc(student.studentId);

          const idDoc = await transaction.get(idRef);

          if (
            !idDoc.exists ||
            idDoc.data().emailKey !== key ||
            ![
              "pending_google",
              "pending_verification"
            ].includes(idDoc.data().status)
          ) {
            throw requestError(
              "Student ID reservation is invalid.",
              403
            );
          }

          const activated = {
            ...student,
            uid: decoded.uid,
            active: true,
            emailVerified: true,
            invitationStatus: "activated",
            authProvider: provider,
            activatedAt: new Date().toISOString()
          };

          transaction.create(userRef, activated);

          transaction.update(emailRef, {
            status: "activated",
            uid: decoded.uid
          });

          transaction.update(idRef, {
            status: "activated",
            uid: decoded.uid
          });

          transaction.delete(pendingRef);

          return activated;
        }
      );

      return res.json({
        success: true,
        message: "Student account verified successfully.",
        student: {
          uid: decoded.uid,
          fullName: result.fullName,
          studentId: result.studentId,
          email: result.email,
          programme: result.programme,
          department: result.department,
          yearOfStudy: result.yearOfStudy,
          semester: result.semester
        }
      });
    } catch (error) {
      console.error(
        "Student activation failed:",
        error.message
      );

      return sendError(
        res,
        error.statusCode || 500,
        error.statusCode
          ? error.message
          : "Unable to verify student account."
      );
    }
  }
);

app.patch(
  "/api/students/:uid",
  requireLogin,
  requireAdmin,
  managementLimiter,
  async (req, res) => {
    const uid = req.params.uid;

    const allowedFields = [
      "fullName",
      "programme",
      "department",
      "yearOfStudy",
      "semester"
    ];

    const receivedFields = Object.keys(
      req.body || {}
    );

    if (
      receivedFields.length === 0 ||
      receivedFields.some(
        (field) => !allowedFields.includes(field)
      )
    ) {
      return sendError(
        res,
        400,
        "Only approved academic information can be edited."
      );
    }

    const updates = {};

    for (const field of receivedFields) {
      const value = req.body[field];

      if (
        field === "yearOfStudy" ||
        field === "semester"
      ) {
        const number = Number(value);

        if (
          value === null ||
          value === "" ||
          typeof value === "boolean" ||
          !Number.isInteger(number)
        ) {
          return sendError(
            res,
            400,
            `Invalid ${field}.`
          );
        }

        updates[field] = number;
      } else {
        if (typeof value !== "string") {
          return sendError(
            res,
            400,
            `Invalid ${field}.`
          );
        }

        updates[field] = value.trim();
      }
    }

    if (
      updates.fullName !== undefined &&
      !validName(updates.fullName)
    ) {
      return sendError(
        res,
        400,
        "Enter a valid student name."
      );
    }

    for (const field of [
      "programme",
      "department"
    ]) {
      if (
        updates[field] !== undefined &&
        (
          updates[field].length === 0 ||
          updates[field].length > 120
        )
      ) {
        return sendError(
          res,
          400,
          `Enter a valid ${field}.`
        );
      }
    }

    if (
      updates.yearOfStudy !== undefined &&
      (
        updates.yearOfStudy < 1 ||
        updates.yearOfStudy > 4
      )
    ) {
      return sendError(
        res,
        400,
        "Year of study must be between 1 and 4."
      );
    }

    if (
      updates.semester !== undefined &&
      ![1, 2].includes(updates.semester)
    ) {
      return sendError(
        res,
        400,
        "Semester must be 1 or 2."
      );
    }

    try {
      const studentRef = db
        .collection("users")
        .doc(uid);

      let updatedStudent;

      await db.runTransaction(async (transaction) => {
        const studentDoc =
          await transaction.get(studentRef);

        if (!studentDoc.exists) {
          throw requestError(
            "Student account not found.",
            404
          );
        }

        const student = studentDoc.data();

        if (student.role !== "student") {
          throw requestError(
            "The selected account is not a student.",
            403
          );
        }

        const changes = {
          ...updates,
          updatedAt: new Date().toISOString(),
          updatedBy: req.adminUid
        };

        transaction.update(studentRef, changes);

        updatedStudent = {
          ...student,
          ...changes
        };
      });

      return res.json({
        success: true,
        message: "Student information updated successfully.",
        student: {
          uid,
          fullName: updatedStudent.fullName,
          studentId: updatedStudent.studentId,
          email: updatedStudent.email,
          programme: updatedStudent.programme,
          department: updatedStudent.department,
          yearOfStudy: updatedStudent.yearOfStudy,
          semester: updatedStudent.semester,
          active: updatedStudent.active
        }
      });
    } catch (error) {
      console.error(
        "Student update failed:",
        error.message
      );

      return sendError(
        res,
        error.statusCode || 500,
        error.statusCode
          ? error.message
          : "Unable to update student information."
      );
    }
  }
);

app.patch(
  "/api/students/:uid/status",
  requireLogin,
  requireAdmin,
  managementLimiter,
  async (req, res) => {
    const uid = req.params.uid;

    if (
      !req.body ||
      Object.keys(req.body).length !== 1 ||
      typeof req.body.active !== "boolean"
    ) {
      return sendError(
        res,
        400,
        "Account status must be true or false."
      );
    }

    const active = req.body.active;

    try {
      const studentRef = db
        .collection("users")
        .doc(uid);

      await db.runTransaction(async (transaction) => {
        const studentDoc =
          await transaction.get(studentRef);

        if (!studentDoc.exists) {
          throw requestError(
            "Student account not found.",
            404
          );
        }

        const student = studentDoc.data();

        if (student.role !== "student") {
          throw requestError(
            "Only student accounts can be managed.",
            403
          );
        }

        if (
          student.invitationStatus !== "activated" ||
          student.emailVerified !== true
        ) {
          throw requestError(
            "This student account has not completed verification.",
            409
          );
        }

        transaction.update(studentRef, {
          active,
          statusUpdatedAt: new Date().toISOString(),
          statusUpdatedBy: req.adminUid
        });
      });

      return res.json({
        success: true,
        message: active
          ? "Student account reactivated successfully."
          : "Student account deactivated successfully.",
        student: {
          uid,
          active
        }
      });
    } catch (error) {
      console.error(
        "Student status update failed:",
        error.message
      );

      return sendError(
        res,
        error.statusCode || 500,
        error.statusCode
          ? error.message
          : "Unable to update student account status."
      );
    }
  }
);

app.listen(PORT, "0.0.0.0", () => {
  console.log(
    `StudentServe backend running on port ${PORT}`
  );
});
