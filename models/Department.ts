import mongoose, { Schema } from "mongoose";

const DepartmentSchema = new Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String },
}, { timestamps: true });

export const Department = mongoose.models.Department || mongoose.model("Department", DepartmentSchema);
