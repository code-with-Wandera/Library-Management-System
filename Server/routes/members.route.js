import express from "express";
import auth from "../middlewares/auth.middleware.js";
import multer from "multer";
import {
  getMembers,
  addMember,
  updateMember,
  deleteMember,
  importMembers
} from "../controllers/members.controller.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

// GET single member
router.get("/:id", async (req, res) => {
  try {
    const member = await Member.findById(req.params.id);
    if (!member) return res.status(404).json({ message: "Member not found" });
    res.json(member);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// CRUD routes
router.get("/", auth, getMembers);
router.post("/", auth, addMember);
router.put("/:id", auth, updateMember);
router.delete("/:id", auth, deleteMember);

// CSV import
router.post("/import", auth, upload.single("file"), importMembers);

export default router;
