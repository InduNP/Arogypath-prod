// server/models/userModel.js

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true, // Emails must be unique
    },
    password: {
      type: String,
      required: true,
    },

    // --- Basic Profile Fields ---
    age: { type: Number },
    gender: { type: String },
    profession: { type: String },

    // --- Physical Metrics ---
    heightCm: { type: Number },
    currentWeightKg: { type: Number },
    activityLevel: { type: String }, // "Sedentary", "Moderately Active", etc.

    // --- Health & Lifestyle Preferences ---
    healthGoal: { type: String }, // "Maintain", "Lose Weight", "Gain Muscle"
    dietPreference: { type: String }, // "Vegetarian", "Vegan", "Non-Veg"
    waterIntakeGoal: { type: Number }, // glasses per day
    exerciseDays: { type: Number }, // per week
    jobType: { type: String }, // "Desk / Office Job", etc.

    // --- Profile Picture ---
    profilePicture: {
      type: String, // Stores file path (e.g., 'uploads/filename.jpg')
    },
  },
  {
    timestamps: true, // createdAt and updatedAt
  }
);

const User = mongoose.model('User', userSchema);

module.exports = User;
