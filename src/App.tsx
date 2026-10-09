import { useState, useRef, useEffect, useCallback } from "react";
import {
  Send,
  Check,
  X,
  Volume2,
  VolumeX,
  Eye,
  SlidersHorizontal,
  MessageSquare,
  Sparkles,
  Heart,
  Clock,
  BookOpen,
  Coffee,
  Users,
  Compass,
  ArrowRight,
  Bookmark,
  Quote,
} from "lucide-react";
import { soundscape } from "./lib/ambientSound";
import bgImage from "./assets/images/chiaroscuro_bg_1791533344174.jpg";

type TabType = "home" | "cerita" | "pesan";
type MoodPreset = "chiaroscuro" | "moonlight" | "noir";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  targetAlpha: number;
  hue: number;
}

interface UserMessage {
  id: string;
  name: string;
  contact: string;
  message: string;
  topic: string;
  timestamp: string;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>("home");
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [isAudioActive, setIsAudioActive] = useState(false);

  // Message Form States
  const [senderName, setSenderName] = useState("");
  const [senderContact, setSenderContact] = useState("");
  const [messageContent, setMessageContent] = useState("");
  const [messageTopic, setMessageTopic] = useState("Sapaan");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [savedMessages, setSavedMessages] = useState<UserMessage[]>([]);
  const [lastSentMessage, setLastSentMessage] = useState<UserMessage | null>(null);

  // Active Reading Card detail
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);

  // Interactivity States
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [mood, setMood] = useState<MoodPreset>("chiaroscuro");
  const [isControlsOpen, setIsControlsOpen] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5, clientX: 0, clientY: 0 });
  const [smoothMouse, setSmoothMouse] = useState({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const particlesRef = useRef<Particle[]>([]);

  // Default seed messages for warm community vibe
  const INITIAL_COMMUNITY_STORIES: UserMessage[] = [
    {
      id: "seed-1",
      name: "Sahabat Diskusi",
      contact: "alex@reader.id",
      message: "Buku yang kamu rekomendasikan kemarin luar biasa membuka perspektif baru tentang ketenangan.",
      topic: "Rekomendasi Buku",
      timestamp: "08 Okt 2026, 19:40",
    },
    {
      id: "seed-2",
      name: "Kawan Ngopi",
      contact: "kawan@santai.com",
      message: "Terima kasih sudah selalu jadi pendengar yang baik. Quality time kemarin bikin pikiran jauh lebih segar!",
      topic: "Cerita",
      timestamp: "07 Okt 2026, 21:15",
    },
  ];

  // Load existing messages
  useEffect(() => {
    try {
      const saved = localStorage.getItem("raqad_saved_messages");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSavedMessages([...INITIAL_COMMUNITY_STORIES, ...parsed]);
          setLastSentMessage(parsed[parsed.length - 1]);
          return;
        }
      }
      setSavedMessages(INITIAL_COMMUNITY_STORIES);
    } catch {
      setSavedMessages(INITIAL_COMMUNITY_STORIES);
    }
  }, []);

  // Initialize particles for canvas ambient studio dust
  useEffect(() => {
    const particles: Particle[] = [];
    const count = 35;
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 0.25,
        vy: -0.15 - Math.random() * 0.2,
        size: Math.random() * 2 + 0.8,
        alpha: Math.random() * 0.4 + 0.1,
        targetAlpha: Math.random() * 0.5 + 0.15,
        hue: Math.random() > 0.4 ? 38 : 45,
      });
    }
    particlesRef.current = particles;
  }, []);

  // Canvas particle render loop & cursor interaction
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    let rafId: number;
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const particles = particlesRef.current;
      const targetX = mousePos.clientX;
      const targetY = mousePos.clientY;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        p.x += p.vx;
        p.y += p.vy;

        if (p.y < -10) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;

        const dx = p.x - targetX;
        const dy = p.y - targetY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 130 && dist > 0) {
          const force = (130 - dist) / 130;
          p.x += (dx / dist) * force * 1.8;
          p.y += (dy / dist) * force * 1.8;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        if (mood === "moonlight") {
          ctx.fillStyle = `rgba(180, 210, 240, ${p.alpha * 0.7})`;
        } else if (mood === "noir") {
          ctx.fillStyle = `rgba(220, 220, 220, ${p.alpha * 0.5})`;
        } else {
          ctx.fillStyle = `rgba(235, 185, 115, ${p.alpha})`;
        }
        ctx.fill();
      }

      rafId = requestAnimationFrame(render);
    };

    rafId = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", handleResize);
    };
  }, [mousePos, mood]);

  // Smooth lerp for parallax motion
  useEffect(() => {
    let currentX = 0;
    let currentY = 0;

    const tick = () => {
      const targetX = (mousePos.x - 0.5) * 2;
      const targetY = (mousePos.y - 0.5) * 2;

      currentX += (targetX - currentX) * 0.05;
      currentY += (targetY - currentY) * 0.05;

      setSmoothMouse({ x: currentX, y: currentY });
      animationFrameRef.current = requestAnimationFrame(tick);
    };

    animationFrameRef.current = requestAnimationFrame(tick);
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [mousePos.x, mousePos.y]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;
    setMousePos({
      x: clientX / innerWidth,
      y: clientY / innerHeight,
      clientX,
      clientY,
    });
  }, []);

  // Lock body scroll on overlay
  useEffect(() => {
    if (isMessageModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMessageModalOpen]);

  // Escape key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isFocusMode) {
          setIsFocusMode(false);
        } else if (isMessageModalOpen) {
          setIsMessageModalOpen(false);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFocusMode, isMessageModalOpen]);

  // Soundscape toggle
  const toggleAudio = () => {
    if (isAudioActive) {
      soundscape.stop();
      setIsAudioActive(false);
    } else {
      soundscape.start();
      setIsAudioActive(true);
    }
  };

  const handleOpenMessageModal = () => {
    setIsMessageModalOpen(true);
    setIsSubmitted(false);
  };

  const handleMessageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageContent.trim()) return;

    const newMessage: UserMessage = {
      id: Date.now().toString(),
      name: senderName.trim() || "Teman Tanpa Nama",
      contact: senderContact.trim() || "-",
      message: messageContent.trim(),
      topic: messageTopic,
      timestamp: new Date().toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    try {
      const existing = localStorage.getItem("raqad_saved_messages");
      const list = existing ? JSON.parse(existing) : [];
      list.push(newMessage);
      localStorage.setItem("raqad_saved_messages", JSON.stringify(list));
      setSavedMessages([...INITIAL_COMMUNITY_STORIES, ...list]);
    } catch {
      setSavedMessages((prev) => [...prev, newMessage]);
    }

    setLastSentMessage(newMessage);
    setIsSubmitted(true);
  };

  const handleResetForm = () => {
    setMessageContent("");
    setIsSubmitted(false);
  };

  const moodFilters = {
    chiaroscuro: "brightness(0.92) contrast(1.08) saturate(1.05)",
    moonlight: "brightness(0.85) contrast(1.15) saturate(0.7) hue-rotate(185deg)",
    noir: "brightness(0.88) contrast(1.35) grayscale(1)",
  };

  const TOPIC_PRESETS = [
    { label: "Sapaan", icon: Sparkles },
    { label: "Cerita", icon: MessageSquare },
    { label: "Rekomendasi Buku", icon: Heart },
    { label: "Lainnya", icon: Clock },
  ];

  // Story & Reading cards tailored to Raqad's personality
  const READING_STORIES = [
    {
      icon: BookOpen,
      category: "Dunia Membaca",
      title: "Membaca Sebagai Ruang Pulang",
      summary:
        "Buku bukan sekadar untaian aksara, melainkan jendela tempat pikiran bisa bernapas lega di tengah bisingnya ritme dunia.",
      content:
        "Bagi saya, setiap halaman buku adalah perjumpaan dengan jiwa penulisnya. Mulai dari karya sastra reflektif hingga filsafat hidup, membaca mengajarkan saya arti kerendahan hati dan pentingnya menjaga rasa ingin tahu tetap hidup.",
      quote: "Buku yang baik tidak memberimu jawaban instan, ia melatihmu mengajukan pertanyaan yang lebih bijak.",
    },
    {
      icon: Users,
      category: "Nilai Hidup",
      title: "Hangatnya Sebuah Kebersamaan",
      summary:
        "Tawa renyah, tatap muka tanpa distraksi layar gawai, dan kehadiran utuh bersama orang-orang tercinta.",
      content:
        "Kebersamaan bukan diukur dari ramainya acara, melainkan seberapa hadir kita untuk satu sama lain. Sebagai pria yang ceria, saya selalu meyakini bahwa senyuman yang dibagikan dengan tulus memiliki daya sembuh yang luar biasa.",
      quote: "Kehadiran yang utuh adalah hadiah paling berharga yang bisa kita berikan kepada orang lain.",
    },
    {
      icon: Coffee,
      category: "Quality Time",
      title: "Seni Mendengarkan Cerita",
      summary:
        "Setiap orang menyimpan samudra kisah yang belum terjelajah. Menyimak adalah cara termurni untuk menghargai sesama.",
      content:
        "Mendengarkan bukanlah menunggu giliran berbicara, melainkan menyediakan ruang aman bagi seseorang untuk menjadi dirinya sendiri. Saya sangat menyukai momen duduk santai sambil mendengarkan bagaimana hari seseorang bergulir.",
      quote: "Ketika kita mendengarkan dengan hati, kita sedang merajut jembatan kasih yang tak tampak.",
    },
  ];

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="relative min-h-screen flex flex-col justify-between overflow-x-hidden select-none bg-[#0a0d12]"
    >
      {/* Interactive Background Layer */}
      <div
        className="absolute inset-0 z-0 overflow-hidden pointer-events-none"
        aria-hidden="true"
      >
        {/* Parallax Image Element */}
        <div
          className="absolute inset-0 w-full h-full transition-transform duration-75 ease-out will-change-transform"
          style={{
            transform: `scale(1.08) translate3d(${smoothMouse.x * -16}px, ${smoothMouse.y * -16}px, 0)`,
          }}
        >
          <img
            src={bgImage}
            alt="Velorah Chiaroscuro Portrait Background"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-[center_28%] transition-all duration-700"
            style={{
              filter: moodFilters[mood],
            }}
          />
        </div>

        {/* Dynamic Chiaroscuro Torchlight Cursor Glow */}
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-300"
          style={{
            background:
              mood === "moonlight"
                ? `radial-gradient(circle 380px at ${mousePos.clientX}px ${mousePos.clientY}px, rgba(160, 200, 255, 0.12), transparent 70%)`
                : mood === "noir"
                ? `radial-gradient(circle 360px at ${mousePos.clientX}px ${mousePos.clientY}px, rgba(255, 255, 255, 0.08), transparent 70%)`
                : `radial-gradient(circle 380px at ${mousePos.clientX}px ${mousePos.clientY}px, rgba(235, 175, 95, 0.14), transparent 70%)`,
          }}
        />

        {/* Subtle Canvas Vignette for Cinematic Framing */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 90% 85% at 50% 50%, transparent 35%, rgba(5, 12, 18, 0.55) 100%)",
          }}
        />

        {/* Ambient Floating Dust Motes Canvas */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none opacity-80"
        />
      </div>

      {/* Navigation Bar without Hamburger Menu */}
      <header
        className={`relative z-20 w-full transition-opacity duration-500 ${
          isFocusMode ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
      >
        <nav
          className="flex row justify-between items-center px-4 sm:px-8 py-5 sm:py-6 max-w-7xl mx-auto w-full gap-2 sm:gap-4"
          aria-label="Main Navigation"
        >
          {/* Custom "RMZ" Monogram Logo */}
          <button
            type="button"
            onClick={() => setActiveTab("home")}
            className="group flex items-center space-x-2.5 sm:space-x-3 text-left cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/40 rounded-xl"
            aria-label="RMZ - Kembali ke Beranda"
          >
            {/* Logo Emblem Badge */}
            <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl liquid-glass border border-amber-200/30 flex items-center justify-center shadow-[0_0_15px_rgba(217,119,6,0.15)] group-hover:scale-105 transition-transform">
              <span
                className="text-base sm:text-lg tracking-wider font-bold text-amber-100 group-hover:text-white transition-colors"
                style={{ fontFamily: "'Instrument Serif', serif" }}
              >
                RMZ
              </span>
              <span className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-amber-400/80 shadow-[0_0_6px_rgba(251,191,36,0.8)]" />
            </div>

            {/* Logo Title Subtext */}
            <div className="flex flex-col">
              <span
                className="text-lg sm:text-xl tracking-tight text-foreground leading-none font-normal group-hover:text-amber-100 transition-colors"
                style={{ fontFamily: "'Instrument Serif', serif" }}
              >
                Raqad M. Zikri
              </span>
              <span className="text-[10px] tracking-widest text-muted-foreground/70 uppercase font-mono mt-0.5">
                Ruang Cerita • 2026
              </span>
            </div>
          </button>

          {/* Clean Responsive Navigation Tabs (No Hamburger Needed!) */}
          <div className="flex items-center space-x-1 sm:space-x-2 liquid-glass rounded-full p-1 border border-white/10">
            <button
              type="button"
              onClick={() => setActiveTab("home")}
              className={`text-xs sm:text-sm px-3 sm:px-4 py-1.5 rounded-full transition-all cursor-pointer font-medium ${
                activeTab === "home"
                  ? "bg-white/15 text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              }`}
            >
              Home
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("cerita")}
              className={`text-xs sm:text-sm px-3 sm:px-4 py-1.5 rounded-full transition-all cursor-pointer font-medium flex items-center space-x-1.5 ${
                activeTab === "cerita"
                  ? "bg-white/15 text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 opacity-80" />
              <span>Cerita</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("pesan")}
              className={`text-xs sm:text-sm px-3 sm:px-4 py-1.5 rounded-full transition-all cursor-pointer font-medium flex items-center space-x-1.5 ${
                activeTab === "pesan"
                  ? "bg-white/15 text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 opacity-80" />
              <span className="hidden xs:inline">Kotak Pesan</span>
              <span className="xs:hidden">Pesan</span>
            </button>
          </div>

          {/* Nav CTA button: "Kirimkan Pesan" */}
          <div className="flex items-center">
            <button
              type="button"
              onClick={handleOpenMessageModal}
              className="liquid-glass rounded-full px-3.5 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm text-foreground hover:scale-[1.03] transition-transform cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/40 flex items-center space-x-2 font-medium"
            >
              <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden md:inline">Kirimkan Pesan</span>
              <span className="md:hidden">Kirim</span>
            </button>
          </div>
        </nav>
      </header>

      {/* Main Dynamic View Content */}
      {activeTab === "home" && (
        <main
          className={`relative z-10 flex flex-col items-center justify-center text-center px-6 pt-24 sm:pt-32 pb-36 sm:pb-40 py-[90px] my-auto transition-all duration-700 ${
            isFocusMode
              ? "opacity-0 scale-95 pointer-events-none"
              : "opacity-100 scale-100"
          }`}
          style={{
            transform: `translate3d(${smoothMouse.x * 6}px, ${smoothMouse.y * 6}px, 0)`,
          }}
        >
          <h1
            className="text-5xl sm:text-7xl md:text-8xl leading-[0.95] tracking-[-2.46px] max-w-7xl font-normal animate-fade-rise drop-shadow-md"
            style={{ fontFamily: "'Instrument Serif', serif" }}
          >
            Where <em className="not-italic text-muted-foreground">dreams</em> rise{" "}
            <em className="not-italic text-muted-foreground">through the silence.</em>
          </h1>

          {/* Indonesian Description */}
          <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mt-8 leading-relaxed animate-fade-rise-delay drop-shadow-sm font-normal">
            Seorang pria ceria yang menyukai kebersamaan, quality time, membaca, dan mendengarkan cerita
          </p>

          {/* Main CTA: Kirimkan Pesan */}
          <button
            onClick={handleOpenMessageModal}
            className="liquid-glass rounded-full px-12 sm:px-14 py-4 sm:py-5 text-base text-foreground mt-12 hover:scale-[1.03] cursor-pointer animate-fade-rise-delay-2 transition-transform focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/40 flex items-center space-x-3 group"
          >
            <span>Kirimkan Pesan</span>
            <Send className="w-4 h-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </button>
        </main>
      )}

      {/* Tab: "Cerita & Bacaan" */}
      {activeTab === "cerita" && (
        <main className="relative z-10 max-w-6xl mx-auto px-6 py-12 sm:py-20 w-full animate-fade-rise my-auto">
          <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
            <span className="text-xs uppercase tracking-widest text-amber-200/80 font-mono">
              Refleksi &amp; Kegemaran
            </span>
            <h2
              className="text-4xl sm:text-5xl text-foreground mt-2 mb-4"
              style={{ fontFamily: "'Instrument Serif', serif" }}
            >
              Cerita, Bacaan, &amp; Kebersamaan
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Melihat dunia melalui kehangatan tatap muka, lembaran buku yang jujur, dan waktu berkualitas bersama orang-orang tersayang.
            </p>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {READING_STORIES.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  onClick={() => setActiveStoryIndex(activeStoryIndex === idx ? null : idx)}
                  className="liquid-glass rounded-3xl p-6 sm:p-7 border border-white/10 hover:border-amber-200/30 transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground/70 group-hover:text-amber-200 transition-colors">
                        {item.category}
                      </span>
                      <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-muted-foreground group-hover:text-white transition-colors">
                        <Icon className="w-4 h-4" />
                      </div>
                    </div>
                    <h3
                      className="text-2xl text-foreground mb-3 leading-snug group-hover:text-amber-100 transition-colors"
                      style={{ fontFamily: "'Instrument Serif', serif" }}
                    >
                      {item.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-4">
                      {item.summary}
                    </p>

                    {activeStoryIndex === idx && (
                      <div className="mt-4 pt-4 border-t border-white/10 text-xs text-foreground/80 leading-relaxed animate-fade-rise">
                        <p className="mb-3">{item.content}</p>
                        <blockquote className="italic text-amber-200/80 pl-3 border-l-2 border-amber-300/40 my-2">
                          "{item.quote}"
                        </blockquote>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs text-muted-foreground group-hover:text-foreground transition-colors mt-4">
                    <span>{activeStoryIndex === idx ? "Tutup Catatan" : "Baca Lebih Lanjut"}</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-center mt-10">
            <button
              onClick={handleOpenMessageModal}
              className="liquid-glass rounded-full px-8 py-3.5 text-sm text-foreground hover:scale-[1.02] transition-transform cursor-pointer inline-flex items-center space-x-2"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Bagikan Ceritamu Kepada Raqad</span>
            </button>
          </div>
        </main>
      )}

      {/* Tab: "Kotak Pesan" */}
      {activeTab === "pesan" && (
        <main className="relative z-10 max-w-4xl mx-auto px-6 py-12 sm:py-20 w-full animate-fade-rise my-auto">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs uppercase tracking-widest text-amber-200/80 font-mono">
              Kotak Pesan Terbuka
            </span>
            <h2
              className="text-4xl sm:text-5xl text-foreground mt-2 mb-3"
              style={{ fontFamily: "'Instrument Serif', serif" }}
            >
              Ruang Berbagi Sapaan &amp; Kisah
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Kirimkan pemikiranmu, saran buku, atau sekadar cerita hari ini. Setiap pesan diterima dan dibaca dengan hangat.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Quick Compose Card */}
            <div className="liquid-glass rounded-3xl p-6 sm:p-8 border border-white/10 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-2xl bg-amber-400/10 border border-amber-300/20 flex items-center justify-center text-amber-200 mb-4">
                  <Send className="w-5 h-5" />
                </div>
                <h3
                  className="text-2xl text-foreground mb-2"
                  style={{ fontFamily: "'Instrument Serif', serif" }}
                >
                  Tuliskan Pesan untuk Raqad
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-6">
                  Ada cerita seru yang baru kamu dengar? Atau buku bagus yang wajib dibaca? Silakan ketik langsung ke sini.
                </p>
              </div>

              <button
                onClick={handleOpenMessageModal}
                className="w-full liquid-glass rounded-full py-4 px-6 text-sm text-foreground flex items-center justify-center space-x-2 hover:scale-[1.02] transition-transform cursor-pointer font-medium"
              >
                <span>Buka Formulir Pesan</span>
                <Send className="w-4 h-4" />
              </button>
            </div>

            {/* Recent Messages & Greetings Showcase */}
            <div className="liquid-glass rounded-3xl p-6 sm:p-8 border border-white/10 max-h-[420px] overflow-y-auto flex flex-col space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                  Pesan &amp; Sapaan Terbaru
                </span>
                <span className="text-[11px] font-mono text-amber-200/80">
                  {savedMessages.length} Catatan
                </span>
              </div>

              {savedMessages.slice(-5).reverse().map((msg) => (
                <div
                  key={msg.id}
                  className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors"
                >
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-medium text-foreground">{msg.name}</span>
                    <span className="text-[10px] text-muted-foreground/60 font-mono">
                      {msg.timestamp}
                    </span>
                  </div>
                  <span className="inline-block px-2 py-0.5 rounded-full bg-white/5 text-[10px] text-amber-200/70 font-mono mb-2">
                    {msg.topic}
                  </span>
                  <p className="text-xs text-foreground/80 leading-relaxed italic">
                    "{msg.message}"
                  </p>
                </div>
              ))}
            </div>
          </div>
        </main>
      )}

      {/* Focus Mode Overlay Helper Banner */}
      {isFocusMode && (
        <div
          onClick={() => setIsFocusMode(false)}
          className="fixed inset-0 z-30 flex flex-col justify-between p-8 cursor-pointer animate-fade-rise"
          title="Klik di mana saja untuk kembali ke tampilan utama"
        >
          <div className="flex justify-between items-center text-xs text-white/50 font-mono tracking-wider">
            <span>RMZ • RAQAD M. ZIKRI 2026</span>
            <span className="flex items-center space-x-2">
              <Eye className="w-3.5 h-3.5" />
              <span>KLIK UNTUK KEMBALI</span>
            </span>
          </div>
          <div className="text-center text-xs text-white/40 font-mono">
            Gerakkan kursor untuk mengarahkan cahaya pada kanvas lukisan
          </div>
        </div>
      )}

      {/* Interactive Controls & Status Footer with Creator Attribution */}
      <footer
        className={`relative z-20 w-full px-6 sm:px-8 py-5 sm:py-6 max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground/70 transition-opacity duration-500 ${
          isFocusMode ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
      >
        {/* Creator Attribution */}
        <div className="flex items-center space-x-2.5 text-xs">
          <span className="w-2 h-2 rounded-full bg-amber-400/80 shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
          <span className="text-foreground/90 font-medium tracking-wide">
            Raqad M. Zikri 2026
          </span>
          <span>•</span>
          <span className="font-mono text-[11px] text-muted-foreground/80">
            Chiaroscuro Canvas
          </span>
        </div>

        {/* Interactive Experience Controls Bar */}
        <div className="flex items-center space-x-3">
          {/* Lighting Mood Switcher */}
          <div className="relative">
            <button
              onClick={() => setIsControlsOpen(!isControlsOpen)}
              className="liquid-glass rounded-full px-3.5 py-1.5 flex items-center space-x-2 text-foreground/80 hover:text-foreground transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/40"
              title="Sesuaikan Pencahayaan & Nuansa Kanvas"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span className="text-[11px] uppercase tracking-wider font-mono capitalize">
                {mood}
              </span>
            </button>

            {/* Mood Dropdown Popover */}
            {isControlsOpen && (
              <div className="absolute bottom-full mb-2 right-0 sm:left-0 liquid-glass rounded-2xl p-2 border border-white/10 shadow-2xl flex flex-col space-y-1 min-w-[150px] bg-[#05141e]/90 backdrop-blur-2xl animate-fade-rise z-40">
                {(["chiaroscuro", "moonlight", "noir"] as MoodPreset[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => {
                      setMood(m);
                      setIsControlsOpen(false);
                    }}
                    className={`text-left text-xs px-3 py-2 rounded-xl capitalize transition-colors flex items-center justify-between cursor-pointer ${
                      mood === m
                        ? "bg-white/15 text-foreground font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                    }`}
                  >
                    <span>{m}</span>
                    {mood === m && <Check className="w-3 h-3 text-white" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Full Canvas Focus Mode Toggle */}
          <button
            onClick={() => setIsFocusMode(true)}
            className="liquid-glass rounded-full px-3.5 py-1.5 flex items-center space-x-2 text-foreground/80 hover:text-foreground transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/40"
            title="Masuk Mode Fokus Penuh (Heningkan UI)"
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="text-[11px] uppercase tracking-wider font-mono hidden sm:inline">Fokus Kanvas</span>
          </button>

          {/* Ambient Audio Synthesizer */}
          <button
            onClick={toggleAudio}
            className={`liquid-glass rounded-full px-3.5 py-1.5 flex items-center space-x-2 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/40 ${
              isAudioActive
                ? "text-white shadow-[0_0_12px_rgba(255,255,255,0.2)]"
                : "text-foreground/80 hover:text-foreground"
            }`}
            title={isAudioActive ? "Matikan Suara Ambience" : "Nyalakan Suara Ambience Hening"}
          >
            {isAudioActive ? (
              <>
                <Volume2 className="w-3.5 h-3.5 text-white animate-pulse" />
                <span className="text-[11px] tracking-wider uppercase font-mono">Audio On</span>
              </>
            ) : (
              <>
                <VolumeX className="w-3.5 h-3.5" />
                <span className="text-[11px] tracking-wider uppercase font-mono">Off</span>
              </>
            )}
          </button>
        </div>
      </footer>

      {/* Interactive Messaging Modal */}
      {isMessageModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Kirimkan Pesan untuk Raqad M. Zikri"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-rise"
        >
          <div className="relative liquid-glass rounded-3xl p-6 sm:p-9 max-w-lg w-full border border-white/15 shadow-2xl bg-[#05141e]/95 max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => setIsMessageModalOpen(false)}
              className="absolute top-5 right-5 text-muted-foreground hover:text-foreground p-1.5 rounded-full transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/40"
              aria-label="Tutup jendela pesan"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>

            {isSubmitted ? (
              <div className="text-center py-6 animate-fade-rise">
                <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center mx-auto mb-4 text-emerald-300">
                  <Check className="w-7 h-7" />
                </div>
                <span className="text-xs uppercase tracking-widest text-emerald-400/90 font-mono">
                  Pesan Terkirim
                </span>
                <h3
                  className="text-3xl text-foreground mt-2 mb-3"
                  style={{ fontFamily: "'Instrument Serif', serif" }}
                >
                  Terima Kasih Banyak!
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto mb-6">
                  Pesanmu telah tersampaikan dengan baik untuk <strong className="text-foreground font-medium">Raqad M. Zikri</strong>. Menyenangkan sekali bisa mendengarkan cerita dan sapaan darimu!
                </p>

                {lastSentMessage && (
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-left mb-6 text-xs text-muted-foreground">
                    <div className="flex justify-between items-center mb-2 pb-2 border-b border-white/10">
                      <span className="font-medium text-foreground">{lastSentMessage.name}</span>
                      <span className="font-mono text-[11px] opacity-70">{lastSentMessage.timestamp}</span>
                    </div>
                    <p className="italic text-foreground/90 whitespace-pre-wrap">
                      "{lastSentMessage.message}"
                    </p>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={handleResetForm}
                    className="flex-1 py-3 px-5 rounded-full bg-white/10 text-xs text-foreground hover:bg-white/15 transition-colors cursor-pointer"
                  >
                    Tulis Pesan Lain
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsMessageModalOpen(false)}
                    className="flex-1 py-3 px-5 rounded-full bg-white text-slate-950 font-medium text-xs hover:bg-white/90 transition-colors cursor-pointer"
                  >
                    Selesai
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="mb-6">
                  <span className="text-xs uppercase tracking-widest text-amber-200/80 font-mono">
                    Ruang Pesan Langsung
                  </span>
                  <h3
                    className="text-3xl sm:text-4xl text-foreground mt-1.5 mb-2"
                    style={{ fontFamily: "'Instrument Serif', serif" }}
                  >
                    Kirimkan Pesan untuk Raqad
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    Punya sapaan, cerita, rekomendasi buku, atau apa pun yang ingin dibagikan? Tuliskan dengan leluasa di sini.
                  </p>
                </div>

                {/* Topic Presets */}
                <div className="mb-5">
                  <label className="block text-xs text-muted-foreground mb-2 font-mono">
                    Topik Pesan:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {TOPIC_PRESETS.map((t) => {
                      const Icon = t.icon;
                      const isSelected = messageTopic === t.label;
                      return (
                        <button
                          key={t.label}
                          type="button"
                          onClick={() => setMessageTopic(t.label)}
                          className={`px-3 py-1.5 rounded-full text-xs flex items-center space-x-1.5 transition-all cursor-pointer ${
                            isSelected
                              ? "bg-white text-slate-950 font-medium shadow-sm"
                              : "bg-white/5 text-muted-foreground hover:text-foreground hover:bg-white/10 border border-white/5"
                          }`}
                        >
                          <Icon className="w-3 h-3" />
                          <span>{t.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <form onSubmit={handleMessageSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="name" className="block text-xs text-muted-foreground mb-1 font-mono">
                        Nama / Panggilan
                      </label>
                      <input
                        id="name"
                        type="text"
                        value={senderName}
                        onChange={(e) => setSenderName(e.target.value)}
                        placeholder="Contoh: Alex / Teman Baca"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-foreground placeholder:text-muted-foreground/50 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-white/40 transition-all"
                      />
                    </div>
                    <div>
                      <label htmlFor="contact" className="block text-xs text-muted-foreground mb-1 font-mono">
                        Kontak / Sosmed (Opsional)
                      </label>
                      <input
                        id="contact"
                        type="text"
                        value={senderContact}
                        onChange={(e) => setSenderContact(e.target.value)}
                        placeholder="Email / IG / No. WA"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-foreground placeholder:text-muted-foreground/50 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-white/40 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label htmlFor="message" className="block text-xs text-muted-foreground font-mono">
                        Pesan Kamu <span className="text-rose-400">*</span>
                      </label>
                      <span className="text-[11px] text-muted-foreground/60 font-mono">
                        {messageContent.length} karakter
                      </span>
                    </div>
                    <textarea
                      id="message"
                      required
                      rows={4}
                      value={messageContent}
                      onChange={(e) => setMessageContent(e.target.value)}
                      placeholder="Ceritakan apa pun yang sedang kamu pikirkan, sapaan hangat, atau cerita menarik..."
                      className="w-full px-3.5 py-3 rounded-2xl bg-white/5 border border-white/10 text-foreground placeholder:text-muted-foreground/50 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-white/40 transition-all resize-none leading-relaxed"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full liquid-glass rounded-full py-3.5 px-6 text-sm text-foreground flex items-center justify-center space-x-2 hover:scale-[1.02] transition-transform cursor-pointer font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/40 mt-2"
                  >
                    <span>Kirimkan Pesan Sekarang</span>
                    <Send className="w-4 h-4" />
                  </button>
                </form>

                <p className="text-[11px] text-muted-foreground/50 text-center mt-4">
                  Pesanmu akan tersimpan dan dibaca dengan hangat oleh Raqad M. Zikri.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
