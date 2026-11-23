
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState
} from "react";

import {
  onAuthStateChanged,
  reload
} from "firebase/auth";

import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkVersion = useRef(0);

  const refreshAuthorization = useCallback(
    async (firebaseUser = auth.currentUser) => {
      const version = ++checkVersion.current;

      setLoading(true);
      setUser(null);
      setRole(null);
      setProfile(null);

      if (!firebaseUser) {
        setLoading(false);
        return false;
      }

      try {
        await reload(firebaseUser);

        if (version !== checkVersion.current) {
          return false;
        }

        const adminSnapshot = await getDoc(
          doc(db, "admins", firebaseUser.uid)
        );

        if (version !== checkVersion.current) {
          return false;
        }

        if (
          adminSnapshot.exists() &&
          adminSnapshot.data().active === true
        ) {
          setUser(firebaseUser);
          setRole("admin");
          setProfile(adminSnapshot.data());
          return true;
        }

        const studentSnapshot = await getDoc(
          doc(db, "users", firebaseUser.uid)
        );

        if (version !== checkVersion.current) {
          return false;
        }

        const student = studentSnapshot.exists()
          ? studentSnapshot.data()
          : null;

        if (
          student &&
          student.role === "student" &&
          student.active === true &&
          student.emailVerified === true &&
          student.invitationStatus === "activated" &&
          firebaseUser.emailVerified === true &&
          student.email?.toLowerCase() ===
            firebaseUser.email?.toLowerCase()
        ) {
          setUser(firebaseUser);
          setRole("student");
          setProfile(student);
          return true;
        }

        return false;
      } catch (error) {
        console.error(
          "StudentServe authorization error:",
          error
        );

        return false;
      } finally {
        if (version === checkVersion.current) {
          setLoading(false);
        }
      }
    },
    []
  );

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (firebaseUser) => {
        refreshAuthorization(firebaseUser);
      }
    );

    return () => {
      checkVersion.current++;
      unsubscribe();
    };
  }, [refreshAuthorization]);

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        profile,
        loading,
        refreshAuthorization
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
