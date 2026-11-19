import { useState, useEffect, useRef } from "react";
import { scan, DEMO_MODE } from "./api.js";

const TABS = [
  { id: "text", label: "Message" },
  { id: "url", label: "Link" },
  { id: "image", label: "Screenshot" },
];
const LANGS = [
  { id: "en", label: "English" },
  { id: "hinglish", label: "Hinglish" },
  { id: "hi", label: "हिन्दी" },
];
const CATEGORY = {
  phishing: "Phishing",
  kyc: "KYC fraud",
  job: "Job scam",
  parcel: "Parcel scam",
  safe: "No scam found",
};
const SAMPLES = [
  {
    label: "KYC SMS",
    type: "text",
    content:
      "Dear customer, your KYC is expired. Update your KYC now or your account will be blocked: http://sbi-kyc-update.xyz/login",
  },
  {
    label: "Job offer",
    type: "text",
    content:
      "Work from home part time job! Earn Rs 5000 per day. Pay registration fee and WhatsApp us today.",
  },
  {
    label: "Parcel link",
    type: "url",
    content: "http://192.168.4.20/india-post/redelivery",
  },
];
const TIPS = [
  {
    id: "phishing",
    title: "Phishing",
    what: "Fake bank, UPI or login pages that steal your password and OTP.",
    do: [
      "Never tap links in messages you did not expect.",
      "Type the bank's website yourself.",
      "No bank ever asks for your OTP.",
    ],
  },
  {
    id: "kyc",
    title: "KYC fraud",
    what: "A message says your account will be blocked unless you update KYC through a link or call.",
    do: [
      "Banks do KYC at the branch or in their official app.",
      "Do not share Aadhaar, PAN or card photos on chat.",
      "Call the number printed on your bank card.",
    ],
  },
  {
    id: "job",
    title: "Job scam",
    what: "Easy work-from-home jobs that pay per task, then ask for a fee or deposit.",
    do: [
      "A real employer never asks you to pay to get hired.",
      "Check the company on its official website.",
      "Leave Telegram groups that push you to 'invest' for tasks.",
    ],
  },
  {
    id: "parcel",
    title: "Parcel scam",
    what: "A courier or customs message asks for a small fee for a parcel you never ordered.",
    do: [
      "Track parcels only on the courier's own app.",
      "Ignore customs fee links.",
      "Do not call numbers from the message.",
    ],
  },
];

function level(score) {
  if (score >= 70)
    return { key: "high", label: "HIGH RISK", word: "High risk" };
  if (score >= 35)
    return { key: "mid", label: "SUSPICIOUS", word: "Suspicious" };
  return { key: "low", label: "LOOKS SAFE", word: "Looks safe" };
}

export default function App({ user, onLogout }) {
  const [tab, setTab] = useState("text");
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState(null);
  const [lang, setLang] = useState("en");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [copied, setCopied] = useState(false);
  const fileRef = useRef();

  useEffect(() => {
    try {
      setHistory(
        JSON.parse(localStorage.getItem("scamshield-history") || "[]"),
      );
    } catch {
      /* ignore */
    }
  }, []);
  const saveHistory = (h) => {
    setHistory(h);
    try {
      localStorage.setItem("scamshield-history", JSON.stringify(h));
    } catch {
      /* ignore */
    }
  };

  const content = tab === "text" ? text : tab === "url" ? url : file;
  const canScan =
    !busy && (tab === "image" ? !!file : String(content).trim().length > 3);

  async function run() {
    setBusy(true);
    setError("");
    setResult(null);
    try {
      const data = await scan({
        type: tab,
        content: tab === "image" ? "" : content,
        file,
      });
      const entry = {
        id: Date.now(),
        when: new Date().toLocaleString(),
        type: tab,
        input: tab === "image" ? file.name : content.slice(0, 120),
        ...data,
      };
      setResult(entry);
      saveHistory([entry, ...history].slice(0, 20));
    } catch (e) {
      setError(e.message || "Scan failed. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function pasteFromClipboard() {
    try {
      const t = await navigator.clipboard.readText();
      tab === "url" ? setUrl(t) : (setTab("text"), setText(t));
    } catch {
      setError("Could not read the clipboard. Paste with Ctrl + V instead.");
    }
  }
  function useSample(s) {
    setTab(s.type);
    s.type === "url" ? setUrl(s.content) : setText(s.content);
    setResult(null);
  }

  const lv = result && level(result.score);
  const reasons = result
    ? result.reasons?.[lang] || result.reasons?.en || []
    : [];
  const summary =
    result &&
    `ScamShield AI check\nRisk: ${result.score}/100 (${lv.word})\nType: ${CATEGORY[result.category] || result.category}\n${reasons.map((r) => "- " + r).join("\n")}`;
  const copyReport = async () => {
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  };
  const highCount = history.filter((h) => h.score >= 70).length;
  const typed = tab === "text" ? text : tab === "url" ? url : "";

  return (
    <div className="app">
      <div className="band no-print">
        <header className="top">
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
          <div className="seg" role="group" aria-label="Explanation language">
            {LANGS.map((l) => (
              <button
                key={l.id}
                className={lang === l.id ? "on" : ""}
                onClick={() => setLang(l.id)}
              >
                {l.label}
              </button>
            ))}
          </div>
          <div className="who">
            <span>{user?.name || user?.email}</span>
            <button onClick={onLogout}>Log out</button>
          </div>
        </header>
        <div className="hero">
          <h1>Got a strange message? Check it before you reply.</h1>
          <p>
            Paste an SMS, a link or a screenshot. ScamShield gives a risk score
            out of 100 and tells you why, in English, Hinglish or Hindi.
          </p>
        </div>
      </div>

      <main className="wrap">
        <div className="duo">
          <section className="card scanner no-print">
            <div className="tabs" role="tablist">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  role="tab"
                  aria-selected={tab === t.id}
                  className={tab === t.id ? "on" : ""}
                  onClick={() => setTab(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>
            {tab === "text" && (
              <textarea
                rows={8}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste the SMS, WhatsApp or email text here"
              />
            )}
            {tab === "url" && (
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/login"
              />
            )}
            {tab === "image" && (
              <div
                className="drop"
                onClick={() => fileRef.current.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const f = e.dataTransfer.files[0];
                  if (f?.type.startsWith("image/")) setFile(f);
                }}
              >
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => setFile(e.target.files[0] || null)}
                />
                {file ? (
                  <>
                    <img
                      src={URL.createObjectURL(file)}
                      alt="Selected screenshot preview"
                    />
                    <span>{file.name}</span>
                  </>
                ) : (
                  <span>Drop a screenshot here, or tap to choose one</span>
                )}
              </div>
            )}
            <div className="meta">
              {tab !== "image" && (
                <button className="link" onClick={pasteFromClipboard}>
                  Paste from clipboard
                </button>
              )}
              {tab !== "image" && <span>{typed.length} characters</span>}
              {typed && (
                <button
                  className="link"
                  onClick={() => (tab === "url" ? setUrl("") : setText(""))}
                >
                  Clear
                </button>
              )}
            </div>
            <button className="go" disabled={!canScan} onClick={run}>
              {busy ? "Checking…" : "Check for scam"}
            </button>
            <div className="samples">
              <span>Try an example:</span>
              {SAMPLES.map((s) => (
                <button
                  key={s.label}
                  className="chip"
                  onClick={() => useSample(s)}
                >
                  {s.label}
                </button>
              ))}
            </div>
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
            {DEMO_MODE && (
              <p className="note">
                Demo mode: a simple built-in detector is running. Set{" "}
                <code>VITE_API_URL</code> to connect your backend.
              </p>
            )}
          </section>

          <section className="card report" id="report" aria-live="polite">
            {busy && (
              <div className="empty">
                <div className="spin" />
                <p>Reading the message…</p>
              </div>
            )}
            {!busy && !result && (
              <div className="empty">
                <p>
                  <strong>Your report will appear here.</strong>
                </p>
                <p>Paste something on the left and press Check for scam.</p>
              </div>
            )}
            {!busy && result && (
              <>
                <div className="rhead">
                  <div>
                    <div className="score">
                      <b>{result.score}</b>
                      <span>/100</span>
                    </div>
                    <p className="cat">
                      {CATEGORY[result.category] || result.category}
                    </p>
                  </div>
                  <div key={result.id} className={`stamp ${lv.key}`}>
                    {lv.label}
                  </div>
                </div>
                <div className="meter" aria-hidden="true">
                  <i className={lv.key} style={{ width: `${result.score}%` }} />
                </div>
                <h2>Why we think so</h2>
                <ul className="reasons">
                  {reasons.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
                <p className="scanned">Checked: {result.input}</p>
                <div className="share no-print">
                  <a
                    className="btn wa"
                    href={`https://wa.me/?text=${encodeURIComponent(summary)}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Share on WhatsApp
                  </a>
                  <button className="btn" onClick={copyReport}>
                    {copied ? "Copied" : "Copy report"}
                  </button>
                  <button className="btn" onClick={() => window.print()}>
                    Save as PDF
                  </button>
                </div>
                {result.score >= 35 && (
                  <p className="advice no-print">
                    Do not click, reply or pay. If you already did, call{" "}
                    <b>1930</b> at once.
                  </p>
                )}
              </>
            )}
          </section>
        </div>

        <section className="strip no-print">
          <div>
            <b>{history.length}</b>
            <span>checks so far</span>
          </div>
          <div>
            <b>{highCount}</b>
            <span>high-risk found</span>
          </div>
          <div>
            <b>3</b>
            <span>languages</span>
          </div>
          <div>
            <b>Free</b>
            <span>no sign-up needed</span>
          </div>
        </section>

        <section className="learn no-print">
          <h2>Know the common scams</h2>
          <p className="sub">Tap a scam to see how it works and what to do.</p>
          <div className="tips">
            {TIPS.map((t) => (
              <details key={t.id}>
                <summary>{t.title}</summary>
                <p>{t.what}</p>
                <ul>
                  {t.do.map((d) => (
                    <li key={d}>{d}</li>
                  ))}
                </ul>
              </details>
            ))}
          </div>
        </section>

        <section className="help no-print">
          <div>
            <h2>Already lost money?</h2>
            <p>
              Call the National Cyber Crime Helpline <b>1930</b> within the
              first hour, then file a complaint at <b>cybercrime.gov.in</b>.
              Early reports give the best chance of freezing the money.
            </p>
          </div>
          <a className="btn call" href="tel:1930">
            Call 1930
          </a>
        </section>

        <section className="card history no-print">
          <div className="hrow">
            <h2>Your recent checks</h2>
            {history.length > 0 && (
              <button className="link" onClick={() => saveHistory([])}>
                Clear history
              </button>
            )}
          </div>
          {history.length === 0 ? (
            <p className="sub">Your last 20 checks will show up here.</p>
          ) : (
            <ul>
              {history.map((h) => (
                <li key={h.id}>
                  <button
                    onClick={() => {
                      setResult(h);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                  >
                    <span className={`dot ${level(h.score).key}`} />
                    <span className="hs">{h.score}</span>
                    <span className="hi">{h.input}</span>
                    <span className="hw">{h.when}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
      <footer className="foot no-print">
        ScamShield AI is a helper, not a guarantee. When in doubt, do not click.
      </footer>
    </div>
  );
}
