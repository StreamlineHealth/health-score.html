/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

// Ensure API_KEY is used as per guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const healthForm = document.getElementById('healthForm') as HTMLFormElement;
const calculateBtn = document.getElementById('calculateBtn') as HTMLButtonElement;
const loadingIndicator = document.getElementById('loadingIndicator') as HTMLDivElement;
const errorDisplay = document.getElementById('errorDisplay') as HTMLDivElement;
const resultsSection = document.getElementById('resultsSection') as HTMLDivElement;
const scoreDisplay = document.getElementById('scoreDisplay') as HTMLDivElement;
const scoreValueEl = document.getElementById('scoreValue') as HTMLParagraphElement;
const qualitativeScoreEl = document.getElementById('qualitativeScore') as HTMLParagraphElement;
const adviceTextEl = document.getElementById('adviceText') as HTMLParagraphElement;

if (healthForm && calculateBtn && loadingIndicator && errorDisplay && scoreDisplay && scoreValueEl && qualitativeScoreEl && adviceTextEl) {
    healthForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (calculateBtn.disabled) return;

        // Clear previous results and errors
        errorDisplay.style.display = 'none';
        errorDisplay.textContent = '';
        scoreDisplay.style.display = 'none';
        resultsSection.style.display = 'block'; // Show results section for loading/content
        loadingIndicator.style.display = 'block';
        calculateBtn.disabled = true;
        calculateBtn.setAttribute('aria-busy', 'true');

        const formData = new FormData(healthForm);
        const age = formData.get('age') as string;
        const gender = formData.get('gender') as string;
        const heightFt = formData.get('height_ft') as string;
        const heightIn = formData.get('height_in') as string;
        const weight = formData.get('weight') as string; // Now in lbs
        const systolicBp = formData.get('systolic_bp') as string;
        const diastolicBp = formData.get('diastolic_bp') as string;
        const sleep = formData.get('sleep') as string;
        const exercise = formData.get('exercise') as string;
        const fruitsVeggies = formData.get('fruitsVeggies') as string;
        const smoker = formData.get('smoker') as string;
        const diabetesStatus = formData.get('diabetes_status') as string;
        const lowCarbDiet = formData.get('low_carb_diet') as string;
        const ldlCholesterol = formData.get('ldl_cholesterol') as string;
        const hdlCholesterol = formData.get('hdl_cholesterol') as string;
        const bloodSugar = formData.get('blood_sugar') as string;

        const prompt = `
You are a helpful AI assistant specialized in health and wellness.
Based on the following health metrics, provide a health score from 1 to 100, a qualitative description of the score (e.g., "Excellent", "Good", "Fair", "Needs Improvement"), and 2-3 short, actionable pieces of advice.
Return the response strictly in the following JSON format:
{
  "score": <integer>,
  "qualitativeScore": "<string>",
  "advice": "<string for advice, use newline characters \\n for multiple points if needed>"
}

Metrics:
- Age: ${age} years
- Gender: ${gender}
- Height: ${heightFt} ft ${heightIn} in
- Weight: ${weight} lbs
- Blood Pressure: ${systolicBp}/${diastolicBp} mmHg
- LDL Cholesterol: ${ldlCholesterol} mg/dL
- HDL Cholesterol: ${hdlCholesterol} mg/dL
- Average Blood Sugar Level: ${bloodSugar} mg/dL
- Average Sleep: ${sleep} hours/night
- Exercise Days: ${exercise} days/week
- Fruits/Veggies Servings: ${fruitsVeggies} servings/day
- Smoker: ${smoker}
- Diabetes Status: ${diabetesStatus}
- Low Carb Diet: ${lowCarbDiet}

Do not include any explanations or text outside of the JSON object itself. Ensure the advice is practical and encouraging.
The health score should reflect a holistic view of the provided metrics.
`;

        try {
            // Use 'gemini-2.5-flash-preview-04-17' as per guidelines
            const response: GenerateContentResponse = await ai.models.generateContent({
                model: 'gemini-2.5-flash-preview-04-17',
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                }
            });
            
            let jsonStr = response.text.trim();
            // Remove potential markdown fences for JSON
            const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
            const match = jsonStr.match(fenceRegex);
            if (match && match[2]) {
                jsonStr = match[2].trim();
            }

            const result = JSON.parse(jsonStr);

            if (result && typeof result.score === 'number' && typeof result.qualitativeScore === 'string' && typeof result.advice === 'string') {
                scoreValueEl.textContent = result.score.toString();
                qualitativeScoreEl.textContent = result.qualitativeScore;
                adviceTextEl.innerHTML = result.advice.replace(/\\n/g, '<br>'); // Display newlines correctly
                scoreDisplay.style.display = 'block';
            } else {
                throw new Error("Received incomplete or invalid data structure from API.");
            }

        } catch (error) {
            console.error("Error calculating health score:", error);
            errorDisplay.textContent = `An error occurred: ${error instanceof Error ? error.message : String(error)}. Please try again.`;
            errorDisplay.style.display = 'block';
        } finally {
            loadingIndicator.style.display = 'none';
            calculateBtn.disabled = false;
            calculateBtn.removeAttribute('aria-busy');
        }
    });
} else {
    console.error("One or more essential DOM elements are missing.");
    const body = document.body;
    const errorMsg = document.createElement('p');
    errorMsg.textContent = "Critical error: UI elements could not be found. The application cannot start.";
    errorMsg.style.color = 'red';
    errorMsg.style.fontWeight = 'bold';
    body.insertBefore(errorMsg, body.firstChild);
}