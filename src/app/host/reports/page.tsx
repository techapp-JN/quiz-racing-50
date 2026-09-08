"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Trophy, Calendar, Users, HelpCircle } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export default function ReportsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [reports, setReports] = useState<any[]>([]);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchReports = async () => {
            if (!isSupabaseConfigured()) {
                setError("ไม่สามารถดึงข้อมูลได้เนื่องจากระบบฐานข้อมูล (Supabase) ยังไม่ได้ตั้งค่า");
                setLoading(false);
                return;
            }

            try {
                // Fetch the latest 3 rooms
                const { data: rooms, error: roomError } = await supabase
                    .from("rooms")
                    .select("*")
                    .order("created_at", { ascending: false })
                    .limit(3);

                if (roomError) throw roomError;
                if (!rooms || rooms.length === 0) {
                    setReports([]);
                    setLoading(false);
                    return;
                }

                const roomIds = rooms.map(r => r.id);

                // Fetch players for these rooms (ordered by score directly from DB if possible, but we'll sort in JS to be sure)
                const { data: players, error: playerError } = await supabase
                    .from("players")
                    .select("*")
                    .in("room_id", roomIds);
                if (playerError) throw playerError;

                // Fetch questions for these rooms
                const { data: questions, error: questionError } = await supabase
                    .from("questions")
                    .select("*")
                    .in("room_id", roomIds)
                    .order("sort_order", { ascending: true });
                if (questionError) throw questionError;

                // Group data by room
                const formattedReports = rooms.map(room => {
                    const roomPlayers = (players || [])
                        .filter(p => p.room_id === room.id)
                        .sort((a, b) => (b.score || 0) - (a.score || 0));

                    const roomQuestions = (questions || [])
                        .filter(q => q.room_id === room.id);

                    return {
                        ...room,
                        players: roomPlayers,
                        questions: roomQuestions
                    };
                });

                setReports(formattedReports);
            } catch (err: any) {
                console.error("Error fetching reports", err);
                setError(err.message || "เกิดข้อผิดพลาดในการดึงข้อมูล");
            } finally {
                setLoading(false);
            }
        };

        fetchReports();
    }, []);

    return (
        <div className="min-h-screen bg-slate-900 text-white p-6 relative">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.push("/host/dashboard")}
                        className="p-3 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition"
                    >
                        <ArrowLeft />
                    </button>
                    <h1 className="text-4xl font-extrabold italic text-transparent bg-clip-text bg-gradient-to-r from-primary to-rose-400">
                        รายงานการเล่น (3 รอบล่าสุด)
                    </h1>
                </div>

                {loading ? (
                    <div className="text-center text-slate-400 py-20 text-xl animate-pulse">กำลังโหลดข้อมูล...</div>
                ) : error ? (
                    <div className="bg-red-900/40 border border-red-500 p-6 rounded-xl text-red-200 text-center font-bold">
                        {error}
                    </div>
                ) : reports.length === 0 ? (
                    <div className="bg-slate-800 border border-slate-700 p-12 rounded-xl text-slate-400 text-center text-xl">
                        ยังไม่มีประวัติการเล่นในระบบ
                    </div>
                ) : (
                    <div className="space-y-12">
                        {reports.map((report, index) => (
                            <div key={report.id} className="bg-slate-800 rounded-2xl p-8 shadow-xl border border-slate-700">

                                {/* Room Meta */}
                                <div className="flex flex-wrap items-center justify-between mb-8 pb-6 border-b border-slate-700 gap-4">
                                    <div>
                                        <h2 className="text-3xl font-bold flex items-center gap-3 text-white">
                                            รอบที่ {index + 1}
                                            <span className="text-primary tracking-widest bg-primary/10 px-4 py-1 rounded-full text-xl font-mono border border-primary/30">
                                                {report.code}
                                            </span>
                                        </h2>
                                        <div className="flex items-center gap-6 mt-4 text-slate-400 text-sm">
                                            <div className="flex items-center gap-2">
                                                <Calendar size={16} />
                                                {new Date(report.created_at).toLocaleString("th-TH")}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Users size={16} />
                                                ผู้เล่นทั้งหมด {report.players.length} คน
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <HelpCircle size={16} />
                                                คำถาม {report.questions.length} ข้อ
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-slate-900/50 p-4 rounded-xl text-center border border-slate-700 w-48">
                                        <div className="text-slate-400 text-sm mb-1 uppercase tracking-wider">สถานะ</div>
                                        <div className={`font-bold text-xl ${report.status === 'FINISHED' ? 'text-success' : 'text-yellow-400'}`}>
                                            {report.status}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    {/* Leaderboard */}
                                    <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-700">
                                        <h3 className="text-xl font-bold text-secondary mb-4 flex items-center gap-2">
                                            <Trophy size={20} />
                                            ตารางคะแนนผู้เล่น
                                        </h3>
                                        <div className="max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                            {report.players.length > 0 ? report.players.map((p: any, i: number) => (
                                                <div key={p.id} className="flex justify-between items-center bg-slate-800 p-3 rounded-lg mb-2">
                                                    <div className="flex items-center gap-3">
                                                        <span className={`font-bold w-6 text-center ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-slate-300' : i === 2 ? 'text-amber-600' : 'text-slate-500'}`}>
                                                            #{i + 1}
                                                        </span>
                                                        <span className="text-2xl">{p.avatar}</span>
                                                        <span className="font-bold truncate max-w-[120px]">{p.name}</span>
                                                    </div>
                                                    <span className="font-mono text-secondary font-bold">{p.score} pts</span>
                                                </div>
                                            )) : (
                                                <div className="text-slate-500 text-center py-4">ไม่มีผู้เล่นในรอบนี้</div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Questions */}
                                    <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-700">
                                        <h3 className="text-xl font-bold text-slate-300 mb-4 flex items-center gap-2">
                                            <HelpCircle size={20} />
                                            ชุดคำถามในรอบนี้
                                        </h3>
                                        <div className="max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                            {report.questions.length > 0 ? report.questions.map((q: any, i: number) => (
                                                <div key={q.id} className="bg-slate-800 p-4 rounded-lg mb-3">
                                                    <div className="font-bold text-slate-200 mb-2">ข้อ {i + 1}: {q.text}</div>
                                                    <div className="text-sm font-semibold text-green-400 mt-2 px-3 py-1 bg-green-500/10 rounded-md inline-block">
                                                        คำตอบ: {q.correct_answer}
                                                    </div>
                                                </div>
                                            )) : (
                                                <div className="text-slate-500 text-center py-4">ไม่มีคำถามในรอบนี้</div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
