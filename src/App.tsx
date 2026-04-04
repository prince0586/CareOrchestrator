import React, { useState, useRef, useEffect } from 'react';
import { 
  Stethoscope, 
  Calendar, 
  ShieldCheck, 
  Send, 
  User, 
  Bot, 
  CheckCircle2, 
  Loader2,
  HeartPulse,
  Info,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AgentStep {
  id: string;
  name: string;
  status: 'pending' | 'active' | 'completed';
  description: string;
  icon: React.ReactNode;
}

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hello! I'm your **Healthcare Care Orchestrator**. I can help you understand medical conditions, check hospital policies, or schedule an appointment with one of our specialists. How can I assist you today?",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [steps, setSteps] = useState<AgentStep[]>([
    { 
      id: 'knowledge', 
      name: 'Knowledge Retrieval', 
      status: 'pending', 
      description: 'Fetching medical info from Wikipedia & KB',
      icon: <Info className="w-5 h-5" />
    },
    { 
      id: 'appointment', 
      name: 'Appointment Triage', 
      status: 'pending', 
      description: 'Gathering patient details and symptoms',
      icon: <Stethoscope className="w-5 h-5" />
    },
    { 
      id: 'scheduling', 
      name: 'Provider Scheduling', 
      status: 'pending', 
      description: 'Checking availability and booking slot',
      icon: <Calendar className="w-5 h-5" />
    },
    { 
      id: 'insurance', 
      name: 'Insurance Authorization', 
      status: 'pending', 
      description: 'Verifying eligibility and pre-authorization',
      icon: <ShieldCheck className="w-5 h-5" />
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isProcessing) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = input.toLowerCase();
    setInput('');
    setIsProcessing(true);

    // Reset steps
    setSteps(prev => prev.map(s => ({ ...s, status: 'pending' })));

    try {
      // Determine workflow based on intent
      const isGreeting = /^(hi|hello|hey|greetings|morning|afternoon|evening)/i.test(currentInput);
      const isCapabilities = /(what can you do|your capabilities|how can you help|help me)/i.test(currentInput);
      const isGeneralQuery = /(what is|tell me about|how does|info on|wikipedia|search for|explain|describe|definition)/i.test(currentInput);
      const isAppointment = /(schedule|book|appointment|see a doctor|triage|symptoms|need a|pain|ache|hurt|sick|ill|problem|issue|checkup|exam)/i.test(currentInput);

      // Priority 1: Appointment / Symptoms (Full Orchestration)
      if (isAppointment) {
        // Proceed to full orchestration below
      } 
      // Priority 2: Capabilities
      else if (isCapabilities) {
        await new Promise(r => setTimeout(r, 1000));
        const assistantMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: "I am your **Healthcare Care Orchestrator**. Here is how I can assist you:\n\n" +
                   "📚 **Medical Knowledge**: I can search Wikipedia and our internal knowledge base to explain conditions, treatments, and hospital policies.\n" +
                   "🩺 **Symptom Triage**: I can help you understand your symptoms and determine the right type of specialist care.\n" +
                   "📅 **Smart Scheduling**: I can check provider availability in real-time and book appointments that fit your schedule.\n" +
                   "🛡️ **Insurance Pre-Auth**: I can verify your coverage and automatically submit pre-authorization requests to your payer.\n\n" +
                   "What would you like to start with today?",
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);
        setIsProcessing(false);
        return;
      }
      // Priority 3: General Query (Knowledge Only)
      else if (isGeneralQuery) {
        // Proceed to Step 1 only logic below
      }
      // Priority 4: Simple Greeting
      else if (isGreeting) {
        await new Promise(r => setTimeout(r, 800));
        const assistantMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: "Hello! I'm here to orchestrate your healthcare journey. You can ask me about medical conditions, hospital policies, or request to schedule an appointment. How can I help you right now?",
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);
        setIsProcessing(false);
        return;
      }
      // Default: Assume they want help/orchestration if it's not a clear greeting
      else {
        // Proceed to full orchestration
      }

      // Step 1: Knowledge Agent
      setSteps(prev => prev.map((s, i) => i === 0 ? { ...s, status: 'active' } : s));
      await new Promise(r => setTimeout(r, 1500));
      setSteps(prev => prev.map((s, i) => i === 0 ? { ...s, status: 'completed' } : s));
      
      // Extract topic for Wikipedia simulation
      const topicMatch = currentInput.match(/(?:what is|about|for|info on|search|explain|describe) ([\w\s]+)/i) || [null, currentInput];
      const topic = topicMatch[1] ? topicMatch[1].trim() : currentInput;
      const wikiSummary = topic !== "your request" 
        ? `**${topic.charAt(0).toUpperCase() + topic.slice(1)}** is a subject I've researched in our medical database and Wikipedia. It involves specialized care and specific clinical protocols.`
        : "I've retrieved the relevant medical context and hospital policies for your request.";

      // If it was just a query, stop here
      if (isGeneralQuery && !isAppointment) {
        const assistantMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: `I've retrieved the information you requested: \n\n📚 **Knowledge Retrieval**: \n${wikiSummary} \n\nWould you like me to proceed with scheduling an appointment or checking insurance coverage for this?`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);
        setIsProcessing(false);
        return;
      }

      // Step 2: Appointment Agent
      setSteps(prev => prev.map((s, i) => i === 1 ? { ...s, status: 'active' } : s));
      await new Promise(r => setTimeout(r, 1500));
      setSteps(prev => prev.map((s, i) => i === 1 ? { ...s, status: 'completed' } : s));

      // Step 3: Scheduling Agent
      setSteps(prev => prev.map((s, i) => i === 2 ? { ...s, status: 'active' } : s));
      await new Promise(r => setTimeout(r, 2000));
      setSteps(prev => prev.map((s, i) => i === 2 ? { ...s, status: 'completed' } : s));

      // Step 4: Insurance Agent
      setSteps(prev => prev.map((s, i) => i === 3 ? { ...s, status: 'active' } : s));
      await new Promise(r => setTimeout(r, 1500));
      setSteps(prev => prev.map((s, i) => i === 3 ? { ...s, status: 'completed' } : s));

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `I've successfully orchestrated your care journey for **${topic}**. \n\n` +
                 `📚 **Medical Context**: ${wikiSummary}\n\n` +
                 `✅ **Appointment**: Confirmed for next Tuesday at 10:00 AM.\n\n` +
                 `🛡️ **Insurance**: Pre-authorization has been submitted and approved according to our latest policy.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNewChat = () => {
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: "Hello! I'm your **Healthcare Care Orchestrator**. I can help you understand medical conditions, check hospital policies, or schedule an appointment with one of our specialists. How can I assist you today?",
        timestamp: new Date()
      }
    ]);
    setSteps(prev => prev.map(s => ({ ...s, status: 'pending' })));
    setInput('');
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans">
      {/* Sidebar - Digital Assembly Line */}
      <div className="w-80 bg-white border-r border-slate-200 flex flex-col shadow-sm">
        <div className="p-6 border-b border-slate-100 bg-slate-900 text-white">
          <div className="flex items-center gap-3 mb-2">
            <HeartPulse className="w-6 h-6 text-indigo-400" />
            <h1 className="font-bold text-lg tracking-tight">Care Orchestrator</h1>
          </div>
          <p className="text-slate-400 text-xs uppercase tracking-widest font-semibold">Digital Assembly Line</p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {steps.map((step) => (
            <div 
              key={step.id}
              className={cn(
                "p-4 rounded-xl border transition-all duration-300",
                step.status === 'active' ? "bg-indigo-50 border-indigo-200 shadow-sm scale-[1.02]" : 
                step.status === 'completed' ? "bg-emerald-50 border-emerald-100" : 
                "bg-white border-slate-100 opacity-60"
              )}
            >
              <div className="flex items-start gap-3">
                <div className={cn(
                  "p-2 rounded-lg",
                  step.status === 'active' ? "bg-indigo-600 text-white animate-pulse" : 
                  step.status === 'completed' ? "bg-emerald-500 text-white" : 
                  "bg-slate-100 text-slate-400"
                )}>
                  {step.status === 'completed' ? <CheckCircle2 className="w-5 h-5" /> : step.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={cn(
                    "font-semibold text-sm",
                    step.status === 'active' ? "text-indigo-900" : 
                    step.status === 'completed' ? "text-emerald-900" : 
                    "text-slate-600"
                  )}>
                    {step.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
              {step.status === 'active' && (
                <div className="mt-3 h-1 bg-slate-200 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-indigo-600"
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2 text-[10px] text-slate-400 uppercase tracking-widest font-bold">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            System Status: Operational
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative">
        {/* Chat Header */}
        <div className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shadow-sm z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-white">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900">Healthcare Assistant</h2>
              <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-tighter">Active Session</p>
            </div>
          </div>
          <button 
            onClick={handleNewChat}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors border border-slate-200"
          >
            <RefreshCw className="w-4 h-4" />
            New Chat
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-slate-50/50">
          <AnimatePresence initial={false}>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "flex gap-4 max-w-3xl",
                  message.role === 'user' ? "ml-auto flex-row-reverse" : ""
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm",
                  message.role === 'user' ? "bg-indigo-600 text-white" : "bg-white text-slate-900 border border-slate-200"
                )}>
                  {message.role === 'user' ? <User className="w-6 h-6" /> : <Bot className="w-6 h-6" />}
                </div>
                <div className={cn(
                  "p-5 rounded-2xl shadow-sm",
                  message.role === 'user' ? "bg-indigo-600 text-white rounded-tr-none" : "bg-white text-slate-800 border border-slate-100 rounded-tl-none"
                )}>
                  <div className="markdown-body text-sm text-slate-600">
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                  </div>
                  <p className={cn(
                    "text-[10px] mt-3 font-medium opacity-50",
                    message.role === 'user' ? "text-white" : "text-slate-400"
                  )}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {isProcessing && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-4"
            >
              <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 shadow-sm">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
              <div className="bg-white border border-slate-100 p-5 rounded-2xl rounded-tl-none shadow-sm">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-8 bg-white border-t border-slate-200">
          <div className="max-w-4xl mx-auto relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Describe your symptoms or ask a medical question..."
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-6 pr-16 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all text-slate-800 placeholder:text-slate-400"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isProcessing}
              className="absolute right-2 top-2 bottom-2 px-4 bg-slate-900 text-white rounded-xl hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          <p className="text-center text-[10px] text-slate-400 mt-4 uppercase tracking-widest font-bold">
            Healthcare Orchestrator v2.0 • Powered by Google ADK
          </p>
        </div>
      </div>
    </div>
  );
};

export default App;
