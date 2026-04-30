import jwt from "jsonwebtoken";
import "dotenv/config";

// 미들웨어 : 요청과 라우터 사이에 실행되는 함수
const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: "로그인이 필요합니다." });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "로그인이 필요합니다." });
    }

    // 토큰이 유효한지 검사 -> 안에 담긴 정보 꺼냄
    // jwt.verify(토큰, 비밀키)
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    req.userId = decoded.userId;

    // 통과했고 다음 요청으로 이동
    next();
  } catch (error) {
    return res.status(401).json({ message: "유효하지 않은 토큰입니다." });
  }
};
export default authMiddleware;
