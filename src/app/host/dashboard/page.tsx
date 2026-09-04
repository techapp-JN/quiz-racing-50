"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PlusCircle, Settings, Play, Import, ArrowLeft } from "lucide-react";
import { createGame } from "@/lib/services";

export default function HostDashboard() {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleCreateGame = async () => {
        setLoading(true);
        try {
            const room = await createGame([]); // create with dummy questions for Demo
            router.push(`/host/${room.code}`);
        } catch (err: any) {
            alert("Error: " + err.message);
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen p-8 bg-slate-900 text-slate-100">
            <div className="max-w-4xl mx-auto space-y-8">

                <header className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-extrabold italic text-white flex items-center gap-2">
                            QUIZ <span className="text-primary">JUSTNEW</span>
                        </h1>
                        <p className="text-slate-400 mt-2">Host Dashboard</p>
                    </div>
                    <button
                        onClick={() => router.push('/')}
                        className="flex items-center gap-2 text-slate-400 hover:text-white transition"
                    >
                        <ArrowLeft size={20} />
                        กลับหน้าแรก
                    </button>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">

                    <button
                        onClick={handleCreateGame}
                        disabled={loading}
                        className="glass-panel p-8 flex flex-col items-center justify-center gap-4 hover:bg-slate-800/50 transition border border-primary/30 group"
                    >
                        <div className="bg-primary/20 p-4 rounded-full group-hover:scale-110 transition">
                            <PlusCircle size={48} className="text-primary" />
                        </div>
                        <h2 className="text-xl font-bold">สร้างเกมใหม่</h2>
                        <p className="text-slate-400 text-sm text-center">เริ่มเกมใหม่ด้วยชุดคำถามเริ่มต้น</p>
                    </button>

                    <button className="glass-panel p-8 flex flex-col items-center justify-center gap-4 hover:bg-slate-800/50 transition border-slate-700 opacity-50 cursor-not-allowed">
                        <div className="bg-secondary/20 p-4 rounded-full">
                            <Import size={48} className="text-secondary" />
                        </div>
                        <h2 className="text-xl font-bold">นำเข้าคำถาม (CSV)</h2>
                        <p className="text-slate-400 text-sm text-center">เร็วๆนี้ V2</p>
                    </button>

                    <button className="glass-panel p-8 flex flex-col items-center justify-center gap-4 hover:bg-slate-800/50 transition border-slate-700 opacity-50 cursor-not-allowed">
                        <div className="bg-accent/20 p-4 rounded-full">
                            <Settings size={48} className="text-accent" />
                        </div>
                        <h2 className="text-xl font-bold">ตั้งค่าเกม</h2>
                        <p className="text-slate-400 text-sm text-center">เร็วๆนี้ V2</p>
                    </button>
                </div>

                <div className="mt-12 p-6 bg-slate-800/50 rounded-xl border border-slate-700">
                    <h3 className="text-lg font-bold mb-4">คำแนะนำการใช้งาน</h3>
                    <ul className="list-disc list-inside space-y-2 text-slate-300">
                        <li>สร้างเกมใหม่ ผู้เล่นสามารถใช้โทรศัพท์มือถือแสกน QR Code เพื่อเข้าร่วม</li>
                        <li>ควรต่อ Projector หรือ TV เพื่อให้ผู้เล่นเห็นหน้าจอนี้ได้ชัดเจน</li>
                        <li>รองรับผู้เล่นสูงสุด 50 คน</li>
                    </ul>
                </div>

            </div>
        </div>
    );
}
