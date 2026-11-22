
import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";

export default function Profile() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const editing = searchParams.get("edit") === "true";

  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [imageFailed, setImageFailed] = useState(false);

  const [formData, setFormData] = useState({
    phone: "",
    address: "",
    emergencyContact: ""
  });

  useEffect(() => {
    if (!user?.uid) return;

    const unsubscribe = onSnapshot(
      doc(db, "users", user.uid),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();

          setStudent(data);

          setFormData({
            phone: data.phone || "",
            address: data.address || "",
            emergencyContact: data.emergencyContact || ""
          });
        } else {
          setError("Student profile could not be found.");
        }

        setLoading(false);
      },
      () => {
        setError("Unable to load your profile.");
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [user?.uid]);

  function startEditing() {
    setError("");
    setSuccess("");
    setSearchParams({ edit: "true" });
  }

  function cancelEditing() {
    setFormData({
      phone: student?.phone || "",
      address: student?.address || "",
      emergencyContact: student?.emergencyContact || ""
    });

    setError("");
    setSearchParams({});
  }

  function handleChange(e) {
    const { name, value } = e.target;

    if (
      (name === "phone" || name === "emergencyContact") &&
      !/^\+?\d*$/.test(value)
    ) {
      return;
    }

    setFormData((previous) => ({
      ...previous,
      [name]: value
    }));

    setError("");
    setSuccess("");
  }

  async function handleSave(e) {
    e.preventDefault();

    if (!user || saving || !student) return;

    setError("");
    setSuccess("");

    const phonePattern = /^\+?\d{8,15}$/;

    if (!phonePattern.test(formData.phone)) {
      setError("Please enter a valid phone number.");
      return;
    }

    if (
      formData.emergencyContact &&
      !phonePattern.test(formData.emergencyContact)
    ) {
      setError("Please enter a valid emergency contact number.");
      return;
    }

    if (formData.address.trim().length > 250) {
      setError("Residential address is too long.");
      return;
    }

    setSaving(true);

    try {
      await updateDoc(doc(db, "users", user.uid), {
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        emergencyContact: formData.emergencyContact.trim()
      });

      setSuccess("Your personal information has been updated.");
      setSearchParams({});
    } catch (err) {
      console.error(err);

      setError(
        err.code === "permission-denied"
          ? "You do not have permission to update this information."
          : "Unable to save changes. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="portal-loading">
        Loading your profile...
      </div>
    );
  }

  if (!student) {
    return (
      <div className="portal-loading">
        <p>{error || "Profile unavailable."}</p>
        <Link to="/home">Return Home</Link>
      </div>
    );
  }

  const initials = (student.fullName || "Student")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((name) => name.charAt(0).toUpperCase())
    .join("");

  return (
    <main className="student-profile-page">

      <div className="profile-page-heading">
        <Link to="/home" className="back-link">
          ← Back to Home
        </Link>

        <span className="section-label">
          STUDENT ACCOUNT
        </span>

        <h1>My Profile</h1>

        <p>
          View your university information and manage
          your personal details.
        </p>
      </div>

      <div className="profile-overview">

        <div className="profile-identity">

          {user?.photoURL && !imageFailed ? (
            <img
              src={user.photoURL}
              alt="Student profile"
              className="profile-large-avatar"
              referrerPolicy="no-referrer"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <div className="profile-large-avatar">
              {initials}
            </div>
          )}

          <div className="profile-identity-info">
            <h2>{student.fullName}</h2>

            <p>{student.studentId}</p>

            <span>{student.programme}</span>

            <div className="profile-badges">
              <span className="profile-verified">
                {student.emailVerified
                  ? "✓ Verified Student"
                  : "Verification Pending"}
              </span>

              <span className="profile-active">
                {student.active ? "Active" : "Inactive"}
              </span>
            </div>
          </div>

        </div>

      </div>

      <div className="profile-content-grid">

        <section className="profile-panel">

          <div className="profile-panel-header">
            <div>
              <h2>Personal Information</h2>
              <p>Manage your contact details.</p>
            </div>

            {!editing && (
              <button
                type="button"
                className="profile-edit-btn"
                onClick={startEditing}
              >
                Edit Profile
              </button>
            )}
          </div>

          <form onSubmit={handleSave}>

            <div className="profile-fields">

              <div className="profile-field">
                <label>Full Name</label>
                <input
                  value={student.fullName || ""}
                  readOnly
                />
                <small>University registered name</small>
              </div>

              <div className="profile-field">
                <label>Email Address</label>
                <input
                  type="email"
                  value={student.email || ""}
                  readOnly
                />
                <small>Verified Google account</small>
              </div>

              <div className="profile-field">
                <label htmlFor="phone">Phone Number</label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  readOnly={!editing}
                  maxLength={16}
                  placeholder="+266"
                />
              </div>

              <div className="profile-field">
                <label htmlFor="emergencyContact">
                  Emergency Contact
                </label>

                <input
                  id="emergencyContact"
                  name="emergencyContact"
                  type="tel"
                  value={formData.emergencyContact}
                  onChange={handleChange}
                  readOnly={!editing}
                  maxLength={16}
                  placeholder="Not provided"
                />
              </div>

              <div className="profile-field profile-full-field">
                <label htmlFor="address">
                  Residential Address
                </label>

                <textarea
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  readOnly={!editing}
                  rows={3}
                  maxLength={250}
                  placeholder="Not provided"
                />
              </div>

            </div>

            {error && (
              <p className="profile-error" role="alert">
                {error}
              </p>
            )}

            {success && (
              <p className="profile-success" role="status">
                {success}
              </p>
            )}

            {editing && (
              <div className="profile-form-actions">

                <button
                  type="button"
                  className="cancel-btn"
                  onClick={cancelEditing}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="submit-btn"
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>

              </div>
            )}

          </form>

        </section>

        <section className="profile-panel">

          <div className="profile-panel-header">
            <div>
              <h2>Academic Information</h2>
              <p>Your official university records.</p>
            </div>

            <span className="profile-lock">🔒</span>
          </div>

          <div className="profile-academic-details">

            {[
              ["Student ID", student.studentId],
              ["Programme", student.programme],
              ["Department", student.department],
              [
                "Year of Study",
                student.yearOfStudy
                  ? `Year ${student.yearOfStudy}`
                  : ""
              ],
              [
                "Semester",
                student.semester
                  ? `Semester ${student.semester}`
                  : ""
              ],
              ["Campus", student.campus],
              ["Account Type", "Student"],
              [
                "Account Status",
                student.active ? "Active" : "Inactive"
              ]
            ].map(([label, value]) => (
              <div className="profile-academic-row" key={label}>
                <span>{label}</span>
                <strong>{value || "Not provided"}</strong>
              </div>
            ))}

          </div>

          <div className="profile-security-note">
            <h4>Protected University Information</h4>
            <p>
              Academic information is managed by the
              university administrator. Contact the
              administration office if any details are incorrect.
            </p>
          </div>

        </section>

      </div>

    </main>
  );
}
