import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { 
      type: String, 
      required: [true, "Name is required"],
      trim: true 
    },
    email: { 
      type: String, 
      required: [true, "Email is required"], 
      unique: true,
      lowercase: true,
      trim: true 
    },
    password: { 
      type: String, 
      required: [true, "Password is required"] 
    },
    role: { 
      type: String, 
      enum: ["user", "admin"], 
      default: "user" 
    },
    // CRITICAL: This links the user to their specific library
    tenantId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Tenant", 
      required: [true, "User must be assigned to a tenantId"] 
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { 
    timestamps: true // Automatically creates createdAt and updatedAt fields
  }
);

// Optional: Indexing tenantId for faster queries in multi-tenant environments
userSchema.index({ tenantId: 1, email: 1 });

export default mongoose.model("User", userSchema);