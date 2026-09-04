"use client";

import { useState, useEffect } from "react";
import { Lock, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function HostLayout({ children }: { children: React.ReactNode }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const router = useRouter();

    useEffect(() => {
        // เช็คว่าเคยล็อกอินใน session นี้แล้วหรือยัง
        if (sessionStorage.getItem("host_auth") === "true") {
            setIsAuthenticated(true);
        }
    }, []);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === "12345678A") {
            setIsAuthenticated(true);
            sessionStorage.setItem("host_auth", "true");
        } else {
            setError("รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่");
        }
    };

    // ถ้าล็อกอินแล้วให้เข้าไปใช้หน้า Host ได้ตามปกติ
    if (isAuthenticated) {
        return <>{children}</>;
    }

    // ถ้ายังไม่ล็อกอิน ให้แสดงหน้าจอจอดักรหัสผ่าน
    return (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 relative text-white">
            <button
                onClick={() => router.push('/')}
                className="absolute top-8 left-8 flex items-center gap-2 text-slate-400 hover:text-white transition"
            >
                <ArrowLeft size={20} />
                กลับหน้าแรก
            </button>

            <div className="glass-panel p-8 max-w-sm w-full space-y-6 text-center shadow-2xl border border-slate-700 rounded-2xl">
                <div className="bg-primary/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 border border-primary/30">
                    <Lock size={40} className="text-primary" />
                </div>

                <div>
                    <h2 className="text-2xl font-bold">สำหรับพิธีกร (Host)</h2>
                    <p className="text-slate-400 text-sm mt-2">กรุณากรอกรหัสผ่านเพื่อจัดการห้องเกม</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                    {error && (
                        <div className="text-red-400 font-bold bg-red-900/40 border border-red-500/50 p-2 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="•••••••••"
                        className="w-full bg-slate-800 border border-slate-600 rounded-xl p-4 text-white focus:border-primary outline-none text-center tracking-[0.3em] text-xl"
                    />

                    <button
                        type="submit"
                        className="w-full bg-gradient-to-r from-primary to-rose-600 hover:from-rose-600 hover:to-primary text-white font-bold text-lg p-4 rounded-xl shadow-lg transform transition active:scale-95"
                    >
                        เข้าสู่ระบบ
                    </button>
                </form>
            </div>
        </div>
    );
}
