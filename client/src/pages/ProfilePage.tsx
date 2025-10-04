// client/src/pages/ProfilePage.tsx

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FaCamera,
  FaChartBar,
  FaRulerVertical,
  FaUser,
  FaHeartbeat,
  FaRunning,
} from "react-icons/fa";
import "./ProfilePage.css";

interface UserEntity {
  id: string;
  name: string;
  email: string;
  age?: number;
  gender?: string;
  profession?: string;
  heightCm?: number;
  currentWeightKg?: number;
  activityLevel?: string;
  healthGoal?: string;
  dietPreference?: string;
  waterIntakeGoal?: number;
  exerciseDays?: number;
  jobType?: string;
  profilePicture?: string;
}

interface UserInfo {
  token: string;
  user: UserEntity;
}

const defaultProfilePic = "https://i.imgur.com/kS55o8K.png";

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  // form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [profession, setProfession] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [currentWeightKg, setCurrentWeightKg] = useState("");
  const [healthGoal, setHealthGoal] = useState("select");
  const [dietPreference, setDietPreference] = useState("select");
  const [waterIntakeGoal, setWaterIntakeGoal] = useState("select");
  const [exerciseDays, setExerciseDays] = useState("0");
  const [jobType, setJobType] = useState("Desk / Office Job");

  // ✅ Activity level is auto-calculated
  const [activityLevel, setActivityLevel] = useState("Sedentary");

  // profile picture
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(
    null
  );
  const [profilePictureUrl, setProfilePictureUrl] =
    useState(defaultProfilePic);

  const [loading, setLoading] = useState(true);

  // Fetch profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      const storedUserInfo = localStorage.getItem("userInfo");
      if (!storedUserInfo) {
        navigate("/login");
        return;
      }
      const parsed: UserInfo = JSON.parse(storedUserInfo);

      try {
        const { data } = await axios.get(
          "http://localhost:5001/api/users/profile",
          {
            headers: { Authorization: `Bearer ${parsed.token}` },
          }
        );

        const updated = { token: parsed.token, user: data };
        localStorage.setItem("userInfo", JSON.stringify(updated));
        setUserInfo(updated);

        // fill form values
        setName(data.name || "");
        setEmail(data.email || "");
        setAge(data.age ? String(data.age) : "");
        setGender(data.gender || "");
        setProfession(data.profession || "");
        setHeightCm(data.heightCm ? String(data.heightCm) : "");
        setCurrentWeightKg(
          data.currentWeightKg ? String(data.currentWeightKg) : ""
        );
        setHealthGoal(data.healthGoal || "select");
        setDietPreference(data.dietPreference || "select");
        setWaterIntakeGoal(
          data.waterIntakeGoal ? String(data.waterIntakeGoal) : "select"
        );
        setExerciseDays(
          data.exerciseDays ? String(data.exerciseDays) : "0"
        );
        setJobType(data.jobType || "Desk / Office Job");
        setProfilePictureUrl(data.profilePicture || defaultProfilePic);

        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch profile:", err);
      }
    };

    fetchProfile();
  }, [navigate]);

  // ✅ Auto-calculate Activity Level whenever lifestyle inputs change
  useEffect(() => {
    const days = parseInt(exerciseDays) || 0;
    let newLevel = "Sedentary";

    if (jobType === "Desk / Office Job") {
      if (days <= 1) newLevel = "Sedentary";
      else if (days <= 3) newLevel = "Lightly Active";
      else if (days <= 5) newLevel = "Moderately Active";
      else newLevel = "Very Active";
    } else if (jobType === "Field Work") {
      if (days <= 1) newLevel = "Lightly Active";
      else if (days <= 3) newLevel = "Moderately Active";
      else newLevel = "Very Active";
    } else if (jobType === "Physical Labor") {
      newLevel = "Very Active";
    }

    setActivityLevel(newLevel);
  }, [exerciseDays, jobType]);

  // file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProfilePictureFile(file);
    setProfilePictureUrl(URL.createObjectURL(file));
  };

  // update profile
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInfo) return;

    const formData = new FormData();
    formData.append("name", name);
    formData.append("email", email);
    formData.append("age", age);
    formData.append("gender", gender);
    formData.append("profession", profession);
    formData.append("heightCm", heightCm);
    formData.append("currentWeightKg", currentWeightKg);
    formData.append("activityLevel", activityLevel); // ✅ auto-calculated
    formData.append("healthGoal", healthGoal);
    formData.append("dietPreference", dietPreference);
    formData.append("waterIntakeGoal", waterIntakeGoal);
    formData.append("exerciseDays", exerciseDays);
    formData.append("jobType", jobType);

    if (profilePictureFile) {
      formData.append("profilePicture", profilePictureFile);
    }

    try {
      const { token } = userInfo;
      const { data } = await axios.put(
        "http://localhost:5001/api/users/profile",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      localStorage.setItem("userInfo", JSON.stringify(data));
      setUserInfo(data);

      alert("Profile updated successfully!");
    } catch (err) {
      console.error(err);
      alert("Update failed.");
    }
  };

  // BMI calculation
  const bmi =
    heightCm && currentWeightKg
      ? (
          parseFloat(currentWeightKg) /
          (parseFloat(heightCm) / 100) ** 2
        ).toFixed(1)
      : "N/A";

  const getBMIBadge = () => {
    if (bmi === "N/A") return null;
    const value = parseFloat(bmi);
    if (value < 18.5)
      return <span className="badge underweight">Underweight</span>;
    if (value >= 18.5 && value <= 24.9)
      return <span className="badge healthy">Healthy</span>;
    if (value >= 25 && value <= 29.9)
      return <span className="badge overweight">Overweight</span>;
    return <span className="badge obese">Obese</span>;
  };

  if (loading)
    return <div className="profile-page-container">Loading...</div>;

  return (
    <div className="profile-page-container">
      <h1>Your Profile</h1>

      <form onSubmit={handleProfileUpdate} className="profile-form-grid">
        {/* LEFT SIDE */}
        <div className="profile-left-column">
          <div className="card profile-card">
            <div className="profile-picture-container">
              <img
                src={profilePictureUrl}
                alt="Profile"
                className="profile-picture"
              />
            </div>

            <label htmlFor="profile-upload" className="camera-icon-label">
              <FaCamera className="camera-icon" />
              <p>
                {profilePictureUrl === defaultProfilePic
                  ? "Add Photo"
                  : "Change Photo"}
              </p>
            </label>
            <input
              id="profile-upload"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />
          </div>

          <div className="card quick-stats">
            <h3>
              <FaChartBar /> Quick Stats
            </h3>
            <div className="stats-grid">
              <div>
                <p>BMI</p>
                <strong>{bmi}</strong>
                {getBMIBadge()}
              </div>
              <div>
                <p>Activity</p>
                <strong>{activityLevel}</strong>
              </div>
            </div>
          </div>

          <div className="card">
            <h3>
              <FaRulerVertical /> Physical Metrics
            </h3>
            <div className="form-row">
              <label>Height (cm)</label>
              <input
                type="number"
                value={heightCm}
                onChange={(e) => setHeightCm(e.target.value)}
              />
            </div>
            <div className="form-row">
              <label>Weight (Kg)</label>
              <input
                type="number"
                value={currentWeightKg}
                onChange={(e) => setCurrentWeightKg(e.target.value)}
              />
            </div>
          </div>

          {/* ✅ Motivation + Wellness Tip card */}
          <div className="card motivation-card">
            <h3>✨ Motivation</h3>
            <p>“Embrace the power of small, consistent actions taken each day.
These simple steps are the building blocks for remarkable achievements.
Over time, they compound to create the significant and lasting changes you seek.”</p>
            <hr />
            <h4>🌱 Wellness Tip</h4>
            <p>Drink a glass of water before every meal to improve digestion.</p>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="profile-right-column">
          <div className="card">
            <h3>
              <FaUser /> Basic Information
            </h3>
            <div className="form-row">
              <label>Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="form-row">
              <label>Email</label>
              <input
                type="email"
                value={email}
                readOnly
                className="input-readonly"
              />
            </div>
            <div className="form-row">
              <label>Age</label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
              />
            </div>
            <div className="form-row">
              <label>Gender</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
              >
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="form-row">
              <label>Profession</label>
              <input
                type="text"
                value={profession}
                onChange={(e) => setProfession(e.target.value)}
              />
            </div>
          </div>

          <div className="card">
            <h3>
              <FaHeartbeat /> Health Preferences
            </h3>
            <div className="form-row">
              <label>Health Goal</label>
              <select
                value={healthGoal}
                onChange={(e) => setHealthGoal(e.target.value)}
              >
                <option value="select">Select</option>
                <option value="Lose Weight">Lose Weight</option>
                <option value="Maintain">Maintain</option>
                <option value="Gain Muscle">Gain Muscle</option>
              </select>
            </div>
            <div className="form-row">
              <label>Dietary Preference</label>
              <select
                value={dietPreference}
                onChange={(e) => setDietPreference(e.target.value)}
              >
                <option value="select">Select</option>
                <option value="Vegetarian">Vegetarian</option>
                <option value="Vegan">Vegan</option>
                <option value="Non-Veg">Non-Veg</option>
                <option value="Eggetarian">Eggetarian</option>
              </select>
            </div>
            <div className="form-row">
              <label>Water Intake (glasses/day)</label>
              <select
                value={waterIntakeGoal}
                onChange={(e) => setWaterIntakeGoal(e.target.value)}
              >
                <option value="select">Select</option>
                <option value="4">4 glasses</option>
                <option value="6">6 glasses</option>
                <option value="8">8 glasses</option>
                <option value="10">10 glasses</option>
                <option value="12">12 glasses</option>
              </select>
            </div>
          </div>

          <div className="card">
            <h3>
              <FaRunning /> Lifestyle
            </h3>
            <div className="form-row">
              <label>Exercise Days (per week)</label>
              <input
                type="number"
                value={exerciseDays}
                onChange={(e) => setExerciseDays(e.target.value)}
              />
            </div>
            <div className="form-row">
              <label>Job Type</label>
              <select
                value={jobType}
                onChange={(e) => setJobType(e.target.value)}
              >
                <option value="Desk / Office Job">Desk / Office Job</option>
                <option value="Field Work">Field Work</option>
                <option value="Physical Labor">Physical Labor</option>
              </select>
            </div>
          </div>
        </div>

        {/* Update Button (outside cards) */}
        <div className="update-button-container">
          <button type="submit" className="update-button">
            Update Profile
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProfilePage;
