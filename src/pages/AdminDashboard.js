
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc
} from "firebase/firestore";
import { signOut } from "firebase/auth";
import { httpsCallable } from "firebase/functions";
import { auth, db, functions } from "../firebase";

import { useAuth } from "../context/AuthContext";
import ThemeToggle from "../components/ThemeToggle";
const API_URL = process.env.REACT_APP_API_URL;

const statuses = [
  "Pending",
  "In Progress",
  "Approved",
  "Rejected",
  "Completed"
];

const years = [1, 2, 3, 4];

const emptyForm = {
  fullName: "",
  studentId: "",
  email: "",
  phone: "",
  programme: "",
  department: "",
  yearOfStudy: "",
  semester: ""
};

const menuItems = [
  {
    id: "overview",
    label: "Dashboard Overview",
    icon: "▦"
  },
  {
    id: "requests",
    label: "Request Management",
    icon: "☷"
  },
  {
    id: "create",
    label: "Create Student Account",
    icon: "+"
  },
  {
    id: "students",
    label: "Registered Students",
    icon: "♙"
  }
];

function Detail({ label, value }) {
  return (
    <div className="profile-academic-row">
      <span>{label}</span>
      <strong>
        {value === undefined ||
        value === null ||
        value === ""
          ? "Not provided"
          : value}
      </strong>
    </div>
  );
}

function FormField({
  label,
  name,
  value,
  onChange,
  placeholder = "",
  type = "text",
  required = true,
  maxLength,
  inputMode,
  id
}) {
  return (
    <div className="form-group">
      <label htmlFor={id || name}>{label}</label>
      <input
        id={id || name}
        name={name}
        type={type}
        value={value ?? ""}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        maxLength={maxLength}
        inputMode={inputMode}
      />
    </div>
  );
}

function AcademicSelects({
  data,
  onChange,
  prefix = ""
}) {
  return (
    <div className="form-row">
      <div className="form-group">
        <label htmlFor={`${prefix}yearOfStudy`}>
          Year of Study
        </label>

        <select
          id={`${prefix}yearOfStudy`}
          name="yearOfStudy"
          value={data.yearOfStudy ?? ""}
          onChange={onChange}
          required
        >
          <option value="">Select year</option>

          {years.map((year) => (
            <option key={year} value={year}>
              Year {year}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label htmlFor={`${prefix}semester`}>
          Semester
        </label>

        <select
          id={`${prefix}semester`}
          name="semester"
          value={data.semester ?? ""}
          onChange={onChange}
          required
        >
          <option value="">Select semester</option>
          <option value="1">Semester 1</option>
          <option value="2">Semester 2</option>
        </select>
      </div>
    </div>
  );
}

function validAcademicData(data) {
  return (
    /^[\p{L} ]{2,120}$/u.test(data.fullName) &&
    [data.programme, data.department].every(
      (value) =>
        typeof value === "string" &&
        value.length > 0 &&
        value.length <= 120
    ) &&
    Number.isInteger(data.yearOfStudy) &&
    data.yearOfStudy >= 1 &&
    data.yearOfStudy <= 4 &&
    [1, 2].includes(data.semester)
  );
}

function MetricCard({ label, value }) {
  return (
    <div className="admin-metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export default function AdminDashboard({
  theme = "dark",
  toggleTheme = () => {}
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const profileRef = useRef(null);

  const [page, setPage] = useState("overview");

  const [requests, setRequests] = useState([]);
  const [students, setStudents] = useState([]);

  const [requestsLoading, setRequestsLoading] =
    useState(true);

  const [studentsLoading, setStudentsLoading] =
    useState(true);

  const [requestError, setRequestError] = useState("");
  const [studentLoadError, setStudentLoadError] =
    useState("");

  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [studentSearch, setStudentSearch] =
    useState("");

  const [busyRequest, setBusyRequest] = useState("");

  const [formData, setFormData] = useState({
    ...emptyForm
  });

  const [creating, setCreating] = useState(false);
  const [studentError, setStudentError] = useState("");
  const [studentSuccess, setStudentSuccess] =
    useState("");

  const [selectedStudentId, setSelectedStudentId] =
    useState(null);

  const [editingStudent, setEditingStudent] =
    useState(false);

  const [editForm, setEditForm] = useState({});

  const [managementBusy, setManagementBusy] =
    useState(false);

  const [managementError, setManagementError] =
    useState("");

  const [managementSuccess, setManagementSuccess] =
    useState("");

  // LOAD REQUESTS
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "requests"),
      (snapshot) => {
        const data = snapshot.docs.map((item) => ({
          ...item.data(),
          id: item.id
        }));

        data.sort((a, b) =>
          String(b.requestDate || "").localeCompare(
            String(a.requestDate || "")
          )
        );

        setRequests(data);
        setRequestsLoading(false);
        setRequestError("");
      },
      () => {
        setRequestsLoading(false);
        setRequestError("Unable to load requests.");
      }
    );

    return unsubscribe;
  }, []);

  // LOAD STUDENTS
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "users"),
      (snapshot) => {
        const data = snapshot.docs
          .map((item) => ({
            ...item.data(),
            id: item.id
          }))
          .filter((item) => item.role === "student");

        data.sort((a, b) =>
          String(a.fullName || "").localeCompare(
            String(b.fullName || "")
          )
        );

        setStudents(data);
        setStudentsLoading(false);
        setStudentLoadError("");
      },
      () => {
        setStudentsLoading(false);
        setStudentLoadError("Unable to load students.");
      }
    );

    return unsubscribe;
  }, []);

  // FILTER REQUESTS
  const shownRequests = useMemo(() => {
    const query = search.toLowerCase().trim();

    return requests.filter((item) => {
      const matchesStatus =
        filter === "All" || item.status === filter;

      const matchesSearch = [
        item.studentName,
        item.studentId,
        item.email,
        item.serviceName,
        item.id
      ].some((value) =>
        String(value || "")
          .toLowerCase()
          .includes(query)
      );

      return matchesStatus && matchesSearch;
    });
  }, [requests, filter, search]);

  // FILTER STUDENTS
  const shownStudents = useMemo(() => {
    const query = studentSearch.toLowerCase().trim();

    return students.filter((student) =>
      [
        student.fullName,
        student.studentId,
        student.email,
        student.programme,
        student.department,
        student.phone
      ].some((value) =>
        String(value || "")
          .toLowerCase()
          .includes(query)
      )
    );
  }, [students, studentSearch]);

  const selectedStudent = students.find(
    (student) => student.id === selectedStudentId
  );

  // STATISTICS
  const totalStudents = students.length;

  const activeStudents = students.filter(
    (student) => student.active === true
  ).length;

  const inactiveStudents =
    totalStudents - activeStudents;

  const verifiedStudents = students.filter(
    (student) => student.emailVerified === true
  ).length;

  const pendingRequests = requests.filter(
    (item) => item.status === "Pending"
  ).length;

  const inProgressRequests = requests.filter(
    (item) => item.status === "In Progress"
  ).length;

  const completedRequests = requests.filter(
    (item) => item.status === "Completed"
  ).length;

  // SIDEBAR NAVIGATION
  function changePage(nextPage) {
    setPage(nextPage);
    setSelectedStudentId(null);
    setEditingStudent(false);
    setManagementError("");
    setManagementSuccess("");

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }

  useEffect(() => {
    if (
      page === "students" &&
      selectedStudentId &&
      profileRef.current
    ) {
      profileRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }
  }, [page, selectedStudentId]);

  function viewStudent(student) {
    setEditingStudent(false);
    setManagementError("");
    setManagementSuccess("");

    if (selectedStudentId === student.id) {
      profileRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
      return;
    }

    setSelectedStudentId(student.id);
  }

  function closeStudentProfile() {
    setSelectedStudentId(null);
    setEditingStudent(false);
    setManagementError("");
    setManagementSuccess("");

    document
      .getElementById("registered-students")
      ?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
  }

  // FORM INPUTS
  function handleChange(event) {
    const { name, value } = event.target;

    let cleaned = value;

    if (name === "fullName") {
      cleaned = value.replace(/[^\p{L} ]/gu, "");
    }

    if (name === "studentId" || name === "phone") {
      cleaned = value.replace(/\D/g, "");
    }

    setFormData((previous) => ({
      ...previous,
      [name]: cleaned
    }));

    setStudentError("");
    setStudentSuccess("");
  }

  function handleEditChange(event) {
    const { name, value } = event.target;

    const cleaned =
      name === "fullName"
        ? value.replace(/[^\p{L} ]/gu, "")
        : value;

    setEditForm((previous) => ({
      ...previous,
      [name]: cleaned
    }));
  }

  // BACKEND REQUEST
  async function apiRequest(path, method, payload) {
    if (!auth.currentUser) {
      throw new Error("Please sign in again.");
    }

    const token =
      await auth.currentUser.getIdToken();

    const response = await fetch(
      `${API_URL}${path}`,
      {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      }
    );

    const result = await response
      .json()
      .catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        result.message || "Operation failed."
      );
    }

    return result;
  }

  
  // CREATE STUDENT
  async function createStudent(event) {
    event.preventDefault();

    if (creating) return;

    setStudentError("");
    setStudentSuccess("");

    const payload = {
      fullName: formData.fullName.trim(),
      studentId: formData.studentId.trim(),
      email: formData.email.trim().toLowerCase(),
      phone: formData.phone.trim(),
      programme: formData.programme.trim(),
      department: formData.department.trim(),
      yearOfStudy: Number(formData.yearOfStudy),
      semester: Number(formData.semester)
    };

    if (!validAcademicData(payload)) {
      setStudentError("Enter valid academic information.");
      return;
    }

    if (!/^\d{4,20}$/.test(payload.studentId)) {
      setStudentError(
        "Student ID must contain 4 to 20 digits."
      );
      return;
    }

    if (
      !/^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(
        payload.email
      )
    ) {
      setStudentError("Enter a valid Gmail address.");
      return;
    }

    if (
      payload.phone &&
      !/^\d{7,15}$/.test(payload.phone)
    ) {
      setStudentError("Enter a valid phone number.");
      return;
    }

    setCreating(true);

    try {
      const registerStudent = httpsCallable(
        functions,
        "createStudent"
      );

      const response = await registerStudent(payload);
      const result = response.data;

      setStudentSuccess(
        result.message ||
          "Student account created successfully."
      );

      setFormData({ ...emptyForm });
    } catch (error) {
      console.error("Student registration error:", error);

      const messages = {
        "functions/unauthenticated":
          "Please sign in as an administrator.",
        "functions/permission-denied":
          "Only administrators can register students.",
        "functions/already-exists":
          "This student ID or email is already registered.",
        "functions/invalid-argument":
          "Please check the student information.",
        "functions/not-found":
          "Student registration is not deployed yet.",
        "functions/unavailable":
          "The registration service is unavailable."
      };

      setStudentError(
        messages[error.code] ||
          error.message ||
          "Could not create the student account."
      );
    } finally {
      setCreating(false);
    }
  }


  // UPDATE REQUEST STATUS
  async function changeRequestStatus(item, status) {
    setBusyRequest(item.id);
    setRequestError("");

    try {
      await updateDoc(
        doc(db, "requests", item.id),
        { status }
      );
    } catch {
      setRequestError(
        "Could not update request status."
      );
    } finally {
      setBusyRequest("");
    }
  }

  // EDIT STUDENT
  function beginEditStudent() {
    if (!selectedStudent) return;

    setEditForm({
      fullName: selectedStudent.fullName || "",
      programme: selectedStudent.programme || "",
      department: selectedStudent.department || "",
      yearOfStudy: String(
        selectedStudent.yearOfStudy || ""
      ),
      semester: String(
        selectedStudent.semester || ""
      )
    });

    setManagementError("");
    setManagementSuccess("");
    setEditingStudent(true);
  }

  async function saveStudentEdit(event) {
    event.preventDefault();

    if (!selectedStudent || managementBusy) return;

    const payload = {
      fullName: String(
        editForm.fullName || ""
      ).trim(),
      programme: String(
        editForm.programme || ""
      ).trim(),
      department: String(
        editForm.department || ""
      ).trim(),
      yearOfStudy: Number(editForm.yearOfStudy),
      semester: Number(editForm.semester)
    };

    if (!validAcademicData(payload)) {
      setManagementError(
        "Enter valid student information."
      );
      return;
    }

    setManagementBusy(true);
    setManagementError("");
    setManagementSuccess("");

    try {
      const result = await apiRequest(
        `/api/students/${encodeURIComponent(
          selectedStudent.id
        )}`,
        "PATCH",
        payload
      );

      setEditingStudent(false);

      setManagementSuccess(
        result.message ||
          "Student updated successfully."
      );
    } catch (error) {
      setManagementError(error.message);
    } finally {
      setManagementBusy(false);
    }
  }

  // ACTIVATE / DEACTIVATE
  async function toggleStudentStatus() {
    if (!selectedStudent || managementBusy) return;

    const nextActive = !selectedStudent.active;

    const confirmed = window.confirm(
      `Are you sure you want to ${
        nextActive ? "reactivate" : "deactivate"
      } ${selectedStudent.fullName}?`
    );

    if (!confirmed) return;

    setManagementBusy(true);
    setManagementError("");
    setManagementSuccess("");

    try {
      const result = await apiRequest(
        `/api/students/${encodeURIComponent(
          selectedStudent.id
        )}/status`,
        "PATCH",
        { active: nextActive }
      );

      setManagementSuccess(
        result.message ||
          "Account status updated."
      );
    } catch (error) {
      setManagementError(error.message);
    } finally {
      setManagementBusy(false);
    }
  }

  // LOGOUT
  async function logout() {
    try {
      await signOut(auth);

      navigate("/admin/login", {
        replace: true
      });
    } catch {
      window.alert("Unable to sign out.");
    }
  }

  const actionStyle = {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    marginTop: 20
  };

  const currentPage = menuItems.find(
    (item) => item.id === page
  );

  return (
    <main className="admin-layout">
      {/* SIDEBAR */}
      <aside className="admin-sidebar">
        <Link
          to="/admin/dashboard"
          className="admin-identity"
          onClick={() => changePage("overview")}
        >
          <img
            src="/images/LIMKOS.png"
            alt="Limkokwing University"
          />

          <span>
            <strong>StudentServe</strong>
            <small>STAFF WORKSPACE</small>
          </span>
        </Link>

        <div className="admin-side-section">
          WORKSPACE
        </div>

        <nav
          className="admin-sidebar-menu"
          aria-label="Administrator navigation"
        >
          {menuItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={
                page === item.id
                  ? "admin-side-active"
                  : "admin-side-link"
              }
              onClick={() => changePage(item.id)}
              aria-current={
                page === item.id ? "page" : undefined
              }
            >
              <span
                className="admin-menu-icon"
                aria-hidden="true"
              >
                {item.icon}
              </span>

              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="admin-theme-section">
          <span className="admin-theme-label">
            APPEARANCE
          </span>

          <ThemeToggle
            theme={theme}
            toggleTheme={toggleTheme}
          />
        </div>

        <button
          type="button"
          className="admin-signout"
          onClick={logout}
        >
          Sign Out
        </button>
      </aside>

      {/* MAIN CONTENT */}
      <section className="admin-main">
        <header className="admin-top">
          <div>
            <span className="staff-kicker">
              UNIVERSITY ADMINISTRATION
            </span>

            <h1>
              {currentPage?.label ||
                "Admin Dashboard"}
            </h1>
          </div>

          <div className="admin-account">
            {user?.email}
          </div>
        </header>

        {/* DASHBOARD OVERVIEW */}
        {page === "overview" && (
          <div className="admin-dashboard-overview">
            <div className="admin-metrics">
              <MetricCard
                label="Total Students"
                value={totalStudents}
              />

              <MetricCard
                label="Active Students"
                value={activeStudents}
              />

              <MetricCard
                label="Total Requests"
                value={requests.length}
              />

              <MetricCard
                label="Pending Requests"
                value={pendingRequests}
              />
            </div>

            <section className="admin-request-panel">
              <div className="admin-panel-heading">
                <h2>Quick Actions</h2>
              </div>

              <div className="admin-quick-actions">
                <button
                  type="button"
                  className="primary-btn"
                  onClick={() => changePage("create")}
                >
                  + Create Student Account
                </button>

                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() =>
                    changePage("students")
                  }
                >
                  View Registered Students
                </button>

                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() =>
                    changePage("requests")
                  }
                >
                  Manage Requests
                </button>
              </div>
            </section>

            <section
              className="admin-request-panel"
              style={{ marginTop: 20 }}
            >
              <div className="admin-panel-heading">
                <h2>System Summary</h2>
              </div>

              <div className="admin-summary-grid">
                <div>
                  <span>Verified Students</span>
                  <strong>{verifiedStudents}</strong>
                </div>

                <div>
                  <span>Inactive Students</span>
                  <strong>{inactiveStudents}</strong>
                </div>

                <div>
                  <span>In Progress</span>
                  <strong>{inProgressRequests}</strong>
                </div>

                <div>
                  <span>Completed Requests</span>
                  <strong>{completedRequests}</strong>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* REQUEST MANAGEMENT */}
        {page === "requests" && (
          <>
            <div className="admin-metrics">
              <MetricCard
                label="Total Requests"
                value={requests.length}
              />

              <MetricCard
                label="Pending"
                value={pendingRequests}
              />

              <MetricCard
                label="In Progress"
                value={inProgressRequests}
              />

              <MetricCard
                label="Completed"
                value={completedRequests}
              />
            </div>

            <section className="admin-request-panel">
              <div className="admin-panel-heading">
                <h2>Student Requests</h2>

                <div className="admin-filters">
                  <input
                    aria-label="Search requests"
                    placeholder="Search requests"
                    value={search}
                    onChange={(event) =>
                      setSearch(event.target.value)
                    }
                  />

                  <select
                    aria-label="Filter requests"
                    value={filter}
                    onChange={(event) =>
                      setFilter(event.target.value)
                    }
                  >
                    <option value="All">
                      All Statuses
                    </option>

                    {statuses.map((status) => (
                      <option
                        key={status}
                        value={status}
                      >
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {requestError && (
                <p
                  className="staff-error"
                  role="alert"
                >
                  {requestError}
                </p>
              )}

              {requestsLoading ? (
                <p className="admin-empty">
                  Loading requests...
                </p>
              ) : shownRequests.length === 0 ? (
                <p className="admin-empty">
                  No requests found.
                </p>
              ) : (
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Student</th>
                        <th>Service</th>
                        <th>Submitted</th>
                        <th>Details</th>
                        <th>Status</th>
                      </tr>
                    </thead>

                    <tbody>
                      {shownRequests.map((item) => (
                        <tr key={item.id}>
                          <td>
                            <strong>
                              {item.studentName ||
                                "Unknown"}
                            </strong>

                            <small>
                              {item.studentId ||
                                "No ID"}
                            </small>

                            <small>
                              {item.email}
                            </small>
                          </td>

                          <td>
                            {item.serviceName}
                          </td>

                          <td>
                            {item.requestDate || "—"}
                          </td>

                          <td className="admin-description">
                            {item.description}
                          </td>

                          <td>
                            <select
                              aria-label={`Status for ${
                                item.studentName ||
                                "student"
                              }`}
                              value={
                                item.status ||
                                "Pending"
                              }
                              disabled={
                                busyRequest === item.id
                              }
                              onChange={(event) =>
                                changeRequestStatus(
                                  item,
                                  event.target.value
                                )
                              }
                            >
                              {statuses.map(
                                (status) => (
                                  <option
                                    key={status}
                                    value={status}
                                  >
                                    {status}
                                  </option>
                                )
                              )}
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}

        {/* CREATE STUDENT */}
        {page === "create" && (
          <section className="admin-request-panel">
            <div className="admin-panel-heading">
              <h2>Student Registration</h2>
            </div>

            <form
              className="admin-student-form"
              style={{ maxWidth: "100%" }}
              onSubmit={createStudent}
            >
              <div className="form-row">
                <FormField
                  label="Full Name"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Student full name"
                  maxLength={120}
                />

                <FormField
                  label="Student ID"
                  name="studentId"
                  value={formData.studentId}
                  onChange={handleChange}
                  placeholder="Student ID number"
                  inputMode="numeric"
                  maxLength={30}
                />
              </div>

              <div className="form-row">
                <FormField
                  label="Gmail Address"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="student@gmail.com"
                />

                <FormField
                  label="Phone Number (optional)"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Digits only"
                  required={false}
                  maxLength={15}
                />
              </div>

              <div className="form-row">
                <FormField
                  label="Programme / Course"
                  name="programme"
                  value={formData.programme}
                  onChange={handleChange}
                  placeholder="Programme"
                  maxLength={120}
                />

                <FormField
                  label="Department"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  placeholder="Department"
                  maxLength={120}
                />
              </div>

              <AcademicSelects
                data={formData}
                onChange={handleChange}
              />

              {studentError && (
                <p
                  className="staff-error"
                  role="alert"
                >
                  {studentError}
                </p>
              )}

              {studentSuccess && (
                <p
                  className="student-success"
                  role="status"
                >
                  {studentSuccess}
                </p>
              )}

              <div className="admin-form-actions">
                <button
                  type="submit"
                  className="student-login-submit"
                  disabled={creating}
                >
                  {creating
                    ? "Creating Account..."
                    : "Register Student"}
                </button>

                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() =>
                    changePage("students")
                  }
                >
                  View Registered Students
                </button>
              </div>
            </form>
          </section>
        )}

        {/* REGISTERED STUDENTS */}
        {page === "students" && (
          <>
            <div className="admin-metrics">
              <MetricCard
                label="Total Students"
                value={totalStudents}
              />

              <MetricCard
                label="Active Students"
                value={activeStudents}
              />

              <MetricCard
                label="Inactive Students"
                value={inactiveStudents}
              />

              <MetricCard
                label="Verified Students"
                value={verifiedStudents}
              />
            </div>

            <section
              id="registered-students"
              className="admin-request-panel"
            >
              <div className="admin-panel-heading">
                <h2>Student Records</h2>

                <div className="admin-filters">
                  <input
                    aria-label="Search students"
                    placeholder="Search students"
                    value={studentSearch}
                    onChange={(event) =>
                      setStudentSearch(
                        event.target.value
                      )
                    }
                  />

                  <button
                    type="button"
                    className="primary-btn"
                    onClick={() =>
                      changePage("create")
                    }
                  >
                    + Add Student
                  </button>
                </div>
              </div>

              {studentLoadError ? (
                <p
                  className="staff-error"
                  role="alert"
                >
                  {studentLoadError}
                </p>
              ) : studentsLoading ? (
                <p className="admin-empty">
                  Loading students...
                </p>
              ) : shownStudents.length === 0 ? (
                <p className="admin-empty">
                  No students found.
                </p>
              ) : (
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Student</th>
                        <th>Student ID</th>
                        <th>Programme</th>
                        <th>Phone</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>

                    <tbody>
                      {shownStudents.map(
                        (student) => (
                          <tr key={student.id}>
                            <td>
                              <strong>
                                {student.fullName}
                              </strong>

                              <small>
                                {student.email}
                              </small>
                            </td>

                            <td>
                              {student.studentId}
                            </td>

                            <td>
                              {student.programme ||
                                "—"}

                              <small>
                                {student.yearOfStudy
                                  ? `Year ${student.yearOfStudy}`
                                  : "—"}
                                {" / "}
                                {student.semester
                                  ? `Sem ${student.semester}`
                                  : "—"}
                              </small>
                            </td>

                            <td>
                              {student.phone ||
                                "Not provided"}
                            </td>

                            <td>
                              <span
                                className={
                                  student.active
                                    ? "admin-status-active"
                                    : "admin-status-inactive"
                                }
                              >
                                {student.active
                                  ? "Active"
                                  : "Inactive"}
                              </span>
                            </td>

                            <td>
                              <button
                                type="button"
                                className="profile-edit-btn"
                                onClick={() =>
                                  viewStudent(
                                    student
                                  )
                                }
                              >
                                View Profile
                              </button>
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* STUDENT PROFILE */}
            {selectedStudent && (
              <section
                id="admin-student-profile"
                ref={profileRef}
                tabIndex={-1}
                className="admin-request-panel"
                style={{
                  marginTop: 20,
                  scrollMarginTop: 20
                }}
              >
                <div className="admin-panel-heading">
                  <h2>Student Profile</h2>

                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={
                      closeStudentProfile
                    }
                    disabled={managementBusy}
                  >
                    Close Profile
                  </button>
                </div>

                <div className="profile-overview">
                  <div className="profile-identity">
                    <div className="profile-large-avatar">
                      {(
                        selectedStudent.fullName ||
                        "Student"
                      )
                        .trim()
                        .split(/\s+/)
                        .slice(0, 2)
                        .map((name) =>
                          name
                            .charAt(0)
                            .toUpperCase()
                        )
                        .join("")}
                    </div>

                    <div className="profile-identity-info">
                      <h2>
                        {selectedStudent.fullName}
                      </h2>

                      <p>
                        {selectedStudent.studentId}
                      </p>

                      <span>
                        {selectedStudent.programme}
                      </span>

                      <div className="profile-badges">
                        <span className="profile-verified">
                          {selectedStudent.emailVerified
                            ? "✓ Verified"
                            : "Not Verified"}
                        </span>

                        <span
                          className={
                            selectedStudent.active
                              ? "admin-status-active"
                              : "admin-status-inactive"
                          }
                        >
                          {selectedStudent.active
                            ? "Active"
                            : "Inactive"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="profile-content-grid">
                  <section className="profile-panel">
                    <div className="profile-panel-header">
                      <h2>
                        Personal Information
                      </h2>
                    </div>

                    <div className="profile-academic-details">
                      <Detail
                        label="Full Name"
                        value={
                          selectedStudent.fullName
                        }
                      />

                      <Detail
                        label="Email"
                        value={
                          selectedStudent.email
                        }
                      />

                      <Detail
                        label="Phone"
                        value={
                          selectedStudent.phone
                        }
                      />

                      <Detail
                        label="Emergency Contact"
                        value={
                          selectedStudent.emergencyContact
                        }
                      />

                      <Detail
                        label="Address"
                        value={
                          selectedStudent.address
                        }
                      />
                    </div>
                  </section>

                  <section className="profile-panel">
                    <div className="profile-panel-header">
                      <h2>
                        Academic Information
                      </h2>
                    </div>

                    <div className="profile-academic-details">
                      <Detail
                        label="Student ID"
                        value={
                          selectedStudent.studentId
                        }
                      />

                      <Detail
                        label="Programme"
                        value={
                          selectedStudent.programme
                        }
                      />

                      <Detail
                        label="Department"
                        value={
                          selectedStudent.department
                        }
                      />

                      <Detail
                        label="Year of Study"
                        value={
                          selectedStudent.yearOfStudy
                            ? `Year ${selectedStudent.yearOfStudy}`
                            : ""
                        }
                      />

                      <Detail
                        label="Semester"
                        value={
                          selectedStudent.semester
                            ? `Semester ${selectedStudent.semester}`
                            : ""
                        }
                      />

                      <Detail
                        label="Account Status"
                        value={
                          selectedStudent.active
                            ? "Active"
                            : "Inactive"
                        }
                      />

                      <Detail
                        label="Email Verification"
                        value={
                          selectedStudent.emailVerified
                            ? "Verified"
                            : "Not Verified"
                        }
                      />
                    </div>
                  </section>
                </div>

                {managementError && (
                  <p
                    className="staff-error"
                    role="alert"
                  >
                    {managementError}
                  </p>
                )}

                {managementSuccess && (
                  <p
                    className="student-success"
                    role="status"
                  >
                    {managementSuccess}
                  </p>
                )}

                {editingStudent ? (
                  <form
                    className="admin-student-form"
                    onSubmit={saveStudentEdit}
                    style={{
                      maxWidth: "100%",
                      marginTop: 24
                    }}
                  >
                    <h2>
                      Edit Student Information
                    </h2>

                    <div className="form-row">
                      <FormField
                        label="Full Name"
                        id="edit-fullName"
                        name="fullName"
                        value={
                          editForm.fullName
                        }
                        onChange={
                          handleEditChange
                        }
                        maxLength={120}
                      />

                      <FormField
                        label="Programme"
                        id="edit-programme"
                        name="programme"
                        value={
                          editForm.programme
                        }
                        onChange={
                          handleEditChange
                        }
                        maxLength={120}
                      />
                    </div>

                    <div className="form-row">
                      <FormField
                        label="Department"
                        id="edit-department"
                        name="department"
                        value={
                          editForm.department
                        }
                        onChange={
                          handleEditChange
                        }
                        maxLength={120}
                      />
                    </div>

                    <AcademicSelects
                      data={editForm}
                      onChange={
                        handleEditChange
                      }
                      prefix="edit-"
                    />

                    <div className="admin-form-actions">
                      <button
                        type="submit"
                        className="student-login-submit"
                        disabled={
                          managementBusy
                        }
                      >
                        {managementBusy
                          ? "Saving..."
                          : "Save Changes"}
                      </button>

                      <button
                        type="button"
                        className="secondary-btn"
                        disabled={
                          managementBusy
                        }
                        onClick={() => {
                          setEditingStudent(
                            false
                          );
                          setManagementError(
                            ""
                          );
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <div
                    className="admin-form-actions"
                    style={actionStyle}
                  >
                    <button
                      type="button"
                      className="student-login-submit"
                      disabled={
                        managementBusy
                      }
                      onClick={
                        beginEditStudent
                      }
                    >
                      Edit Student
                    </button>

                    <button
                      type="button"
                      className="secondary-btn"
                      disabled={
                        managementBusy
                      }
                      onClick={
                        toggleStudentStatus
                      }
                    >
                      {managementBusy
                        ? "Updating..."
                        : selectedStudent.active
                          ? "Deactivate Account"
                          : "Reactivate Account"}
                    </button>

                    <button
                      type="button"
                      className="secondary-btn"
                      onClick={
                        closeStudentProfile
                      }
                    >
                      Back to Students
                    </button>
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </section>
    </main>
  );
}
