"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { Zap, CheckCircle, XCircle } from "lucide-react";

const AVATARS = ['🚗', '🏎️', '🚕', '🚙', '🚓', '🚌', '🚑', '🚀', '🛸', '🏍️', '🐼', '🦊'];

export default function PlayerJoin() {
    const { roomCode } = useParams() as { roomCode: string };
    const searchParams = useSearchParams();
    const nameParam = searchParams.get('name') || '';
    const router = useRouter();

    const [name, setName] = useState(nameParam);
    const [avatar, setAvatar] = useState(AVATARS[0]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [joined, setJoined] = useState(false);

    // Game state
    const [playerId, setPlayerId] = useState<string | null>(null);
    const [status, setStatus] = useState<'WAITING' | 'PLAYING' | 'FINISHED'>('WAITING');
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [questionData, setQuestionData] = useState<any>(null);
    const [hasAnswered, setHasAnswered] = useState(false);
    const [score, setScore] = useState(0);
    const [combo, setCombo] = useState(0);
    const [timeLeft, setTimeLeft] = useState<number | null>(null);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (status === 'PLAYING' && timeLeft !== null && timeLeft > 0) {
            timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
        }
        return () => clearTimeout(timer);
    }, [timeLeft, status]);

    useEffect(() => {
        // If not joined conceptually but Supabase isn't configured, we immediately mock join
        if (!isSupabaseConfigured() && !joined) {
            // Allow them to pick avatar first
            return;
        }

        if (!joined || !playerId) return;

        if (!isSupabaseConfigured()) {
            // Mock realtime for dev
            const interval = setInterval(() => {
                setScore(s => s + 10);
            }, 5000);
            return () => clearInterval(interval);
        }

        const fetchCurrentState = async () => {
            const { data: room } = await supabase.from('rooms').select('*').eq('code', roomCode).single();
            if (room) {
                setStatus(room.status);
                setCurrentQuestionIndex(room.current_question_index);
                fetchQuestion(room.id, room.current_question_index);
            }
            const { data: p } = await supabase.from('players').select('score, combo').eq('id', playerId).single();
            if (p) {
                setScore(p.score);
                setCombo(p.combo);
            }
        };

        fetchCurrentState();

        const roomChannel = supabase.channel(`player_room:${roomCode}`)
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `code=eq.${roomCode}` }, (payload) => {
                setStatus(payload.new.status);
                if (payload.new.current_question_index !== currentQuestionIndex) {
                    setCurrentQuestionIndex(payload.new.current_question_index);
                    setHasAnswered(false); // reset answer state for new question
                    fetchQuestion(payload.new.id, payload.new.current_question_index);
                }
            })
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'players', filter: `id=eq.${playerId}` }, (payload) => {
                setScore(payload.new.score);
                setCombo(payload.new.combo);
            })
            .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'players', filter: `id=eq.${playerId}` }, () => {
                setJoined(false);
                setPlayerId(null);
                setScore(0);
                setCombo(0);
                setError("เกมในรอบนี้ถูกล้างข้อมูล กรุณาเข้าร่วมใหม่เพื่อเล่นรอบต่อไป");
            })
            .subscribe();

        return () => {
            supabase.removeChannel(roomChannel);
        };
    }, [joined, playerId, roomCode, currentQuestionIndex]);

    const fetchQuestion = async (roomId: string, index: number) => {
        const { data: q } = await supabase.from('questions').select('*').eq('room_id', roomId).eq('sort_order', index).single();
        if (q) {
            setQuestionData(q);
            setTimeLeft(q.time_limit || 15);
        }
    };

    const handleJoin = async () => {
        if (!name) return setError("กรุณากรอกชื่อ");
        setLoading(true);
        setError("");

        const sessionId = localStorage.getItem('quiz_session_id') || `sess_${Date.now()}`;
        localStorage.setItem('quiz_session_id', sessionId);

        if (!isSupabaseConfigured()) {
            setPlayerId("mock_player_1");
            setJoined(true);
            setLoading(false);
            setStatus('WAITING');
            return;
        }

        try {
            const { joinGame } = await import('@/lib/services');
            const { playerId } = await joinGame(roomCode, name, avatar, sessionId);
            setPlayerId(playerId);
            setJoined(true);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const submitAnswer = async (selectedOptionStr: string) => {
        if (hasAnswered) return;
        setHasAnswered(true);

        // basic calculation
        const optionPrefix = selectedOptionStr.charAt(0); // A, B, C, D

        if (!isSupabaseConfigured()) {
            const isCorrect = Math.random() > 0.5;
            setScore(s => s + (isCorrect ? 150 : 0));
            return;
        }

        const isCorrect = optionPrefix === questionData.correct_answer;
        const scoreAwarded = isCorrect ? 100 + Math.floor(Math.random() * 50) : 0; // mocked speed bonus for now

        try {
            const { submitAnswer: subAns } = await import('@/lib/services');
            await subAns(playerId!, questionData.room_id, questionData.id, optionPrefix, isCorrect, 1.5, scoreAwarded);
        } catch (err) {
            console.error("Failed to submit:", err);
            setHasAnswered(false); // let them retry
        }
    };

    if (!joined) {
        return (
            <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
                <div className="glass-panel p-6 w-full max-w-sm flex flex-col items-center space-y-6">
                    <h1 className="text-3xl font-extrabold italic text-white text-center">QUIZ JUSTNEW</h1>

                    {error && <div className="text-red-400 font-bold bg-red-900/40 p-2 rounded w-full text-center">{error}</div>}

                    <div className="w-full space-y-2">
                        <label className="text-slate-300 font-bold text-sm">ชื่อของคุณ</label>
                        <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="w-full bg-slate-800 p-4 rounded-xl text-white outline-none border border-slate-600 focus:border-primary text-xl"
                            maxLength={15}
                        />
                    </div>

                    <div className="w-full">
                        <label className="text-slate-300 font-bold text-sm block mb-2">เลือกตัวละคร</label>
                        <div className="grid grid-cols-4 gap-2">
                            {AVATARS.map(a => (
                                <button
                                    key={a}
                                    onClick={() => setAvatar(a)}
                                    className={`text-3xl p-3 border-2 rounded-xl transition ${avatar === a ? 'bg-primary/20 border-primary' : 'border-transparent bg-slate-800'}`}
                                >
                                    {a}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={handleJoin}
                        disabled={loading}
                        className="w-full bg-primary hover:bg-rose-600 text-white p-4 rounded-xl font-bold text-xl transition active:scale-95 shadow-lg"
                    >
                        {loading ? "กำลังโหลด..." : "เข้าร่วมห้อง"}
                    </button>
                </div>
            </div>
        );
    }

    if (status === 'WAITING') {
        return (
            <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center space-y-6">
                <div className="text-6xl animate-bounce">{avatar}</div>
                <h2 className="text-3xl font-bold">{name}</h2>
                <div className="glass-panel p-4 rounded-xl flex items-center gap-2">
                    <Zap className="text-accent" />
                    <span className="text-xl font-mono text-white">รอพิธีกรเริ่มเกม...</span>
                </div>
                <p className="text-slate-400 mt-8 text-sm">มองไปที่หน้าจอหลัก!</p>
            </div>
        );
    }

    if (status === 'FINISHED') {
        return (
            <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center space-y-4">
                <h1 className="text-4xl font-extrabold text-accent">จบเกมแล้ว!</h1>
                <div className="text-7xl">{avatar}</div>
                <h2 className="text-2xl">{name}</h2>

                <div className="glass-panel p-6 w-full max-w-sm mt-8 border-t-4 border-t-primary">
                    <p className="text-slate-400 text-sm uppercase tracking-widest">คะแนนของคุณ</p>
                    <p className="text-5xl font-mono text-white my-2">{score}</p>
                    <div className="text-sm font-bold text-accent">Combo สูงสุด: 🔥 {combo}</div>
                </div>

                <button
                    onClick={() => router.push('/')}
                    className="mt-8 px-8 py-4 bg-slate-800 border border-slate-700 rounded-xl font-bold"
                >
                    กลับหน้าแรก
                </button>
            </div>
        );
    }

    // PLAYING

    let options: string[] = [];
    if (questionData && questionData.options) {
        try {
            options = typeof questionData.options === 'string' ? JSON.parse(questionData.options) : questionData.options;
        } catch {
            options = [questionData.options];
        }
    }

    return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col p-4">
            {/* HUD */}
            <div className="flex justify-between items-center mb-6 bg-slate-800 p-4 rounded-2xl border border-slate-700">
                <div className="flex items-center gap-2 font-bold">
                    <span className="text-2xl">{avatar}</span>
                    <span className="truncate max-w-[80px]">{name}</span>
                </div>
                <div className="text-xl font-bold font-mono text-primary animate-pulse">
                    {timeLeft !== null ? `${timeLeft}s` : ''}
                </div>
                <div className="text-right">
                    <div className="text-accent text-sm font-bold font-mono">SCORE: {score}</div>
                    {combo > 1 && <div className="text-rose-400 text-xs font-bold animate-pulse">🔥 Combo x{combo}</div>}
                </div>
            </div>

            {hasAnswered || timeLeft === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center space-y-6">
                    {hasAnswered ? (
                        <>
                            <CheckCircle size={80} className="text-success animate-bounce-slow" />
                            <h2 className="text-3xl font-bold">ส่งคำตอบแล้ว!</h2>
                        </>
                    ) : (
                        <>
                            <XCircle size={80} className="text-red-500 animate-bounce-slow" />
                            <h2 className="text-3xl font-bold">หมดเวลา!</h2>
                        </>
                    )}
                    <p className="text-slate-400">รอหมดเวลา และดูผลที่หน้าจอหลัก</p>
                </div>
            ) : (
                <div className="flex-1 flex flex-col space-y-4">
                    {questionData && (
                        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-md mb-2 text-center text-lg font-bold">
                            {questionData.text}
                        </div>
                    )}
                    <div className="text-center font-bold text-slate-400 mb-2">เลือกคำตอบ</div>
                    {options.length > 0 ? options.map((optStr, idx) => {
                        const colors = ['bg-red-500', 'bg-blue-500', 'bg-yellow-500', 'bg-green-500'];
                        return (
                            <button
                                key={idx}
                                onClick={() => submitAnswer(optStr)}
                                className={`flex-1 ${colors[idx % 4]} rounded-2xl flex items-center justify-start px-6 border-b-8 border-black/20 active:border-b-0 active:translate-y-2 transition-all py-4 gap-4`}
                            >
                                <span className="text-3xl font-extrabold text-white drop-shadow-md">{optStr.charAt(0)}</span>
                                <span className="text-xl font-bold text-white drop-shadow-md text-left leading-tight break-words border-l-2 border-white/20 pl-4">
                                    {optStr.substring(2).trim()}
                                </span>
                            </button>
                        );
                    }) : (
                        ['A', 'B', 'C', 'D'].map((opt, idx) => {
                            const colors = ['bg-red-500', 'bg-blue-500', 'bg-yellow-500', 'bg-green-500'];
                            return (
                                <button
                                    key={opt}
                                    onClick={() => submitAnswer(`${opt}. `)}
                                    className={`flex-1 ${colors[idx % 4]} rounded-2xl flex items-center justify-center border-b-8 border-black/20 active:border-b-0 active:translate-y-2 transition-all`}
                                >
                                    <span className="text-6xl font-extrabold text-white drop-shadow-md">{opt}</span>
                                </button>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
}
