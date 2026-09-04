"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { PlusCircle, Settings, Play, ArrowLeft, Trash2, Import, Download } from "lucide-react";
import { createGame } from "@/lib/services";

export default function HostDashboard() {
    const [loading, setLoading] = useState(false);
    const [view, setView] = useState<'menu' | 'setup'>('menu');
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [questions, setQuestions] = useState([
        { text: "", options: ["", "", "", ""], correct_answer: "A", time_limit: 15 }
    ]);

    const parseCSVLine = (text: string) => {
        const result = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            if (char === '"' && text[i + 1] === '"') { current += '"'; i++; }
            else if (char === '"') { inQuotes = !inQuotes; }
            else if (char === ',' && !inQuotes) { result.push(current); current = ''; }
            else { current += char; }
        }
        result.push(current);
        return result;
    }

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            // แยกบรรทัดและรองรับทั้ง \r\n และ \n
            const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
            if (lines.length < 2) return alert("ไม่พบข้อมูล หรือมีแค่หัวตาราง");

            const newQuestions = [];
            for (let i = 1; i < lines.length; i++) { // ข้าม headers (บรรทัด 0)
                const row = parseCSVLine(lines[i]);
                if (row.length >= 6) {
                    let ans = row[5].trim().toUpperCase();
                    if (!['A', 'B', 'C', 'D'].includes(ans)) ans = 'A';

                    newQuestions.push({
                        text: row[0] || "",
                        options: [row[1] || "", row[2] || "", row[3] || "", row[4] || ""],
                        correct_answer: ans,
                        time_limit: parseInt(row[6]) || 15
                    });
                }
            }
            if (newQuestions.length > 0) {
                setQuestions(newQuestions);
                setView('setup');
                if (fileInputRef.current) fileInputRef.current.value = ''; // เคลียร์ไฟล์
            } else {
                alert("ไม่สามารถอ่านข้อมูลได้ กรุณาตรวจสอบรูปแบบไฟล์ CSV ให้ตรงตามเทมเพลต");
            }
        };
        reader.readAsText(file);
    };

    const downloadTemplate = () => {
        const headers = "คำถาม,ตัวเลือก A,ตัวเลือก B,ตัวเลือก C,ตัวเลือก D,คำตอบที่ถูก (A/B/C/D),เวลา (วินาที)\n";
        const sampleRow1 = "สีใดคือแม่สี?,แดง,เขียว,ส้ม,ม่วง,A,15\n";
        const sampleRow2 = "ข้อใดคือ Outcome?,รายงานวิจัย,จำนวนผู้เข้าชม,รายได้ที่เพิ่มขึ้น,แผนการตลาด,C,20\n";

        const blob = new Blob(["\ufeff" + headers + sampleRow1 + sampleRow2], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "quiz-template.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleCreateGame = async () => {
        for (let i = 0; i < questions.length; i++) {
            if (!questions[i].text.trim()) return alert(`กรุณากรอกคำถามข้อที่ ${i + 1}`);
            for (let j = 0; j < 4; j++) {
                if (!questions[i].options[j].trim()) return alert(`กรุณากรอกตัวเลือกที่ ${j + 1} ของข้อ ${i + 1}`);
            }
        }

        setLoading(true);
        try {
            const formattedQuestions = questions.map((q) => ({
                text: q.text,
                options: [
                    `A. ${q.options[0]}`,
                    `B. ${q.options[1]}`,
                    `C. ${q.options[2]}`,
                    `D. ${q.options[3]}`
                ],
                correct_answer: q.correct_answer,
                time_limit: Number(q.time_limit)
            }));

            const room = await createGame(formattedQuestions);
            router.push(`/host/${room.code}`);
        } catch (err: any) {
            alert(`Error: ${err.message}`);
            setLoading(false);
        }
    };

    const addQuestion = () => setQuestions([...questions, { text: "", options: ["", "", "", ""], correct_answer: "A", time_limit: 15 }]);

    const removeQuestion = (index: number) => {
        if (questions.length <= 1) return alert("ต้องมีคำถามอย่างน้อย 1 ข้อครับ");
        setQuestions(questions.filter((_, i) => i !== index));
    };

    if (view === 'setup') {
        return (
            <div className="min-h-screen p-4 md:p-8 bg-slate-900 text-slate-100 pb-32">
                <div className="max-w-4xl mx-auto space-y-6">
                    <header className="flex items-center justify-between sticky top-0 bg-slate-900/90 backdrop-blur-md py-4 z-10 border-b border-slate-700">
                        <button onClick={() => setView('menu')} className="flex items-center gap-2 text-slate-400 hover:text-white transition">
                            <ArrowLeft size={20} /> กลับ
                        </button>
                        <h2 className="text-2xl font-bold italic">ตรวจทานคำถาม ({questions.length} ข้อ)</h2>
                        <button
                            onClick={handleCreateGame}
                            disabled={loading}
                            className="bg-primary hover:bg-rose-500 text-white font-bold py-2 px-6 rounded-full flex items-center gap-2 transition disabled:opacity-50"
                        >
                            <Play size={20} className="fill-current" />
                            {loading ? "กำลังสร้าง..." : "เริ่มเกมทันที"}
                        </button>
                    </header>

                    {questions.map((q, qIndex) => (
                        <div key={qIndex} className="glass-panel p-6 rounded-2xl border border-slate-700 relative">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-bold text-primary">ข้อที่ {qIndex + 1}</h3>
                                <button onClick={() => removeQuestion(qIndex)} className="text-red-400 hover:text-red-300 transition bg-red-400/10 p-2 rounded-lg">
                                    <Trash2 size={18} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">คำถาม</label>
                                    <input
                                        type="text"
                                        value={q.text}
                                        onChange={(e) => {
                                            const newQ = [...questions];
                                            newQ[qIndex].text = e.target.value;
                                            setQuestions(newQ);
                                        }}
                                        className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-white focus:border-primary outline-none"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {['A', 'B', 'C', 'D'].map((letter, optIndex) => (
                                        <div key={letter}>
                                            <label className="block text-sm text-slate-400 mb-1">ตัวเลือก {letter}</label>
                                            <input
                                                type="text"
                                                value={q.options[optIndex]}
                                                onChange={(e) => {
                                                    const newQ = [...questions];
                                                    newQ[qIndex].options[optIndex] = e.target.value;
                                                    setQuestions(newQ);
                                                }}
                                                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg p-3 text-white focus:border-primary outline-none"
                                            />
                                        </div>
                                    ))}
                                </div>

                                <div className="grid grid-cols-2 gap-4 mt-4 bg-slate-950/30 p-4 rounded-lg">
                                    <div>
                                        <label className="block text-sm text-amber-400 mb-1 font-bold">★ คำตอบที่ถูกต้อง</label>
                                        <select
                                            value={q.correct_answer}
                                            onChange={(e) => {
                                                const newQ = [...questions];
                                                newQ[qIndex].correct_answer = e.target.value;
                                                setQuestions(newQ);
                                            }}
                                            className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-white focus:border-primary outline-none"
                                        >
                                            <option value="A">ข้อ A</option>
                                            <option value="B">ข้อ B</option>
                                            <option value="C">ข้อ C</option>
                                            <option value="D">ข้อ D</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm text-slate-400 mb-1">เวลา (วินาที)</label>
                                        <input
                                            type="number"
                                            value={q.time_limit}
                                            onChange={(e) => {
                                                const newQ = [...questions];
                                                newQ[qIndex].time_limit = Number(e.target.value);
                                                setQuestions(newQ);
                                            }}
                                            className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-white focus:border-primary outline-none"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}

                    <button
                        onClick={addQuestion}
                        className="w-full py-4 border-2 border-dashed border-slate-600 rounded-2xl text-slate-400 hover:text-white hover:border-slate-400 hover:bg-slate-800/50 transition flex items-center justify-center gap-2"
                    >
                        <PlusCircle size={24} /> เพิ่มคำถามข้อที่ {questions.length + 1}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-8 bg-slate-900 text-slate-100 flex flex-col justify-center">
            <input
                type="file"
                accept=".csv"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
            />

            <div className="max-w-4xl mx-auto space-y-8 w-full">
                <header className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-extrabold italic text-white flex items-center gap-2">
                            QUIZ <span className="text-primary">JUSTNEW</span>
                        </h1>
                        <p className="text-slate-400 mt-2">Host Dashboard</p>
                    </div>
                    <button onClick={() => router.push('/')} className="flex items-center gap-2 text-slate-400 hover:text-white transition">
                        <ArrowLeft size={20} /> กลับหน้าแรก
                    </button>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
                    <button
                        onClick={() => setView('setup')}
                        className="glass-panel p-8 flex flex-col items-center justify-center gap-4 hover:bg-slate-800/50 transition border border-primary/30 group"
                    >
                        <div className="bg-primary/20 p-4 rounded-full group-hover:scale-110 transition">
                            <PlusCircle size={48} className="text-primary" />
                        </div>
                        <h2 className="text-xl font-bold">สร้างเกม & คำถามใหม่</h2>
                        <p className="text-slate-400 text-sm text-center">พิมพ์โจทย์ ตัวเลือก และตั้งเวลาเองได้เลย</p>
                    </button>

                    <div className="glass-panel p-8 flex flex-col items-center justify-center gap-4 hover:bg-slate-800/50 transition border border-secondary/30 group cursor-pointer"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <div className="bg-secondary/20 p-4 rounded-full group-hover:scale-110 transition">
                            <Import size={48} className="text-secondary" />
                        </div>
                        <h2 className="text-xl font-bold">นำเข้า CSV</h2>
                        <p className="text-slate-400 text-sm text-center mb-2">โหลดไฟล์คำถามหลายข้อพร้อมกัน</p>
                        <button
                            onClick={(e) => { e.stopPropagation(); downloadTemplate(); }}
                            className="text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1 rounded-full flex items-center gap-1 border border-slate-600"
                        >
                            <Download size={14} /> โหลดไฟล์ต้นแบบ
                        </button>
                    </div>

                    <button className="glass-panel p-8 flex flex-col items-center justify-center gap-4 border-slate-700 opacity-50 cursor-not-allowed hidden lg:flex">
                        <div className="bg-accent/20 p-4 rounded-full">
                            <Settings size={48} className="text-accent" />
                        </div>
                        <h2 className="text-xl font-bold">ตั้งค่าพิเศษ</h2>
                        <p className="text-slate-400 text-sm text-center">เร็วๆนี้ (Phase 2.5)</p>
                    </button>
                </div>
            </div>
        </div>
    );
}
