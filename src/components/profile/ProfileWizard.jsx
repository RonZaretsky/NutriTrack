
import React, { useState, useEffect } from "react";
import { userProfileApi } from "@/api/userProfileApi";
import { userApi } from "@/api/userApi";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { 
  User as UserIcon, 
  Target, 
  Activity, 
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Scale,
  Ruler,
  Calendar,
  Minus
} from "lucide-react";
import { logEvent } from '@/components/utils/logger';

export default function ProfileWizard({ existingProfile, onSave, onCancel }) {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    age: '',
    height: '',
    weight: '',
    gender: '',
    body_fat_percentage: '', // Added new field
    goal: '',
    workout_frequency: '',
    target_rate: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    logEvent('ProfileWizard', 'COMPONENT_MOUNT', { hasExistingProfile: !!existingProfile });
    if (existingProfile) {
      setFormData({
        age: existingProfile.age?.toString() || '',
        height: existingProfile.height?.toString() || '',
        weight: existingProfile.weight?.toString() || '',
        gender: existingProfile.gender || '',
        body_fat_percentage: existingProfile.body_fat_percentage?.toString() || '', // Initialize new field
        goal: existingProfile.goal || '',
        workout_frequency: existingProfile.workout_frequency?.toString() || '',
        target_rate: existingProfile.target_rate?.toString() || ''
      });
    }
  }, [existingProfile]);

  const handleInputChange = (field, value) => {
    logEvent('ProfileWizard', 'INPUT_CHANGE', { field, value });
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: false
      }));
    }
  };

  const calculateCalories = () => {
    const { age, height, weight, gender, goal, workout_frequency, target_rate, body_fat_percentage } = formData;
    
    let bmr;
    
    const parsedWeight = parseFloat(weight);
    const parsedHeight = parseFloat(height);
    const parsedAge = parseFloat(age);
    const parsedBodyFatPercentage = parseFloat(body_fat_percentage);

    // Use Katch-McArdle formula if body fat percentage is available and valid
    if (!isNaN(parsedBodyFatPercentage) && parsedBodyFatPercentage > 0 && parsedBodyFatPercentage < 100 && !isNaN(parsedWeight) && parsedWeight > 0) {
      const leanBodyMass = parsedWeight * (1 - parsedBodyFatPercentage / 100);
      bmr = 370 + (21.6 * leanBodyMass);
    } else {
      // Use Harris-Benedict formula as fallback
      if (!isNaN(parsedWeight) && !isNaN(parsedHeight) && !isNaN(parsedAge)) {
        if (gender === 'male') {
          bmr = 88.362 + (13.397 * parsedWeight) + (4.799 * parsedHeight) - (5.677 * parsedAge);
        } else {
          bmr = 447.593 + (9.247 * parsedWeight) + (3.098 * parsedHeight) - (4.330 * parsedAge);
        }
      } else {
        bmr = 0; // Or some default/error value if core data is missing
      }
    }

    const activityFactors = { 0: 1.2, 1: 1.375, 2: 1.375, 3: 1.55, 4: 1.55, 5: 1.725, 6: 1.725, 7: 1.9 };
    const tdee = bmr * (activityFactors[parseInt(workout_frequency)] || 1.2);
    
    let dailyCalories = tdee;
    if (goal === 'lose' && !isNaN(parseFloat(target_rate))) {
      dailyCalories = tdee - ((parseFloat(target_rate) * 7700) / 30);
    } else if (goal === 'gain' && !isNaN(parseFloat(target_rate))) {
      dailyCalories = tdee + ((parseFloat(target_rate) * 7700) / 30);
    }

    return {
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
      daily_calories: Math.round(Math.max(1200, dailyCalories)) // Ensure minimum healthy calorie intake
    };
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const calories = calculateCalories();
      const profileData = {
        ...formData,
        age: parseInt(formData.age),
        height: parseFloat(formData.height),
        weight: parseFloat(formData.weight),
        body_fat_percentage: formData.body_fat_percentage ? parseFloat(formData.body_fat_percentage) : null, // Store as number or null
        workout_frequency: parseInt(formData.workout_frequency),
        target_rate: formData.goal === 'maintain' ? 0 : parseFloat(formData.target_rate),
        setup_completed: true,
        ...calories
      };

      logEvent('ProfileWizard', 'SUBMIT', {
        isUpdate: !!(existingProfile && existingProfile.id),
        data: { ...profileData, weight: 'REDACTED' }
      });

      if (existingProfile && existingProfile.id) {
        await userProfileApi.update(existingProfile.id, profileData);
      } else {
        const user = await userApi.me();
        await userProfileApi.create({ ...profileData, display_name: user.full_name });
      }
      
      onSave();
    } catch (error) {
      logEvent('ProfileWizard', 'SUBMIT_ERROR', { error: error.message }, 'ERROR');
      console.error("Error saving profile:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const validateStep = (step) => {
    const newErrors = {};
    
    switch (step) {
      case 1:
        if (!formData.age) newErrors.age = true;
        if (!formData.height) newErrors.height = true;
        if (!formData.weight) newErrors.weight = true;
        if (!formData.gender) newErrors.gender = true;
        // body_fat_percentage is optional, no validation needed here
        break;
      case 2:
        if (!formData.goal) newErrors.goal = true;
        break;
      case 3:
        if (!formData.workout_frequency) newErrors.workout_frequency = true;
        break;
      case 4:
        // Only validate target_rate if goal is not 'maintain'
        if (formData.goal !== 'maintain' && !formData.target_rate) newErrors.target_rate = true;
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      logEvent('ProfileWizard', 'NEXT_STEP', { from: currentStep, to: currentStep + 1 });
      setCurrentStep(prev => Math.min(prev + 1, 5));
    } else {
      logEvent('ProfileWizard', 'VALIDATION_ERROR', { step: currentStep, errors: Object.keys(errors) });
    }
  };
  
  const prevStep = () => {
    logEvent('ProfileWizard', 'PREVIOUS_STEP', { from: currentStep, to: currentStep - 1 });
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };
  
  const getStepTitle = () => {
    const titles = {
      1: "פרטים אישיים",
      2: "מה המטרה שלך?",
      3: "תדירות האימונים",
      4: "קצב השינוי הרצוי",
      5: "סיכום ואישור",
    };
    return titles[currentStep] || "";
  };

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
            הגדרת מטרות
          </h1>
          <p className="text-slate-600 text-lg">
            בואו נכיר ונתאים לך תכנית אישית
          </p>
        </div>

        <div className="mb-8">
          <Progress value={(currentStep / 5) * 100} className="h-2 bg-slate-200" />
        </div>

        <Card className="glass-effect shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-xl font-bold text-slate-900">
              {getStepTitle()}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1: Personal Details */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="age" className="flex items-center gap-2 mb-2">
                      <Calendar className="w-4 h-4 text-blue-500" />
                      גיל
                    </Label>
                    <Input
                      id="age"
                      type="number"
                      placeholder="הזן גיל"
                      value={formData.age}
                      onChange={(e) => handleInputChange('age', e.target.value)}
                      className={errors.age ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}
                    />
                    {errors.age && (
                      <p className="text-red-500 text-sm mt-1">נא להזין גיל</p>
                    )}
                  </div>
                  <div>
                    <Label className="flex items-center gap-2 mb-2">
                      <UserIcon className="w-4 h-4 text-blue-500" />
                      מין
                    </Label>
                    <Select value={formData.gender} onValueChange={(value) => handleInputChange('gender', value)}>
                      <SelectTrigger className={errors.gender ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}>
                        <SelectValue placeholder="בחר מין" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">זכר</SelectItem>
                        <SelectItem value="female">נקבה</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.gender && (
                      <p className="text-red-500 text-sm mt-1">נא לבחור מין</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="height" className="flex items-center gap-2 mb-2">
                      <Ruler className="w-4 h-4 text-blue-500" />
                      גובה (ס"מ)
                    </Label>
                    <Input
                      id="height"
                      type="number"
                      placeholder="הזן גובה"
                      value={formData.height}
                      onChange={(e) => handleInputChange('height', e.target.value)}
                      className={errors.height ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}
                    />
                    {errors.height && (
                      <p className="text-red-500 text-sm mt-1">נא להזין גובה</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="weight" className="flex items-center gap-2 mb-2">
                      <Scale className="w-4 h-4 text-blue-500" />
                      משקל (ק"ג)
                    </Label>
                    <Input
                      id="weight"
                      type="number"
                      step="0.1"
                      placeholder="הזן משקל"
                      value={formData.weight}
                      onChange={(e) => handleInputChange('weight', e.target.value)}
                      className={errors.weight ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}
                    />
                    {errors.weight && (
                      <p className="text-red-500 text-sm mt-1">נא להזין משקל</p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="body_fat_percentage" className="flex items-center gap-2 mb-2">
                    <Target className="w-4 h-4 text-green-500" />
                    אחוז שומן בגוף (אופציונלי)
                  </Label>
                  <Input
                    id="body_fat_percentage"
                    type="number"
                    step="0.1"
                    min="3"
                    max="50"
                    placeholder="למשל: 15.5 (אופציונלי)"
                    value={formData.body_fat_percentage}
                    onChange={(e) => handleInputChange('body_fat_percentage', e.target.value)}
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    ערך זה יעזור לחשב יעד קלורי מדויק יותר. אם לא יודע - השאר ריק.
                  </p>
                </div>
              </div>
            )}

            {/* Step 2: Goal */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <p className="text-center text-slate-600 mb-6">
                  מה המטרה העיקרית שלך?
                </p>
                {errors.goal && (
                  <p className="text-red-500 text-sm text-center mb-4">נא לבחור מטרה</p>
                )}
                <div className="grid gap-4">
                  <Button
                    variant={formData.goal === 'lose' ? 'default' : 'outline'}
                    className={`h-16 text-right justify-start ${
                      formData.goal === 'lose'
                        ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white'
                        : 'hover:bg-red-50'
                    } ${errors.goal ? 'border-red-500' : ''}`}
                    onClick={() => handleInputChange('goal', 'lose')}
                  >
                    <TrendingDown className="w-6 h-6 ml-3" />
                    <div>
                      <div className="font-semibold">ירידה במשקל</div>
                      <div className="text-sm opacity-80">אני רוצה לרדת במשקל</div>
                    </div>
                  </Button>

                  <Button
                    variant={formData.goal === 'maintain' ? 'default' : 'outline'}
                    className={`h-16 text-right justify-start ${
                      formData.goal === 'maintain'
                        ? 'bg-gradient-to-r from-blue-500 to-green-500 text-white'
                        : 'hover:bg-blue-50'
                    } ${errors.goal ? 'border-red-500' : ''}`}
                    onClick={() => handleInputChange('goal', 'maintain')}
                  >
                    <Minus className="w-6 h-6 ml-3" />
                    <div>
                      <div className="font-semibold">שמירה על המשקל</div>
                      <div className="text-sm opacity-80">אני מרוצה מהמשקל הנוכחי</div>
                    </div>
                  </Button>

                  <Button
                    variant={formData.goal === 'gain' ? 'default' : 'outline'}
                    className={`h-16 text-right justify-start ${
                      formData.goal === 'gain'
                        ? 'bg-gradient-to-r from-green-500 to-blue-500 text-white'
                        : 'hover:bg-green-50'
                    } ${errors.goal ? 'border-red-500' : ''}`}
                    onClick={() => handleInputChange('goal', 'gain')}
                  >
                    <TrendingUp className="w-6 h-6 ml-3" />
                    <div>
                      <div className="font-semibold">עלייה במשקל</div>
                      <div className="text-sm opacity-80">אני רוצה לעלות במשקל</div>
                    </div>
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Workout Frequency */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <Activity className="w-12 h-12 mx-auto text-blue-500 mb-4" />
                  <p className="text-slate-600">
                    כמה פעמים בשבוע אתה מתאמן?
                  </p>
                </div>
                <div>
                  <Label htmlFor="workout_frequency" className="mb-4 block text-center font-medium">
                    תדירות אימונים בשבוע
                  </Label>
                  <Select value={formData.workout_frequency} onValueChange={(value) => handleInputChange('workout_frequency', value)}>
                    <SelectTrigger className={`h-12 ${errors.workout_frequency ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}`}>
                      <SelectValue placeholder="בחר תדירות אימונים" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">לא מתאמן בכלל</SelectItem>
                      <SelectItem value="1">פעם בשבוע</SelectItem>
                      <SelectItem value="2">פעמיים בשבוע</SelectItem>
                      <SelectItem value="3">3 פעמים בשבוע</SelectItem>
                      <SelectItem value="4">4 פעמים בשבוע</SelectItem>
                      <SelectItem value="5">5 פעמים בשבוע</SelectItem>
                      <SelectItem value="6">6 פעמים בשבוע</SelectItem>
                      <SelectItem value="7">כל יום</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.workout_frequency && (
                    <p className="text-red-500 text-sm mt-1 text-center">נא לבחור תדירות אימונים</p>
                  )}
                </div>
              </div>
            )}

            {/* Step 4: Target Rate */}
            {currentStep === 4 && formData.goal !== 'maintain' && (
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <Target className="w-12 h-12 mx-auto text-green-500 mb-4" />
                  <p className="text-slate-600">
                    באיזה קצב תרצה {formData.goal === 'lose' ? 'לרדת' : 'לעלות'} במשקל?
                  </p>
                </div>
                <div>
                  <Label htmlFor="target_rate" className="mb-4 block text-center font-medium">
                    קילוגרמים לחודש
                  </Label>
                  <Input
                    id="target_rate"
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="2"
                    placeholder="הזן קצב שינוי"
                    value={formData.target_rate}
                    onChange={(e) => handleInputChange('target_rate', e.target.value)}
                    className={`h-12 text-center text-lg font-semibold ${errors.target_rate ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}`}
                  />
                  {errors.target_rate && (
                    <p className="text-red-500 text-sm mt-1 text-center">נא להזין קצב שינוי</p>
                  )}
                </div>
              </div>
            )}

            {currentStep === 4 && formData.goal === 'maintain' && (
               <div className="text-center p-8">
                  <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-green-500" />
                  <h3 className="text-lg font-semibold">מעולה!</h3>
                  <p className="text-slate-600">אין צורך להגדיר קצב למטרת שמירה על המשקל.</p>
              </div>
            )}

            {/* Step 5: Summary */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <CheckCircle2 className="w-16 h-16 mx-auto text-green-500 mb-4" />
                  <h3 className="text-xl font-semibold text-slate-900">סיכום הנתונים שלך</h3>
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-green-50 p-6 rounded-xl space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <p className="text-sm text-slate-600">גיל</p>
                      <p className="font-bold text-lg">{formData.age}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-slate-600">מין</p>
                      <p className="font-bold text-lg">{formData.gender === 'male' ? 'זכר' : 'נקבה'}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-slate-600">גובה</p>
                      <p className="font-bold text-lg">{formData.height} ס"מ</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-slate-600">משקל</p>
                      <p className="font-bold text-lg">{formData.weight} ק"ג</p>
                    </div>
                  </div>

                  {formData.body_fat_percentage && (
                    <div className="text-center border-t border-slate-200 pt-4">
                      <p className="text-sm text-slate-600">אחוז שומן בגוף</p>
                      <p className="font-bold text-lg text-green-600">{formData.body_fat_percentage}%</p>
                      <p className="text-xs text-slate-500">יעזור לחישוב מדויק יותר</p>
                    </div>
                  )}

                  <div className="border-t border-slate-200 pt-4">
                    <div className="text-center mb-4">
                      <p className="text-sm text-slate-600">המטרה שלך</p>
                      <p className="font-bold text-lg">
                        {formData.goal === 'lose' ? 'ירידה במשקל' : formData.goal === 'gain' ? 'עלייה במשקל' : 'שמירה על המשקל'}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <p className="text-sm text-slate-600">אימונים בשבוע</p>
                        <p className="font-bold text-lg">{formData.workout_frequency}</p>
                      </div>
                      {formData.goal !== 'maintain' && (
                        <div className="text-center">
                          <p className="text-sm text-slate-600">קצב רצוי</p>
                          <p className="font-bold text-lg">{formData.target_rate} ק"ג/חודש</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-xl text-center">
                  <h4 className="font-bold text-xl text-slate-900 mb-2">היעד הקלורי היומי שלך</h4>
                  <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                    {calculateCalories().daily_calories}
                  </div>
                  <p className="text-slate-600 mt-2">קלוריות ביום</p>
                  <div className="grid grid-cols-2 gap-4 mt-6 text-sm">
                    <div>
                      <p className="text-slate-600">BMR</p>
                      <p className="font-semibold text-lg">{calculateCalories().bmr}</p>
                    </div>
                    <div>
                      <p className="text-slate-600">TDEE</p>
                      <p className="font-semibold text-lg">{calculateCalories().tdee}</p>
                    </div>
                  </div>
                  {formData.body_fat_percentage && (
                    <p className="text-xs text-green-600 mt-2">
                      ✓ חושב עם נוסחת Katch-McArdle (מדויק יותר)
                    </p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-between mt-8">
          {currentStep > 1 ? (
            <Button variant="outline" onClick={prevStep} className="border-slate-300 hover:bg-slate-50">
              <ArrowRight className="w-4 h-4 ml-2" />
              חזור
            </Button>
          ) : (
            <Button variant="outline" onClick={onCancel} disabled={!existingProfile?.setup_completed} className="border-slate-300 hover:bg-slate-50">
                ביטול
            </Button>
          )}

          {currentStep < 5 ? (
            <Button onClick={nextStep} className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600">
              המשך
              <ArrowLeft className="w-4 h-4 mr-2" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600">
              {isSubmitting ? 'שומר...' : 'שמור והתחל מעקב!'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
