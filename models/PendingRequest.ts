import mongoose, { Schema } from "mongoose";

const PendingRequestSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["superadmin", "admin", "hr_manager", "employee"], default: "employee" },
  status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
}, { timestamps: true });

delete (mongoose.models as any).PendingRequest;
export const PendingRequest = mongoose.model("PendingRequest", PendingRequestSchema);
