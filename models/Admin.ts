import mongoose, { Schema } from "mongoose";

const AdminSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["superadmin", "admin", "hr_manager", "employee"], default: "employee" },
  avatar: { type: String, default: "" },
  mustChangePassword: { type: Boolean, default: false },
}, { timestamps: true });

delete (mongoose.models as any).Admin;
export const Admin = mongoose.model("Admin", AdminSchema);
