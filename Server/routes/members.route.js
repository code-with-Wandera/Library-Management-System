import express from "express";
import {
  getMembers,
  addMember,
  deleteMember,
} from "../controllers/members.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", protect, getMembers);
router.post("/", protect, addMember);
router.delete("/:id", protect, deleteMember);

export default router;
