import { supabase, isSupabaseConfigured } from './supabase';

let mockRoomCode = "A7K92";

export const generateRoomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 5; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
};

// Fallback memory state for local dev without DB setup
const mockRooms: Record<string, any> = {};
const mockPlayers: Record<string, any[]> = {};
const mockQuestions: Record<string, any[]> = {};

export const createGame = async (questions: any[]) => {
    if (!isSupabaseConfigured()) {
        console.warn("Using mock createGame! Supabase not configured.");
        const code = generateRoomCode();
        mockRoomCode = code;
        mockRooms[code] = { id: code, code, status: 'WAITING', current_question_index: 0 };
        mockPlayers[code] = [];
        mockQuestions[code] = [
            { id: 'q1', text: 'ข้อใดเป็น Outcome?', options: JSON.stringify(['A. จำนวนผู้เข้าร่วม', 'B. รายงานที่จัดทำ', 'C. ผู้เข้าร่วมมีความรู้เพิ่มขึ้น', 'D. จำนวนเอกสาร']), correct_answer: 'C', time_limit: 10 },
            { id: 'q2', text: 'สีใดไม่ใช่แม่สี?', options: JSON.stringify(['A. แดง', 'B. เหลือง', 'C. น้ำเงิน', 'D. เขียว']), correct_answer: 'D', time_limit: 10 }
        ];
        return mockRooms[code];
    }

    const code = generateRoomCode();

    // Diagnostic check to ensure the URL is passed correctly
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_URL.startsWith('http')) {
        throw new Error(`URL ต้องขึ้นต้นด้วย http(s). ค่าปัจจุบันของคุณคือ: "${process.env.NEXT_PUBLIC_SUPABASE_URL}"`);
    }

    try {
        const { data: room, error: roomError } = await supabase
            .from('rooms')
            .insert([{ code, status: 'WAITING' }])
            .select()
            .single();

        if (roomError) {
            throw new Error("Supabase insert error: " + (roomError.message || JSON.stringify(roomError)));
        }

        const dummyQuestions = [
            {
                room_id: room.id,
                text: 'ข้อใดเป็น Outcome (ผลลัพธ์)?',
                options: JSON.stringify(['A. จำนวนผู้เข้าร่วม', 'B. รายงานที่จัดทำ', 'C. ผู้เข้าร่วมมีความรู้เพิ่มขึ้น', 'D. จำนวนเอกสาร']),
                correct_answer: 'C',
                time_limit: 10,
                sort_order: 0
            },
            {
                room_id: room.id,
                text: 'ข้อใดคือตัวชี้วัดความสำเร็จหลัก (KPI)?',
                options: JSON.stringify(['A. Key Performance Indicator', 'B. Key Process Idea', 'C. Keep People Informed', 'D. Knowledge Process Integration']),
                correct_answer: 'A',
                time_limit: 10,
                sort_order: 1
            }
        ];
        await supabase.from('questions').insert(dummyQuestions);
        return room;
    } catch (e: any) {
        throw new Error("เกิดข้อผิดพลาดในการเชื่อมต่อ: " + e.message);
    }
};

export const joinGame = async (code: string, name: string, avatar: string, sessionId: string) => {
    if (!isSupabaseConfigured()) {
        const room = mockRooms[code];
        if (!room) throw new Error('ไม่พบห้องเกม หรือรหัสผิดพลาด');
        const player = { id: `p_${Date.now()}`, name, avatar, score: 0, combo: 0, room_id: room.id, session_id: sessionId };
        mockPlayers[code].push(player);
        return { room, playerId: player.id };
    }

    const { data: room, error: roomError } = await supabase
        .from('rooms')
        .select('*')
        .eq('code', code.toUpperCase())
        .single();

    if (roomError || !room) throw new Error('ไม่พบห้องเกม หรือรหัสผิดพลาด');
    if (room.status !== 'WAITING') throw new Error('เกมเริ่มไปแล้ว หรือสิ้นสุดแล้ว');

    let playerId = '';
    const { data: existingPlayer } = await supabase
        .from('players')
        .select('*')
        .eq('room_id', room.id)
        .eq('session_id', sessionId)
        .single();

    if (existingPlayer) {
        playerId = existingPlayer.id;
        await supabase.from('players').update({ name, avatar }).eq('id', playerId);
    } else {
        const { data: newPlayer, error: playerError } = await supabase
            .from('players')
            .insert([{ room_id: room.id, name, avatar, session_id: sessionId }])
            .select()
            .single();
        if (playerError) throw playerError;
        playerId = newPlayer.id;
    }
    return { room, playerId };
};

export const submitAnswer = async (playerId: string, roomId: string, questionId: string, option: string, isCorrect: boolean, responseTime: number, scoreAwarded: number) => {
    if (!isSupabaseConfigured()) {
        console.log("Mock submit answer:", { playerId, option, isCorrect, scoreAwarded });
        return;
    }
    const { error } = await supabase.from('answers').insert([{
        player_id: playerId,
        room_id: roomId,
        question_id: questionId,
        selected_option: option,
        is_correct: isCorrect,
        response_time: responseTime,
        score_awarded: scoreAwarded
    }]);
    if (error) throw error;

    const { data: player } = await supabase.from('players').select('score, combo').eq('id', playerId).single();
    if (player) {
        const newCombo = isCorrect ? player.combo + 1 : 0;
        const newScore = player.score + scoreAwarded;
        await supabase.from('players').update({ score: newScore, combo: newCombo }).eq('id', playerId);
    }
};
