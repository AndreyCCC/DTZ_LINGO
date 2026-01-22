import React, { useState, useRef, useEffect, Component, ReactNode } from 'react';
import ReactDOM from 'react-dom/client';
import { createPortal } from 'react-dom'; // Import createPortal
import OpenAI from "openai";
import { User } from '@supabase/supabase-js';
import DottedGlowBackground from './components/DottedGlowBackground';
import { ThinkingIcon, ArrowLeftIcon, SparklesIcon, PlayIcon, FacebookIcon, TelegramIcon, TikTokIcon } from './components/Icons';
import { supabase } from './supabase';

// --- Constants ---

// Translations for Landing Page
const TRANSLATIONS = {
    de: {
        heroTitle: "Bestehe den DTZ B1 mit KI",
        heroSubtitle: "Dein persönlicher KI-Prüfer für Sprechen, Schreiben und Planen. Übe realistische Prüfungssituationen jederzeit.",
        ctaStart: "JETZT STARTEN",
        ctaLogin: "Einloggen",
        feat1Title: "KI-Prüfer",
        feat1Desc: "Führe realistische Dialoge wie in der echten mündlichen Prüfung.",
        feat2Title: "Sofortiges Feedback",
        feat2Desc: "Erhalte detaillierte Korrekturen für Grammatik und Wortschatz.",
        feat3Title: "Fortschritt",
        feat3Desc: "Verfolge dein Niveau von A1 bis B1 mit jeder Übung.",
        madeWith: "Gemacht mit ❤️ für Deutschlerner"
    },
    en: {
        heroTitle: "Pass the DTZ B1 with AI",
        heroSubtitle: "Your personal AI Examiner for Speaking, Writing, and Planning. Practice realistic exam scenarios anytime.",
        ctaStart: "START NOW",
        ctaLogin: "Login",
        feat1Title: "AI Examiner",
        feat1Desc: "Engage in realistic dialogues just like the real oral exam.",
        feat2Title: "Instant Feedback",
        feat2Desc: "Get detailed corrections for grammar and vocabulary.",
        feat3Title: "Progress",
        feat3Desc: "Track your level from A1 to B1 with every exercise.",
        madeWith: "Made with ❤️ for German Learners"
    },
    ru: {
        heroTitle: "Сдай DTZ B1 с ИИ",
        heroSubtitle: "Твой персональный ИИ-экзаменатор для говорения, письма и диалогов. Тренуйся в любое время.",
        ctaStart: "НАЧАТЬ",
        ctaLogin: "Войти",
        feat1Title: "ИИ Экзаменатор",
        feat1Desc: "Реалистичные диалоги, как на настоящем устном экзамене.",
        feat2Title: "Мгновенная проверка",
        feat2Desc: "Получай подробный разбор ошибок по грамматике и лексике.",
        feat3Title: "Прогресс",
        feat3Desc: "Отслеживай свой уровень от A1 до B1 с каждым заданием.",
        madeWith: "Сделано с ❤️ для изучающих немецкий"
    },
    uk: {
        heroTitle: "Склади DTZ B1 зі ШІ",
        heroSubtitle: "Твій персональный ШІ-екзаменатор для мовлення, письма та діалогів. Тренуйся в будь-який час.",
        ctaStart: "ПОЧАТИ",
        ctaLogin: "Увійти",
        feat1Title: "ШІ Екзаменатор",
        feat1Desc: "Реалістичні діалоги, як на справжньому усному іспиті.",
        feat2Title: "Миттєва перевірка",
        feat2Desc: "Отримуй детальне виправлення помилок з граматики та лексики.",
        feat3Title: "Прогрес",
        feat3Desc: "Відстежуй свій рівень від A1 до B1 з кожним завданням.",
        madeWith: "Зроблено з ❤️ для тих, хто вивчає німецьку"
    },
    ar: {
        heroTitle: "DTZ B1 اجتاز امتحان",
        heroSubtitle: "مدربك الشخصي بالذكاء الاصطناعي للمحادثة والكتابة. تدرب على سيناريوهات الامتحان الواقعية في أي وقت.",
        ctaStart: "ابدأ الآن",
        ctaLogin: "تسجيل الدخول",
        feat1Title: "مدرب الذكاء الاصطناعي",
        feat1Desc: "حوارات واقعية تماماً مثل الامتحان الشفهي الحقيقي.",
        feat2Title: "تغذية راجعة فورية",
        feat2Desc: "احصل على تصحيحات مفصلة للقواعد والمفردات.",
        feat3Title: "التقدم",
        feat3Desc: "تتبع مستواك من A1 إلى B1 مع كل تمرين.",
        madeWith: "صنع بـ ❤️ لمتعلمي اللغة الألمانية"
    }
};

type LangCode = 'de' | 'en' | 'ru' | 'uk' | 'ar';

// Fallback images (Standard) - used if API fails
const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80", // Restaurant/Cafe
  "https://images.unsplash.com/photo-1556910103-1c02745a30bf?w=800&q=80", // Kitchen/Cooking
  "https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80", // Market/Shopping
  "https://images.unsplash.com/photo-1570829460005-c840387bb1ca?w=800&q=80", // Living room
  "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&q=80", // Office
];

const EXAM_TOPICS = [
  "Supermarkt", "Einkaufen", "Kasse", "Lebensmittel", "Geschäft", 
  "Apotheke", "Arztpraxis", "Arzttermin", "Krankenhaus", 
  "Busbahnhof", "Bushaltestelle", "Bahnhof", "Fahrkartenautomat", 
  "Büro", "Bewerbungsgespräch", "Arbeitsplatz", "Teamarbeit", 
  "Lager", "Restaurant", "Küche", "Reinigung", "Bauarbeit", 
  "Wohnung", "Wohnzimmer", "Badezimmer", "Reparatur", "Vermieter", "Haushalt", 
  "Sprachkurs", "Klassenzimmer", "Bibliothek", "Lernen", 
  "Post", "Bank", "Servicezentrum", 
  "Freizeit", "Park", "Café", "Veranstaltung", 
  "Bürgeramt", "Rathaus", "Jobcenter", "Ausländerbehörde", "Warteschlange", 
  "Smartphone", "Laptop", "Geldautomat", "Zahlungsterminal"
];

const WRITING_PROMPTS = [
  {
    topic: "Krankmeldung Kind",
    text: "Ihr Sohn kann morgen nicht in die Schule gehen, weil er krank ist. Schreiben Sie eine E-Mail an die Klassenlehrerin, Frau Müller.\n\nSchreiben Sie etwas zu folgenden Punkten:\n1. Grund für Ihr Schreiben\n2. Wie lange er zu Hause bleiben muss\n3. Fragen Sie nach den Hausaufgaben"
  },
  {
    topic: "Wohnungsproblem",
    text: "In Ihrer Wohnung funktioniert die Heizung nicht. Es ist sehr kalt. Sie haben Ihren Vermieter, Herrn Schneider, schon angerufen, aber nicht erreicht. Schreiben Sie eine E-Mail.\n\nSchreiben Sie etwas zu folgenden Punkten:\n1. Problem beschreiben\n2. Was Sie schon gemacht haben (Anruf)\n3. Termin für Reparatur bitten"
  },
  {
    topic: "Einladung Antwort",
    text: "Ihr neuer Nachbar hat Sie zu seinem Geburtstag am Samstag eingeladen. Schreiben Sie ihm einen Brief.\n\nSchreiben Sie etwas zu folgenden Punkten:\n1. Danken Sie für die Einladung\n2. Sagen Sie zu (dass Sie kommen)\n3. Fragen Sie, ob Sie etwas mitbringen sollen (Salat, Getränke?)"
  },
  {
    topic: "Jobbewerbung",
    text: "Sie haben eine Anzeige gelesen: Die Firma 'ABC Logistik' sucht Fahrer. Schreiben Sie eine Bewerbung.\n\nSchreiben Sie etwas zu folgenden Punkten:\n1. Warum Sie schreiben\n2. Ihre Erfahrung (Führerschein, frühere Jobs)\n3. Wann Sie anfangen können"
  }
];

// New Planning Scenarios
const PLANNING_SCENARIOS = [
    {
        topic: "Nachbarin Geburtstag",
        situation: "Ihre Nachbarin Frau Petrova hat nächste Woche Geburtstag. Sie möchten ihr zusammen mit Ihrem Gesprächspartner ein kleines Geschenk kaufen und vielleicht etwas organisieren.",
        points: [
            "Was schenken? (Blumen, Kuchen...)",
            "Wann treffen? (Tag, Uhrzeit)",
            "Wo treffen?",
            "Wie viel Geld ausgeben?",
            "Wer besorgt was?"
        ]
    },
    {
        topic: "Picknick im Park",
        situation: "Sie möchten am Wochenende mit Ihrem Gesprächspartner und anderen Freunden ein Picknick im Park machen. Planen Sie das zusammen.",
        points: [
            "Wann und Wo? (Treffpunkt)",
            "Wer wird eingeladen?",
            "Essen und Getränke (Wer bringt was mit?)",
            "Was machen bei Regen?",
            "Spiele oder Musik?"
        ]
    },
    {
        topic: "Kollegen besuchen",
        situation: "Ein Arbeitskollege liegt im Krankenhaus. Sie wollen ihn gemeinsam besuchen.",
        points: [
            "Wann besuchen? (Besuchszeiten)",
            "Wie hinkommen? (Auto, Bus)",
            "Geschenk mitbringen? (Obst, Zeitschrift)",
            "Wie lange bleiben?",
            "Karte schreiben?"
        ]
    },
    {
        topic: "Abschiedsparty",
        situation: "Ein Freund zieht in eine andere Stadt. Sie wollen eine kleine Abschiedsparty organisieren.",
        points: [
            "Wo feiern? (Zu Hause, Restaurant)",
            "Wann? (Samstagabend?)",
            "Geschenk zum Abschied?",
            "Essen/Trinken organisieren",
            "Musik/Playlist"
        ]
    }
];

// --- Types ---
type ExamModule = 'vorstellung' | 'bild' | 'planung' | 'schreiben' | null;

interface Message {
  role: 'user' | 'assistant';
  text: string;
}

interface Mistake {
  original: string;
  correction: string;
  explanation: string;
  realId?: number;
}

interface GradingResult {
  grade: 'A1' | 'A2' | 'B1' | 'Unter A1';
  reasoning: string;
  tips: string[];
  mistakes: Mistake[];
}

interface SessionData {
    id: string;
    module: string;
    topic: string;
    grade: string;
    created_at: string;
    feedback_data: GradingResult;
    transcript: any; // Raw history or user text
}

interface ExamState {
  module: ExamModule;
  step: 'landing' | 'auth' | 'menu' | 'exam' | 'result' | 'admin' | 'profile'; 
  history: Message[];
  turnCount: number;
  currentImage?: string;
  imageSource?: 'unsplash' | 'fallback'; 
  debugInfo?: string; 
  currentTopic?: string;
  grading?: GradingResult;
  // Writing specific
  writingTask?: { topic: string; text: string };
  writingInput?: string;
  timeLeft?: number;
  // Planning specific
  planningTask?: { topic: string; situation: string; points: string[] };
  // Analytics
  startTime?: number;
  // View History
  viewHistoryItem?: SessionData;
}

interface UserStats {
  totalExams: number;
  lastGrade: string;
  modulesTaken: number;
  recentSessions: SessionData[];
  allSessions: SessionData[];
}

// --- Error Boundary ---
interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px', color: 'white', textAlign: 'center', background: '#131F24', height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h1>Etwas ist schiefgelaufen.</h1>
          <button onClick={() => window.location.reload()} style={{ background: '#1CB0F6', border: 'none', padding: '12px 24px', borderRadius: '12px', color: 'white', fontWeight: 'bold', cursor: 'pointer', marginTop: '20px' }}>
            Neu laden
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// --- Auth Component ---
const AuthScreen = ({ onLogin, onGuest }: { onLogin: (user: User) => void, onGuest: () => void }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg('');

    if (!supabase) {
        setMsg("Supabase API keys fehlen! Prüfen Sie .env");
        setLoading(false);
        return;
    }

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (data.user) {
            setMsg("Registrierung erfolgreich! Bitte E-Mails prüfen.");
            setIsSignUp(false);
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data.user) onLogin(data.user);
      }
    } catch (err: any) {
      setMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="avatar-placeholder"><SparklesIcon /></div>
        <h2>{isSignUp ? 'Konto erstellen' : 'Willkommen zurück'}</h2>
        <form onSubmit={handleAuth}>
          <input 
            type="email" 
            placeholder="E-Mail" 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            required 
          />
          <input 
            type="password" 
            placeholder="Passwort" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            required 
          />
          <button type="submit" className="primary-btn" disabled={loading}>
            {loading ? 'Laden...' : (isSignUp ? 'Registrieren' : 'Einloggen')}
          </button>
        </form>
        
        <button type="button" className="secondary-btn" onClick={onGuest}>
            Als Gast fortfahren
        </button>

        {msg && <p className="auth-msg">{msg}</p>}
        <p className="auth-switch">
          {isSignUp ? 'Schon ein Konto?' : 'Noch kein Konto?'} 
          <span onClick={() => setIsSignUp(!isSignUp)}>
            {isSignUp ? ' Hier einloggen' : ' Hier registrieren'}
          </span>
        </p>
      </div>
    </div>
  );
};

// --- Landing Page Component ---
const LandingPage = ({ onStart, onLoginClick }: { onStart: () => void, onLoginClick: () => void }) => {
    const [lang, setLang] = useState<LangCode>('de');
    const t = TRANSLATIONS[lang];
    const isRTL = lang === 'ar';

    return (
        <div className="landing-view" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
            <nav className="landing-nav">
                <div className="brand-logo">
                    <SparklesIcon /> DTZ Lingo
                </div>
                <div className="nav-actions">
                    <div className="lang-switch">
                        {(['de', 'en', 'ru', 'uk', 'ar'] as LangCode[]).map(c => (
                            <button 
                                key={c} 
                                className={`lang-btn ${lang === c ? 'active' : ''}`}
                                onClick={() => setLang(c)}
                            >
                                {c.toUpperCase()}
                            </button>
                        ))}
                    </div>
                    <button className="secondary-btn" style={{margin:0, padding: '8px 16px', fontSize:'0.9rem'}} onClick={onLoginClick}>
                        {t.ctaLogin}
                    </button>
                </div>
            </nav>

            <section className="landing-hero">
                <h1 className="hero-title">{t.heroTitle}</h1>
                <p className="hero-subtitle">{t.heroSubtitle}</p>
                <button className="hero-cta-btn" onClick={onStart}>{t.ctaStart}</button>
            </section>

            <section className="video-section">
                <div className="video-placeholder">
                    <div className="play-circle">
                        <PlayIcon />
                    </div>
                    {/* Placeholder text or effect */}
                </div>
            </section>

            <section className="features-section">
                <div className="features-grid">
                    <div className="feature-card">
                        <div className="feature-icon">🤖</div>
                        <h3>{t.feat1Title}</h3>
                        <p>{t.feat1Desc}</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">⚡</div>
                        <h3>{t.feat2Title}</h3>
                        <p>{t.feat2Desc}</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">📈</div>
                        <h3>{t.feat3Title}</h3>
                        <p>{t.feat3Desc}</p>
                    </div>
                </div>
            </section>

            <footer className="landing-footer">
                <div className="footer-content">
                    <div className="social-links">
                         <a href="#" className="social-link"><TikTokIcon /></a>
                         <a href="#" className="social-link"><TelegramIcon /></a>
                         <a href="#" className="social-link"><FacebookIcon /></a>
                    </div>
                    <div style={{color: '#AFBCC4', fontSize: '0.9rem'}}>
                        {t.madeWith}
                    </div>
                </div>
            </footer>
        </div>
    );
};


// --- App ---
function App() {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<'user' | 'admin'>('user');
  const [stats, setStats] = useState<UserStats>({ totalExams: 0, lastGrade: '-', modulesTaken: 0, recentSessions: [], allSessions: [] });
  const [state, setState] = useState<ExamState>({ module: null, step: 'landing', history: [], turnCount: 0 }); // Start at landing
  const [adminSessions, setAdminSessions] = useState<SessionData[]>([]);
  
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  
  const isExamActiveRef = useRef<boolean>(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // 🚀 VERSION CHECK: Show this in console to verify new code is running
    console.log("🚀 STARTING APP - VERSION: USER_PROFILE_V1");
    
    // Debug API Key presence (safe check)
    if (process.env.API_KEY && process.env.API_KEY.length > 10) {
        console.log("✅ API Key is present (Length: " + process.env.API_KEY.length + ")");
    } else {
        console.error("❌ API Key is MISSING or too short.");
    }

    // Check initial session
    if (supabase) {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                setUser(session.user);
                fetchUserRole(session.user.id);
                setState(s => ({ ...s, step: 'menu' })); // Auto-login to menu if session exists
                fetchStats(session.user.id);
            }
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
                setUser(session.user);
                fetchUserRole(session.user.id);
                // If we were in landing or auth, go to menu. Otherwise stay (e.g. during exam)
                setState(prev => (prev.step === 'auth' || prev.step === 'landing') ? { ...prev, step: 'menu' } : prev);
                fetchStats(session.user.id);
            } else {
                setUser(null);
                setUserRole('user');
                // On logout, go to landing instead of auth
                setState(s => ({ ...s, step: 'landing' }));
            }
        });

        return () => subscription.unsubscribe();
    }
  }, []);

  // Timer logic for Writing module
  useEffect(() => {
    let interval: any;
    if (state.module === 'schreiben' && state.step === 'exam' && state.timeLeft && state.timeLeft > 0) {
      interval = setInterval(() => {
        setState(prev => ({ ...prev, timeLeft: (prev.timeLeft || 0) - 1 }));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [state.module, state.step, state.timeLeft]);

  const handleGuestLogin = () => {
      const guestUser = { 
          id: 'guest', 
          email: 'gast@demo.de',
          app_metadata: {},
          user_metadata: {},
          aud: 'authenticated',
          created_at: new Date().toISOString()
      } as User;
      setUser(guestUser);
      setUserRole('user');
      setState(s => ({ ...s, step: 'menu' }));
  };

  const fetchUserRole = async (userId: string) => {
      if (!supabase || userId === 'guest') return;
      const { data } = await supabase.from('profiles').select('role').eq('id', userId).single();
      if (data) {
          setUserRole(data.role as 'user' | 'admin');
      }
  };

  const fetchStats = async (userId: string) => {
      if (!supabase || userId === 'guest') return;
      
      console.log("Fetching stats from exam_sessions...");

      // Fetch from new exam_sessions table
      const { data, error } = await supabase
        .from('exam_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
          console.error("Error fetching stats:", error);
      }
      
      if (data) {
          console.log("Stats loaded:", data.length);
          const sessions = data as any[];
          setStats({
              totalExams: sessions.length,
              lastGrade: sessions.length > 0 ? sessions[0].grade : '-',
              modulesTaken: sessions.length,
              recentSessions: sessions.slice(0, 10), // Limit recent for stats/widgets
              allSessions: sessions // Keep full history for profile
          });
      }
  };

  const fetchAdminData = async () => {
      if (!supabase || userRole !== 'admin') return;
      const { data, error } = await supabase
        .from('exam_sessions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
        
      if (!error && data) {
          setAdminSessions(data as any[]);
      }
  };

  const saveResult = async (result: GradingResult, module: ExamModule, transcriptContent: any) => {
      // 1. Check if we should save
      if (!supabase) {
          console.warn("Skipping save: No Supabase client");
          return;
      }
      if (!user) {
          console.warn("Skipping save: No user");
          return;
      }
      if (user.id === 'guest') {
          console.log("Skipping save: Guest user data is not persisted.");
          return;
      }
      
      const duration = state.startTime ? Math.floor((Date.now() - state.startTime) / 1000) : 0;
      const topic = state.currentTopic || state.writingTask?.topic || state.planningTask?.topic || "Unbekannt";

      console.log("Saving result to DB (exam_sessions):", {
          module,
          transcriptContent
      });

      // 2. Attempt Save
      const { error } = await supabase.from('exam_sessions').insert({
          user_id: user.id,
          module: module,
          topic: topic,
          grade: result.grade,
          duration_seconds: duration,
          transcript: transcriptContent, 
          feedback_data: result,
          created_at: new Date().toISOString()
      });

      // 3. Handle Errors explicitly
      if (error) {
          console.error("FATAL DB ERROR:", error);
          alert(`Fehler beim Speichern des Ergebnisses!\n\nDetails: ${error.message}\nCode: ${error.code}`);
      } else {
          console.log("✅ Save successful!");
          fetchStats(user.id);
      }
  };

  useEffect(() => {
    return () => stopAudio();
  }, []);

  const stopAudio = () => {
    if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
    }
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  };

  const stopExam = () => {
    isExamActiveRef.current = false;
    stopAudio();
    if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop();
    setIsRecording(false);
    setIsProcessing(false);
    setState({ module: null, step: 'menu', history: [], turnCount: 0 });
  };

  const speakText = async (text: string) => {
    // No speaking for writing module
    if (state.module === 'schreiben') return;

    console.log("Speaking text:", text);
    if (!isExamActiveRef.current || !process.env.API_KEY) {
        console.warn("Cannot speak: exam not active or API key missing");
        return;
    }
    stopAudio();
    try {
      const openai = new OpenAI({ apiKey: process.env.API_KEY, dangerouslyAllowBrowser: true });
      const mp3 = await openai.audio.speech.create({
          model: "tts-1",
          voice: "alloy",
          input: text,
      });

      const blob = await mp3.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.play();
    } catch (e: any) {
      console.error("TTS Error:", e);
      speakFallback(text);
    }
  };

  const speakFallback = (text: string) => {
    if (state.module === 'schreiben') return;
    console.log("Using fallback TTS");
    if (!isExamActiveRef.current) return;
    stopAudio();
    if (!('speechSynthesis' in window)) return;
    const utterance = new SpeechSynthesisUtterance(text);
    const deVoice = window.speechSynthesis.getVoices().find(v => v.lang.startsWith('de'));
    if (deVoice) utterance.voice = deVoice;
    utterance.lang = 'de-DE';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  // --- REVISED IMAGE FETCHING ---
  const fetchExamImage = async (topic: string): Promise<{url: string, source: 'unsplash' | 'fallback', debug?: string}> => {
      // 1. Get Key from process.env (mapped in vite.config.ts)
      const accessKey = process.env.UNSPLASH_ACCESS_KEY;
      
      const fallbackUrl = FALLBACK_IMAGES[Math.floor(Math.random() * FALLBACK_IMAGES.length)];

      if (!accessKey) {
          console.warn("Unsplash: No access key provided.");
          return { url: fallbackUrl, source: 'fallback', debug: 'MISSING_KEY_IN_ENV' };
      }

      try {
          // 2. Fetch with Headers (more robust than query params)
          const response = await fetch(`https://api.unsplash.com/photos/random?query=${encodeURIComponent(topic)}&orientation=landscape`, {
              headers: {
                  'Authorization': `Client-ID ${accessKey}`
              }
          });
          
          if (!response.ok) {
              const errText = `API_ERROR_${response.status}`; // e.g. API_ERROR_403 (Rate Limit)
              console.error(`[Unsplash] Error: ${response.status}`);
              return { url: fallbackUrl, source: 'fallback', debug: errText };
          }
          
          const data = await response.json();
          if (!data.urls || !data.urls.regular) {
              return { url: fallbackUrl, source: 'fallback', debug: 'NO_IMAGE_DATA' };
          }

          console.log("[Unsplash] Success");
          return { url: data.urls.regular, source: 'unsplash', debug: 'OK' };

      } catch (e: any) {
          console.error("[Unsplash] Failed connection", e);
          return { url: fallbackUrl, source: 'fallback', debug: `NET_ERR: ${e.message}` };
      }
  };

  const handleStartExam = async (module: ExamModule) => {
    if (isProcessing) return;
    if (!process.env.API_KEY) {
        setError("API Key fehlt. Bitte Konfiguration prüfen (Vercel ENV Settings).");
        return;
    }

    setIsProcessing(true);
    setError(null);
    isExamActiveRef.current = true;
    
    // Writing Module Logic
    if (module === 'schreiben') {
        const prompt = WRITING_PROMPTS[Math.floor(Math.random() * WRITING_PROMPTS.length)];
        setState({
            module,
            step: 'exam',
            history: [],
            turnCount: 0,
            grading: undefined,
            writingTask: prompt,
            writingInput: '',
            timeLeft: 30 * 60, // 30 minutes in seconds
            startTime: Date.now() // Track start time
        });
        setIsProcessing(false);
        return;
    }

    let initialGreeting = "";
    let currentImage = "";
    let imageSource: 'unsplash' | 'fallback' | undefined;
    let debugInfo = "";
    let topic = "";
    let planningTask: { topic: string; situation: string; points: string[] } | undefined;

    try {
      if (module === 'bild') {
        topic = EXAM_TOPICS[Math.floor(Math.random() * EXAM_TOPICS.length)];
        const imgData = await fetchExamImage(topic);
        currentImage = imgData.url;
        imageSource = imgData.source;
        debugInfo = imgData.debug || "";
        initialGreeting = `Guten Tag. Teil 2: Bildbeschreibung. Bitte beschreiben Sie dieses Bild.`;
      } else if (module === 'vorstellung') {
        initialGreeting = "Guten Tag. Teil 1: Die Vorstellung. Erzählen Sie etwas über sich.";
      } else if (module === 'planung') {
        // Pick random planning scenario
        planningTask = PLANNING_SCENARIOS[Math.floor(Math.random() * PLANNING_SCENARIOS.length)];
        initialGreeting = `Hallo. Teil 3: Gemeinsam planen. Wir wollen zusammen folgendes planen: ${planningTask.topic}. Haben Sie Vorschläge?`;
      }

      if (isExamActiveRef.current) {
        setState({ 
            module, 
            step: 'exam', 
            history: [{ role: 'assistant', text: initialGreeting }], 
            turnCount: 0, 
            currentImage,
            imageSource,
            debugInfo,
            currentTopic: topic,
            grading: undefined,
            planningTask,
            startTime: Date.now() // Track start time
        });
        await speakText(initialGreeting);
      }
    } catch (err: any) {
      setError(err.message || "Fehler.");
    } finally {
      if (isExamActiveRef.current) setIsProcessing(false);
    }
  };

  const generateGrading = async (history: Message[], writtenText?: string) => {
    if (!process.env.API_KEY) return;
    setIsProcessing(true);
    try {
        let systemPrompt = "";
        let userContent = "";

        // Prepare the transcript explicitly for saving later
        let transcriptPayload: any = history;

        if (state.module === 'schreiben' && writtenText) {
            const task = state.writingTask?.text || "Unbekannte Aufgabe";
            systemPrompt = "Du bist ein strenger DTZ Prüfer für den schriftlichen Teil (Brief/E-Mail). Bewerte den Text. Achte auf: 1. Erfüllung der 3 Leitpunkte (sehr wichtig). 2. Grammatik und Wortschatz (B1 Niveau). 3. Kommunikative Gestaltung (Anrede, Grußformel, Logik).";
            userContent = `Aufgabe: ${task}\n\nSchüler-Text:\n${writtenText}`;
            transcriptPayload = [{ role: 'user', text: writtenText }];
        } else {
             // Oral Grading
             const transcript = history.map(m => `${m.role.toUpperCase()}: ${m.text}`).join('\n');
             const topicInfo = state.currentTopic ? `(Thema: ${state.currentTopic})` : (state.planningTask ? `(Planung: ${state.planningTask.topic})` : "");
             systemPrompt = `Du bist ein strenger DTZ Prüfer (Mündlich). Modul: ${state.module}. ${topicInfo} Analysiere das Transkript. Ignoriere Fehler bei der Zeichensetzung.`;
             userContent = `Analysiere:\n${transcript}`;
        }

        const openai = new OpenAI({ apiKey: process.env.API_KEY, dangerouslyAllowBrowser: true });
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            response_format: { type: "json_object" },
            messages: [
                { role: "system", content: systemPrompt + "\n\nWICHTIG: Gib das Ergebnis als JSON im Format {grade, reasoning, tips: [], mistakes: [{original, correction, explanation}]} zurück. Das Feld 'grade' MUSS exakt einer dieser Strings sein: 'A1', 'A2', 'B1' oder 'Unter A1'. Gib KEINE Schulnote (wie 1, 2, 3) zurück." },
                { role: "user", content: userContent }
            ]
        });

        const content = completion.choices[0].message.content || "{}";
        const result = JSON.parse(content) as GradingResult;
        
        if (isExamActiveRef.current) {
            setState(prev => ({ ...prev, grading: result, step: 'result' }));
            // Pass the explicitly captured transcript payload
            saveResult(result, state.module, transcriptPayload);
        }
    } catch (e) {
        console.error(e);
        setError("Fehler bei der Auswertung.");
    } finally {
        setIsProcessing(false);
    }
  };

  const processUserResponse = async (audioBlob: Blob) => {
    if (!process.env.API_KEY) return;
    setIsProcessing(true);
    try {
        const openai = new OpenAI({ apiKey: process.env.API_KEY, dangerouslyAllowBrowser: true });
        
        // 1. STT (Whisper)
        const audioFile = new File([audioBlob], "input.webm", { type: "audio/webm" });
        const transResp = await openai.audio.transcriptions.create({
            file: audioFile,
            model: "whisper-1",
        });

        const text = transResp.text?.trim();

        if (!isExamActiveRef.current) return;
        if (!text || text.length < 2) {
             const fallback = "Ich habe Sie не verstanden. Bitte wiederholen.";
             setState(prev => ({ ...prev, history: [...prev.history, { role: 'user', text: "..." }, { role: 'assistant', text: fallback }] }));
             await speakText(fallback);
             setIsProcessing(false);
             return;
        }

        // --- Custom Logic for System Prompt based on Module ---
        let systemPrompt = "Du bist ein offizieller DTZ Prüfer (Deutsch-Test für Zuwanderer). WICHTIG: Sprich AUSSCHLIESSLICH DEUTSCH. Antworte NIEMALS in einer anderen Sprache (kein Arabisch, kein Russisch, kein Englisch), auch wenn der Nutzer es tut. Wenn du den Nutzer не понимаешь, sage 'Bitte sprechen Sie Deutsch'. Antworte kurz (max 2 Sätze). Stelle eine offene Frage passend zum Niveau B1.";
        
        const isFinalTurn = (state.module !== 'planung' && state.turnCount >= 2) || (state.module === 'planung' && state.turnCount > 12); 

        if (isFinalTurn) {
             systemPrompt = "Du bist DTZ Prüfer. Der Teil ist beendet. Antworte AUSSCHLIESSLICH DEUTSCH. Reagiere kurz und freundlich auf das Gesagte. Sage dann exakt: 'Danke, wir berechnen jetzt Ihre Punkte.' Stelle KEINE neuen Fragen.";
        } else if (state.module === 'bild') {
            if (state.turnCount === 0) {
              systemPrompt = `Du bist DTZ Prüfer (Teil 2: Bildbeschreibung, Thema: ${state.currentTopic}). Sprich NUR DEUTSCH. Der Teilnehmer hat das Bild beschrieben. Stelle nun EINE konkrete Frage zu einem Detail, das man на einem Bild zum Thema "${state.currentTopic}" sehen könnte.`;
            } else if (state.turnCount === 1) {
              systemPrompt = `Du bist DTZ Prüfer (Teil 2: Bildbeschreibung, Thema: ${state.currentTopic}). Sprich NUR DEUTSCH. Stelle nun EINE Frage zu den persönlichen Erfahrungen des Teilnehmers mit dem Thema "${state.currentTopic}".`;
            }
        } else if (state.module === 'planung' && state.planningTask) {
             // STRICT PLANNING PROMPT
             systemPrompt = `Du bist Prüfer beim DTZ 'Gemeinsam etwas planen'. Sprich NUR DEUTSCH.
             Situation: ${state.planningTask.situation}
             Punkte die besprochen werden müssen: ${state.planningTask.points.join(', ')}.
             
             REGELN:
             1. Gehe die Punkte logisch nacheinander durch.
             2. WICHTIG: Nutze MAXIMAL 2 Sätze/Fragen für einen Punkt. Wenn der Teilnehmer einen Vorschlag gemacht hat oder den Punkt verstanden hat, stimme kurz zu und gehe SOFORT zum nächsten Punkt. Halte dich nicht lange на.
             3. Wenn der Teilnehmer den Punkt nach deinem zweiten Versuch immer noch nicht klärt, gehe trotzdem weiter zum nächsten Punkt.
             4. Wenn alle Punkte besprochen sind, beende das Gespräch freundlich (z.B. "Gut, dann machen wir das so. Auf Wiedersehen") und sage NICHTS weiter.
             5. Sei ein kooperativer Gesprächspartner, nicht nur ein Fragesteller. Mache auch selbst kurze Vorschläge.`;
        }

        // 2. Chat (GPT-4o-mini)
        // Construct history
        const messages: any[] = [
            { role: "system", content: systemPrompt }
        ];

        // If module is 'bild' and we have an image, add it to history for context if needed, 
        // or just rely on system prompt context. 
        // Since GPT-4o-mini is multimodal, we can pass the image url in the first user message if this is the start.
        if (state.module === 'bild' && state.turnCount === 0 && state.currentImage) {
             // Add image context to the first turn
             // Note: In this simplified flow, we are just appending text history. 
             // Ideally we would insert the image message here.
             // For now, let's keep text-only history but system prompt knows the topic.
        }

        state.history.forEach(m => messages.push({ role: m.role, content: m.text }));
        messages.push({ role: "user", content: text });

        // If it is the very first turn of 'bild', let's attach the image URL to the user message content
        if (state.module === 'bild' && state.turnCount === 0 && state.currentImage) {
             const lastMsg = messages[messages.length - 1];
             lastMsg.content = [
                 { type: "text", text: text },
                 { type: "image_url", image_url: { url: state.currentImage } }
             ];
        }

        const chatResp = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: messages,
            max_tokens: 150
        });

        const aiText = chatResp.choices[0].message.content || "Bitte wiederholen.";
        if (!isExamActiveRef.current) return;

        const newHistory: Message[] = [...state.history, { role: 'user', text }, { role: 'assistant', text: aiText }];
        
        // Detect end of planning
        const isPlanningEnd = state.module === 'planung' && (aiText.toLowerCase().includes("auf wiedersehen") || aiText.toLowerCase().includes("wir berechnen") || state.turnCount > 10);

        if (isFinalTurn || isPlanningEnd) {
          await speakText(aiText);
          generateGrading(newHistory);
        } else {
          setState(prev => ({ ...prev, history: newHistory, turnCount: prev.turnCount + 1 }));
          await speakText(aiText);
        }
    } catch (e: any) {
        setError(e.message || "Fehler bei der KI.");
    } finally {
        if (isExamActiveRef.current) setIsProcessing(false);
    }
  };

  const toggleRecording = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    } else {
      try {
        stopAudio();
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        audioChunksRef.current = [];
        recorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
        recorder.onstop = () => processUserResponse(new Blob(audioChunksRef.current, { type: 'audio/webm' }));
        recorder.start();
        mediaRecorderRef.current = recorder;
        setIsRecording(true);
        setError(null);
      } catch (err) {
        setError("Kein Mikrofon.");
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // --- Helper for Writing Grading ---
  const renderAnnotatedText = (text: string, mistakes: Mistake[]) => {
     if (!text) return { rendered: null, orderedMistakes: [] as Mistake[] };

     // Clone mistakes
     const mappedMistakes = mistakes.map((m, index) => {
        return { ...m, id: index + 1 };
     });

     const foundMistakes: Array<{start: number, end: number, mistake: Mistake}> = [];
     
     mappedMistakes.forEach(m => {
        let searchStr = m.original.trim();
        if(!searchStr) return;
        
        let pos = -1;
        // Search
        while ((pos = text.indexOf(searchStr, pos + 1)) !== -1) {
            const end = pos + searchStr.length;
            const overlap = foundMistakes.some(fm => 
                (pos >= fm.start && pos < fm.end) || (end > fm.start && end <= fm.end) || (pos <= fm.start && end >= fm.end)
            );
            
            if (!overlap) {
                foundMistakes.push({ start: pos, end: end, mistake: m });
                break; 
            }
        }
        
        // Fallback: Case-insensitive search if strict failed
        if (pos === -1) {
            const lowerText = text.toLowerCase();
            const lowerSearch = searchStr.toLowerCase();
            pos = -1;
             while ((pos = lowerText.indexOf(lowerSearch, pos + 1)) !== -1) {
                const end = pos + searchStr.length;
                const overlap = foundMistakes.some(fm => 
                    (pos >= fm.start && pos < fm.end) || (end > fm.start && end <= fm.end) || (pos <= fm.start && end >= fm.end)
                );
                
                if (!overlap) {
                    foundMistakes.push({ start: pos, end: end, mistake: m });
                    break; 
                }
            }
        }
     });

     foundMistakes.sort((a, b) => a.start - b.start);

     const localizedMistakes = foundMistakes.map((fm, i) => ({
         ...fm.mistake,
         realId: i + 1,
         start: fm.start,
         end: fm.end
     }));

     const elements: ReactNode[] = [];
     let cursor = 0;

     localizedMistakes.forEach((fm, i) => {
         if (fm.start > cursor) {
             elements.push(<span key={`txt-${i}`}>{text.substring(cursor, fm.start)}</span>);
         }
         elements.push(
             <span key={`err-${i}`} className="error-highlight">
                 {text.substring(fm.start, fm.end)}
                 <sup className="error-badge">{fm.realId}</sup>
             </span>
         );
         cursor = fm.end;
     });
     
     if (cursor < text.length) {
         elements.push(<span key="txt-end">{text.substring(cursor)}</span>);
     }

     return { 
         rendered: <div className="annotated-text-container">{elements}</div>, 
         orderedMistakes: localizedMistakes as Mistake[] 
     };
  };

  // --- Views ---
  const ResultView = ({ grading, userText, module, onClose }: { grading?: GradingResult, userText?: string, module: ExamModule | string, onClose?: () => void }) => {
      if (!grading) return <div className="result-loading"><ThinkingIcon /><p>Auswertung läuft...</p></div>;
      
      const color = grading.grade === 'B1' ? '#58CC02' : grading.grade === 'A2' ? '#FFC800' : '#FF4B4B';
      
      let annotatedView = null;
      let orderedMistakes: Mistake[] = grading.mistakes || [];

      // Special View for Writing
      if (module === 'schreiben' && userText && grading.mistakes) {
         const annotation = renderAnnotatedText(userText, grading.mistakes);
         annotatedView = annotation.rendered;
         // Use the re-ordered mistakes list which matches the bubbles
         if (annotation.orderedMistakes && annotation.orderedMistakes.length > 0) {
             orderedMistakes = annotation.orderedMistakes;
         }
      }

      // FIX FOR GRADE OVERFLOW
      const isLongGrade = grading.grade.length > 3;
      const gradeFontSize = isLongGrade ? '1.8rem' : '3rem';

      return (
          <div className="result-content">
              {onClose && (
                  <button onClick={onClose} style={{position:'absolute', top: 0, right: 0, padding:'10px', background:'transparent', border:'none', color:'white', cursor:'pointer'}}>❌</button>
              )}
              <div className="grade-badge" style={{ borderColor: color, color }}>
                  <span className="label">Niveau</span>
                  <span className="value" style={{ fontSize: gradeFontSize }}>{grading.grade}</span>
              </div>
              
              <div className="result-section"><h3>Begründung</h3><p>{grading.reasoning}</p></div>

              {/* Writing: Annotated Text */}
              {annotatedView && (
                  <div className="result-section">
                      <h3>Ihr Text</h3>
                      {annotatedView}
                  </div>
              )}

              {/* Tips */}
              {grading.tips && grading.tips.length > 0 && (
                 <div className="result-section"><h3>Tipps</h3>
                    <ul style={{paddingLeft: '20px', margin: 0}}>{grading.tips.map((t, i) => <li key={i}>{t}</li>)}</ul>
                 </div>
              )}

              {/* Mistakes List */}
              {orderedMistakes.length > 0 && (
                  <div className="result-section"><h3>Fehler & Korrekturen</h3>
                      <div className="mistakes-list">
                      {orderedMistakes.map((m, i) => (
                          <div key={i} className="mistake-item error-detail-card">
                              {module === 'schreiben' && m.realId && (
                                  <div className="error-number-circle">{m.realId}</div>
                              )}
                              <div style={{flex: 1}}>
                                  <div className="mistake-orig">❌ {m.original}</div>
                                  <div className="mistake-corr">✅ {m.correction}</div>
                                  <div style={{fontSize:'0.85rem', opacity:0.8, marginTop: '4px'}}>{m.explanation}</div>
                              </div>
                          </div>
                      ))}
                      </div>
                  </div>
              )}
          </div>
      );
  };

  const AdminView = () => {
      useEffect(() => { fetchAdminData(); }, []);

      return (
          <div className="admin-view">
              <h2>Admin Dashboard</h2>
              <div className="admin-stats">
                  <div className="admin-stat-card">
                      <span className="admin-stat-num">{adminSessions.length}</span>
                      <span>Prüfungen total</span>
                  </div>
                   <div className="admin-stat-card">
                      <span className="admin-stat-num">{adminSessions.filter(s => s.grade === 'B1').length}</span>
                      <span>B1 Bestanden</span>
                  </div>
              </div>

              <h3>Letzte Aktivitäten</h3>
              <div className="admin-table-container">
                  <table className="admin-table">
                      <thead>
                          <tr>
                              <th>Zeit</th>
                              <th>User ID</th>
                              <th>Modul</th>
                              <th>Note</th>
                              <th>Aktion</th>
                          </tr>
                      </thead>
                      <tbody>
                          {adminSessions.map(s => (
                              <tr key={s.id}>
                                  <td>{new Date(s.created_at).toLocaleDateString()} {new Date(s.created_at).toLocaleTimeString().slice(0,5)}</td>
                                  <td><span className="user-pill">{s.id.slice(0,8)}...</span></td>
                                  <td>{s.module}</td>
                                  <td style={{color: s.grade === 'B1' ? '#58CC02' : '#FF4B4B', fontWeight: 'bold'}}>{s.grade}</td>
                                  <td>
                                      <button 
                                        onClick={() => setState(prev => ({ ...prev, viewHistoryItem: s }))}
                                        style={{background: 'transparent', border:'1px solid #37464F', color:'white', padding:'4px 8px', borderRadius:'6px', cursor:'pointer'}}
                                      >
                                          View
                                      </button>
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
              <button className="primary-btn" style={{marginTop:'20px'}} onClick={() => setState(prev => ({...prev, step: 'menu'}))}>
                  Zurück zum Menu
              </button>
          </div>
      );
  };

  const UserProfileView = () => {
    // Categorize sessions
    const writing = stats.allSessions.filter(s => s.module === 'schreiben');
    const speaking = stats.allSessions.filter(s => s.module === 'vorstellung' || s.module === 'bild' || s.module === 'planung');

    const renderSessionItem = (session: SessionData) => (
        <div key={session.id} className="history-card" onClick={() => setState(prev => ({ ...prev, viewHistoryItem: session }))}>
            <div className="history-info">
                <h4>{session.module === 'vorstellung' ? 'Sich vorstellen' : session.module === 'bild' ? 'Bildbeschreibung' : session.module === 'planung' ? 'Planung' : 'Schreiben'}</h4>
                <div className="history-date">{new Date(session.created_at).toLocaleDateString()} • {session.topic}</div>
            </div>
            <div className="history-grade" style={{
                color: session.grade === 'B1' ? '#58CC02' : session.grade === 'A2' ? '#FFC800' : '#FF4B4B',
                border: `1px solid ${session.grade === 'B1' ? '#58CC02' : session.grade === 'A2' ? '#FFC800' : '#FF4B4B'}`
            }}>
                {session.grade}
            </div>
        </div>
    );

    return (
        <div className="profile-view">
             {/* Account Card */}
             <div className="account-card">
                 <div className="account-status-badge">Dein Plan</div>
                 <h2>Free Plan</h2>
                 <p style={{color:'#AFBCC4', marginBottom:'20px', fontSize:'0.9rem'}}>Upgrade für unbegrenzte Prüfungen und detailliertes Feedback.</p>
                 <button className="premium-btn">Upgrade to Premium</button>
             </div>

             <div className="stats-row" style={{justifyContent: 'flex-start', marginTop: '10px'}}>
                  <div className="stat-pill">📊 Gesamt: {stats.totalExams}</div>
             </div>
             
             {/* Categorized Lists */}
             <div className="category-header">✍️ Schreiben</div>
             <div className="history-list">
                 {writing.length > 0 ? writing.map(renderSessionItem) : <p style={{color:'#AFBCC4', fontStyle:'italic', fontSize:'0.9rem'}}>Keine Ergebnisse.</p>}
             </div>

             <div className="category-header">🗣️ Sprechen</div>
             <div className="history-list">
                 {speaking.length > 0 ? speaking.map(renderSessionItem) : <p style={{color:'#AFBCC4', fontStyle:'italic', fontSize:'0.9rem'}}>Keine Ergebnisse.</p>}
             </div>

             <button className="secondary-btn" style={{marginTop:'30px'}} onClick={() => setState(prev => ({...prev, step: 'menu'}))}>
                 Zurück zum Menu
             </button>
        </div>
    );
  };

  return (
    <div className="dtz-app">
      <DottedGlowBackground />
      {/* ROUTING LOGIC */}
      {state.step === 'landing' && (
          <LandingPage 
            onStart={() => setState(s => ({ ...s, step: 'auth' }))}
            onLoginClick={() => setState(s => ({ ...s, step: 'auth' }))}
          />
      )}

      {state.step === 'auth' && (
        <>
            <button 
                className="back-btn" 
                style={{position: 'absolute', top: '20px', left: '20px', zIndex: 60}} 
                onClick={() => setState(s => ({ ...s, step: 'landing' }))}
            >
                <ArrowLeftIcon />
            </button>
            <AuthScreen onLogin={(u) => setUser(u)} onGuest={handleGuestLogin} />
        </>
      )}

      {/* MAIN APP CONTENT (Menu, Exam, Result, Admin, Profile) */}
      {(state.step === 'menu' || state.step === 'exam' || state.step === 'result' || state.step === 'admin' || state.step === 'profile') && (
        <>
        <header className="dtz-header">
            {state.step !== 'menu' && <button className="back-btn" onClick={() => {
                if (state.step === 'profile' || state.step === 'admin') setState(s => ({...s, step: 'menu'}));
                else stopExam();
            }}><ArrowLeftIcon /></button>}
            
            <div className="progress-container">
                {state.module === 'schreiben' ? (
                     <div className="progress-bar" style={{ width: `${((state.timeLeft || 0) / 1800) * 100}%`, background: (state.timeLeft || 0) < 300 ? '#FF4B4B' : '#58CC02' }}></div>
                ) : (
                    <div className="progress-bar" style={{ width: state.step === 'exam' ? `${(state.turnCount / 2) * 100}%` : '100%' }}></div>
                )}
            </div>
            
            {/* Header Actions */}
            <div style={{display:'flex', gap:'10px', alignItems:'center'}}>
                {userRole === 'admin' && state.step !== 'admin' && (
                    <button className="admin-badge" onClick={() => setState(s => ({...s, step: 'admin'}))}>ADMIN</button>
                )}

                {state.step === 'menu' && (
                    <button className="profile-btn-header" onClick={() => setState(s => ({...s, step: 'profile'}))}>PROFIL</button>
                )}

                {state.step === 'exam' ? <button className="finish-btn" onClick={stopExam}>ABBRUCH</button> : 
                    (user && <button className="finish-btn" onClick={() => { if(user.id === 'guest') { setUser(null); setUserRole('user'); setState(s=>({...s, step:'landing'})); } else { supabase?.auth.signOut(); } }}>LOGOUT</button>)}
            </div>
        </header>

        <main className="dtz-main">
            {error && <div className="error-toast" onClick={() => setError(null)}>{error}</div>}
            
            {state.step === 'menu' && (
            <div className="menu-view">
                <div className="welcome">
                    {/* Fixed dynamic font size for avatar */}
                    <div className="avatar-placeholder" style={{ fontSize: stats.lastGrade.length > 3 ? '1.2rem' : '2.5rem' }}>{stats.lastGrade === '-' ? <SparklesIcon /> : stats.lastGrade}</div>
                    <h1>Hallo, {user?.email ? user.email.split('@')[0] : 'Gast'}</h1>
                    <div className="stats-row">
                        <div className="stat-pill">📝 {stats.totalExams} Prüfungen</div>
                        <div className="stat-pill">⭐ Letzte Note: {stats.lastGrade}</div>
                    </div>
                </div>
                
                {stats.totalExams === 0 && (
                    <p style={{color: 'var(--duo-text-sec)', fontSize: '0.9rem', marginTop: '-10px', marginBottom: '20px'}}>
                        Noch keine Ergebnisse vorhanden. Starten Sie jetzt!
                    </p>
                )}

                <div className="module-grid">
                {(['vorstellung', 'bild', 'planung', 'schreiben'] as const).map(m => (
                    <button key={m} className="module-card" onClick={() => handleStartExam(m)} disabled={isProcessing}>
                    <span className="icon">
                        {m === 'vorstellung' ? '👤' : m === 'bild' ? '🖼️' : m === 'planung' ? '🗓️' : '✍️'}
                    </span>
                    <div className="module-info">
                        <h3>
                            {m === 'vorstellung' ? 'Teil 1: Sich vorstellen' : 
                             m === 'bild' ? 'Teil 2: Bildbeschreibung' : 
                             m === 'planung' ? 'Teil 3: Gemeinsam planen' : 
                             'Teil 4: Schreiben (Brief/E-Mail)'}
                        </h3>
                    </div>
                    {isProcessing && state.module === m && <ThinkingIcon />}
                    </button>
                ))}
                </div>
                
                <div style={{marginTop: '40px', color: '#37464F', fontSize: '0.8rem'}}>
                    App Version: 6.0 (USER PROFILE)
                </div>
            </div>
            )}

            {state.step === 'admin' && <AdminView />}
            {state.step === 'profile' && <UserProfileView />}

            {state.step === 'exam' && (
                <>
                {state.module === 'schreiben' ? (
                    <div className="writing-view">
                         <div className="task-box">
                            <div className="task-header">
                                <h3>{state.writingTask?.topic}</h3>
                                <div className="timer-display">{formatTime(state.timeLeft || 0)}</div>
                            </div>
                            <div className="task-content">
                                {state.writingTask?.text.split('\n').map((line, i) => <p key={i}>{line}</p>)}
                            </div>
                         </div>
                         <div className="writing-area-container">
                             <textarea 
                                className="writing-input" 
                                placeholder="Schreiben Sie hier Ihren Text..."
                                value={state.writingInput}
                                onChange={(e) => setState(prev => ({...prev, writingInput: e.target.value}))}
                                spellCheck={false}
                             />
                             <div className="writing-footer">
                                 <span>{state.writingInput?.trim().split(/\s+/).filter(w => w.length > 0).length || 0} Wörter</span>
                                 <button 
                                    className="primary-btn small" 
                                    onClick={() => generateGrading([], state.writingInput)}
                                    disabled={isProcessing || !state.writingInput || state.writingInput.length < 10}
                                 >
                                     {isProcessing ? 'Sende...' : 'Abgeben'}
                                 </button>
                             </div>
                         </div>
                    </div>
                ) : (
                    <div className="exam-view">
                        {/* PLANNING TASK DISPLAY */}
                        {state.module === 'planung' && state.planningTask && (
                           <div className="task-box" style={{marginBottom: '10px'}}>
                              <div className="task-header">
                                  <h3>{state.planningTask.topic}</h3>
                              </div>
                              <div className="task-content">
                                  <p>{state.planningTask.situation}</p>
                                  <ul style={{paddingLeft: '20px', marginTop: '5px', marginBottom: 0}}>
                                      {state.planningTask.points.map((p, idx) => (
                                          <li key={idx} style={{marginBottom: '4px'}}>{p}</li>
                                      ))}
                                  </ul>
                              </div>
                           </div>
                        )}

                        {state.currentImage && (
                            <div className="exam-visual">
                                <img src={state.currentImage} alt="exam" />
                                {state.debugInfo && state.debugInfo !== 'OK' && (
                                    <div className="topic-overlay">
                                        <div style={{color: '#FF4B4B', fontWeight: 'bold', fontSize: '11px'}}>
                                           ❌ DEBUG: {state.debugInfo}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                        <div className="chat-area">
                        {state.history.map((msg, i) => (
                            <div key={i} className={`bubble ${msg.role}`}>{msg.text}</div>
                        ))}
                        {isProcessing && <div className="bubble assistant loading"><ThinkingIcon /></div>}
                        </div>
                        <div className="controls">
                        <button className={`mic-btn ${isRecording ? 'recording' : ''}`} onClick={toggleRecording} disabled={isProcessing}>
                            {isRecording ? "STOPP" : "SPRECHEN"}
                        </button>
                        </div>
                    </div>
                )}
                </>
            )}

            {state.step === 'result' && (
            <div className="result-view">
                <ResultView grading={state.grading} userText={state.writingInput} module={state.module} />
                <button className="primary-btn" style={{marginTop:'20px'}} onClick={() => setState({ ...state, step: 'menu', history: [], turnCount: 0 })}>MENU</button>
            </div>
            )}

            {/* HISTORY OVERLAY (Using Portal) */}
            {state.viewHistoryItem && createPortal(
                <div className="history-modal-overlay">
                    <div className="history-modal-header">
                         <span className="history-modal-title">
                             {state.viewHistoryItem.module.toUpperCase()} - {new Date(state.viewHistoryItem.created_at).toLocaleDateString()}
                         </span>
                         <button 
                             className="modal-close-btn"
                             onClick={() => setState(prev => ({ ...prev, viewHistoryItem: undefined }))}
                         >
                             ✕
                         </button>
                    </div>
                    <div className="history-modal-scroll-area">
                        <div className="history-modal-content">
                            <ResultView 
                                grading={state.viewHistoryItem.feedback_data} 
                                module={state.viewHistoryItem.module} 
                                userText={
                                    state.viewHistoryItem.module === 'schreiben' && Array.isArray(state.viewHistoryItem.transcript) && state.viewHistoryItem.transcript[0]?.text
                                    ? state.viewHistoryItem.transcript[0].text 
                                    : undefined
                                }
                            />
                            {/* Redundant close button at bottom */}
                             <button className="secondary-btn" style={{marginTop: '30px', borderColor: '#FF4B4B', color: '#FF4B4B'}} onClick={() => setState(prev => ({ ...prev, viewHistoryItem: undefined }))}>
                                Schließen
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

        </main>
        </>
      )}
    </div>
  );
}

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(<ErrorBoundary><App /></ErrorBoundary>);
}