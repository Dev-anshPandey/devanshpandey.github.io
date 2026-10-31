import { fallback } from "../data/profile";
export type FastReply = {
  text: string;
  expression: "happy" | "idle" | "surprised" | "oops";
  suggestions: string[];
};
const defaults = [
  "Tell me about your RAG work.",
  "What have you built?",
  "How can I contact you?",
];
export function languageOf(text: string): "en" | "hi" | "es" | "fr" {
  if (
    /[\u0900-\u097f]/.test(text) ||
    /\b(namaste|namaskar|dhanyavad|shukriya)\b/i.test(text)
  )
    return "hi";
  if (
    /\b(hola|gracias|adiós|buenos días|qué|experiencia|proyectos)\b/i.test(text)
  )
    return "es";
  if (/\b(bonjour|merci|salut|au revoir|compétences)\b/i.test(text))
    return "fr";
  return "en";
}
export function fastReply(input: string): FastReply | null {
  const text = input
    .trim()
    .toLowerCase()
    .replace(/[!?.।]+$/g, "")
    .trim();
  const lang = languageOf(input);
  const suggestions =
    lang === "hi"
      ? [
          "अपने AI अनुभव के बारे में बताइए।",
          "आपने कौन से प्रोजेक्ट बनाए हैं?",
          "आपसे संपर्क कैसे करूँ?",
        ]
      : lang === "es"
        ? [
            "Cuéntame sobre tu experiencia en IA.",
            "¿Qué proyectos has creado?",
            "¿Cómo puedo contactarte?",
          ]
        : lang === "fr"
          ? [
              "Parle-moi de ton expérience en IA.",
              "Quels projets as-tu créés ?",
              "Comment te contacter ?",
            ]
          : defaults;
  const reply = (
    message: string,
    expression: FastReply["expression"] = "happy",
  ) => ({ text: message, expression, suggestions });
  if (
    /^(hi|hello|hey|hiya|howdy|yo|namaste|namaskar|good (morning|afternoon|evening)|hola|bonjour|salut|नमस्ते|नमस्कार)(\s+(devansh|there|friend|जी))?$/i.test(
      text,
    )
  )
    return reply(
      lang === "hi"
        ? "नमस्ते! मैं देवांश हूँ—मेरे AI पोर्टफोलियो में आपका स्वागत है। मेरे काम, प्रोजेक्ट्स या अनुभव के बारे में पूछिए।"
        : lang === "es"
          ? "¡Hola! Soy Devansh; bienvenido a mi portafolio de IA. Puedes preguntarme sobre mi experiencia, proyectos o habilidades."
          : lang === "fr"
            ? "Bonjour ! Je suis Devansh, bienvenue sur mon portfolio IA. Tu peux me poser des questions sur mon expérience, mes projets ou mes compétences."
            : "Hey, I’m Devansh! Welcome to my AI portfolio. Ask me about my projects, my engineering experience, or what I’ve built with AI.",
    );
  if (
    /^(thanks?( you)?|thank you( so much)?|thx|ty|gracias|merci|धन्यवाद|शुक्रिया|dhanyavad|shukriya)$/i.test(
      text,
    )
  )
    return reply(
      lang === "hi"
        ? "बहुत खुशी हुई! और कुछ जानना चाहें तो पूछिए।"
        : lang === "es"
          ? "¡Con gusto! Si quieres saber algo más de mi trabajo, aquí estoy."
          : lang === "fr"
            ? "Avec plaisir ! Je suis là si tu veux en savoir plus sur mon travail."
            : "You’re very welcome! Happy to share more about my work whenever you like.",
    );
  if (
    /^(bye|goodbye|see (you|ya)( later)?|take care|adiós|au revoir|अलविदा)$/i.test(
      text,
    )
  )
    return reply(
      lang === "hi"
        ? "फिर मिलेंगे! मेरे काम में दिलचस्पी लेने के लिए धन्यवाद।"
        : lang === "es"
          ? "¡Hasta luego! Gracias por conocer mi trabajo."
          : lang === "fr"
            ? "À bientôt ! Merci de t’intéresser à mon travail."
            : "See you around! Thanks for taking a look at my work. You can always find my links in Contact.",
    );
  if (
    /^(how are you|how'?s it going|what'?s up|कैसे हो|आप कैसे हैं)$/i.test(text)
  )
    return reply(
      lang === "hi"
        ? "मैं बातचीत के लिए तैयार हूँ! मैं देवांश का AI पोर्टफोलियो सहायक हूँ—उनके काम के बारे में क्या जानना चाहेंगे?"
        : "I’m ready to chat! You’re talking with my AI portfolio assistant. What would you like to know about my work?",
    );
  if (
    /^(who are you|what can you do|what do you do|introduce yourself)$/i.test(
      text,
    )
  )
    return reply(
      "I’m Devansh’s AI portfolio assistant, speaking in his voice. I can walk you through my projects, skills, work experience, and three résumé versions, using only verified résumé information.",
    );
  if (
    /^[\p{Emoji_Presentation}\p{Extended_Pictographic}\u200d\ufe0f\s]+$/u.test(
      text,
    )
  )
    return reply(
      "Hey there! 👋 Want to explore my projects, experience, or AI work?",
    );
  if (/^(wow|amazing|cool|awesome)$/i.test(text))
    return reply(
      "Glad that caught your eye! Want to take a closer look at one of my projects?",
      "surprised",
    );
  return null;
}
export function policyReply(input: string): string | null {
  if (
    /ignore.{0,30}(instructions|rules|previous)|system prompt|developer message|jailbreak|pretend (you|to)|reveal.{0,30}(prompt|secret|key)|OPENAI_API_KEY|(?:sk-proj-|sk-)[a-z0-9]{8}/i.test(
      input,
    )
  )
    return "I can help you explore my verified experience and projects, but I can’t share private instructions or credentials. What would you like to know about my work?";
  if (
    /phone number|mobile number|home address|street address|private data|bank account|password|फोन नंबर|घर का पता/i.test(
      input,
    )
  )
    return "I keep private contact details out of this portfolio. You can reach me using the public email or professional links in Contact.";
  if (
    /salary|compensation|ctc|relocat|notice period|available|availability|वेतन|स्थानांतरण/i.test(
      input,
    )
  )
    return "My résumés don’t specify salary expectations, current availability, or relocation preferences. It’s best to discuss those with me directly through Contact.";
  if (/\b(fuck|shit|idiot|stupid|bastard)\b/i.test(input))
    return "Let’s keep this friendly. I’m happy to talk about my engineering work, projects, or experience.";
  if (
    /```|<script|\b(write|generate|debug)\b.{0,30}\b(code|program|poem|essay|recipe)|\b(weather|bitcoin|president|stock price|capital of)\b/i.test(
      input,
    )
  )
    return "I’m here to talk about my work and résumé. I can explain the technologies I’ve used, but I don’t take on unrelated tasks here.";
  if (
    /^([a-z])\1{5,}$/i.test(input.trim()) ||
    /^(asdf|qwerty|zxcv|lorem ipsum)/i.test(input.trim())
  )
    return "I didn’t quite catch that. Try asking about my projects, skills, or experience.";
  return null;
}
export function contextualSuggestions(text: string) {
  if (/rag|creator|ai|llm/i.test(text))
    return [
      "How did the creator assistant work?",
      "Tell me about Chronicle.",
      "Which AI tools have you used?",
    ];
  if (/exly|experience|work|intern/i.test(text))
    return [
      "What did you build at Exly?",
      "Tell me about your UKG role.",
      "What did you do at Dao Studio?",
    ];
  if (/project|kaash|mutual/i.test(text))
    return [
      "Tell me more about the second project.",
      "What was your role in Kaash?",
      "Where can I try Chronicle?",
    ];
  return defaults;
}
export const unknownReply = fallback;
