import { Router } from "express";
import { sql } from "../config/db.js";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    const result = await sql`
      SELECT
        NOW() AS database_time,
        current_database() AS database_name,
        current_user AS database_user
    `;

    return res.status(200).json({
      ok: true,
      message: "API y base de datos funcionando correctamente",
      database: {
        connected: true,
        name: result[0]?.database_name,
        user: result[0]?.database_user,
        time: result[0]?.database_time
      }
    });
  } catch (error) {
    console.error("Error conectando con Neon:", error);

    return res.status(500).json({
      ok: false,
      message: "La API funciona, pero Neon no respondió correctamente"
    });
  }
});

export default router;