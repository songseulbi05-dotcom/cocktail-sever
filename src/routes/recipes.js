import express from "express";
// DB와 연결된 pool을 db.js 파일에서 가져온다
import pool from "../db.js";
import authMiddleware from "../middleware/auth.js";
import upload from "../middleware/upload.js";

const router = express.Router(); // Router 객체 생성
// router는 app처럼 get, post, put, delete 사용 가능

// DB에 값을 추가(post)
// POST http://localhost:4000/recipes
router.post("/", authMiddleware, upload.single("image"), async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!req.file) {
      return res.status(400).json({ message: "이미지를 선택해주세요." });
    }

    const image = req.file.filename; // 업로드된 파일의 이름
    const userId = req.userId;
    // FormData로 전송된 JSON 문자열 피싱
    const ingredients = JSON.parse(req.body.ingredients);
    const directions = JSON.parse(req.body.directions);

    const [result] = await pool.query(
      "INSERT INTO recipes(user_id, name, image, description) VALUES(?, ?, ?, ?)",
      [userId, name, image, description],
    );

    const recipeId = result.insertId;

    // ingredients 테이블에 추가
    for (let i = 0; i < ingredients.length; i++) {
      await pool.query(
        "INSERT INTO ingredients(recipe_id, name, amount) VALUES (?, ?, ?)",
        [recipeId, ingredients[i].name, ingredients[i].amount],
      );
    }

    // directions 테이블에 추가
    for (const direction of directions) {
      await pool.query(
        "INSERT INTO directions(recipe_id, content) VALUES (?, ?)",
        [recipeId, direction.content],
      );
    }

    res.status(201).json({ name, image, description });
  } catch (error) {
    console.error(error);
    res.status(200).json([]);
  }
});

// DB에 있는 칵테일 레시피들 조회 : get
// +) 최신등록순으로 조회
// router.get("/")
// -> app.js에서 app.use("/recipes", recipesRouter)로 연결되었기 때문에
// 실제 주소는 GET /recipes
router.get("/", async (req, res) => {
  try {
    const keyword = req.query.keyword;
    if (keyword === undefined) {
      const [result] = await pool.query(
        `SELECT * FROM recipes ORDER BY id DESC`,
      );
      res.status(200).json(result);
    } else {
      const searchKeyword = `%${keyword}%`;
      const [result] = await pool.query(
        `SELECT * FROM recipes WHERE name LIKE ? ORDER BY id DESC`,
        [searchKeyword],
      );
      res.status(200).json(result);
    }
  } catch (error) {
    console.error(error);
    res.status(200).json([]);
  }
});

// http://localhost:4000/recipes/:id
router.get("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const [result] = await pool.query("SELECT * FROM recipes WHERE id = ?", [
      id,
    ]);

    if (result.length === 0) {
      return res.status(404).json({ message: "레시피를 찾을 수 없습니다." });
    }

    const [ingredients] = await pool.query(
      "SELECT * FROM ingredients WHERE recipe_id = ?",
      [id],
    );
    const [directions] = await pool.query(
      "SELECT * FROM directions WHERE recipe_id = ?",
      [id],
    );

    res.status(200).json({ result: result[0], ingredients, directions });
  } catch (error) {
    res.status(500).json({ message: "서버 에러" });
  }
});

// http://localhost:4000/recipes/:id
router.delete("/:id", async (req, res) => {
  const id = req.params.id;
  await pool.query("DELETE FROM recipes WHERE id = ?", [id]);
  res.status(200).json({ message: "레시피 삭제 완료" });
});

export default router;
