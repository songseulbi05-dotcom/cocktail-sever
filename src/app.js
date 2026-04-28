// const express = require("express");
// ES 문법 (자바스크립트 최신문법)
import express from "express";
import path from "path";
import { fileURLToPath } from "url";

// recipes 라우터 파일을 가져온다
import recipesRouter from "./routes/recipes.js";
import usersRouter from "./routes/users.js";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use((req, res, next) => {
  // CORS 허용
  res.header("Access-Control-Allow-Origin", "http://localhost:5173");
  // GET(조회), POST(추가), PUT(수정), DELETE(삭제) 요청 허용
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  // JSON 데이터 받을 수 있도록 허용
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  next();
});

// JSON 형태로 들어오는 요청을 파싱해서 req.body에 추가
app.use(express.json());

// 업로드된 이미지 파일을 브라우저에서 볼 수 있도록 공개
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// POST http://localhost:4000/recipes
app.use("/recipes", recipesRouter);

// POST http://localhost:4000/users
app.use("/users", usersRouter);

app.listen(4000, () => {
  console.log("4000번 포트번호로 서버 실행중");
});
