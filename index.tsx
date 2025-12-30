import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import OpenAI from 'openai';
import { createClient, User } from '@supabase/supabase-js';
import DottedGlowBackground from './components/DottedGlowBackground';
import { ThinkingIcon, ArrowLeftIcon, SparklesIcon } from './components/Icons';
import { supabase } from './supabase';

// --- Constants ---
const EXAM_IMAGES = [
  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80",
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80",
  "https://images.unsplash.com/photo-1556910103-1c02745a30bf?w=800&q=80",
  "https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80",
  "https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=800&q=80",
  "https://images.unsplash.com/photo-1570829460005-c840387bb1ca?w=800&q=80",
  "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&q=80",
  "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&q=80",
];

// --- Types ---
type ExamModule = 'vorstellung' | 'bild' | 'planung' | null;

interface Message {
  role: 'user' | 'assistant';
  text: string;
}

interface GradingResult {
  grade: 'A1' | 'A2' | 'B1' | 'Unter A1';
  reasoning: string;
  tips: string[];
  mistakes: Array<{
    original: string;
    correction: string;
    explanation: string;
  }>;
}

interface ExamState {
  module: ExamModule;
  step: 'auth' | 'menu' | 'exam' | 'result';
  history: Message[];
  turnCount: number;
  currentImage?: string;
  grading?: GradingResult;
}

interface UserStats {
  totalExams: number;
  lastGrade: string;
  modulesTaken: number;
}

// --- Error Boundary ---
class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean}> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
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

// --- App ---
function App() {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<UserStats>({ totalExams: 0, lastGrade: '-', modulesTaken: 0 });
  const [state, setState] = useState<ExamState>({ module: null, step: 'auth', history: [], turnCount: 0 });
  
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  // Use HTMLAudioElement for playback with OpenAI URL
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isExamActiveRef = useRef<boolean>(false);

  // Initialize OpenAI
  const openaiRef = useRef<OpenAI | null>(null);

  useEffect(() => {
    if (process.env.OPENAI_API_KEY) {
        openaiRef.current = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
            dangerouslyAllowBrowser: true // Required for client-side use
        });
    } else {
        console.error("OPENAI_API_KEY is missing");
    }
  }, []);

  useEffect(() => {
    // Check initial session
    if (supabase) {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                setUser(session.user);
                setState(s => ({ ...s, step: 'menu' }));
                fetchStats(session.user.id);
            }
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
                setUser(session.user);
                setState(prev => prev.step === 'auth' ? { ...prev, step: 'menu' } : prev);
                fetchStats(session.user.id);
            } else {
                setUser(null);
                setState(s => ({ ...s, step: 'auth' }));
            }
        });

        return () => subscription.unsubscribe();
    }
  }, []);

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
      setState(s => ({ ...s, step: 'menu' }));
  };

  const fetchStats = async (userId: string) => {
      if (!supabase || userId === 'guest') return;
      const { data, error } = await supabase
        .from('exam_results')
        .select('grade')
        .eq('user_id', userId);
      
      if (data) {
          setStats({
              totalExams: data.length,
              lastGrade: data.length > 0 ? data[data.length - 1].grade : '-',
              modulesTaken: data.length
          });
      }
  };

  const saveResult = async (result: GradingResult, module: ExamModule) => {
      if (!supabase || !user || user.id === 'guest') return;
      
      await supabase.from('exam_results').insert({
          user_id: user.id,
          module: module,
          grade: result.grade,
          feedback: result.reasoning
      });
      fetchStats(user.id);
  };

  useEffect(() => {
    return () => stopAudio();
  }, []);

  const stopAudio = () => {
    if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
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
    if (!isExamActiveRef.current || !openaiRef.current) return;
    stopAudio();
    try {
      const mp3 = await openaiRef.current.audio.speech.create({
          model: "tts-1",
          voice: "alloy",
          input: text,
      });

      const buffer = await mp3.arrayBuffer();
      const blob = new Blob([buffer], { type: "audio/mpeg" });
      const url = URL.createObjectURL(blob);
      
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => { URL.revokeObjectURL(url); };
      
      if (isExamActiveRef.current) {
          await audio.play();
      }
    } catch (e: any) {
      console.error(e);
      speakFallback(text);
    }
  };

  const speakFallback = (text: string) => {
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

  const handleStartExam = async (module: ExamModule) => {
    if (isProcessing) return;
    if (!process.env.OPENAI_API_KEY) {
        setError("API Key fehlt. Bitte Konfiguration prüfen.");
        return;
    }

    setIsProcessing(true);
    setError(null);
    isExamActiveRef.current = true;
    
    let initialGreeting = "";
    let currentImage = "";

    try {
      if (module === 'bild') {
        currentImage = EXAM_IMAGES[Math.floor(Math.random() * EXAM_IMAGES.length)];
        initialGreeting = "Guten Tag. Teil 2: Bildbeschreibung. Was sehen Sie?";
      } else if (module === 'vorstellung') {
        initialGreeting = "Guten Tag. Teil 1: Die Vorstellung. Erzählen Sie etwas über sich.";
      } else {
        initialGreeting = "Hallo. Teil 3: Gemeinsam planen. Ein Abschiedsfest. Haben Sie Vorschläge?";
      }

      if (isExamActiveRef.current) {
        setState({ 
            module, 
            step: 'exam', 
            history: [{ role: 'assistant', text: initialGreeting }], 
            turnCount: 0, 
            currentImage,
            grading: undefined
        });
        await speakText(initialGreeting);
      }
    } catch (err: any) {
      setError(err.message || "Fehler.");
    } finally {
      if (isExamActiveRef.current) setIsProcessing(false);
    }
  };

  const generateGrading = async (history: Message[]) => {
    if (!openaiRef.current) return;
    try {
        const transcript = history.map(m => `${m.role.toUpperCase()}: ${m.text}`).join('\n');
        
        const completion = await openaiRef.current.chat.completions.create({
            model: "gpt-4o-mini", // Использование дешевой модели
            messages: [
                { role: "system", content: "Du bist ein strenger DTZ Prüfer. Analysiere das Transkript und gib das Ergebnis als JSON zurück." },
                { role: "user", content: `Analysiere:\n${transcript}\n\nFormat JSON:\n{
                    "grade": "A1" | "A2" | "B1" | "Unter A1",
                    "reasoning": "string",
                    "tips": ["string"],
                    "mistakes": [{"original": "string", "correction": "string", "explanation": "string"}]
                }`}
            ],
            response_format: { type: "json_object" }
        });

        const content = completion.choices[0].message.content;
        const result = JSON.parse(content || "{}") as GradingResult;
        
        if (isExamActiveRef.current) {
            setState(prev => ({ ...prev, grading: result }));
            saveResult(result, state.module);
        }
    } catch (e) {
        console.error(e);
    }
  };

  const processUserResponse = async (audioBlob: Blob) => {
    if (!openaiRef.current) return;
    setIsProcessing(true);
    try {
        // 1. Transcribe (Whisper)
        const file = new File([audioBlob], "recording.webm", { type: "audio/webm" });
        const transcription = await openaiRef.current.audio.transcriptions.create({
            file,
            model: "whisper-1",
            language: "de"
        });

        const text = transcription.text?.trim();

        if (!isExamActiveRef.current) return;
        if (!text || text.length < 2) {
             const fallback = "Ich habe Sie nicht verstanden. Bitte wiederholen.";
             setState(prev => ({ ...prev, history: [...prev.history, { role: 'user', text: "..." }, { role: 'assistant', text: fallback }] }));
             await speakText(fallback);
             setIsProcessing(false);
             return;
        }

        // --- Custom Logic for System Prompt based on Module ---
        let systemPrompt = "Du bist DTZ Prüfer. Antworte kurz (max 2 Sätze). Stelle eine Frage.";
        if (state.module === 'bild') {
          if (state.turnCount === 0) {
            systemPrompt = "Du bist DTZ Prüfer (Teil 2: Bildbeschreibung). Der Teilnehmer hat das Bild beschrieben. Stelle nun EINE konkrete Frage zu einem Detail, das man auf dem Bild sehen könnte.";
          } else if (state.turnCount === 1) {
            systemPrompt = "Du bist DTZ Prüfer (Teil 2: Bildbeschreibung). Stelle nun EINE Frage zu den persönlichen Erfahrungen, Gefühlen oder der Meinung des Teilnehmers zum Thema des Bildes.";
          }
        }

        // 2. Chat (GPT-4o-mini)
        const completion = await openaiRef.current.chat.completions.create({
            model: "gpt-4o-mini", // Использование дешевой модели
            messages: [
                { role: "system", content: systemPrompt },
                ...state.history.map(m => ({ role: m.role, content: m.text })),
                { role: "user", content: text }
            ]
        });

        const aiText = completion.choices[0].message.content || "Bitte wiederholen.";
        if (!isExamActiveRef.current) return;

        const newHistory: Message[] = [...state.history, { role: 'user', text }, { role: 'assistant', text: aiText }];

        if (state.turnCount >= 2) {
          setState(prev => ({ ...prev, history: newHistory, step: 'result', grading: undefined }));
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

  // --- Views ---
  const ResultView = ({ grading }: { grading?: GradingResult }) => {
      if (!grading) return <div className="result-loading"><ThinkingIcon /><p>Auswertung läuft...</p></div>;
      const color = grading.grade === 'B1' ? '#58CC02' : grading.grade === 'A2' ? '#FFC800' : '#FF4B4B';
      return (
          <div className="result-content">
              <div className="grade-badge" style={{ borderColor: color, color }}>
                  <span className="label">Niveau</span>
                  <span className="value">{grading.grade}</span>
              </div>
              <div className="result-section"><h3>Begründung</h3><p>{grading.reasoning}</p></div>
              {grading.mistakes?.length > 0 && (
                  <div className="result-section"><h3>Fehler</h3>
                      <div className="mistakes-list">{grading.mistakes.map((m, i) => (
                          <div key={i} className="mistake-item"><div className="mistake-orig">❌ {m.original}</div><div className="mistake-corr">✅ {m.correction}</div></div>
                      ))}</div>
                  </div>
              )}
          </div>
      );
  };

  return (
    <div className="dtz-app">
      <DottedGlowBackground />
      {state.step === 'auth' ? (
        <AuthScreen onLogin={(u) => setUser(u)} onGuest={handleGuestLogin} />
      ) : (
        <>
        <header className="dtz-header">
            {state.step !== 'menu' && <button className="back-btn" onClick={stopExam}><ArrowLeftIcon /></button>}
            <div className="progress-container">
                <div className="progress-bar" style={{ width: state.step === 'exam' ? `${(state.turnCount / 2) * 100}%` : '100%' }}></div>
            </div>
            {state.step === 'exam' ? <button className="finish-btn" onClick={stopExam}>X</button> : 
                (user && <button className="finish-btn" onClick={() => { if(user.id === 'guest') { setUser(null); setState(s=>({...s, step:'auth'})); } else { supabase?.auth.signOut(); } }}>LOGOUT</button>)}
        </header>

        <main className="dtz-main">
            {error && <div className="error-toast" onClick={() => setError(null)}>{error}</div>}
            
            {state.step === 'menu' && (
            <div className="menu-view">
                <div className="welcome">
                    <div className="avatar-placeholder">{stats.lastGrade === '-' ? <SparklesIcon /> : stats.lastGrade}</div>
                    <h1>Hallo, {user?.email ? user.email.split('@')[0] : 'Gast'}</h1>
                    <div className="stats-row">
                        <div className="stat-pill">📝 {stats.totalExams} Prüfungen</div>
                        <div className="stat-pill">⭐ Letzte Note: {stats.lastGrade}</div>
                    </div>
                </div>
                <div className="module-grid">
                {(['vorstellung', 'bild', 'planung'] as const).map(m => (
                    <button key={m} className="module-card" onClick={() => handleStartExam(m)} disabled={isProcessing}>
                    <span className="icon">{m === 'vorstellung' ? '👤' : m === 'bild' ? '🖼️' : '🗓️'}</span>
                    <div className="module-info">
                        <h3>{m === 'vorstellung' ? 'Teil 1: Sich vorstellen' : m === 'bild' ? 'Teil 2: Bildbeschreibung' : 'Teil 3: Gemeinsam planen'}</h3>
                    </div>
                    {isProcessing && state.module === m && <ThinkingIcon />}
                    </button>
                ))}
                </div>
            </div>
            )}

            {state.step === 'exam' && (
            <div className="exam-view">
                {state.currentImage && <div className="exam-visual"><img src={state.currentImage} alt="exam" /></div>}
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

            {state.step === 'result' && (
            <div className="result-view">
                <ResultView grading={state.grading} />
                <button className="primary-btn" style={{marginTop:'20px'}} onClick={() => setState({ ...state, step: 'menu', history: [], turnCount: 0 })}>MENU</button>
            </div>
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
