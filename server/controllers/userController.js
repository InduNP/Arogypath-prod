// server/controllers/userController.js

const User = require('../models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

// --- Register User ---
const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Please enter all fields' });
  }

  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = new User({
      name,
      email,
      password: hashedPassword,
    });

    await user.save();

    const payload = { user: { id: user.id } };
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '5d' }, (err, token) => {
      if (err) throw err;
      res.status(201).json({
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      });
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
};

// --- Login User ---
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const payload = { user: { id: user.id } };
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '5d' }, (err, token) => {
      if (err) throw err;
      res.json({
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          age: user.age,
          gender: user.gender,
          profession: user.profession,
          heightCm: user.heightCm,
          currentWeightKg: user.currentWeightKg,
          activityLevel: user.activityLevel,
          healthGoal: user.healthGoal,
          dietPreference: user.dietPreference,
          waterIntakeGoal: user.waterIntakeGoal,
          exerciseDays: user.exerciseDays,
          jobType: user.jobType,
          profilePicture: user.profilePicture,
        },
      });
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
};

// --- Get Profile ---
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      age: user.age,
      gender: user.gender,
      profession: user.profession,
      heightCm: user.heightCm,
      currentWeightKg: user.currentWeightKg,
      activityLevel: user.activityLevel,
      healthGoal: user.healthGoal,
      dietPreference: user.dietPreference,
      waterIntakeGoal: user.waterIntakeGoal,
      exerciseDays: user.exerciseDays,
      jobType: user.jobType,
      profilePicture: user.profilePicture,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
};

// --- Update Profile ---
const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const file = req.file;

    if (!user) {
      if (file) fs.unlinkSync(path.resolve(file.path));
      return res.status(404).json({ message: 'User not found' });
    }

    // update fields
    user.name = req.body.name || user.name;
    user.age = req.body.age || user.age;
    user.gender = req.body.gender || user.gender;
    user.profession = req.body.profession || user.profession;
    user.heightCm = req.body.heightCm ? Number(req.body.heightCm) : user.heightCm;
    user.currentWeightKg = req.body.currentWeightKg ? Number(req.body.currentWeightKg) : user.currentWeightKg;
    user.activityLevel = req.body.activityLevel || user.activityLevel;
    user.healthGoal = req.body.healthGoal || user.healthGoal;
    user.dietPreference = req.body.dietPreference || user.dietPreference;
    user.waterIntakeGoal = req.body.waterIntakeGoal || user.waterIntakeGoal;
    user.exerciseDays = req.body.exerciseDays || user.exerciseDays;
    user.jobType = req.body.jobType || user.jobType;

    if (req.body.password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(req.body.password, salt);
    }

    // handle profile picture
    if (file) {
      if (user.profilePicture && user.profilePicture !== 'path/to/default') {
        const oldPath = path.resolve(user.profilePicture);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
      user.profilePicture = file.path;
    }

    const updatedUser = await user.save();

    const payload = { user: { id: updatedUser.id } };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '5d' });

    // ✅ send ALL fields
    res.json({
      token,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        age: updatedUser.age,
        gender: updatedUser.gender,
        profession: updatedUser.profession,
        heightCm: updatedUser.heightCm,
        currentWeightKg: updatedUser.currentWeightKg,
        activityLevel: updatedUser.activityLevel,
        healthGoal: updatedUser.healthGoal,
        dietPreference: updatedUser.dietPreference,
        waterIntakeGoal: updatedUser.waterIntakeGoal,
        exerciseDays: updatedUser.exerciseDays,
        jobType: updatedUser.jobType,
        profilePicture: updatedUser.profilePicture,
      },
    });
  } catch (error) {
    console.error('Profile update failed:', error.message);
    res.status(500).send('Server error during profile update.');
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
};
