"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { Users, Play, CheckCircle, Trash2 } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import confetti from "canvas-confetti";

export default function HostRoom() {
    const { roomCode } = useParams() as { roomCode: string };
    const router = useRouter();

    const [status, setStatus] = useState<'WAITING' | 'PLAYING' | 'FINISHED'>('WAITING');
    const [players, setPlayers] = useState<any[]>([]);
    const [questions, setQuestions] = useState<any[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [timeLeft, setTimeLeft] = useState(0);
    const [showResult, setShowResult] = useState(false);
    const [answersCount, setAnswersCount] = useState(0);

    // Provide realistic demo mode for players when not using DB
    useEffect(() => {
        if (!isSupabaseConfigured()) {
            setQuestions([
                { id: 'q1', text: 'ข้อใดเป็น Outcome?', options: JSON.stringify(['A. จำนวนผู้เข้าร่วม', 'B. รายงานที่จัดทำ', 'C. ผู้เข้าร่วมมีความรู้เพิ่มขึ้น', 'D. จำนวนเอกสาร']), correct_answer: 'C', time_limit: 10 },
                { id: 'q2', text: 'สีใดไม่ใช่แม่สี?', options: JSON.stringify(['A. แดง', 'B. เหลือง', 'C. น้ำเงิน', 'D. เขียว']), correct_answer: 'D', time_limit: 10 }
            ]);
            // mock players coming in
            const p = [
                { id: '1', name: 'Somchai', avatar: '🚗', score: 0 },
                { id: '2', name: 'Anan', avatar: '🚕', score: 0 },
                { id: '3', name: 'Nida', avatar: '🏎️', score: 0 }
            ];
            setPlayers(p);
            return;
        }

        // Clear component state before fetching new data in case of client-side navigation
        setPlayers([]);
        setQuestions([]);
        setAnswersCount(0);
        setTimeLeft(0);
        setShowResult(false);

        const fetchInitialData = async () => {
            const { data: room } = await supabase.from('rooms').select('*').eq('code', roomCode).single();
            if (room) {
                setStatus(room.status);
                setCurrentQuestionIndex(room.current_question_index);

                const { data: qData } = await supabase.from('questions').select('*').eq('room_id', room.id).order('sort_order', { ascending: true });
                if (qData) setQuestions(qData);

                const { data: pData } = await supabase.from('players').select('*').eq('room_id', room.id);
                if (pData) setPlayers(pData);
            }
        };

        fetchInitialData();

        const roomChannel = supabase.channel(`room:${roomCode}`)
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `code=eq.${roomCode}` }, (payload) => {
                setStatus(payload.new.status);
                setCurrentQuestionIndex(payload.new.current_question_index);
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'players' }, (payload) => {
                if (payload.eventType === 'INSERT') {
                    setPlayers((prev) => [...prev, payload.new]);
                } else if (payload.eventType === 'UPDATE') {
                    setPlayers((prev) => prev.map(p => p.id === payload.new.id ? payload.new : p));
                }
            })
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'answers' }, () => {
                setAnswersCount((prev) => prev + 1);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(roomChannel);
        };
    }, [roomCode]);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (status === 'PLAYING' && !showResult && timeLeft > 0) {
            timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
        } else if (status === 'PLAYING' && !showResult && timeLeft === 0 && questions.length > 0) {
            handleTimeUp();
        }
        return () => clearTimeout(timer);
    }, [timeLeft, status, showResult]);

    const startGame = async () => {
        if (questions.length === 0) return;
        setStatus('PLAYING');
        setTimeLeft(questions[0].time_limit);
        setShowResult(false);
        setAnswersCount(0);
        if (isSupabaseConfigured()) {
            const { data: room } = await supabase.from('rooms').select('id').eq('code', roomCode).single();
            if (room) {
                await supabase.from('rooms').update({ status: 'PLAYING', current_question_index: 0 }).eq('id', room.id);
            }
        }
    };

    const handleTimeUp = () => {
        setShowResult(true);
    };

    const nextQuestion = async () => {
        if (currentQuestionIndex + 1 >= questions.length) {
            setStatus('FINISHED');
            if (isSupabaseConfigured()) {
                const { data: room } = await supabase.from('rooms').select('id').eq('code', roomCode).single();
                if (room) await supabase.from('rooms').update({ status: 'FINISHED' }).eq('id', room.id);
            }
            confetti({ particleCount: 150, spread: 100, origin: { y: 0.6 } });
            return;
        }

        const nextIdx = currentQuestionIndex + 1;
        setCurrentQuestionIndex(nextIdx);
        setTimeLeft(questions[nextIdx].time_limit);
        setShowResult(false);
        setAnswersCount(0);
        if (isSupabaseConfigured()) {
            const { data: room } = await supabase.from('rooms').select('id').eq('code', roomCode).single();
            if (room) await supabase.from('rooms').update({ current_question_index: nextIdx }).eq('id', room.id);
        }
    };

    const resetRound = async () => {
        if (!isSupabaseConfigured() || !confirm("ต้องการล้างข้อมูลผู้เล่นทั้งหมดและเริ่มรอบใหม่ในห้องเดิมหรือไม่?")) return;

        try {
            const { data: room } = await supabase.from('rooms').select('id').eq('code', roomCode).single();
            if (room) {
                // Using UPDATE to detach instead of DELETE to bypass missing DELETE policy
                await supabase.from('answers').update({ room_id: null }).eq('room_id', room.id);
                await supabase.from('players').update({ room_id: null }).eq('room_id', room.id);
                await supabase.from('rooms').update({ status: 'WAITING', current_question_index: 0 }).eq('id', room.id);
                setPlayers([]);
                setStatus('WAITING');
                setCurrentQuestionIndex(0);
            }
        } catch (error) {
            console.error("Reset failed", error);
        }
    };

    const currentQ = questions[currentQuestionIndex];

    // Sorted players for Leaderboard & Racing
    const sortedPlayers = [...players].sort((a, b) => (b.score || 0) - (a.score || 0));
    const top10 = sortedPlayers.slice(0, 10);

    const getJoinUrl = () => {
        if (typeof window !== 'undefined') {
            return `${window.location.origin}/game/${roomCode}`;
        }
        return `https://app.com/game/${roomCode}`;
    };

    // UI rendering based on status
    if (status === 'WAITING') {
        return (
            <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-8 relative">
                <h1 className="text-6xl font-extrabold italic mb-12 text-center shadow-xl">
                    QUIZ <span className="text-primary">JUSTNEW</span>
                </h1>

                <div className="flex gap-16 items-center">
                    <div className="glass-panel p-8 text-center flex flex-col items-center">
                        <p className="text-slate-400 mb-2 uppercase tracking-widest text-sm">สแกนเพื่อเข้าร่วม</p>
                        <div className="bg-white p-4 rounded-xl mb-6">
                            <QRCodeSVG value={getJoinUrl()} size={250} />
                        </div>
                        <p className="text-slate-400 uppercase tracking-widest text-sm">หรือเข้าทางเว็บไซต์</p>
                        <p className="text-3xl font-bold mt-2 tracking-widest text-primary">{roomCode}</p>
                    </div>

                    <div className="w-[500px] h-[500px] glass-panel p-6 flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold flex items-center gap-2">
                                ผู้เล่น <Users className="text-secondary" />
                            </h2>
                            <div className="flex gap-4 items-center">
                                <button onClick={resetRound} className="text-slate-500 hover:text-red-400 transition" title="ล้างผู้เล่นทั้งหมด">
                                    <Trash2 size={24} />
                                </button>
                                <span className="text-2xl font-bold text-secondary">{players.length} คน</span>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto grid grid-cols-2 gap-4 content-start">
                            {players.map((p, i) => (
                                <div key={i} className="bg-slate-800 p-3 rounded-lg flex items-center gap-3">
                                    <span className="text-2xl">{p.avatar}</span>
                                    <span className="font-bold truncate" title={p.name}>{p.name}</span>
                                </div>
                            ))}
                            {players.length === 0 && (
                                <div className="col-span-2 text-center text-slate-500 mt-10">
                                    รอผู้เล่นเข้าร่วม...
                                </div>
                            )}
                        </div>

                        <button
                            onClick={startGame}
                            className="mt-6 w-full py-4 bg-gradient-to-r from-success to-emerald-600 hover:from-emerald-500 hover:to-success text-white font-bold text-2xl rounded-xl shadow-[0_0_20px_rgba(82,196,26,0.5)] transition flex items-center justify-center gap-3"
                        >
                            <Play fill="white" />
                            เริ่มเกม
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (status === 'PLAYING') {
        if (!currentQ) return <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">Loading...</div>;

        let options = [];
        try {
            options = typeof currentQ.options === 'string' ? JSON.parse(currentQ.options) : currentQ.options;
        } catch {
            options = [currentQ.options];
        }

        return (
            <div className="min-h-screen bg-slate-900 text-white flex flex-col p-6">
                {/* Header */}
                <div className="flex justify-between items-center bg-slate-800 p-4 rounded-xl shadow-lg border border-slate-700">
                    <div className="text-3xl font-extrabold italic text-slate-300">
                        Q{currentQuestionIndex + 1} <span className="text-slate-500 text-lg">/ {questions.length}</span>
                    </div>

                    {!showResult ? (
                        <div className="text-5xl font-bold text-primary flex items-center gap-2">
                            <span className="animate-pulse">{timeLeft}</span>
                            <span className="text-2xl text-slate-400">sec</span>
                        </div>
                    ) : (
                        <div className="text-4xl font-bold text-accent">TIME&apos;S UP!</div>
                    )}

                    <div className="text-2xl font-bold text-secondary flex items-center gap-2">
                        <Users /> {answersCount} / {players.length}
                    </div>
                </div>

                {/* Question Area */}
                <div className="flex-1 mt-6 flex flex-col gap-6">
                    <div className="w-full bg-slate-800 border-2 border-slate-600 rounded-2xl p-10 flex items-center justify-center text-center shadow-xl min-h-[200px]">
                        <h1 className="text-4xl md:text-5xl font-bold leading-tight">{currentQ.text}</h1>
                    </div>

                    {!showResult ? (
                        <div className="grid grid-cols-2 gap-4 flex-1">
                            {options.map((opt: string, idx: number) => {
                                const colors = ['bg-red-500', 'bg-blue-500', 'bg-yellow-500', 'bg-green-500'];
                                return (
                                    <div key={idx} className={`${colors[idx % 4]} rounded-2xl p-6 flex items-center justify-center shadow-lg border-b-8 border-black/20 text-3xl font-bold`}>
                                        {opt}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col gap-6">
                            {/* Results & Racing View */}
                            <div className="bg-slate-800 rounded-2xl p-8 flex-1 flex flex-col shadow-xl border border-slate-700">
                                <h2 className="text-2xl font-bold mb-4 text-center text-green-400 flex justify-center items-center gap-2">
                                    <CheckCircle /> เฉลย: {currentQ.correct_answer}
                                </h2>

                                {/* Racing Track (Top 10) */}
                                <div className="flex-1 flex flex-col gap-3 justify-center">
                                    {top10.map((p, idx) => (
                                        <div key={p.id} className="flex items-center gap-4">
                                            <div className="w-8 text-right font-bold text-slate-400">#{idx + 1}</div>
                                            <div className="flex-1 bg-slate-900 rounded-full h-12 relative overflow-hidden flex items-center px-2 border border-slate-700 racing-track">
                                                {/* Simple progress bar calculation. In a real game, distance depends on score. */}
                                                <div
                                                    className="absolute left-2 transition-all duration-1000 ease-out z-10 text-3xl flex items-center gap-2 drop-shadow-md"
                                                    style={{ transform: `translateX(${Math.min(90, ((p.score || 0) / (questions.length * 150)) * 100)}%)` }}
                                                >
                                                    {p.avatar} <span className="text-sm font-bold bg-black/50 px-2 rounded">{p.name}</span>
                                                </div>
                                            </div>
                                            <div className="w-20 text-right font-bold text-secondary text-xl font-mono">{p.score}</div>
                                        </div>
                                    ))}
                                </div>

                                <button
                                    onClick={nextQuestion}
                                    className="mt-6 mx-auto px-12 py-4 bg-primary hover:bg-rose-600 text-white font-bold text-2xl rounded-xl shadow-lg transition"
                                >
                                    ถัดไป (Next)
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // FINISHED
    return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-8 text-center">
            <h1 className="text-6xl font-extrabold italic mb-4 text-accent drop-shadow-lg">🏆 GAME OVER 🏆</h1>
            <h2 className="text-4xl text-primary font-bold mb-12">CHAMPION</h2>

            {sortedPlayers[0] && (
                <div className="glass-panel p-12 flex flex-col items-center transform scale-125 mb-12">
                    <div className="text-8xl mb-4 animate-bounce">{sortedPlayers[0].avatar}</div>
                    <div className="text-5xl font-bold text-white mb-2">{sortedPlayers[0].name}</div>
                    <div className="text-3xl font-mono text-secondary">{sortedPlayers[0].score} pts</div>
                </div>
            )}

            <div className="w-full max-w-4xl mt-12 bg-slate-800 rounded-xl p-8 border border-slate-700 shadow-xl">
                <h3 className="text-2xl font-bold text-slate-300 mb-6 text-left">รายชื่อผู้เล่นทั้งหมด</h3>
                <div className="max-h-[300px] overflow-y-auto pr-4 custom-scrollbar">
                    {sortedPlayers.map((p, i) => (
                        <div key={p.id} className="flex justify-between items-center bg-slate-900/50 p-4 rounded-lg mb-3">
                            <div className="flex items-center gap-4">
                                <span className={`font-bold ${i < 3 ? 'text-xl text-primary' : 'text-slate-400'}`}>#{i + 1}</span>
                                <span className="text-3xl">{p.avatar}</span>
                                <span className="font-bold text-xl">{p.name}</span>
                            </div>
                            <span className="font-mono text-xl text-secondary">{p.score} pts</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="mt-12 flex gap-4">
                <button
                    onClick={resetRound}
                    className="flex items-center gap-2 px-8 py-3 bg-red-900/40 hover:bg-red-800/60 border border-red-500/50 focus:ring-2 focus:ring-red-500 rounded-lg text-red-200 font-bold transition"
                >
                    <Trash2 size={20} />
                    ล้างข้อมูลเพื่อเริ่มรอบใหม่
                </button>
                <button
                    onClick={() => router.push('/host/dashboard')}
                    className="px-8 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg text-white font-bold transition"
                >
                    กลับไป Dashboard
                </button>
            </div>
        </div>
    );
}
