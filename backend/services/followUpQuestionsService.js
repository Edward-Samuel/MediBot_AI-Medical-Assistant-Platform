const openRouterService = require("./openRouterService");

class FollowUpQuestionsService {
  async generateFollowUpQuestions(
    lastBotMessage,
    lastUserMessage,
    conversationContext,
    language = "en",
    count = 3,
  ) {
    console.log(`Generating ${count} follow-up questions in ${language}...`);

    const recentContext = conversationContext
      .slice(-4)
      .map(
        (msg) =>
          `${msg.role === "user" ? "Patient" : "Assistant"}: ${msg.content.substring(0, 200)}`,
      )
      .join("\n");

    const prompt = `You are a medical assistant helping patients. Based on this conversation, suggest ${count} natural follow-up questions the patient might want to ask.

Recent conversation:
${recentContext}

Patient's last question: "${lastUserMessage}"
Your response: "${lastBotMessage.substring(0, 300)}..."

Generate ${count} short, conversational follow-up questions in ${language} that:
- Are directly related to the medical topic discussed
- Help the patient get more specific or actionable information
- Sound natural, as if the patient is asking
- Are concise (8-12 words maximum)
- End with a question mark

Format: Return ONLY the questions, one per line, no numbering, no explanations.

Example format:
What are the warning signs I should watch for?
Should I schedule an appointment with a specialist?
How long does recovery typically take?`;

    const response = await openRouterService.generateResponse(prompt, [], {
      maxTokens: 200,
      temperature: 0.8,
      language,
    });

    console.log(
      "Gemini raw follow-up response:",
      response.content.substring(0, 200),
    );

    const questions = response.content
      .split("\n")
      .map((question) => question.trim())
      .filter((question) => {
        const cleaned = question.replace(/^[\d.\-*)]+\s*/, "").trim();
        return cleaned.length > 5 && cleaned.includes("?");
      })
      .map((question) => question.replace(/^[\d.\-*)]+\s*/, "").trim())
      .slice(0, count);

    if (questions.length === 0) {
      throw new Error("Gemini did not return any valid follow-up questions");
    }

    return questions;
  }

  getContextualQuestions(intent, language = "en") {
    const contextualQuestions = {
      appointment: {
        en: [
          "What specialization do I need?",
          "Can I see available time slots?",
          "How do I reschedule an appointment?",
        ],
        es: [
          "Â¿QuÃ© especializaciÃ³n necesito?",
          "Â¿Puedo ver los horarios disponibles?",
          "Â¿CÃ³mo reprogramo una cita?",
        ],
        ta: [
          "à®Žà®©à®•à¯à®•à¯ à®Žà®©à¯à®© à®šà®¿à®±à®ªà¯à®ªà¯ à®¤à¯‡à®µà¯ˆ?",
          "à®•à®¿à®Ÿà¯ˆà®•à¯à®•à¯à®®à¯ à®¨à¯‡à®°à®™à¯à®•à®³à¯ˆ à®ªà®¾à®°à¯à®•à¯à®•à®²à®¾à®®à®¾?",
          "à®…à®ªà¯à®ªà®¾à®¯à®¿à®£à¯à®Ÿà¯à®®à¯†à®©à¯à®Ÿà¯à®Ÿà¯ˆ à®Žà®ªà¯à®ªà®Ÿà®¿ à®®à®¾à®±à¯à®±à¯à®µà®¤à¯?",
        ],
      },
      faq: {
        en: [
          "Can you explain this in simpler terms?",
          "What are the treatment options?",
          "Are there any side effects?",
        ],
        es: [
          "Â¿Puedes explicar esto en tÃ©rminos mÃ¡s simples?",
          "Â¿CuÃ¡les son las opciones de tratamiento?",
          "Â¿Hay algÃºn efecto secundario?",
        ],
        ta: [
          "à®‡à®¤à¯ˆ à®Žà®³à®¿à®®à¯ˆà®¯à®¾à®• à®µà®¿à®³à®•à¯à®• à®®à¯à®Ÿà®¿à®¯à¯à®®à®¾?",
          "à®šà®¿à®•à®¿à®šà¯à®šà¯ˆ à®µà®¿à®°à¯à®ªà¯à®ªà®™à¯à®•à®³à¯ à®Žà®©à¯à®©?",
          "à®à®¤à¯‡à®©à¯à®®à¯ à®ªà®•à¯à®• à®µà®¿à®³à¯ˆà®µà¯à®•à®³à¯ à®‰à®³à¯à®³à®¤à®¾?",
        ],
      },
      general: {
        en: [
          "What should I do next?",
          "Is this condition serious?",
          "When should I see a doctor?",
        ],
        es: [
          "Â¿QuÃ© debo hacer a continuaciÃ³n?",
          "Â¿Es grave esta condiciÃ³n?",
          "Â¿CuÃ¡ndo debo ver a un mÃ©dico?",
        ],
        ta: [
          "à®¨à®¾à®©à¯ à®…à®Ÿà¯à®¤à¯à®¤à¯ à®Žà®©à¯à®© à®šà¯†à®¯à¯à®¯ à®µà¯‡à®£à¯à®Ÿà¯à®®à¯?",
          "à®‡à®¨à¯à®¤ à®¨à®¿à®²à¯ˆ à®¤à¯€à®µà®¿à®°à®®à®¾à®©à®¤à®¾?",
          "à®¨à®¾à®©à¯ à®Žà®ªà¯à®ªà¯‹à®¤à¯ à®®à®°à¯à®¤à¯à®¤à¯à®µà®°à¯ˆ à®ªà®¾à®°à¯à®•à¯à®• à®µà¯‡à®£à¯à®Ÿà¯à®®à¯?",
        ],
      },
    };

    return (
      contextualQuestions[intent]?.[language] ||
      contextualQuestions.general[language] ||
      contextualQuestions.general.en
    );
  }
}

module.exports = new FollowUpQuestionsService();
