import React, { useState, useMemo } from 'react';
import remarkGfm from 'remark-gfm'; // <-- CRITICAL IMPORT FOR TABLE RENDERING
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import html2pdf from 'html2pdf.js';
import { useNavigate } from 'react-router-dom';
import './DietPlannerPage.css';

// --- 1. UPDATED DATA STRUCTURE ---
interface FormData {
  age: string;
  gender: string;
  prakriti: string;
  healthGoals: string;
  activityLevel: string;
  dietaryPreferences: string;
  digestion: string;
  stress: string;
  extraDetails: string;
  // --- NEW FIELD TO SEND ALL OTHER ANSWERS AS A JSON STRING ---
  detailedProfileAnswers: string; 
}

// --- 2. QUESTIONNAIRE DATA (Expanded to 18 multiple-choice questions) ---
// Questions 1-18 data here (kept exactly as you provided)
const questionsData = [
  // Q1. CORE: prakriti (Body Frame)
  { "id": "prakriti", "question": "1. My physical body frame is best described as:",
    "options": [
      {"text": "Thin and light; I find it difficult to gain weight."},
      {"text": "Medium and athletic; I build muscle with relative ease."},
      {"text": "Broad and sturdy; I tend to gain weight easily."},
      {"text": "A combination of two of the above."}
    ]
  },
  // Q2. CORE: healthGoals
  { "id": "healthGoals", "question": "2. What is your primary health goal?",
    "options": [
      {"text": "Manage weight."},
      {"text": "Improve digestion."},
      {"text": "Increase energy."},
      {"text": "Manage stress."},
      {"text": "Overall wellness & immunity."}
    ]
  },
  // Q3. CORE: digestion
  { "id": "digestion", "question": "3. My digestion tends to be:",
    "options": [
      {"text": "Prone to gas, bloating, and inconsistent (Vata)."},
      {"text": "Strong but can cause acidity or heartburn (Pitta)."},
      {"text": "Slow and heavy; I feel full long after eating (Kapha)."},
      {"text": "Usually reliable."}
    ]
  },
  // Q4. CORE: stress
  { "id": "stress", "question": "4. How stressed do you feel?",
    "options": [
      {"text": "Low."},
      {"text": "Moderate."},
      {"text": "High."},
      {"text": "Very high."}
    ]
  },
  // Q5. CORE: activityLevel
  { "id": "activityLevel", "question": "5. My daily activity involves:",
    "options": [
      {"text": "Mostly sitting (sedentary)."},
      {"text": "Mix of sitting and moving (moderate)."},
      {"text": "Mostly standing/active work (active)."},
      {"text": "Vigorous daily exercise (highly active)."}
    ]
  },
  // Q6. CORE: dietaryPreferences
  { "id": "dietaryPreferences", "question": "6. What is your primary dietary pattern?",
    "options": [
      {"text": "Vegetarian"},
      {"text": "Vegan"},
      {"text": "Non-Vegetarian"},
      {"text": "Eggetarian"}
    ]
  },
  // Q7. ADDITIONAL: skin
  { "id": "skin", "question": "7. My skin typically tends to be:",
    "options": [
      {"text": "Dry, thin, and feels cool to the touch (Vata)"},
      {"text": "Sensitive, warm, prone to redness or acne (Pitta)."},
      {"text": "Thick, smooth, oily, and well-hydrated (Kapha)."},
      {"text": "Combination skin that varies."}
    ]
  },
  // Q8. ADDITIONAL: hair
  { "id": "hair", "question": "8. My hair texture is naturally:",
    "options": [
      {"text": "Dry, thin, brittle, or frizzy (Vata)."},
      {"text": "Fine, straight, prone to early graying (Pitta)."},
      {"text": "Thick, wavy, strong, and often oily (Kapha)."},
      {"text": "Generally average."}
    ]
  },
  // Q9. ADDITIONAL: appetite
  { "id": "appetite", "question": "9. My appetite and eating habits are:",
    "options": [
      {"text": "Irregular; I sometimes forget to eat (Vata)."},
      {"text": "Strong and sharp; I get irritable if I miss a meal (Pitta)."},
      {"text": "Slow and steady; I can easily skip a meal (Kapha)."},
      {"text": "Generally regular and moderate."}
    ]
  },
  // Q10. ADDITIONAL: energy
  { "id": "energy", "question": "10. My energy pattern throughout the day is typically:",
    "options": [
      {"text": "Quick bursts, then fatigue (Vata)."},
      {"text": "Focused and intense (Pitta)."},
      {"text": "Steady and consistent (Kapha)."},
      {"text": "Highly variable."}
    ]
  },
  // Q11. ADDITIONAL: sleep
  { "id": "sleep", "question": "11. My sleep is usually:",
    "options": [
      {"text": "Light and easily disturbed (Vata)."},
      {"text": "Sound and restful but I may wake up hot (Pitta)."},
      {"text": "Deep and heavy; hard to wake up (Kapha)."},
      {"text": "Generally good."}
    ]
  },
  // Q12. ADDITIONAL: exercise
  { "id": "exercise", "question": "12. How often do you exercise?",
    "options": [
      {"text": "Rarely or never (low)."},
      {"text": "1-2 times per week (light)."},
      {"text": "3-4 times per week (moderate)."},
      {"text": "5 or more times per week (high)."}
    ]
  },
  // Q13. ADDITIONAL: stressReaction
  { "id": "stressReaction", "question": "13. When stressed, I usually:",
    "options": [
      {"text": "Become anxious, mind races (Vata)."},
      {"text": "Become irritable, angry (Pitta)."},
      {"text": "Withdraw, crave comfort food (Kapha)."},
      {"text": "Reaction is unpredictable."}
    ]
  },
  // Q14. ADDITIONAL: foodAvoid
  { "id": "foodAvoid", "question": "14. Are there foods you routinely avoid?",
    "options": [
      {"text": "Dairy"},
      {"text": "Spicy"},
      {"text": "Fried"},
      {"text": "Sweets/Sugar"},
      {"text": "Meat"},
      {"text": "Gluten"},
      {"text": "None"}
    ]
  },
  // Q15. ADDITIONAL: allergies
  { "id": "allergies", "question": "15. Do you have known food allergies/restrictions?",
    "options": [
      {"text": "Yes (specify in extra details)."},
      {"text": "No."}
    ]
  },
  // Q16. ADDITIONAL: mealCount
  { "id": "mealCount", "question": "16. How many meals do you prefer per day?",
    "options": [
      {"text": "2 meals"},
      {"text": "3 meals"},
      {"text": "4-5 small meals"}
    ]
  },
  // Q17. ADDITIONAL: tastePreference
  { "id": "tastePreference", "question": "17. Which taste do you crave the most?",
    "options": [
      {"text": "Sweet"},
      {"text": "Sour"},
      {"text": "Salty"},
      {"text": "Pungent (spicy)"},
      {"text": "Bitter"},
      {"text": "Astringent (dry/raw)"}
    ]
  },
  // Q18. ADDITIONAL: weatherComfort
  { "id": "weatherComfort", "question": "18. I am most comfortable in weather that is:",
    "options": [
      {"text": "Warm and humid."},
      {"text": "Cool and dry."},
      {"text": "Warm and sunny."}
    ]
  },
];


const DietPlannerPage: React.FC = () => {
  const navigate = useNavigate();
  
  // Initial state for core form data
  const [formData, setFormData] = useState<FormData>({
    age: '', gender: '', prakriti: '', healthGoals: '', digestion: '', stress: '',
    activityLevel: '', dietaryPreferences: '', extraDetails: '',
    detailedProfileAnswers: '{}' // Initialize as empty JSON string
  });

  // State to hold answers for questions that don't map to a core FormData field (Q7-Q18)
  const [additionalAnswers, setAdditionalAnswers] = useState<Record<string, string>>({});

  const [dietPlan, setDietPlan] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const dietPlanRef = React.useRef<HTMLDivElement>(null);

  // Checks for ALL required fields (Q1-Q6 + Age/Gender = 8 core inputs)
  const isFormComplete = useMemo(() => {
    return (
      !!formData.prakriti &&
      !!formData.healthGoals &&
      !!formData.digestion &&
      !!formData.stress &&
      !!formData.activityLevel &&
      !!formData.dietaryPreferences &&
      !!formData.gender &&
      !!formData.age
    );
  }, [formData]);

  const handleOptionClick = (field: string, value: string) => {
    // Check if the field is a core FormData key (Q1-Q6, Age, Gender, ExtraDetails)
    if (field in formData) {
      setFormData((prev) => ({ ...prev, [field as keyof FormData]: value }));
    } else {
      // If not a core key, store it in the additionalAnswers state (Q7-Q18)
      setAdditionalAnswers((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name as keyof FormData]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormComplete) {
      setError('Please answer all core questions (1-6) and your age/gender.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setDietPlan('');
    
    try {
      // 1. Update the formData with the serialized additional answers
      const finalFormData = {
          ...formData,
          // Serialize the additional answers into the designated field
          detailedProfileAnswers: JSON.stringify(additionalAnswers),
      };

      const storedUserInfo = localStorage.getItem('userInfo');
      const token = storedUserInfo ? JSON.parse(storedUserInfo).token : null;
      if (!token) throw new Error('Authentication token not found.');
      
      const config = { 
        headers: { 
          'Content-Type': 'application/json', 
          Authorization: `Bearer ${token}` 
        } 
      };
      
      // 2. Send the combined form data
      const { data } = await axios.post('/api/diet/generate', finalFormData, config);
      setDietPlan(data.dietPlan);
    } catch (err: unknown) {
      let message = 'An unexpected error occurred.';
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        message = err.response.data.message;
      }
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    const element = dietPlanRef.current;
    if (element) {
      const opt = {
        margin: 10,
        filename: 'ArogyaPath-Diet-Plan.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (html2pdf().from(element) as any).set(opt).save();
    }
  };
  
  const navigateToExperts = () => {
    navigate('/consult-experts');
  };

  // Render options using the question ID (which maps to a core field or an additional answer)
  const renderOptions = (fieldId: string, options: { text: string }[]) => {
    // Determine the current selected value
    const selectedValue = (fieldId in formData) 
        ? formData[fieldId as keyof FormData] 
        : additionalAnswers[fieldId];

    return (
      <div className="options-container">
        {options.map((option) => (
          <button 
            type="button" 
            key={option.text} 
            className={`option-button ${selectedValue === option.text ? 'selected' : ''}`} 
            onClick={() => handleOptionClick(fieldId, option.text)}
          >
            {option.text}
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="diet-planner-container">
      <h2>Your Personalized Ayurvedic Diet Planner</h2>
      
      {!dietPlan ? (
        <form onSubmit={handleSubmit} className="questionnaire-form">
          <p className="intro-text">Answer the questions below to generate your personalized plan.</p>
          
          {/* --- RENDER ALL 18 QUESTIONS (Q1-Q18) --- */}
          {questionsData.map((q) => (
            <div className="question-block" key={q.id}>
              <label>{q.question}</label>
              {renderOptions(q.id, q.options)}
            </div>
          ))}
          
          {/* --- AGE AND GENDER (Q19 & Q20 Logic) --- */}
          <div className="question-block-inline">
            <div className="inline-field">
              <label htmlFor="age">19. Your Age:</label>
              <input type="number" id="age" name="age" value={formData.age} onChange={handleTextChange} required />
            </div>
            <div className="inline-field">
              <label htmlFor="gender">20. Your Gender:</label>
               <div className="options-container">
                 {['Male', 'Female', 'Other'].map((option) => (
                    <button 
                      type="button" 
                      key={option} 
                      className={`option-button ${formData.gender === option ? 'selected' : ''}`} 
                      onClick={() => handleOptionClick('gender', option)}
                    >
                      {option}
                    </button>
                  ))}
               </div>
            </div>
          </div>
          
          {/* --- EXTRA DETAILS (Final Optional Text) --- */}
          <div className="question-block">
            <label htmlFor="extraDetails">Optional: Any final allergies, medications, or details to add?</label>
            <textarea id="extraDetails" name="extraDetails" value={formData.extraDetails} onChange={handleTextChange} placeholder="e.g., allergic to peanuts, taking daily medication, currently fasting..." />
          </div>
          
          <div className="generate-section">
            <button type="submit" className="generate-button" disabled={!isFormComplete || isLoading}>
              {isLoading ? 'Generating...' : 'Generate a Diet Chart'}
            </button>
            {!isFormComplete && !isLoading && <p className="form-incomplete-message">Please answer all core questions (1-6) and your age/gender to enable generation.</p>}
          </div>
        </form>
      ) : (
        <>
          <div className="diet-plan-result" ref={dietPlanRef}>
            {/* --- CRITICAL CHANGE: Use remarkPlugins for table rendering --- */}
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{dietPlan}</ReactMarkdown>
          </div>
          <div className="result-actions">
            <button onClick={handleDownload} className="download-button">Download as PDF</button>
            <button onClick={navigateToExperts} className="consult-experts-button">Consult an Expert</button>
            <button onClick={() => setDietPlan('')} className="generate-button">Generate a New Plan</button>
          </div>
        </>
      )}
      
      {error && <div className="error-message">{error}</div>}
    </div>
  );
};

export default DietPlannerPage;