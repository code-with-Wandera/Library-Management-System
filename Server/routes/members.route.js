import express from "express";
import multer from "multer";

import {
  getMembers,
  createMember,
  deleteMember,
  importMembers,
  exportMembers,
  memberAnalytics,
  memberGrowth,
} from "../controllers/members.controller.js";

import { protect, authorize } from "../middlewares/auth.middleware.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

// All routes protected
router.use(protect);

/* MEMBER CRUD */
router.get("/", getMembers);
router.post("/", authorize("admin", "librarian"), createMember);
router.delete("/:id", authorize("admin"), deleteMember);

/* CSV IMPORT/EXPORT */
router.post("/import", authorize("admin", "librarian"), upload.single("file"), importMembers);
router.get("/export", authorize("admin"), exportMembers);

/*  ANALYTICS */
router.get("/analytics", authorize("admin", "librarian"), memberAnalytics);
router.get("/analytics/growth", authorize("admin", "librarian"), memberGrowth);

export default router;
