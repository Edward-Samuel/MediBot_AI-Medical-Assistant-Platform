const axios = require("axios");
const responseTemplates = require("./responseTemplates");

class GeminiService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    this.baseUrl = "https://generativelanguage.googleapis.com/v1beta/models";
    this.defaultModel =
      process.env.GEMINI_MODEL || "gemini-3.1-flash-lite-preview";
  }

  getApiUrl(model = this.defaultModel) {
    return `${this.baseUrl}/${model}:generateContent?key=${this.apiKey}`;
  }

  buildGenerationConfig(options = {}) {
    const config = {};

    if (typeof options.temperature === "number") {
      config.temperature = options.temperature;
    }

    if (typeof options.topP === "number") {
      config.topP = options.topP;
    }

    if (typeof options.maxTokens === "number") {
      config.maxOutputTokens = options.maxTokens;
    }

    if (options.responseMimeType) {
      config.responseMimeType = options.responseMimeType;
    }

    return config;
  }

  extractTextFromResponse(apiResponse) {
    const candidates = apiResponse?.candidates || [];

    for (const candidate of candidates) {
      const parts = candidate?.content?.parts || [];
      const text = parts
        .filter((part) => typeof part?.text === "string")
        .map((part) => part.text)
        .join("\n")
        .trim();

      if (text) {
        return text;
      }
    }

    return "";
  }

  extractUsage(apiResponse) {
    const usage = apiResponse?.usageMetadata || {};

    return {
      prompt_tokens: usage.promptTokenCount || 0,
      completion_tokens: usage.candidatesTokenCount || 0,
      total_tokens: usage.totalTokenCount || 0,
    };
  }

  normalizeImagePart(image) {
    const rawData = image?.data || image?.url || image?.preview;
    if (!rawData || typeof rawData !== "string") {
      return null;
    }

    const dataUrlMatch = rawData.match(/^data:(.*?);base64,(.*)$/);
    if (!dataUrlMatch) {
      return null;
    }

    return {
      inlineData: {
        mimeType: dataUrlMatch[1],
        data: dataUrlMatch[2],
      },
    };
  }

  normalizeParts(content) {
    if (typeof content === "string") {
      return [{ text: content }];
    }

    if (!Array.isArray(content)) {
      return [{ text: String(content || "") }];
    }

    return content
      .map((part) => {
        if (!part) {
          return null;
        }

        if (typeof part === "string") {
          return { text: part };
        }

        if (part.type === "text") {
          return { text: part.text || "" };
        }

        if (part.type === "image_url") {
          return this.normalizeImagePart(part.image_url || part);
        }

        return null;
      })
      .filter(Boolean);
  }

  buildGeminiPayload(messages, options = {}) {
    const systemMessages = messages
      .filter((message) => message.role === "system")
      .map((message) =>
        typeof message.content === "string"
          ? message.content
          : this.normalizeParts(message.content)
              .map((part) => part.text || "")
              .join("\n"),
      )
      .filter(Boolean);

    const contents = messages
      .filter((message) => message.role !== "system")
      .map((message) => ({
        role: message.role === "assistant" ? "model" : "user",
        parts: this.normalizeParts(message.content),
      }))
      .filter((message) => message.parts.length > 0);

    const payload = {
      contents,
      generationConfig: this.buildGenerationConfig(options),
    };

    if (systemMessages.length > 0) {
      payload.systemInstruction = {
        parts: [{ text: systemMessages.join("\n\n") }],
      };
    }

    return payload;
  }

  async callGemini(messages, options = {}) {
    const model = options.model || this.defaultModel;

    if (!this.apiKey) {
      throw new Error("Gemini API key not configured");
    }

    const payload = this.buildGeminiPayload(messages, options);

    console.log(
      `Gemini: sending request to ${model}${options.images?.length ? " (with images)" : ""}`,
    );

    const { data } = await axios.post(this.getApiUrl(model), payload, {
      headers: {
        "Content-Type": "application/json",
      },
      timeout: 45000,
    });

    return {
      raw: data,
      content: this.extractTextFromResponse(data),
      usage: this.extractUsage(data),
      finishReason: data?.candidates?.[0]?.finishReason || "STOP",
      model,
    };
  }

  async generateResponse(message, conversationHistory = [], options = {}) {
    const {
      model = this.defaultModel,
      images = [],
      language = "en",
      languageInfo = null,
      maxTokens = 800,
      temperature = 0.3,
      responseMimeType = null,
    } = options;

    try {
      const symptom = responseTemplates.extractSymptom(message, language);
      const structuredPrompt = this.buildStructuredPrompt(
        message,
        symptom,
        conversationHistory,
        language,
        languageInfo,
        images,
      );

      const apiResponse = await this.callGemini(structuredPrompt, {
        model,
        images,
        maxTokens,
        temperature,
        topP: 0.8,
        responseMimeType,
      });

      const processedContent = this.postProcessMedicalResponse(
        apiResponse.content,
        symptom,
        language,
        images?.length > 0,
      );

      return {
        content: processedContent,
        reasoning_details: null,
        model: apiResponse.model,
        usage: apiResponse.usage,
        finishReason: apiResponse.finishReason,
        isTemplate: false,
      };
    } catch (error) {
      console.error("Gemini API error:", error.response?.data || error.message);

      const errorMessage =
        language === "ta"
          ? "மன்னிக்கவும், தற்போது AI சேவை கிடைக்கவில்லை. பின்னர் முயற்சிக்கவும்."
          : "Sorry, the AI service is currently unavailable. Please try again later.";

      return {
        content: errorMessage,
        reasoning_details: null,
        model: "error",
        usage: { total_tokens: 0 },
        finishReason: "error",
        isTemplate: false,
        error: error.message,
      };
    }
  }

  buildStructuredPrompt(
    message,
    symptom,
    conversationHistory,
    language,
    languageInfo,
    images = [],
  ) {
    const messages = [];

    let systemPrompt = `You are MEDIBOT, a medical AI assistant.

RULES:
1. Answer the user's question directly first
2. Use natural, conversational language
3. No bold titles, headers, or numbered sections
4. Write in flowing paragraphs
5. Add medical disclaimers after answering
6. For emergencies, direct the user to immediate care

FORBIDDEN:
- Bold titles (**Title:** format)
- Numbered sections (1., 2., 3.)
- Template phrases
- Specific diagnoses
- Medication dosages`;

    if (images && images.length > 0) {
      systemPrompt += `

IMAGE ANALYSIS:
- Describe observations in general terms only
- Never diagnose from images
- Recommend professional evaluation
- Images cannot replace a medical examination`;
    }

    if (language !== "en") {
      systemPrompt += `\n\nRespond in ${languageInfo?.name || language}. Use clear medical terms.`;

      if (language === "ta") {
        systemPrompt += " Use simple Tamil words and respectful medical terminology.";
      }
    }

    messages.push({
      role: "system",
      content: systemPrompt,
    });

    if (conversationHistory && conversationHistory.length > 0) {
      conversationHistory.slice(-3).forEach((msg) => {
        messages.push({
          role: msg.role === "bot" ? "assistant" : msg.role,
          content: msg.content,
        });
      });
    }

    const userMessage = `${message}

Answer directly without titles or sections. Use natural paragraphs.`;

    if (images && images.length > 0) {
      const userMessageContent = [
        {
          type: "text",
          text: `${userMessage} Analyze the ${images.length} uploaded image(s) in natural paragraphs.`,
        },
      ];

      images.forEach((image) => {
        userMessageContent.push({
          type: "image_url",
          image_url: {
            url: image.data || image.preview || image.url,
          },
        });
      });

      messages.push({
        role: "user",
        content: userMessageContent,
      });
    } else {
      messages.push({
        role: "user",
        content: userMessage,
      });
    }

    return messages;
  }

  postProcessMedicalResponse(content) {
    return content;
  }

  async continueConversation(messages, newMessage, options = {}) {
    try {
      const {
        model = this.defaultModel,
        maxTokens = 800,
        temperature = 0.3,
      } = options;

      const updatedMessages = [
        ...messages.map((message) => ({
          role: message.role === "bot" ? "assistant" : message.role,
          content: message.content,
        })),
        {
          role: "user",
          content: newMessage,
        },
      ];

      const apiResponse = await this.callGemini(updatedMessages, {
        model,
        maxTokens,
        temperature,
        topP: 0.8,
      });

      const symptom = responseTemplates.extractSymptom(
        newMessage,
        options.language,
      );
      const processedContent = this.postProcessMedicalResponse(
        apiResponse.content,
        symptom,
        options.language,
      );

      return {
        content: processedContent,
        reasoning_details: null,
        model,
        usage: apiResponse.usage,
        finishReason: apiResponse.finishReason,
        isTemplate: false,
        fullConversation: [
          ...updatedMessages,
          {
            role: "assistant",
            content: processedContent,
          },
        ],
      };
    } catch (error) {
      console.error("Gemini conversation continuation error:", error);

      const symptom = responseTemplates.extractSymptom(
        newMessage,
        options.language,
      );
      const fallbackResponse = responseTemplates.generateMedicalResponse(
        newMessage,
        symptom,
        options.language,
      );

      return {
        content: fallbackResponse.formatted,
        reasoning_details: null,
        model: "fallback_template",
        usage: { total_tokens: 0 },
        finishReason: "fallback_template",
        isTemplate: true,
        error: error.message,
        fullConversation: [
          ...messages,
          {
            role: "user",
            content: newMessage,
          },
          {
            role: "assistant",
            content: fallbackResponse.formatted,
          },
        ],
      };
    }
  }

  buildMessages(
    message,
    conversationHistory = [],
    language = "en",
    languageInfo = null,
  ) {
    const messages = [];

    let systemPrompt = `You are MEDIBOT, a medical AI assistant.

GUIDELINES:
- Answer the user's question directly first
- Use natural, conversational language
- No bold titles or numbered sections
- Be empathetic and supportive
- Add medical disclaimers after answering
- Recommend professional consultation when needed

FORBIDDEN:
- Generic template phrases
- Bold headers or titles
- Formal structured responses`;

    if (language !== "en") {
      systemPrompt += `\n\nRespond in ${languageInfo?.name || language}.`;

      if (language === "ta") {
        systemPrompt += " Use simple Tamil medical terms.";
      }
    }

    messages.push({
      role: "system",
      content: systemPrompt,
    });

    if (conversationHistory && conversationHistory.length > 0) {
      conversationHistory.slice(-5).forEach((msg) => {
        messages.push({
          role: msg.role === "bot" ? "assistant" : msg.role,
          content: msg.content,
        });
      });
    }

    messages.push({
      role: "user",
      content: message,
    });

    return messages;
  }

  async checkAvailability() {
    try {
      if (!this.apiKey) {
        console.log("Gemini API key not configured");
        return false;
      }

      await this.callGemini(
        [{ role: "user", content: "Hello" }],
        { maxTokens: 10, temperature: 0 },
      );

      console.log("Gemini service is available");
      return true;
    } catch (error) {
      console.log("Gemini service unavailable:", error.message);
      return false;
    }
  }

  async getAvailableModels() {
    try {
      return [
        {
          id: this.defaultModel,
          name: "Gemini Flash Lite Preview",
          description: "Google Gemini flash-lite preview model used by MEDIBOT",
          reasoning: false,
          multimodal: true,
        },
      ];
    } catch (error) {
      console.error("Error getting Gemini models:", error);
      return [];
    }
  }

  async classifyAppointmentUiIntent(message, options = {}) {
    const {
      isAuthenticated = false,
      language = "en",
      modeHint = "booking",
    } = options;

    try {
      const prompt = `You classify appointment UI actions for a medical chatbot frontend.

User message: "${message}"
User authenticated: ${isAuthenticated ? "yes" : "no"}
Mode hint: ${modeHint}
Language: ${language}

Return ONLY valid JSON in this exact shape:
{"intent":"appointment_booking"|"appointment_booking_login_required"|"appointment_reschedule"|"appointment_cancel"|"appointment_none"}

Rules:
- If the user wants a new appointment and is authenticated, return "appointment_booking"
- If the user wants a new appointment and is not authenticated, return "appointment_booking_login_required"
- If the user wants to reschedule/change/modify an existing appointment, return "appointment_reschedule"
- If the user wants to cancel/delete/remove an existing appointment, return "appointment_cancel"
- If none apply, return "appointment_none"`;

      const apiResponse = await this.callGemini(
        [
          {
            role: "system",
            content: "You are a precise intent classifier. Output JSON only.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        {
          model: this.defaultModel,
          maxTokens: 80,
          temperature: 0,
          responseMimeType: "application/json",
        },
      );

      const parsed = JSON.parse(apiResponse.content || "{}");
      const validIntents = new Set([
        "appointment_booking",
        "appointment_booking_login_required",
        "appointment_reschedule",
        "appointment_cancel",
        "appointment_none",
      ]);

      return validIntents.has(parsed.intent)
        ? parsed.intent
        : "appointment_none";
    } catch (error) {
      console.error("Appointment UI intent classification error:", error);
      return "appointment_none";
    }
  }

  async analyzeSymptoms(symptoms, patientInfo = {}) {
    try {
      const { age, gender, urgency } = patientInfo;

      const prompt = `Analyze these symptoms for medical specialization recommendation:

Symptoms: ${symptoms.join(", ")}
Age: ${age || "Not specified"}
Gender: ${gender || "Not specified"}
Urgency: ${urgency || "Normal"}

STRICT REQUIREMENTS:
1. Only recommend from these specializations: General Medicine, Cardiology, Dermatology, Endocrinology, Gastroenterology, Neurology, Oncology, Orthopedics, Pediatrics, Psychiatry, Pulmonology, Radiology, Surgery, Urology, Gynecology, Ophthalmology, ENT, Emergency Medicine
2. Consider age appropriateness (Pediatrics for under 18)
3. Base recommendations on symptom patterns, not specific diagnoses
4. Provide educational reasoning only

Respond ONLY with valid JSON in this format:
{
  "primarySpecialization": "specialization name",
  "alternativeSpecializations": ["alt1", "alt2"],
  "urgencyLevel": "low",
  "reasoning": "educational explanation",
  "redFlags": ["symptom1"],
  "confidence": 0.8
}`;

      const apiResponse = await this.callGemini(
        [
          {
            role: "user",
            content: prompt,
          },
        ],
        {
          model: this.defaultModel,
          maxTokens: 600,
          temperature: 0.2,
          responseMimeType: "application/json",
        },
      );

      try {
        let parsedJson = JSON.parse(apiResponse.content);

        if (!parsedJson || typeof parsedJson !== "object") {
          throw new Error("Invalid JSON structure");
        }

        const analysis = this.validateSymptomAnalysis(
          parsedJson,
          symptoms,
          patientInfo,
        );

        console.log("Gemini analysis parsed successfully:", {
          primary: analysis.primarySpecialization,
          alternatives: analysis.alternativeSpecializations,
          confidence: analysis.confidence,
        });

        return {
          analysis,
          reasoning: null,
          model: apiResponse.model,
          isTemplate: false,
        };
      } catch (parseError) {
        console.error("Error parsing Gemini analysis:", parseError.message);
        console.log(
          "Raw response content (first 500 chars):",
          (apiResponse.content || "").substring(0, 500),
        );

        const fallbackAnalysis = this.generateFallbackAnalysis(
          symptoms,
          patientInfo,
        );

        return {
          analysis: fallbackAnalysis,
          reasoning: "Fallback analysis due to parsing error",
          model: "fallback_rules",
          isTemplate: true,
        };
      }
    } catch (error) {
      console.error("Gemini symptom analysis error:", error);

      const fallbackAnalysis = this.generateFallbackAnalysis(
        symptoms,
        patientInfo,
      );

      return {
        analysis: fallbackAnalysis,
        reasoning: null,
        model: "fallback_rules",
        isTemplate: true,
        error: error.message,
      };
    }
  }

  validateSymptomAnalysis(analysis, symptoms, patientInfo) {
    const validSpecializations = [
      "General Medicine",
      "Cardiology",
      "Dermatology",
      "Endocrinology",
      "Gastroenterology",
      "Neurology",
      "Oncology",
      "Orthopedics",
      "Pediatrics",
      "Psychiatry",
      "Pulmonology",
      "Radiology",
      "Surgery",
      "Urology",
      "Gynecology",
      "Ophthalmology",
      "ENT",
      "Emergency Medicine",
    ];

    if (!validSpecializations.includes(analysis.primarySpecialization)) {
      analysis.primarySpecialization = "General Medicine";
    }

    if (analysis.alternativeSpecializations) {
      analysis.alternativeSpecializations = analysis.alternativeSpecializations
        .filter((spec) => validSpecializations.includes(spec))
        .slice(0, 2);
    }

    if (!["low", "medium", "high"].includes(analysis.urgencyLevel)) {
      analysis.urgencyLevel = "medium";
    }

    if (
      typeof analysis.confidence !== "number" ||
      analysis.confidence < 0 ||
      analysis.confidence > 1
    ) {
      analysis.confidence = 0.7;
    }

    if (
      patientInfo.age &&
      patientInfo.age < 18 &&
      analysis.primarySpecialization !== "Pediatrics"
    ) {
      analysis.alternativeSpecializations =
        analysis.alternativeSpecializations || [];
      if (!analysis.alternativeSpecializations.includes("Pediatrics")) {
        analysis.alternativeSpecializations.unshift("Pediatrics");
      }
    }

    return analysis;
  }

  generateFallbackAnalysis(symptoms, patientInfo) {
    const { age, urgency } = patientInfo;

    const symptomMap = {
      "chest pain": "Cardiology",
      heart: "Cardiology",
      cardiac: "Cardiology",
      palpitation: "Cardiology",
      skin: "Dermatology",
      rash: "Dermatology",
      acne: "Dermatology",
      eczema: "Dermatology",
      headache: "Neurology",
      migraine: "Neurology",
      seizure: "Neurology",
      "back pain": "Orthopedics",
      joint: "Orthopedics",
      fracture: "Orthopedics",
      arthritis: "Orthopedics",
      stomach: "Gastroenterology",
      nausea: "Gastroenterology",
      diarrhea: "Gastroenterology",
      constipation: "Gastroenterology",
      ear: "ENT",
      throat: "ENT",
      nose: "ENT",
      sinus: "ENT",
      eye: "Ophthalmology",
      vision: "Ophthalmology",
      blind: "Ophthalmology",
      breathing: "Pulmonology",
      cough: "Pulmonology",
      asthma: "Pulmonology",
      lung: "Pulmonology",
      anxiety: "Psychiatry",
      depression: "Psychiatry",
      mental: "Psychiatry",
      diabetes: "Endocrinology",
      thyroid: "Endocrinology",
      hormone: "Endocrinology",
      pregnancy: "Gynecology",
      menstrual: "Gynecology",
      gynecological: "Gynecology",
      urinary: "Urology",
      kidney: "Urology",
      bladder: "Urology",
    };

    let primarySpecialization = "General Medicine";
    const alternativeSpecializations = [];
    let confidence = 0.6;

    const lowerSymptoms = symptoms.map((s) => s.toLowerCase()).join(" ");

    let matchCount = 0;
    for (const [keyword, specialization] of Object.entries(symptomMap)) {
      if (lowerSymptoms.includes(keyword)) {
        if (matchCount === 0) {
          primarySpecialization = specialization;
        } else if (!alternativeSpecializations.includes(specialization)) {
          alternativeSpecializations.push(specialization);
        }
        matchCount++;
      }
    }

    if (matchCount > 0) {
      confidence = Math.min(0.6 + matchCount * 0.1, 0.9);
    }

    if (age && age < 18 && primarySpecialization !== "Pediatrics") {
      alternativeSpecializations.unshift("Pediatrics");
    }

    let urgencyLevel = "medium";
    if (urgency === "urgent" || urgency === "high") {
      urgencyLevel = "high";
      if (!alternativeSpecializations.includes("Emergency Medicine")) {
        alternativeSpecializations.push("Emergency Medicine");
      }
    }

    return {
      primarySpecialization,
      alternativeSpecializations: alternativeSpecializations.slice(0, 2),
      urgencyLevel,
      reasoning: `Based on symptom analysis (${matchCount} matches found) - please consult a healthcare professional for proper evaluation`,
      redFlags: this.identifyRedFlags(symptoms),
      confidence,
      isFallback: true,
    };
  }

  identifyRedFlags(symptoms) {
    const redFlagKeywords = [
      "severe chest pain",
      "difficulty breathing",
      "loss of consciousness",
      "severe bleeding",
      "severe headache",
      "sudden vision loss",
      "severe abdominal pain",
      "high fever",
      "seizure",
      "stroke symptoms",
    ];

    const lowerSymptoms = symptoms.map((s) => s.toLowerCase()).join(" ");
    return redFlagKeywords.filter((flag) =>
      lowerSymptoms.includes(flag.toLowerCase()),
    );
  }
}

module.exports = new GeminiService();
