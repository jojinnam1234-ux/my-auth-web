const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const cors = require('cors'); // 추가됨
require('dotenv').config();

const app = express(); // ⭐ 반드시 app을 여기서 먼저 선언해야 합니다!

// 설정을 먼저 선언한 'app' 뒤에 붙입니다.
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // HTML 파일을 보여주기 위한 설정

// DB 연결 설정
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false // 이 부분이 없으면 클라우드 환경에서 연결이 거부될 수 있습니다.
    }
});

// --- API 경로 시작 ---

// 1. 회원가입
app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await pool.query(
            'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id',
            [username, hashedPassword]
        );
        res.status(201).json({ message: "회원가입 성공!", userId: result.rows[0].id });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "아이디가 이미 존재하거나 DB 오류가 발생했습니다." });
    }
});

// 2. 로그인
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        if (user.rows.length > 0) {
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
        console.error(err);
        res.status(500).json({ error: "서버 오류" });
    }
});

// 서버 실행
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`));