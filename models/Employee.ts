import mongoose, { Schema } from "mongoose";

const SalaryRecordSchema = new Schema({
  amount: { type: Number, required: true },
  month: { type: String, required: true },
  year: { type: Number, required: true },
  note: { type: String },
}, { timestamps: true });

const EmployeeSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  position: { type: String, required: true },
  department: { type: Schema.Types.ObjectId, ref: "Department", required: true },
  status: { type: String, enum: ["active", "inactive"], default: "active" },
  joinDate: { type: Date, required: true },
  salary: { type: Number, required: true },
  salaryRecords: [SalaryRecordSchema],
}, { timestamps: true });

export const Employee = mongoose.models.Employee || mongoose.model("Employee", EmployeeSchema);
