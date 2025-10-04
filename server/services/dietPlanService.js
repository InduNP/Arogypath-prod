// server/services/dietPlanService.js

const mongoose = require('mongoose');

// --- 1. DEFINE SUB-SCHEMA (Meal Log) ---
const mealLogSchema = mongoose.Schema({
    mealName: { type: String, required: true },
    isCompleted: { type: Boolean, default: false },
    timeLogged: { type: Date }
}, { _id: false }); // Important: We don't need an ID for every subdocument

// --- 2. DEFINE MAIN SCHEMA (Diet Plan Log) ---
const dietPlanLogSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Reference to your User model
      required: true,
    },
    // NOTE: Removed the redundant 'date' field, as timestamps:true provides 'createdAt'
    planText: {
      type: String,
      required: true,
    },
    // Store the full form data for analysis/reference
    formData: {
        type: Object,
        required: true,
    },
    mealLogs: [mealLogSchema],
    userWeight: { type: Number },
    waterIntakeLiters: { type: Number },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
    collection: 'DietPlanLogs'
  }
);


// --- 3. EXPORT THE MODEL SAFELY ---
// This standard pattern prevents Mongoose from throwing a 'OverwriteModelError' 
// if the file is imported multiple times.

// Check if the model already exists in mongoose.models (the global store)
const DietPlanLog = mongoose.models.DietPlanLog 
    ? mongoose.model('DietPlanLog') // If it exists, retrieve it
    : mongoose.model('DietPlanLog', dietPlanLogSchema); // If not, create and register it

module.exports = { DietPlanLog }; 