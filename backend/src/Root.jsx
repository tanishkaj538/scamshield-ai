import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, firebaseReady } from "./firebase.js";
import Login from "./Login.jsx";
import App from "./App.jsx";

const DEMO_KEY = "scamshield-demo-user";

export default function Root() {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!firebaseReady) {
      try {
        const saved = localStorage.getItem(DEMO_KEY);
        if (saved) setUser(JSON.parse(saved));
      } catch {
        /* ignore */
      }
      setReady(true);
      return;
    }
    return onAuthStateChanged(auth, (u) => {
      setUser(u ? { email: u.email, name: u.displayName } : null);
      setReady(true);
    });
  }, []);

  async function logout() {
    if (firebaseReady) await signOut(auth);
    else {
      try {
        localStorage.removeItem(DEMO_KEY);
      } catch {
        /* ignore */
      }
    }
    setUser(null);
  }

  if (!ready) return <div className="boot">Loading…</div>;
  return user ? (
    <App user={user} onLogout={logout} />
  ) : (
    <Login onDemoLogin={setUser} />
  );
}
