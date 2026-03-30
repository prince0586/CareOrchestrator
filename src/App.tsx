import { useState, useRef, useEffect, ReactNode } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Send, 
  Bot, 
  User as UserIcon, 
  Terminal, 
  Wrench, 
  ChevronRight, 
  Loader2, 
  Activity,
  ShieldCheck,
  Calendar,
  Stethoscope,
  RefreshCw
} from "lucide-react";
import { GoogleGenAI } from "@google/genai";

// Initialize Gemini
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

type MessageType = 'user' | 'agent' | 'tool' | 'log';

interface Message {
  id: string;
  type: MessageType;
  agent?: string;
  content: string;
  timestamp: Date;
}

export default function App() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeAgent, setActiveAgent] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const addMessage = (type: MessageType, content: string, agent?: string) => {
    setMessages(prev => [...prev, {
      id: Math.random().toString(36).substring(7),
      type,
      content,
      agent,
      timestamp: new Date()
    }]);
  };

  const runOrchestration = async (userInput: string) => {
    if (!userInput.trim()) return;
    
    setIsProcessing(true);
    addMessage('user', userInput);
    setInput("");

    try {
      // --- STEP 1: Appointment Agent ---
      setActiveAgent("AppointmentAgent");
      addMessage('log', "Initializing AppointmentAgent for triage...", "AppointmentAgent");
      
      const triageResponse = await genAI.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ parts: [{ text: `You are the Appointment Agent. Based on this user input: "${userInput}", extract patient details, symptoms, and the type of care required. Format the output as a concise summary for the next agent.` }] }]
      });
      
      const details = triageResponse.text || "No details extracted.";
      addMessage('agent', details, "AppointmentAgent");
      
      await new Promise(r => setTimeout(r, 1000));

      // --- STEP 2: Scheduling Agent ---
      setActiveAgent("SchedulingAgent");
      addMessage('log', "Handoff to SchedulingAgent. Checking availability...", "SchedulingAgent");
      addMessage('tool', "check_provider_calendar(specialty: 'General', preferred_date: 'Next Week')", "SchedulingAgent");
      
      const schedulingResponse = await genAI.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ parts: [{ text: `You are the Scheduling Agent. Using these patient details: "${details}", confirm an appointment time. Assume the calendar tool returned: "10:00 AM Next Monday". Provide a professional confirmation.` }] }]
      });
      
      const time = schedulingResponse.text || "No time confirmed.";
      addMessage('agent', time, "SchedulingAgent");

      await new Promise(r => setTimeout(r, 1000));

      // --- STEP 3: Insurance Agent ---
      setActiveAgent("InsuranceAgent");
      addMessage('log', "Handoff to InsuranceAgent. Verifying eligibility...", "InsuranceAgent");
      addMessage('tool', "verify_insurance_eligibility(patient: 'User', id: 'POL-9928')", "InsuranceAgent");

      const insuranceResponse = await genAI.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ parts: [{ text: `You are the Insurance Agent. Using patient details: "${details}" and appointment: "${time}", verify eligibility and confirm pre-authorization status. Assume the tool returned: "Eligible. Pre-auth ID: AUTH-7721".` }] }]
      });
      
      const authStatus = insuranceResponse.text || "Insurance verification pending.";
      addMessage('agent', authStatus, "InsuranceAgent");
      addMessage('log', "Orchestration workflow completed successfully.", "System");

    } catch (error) {
      console.error("ADK Error:", error);
      addMessage('log', `Error: ${error instanceof Error ? error.message : "Unknown error"}`, "System");
    } finally {
      setIsProcessing(false);
      setActiveAgent(null);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setActiveAgent(null);
  };

  return (
    <div className="flex h-screen bg-[#0F172A] text-slate-200 font-mono selection:bg-blue-500/30">
      {/* Sidebar - Agent Registry */}
      <aside className="w-64 border-r border-slate-800 bg-[#0B1120] hidden md:flex flex-col p-6">
        <div className="flex items-center gap-3 mb-10">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-sm font-bold tracking-widest uppercase">ADK Runtime</h1>
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active Agents</p>
            <AgentItem name="Appointment" icon={<Stethoscope className="w-4 h-4" />} active={activeAgent === "AppointmentAgent"} />
            <AgentItem name="Scheduling" icon={<Calendar className="w-4 h-4" />} active={activeAgent === "SchedulingAgent"} />
            <AgentItem name="Insurance" icon={<ShieldCheck className="w-4 h-4" />} active={activeAgent === "InsuranceAgent"} />
          </div>

          <div className="pt-6 border-t border-slate-800">
            <button 
              onClick={clearChat}
              className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              Reset Session
            </button>
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col relative">
        {/* Header */}
        <header className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-[#0F172A]/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <Terminal className="w-4 h-4 text-blue-500" />
            <span className="text-xs font-bold uppercase tracking-widest">Healthcare Care Orchestrator</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isProcessing ? 'bg-emerald-500 animate-pulse' : 'bg-slate-700'}`} />
            <span className="text-[10px] text-slate-500 uppercase font-bold">Status: {isProcessing ? 'Running' : 'Idle'}</span>
          </div>
        </header>

        {/* Messages */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth"
        >
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40">
              <Bot className="w-12 h-12" />
              <div className="max-w-xs">
                <p className="text-sm">ADK Live Link Established.</p>
                <p className="text-[10px] mt-2 italic">Enter a patient care request to begin multi-agent orchestration.</p>
              </div>
            </div>
          )}

          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex flex-col ${msg.type === 'user' ? 'items-end' : 'items-start'}`}
              >
                {/* Label */}
                <div className="flex items-center gap-2 mb-2 px-1">
                  {msg.type === 'user' ? (
                    <>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">User</span>
                      <UserIcon className="w-3 h-3 text-slate-500" />
                    </>
                  ) : (
                    <>
                      <Bot className={`w-3 h-3 ${msg.type === 'agent' ? 'text-blue-500' : 'text-slate-500'}`} />
                      <span className={`text-[10px] font-bold uppercase tracking-tighter ${msg.type === 'agent' ? 'text-blue-400' : 'text-slate-500'}`}>
                        {msg.agent || 'System'}
                      </span>
                    </>
                  )}
                </div>

                {/* Content Bubble */}
                <div className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed ${
                  msg.type === 'user' ? 'bg-blue-600 text-white rounded-tr-none' :
                  msg.type === 'agent' ? 'bg-slate-800 border border-slate-700 rounded-tl-none' :
                  msg.type === 'tool' ? 'bg-slate-900 border border-blue-500/30 text-blue-300 font-mono text-xs rounded-tl-none' :
                  'bg-slate-900/50 border border-slate-800 text-slate-500 italic text-xs rounded-tl-none'
                }`}>
                  {msg.type === 'tool' && <Wrench className="w-3 h-3 inline mr-2 mb-0.5" />}
                  {msg.content}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {isProcessing && (
            <div className="flex items-center gap-3 text-slate-500 text-xs animate-pulse">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>{activeAgent || 'System'} is thinking...</span>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-6 border-t border-slate-800 bg-[#0F172A]">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              runOrchestration(input);
            }}
            className="max-w-4xl mx-auto relative"
          >
            <input 
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isProcessing}
              placeholder="Enter care request (e.g., 'I need a cardiology checkup next week...')"
              className="w-full bg-slate-900 border border-slate-700 rounded-2xl py-4 pl-6 pr-14 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm disabled:opacity-50"
            />
            <button 
              type="submit"
              disabled={isProcessing || !input.trim()}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:bg-slate-800 transition-all"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          <p className="text-center text-[10px] text-slate-600 mt-4 uppercase tracking-widest font-bold">
            Powered by Google ADK & Vertex AI
          </p>
        </div>
      </main>
    </div>
  );
}

function AgentItem({ name, icon, active }: { name: string; icon: ReactNode; active: boolean }) {
  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl transition-all ${active ? 'bg-blue-600/10 border border-blue-500/20 text-blue-400' : 'text-slate-500'}`}>
      <div className={`p-1.5 rounded-lg ${active ? 'bg-blue-600 text-white' : 'bg-slate-800'}`}>
        {icon}
      </div>
      <span className="text-xs font-bold">{name}</span>
      {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />}
    </div>
  );
}


