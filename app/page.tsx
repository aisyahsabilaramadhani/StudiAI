"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  BookOpen, 
  Sparkles, 
  Brain, 
  CheckCircle, 
  XCircle, 
  RotateCcw, 
  FileText, 
  ChevronRight, 
  Copy, 
  Trophy, 
  HelpCircle, 
  Info, 
  ArrowRight,
  ClipboardCheck,
  Award,
  BookMarked
} from "lucide-react";

// Types
interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string; // 'A', 'B', 'C', 'D'
  explanation: string;
}

const SAMPLE_MATERIALS = [
  {
    title: "Fotosintesis & Klorofil",
    category: "Biologi Lanjutan",
    body: "Fotosintesis adalah proses biokimia yang dilakukan oleh tanaman, alga, dan beberapa bakteri untuk memproduksi energi (glukosa) menggunakan sinar matahari. Reaksi klorofil mereaksikan air (H2O) berkombinasi dengan karbon dioksida (CO2) menghasilkan molekul gula kompleks dan limbah gas oksigen (O2). Proses ini memiliki dua tahap fungsional utama: Reaksi Terang di membran tilakoid yang digerakkan foton matahari untuk memproduksi organel energi ATP dan NADPH, serta Siklus Calvin (Reaksi Gelap) di stroma untuk melakukan fiksasi karbon dioksida menjadi glukosa."
  },
  {
    title: "Hukum Gravitasi Newton",
    category: "Fisika Dasar",
    body: "Hukum Gravitasi Universal Newton menyatakan bahwa setiap partikel di alam semesta menarik setiap partikel lain dengan gaya yang sebanding dengan hasil kali massa kedua benda, dan berbanding terbalik dengan kuadrat jarak antara kedua pusat massa tersebut. Secara matematis didefinisikan sebagai F = G * (m1 * m2) / r^2, di mana G adalah konstanta gravitasi universal. Hukum ini tidak hanya menjelaskan mengapa apel jatuh dari pohon ke bumi, tetapi juga memberikan dasar ilmiah bagi mekanika orbital pergerakan bulan mengelilingi bumi dan planet mengorbit matahari."
  },
  {
    title: "Konsep Dasar Algoritma",
    category: "Ilmu Komputer",
    body: "Algoritma adalah serangkaian instruksi terstruktur logis yang dirancang secara berurutan untuk menyelesaikan suatu masalah komputasi secara efisien. Ciri algoritma yang baik mencakup finiteness (pasti berakhir setelah rentang langkah tertentu), definiteness (setiap instruksi terdefinisi presisi tanpa ambiguitas), serta efektivitas waktu dan memori. Penulisan algoritma umumnya direpresentasikan menggunakan bagan alir (flowchart) dengan simbol-simbol standar, maupun menggunakan deskripsi teks terstruktur bahasa manusia (pseudocode) sebelum diimplementasi ke bahasa pemrograman."
  }
];

const LOADING_STEPS = [
  "Membaca materi kuliah Anda...",
  "Menganalisis konsep dan kata kunci utama...",
  "Merumuskan penjelasan akademis terbaik...",
  "Menghubungkan teori pendukung...",
  "Menyusun tanggapan StudyMate AI..."
];

export default function StudyMateApp() {
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  
  // Results & active tab states
  const [activeTab, setActiveTab] = useState<"summary" | "tutor" | "quiz">("summary");
  const [summaryResult, setSummaryResult] = useState("");
  const [tutorResult, setTutorResult] = useState("");
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  
  // Quiz active states
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  
  // Notifications/Toasts (Better than window.alert)
  const [toast, setToast] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);
  const [copiedMode, setCopiedMode] = useState<string | null>(null);

  // Interval timer for shifting loader text
  useEffect(() => {
    if (!isLoading) return;
    const interval = setInterval(() => {
      setLoadingStep((prev) => (prev + 1) % LOADING_STEPS.length);
    }, 1500);
    return () => clearInterval(interval);
  }, [isLoading]);

  // Utility to auto-dismiss toast after 4s
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Handle actions
  const handleAIService = async (action: "summarize" | "explain" | "quiz") => {
    if (!inputText.trim()) {
      setToast({
        type: "error",
        text: "Teks materi kuliah tidak boleh kosong. Silakan masukkan materi terlebih dahulu!",
      });
      return;
    }

    if (inputText.trim().length < 20) {
      setToast({
        type: "info",
        text: "Materi terlalu pendek. Berikan materi yang lebih lengkap untuk hasil AI terbaik!",
      });
    }

    setIsLoading(true);
    setLoadingStep(0);
    setActiveTab(action === "summarize" ? "summary" : action === "explain" ? "tutor" : "quiz");

    try {
      const response = await fetch("/api/gemini", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action,
          content: inputText,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Gagal menghubungi server asisten AI.");
      }

      if (action === "summarize") {
        setSummaryResult(data.result);
        setToast({ type: "success", text: "Ringkasan materi selesai dibuat!" });
      } else if (action === "explain") {
        setTutorResult(data.result);
        setToast({ type: "success", text: "Tutor AI siap menjelaskan materi!" });
      } else if (action === "quiz") {
        setQuizQuestions(data.result);
        setSelectedAnswers({});
        setQuizSubmitted(false);
        setToast({ type: "success", text: "Kuis evaluasi baru berhasil dibuat!" });
      }
    } catch (err: any) {
      console.error(err);
      setToast({
        type: "error",
        text: err.message || "Gagal menghubungkan ke asisten AI. Silakan coba kembali.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyText = (text: string, mode: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedMode(mode);
    setToast({ type: "success", text: "Teks berhasil disalin ke clipboard!" });
    setTimeout(() => setCopiedMode(null), 2000);
  };

  const handleSelectAnswer = (questionIndex: number, optionLetter: string) => {
    if (quizSubmitted) return; // Prevent change after grading
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionIndex]: optionLetter,
    }));
  };

  const handleSubmitQuiz = () => {
    if (Object.keys(selectedAnswers).length < quizQuestions.length) {
      setToast({
        type: "info",
        text: `Harap jawab semua ${quizQuestions.length} pertanyaan sebelum memeriksa kuis!`,
      });
      return;
    }
    setQuizSubmitted(true);
    setToast({ type: "success", text: "Kuis berhasil dinilai! Periksa pembahasan Anda di bawah." });
  };

  const calculateScore = () => {
    let correctCount = 0;
    quizQuestions.forEach((q, i) => {
      if (selectedAnswers[i] === q.correctAnswer) {
        correctCount++;
      }
    });
    return correctCount;
  };

  // Safe client-side local parser for Markdown bold, list and lines
  const renderFormattedText = (rawText: string) => {
    if (!rawText) return null;

    const paragraphs = rawText.split("\n\n");

    return paragraphs.map((block, pIdx) => {
      // Check if standard headers
      if (block.startsWith("###")) {
        const title = block.replace(/^###\s*/, "");
        return (
          <h4 key={pIdx} className="text-lg font-bold text-blue-900 mt-4 mb-2">
            {title}
          </h4>
        );
      }
      if (block.startsWith("##")) {
        const title = block.replace(/^##\s*/, "");
        return (
          <h3 key={pIdx} className="text-xl font-bold text-blue-900 mt-5 mb-2 border-b border-sky-100 pb-1">
            {title}
          </h3>
        );
      }

      // Check bullet points block
      const lines = block.split("\n");
      const isBulletList = lines.some(line => line.trim().startsWith("- ") || line.trim().startsWith("* ") || line.trim().startsWith("• "));
      const isNumberedList = lines.some(line => /^\d+\.\s+/.test(line.trim()));

      if (isBulletList) {
        return (
          <ul key={pIdx} className="list-disc pl-5 mt-2 mb-3 space-y-2 text-slate-700">
            {lines.map((line, lIdx) => {
              const cleaned = line.replace(/^[\s\-\*•]+\s*/, "");
              if (!cleaned) return null;
              return <li key={lIdx}>{parseInlineMarkdown(cleaned)}</li>;
            })}
          </ul>
        );
      }

      if (isNumberedList) {
        return (
          <ol key={pIdx} className="list-decimal pl-5 mt-2 mb-3 space-y-2 text-slate-700">
            {lines.map((line, lIdx) => {
              const cleaned = line.replace(/^\d+\.\s*/, "");
              if (!cleaned) return null;
              return <li key={lIdx}>{parseInlineMarkdown(cleaned)}</li>;
            })}
          </ol>
        );
      }

      return (
        <p key={pIdx} className="mb-3 text-slate-700 leading-relaxed text-[15px]">
          {parseInlineMarkdown(block)}
        </p>
      );
    });
  };

  const parseInlineMarkdown = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={index} className="font-semibold text-blue-950 bg-blue-50 px-1 rounded-sm">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  return (
    <div id="studymate-root" className="min-h-screen flex flex-col bg-[#f0f7ff] font-sans antialiased">
      {/* Toast Notification Container */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -40, scale: 0.9 }}
            className="fixed top-4 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none"
          >
            <div
              className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium ${
                toast.type === "error"
                  ? "bg-red-50 border-red-100 text-red-700 shadow-red-100/30"
                  : toast.type === "success"
                  ? "bg-emerald-50 border-emerald-100 text-emerald-800 shadow-emerald-100/30"
                  : "bg-sky-50 border-sky-100 text-sky-700 shadow-sky-100/30"
              }`}
            >
              <span className="text-base">
                {toast.type === "error" ? "❌" : toast.type === "success" ? "✅" : "💡"}
              </span>
              <p>{toast.text}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Styled Modern Header Navigation */}
      <header id="app-nav" className="sticky top-0 z-40 bg-white border-b border-sky-100 shadow-xs px-4 md:px-8 py-4 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-sky-400 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h1 id="app-title" className="text-xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-sky-500 flex items-center gap-1.5">
                StudyMate AI
              </h1>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Tutor Pintar Mahasiswa</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono text-slate-500 bg-sky-50 px-2.5 py-1 rounded-full border border-sky-100/50">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live GPT model
            </span>
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 text-blue-600 font-bold text-xs ring-2 ring-blue-100/50">
              S1
            </div>
          </div>
        </div>
      </header>

      {/* Main Container Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left COLUMN Pane: Input Panel */}
        <section id="input-pane" className="lg:col-span-5 space-y-5">
          {/* Welcome Card & Pitch */}
          <div className="bg-white rounded-2xl p-5 border border-sky-100 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-sky-50 rounded-full blur-2xl -mr-10 -mt-10 -z-10"></div>
            <div className="flex items-center gap-2 text-blue-600 font-semibold text-xs uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
              <span>Asisten Belajar Mahasiswa</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 leading-tight">
              Belajar Cerdas, Bukan Lebih Keras!
            </h2>
            <p className="text-slate-500 text-xs mt-1.5 leading-relaxed">
              StudyMate AI membantu Anda mencerna diktat kuliah, jurnal ilmu, dan materi presentasi dosen ke bentuk ringkasan, penjelasan tutor yang bersahabat, atau kuis latih-diri interaktif dalam hitungan detik.
            </p>
          </div>

          {/* Core Card: Input Textarea and Template Triggers */}
          <div className="bg-white rounded-2xl p-5 border border-sky-100 shadow-md">
            <div className="flex items-center justify-between mb-3.5">
              <label htmlFor="material-input" className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-blue-500" />
                <span>Materi Kuliah Anda</span>
              </label>
              <button 
                onClick={() => {
                  setInputText("");
                  setToast({ type: "info", text: "Kolom materi berhasil dibersihkan!" });
                }}
                className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors cursor-pointer"
              >
                Reset Teks
              </button>
            </div>

            {/* Main Material Input Box */}
            <textarea
              id="material-input"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Jatuhkan tulisan materi pelajaran, salinan modul kuliah, sejarah, atau konsep sains di sini untuk diolah..."
              className="w-full h-64 p-3.5 text-sm rounded-xl border border-sky-100/80 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none shadow-inner placeholder:text-slate-400 leading-relaxed text-slate-700"
              maxLength={6000}
            />
            
            <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1.5 px-1">
              <span>Batas Karakter: {inputText.length} / 6000 kata</span>
              {inputText.length > 0 && (
                <span className="font-mono text-blue-500">
                  {Math.round(inputText.split(/\s+/).filter(Boolean).length)} Kata
                </span>
              )}
            </div>

            {/* Quick Templates Buttons Panel */}
            <div className="mt-5 pt-4 border-t border-sky-100">
              <p className="text-xs font-semibold text-slate-600 mb-2.5 flex items-center gap-1">
                <BookMarked className="w-3.5 h-3.5 text-sky-500" />
                <span>Gunakan Contoh Cepat:</span>
              </p>
              <div className="grid grid-cols-1 gap-2">
                {SAMPLE_MATERIALS.map((sample, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setInputText(sample.body);
                      setToast({ type: "success", text: `Memuat contoh: ${sample.title}` });
                    }}
                    className={`flex items-start text-left p-2.5 rounded-lg border text-xs transition-all duration-200 cursor-pointer ${
                      inputText === sample.body 
                        ? "bg-blue-50 border-blue-200 text-blue-900 font-medium shadow-xs" 
                        : "bg-slate-50/60 border-slate-100 text-slate-600 hover:bg-sky-50 hover:border-sky-100"
                    }`}
                  >
                    <div className="mr-2 mt-0.5 px-1.5 py-0.5 bg-sky-100 text-sky-800 rounded font-bold text-[9px] uppercase tracking-wider">
                      {sample.category}
                    </div>
                    <div className="flex-1 truncate">
                      <span className="font-medium block truncate text-slate-800">{sample.title}</span>
                      <span className="text-[10px] text-slate-400 block truncate">{sample.body}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 self-center ml-1" />
                  </button>
                ))}
              </div>
            </div>

            {/* ACTION TRIGGERS BUTTONS */}
            <div className="mt-6 pt-4 border-t border-sky-100 space-y-3">
              <p className="text-xs font-semibold text-slate-700 mb-2">Pilih Aksi AI Asisten:</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-2.5">
                {/* SUMMARIZE BUTTON */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleAIService("summarize")}
                  disabled={isLoading}
                  className={`w-full py-3 px-4 rounded-xl font-medium text-xs flex items-center justify-center gap-2 shadow-sm border transition-all duration-300 cursor-pointer ${
                    isLoading 
                      ? "bg-slate-100 border-slate-200 text-slate-400" 
                      : activeTab === "summary" && summaryResult 
                      ? "bg-gradient-to-r from-blue-600 to-blue-700 border-blue-600 text-white shadow-md shadow-blue-500/20"
                      : "bg-white border-blue-100 text-blue-700 hover:bg-blue-50/70"
                  }`}
                >
                  <FileText className="w-4 h-5" />
                  <span>Ringkas Materi</span>
                </motion.button>

                {/* TUTOR BUTTON */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleAIService("explain")}
                  disabled={isLoading}
                  className={`w-full py-3 px-4 rounded-xl font-medium text-xs flex items-center justify-center gap-2 shadow-sm border transition-all duration-300 cursor-pointer ${
                    isLoading 
                      ? "bg-slate-100 border-slate-200 text-slate-400" 
                      : activeTab === "tutor" && tutorResult 
                      ? "bg-gradient-to-r from-blue-600 to-blue-700 border-blue-600 text-white shadow-md shadow-blue-500/20"
                      : "bg-white border-blue-100 text-blue-700 hover:bg-blue-50/70"
                  }`}
                >
                  <Brain className="w-4 h-5" />
                  <span>Jelaskan Materi (Tutor)</span>
                </motion.button>

                {/* QUIZ GENERATOR BUTTON */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleAIService("quiz")}
                  disabled={isLoading}
                  className={`w-full py-3 px-4 rounded-xl font-medium text-xs flex items-center justify-center gap-2 shadow-sm border transition-all duration-300 cursor-pointer ${
                    isLoading 
                      ? "bg-slate-100 border-slate-200 text-slate-400" 
                      : activeTab === "quiz" && quizQuestions.length > 0
                      ? "bg-gradient-to-r from-blue-600 to-blue-700 border-blue-600 text-white shadow-md shadow-blue-500/20"
                      : "bg-white border-blue-100 text-blue-700 hover:bg-blue-50/70"
                  }`}
                >
                  <HelpCircle className="w-4 h-5" />
                  <span>Buat Kuis (5 Soal)</span>
                </motion.button>
              </div>
            </div>
          </div>
        </section>

        {/* Right COLUMN Pane: Study Boards / AI Outputs */}
        <section id="output-pane" className="lg:col-span-7 space-y-4">
          
          {/* Inner Results Tab Headers */}
          <div className="bg-white p-1 rounded-xl border border-sky-100/80 shadow-xs flex items-center gap-1">
            <button
              onClick={() => setActiveTab("summary")}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === "summary"
                  ? "bg-blue-600 text-white shadow-sm font-bold"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-800"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Ringkasan {summaryResult && "●"}</span>
            </button>
            <button
              onClick={() => setActiveTab("tutor")}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === "tutor"
                  ? "bg-blue-600 text-white shadow-sm font-bold"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-800"
              }`}
            >
              <Brain className="w-3.5 h-3.5" />
              <span>Tutor AI {tutorResult && "●"}</span>
            </button>
            <button
              onClick={() => setActiveTab("quiz")}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === "quiz"
                  ? "bg-blue-600 text-white shadow-sm font-bold"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-800"
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Kuis Interaktif {quizQuestions.length > 0 && "●"}</span>
            </button>
          </div>

          {/* Main Workspace Card Output */}
          <div className="bg-white rounded-2xl p-5 border border-sky-100 shadow-md min-h-[480px] relative">
            
            {/* 1. Loading Animation overlay */}
            <AnimatePresence>
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-white/95 rounded-2xl z-20 flex flex-col items-center justify-center p-6 text-center"
                >
                  {/* Outer Orbit Loading Ring */}
                  <div className="relative w-16 h-16 mb-4">
                    <div className="absolute inset-0 rounded-full border-4 border-sky-100"></div>
                    <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
                    <div className="absolute inset-2 bg-blue-50 rounded-full flex items-center justify-center">
                      <Brain className="w-6 h-6 text-blue-600 animate-pulse" />
                    </div>
                  </div>

                  {/* Typing/Thinking Cues */}
                  <h3 className="font-bold text-slate-800 text-base">StudyMate sedang berfikir...</h3>
                  
                  {/* Transitory loader status messages with smooth key frame checks */}
                  <div className="h-6 mt-1 flex items-center justify-center overflow-hidden">
                    <motion.p
                      key={loadingStep}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      className="text-xs text-sky-600 font-medium"
                    >
                      {LOADING_STEPS[loadingStep]}
                    </motion.p>
                  </div>

                  {/* Aesthetic mock tip of user */}
                  <div className="mt-8 max-w-xs p-3.5 bg-[#f0f9ff] rounded-xl border border-sky-100/50">
                    <p className="text-[11px] text-slate-500 italic leading-relaxed">
                      {"\"Memperkuat pemahaman dengan kuis dan ringkasan membantumu mengingat 70% lebih lama!\""}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* BOARD SCENARIOS */}

            {/* A. Active Tab: SUMMARY */}
            {activeTab === "summary" && (
              <div className="space-y-4">
                {summaryResult ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    <div className="flex justify-between items-center bg-sky-50/50 p-3 rounded-xl border border-sky-100">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        <p className="text-xs font-semibold text-blue-900 uppercase tracking-wider">Hasil Ringkasan AI</p>
                      </div>
                      <button
                        onClick={() => handleCopyText(summaryResult, "summary")}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 bg-white px-2.5 py-1 rounded-md border border-sky-100 transition-colors cursor-pointer"
                      >
                        {copiedMode === "summary" ? (
                          <>
                            <ClipboardCheck className="w-3.5 h-3.5 text-emerald-500" />
                            <span className="text-emerald-500 font-semibold">Tersalin!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Salin Teks</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="prose prose-sky max-w-none text-slate-800">
                      {renderFormattedText(summaryResult)}
                    </div>
                  </motion.div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
                    <div className="w-14 h-14 bg-sky-50 rounded-full flex items-center justify-center text-sky-500 border border-sky-100/50">
                      <FileText className="w-6 h-6 text-sky-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800 text-sm">Belum Ada Ringkasan</h3>
                      <p className="text-xs text-slate-400 mt-1 max-w-xs leading-relaxed">
                        Masukkan materi kuliahmu di sebelah kiri lalu klik tombol <strong className="text-slate-500 font-semibold">{"\"Ringkas Materi\""}</strong> untuk memproses.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* B. Active Tab: TUTOR EXPLAIN */}
            {activeTab === "tutor" && (
              <div className="space-y-4">
                {tutorResult ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    {/* Tutor Profile Header */}
                    <div className="flex hover:shadow-sm transition-all justify-between items-center bg-gradient-to-r from-sky-50 to-blue-50 p-3.5 rounded-xl border border-sky-100">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs ring-4 ring-blue-100">
                          🎓
                        </div>
                        <div>
                          <p className="text-xs font-bold text-blue-900 leading-none">Tutor Pintar StudyMate</p>
                          <p className="text-[10px] text-slate-400 mt-0.5 leading-none">Menjelaskan materi secara personal</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleCopyText(tutorResult, "tutor")}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 bg-white px-2.5 py-1 rounded-md border border-sky-100 transition-colors cursor-pointer"
                      >
                        {copiedMode === "tutor" ? (
                          <>
                            <ClipboardCheck className="w-3.5 h-3.5 text-emerald-500" />
                            <span className="text-emerald-500 font-semibold">Tersalin!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Salin Teks</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="prose prose-sky max-w-none text-slate-800 bg-slate-50/50 p-4 rounded-xl border border-dashed border-slate-200">
                      {renderFormattedText(tutorResult)}
                    </div>
                  </motion.div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
                    <div className="w-14 h-14 bg-sky-50 rounded-full flex items-center justify-center text-sky-500 border border-sky-100/50">
                      <Brain className="w-6 h-6 text-sky-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800 text-sm">Belum Ada Penjelasan</h3>
                      <p className="text-xs text-slate-400 mt-1 max-w-xs leading-relaxed">
                        Butuh guru privat yang sabar menjelaskan? Klik <strong className="text-slate-500 font-semibold">{"\"Jelaskan Materi (Tutor)\""}</strong> untuk mempelajari konsep secara mendalam.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* C. Active Tab: INTERACTIVE QUIZ */}
            {activeTab === "quiz" && (
              <div className="space-y-4">
                {quizQuestions && quizQuestions.length > 0 ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-5"
                  >
                    {/* Score Ribbon (If graded/submitted) */}
                    {quizSubmitted ? (
                      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 shadow-sm">
                            <Award className="w-6 h-6" />
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-800 text-sm">Kuis Evaluasi Selesai!</h4>
                            <p className="text-[11px] text-slate-500">Nilai Anda: <strong className="text-slate-700">{calculateScore() * 20} / 100 </strong> ({calculateScore()} dari {quizQuestions.length} Terjawab Benar)</p>
                          </div>
                        </div>

                        {/* Visual rating scale */}
                        <div className="flex gap-2 items-center">
                          <span className="text-lg font-bold text-emerald-700 bg-white shadow-xs px-3 py-1 rounded-lg border border-emerald-100">
                            {calculateScore() >= 4 ? "A -" : calculateScore() === 3 ? "B -" : "C -"} Hebat!
                          </span>
                          <button
                            onClick={() => {
                              setSelectedAnswers({});
                              setQuizSubmitted(false);
                            }}
                            className="bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold py-1.5 px-3 rounded-lg border border-slate-200 transition-colors flex items-center gap-1 shadow-xs cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Kuis Lagi</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-sky-50/50 p-3 rounded-xl border border-sky-100 flex items-center justify-between">
                        <p className="text-[11px] text-blue-900 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                          <HelpCircle className="w-3.5 h-3.5 text-blue-500" />
                          <span>Kuis Evaluasi Mandiri</span>
                        </p>
                        <span className="text-[10px] text-slate-400 bg-white px-2 py-0.5 rounded-md font-mono border border-sky-50">
                          {Object.keys(selectedAnswers).length} / {quizQuestions.length} Terjawab
                        </span>
                      </div>
                    )}

                    {/* Questions Cards List */}
                    <div className="space-y-6">
                      {quizQuestions.map((q, qIdx) => {
                        const isCorrect = selectedAnswers[qIdx] === q.correctAnswer;
                        const hasSelected = selectedAnswers[qIdx] !== undefined;

                        return (
                          <div 
                            key={qIdx} 
                            className={`p-4 rounded-xl border transition-all ${
                              quizSubmitted 
                                ? isCorrect 
                                  ? "bg-emerald-50/20 border-emerald-100 shadow-xs" 
                                  : "bg-red-50/20 border-red-100 shadow-xs"
                                : "bg-slate-50/50 border-slate-200 hover:border-slate-300"
                            }`}
                          >
                            <div className="flex items-start gap-2 mb-3">
                              <span className="w-5 h-5 bg-blue-100 text-blue-700 rounded-lg flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                                {qIdx + 1}
                              </span>
                              <h4 className="font-semibold text-slate-800 text-sm">{q.question}</h4>
                            </div>

                            {/* Multiple Choice Options Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                              {q.options.map((opt, oIdx) => {
                                // Extract the option key letter (e.g. 'A', 'B')
                                const optionLetter = opt.trim().charAt(0).toUpperCase();

                                const isSelected = selectedAnswers[qIdx] === optionLetter;
                                const isCorrectLetter = q.correctAnswer === optionLetter;

                                let themeClass = "bg-white border-slate-200 hover:bg-slate-50 text-slate-700 hover:border-slate-300";

                                if (quizSubmitted) {
                                  if (isCorrectLetter) {
                                    themeClass = "bg-emerald-50 border-emerald-300 text-emerald-800 font-medium";
                                  } else if (isSelected && !isCorrectLetter) {
                                    themeClass = "bg-red-50 border-red-300 text-red-800 font-medium";
                                  } else {
                                    themeClass = "bg-white border-slate-100 opacity-60 text-slate-400";
                                  }
                                } else if (isSelected) {
                                  themeClass = "bg-blue-600 border-blue-600 text-white font-medium shadow-sm shadow-blue-500/10";
                                }

                                return (
                                  <button
                                    key={oIdx}
                                    onClick={() => handleSelectAnswer(qIdx, optionLetter)}
                                    disabled={quizSubmitted}
                                    className={`text-left p-2.5 rounded-lg border text-xs transition-all flex items-center justify-between cursor-pointer ${themeClass}`}
                                  >
                                    <span className="flex-1 pr-1">{opt}</span>
                                    
                                    {/* Icon Feedbacks */}
                                    {isSelected && !quizSubmitted && (
                                      <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                                    )}
                                    {quizSubmitted && isCorrectLetter && (
                                      <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 ml-1.5" />
                                    )}
                                    {quizSubmitted && isSelected && !isCorrectLetter && (
                                      <XCircle className="w-4 h-4 text-red-500 shrink-0 ml-1.5" />
                                    )}
                                  </button>
                                );
                              })}
                            </div>

                            {/* Correct / Incorrect Feedback Explanations */}
                            {quizSubmitted && (
                              <div className={`mt-3 p-3 rounded-lg text-xs leading-relaxed shadow-inner ${
                                isCorrect 
                                  ? "bg-emerald-50/45 text-emerald-800 border-l-2 border-emerald-500" 
                                  : "bg-red-50/45 text-red-800 border-l-2 border-red-500"
                              }`}>
                                <p className="font-bold flex items-center gap-1.5 mb-1 text-[11px]">
                                  <Info className="w-3.5 h-3.5" />
                                  <span>Kunci Jawaban: {q.correctAnswer}</span>
                                  <span className="text-[10px] font-normal px-1 rounded-sm bg-white/40">
                                    {isCorrect ? "Jawaban Anda Benar!" : "Jawaban Anda Salah"}
                                  </span>
                                </p>
                                <p className="font-medium text-slate-600 italic">Pembahasan: {q.explanation}</p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Grade Kuis Button */}
                    {!quizSubmitted && (
                      <div className="flex justify-end pt-2">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handleSubmitQuiz}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-6 rounded-xl text-xs shadow-md shadow-emerald-600/10 flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <ClipboardCheck className="w-4 h-4" />
                          <span>Serahkan & Periksa Jawaban</span>
                        </motion.button>
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
                    <div className="w-14 h-14 bg-sky-50 rounded-full flex items-center justify-center text-sky-500 border border-sky-100/50">
                      <HelpCircle className="w-6 h-6 text-sky-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800 text-sm">Gagal Menemukan Kuis</h3>
                      <p className="text-xs text-slate-400 mt-1 max-w-xs leading-relaxed">
                        Evaluasi pemahamanmu secara menyeluruh! Klik <strong className="text-slate-500 font-semibold">{"\"Buat Kuis (5 Soal)\""}</strong> untuk meminta AI membuat 5 soal interaktif dari studimu.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Footer Workspace Credit Label */}
            <div className="mt-12 pt-4 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-400">
              <span className="flex items-center gap-1">
                <BookOpen className="w-3 h-3 text-sky-400" />
                <span>Belajar Cerdas dengan AI</span>
              </span>
              <span>Disertai model: Gemini 2.5 Flash</span>
            </div>

          </div>
        </section>

      </main>

      {/* App Level Footer */}
      <footer id="app-footer" className="bg-white border-t border-sky-100 py-6 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <p className="font-medium">StudyMate AI © {new Date().getFullYear()} — Semua hak cipta dilindungi.</p>
          <p className="text-[10px] text-slate-400">Didesain khusus untuk mahasiswa Indonesia yang cerdas dan visioner.</p>
        </div>
      </footer>
    </div>
  );
}
