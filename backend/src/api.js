// ---------------------------------------------------------------
// API layer. Works with ANY backend (FastAPI, Spring Boot, Node...)
// as long as it follows this contract:
//
//  POST {VITE_API_URL}/api/scan
//    - JSON:      { "type": "text" | "url", "content": "..." }
//    - multipart: field "file" (screenshot image) -> backend runs OCR
//
//  Response JSON:
//  {
//    "score": 0-100,
//    "category": "phishing" | "kyc" | "job" | "parcel" | "safe",
//    "reasons": { "en": [..], "hi": [..], "hinglish": [..] }
//  }
// ---------------------------------------------------------------
const BASE = import.meta.env.VITE_API_URL || "";
export const DEMO_MODE = !BASE;

export async function scan({ type, content, file }) {
  if (DEMO_MODE) return mockScan({ type, content, file });
  let res;
  if (type === "image") {
    const form = new FormData();
    form.append("file", file);
    res = await fetch(`${BASE}/api/scan`, { method: "POST", body: form });
  } else {
    res = await fetch(`${BASE}/api/scan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, content }),
    });
  }
  if (!res.ok) {
    let msg = `Server error (${res.status}). Check that the backend is running.`;
    try {
      const j = await res.json();
      if (j.detail) msg = j.detail;
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }
  return res.json();
}

// ---------- Demo detector (runs in browser, no backend needed) ----------
const RULES = [
  {
    cat: "kyc",
    w: 35,
    words: [
      "kyc",
      "aadhaar",
      "aadhar",
      "pan card",
      "account will be blocked",
      "update your kyc",
    ],
    r: {
      en: "Asks you to update KYC or ID details under threat of blocking.",
      hi: "KYC या ID अपडेट करने को कहा गया है और अकाउंट ब्लॉक होने की धमकी दी गई है।",
      hinglish:
        "KYC ya ID update karne ko kaha hai aur account block hone ki dhamki di hai.",
    },
  },
  {
    cat: "parcel",
    w: 30,
    words: [
      "parcel",
      "courier",
      "customs",
      "delivery failed",
      "fedex",
      "dhl",
      "india post",
      "redelivery",
    ],
    r: {
      en: "Mentions a parcel or customs fee you did not ask about.",
      hi: "ऐसे पार्सल या कस्टम फीस का ज़िक्र है जिसके बारे में आपने कुछ नहीं माँगा।",
      hinglish:
        "Aise parcel ya customs fee ka zikr hai jiske baare mein aapne kuch nahi manga.",
    },
  },
  {
    cat: "job",
    w: 35,
    words: [
      "work from home",
      "per day",
      "registration fee",
      "part time job",
      "earn",
      "telegram",
      "whatsapp us",
    ],
    r: {
      en: "Promises easy income or asks for a registration fee.",
      hi: "आसान कमाई का वादा किया गया है या रजिस्ट्रेशन फीस माँगी गई है।",
      hinglish:
        "Aasaan kamai ka wada kiya hai ya registration fee mangi gayi hai.",
    },
  },
  {
    cat: "phishing",
    w: 30,
    words: [
      "verify your account",
      "password",
      "suspended",
      "login now",
      "click here",
      "bank",
      "otp",
      "urgent",
    ],
    r: {
      en: "Uses urgent language and asks for login details, OTP or a click.",
      hi: "जल्दबाज़ी वाली भाषा है और लॉगिन, OTP या क्लिक माँगा गया है।",
      hinglish:
        "Jaldbaazi wali language hai aur login, OTP ya click manga gaya hai.",
    },
  },
];

const URL_SIGNALS = [
  {
    test: (u) => /^http:\/\//i.test(u),
    w: 20,
    r: {
      en: "Link is not encrypted (http, not https).",
      hi: "लिंक एन्क्रिप्टेड नहीं है (https की जगह http)।",
      hinglish: "Link encrypted nahi hai (https ki jagah http).",
    },
  },
  {
    test: (u) => /\/\/\d{1,3}(\.\d{1,3}){3}/.test(u),
    w: 35,
    r: {
      en: "Link uses a raw IP address instead of a website name.",
      hi: "लिंक में वेबसाइट के नाम की जगह सीधा IP एड्रेस है।",
      hinglish: "Link mein website ke naam ki jagah seedha IP address hai.",
    },
  },
  {
    test: (u) => /\.(xyz|top|click|tk|ml|gq|buzz)(\/|$|\?)/i.test(u),
    w: 30,
    r: {
      en: "Link ends in a domain type often used by scammers.",
      hi: "लिंक ऐसे डोमेन पर खत्म होता है जो स्कैमर अक्सर इस्तेमाल करते हैं।",
      hinglish:
        "Link aise domain par khatam hota hai jo scammers aksar use karte hain.",
    },
  },
  {
    test: (u) => /(bit\.ly|tinyurl|t\.co|cutt\.ly|rb\.gy)/i.test(u),
    w: 20,
    r: {
      en: "Shortened link hides the real destination.",
      hi: "छोटा किया हुआ लिंक असली वेबसाइट छुपा रहा है।",
      hinglish: "Chhota kiya hua link asli website chhupa raha hai.",
    },
  },
  {
    test: (u) => /@|(-.*){3,}/.test(u),
    w: 20,
    r: {
      en: "Link has odd characters often used to imitate real sites.",
      hi: "लिंक में अजीब चिह्न हैं जो असली साइट की नकल में इस्तेमाल होते हैं।",
      hinglish:
        "Link mein ajeeb chinh hain jo asli site ki nakal mein use hote hain.",
    },
  },
];

function mockScan({ type, content, file }) {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (type === "image") {
        return resolve({
          score: 50,
          category: "phishing",
          reasons: {
            en: [
              `Demo mode: "${file?.name}" was received, but reading text from screenshots (OCR) needs the backend.`,
            ],
            hi: [
              `डेमो मोड: "${file?.name}" मिल गई, पर स्क्रीनशॉट से टेक्स्ट पढ़ने (OCR) के लिए बैकएंड चाहिए।`,
            ],
            hinglish: [
              `Demo mode: "${file?.name}" mil gayi, par screenshot se text padhne (OCR) ke liye backend chahiye.`,
            ],
          },
        });
      }
      const text = content.toLowerCase();
      let score = 0,
        best = { w: 0, cat: "safe" };
      const reasons = { en: [], hi: [], hinglish: [] };
      const add = (r) => {
        reasons.en.push(r.en);
        reasons.hi.push(r.hi);
        reasons.hinglish.push(r.hinglish);
      };
      for (const rule of RULES) {
        if (rule.words.some((w) => text.includes(w))) {
          score += rule.w;
          add(rule.r);
          if (rule.w > best.w) best = { w: rule.w, cat: rule.cat };
        }
      }
      const hasUrl = /https?:\/\/\S+|www\.\S+/i.test(content);
      if (type === "url" || hasUrl) {
        const url =
          type === "url"
            ? content.trim()
            : content.match(/https?:\/\/\S+|www\.\S+/i)[0];
        for (const s of URL_SIGNALS)
          if (s.test(url)) {
            score += s.w;
            add(s.r);
            if (best.cat === "safe") best = { w: 1, cat: "phishing" };
          }
      }
      score = Math.min(100, score);
      if (!reasons.en.length)
        add({
          en: "No common scam signs found. Still, never share OTPs or passwords.",
          hi: "आम स्कैम के संकेत नहीं मिले। फिर भी OTP या पासवर्ड कभी शेयर न करें।",
          hinglish:
            "Aam scam ke sanket nahi mile. Phir bhi OTP ya password kabhi share na karein.",
        });
      resolve({ score, category: score < 20 ? "safe" : best.cat, reasons });
    }, 700);
  });
}
