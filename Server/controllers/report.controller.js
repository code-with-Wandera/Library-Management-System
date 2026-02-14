import mongoose from "mongoose";
import Borrow from "../models/borrow.model.js";

export const getCirculationReport = async (req, res) => {
  // Destructure tenantId from req.user (attached by your Auth Middleware)
  const { tenantId } = req.user;
  
  try {
    const data = await Borrow.aggregate([
      { 
        // CRITICAL: Filter by tenantId first for security and performance
        $match: { tenantId: new mongoose.Types.ObjectId(tenantId) } 
      },
      { 
        $group: { 
          _id: { 
            status: "$status", 
            month: { $month: "$createdAt" } 
          }, 
          count: { $sum: 1 } 
        } 
      },
      { $sort: { "_id.month": 1 } }
    ]);

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: "Circulation report failed" });
  }
};