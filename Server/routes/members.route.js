import express from "express";
import multer from "multer";
import {
  getMembers,
  createMember,
  deleteMember,
  importMembers,
  exportMembers,
  memberAnalytics,
} from "../controllers/members.controller.js";
import { authorize } from "../middleware/authorize.js";
import { authenticate } from "../middleware/authenticate.js";
import { memberGrowth } from "../controllers/members.controller.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.use(authenticate);

router.get("/", getMembers);
router.get("/analytics", authorize("admin", "librarian"), memberAnalytics);
router.get("/export", authorize("admin"), exportMembers);
router.get("/analytics/growth", authorize("admin", "librarian"), memberGrowth);

router.post("/", authorize("admin", "librarian"), createMember);
router.post(
  "/import",
  authorize("admin", "librarian"),
  upload.single("file"),
  importMembers,
);

router.delete("/:id", authorize("admin"), deleteMember);

export default router;
