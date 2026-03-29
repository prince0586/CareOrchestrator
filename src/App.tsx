import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Activity, Calendar, ShieldCheck, Stethoscope, ArrowRight, Loader2, CheckCircle2, User, AlertCircle } from "lucide-react";
import { GoogleGenAI } from "@google/genai";

// Initialize Gemini
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export default function App() {
  const [step, setStep] = useState(0); // 0: Input, 1: Triage, 2: Scheduling, 3: Insurance, 4: Complete
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState("");
  const [logs, setLogs] = useState<{ agent: string; message: string; type: 'info' | 'success' | 'tool' }[]>([]);
  
  const [patientDetails, setPatientDetails] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");
  const [insuranceStatus, setInsuranceStatus] = useState("");

  const addLog = (agent: string, message: string, type: 'info' | 'success' | 'tool' = 'info') => {
    setLogs(prev => [...prev, { agent, message, type }]);
  };

  const runOrchestrator = async () => {
    if (!input.trim()) return;
    
    setLoading(true);
    setLogs([]);
    setStep(1);

    try {
      // --- STEP 1: Appointment Agent ---
      addLog("AppointmentAgent", "Analyzing patient symptoms and requirements...");
      const triageResponse = await genAI.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ parts: [{ text: `You are the Appointment Agent. Based on this user input: "${input}", extract patient details, symptoms, and the type of care required. Format the output as a concise summary.` }] }]
      });
      
      const details = triageResponse.text || "No details extracted.";
      setPatientDetails(details);
      addLog("AppointmentAgent", "Patient details captured successfully.", "success");
      
      await new Promise(r => setTimeout(r, 1500)); // Visual delay
      setStep(2);

      // --- STEP 2: Scheduling Agent ---
      addLog("SchedulingAgent", "Checking provider calendars for availability...");
      addLog("SchedulingAgent", "Tool Call: check_provider_calendar(specialty: 'General', preferred_date: 'Next Monday')", "tool");
      
      const schedulingResponse = await genAI.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ parts: [{ text: `You are the Scheduling Agent. Using these patient details: "${details}", confirm an appointment time. Assume the calendar tool returned: "10:00 AM Next Monday". Provide a confirmation message.` }] }]
      });
      
      const time = schedulingResponse.text || "No time confirmed.";
      setAppointmentTime(time);
      addLog("SchedulingAgent", "Appointment slot secured and confirmed.", "success");

      await new Promise(r => setTimeout(r, 1500));
      setStep(3);

      // --- STEP 3: Insurance Agent ---
      addLog("InsuranceAgent", "Verifying insurance eligibility and submitting pre-auth...");
      addLog("InsuranceAgent", "Tool Call: verify_insurance_eligibility(patient: 'User', id: 'POL-9928')", "tool");

      const insuranceResponse = await genAI.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ parts: [{ text: `You are the Insurance Agent. Using patient details: "${details}" and appointment: "${time}", verify eligibility and confirm pre-authorization status. Assume the tool returned: "Eligible. Pre-auth ID: AUTH-7721".` }] }]
      });
      
      const auth = insuranceResponse.text || "No insurance status confirmed.";
      setInsuranceStatus(auth);
      addLog("InsuranceAgent", "Insurance verified and pre-authorization submitted.", "success");

      await new Promise(r => setTimeout(r, 1000));
      setStep(4);
    } catch (error) {
      console.error("Orchestration Error:", error);
      addLog("System", `Error: ${error instanceof Error ? error.message : "Unknown error"}`, "info");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStep(0);
    setInput("");
    setLogs([]);
    setPatientDetails("");
    setAppointmentTime("");
    setInsuranceStatus("");
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#1E293B] font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 py-4 px-4 sm:px-8 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="bg-blue-600 p-1.5 sm:p-2 rounded-lg">
              <Activity className="text-white w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-slate-900">
              CareOrchestrator <span className="text-blue-600">Live</span>
            </h1>
          </div>
          <div className="flex items-center justify-between w-full sm:w-auto gap-3 sm:gap-4 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
            <button 
              onClick={reset}
              className="text-xs sm:text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors flex items-center gap-1.5 bg-slate-50 sm:bg-transparent px-3 py-1.5 rounded-lg sm:p-0"
            >
              <Loader2 className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="whitespace-nowrap">Reset Flow</span>
            </button>
            <div className="flex items-center gap-2 text-[10px] sm:text-sm font-medium text-blue-600 bg-blue-50 px-2 sm:px-3 py-1 rounded-full border border-blue-100 whitespace-nowrap">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
              ADK Active
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Hero Section */}
        {step === 0 && (
          <section className="mb-8 sm:mb-12 text-center">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl sm:text-5xl font-extrabold text-slate-900 mb-4 sm:mb-6 leading-tight"
            >
              Start the <span className="text-blue-600">Care Journey</span>
            </motion.h2>
            <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto mb-6 sm:mb-8 px-2">
              Enter patient symptoms or a care request to trigger the digital assembly line.
            </p>
            
            <div className="max-w-2xl mx-auto space-y-6">
              <textarea 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="e.g., I have a persistent cough and need to see a cardiologist next week. My insurance ID is BCBS-12345."
                className="w-full min-h-[180px] p-5 sm:p-6 rounded-2xl border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all resize-y text-base sm:text-lg shadow-sm"
              />
              <div className="flex justify-center px-2">
                <button 
                  onClick={runOrchestrator}
                  disabled={loading || !input.trim()}
                  className="w-full sm:w-auto bg-blue-600 text-white px-8 sm:px-12 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl shadow-blue-200 text-lg"
                >
                  {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <ArrowRight className="w-6 h-6" />}
                  Initiate Process
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Orchestration Progress */}
        {step > 0 && (
          <div className="space-y-8 sm:space-y-10">
            {/* Visual Assembly Line */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-12 shadow-sm">
              <h3 className="text-lg sm:text-xl font-bold mb-8 sm:mb-10 flex items-center gap-3">
                <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                Live Assembly Line
              </h3>

              <div className="space-y-10 sm:space-y-12 relative">
                {/* Vertical Line */}
                <div className="absolute left-5 sm:left-8 top-10 bottom-10 w-0.5 bg-slate-100" />

                {/* Step 1 */}
                <AgentStep 
                  active={step === 1} 
                  completed={step > 1} 
                  icon={<Stethoscope />} 
                  title="Appointment Agent" 
                  content={patientDetails}
                  color="blue"
                />

                {/* Step 2 */}
                <AgentStep 
                  active={step === 2} 
                  completed={step > 2} 
                  icon={<Calendar />} 
                  title="Scheduling Agent" 
                  content={appointmentTime}
                  color="emerald"
                />

                {/* Step 3 */}
                <AgentStep 
                  active={step === 3} 
                  completed={step > 3} 
                  icon={<ShieldCheck />} 
                  title="Insurance Agent" 
                  content={insuranceStatus}
                  color="purple"
                />
              </div>

              {step === 4 && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mt-12 sm:mt-16 p-6 sm:p-8 bg-emerald-50 border border-emerald-100 rounded-3xl flex flex-col sm:flex-row items-center gap-4 sm:gap-6 text-emerald-800 text-center sm:text-left"
                >
                  <div className="bg-emerald-600 p-3 rounded-2xl shrink-0">
                    <CheckCircle2 className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                  </div>
                  <div>
                    <h4 className="text-lg sm:text-xl font-bold">Orchestration Complete</h4>
                    <p className="text-sm sm:text-base opacity-90">The patient journey has been successfully processed across all care stages.</p>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Agent Logs */}
            <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
                <h3 className="text-slate-400 text-[10px] sm:text-xs font-mono uppercase tracking-widest flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  ADK Runtime Logs
                </h3>
                {loading && (
                  <div className="flex items-center gap-2 text-slate-500 text-[10px] sm:text-xs italic">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Agent thinking...
                  </div>
                )}
              </div>
              <div className="max-h-[250px] sm:max-h-[300px] overflow-y-auto space-y-3 font-mono text-[12px] sm:text-sm scrollbar-hide pr-2">
                <AnimatePresence initial={false}>
                  {logs.map((log, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`p-3 sm:p-4 rounded-xl ${
                        log.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        log.type === 'tool' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                        'bg-slate-800/50 text-slate-300 border border-slate-700/50'
                      }`}
                    >
                      <span className="opacity-40 mr-2 sm:mr-3">[{log.agent}]</span>
                      {log.message}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>

            {step === 4 && (
              <div className="flex justify-center pt-2 sm:pt-4">
                <button 
                  onClick={reset}
                  className="w-full sm:w-auto px-12 py-4 bg-white border-2 border-slate-200 rounded-2xl font-bold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
                >
                  Start New Journey
                </button>
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}

function AgentStep({ active, completed, icon, title, content, color }: any) {
  const colors: any = {
    blue: "bg-blue-600 text-blue-600 border-blue-100",
    emerald: "bg-emerald-600 text-emerald-600 border-emerald-100",
    purple: "bg-purple-600 text-purple-600 border-purple-100",
  };

  return (
    <div className={`flex gap-6 relative transition-all duration-500 ${!active && !completed ? 'opacity-30 grayscale' : 'opacity-100'}`}>
      <div className={`w-12 h-12 rounded-full flex items-center justify-center z-10 shrink-0 transition-all duration-500 ${
        completed ? colors[color].split(' ')[0] : active ? 'bg-white border-2 border-' + color + '-600' : 'bg-slate-100 text-slate-400'
      }`}>
        {completed ? <CheckCircle2 className="text-white w-6 h-6" /> : icon}
      </div>
      
      <div className="flex-1 pt-1">
        <h4 className={`font-bold text-lg mb-2 ${active ? 'text-slate-900' : 'text-slate-500'}`}>
          {title}
          {active && <span className="ml-3 text-xs font-medium text-blue-600 animate-pulse">Processing...</span>}
        </h4>
        
        <AnimatePresence>
          {content && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-white border border-slate-100 p-4 rounded-xl shadow-sm text-sm text-slate-600 leading-relaxed"
            >
              {content}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
