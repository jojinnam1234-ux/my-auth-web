const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

const app = express();
app.use(express.json()); // JSON 요청 본문을 읽기 위한 설정

// DB 연결 설정
// 기존의 process.env.DATABASE_URL 대신 직접 주소를 넣어봅니다.
const pool = new Pool({
    connectionString: 'postgresql://postgres:U6XKky1FNRL34pak@db.cwnplwdhwjuknopbrlcf.supabase.co:5432/postgres',
    ssl: { rejectUnauthorized: false } // Supabase 연결 시 보안 설정을 추가해줍니다.
});
// 1. 회원가입 (Register)
app.post('/register', async (req, res) => {
    const { username, password } = req.body;

    try {
        // 비밀번호 암호화 (Salt회수: 10)
        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await pool.query(
            'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id',
            [username, hashedPassword]
        );

        res.status(201).json({ message: "회원가입 성공!", userId: result.rows[0].id });
    } catch (err) {
        console.error("실제 에러 내용:", err); // 터미널 창에 진짜 원인이 뜹니다.
        res.status(500).json({ error: err.message });
    }
});

// 2. 로그인 (Login)
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        // 유저 찾기
        const user = await pool.query('SELECT * FROM users WHERE username = $1', [username]);

        if (user.rows.length > 0) {
            // DB의 암호화된 비번과 입력받은 비번 대조
            const validPassword = await bcrypt.compare(password, user.rows[0].password);

            if (validPassword) {
                res.json({ message: "로그인 성공! 환영합니다." });
            } else {
                res.status(401).json({ error: "비밀번호가 틀렸습니다." });
            }
        } else {
            res.status(404).json({ error: "존재하지 않는 사용자입니다." });
        }
    } catch (err) {
        res.status(500).json({ error: "서버 오류" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`));