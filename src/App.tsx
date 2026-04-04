import React, { useState, useEffect } from 'react';
import { 
  HeartPulse, 
  MessageSquare, 
  Activity, 
  FileText, 
  User, 
  LogOut, 
  Send, 
  CheckCircle2, 
  Loader2,
  Calendar,
  Plus,
  RefreshCw
} from 'lucide-react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut,
  type User as FirebaseUser
} from 'firebase/auth';
import { 
  collection, 
  addDoc, 
  query, 
  onSnapshot, 
  orderBy, 
  doc,
  setDoc,
  getDoc
} from 'firebase/firestore';
import { auth, db } from './lib/firebase';
import { 
  PatientProfile, 
  CareLog, 
  Message, 
  ClinicalSummary,
  CareLogSchema,
  MessageSchema,
  ClinicalSummarySchema
} from './models/schemas';

// Utility for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const App: React.FC = () => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'chat' | 'tracker' | 'summary'>('chat');
  const [messages, setMessages] = useState<Message[]>([]);
  const [careLogs, setCareLogs] = useState<CareLog[]>([]);
  const [summaries, setSummaries] = useState<ClinicalSummary[]>([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Fetch or Create Profile
        const profileRef = doc(db, 'patients', currentUser.uid);
        const profileSnap = await getDoc(profileRef);
        if (profileSnap.exists()) {
          setProfile(profileSnap.data() as PatientProfile);
        } else {
          const newProfile: PatientProfile = {
            uid: currentUser.uid,
            fullName: currentUser.displayName || 'Anonymous Patient',
            dateOfBirth: '1990-01-01', // Default
            medicalHistory: [],
            createdAt: new Date().toISOString()
          };
          await setDoc(profileRef, newProfile);
          setProfile(newProfile);
        }
      } else {
        setProfile(null);
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Real-time Listeners
  useEffect(() => {
    if (!user) return;

    const qMessages = query(
      collection(db, 'patients', user.uid, 'messages'),
      orderBy('timestamp', 'asc')
    );
    const unsubMessages = onSnapshot(qMessages, (snap) => {
      setMessages(snap.docs.map(d => d.data() as Message));
    });

    const qLogs = query(
      collection(db, 'patients', user.uid, 'logs'),
      orderBy('timestamp', 'desc')
    );
    const unsubLogs = onSnapshot(qLogs, (snap) => {
      setCareLogs(snap.docs.map(d => d.data() as CareLog));
    });

    const qSummaries = query(
      collection(db, 'patients', user.uid, 'summaries'),
      orderBy('timestamp', 'desc')
    );
    const unsubSummaries = onSnapshot(qSummaries, (snap) => {
      setSummaries(snap.docs.map(d => d.data() as ClinicalSummary));
    });

    return () => {
      unsubMessages();
      unsubLogs();
      unsubSummaries();
    };
  }, [user]);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const handleLogout = () => signOut(auth);

  const sendMessage = async () => {
    if (!input.trim() || !user || isProcessing) return;
    setIsProcessing(true);
    try {
      const newMessage: Message = {
        senderId: user.uid,
        receiverId: 'provider-system',
        content: input,
        timestamp: new Date().toISOString(),
        role: 'patient'
      };
      MessageSchema.parse(newMessage);
      await addDoc(collection(db, 'patients', user.uid, 'messages'), newMessage);
      setInput('');

      // Draft provider response (simulated backend call)
      const res = await fetch('/api/draft-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input, history: profile?.medicalHistory || [] })
      });
      const { draft } = await res.json();
      
      const providerResponse: Message = {
        senderId: 'provider-system',
        receiverId: user.uid,
        content: draft,
        timestamp: new Date().toISOString(),
        role: 'provider'
      };
      await addDoc(collection(db, 'patients', user.uid, 'messages'), providerResponse);
    } catch (error) {
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const addCareLog = async (type: 'medication' | 'vital', name: string, value: string) => {
    if (!user) return;
    try {
      const newLog: CareLog = {
        patientId: user.uid,
        type,
        name,
        value,
        timestamp: new Date().toISOString(),
        status: type === 'medication' ? 'taken' : 'recorded'
      };
      CareLogSchema.parse(newLog);
      await addDoc(collection(db, 'patients', user.uid, 'logs'), newLog);
    } catch (error) {
      console.error(error);
    }
  };

  const translateNote = async (note: string) => {
    if (!user || isProcessing) return;
    setIsProcessing(true);
    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note })
      });
      const { summary } = await res.json();
      
      const newSummary: ClinicalSummary = {
        patientId: user.uid,
        originalNote: note,
        translatedSummary: summary,
        timestamp: new Date().toISOString()
      };
      ClinicalSummarySchema.parse(newSummary);
      await addDoc(collection(db, 'patients', user.uid, 'summaries'), newSummary);
    } catch (error) {
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 text-center border border-slate-100">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-6 shadow-lg">
            <HeartPulse className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">CareOrchestrator</h1>
          <p className="text-slate-500 mb-8">Production-grade healthcare coordination for patients and providers.</p>
          <button 
            onClick={handleLogin}
            className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-3"
          >
            <User className="w-5 h-5" />
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-slate-200 flex flex-col shadow-sm">
        <div className="p-6 border-b border-slate-100 bg-slate-900 text-white">
          <div className="flex items-center gap-3 mb-2">
            <HeartPulse className="w-6 h-6 text-indigo-400" />
            <h1 className="font-bold text-lg tracking-tight">CareOrchestrator</h1>
          </div>
          <div className="flex items-center gap-2 text-slate-400 text-xs">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Cloud Native Sync Active
          </div>
        </div>

        <div className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => setActiveTab('chat')}
            className={cn(
              "w-full flex items-center gap-3 p-4 rounded-2xl font-semibold transition-all",
              activeTab === 'chat' ? "bg-indigo-50 text-indigo-700" : "text-slate-500 hover:bg-slate-50"
            )}
          >
            <MessageSquare className="w-5 h-5" />
            Patient Interaction
          </button>
          <button 
            onClick={() => setActiveTab('tracker')}
            className={cn(
              "w-full flex items-center gap-3 p-4 rounded-2xl font-semibold transition-all",
              activeTab === 'tracker' ? "bg-indigo-50 text-indigo-700" : "text-slate-500 hover:bg-slate-50"
            )}
          >
            <Activity className="w-5 h-5" />
            Care Tracker
          </button>
          <button 
            onClick={() => setActiveTab('summary')}
            className={cn(
              "w-full flex items-center gap-3 p-4 rounded-2xl font-semibold transition-all",
              activeTab === 'summary' ? "bg-indigo-50 text-indigo-700" : "text-slate-500 hover:bg-slate-50"
            )}
          >
            <FileText className="w-5 h-5" />
            Clinical Summaries
          </button>
        </div>

        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl mb-3">
            <img src={user.photoURL || ''} className="w-10 h-10 rounded-full border-2 border-white shadow-sm" alt="Profile" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate">{user.displayName}</p>
              <p className="text-[10px] text-slate-400 truncate uppercase tracking-widest font-bold">Patient</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 p-3 text-slate-400 hover:text-rose-600 transition-colors text-sm font-bold"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative bg-white">
        {activeTab === 'chat' && (
          <>
            <div className="h-16 border-b border-slate-100 flex items-center justify-between px-8 bg-white/80 backdrop-blur-md z-10">
              <h2 className="font-bold text-slate-900">Provider Communication</h2>
              <div className="flex items-center gap-2 text-[10px] font-bold text-indigo-600 uppercase tracking-widest">
                <RefreshCw className="w-3 h-3 animate-spin-slow" />
                Real-time Sync
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-slate-50/30">
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "flex gap-4 max-w-2xl",
                    msg.role === 'patient' ? "ml-auto flex-row-reverse" : ""
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm",
                    msg.role === 'patient' ? "bg-indigo-600 text-white" : "bg-white border border-slate-200 text-slate-900"
                  )}>
                    {msg.role === 'patient' ? <User className="w-5 h-5" /> : <HeartPulse className="w-5 h-5" />}
                  </div>
                  <div className={cn(
                    "p-5 rounded-3xl shadow-sm",
                    msg.role === 'patient' ? "bg-indigo-600 text-white rounded-tr-none" : "bg-white border border-slate-100 text-slate-800 rounded-tl-none"
                  )}>
                    <div className="prose prose-sm max-w-none prose-headings:text-inherit prose-p:leading-relaxed">
                      <ReactMarkdown>
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                    <p className={cn(
                      "text-[10px] mt-2 font-bold uppercase tracking-widest opacity-50",
                      msg.role === 'patient' ? "text-indigo-100" : "text-slate-400"
                    )}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </motion.div>
              ))}
              {isProcessing && (
                <div className="flex gap-4 max-w-2xl">
                  <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400">
                    <Loader2 className="w-5 h-5 animate-spin" />
                  </div>
                  <div className="bg-slate-100 p-4 rounded-3xl rounded-tl-none animate-pulse text-slate-400 text-sm">
                    Provider is drafting a response...
                  </div>
                </div>
              )}
            </div>
            <div className="p-6 bg-white border-t border-slate-100">
              <div className="max-w-4xl mx-auto relative">
                <input 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Message your care team..."
                  className="w-full bg-slate-50 border-none rounded-2xl py-4 pl-6 pr-16 focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                />
                <button 
                  onClick={sendMessage}
                  disabled={!input.trim() || isProcessing}
                  className="absolute right-2 top-2 bottom-2 px-4 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        )}

        {activeTab === 'tracker' && (
          <div className="flex-1 overflow-y-auto p-8 space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Care Tracker</h2>
                <p className="text-slate-500">Monitor your medication and vital signs.</p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => addCareLog('medication', 'Aspirin', '81mg')}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl font-bold hover:bg-indigo-100 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  Log Med
                </button>
                <button 
                  onClick={() => addCareLog('vital', 'Blood Pressure', '120/80')}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all"
                >
                  <Activity className="w-4 h-4" />
                  Log Vital
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
                <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-indigo-600" />
                  Recent Activity
                </h3>
                <div className="space-y-4">
                  {careLogs.map((log, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center",
                        log.type === 'medication' ? "bg-indigo-100 text-indigo-600" : "bg-emerald-100 text-emerald-600"
                      )}>
                        {log.type === 'medication' ? <HeartPulse className="w-5 h-5" /> : <Activity className="w-5 h-5" />}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-sm">{log.name}</p>
                        <p className="text-xs text-slate-500">{log.value} • {new Date(log.timestamp).toLocaleString()}</p>
                      </div>
                      <div className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 bg-white rounded-lg border border-slate-200">
                        {log.status}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-indigo-600 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
                <div className="relative z-10">
                  <h3 className="text-xl font-bold mb-2">Longitudinal Trends</h3>
                  <p className="text-indigo-100 text-sm mb-6">Gemini is analyzing your care data for clinical insights.</p>
                  <div className="space-y-4">
                    <div className="h-2 bg-indigo-400/30 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: '85%' }}
                        className="h-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                      />
                    </div>
                    <p className="text-xs font-bold uppercase tracking-widest text-indigo-200">Medication Adherence: 85%</p>
                  </div>
                </div>
                <Activity className="absolute -right-8 -bottom-8 w-48 h-48 text-indigo-500/20" />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'summary' && (
          <div className="flex-1 overflow-y-auto p-8 space-y-8">
            <div className="max-w-3xl mx-auto space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Clinical Summaries</h2>
                <p className="text-slate-500">Translate complex clinical notes into simple patient summaries.</p>
              </div>

              <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
                <textarea 
                  placeholder="Paste clinical note here..."
                  className="w-full h-32 bg-slate-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-indigo-500 transition-all font-medium mb-4"
                  id="clinical-note-input"
                />
                <button 
                  onClick={() => {
                    const el = document.getElementById('clinical-note-input') as HTMLTextAreaElement;
                    if (el.value) translateNote(el.value);
                  }}
                  disabled={isProcessing}
                  className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                >
                  {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
                  Generate Simplified Summary
                </button>
              </div>

              <div className="space-y-6">
                {summaries.map((sum, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold">Summary Report</p>
                          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                            {new Date(sum.timestamp).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Original Clinical Note</p>
                        <p className="text-sm text-slate-600 italic bg-slate-50 p-4 rounded-2xl border border-slate-100">
                          {sum.originalNote}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-2">Patient-Friendly Summary</p>
                        <div className="prose prose-sm text-slate-800 font-medium">
                          <ReactMarkdown>{sum.translatedSummary}</ReactMarkdown>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
