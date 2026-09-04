"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Car, Rocket, Zap, Trophy } from "lucide-react";
import { v4 as uuidv4 } from "uuid";

export default function Home() {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !name) {
      setError("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    setLoading(true);
    setError("");

    // Check session ID
    let sessionId = localStorage.getItem('quiz_session_id');
    if (!sessionId) {
      sessionId = uuidv4();
      localStorage.setItem('quiz_session_id', sessionId);
    }

    try {
      // In MVP without real backend we route to game right away, but here we expect Supabase setup.
      // So we just route the user to /game/[code] and handle the rest there, 
      // or we can invoke joinGame logic directly here if we want to confirm the room exists.
      router.push(`/game/${code.toUpperCase()}?name=${encodeURIComponent(name)}`);
    } catch (err: any) {
      setError(err.message || "เกิดข้อผิดพลาด");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden bg-gradient-to-b from-slate-900 to-indigo-950">

      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute top-20 left-10 text-white/5 text-9xl font-bold italic rotate-12 select-none">RACE</div>
        <div className="absolute bottom-20 right-10 text-white/5 text-9xl font-bold italic -rotate-12 select-none">QUIZ</div>
      </div>

      <main className="z-10 w-full max-w-md flex flex-col items-center gap-6">

        <div className="text-center space-y-2 mb-4 animate-bounce-slow">
          <div className="flex items-center justify-center gap-3 text-primary">
            <Zap size={40} className="fill-primary" />
            <h1 className="text-5xl font-extrabold italic tracking-tight text-white drop-shadow-lg">
              QUIZ <span className="text-primary">JUSTNEW</span>
            </h1>
          </div>
          <p className="text-slate-300 font-medium">ตอบให้ไว แข่งให้สุด ใครจะเป็น Champion?</p>
        </div>

        <div className="w-full glass-panel p-8 space-y-6 shadow-2xl">
          <form onSubmit={handleJoin} className="space-y-4">

            {error && (
              <div className="bg-red-500/20 text-red-300 p-3 rounded-lg text-sm font-medium border border-red-500/30 text-center">
                {error}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-300 uppercase tracking-wider">Room Code</label>
              <input
                type="text"
                placeholder="Ex. A7K92"
                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-4 text-white text-xl text-center uppercase tracking-widest focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                maxLength={6}
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-300 uppercase tracking-wider">Nickname</label>
              <input
                type="text"
                placeholder="ชื่อเล่นของคุณ"
                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-4 text-white text-lg focus:ring-2 focus:ring-secondary focus:border-transparent transition-all outline-none"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={15}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-primary to-rose-600 hover:from-rose-600 hover:to-primary text-white font-bold text-xl p-4 rounded-lg shadow-lg transform transition active:scale-95 disabled:opacity-50 mt-4"
            >
              {loading ? "กำลังเชื่อมต่อ..." : "เข้าร่วมเกม"}
            </button>
          </form>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-800 w-full text-center">
          <p className="text-slate-400 mb-4 text-sm">สำหรับพิธีกร</p>
          <button
            onClick={() => router.push('/host/dashboard')}
            className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-full font-medium transition text-sm flex items-center justify-center gap-2 mx-auto"
          >
            <Trophy size={16} />
            จัดการห้องเกม (Host)
          </button>
        </div>

      </main>
    </div>
  );
}
