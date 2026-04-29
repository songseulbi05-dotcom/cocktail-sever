import express from "express";
import pool from "../db.js";
import bcrypt from "bcrypt"; // 비밀번호 암호화 라이브러리
import jwt from "jsonwebtoken"; // JWT 토큰 생성 라이브러리

const router = express.Router();

// http://localhost:4000/users/register
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // 이메일 중복체크
    const [checked] = await pool.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);

    if (checked.length > 0) {
      return res.status(409).json({ message: "이미 사용중인 이메일" });
    }

    // 비밀번호는 암호화!
    // bcrypt.hash(원본비밀번호, 복잡도숫자) : 숫자가 높을수록 더 안전하지만 느려짐
    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query(
      "INSERT INTO users(name, email, password) VALUES(?, ?, ?)",
      [name, email, hashedPassword],
    );
    res.status(201).json({ message: "회원가입 완료" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "서버 에러" });
  }
});

// users/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // 이메일로 사용자 조회
    const [checked] = await pool.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);

    // 회원 정보가 없는 경우
    if (checked.length === 0) {
      return res
        .status(401)
        .json({ message: "이메일 또는 비밀번호가 잘못되었습니다." });
    }

    const user = checked[0];
    // 비밀번호 확인
    // bcrypt.compare(사용자한테 입력받은 비밀번호, DB에 암호화해서 저장된 비밀번호)
    // 암호화된 값끼리 비교하는 게 아니라
    // 입력한 비밀번호를 동일한 방식으로 암호화해서 DB 값과 비교
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ message: "이메일 또는 비밀번호가 잘못되었습니다." });
    }

    // 로그인 성공! -> JWT 토큰 생성 (출입증 발급)
    // JWT (JSON Web Token) : 사용자 인증 정보를 안전하게 전송하기 위한 토큰
    // jwt.sign(토큰에 담을 정보, 비밀키, 옵션)
    // expiresIn : 토큰의 유효기간 (7d = 7일, 1h = 1시간, 1m = 1분 = 60)
    const token = jwt.sign({ userId: user.id }, process.env.SECRET_KEY, {
      expiresIn: "7d",
    });
    res
      .status(200)
      .json({ message: "로그인 성공", token, name: user.name, id: user.id });
  } catch (error) {
    res.status(500).json({ message: "서버 에러" });
  }
});

export default router;
