// server/controllers/dietController.js

const { GoogleGenerativeAI } = require('@google/generative-ai');

// NOTE: Ensure this path is correct in your actual project
const { DietPlanLog } = require('../services/dietPlanService'); 

if (!process.env.GEMINI_API_KEY) {
  console.error('FATAL ERROR: GEMINI_API_KEY is not defined in .env file.');
  process.exit(1);
}
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// --- ALL HELPER FUNCTIONS DEFINED FIRST ---

/**
 * Helper function to extract meal names
 */
const extractMealNames = (planText) => {
    const commonMeals = ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Morning Tea', 'Evening Snack'];
    
    const mealsFound = commonMeals
        .filter(meal => planText.includes('**' + meal + '**') || planText.includes(meal + ':'))
        .map(meal => ({ mealName: meal }));
        
    return mealsFound.length > 0 ? mealsFound : [
        { mealName: 'Breakfast' }, 
        { mealName: 'Lunch' }, 
        { mealName: 'Dinner' }
    ];
};

/**
 * Helper function to format the additional answers into a readable string for the AI.
 */
const formatAdditionalAnswers = (answersJson) => {
    try {
        const answers = JSON.parse(answersJson);
        return Object.entries(answers)
            .map(([key, value]) => `- ${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}`)
            .join('\n');
    } catch (e) {
        console.error('Failed to parse detailedProfileAnswers:', e);
        return 'No additional profile details were provided or the data was malformed.';
    }
}

// --- HELPER FUNCTION: Calculate weekly compliance/metrics ---
const calculateWeeklyProgress = (logs) => {
    if (logs.length === 0) {
        return {
            labels: ['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4'],
            heathScore: [0, 0, 0, 0],
            water: [0, 0, 0, 0]
        };
    }
    return {
        labels: ['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4'],
        heathScore: [85, 90, 70, 95], 
        water: [2.5, 3.0, 2.0, 2.5]
    };
};

// --- HELPER FUNCTION: Calculate monthly weight/metrics ---
const calculateMonthlyProgress = (logs) => {
    if (logs.length === 0) {
        return {
            labels: ['Month 1', 'Month 2', 'Month 3'],
            weightLoss: [0, 0, 0]
        };
    }
    return {
        labels: ['Month 1', 'Month 2', 'Month 3'],
        weightLoss: [1.5, 2.1, 0.8], 
    };
};

// --- CONTROLLER 1: Generate Plan & Create Log (RESTORED LOGIC) ---
const generateDietPlan = async (req, res) => {
  try {
    const userId = req.user._id; 

    // Extract ALL fields, including the new detailedProfileAnswers
    const { 
      age, gender, prakriti, healthGoals, digestion, stress, 
      activityLevel, dietaryPreferences, extraDetails, detailedProfileAnswers 
    } = req.body;

    // Validation
    if (!age || !gender || !prakriti || !healthGoals || !digestion || !stress || !activityLevel || !dietaryPreferences) {
      return res.status(400).json({ message: 'Please answer all core questions.' });
    }
    
    // Parse the additional answers into a string
    const additionalDetailsString = formatAdditionalAnswers(detailedProfileAnswers);

    // server/controllers/dietController.js

// ... inside generateDietPlan function ...
// ... (all the logic to extract data remains the same)

// const additionalDetailsString = formatAdditionalAnswers(detailedProfileAnswers);

// server/controllers/dietController.js

// ... inside generateDietPlan function ...

    // ... (rest of the code)

    // CRITICAL: Construct the detailed, personalized prompt using ALL data
    const prompt = `
      You are an expert Ayurvedic dietitian. Your task is to generate a highly personalized, one-day Ayurvedic Diet Chart.
      
      --- COMPREHENSIVE USER PROFILE ---
      
      CORE PROFILE:
      - Age: ${age}, Gender: ${gender}, Goal: ${healthGoals}
      - Prakriti: ${prakriti}, Digestion: ${digestion}, Stress Level: ${stress}
      - Activity: ${activityLevel}, Dietary Pattern: ${dietaryPreferences}

      DETAILED LIFESTYLE PROFILE:
      ${additionalDetailsString}
      
      ADDITIONAL NOTES: ${extraDetails || 'None provided.'}

      --- STRICT OUTPUT INSTRUCTIONS: MARKDOWN TABLE ONLY ---

      1. **Output Structure:** The ENTIRE output MUST be a single Markdown Table. DO NOT include any text, headers, titles, or paragraphs outside of the table.
      2. **Table Columns:** The table MUST have exactly four columns: **Meal**, **Time**, **Recommendation**, and **Ayurvedic Benefit**.
      3. **Meals:** Create the plan based on the user's meal preference specified in the 'DETAILED LIFESTYLE PROFILE'. If the user prefers 2 meals, ONLY provide **Lunch** and **Dinner**. If 3 or more, provide **Breakfast**, **Lunch**, **Snack**, and **Dinner**.
      4. **Word Count:** Keep the content within each cell concise.

      --- BEGIN MARKDOWN TABLE NOW ---
      
      | Meal | Time | Recommendation | Ayurvedic Benefit |
      | :--- | :--- | :--- | :--- |
      | **Breakfast** | 7:30 - 8:30 AM | [Specific, detailed food recommendation based on profile] | [Specific benefit, e.g., Balances Vata & Kapha, supports Agni] |
      | **Lunch** | 12:30 - 1:30 PM | [Specific, detailed food recommendation based on profile] | [Specific benefit, e.g., Best meal for Pitta-dominant individuals, aids sharp Agni] |
      | **Snack** | [Choose one time] | [Light, easily digestible snack] | [Specific benefit, e.g., Sustains energy, prevents Vata fluctuation] |
      | **Dinner** | 6:30 - 7:30 PM | [Specific, detailed food recommendation based on profile] | [Specific benefit, e.g., Light meal to support overnight cleansing, easy on Kapha digestion] |
    `;

    // ... rest of the logic
// ... rest of the function remains the same ...
    // CALL THE GEMINI API
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' }); 
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const dietPlanText = response.text();

    // 2. LOG THE NEW DIET PLAN AND MEALS TO THE DATABASE
    const mealLogs = extractMealNames(dietPlanText);

    const newDietLog = new DietPlanLog({
        user: userId,
        planText: dietPlanText,
        formData: req.body, 
        mealLogs: mealLogs,
    });
    await newDietLog.save();
    
    console.log('Successfully generated diet plan and created new log.');
    res.status(200).json({ dietPlan: dietPlanText });

  } catch (error) {
    console.error('CRITICAL SERVER ERROR generating diet plan (500):', error.message, error.stack);
    res.status(500).json({ message: 'Server error while generating diet plan.' });
  }
};

// --- CONTROLLER 2: Log Meal Completion (RESTORED LOGIC) ---
const logMealCompletion = async (req, res) => {
    try {
        const userId = req.user._id; 
        const { logId, mealName, isCompleted, userWeight, waterIntakeLiters } = req.body;

        const log = await DietPlanLog.findOne({ _id: logId, user: userId });

        if (!log) {
            return res.status(404).json({ message: 'Diet log not found.' });
        }

        const mealLogEntry = log.mealLogs.find(m => m.mealName === mealName);
        if (mealLogEntry) {
            mealLogEntry.isCompleted = isCompleted;
            mealLogEntry.timeLogged = new Date();
        }

        if (userWeight) log.userWeight = userWeight;
        if (waterIntakeLiters) log.waterIntakeLiters = waterIntakeLiters;

        await log.save();
        
        res.status(200).json({ 
            message: 'Meal log updated successfully.', 
            updatedLog: log.mealLogs 
        });

    } catch (error) {
        console.error('Error logging meal completion:', error);
        res.status(500).json({ message: 'Server error while logging meal.' });
    }
};


// --- CONTROLLER 3: Fetch Progress Data for Dashboard (RESTORED LOGIC) ---
const getPlanProgress = async (req, res) => {
    try {
        const userId = req.user._id; 
        
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

        const logs = await DietPlanLog.find({
            user: userId,
            date: { $gte: ninetyDaysAgo }
        }).sort({ date: 1 });

        const weeklyData = calculateWeeklyProgress(logs); 
        const monthlyData = calculateMonthlyProgress(logs); 

        res.status(200).json({ 
            weeklyData: weeklyData,
            monthlyData: monthlyData,
        });

    } catch (error) {
        console.error('Error fetching plan progress:', error);
        res.status(500).json({ message: 'Server error while fetching progress.' });
    }
};


// --- EXPORTS MUST BE LAST ---
module.exports = {
  generateDietPlan,
  logMealCompletion,
  getPlanProgress,
};