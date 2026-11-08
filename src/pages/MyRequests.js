
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc
} from "firebase/firestore";

import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";

export default function MyRequests() {
  const { user } = useAuth();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");
  const [editingId, setEditingId] = useState("");
  const [editText, setEditText] = useState("");

  // READ REQUESTS FROM FIRESTORE
  useEffect(() => {
    if (!user) {
      setRequests([]);
      setLoading(false);
      return;
    }

    const ownRequests = query(
      collection(db, "requests"),
      where("ownerUid", "==", user.uid)
    );

    const unsubscribe = onSnapshot(
      ownRequests,
      (snapshot) => {
        const items = snapshot.docs.map((item) => ({
          ...item.data(),
          id: item.id
        }));

        items.sort((a, b) =>
          (b.requestDate || "").localeCompare(
            a.requestDate || ""
          )
        );

        setRequests(items);
        setLoading(false);
        setError("");
      },
      (err) => {
        console.error(err);
        setError("Could not load your requests.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // START EDITING DESCRIPTION
  function startEdit(item) {
    setEditingId(item.id);
    setEditText(item.description || "");
    setError("");
  }

  // UPDATE DESCRIPTION
  async function saveDescription(item) {
    if (!editText.trim()) {
      setError("Description cannot be empty.");
      return;
    }

    setBusyId(item.id);
    setError("");

    try {
      await updateDoc(
        doc(db, "requests", item.id),
        { description: editText.trim() }
      );

      setEditingId("");
      setEditText("");
    } catch (err) {
      console.error(err);
      setError("Could not update the description.");
    } finally {
      setBusyId("");
    }
  }

  // UPDATE REQUEST STATUS
  async function changeStatus(item, newStatus) {
    setBusyId(item.id);
    setError("");

    try {
      await updateDoc(
        doc(db, "requests", item.id),
        { status: newStatus }
      );
    } catch (err) {
      console.error(err);
      setError(
        "Could not update status. Check Firestore permissions."
      );
    } finally {
      setBusyId("");
    }
  }

  // DELETE REQUEST
  async function removeRequest(item) {
    if (!window.confirm("Delete this request permanently?")) {
      return;
    }

    setBusyId(item.id);
    setError("");

    try {
      await deleteDoc(
        doc(db, "requests", item.id)
      );
    } catch (err) {
      console.error(err);
      setError("Could not delete your request.");
    } finally {
      setBusyId("");
    }
  }

  return (
    <main className="requests-page">

      <header className="requests-header">
        <span className="section-label">
          STUDENT SERVICES
        </span>

        <h1>My Requests</h1>

        <p>
          View, manage, and track your university
          service requests.
        </p>
      </header>

      <div className="requests-container">

        <div className="requests-top">
          <div>
            <h2>My Submitted Requests</h2>
            <p>Total Requests: {requests.length}</p>
          </div>

          <Link to="/services" className="primary-btn">
            + New Request
          </Link>
        </div>

        {loading && (
          <p className="requests-message">
            Loading your requests...
          </p>
        )}

        {error && (
          <p className="auth-error" role="alert">
            {error}
          </p>
        )}

        {!loading && requests.length === 0 && (
          <div className="requests-empty">
            <h3>No Requests Yet</h3>
            <p>
              Choose a university service to submit
              your first request.
            </p>
            <Link to="/services" className="primary-btn">
              Explore Services
            </Link>
          </div>
        )}

        {!loading && requests.length > 0 && (
          <div className="requests-table-wrapper">

            <table className="requests-table">

              <thead>
                <tr>
                  <th>Service</th>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {requests.map((item) => (
                  <tr key={item.id}>

                    {/* SERVICE */}
                    <td>
                      <strong>{item.serviceName}</strong>
                      <small className="request-id">
                        ID: {item.id}
                      </small>
                    </td>

                    {/* DATE */}
                    <td>{item.requestDate}</td>

                    {/* DESCRIPTION */}
                    <td>
                      {editingId === item.id ? (
                        <div className="edit-description">

                          <textarea
                            value={editText}
                            onChange={(e) =>
                              setEditText(e.target.value)
                            }
                            rows="3"
                          />

                          <div className="request-actions">
                            <button
                              type="button"
                              className="save-request-btn"
                              disabled={busyId === item.id}
                              onClick={() =>
                                saveDescription(item)
                              }
                            >
                              Save
                            </button>

                            <button
                              type="button"
                              className="edit-request-btn"
                              onClick={() =>
                                setEditingId("")
                              }
                            >
                              Cancel
                            </button>
                          </div>

                        </div>
                      ) : (
                        <p className="request-description">
                          {item.description}
                        </p>
                      )}
                    </td>

                    {/* STATUS */}
                    <td>
                      <div className="status-cell">

                        <span
                          className={`request-status-badge ${
                            (item.status || "Pending")
                              .toLowerCase()
                              .replace(/\s+/g, "-")
                          }`}
                        >
                          {item.status || "Pending"}
                        </span>

                        <select
                          className="status-select"
                          value={item.status || "Pending"}
                          disabled={busyId === item.id}
                          onChange={(e) =>
                            changeStatus(item, e.target.value)
                          }
                          aria-label={`Change status for ${item.serviceName}`}
                        >
                          <option value="Pending">
                            Pending
                          </option>
                          <option value="In Progress">
                            In Progress
                          </option>
                          <option value="Completed">
                            Completed
                          </option>
                        </select>

                      </div>
                    </td>

                    {/* ACTIONS */}
                    <td>
                      <div className="request-actions">

                        <button
                          type="button"
                          className="edit-request-btn"
                          disabled={busyId === item.id}
                          onClick={() => startEdit(item)}
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          className="delete-request-btn"
                          disabled={busyId === item.id}
                          onClick={() =>
                            removeRequest(item)
                          }
                        >
                          Delete
                        </button>

                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>

            </table>

          </div>
        )}

        <p className="requests-help">
          You can edit your request description,
          update its status, or delete a request.
        </p>

      </div>
    </main>
  );
}
