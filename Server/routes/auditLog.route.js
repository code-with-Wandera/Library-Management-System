import { protect } from "../middlewares/auth.middleware.js";
import { logAudit } from "../utils/auditLog.utils.js";

app.post("/members", protect, async (req, res) => {
  // create a new member...
  
  await logAudit({
    user: req.user, // full Mongoose user document
    action: "ADD_MEMBER",
    target: newMember._id.toString(),
  });

  res.json({ message: "Member added" });
});
