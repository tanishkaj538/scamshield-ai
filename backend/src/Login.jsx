import { useState } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";
import { auth, googleProvider, firebaseReady } from "./firebase.js";

const ERRORS = {
  "auth/invalid-credential": "Wrong email or password.",
  "auth/user-not-found": "No account with this email. Create one first.",
  "auth/wrong-password": "Wrong email or password.",
  "auth/email-already-in-use":
    "This email already has an account. Try logging in.",
  "auth/weak-password": "Password must be at least 6 characters.",
  "auth/invalid-email": "That email address does not look right.",
  "auth/popup-closed-by-user": "Google sign-in was closed before finishing.",
  "auth/network-request-failed": "No internet connection. Please try again.",
};

export default function Login({ onDemoLogin }) {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password)
      return setError("Please fill in your email and password.");
    if (!firebaseReady) {
      const u = { email: email.trim(), name: name.trim() };
      try {
        localStorage.setItem("scamshield-demo-user", JSON.stringify(u));
      } catch {
        /* ignore */
      }
      return onDemoLogin(u);
    }
    setBusy(true);
    try {
      if (mode === "signup") {
        const cred = await createUserWithEmailAndPassword(
          auth,
          email.trim(),
          password,
        );
        if (name.trim())
          await updateProfile(cred.user, { displayName: name.trim() });
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      }
    } catch (err) {
      setError(ERRORS[err.code] || "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    setError("");
    if (!firebaseReady)
      return setError(
        "Google sign-in needs Firebase. Use email and password for the demo.",
      );
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setError(ERRORS[err.code] || "Google sign-in failed. Please try again.");
    }
  }

  const signup = mode === "signup";
  return (
    <div className="login">
      <aside className="login-art">
        <div className="brand">
          <svg width="30" height="30" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M12 2 4 5v6c0 5 3.4 9.3 8 11 4.6-1.7 8-6 8-11V5l-8-3Z"
              fill="#ff9f1c"
            />
            <path
              d="m8.5 12 2.5 2.5L16 9.5"
              stroke="#25205e"
              strokeWidth="2.2"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          ScamShield AI
        </div>
        <h1>One check can save your savings.</h1>
        <p>
          Sign in to scan messages, links and screenshots, and keep your scan
          history with you.
        </p>
        <div className="stamp high demo" aria-hidden="true">
          HIGH RISK
        </div>
      </aside>

      <main className="login-main">
        <form className="login-card" onSubmit={submit} noValidate>
          <h2>{signup ? "Create your account" : "Welcome back"}</h2>
          <p className="sub">
            {signup ? "It takes less than a minute." : "Log in to continue."}
          </p>

          {signup && (
            <>
              <label htmlFor="n">Name</label>
              <input
                id="n"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                autoComplete="name"
              />
            </>
          )}
          <label htmlFor="e">Email</label>
          <input
            id="e"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
          />
          <label htmlFor="p">Password</label>
          <input
            id="p"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
            autoComplete={signup ? "new-password" : "current-password"}
          />

          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <button className="go" type="submit" disabled={busy}>
            {busy ? "Please wait…" : signup ? "Create account" : "Log in"}
          </button>
          <div className="or">
            <span>or</span>
          </div>
          <button className="btn google" type="button" onClick={google}>
            Continue with Google
          </button>

          <p className="switch">
            {signup ? "Already have an account?" : "New here?"}{" "}
            <button
              type="button"
              className="link"
              onClick={() => {
                setMode(signup ? "login" : "signup");
                setError("");
              }}
            >
              {signup ? "Log in" : "Create an account"}
            </button>
          </p>
          {!firebaseReady && (
            <p className="note">
              Demo login: Firebase is not connected yet, so any email and
              password will work.
            </p>
          )}
        </form>
      </main>
    </div>
  );
}
