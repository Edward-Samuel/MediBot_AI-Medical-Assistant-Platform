import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

// Supported languages with their configurations
export const SUPPORTED_LANGUAGES = {
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇺🇸',
    speechLang: 'en-US',
    rtl: false
  },
  es: {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    flag: '🇪🇸',
    speechLang: 'es-ES',
    rtl: false
  },
  fr: {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    flag: '🇫🇷',
    speechLang: 'fr-FR',
    rtl: false
  },
  de: {
    code: 'de',
    name: 'German',
    nativeName: 'Deutsch',
    flag: '🇩🇪',
    speechLang: 'de-DE',
    rtl: false
  },
  it: {
    code: 'it',
    name: 'Italian',
    nativeName: 'Italiano',
    flag: '🇮🇹',
    speechLang: 'it-IT',
    rtl: false
  },
  pt: {
    code: 'pt',
    name: 'Portuguese',
    nativeName: 'Português',
    flag: '🇵🇹',
    speechLang: 'pt-PT',
    rtl: false
  },
  zh: {
    code: 'zh',
    name: 'Chinese',
    nativeName: '中文',
    flag: '🇨🇳',
    speechLang: 'zh-CN',
    rtl: false
  },
  ja: {
    code: 'ja',
    name: 'Japanese',
    nativeName: '日本語',
    flag: '🇯🇵',
    speechLang: 'ja-JP',
    rtl: false
  },
  ko: {
    code: 'ko',
    name: 'Korean',
    nativeName: '한국어',
    flag: '🇰🇷',
    speechLang: 'ko-KR',
    rtl: false
  },
  ar: {
    code: 'ar',
    name: 'Arabic',
    nativeName: 'العربية',
    flag: '🇸🇦',
    speechLang: 'ar-SA',
    rtl: true
  },
  hi: {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    flag: '🇮🇳',
    speechLang: 'hi-IN',
    rtl: false
  },
  ru: {
    code: 'ru',
    name: 'Russian',
    nativeName: 'Русский',
    flag: '🇷🇺',
    speechLang: 'ru-RU',
    rtl: false
  },
  ta: {
    code: 'ta',
    name: 'Tamil',
    nativeName: 'தமிழ்',
    flag: '🇮🇳',
    speechLang: 'ta-IN',
    rtl: false
  }
};

// UI translations
export const translations = {
  en: {
    // Chat interface
    chatTitle: "MEDIBOT AI Assistant",
    chatSubtitle: "Your intelligent medical companion",
    placeholder: "Describe your symptoms or ask a health question...",
    send: "Send",
    listening: "Listening... Speak now",
    thinking: "MEDIBOT is thinking...",
    
    // Actions
    copy: "Copy message",
    readAloud: "Read aloud",
    stopReading: "Stop reading",
    startVoice: "Start voice input",
    stopVoice: "Stop listening",
    
    // Status messages
    copied: "Message copied to clipboard!",
    stop: "Stop",
    
    // Quick questions
    quickQuestions: "Quick questions to get started:",
    ttsPrompt: "AI responses can be read aloud - look for the speaker icon!",
    
    // Footer
    disclaimer: "This AI assistant provides general health information only. Always consult healthcare professionals for medical advice.",
    
    // Language selector
    selectLanguage: "Select Language",
    
    // Sample questions
    sampleQuestions: [
      "I have a headache and fever",
      "What should I do for chest pain?",
      "I need a dermatologist",
      "How do I book an appointment?",
      "What are the symptoms of diabetes?"
    ]
  },
  
  es: {
    chatTitle: "Asistente de IA MEDIBOT",
    chatSubtitle: "Tu compañero médico inteligente",
    placeholder: "Describe tus síntomas o haz una pregunta de salud...",
    send: "Enviar",
    listening: "Escuchando... Habla ahora",
    thinking: "MEDIBOT está pensando...",
    
    copy: "Copiar mensaje",
    readAloud: "Leer en voz alta",
    stopReading: "Dejar de leer",
    startVoice: "Iniciar entrada de voz",
    stopVoice: "Dejar de escuchar",
    
    copied: "¡Mensaje copiado al portapapeles!",
    voiceInput: "Entrada de voz:",
    readingAloud: "Leyendo mensaje en voz alta...",
    stop: "Parar",
    
    quickQuestions: "Preguntas rápidas para empezar:",
    voicePrompt: "¡Prueba la entrada de voz! Haz clic en el icono del micrófono para hablar tus síntomas.",
    ttsPrompt: "Las respuestas de IA se pueden leer en voz alta: ¡busca el icono del altavoz!",
    
    disclaimer: "Este asistente de IA proporciona solo información general de salud. Siempre consulta a profesionales de la salud para obtener asesoramiento médico.",
    features: "Entrada de voz • Copiar y leer en voz alta disponible",
    
    selectLanguage: "Seleccionar idioma",
    
    sampleQuestions: [
      "Tengo dolor de cabeza y fiebre",
      "¿Qué debo hacer por el dolor en el pecho?",
      "Necesito un dermatólogo",
      "¿Cómo reservo una cita?",
      "¿Cuáles son los síntomas de la diabetes?"
    ]
  },
  
  fr: {
    chatTitle: "Assistant IA MEDIBOT",
    chatSubtitle: "Votre compagnon médical intelligent",
    placeholder: "Décrivez vos symptômes ou posez une question de santé...",
    send: "Envoyer",
    listening: "Écoute... Parlez maintenant",
    thinking: "MEDIBOT réfléchit...",
    
    copy: "Copier le message",
    readAloud: "Lire à haute voix",
    stopReading: "Arrêter la lecture",
    startVoice: "Démarrer la saisie vocale",
    stopVoice: "Arrêter d'écouter",
    
    copied: "Message copié dans le presse-papiers !",
    voiceInput: "Saisie vocale :",
    readingAloud: "Lecture du message à haute voix...",
    stop: "Arrêter",
    
    quickQuestions: "Questions rapides pour commencer :",
    voicePrompt: "Essayez la saisie vocale ! Cliquez sur l'icône du microphone pour parler de vos symptômes.",
    ttsPrompt: "Les réponses de l'IA peuvent être lues à haute voix - cherchez l'icône du haut-parleur !",
    
    disclaimer: "Cet assistant IA fournit uniquement des informations générales sur la santé. Consultez toujours des professionnels de la santé pour des conseils médicaux.",
    features: "Saisie vocale • Copier et lire à haute voix disponible",
    
    selectLanguage: "Sélectionner la langue",
    
    sampleQuestions: [
      "J'ai mal à la tête et de la fièvre",
      "Que dois-je faire pour une douleur thoracique ?",
      "J'ai besoin d'un dermatologue",
      "Comment prendre rendez-vous ?",
      "Quels sont les symptômes du diabète ?"
    ]
  },
  
  de: {
    chatTitle: "MEDIBOT KI-Assistent",
    chatSubtitle: "Ihr intelligenter medizinischer Begleiter",
    placeholder: "Beschreiben Sie Ihre Symptome oder stellen Sie eine Gesundheitsfrage...",
    send: "Senden",
    listening: "Hört zu... Sprechen Sie jetzt",
    thinking: "MEDIBOT denkt nach...",
    
    copy: "Nachricht kopieren",
    readAloud: "Vorlesen",
    stopReading: "Vorlesen stoppen",
    startVoice: "Spracheingabe starten",
    stopVoice: "Zuhören stoppen",
    
    copied: "Nachricht in die Zwischenablage kopiert!",
    voiceInput: "Spracheingabe:",
    readingAloud: "Nachricht wird vorgelesen...",
    stop: "Stoppen",
    
    quickQuestions: "Schnelle Fragen zum Einstieg:",
    voicePrompt: "Probieren Sie die Spracheingabe! Klicken Sie auf das Mikrofon-Symbol, um Ihre Symptome zu sprechen.",
    ttsPrompt: "KI-Antworten können vorgelesen werden - suchen Sie nach dem Lautsprecher-Symbol!",
    
    disclaimer: "Dieser KI-Assistent bietet nur allgemeine Gesundheitsinformationen. Konsultieren Sie immer medizinische Fachkräfte für medizinische Beratung.",
    features: "Spracheingabe • Kopieren und Vorlesen verfügbar",
    
    selectLanguage: "Sprache auswählen",
    
    sampleQuestions: [
      "Ich habe Kopfschmerzen und Fieber",
      "Was soll ich bei Brustschmerzen tun?",
      "Ich brauche einen Dermatologen",
      "Wie buche ich einen Termin?",
      "Was sind die Symptome von Diabetes?"
    ]
  },
  
  it: {
    chatTitle: "Assistente IA MEDIBOT",
    chatSubtitle: "Il tuo compagno medico intelligente",
    placeholder: "Descrivi i tuoi sintomi o fai una domanda sulla salute...",
    send: "Invia",
    listening: "In ascolto... Parla ora",
    thinking: "MEDIBOT sta pensando...",
    
    copy: "Copia messaggio",
    readAloud: "Leggi ad alta voce",
    stopReading: "Smetti di leggere",
    startVoice: "Avvia input vocale",
    stopVoice: "Smetti di ascoltare",
    
    copied: "Messaggio copiato negli appunti!",
    voiceInput: "Input vocale:",
    readingAloud: "Lettura messaggio ad alta voce...",
    stop: "Ferma",
    
    quickQuestions: "Domande rapide per iniziare:",
    voicePrompt: "Prova l'input vocale! Clicca sull'icona del microfono per parlare dei tuoi sintomi.",
    ttsPrompt: "Le risposte dell'IA possono essere lette ad alta voce - cerca l'icona dell'altoparlante!",
    
    disclaimer: "Questo assistente IA fornisce solo informazioni generali sulla salute. Consulta sempre professionisti sanitari per consigli medici.",
    features: "Input vocale • Copia e leggi ad alta voce disponibili",
    
    selectLanguage: "Seleziona lingua",
    
    sampleQuestions: [
      "Ho mal di testa e febbre",
      "Cosa dovrei fare per il dolore al petto?",
      "Ho bisogno di un dermatologo",
      "Come prenoto un appuntamento?",
      "Quali sono i sintomi del diabete?"
    ]
  },
  
  pt: {
    chatTitle: "Assistente IA MEDIBOT",
    chatSubtitle: "Seu companheiro médico inteligente",
    placeholder: "Descreva seus sintomas ou faça uma pergunta sobre saúde...",
    send: "Enviar",
    listening: "Ouvindo... Fale agora",
    thinking: "MEDIBOT está pensando...",
    
    copy: "Copiar mensagem",
    readAloud: "Ler em voz alta",
    stopReading: "Parar de ler",
    startVoice: "Iniciar entrada de voz",
    stopVoice: "Parar de ouvir",
    
    copied: "Mensagem copiada para a área de transferência!",
    voiceInput: "Entrada de voz:",
    readingAloud: "Lendo mensagem em voz alta...",
    stop: "Parar",
    
    quickQuestions: "Perguntas rápidas para começar:",
    voicePrompt: "Experimente a entrada de voz! Clique no ícone do microfone para falar seus sintomas.",
    ttsPrompt: "As respostas da IA podem ser lidas em voz alta - procure pelo ícone do alto-falante!",
    
    disclaimer: "Este assistente IA fornece apenas informações gerais de saúde. Sempre consulte profissionais de saúde para aconselhamento médico.",
    features: "Entrada de voz • Copiar e ler em voz alta disponível",
    
    selectLanguage: "Selecionar idioma",
    
    sampleQuestions: [
      "Tenho dor de cabeça e febre",
      "O que devo fazer para dor no peito?",
      "Preciso de um dermatologista",
      "Como marco uma consulta?",
      "Quais são os sintomas da diabetes?"
    ]
  },
  
  zh: {
    chatTitle: "MEDIBOT AI助手",
    chatSubtitle: "您的智能医疗伙伴",
    placeholder: "描述您的症状或询问健康问题...",
    send: "发送",
    listening: "正在听... 现在请说话",
    thinking: "MEDIBOT正在思考...",
    
    copy: "复制消息",
    readAloud: "朗读",
    stopReading: "停止朗读",
    startVoice: "开始语音输入",
    stopVoice: "停止听取",
    
    copied: "消息已复制到剪贴板！",
    voiceInput: "语音输入：",
    readingAloud: "正在朗读消息...",
    stop: "停止",
    
    quickQuestions: "快速入门问题：",
    voicePrompt: "试试语音输入！点击麦克风图标说出您的症状。",
    ttsPrompt: "AI回复可以朗读 - 寻找扬声器图标！",
    
    disclaimer: "此AI助手仅提供一般健康信息。请始终咨询医疗专业人员获取医疗建议。",
    features: "语音输入 • 复制和朗读功能可用",
    
    selectLanguage: "选择语言",
    
    sampleQuestions: [
      "我头痛发烧",
      "胸痛应该怎么办？",
      "我需要皮肤科医生",
      "如何预约？",
      "糖尿病的症状是什么？"
    ]
  },
  
  ja: {
    chatTitle: "MEDIBOT AIアシスタント",
    chatSubtitle: "あなたの知的医療パートナー",
    placeholder: "症状を説明するか、健康に関する質問をしてください...",
    send: "送信",
    listening: "聞いています... 今話してください",
    thinking: "MEDIBOTが考えています...",
    
    copy: "メッセージをコピー",
    readAloud: "音読",
    stopReading: "読み上げを停止",
    startVoice: "音声入力を開始",
    stopVoice: "聞き取りを停止",
    
    copied: "メッセージがクリップボードにコピーされました！",
    voiceInput: "音声入力：",
    readingAloud: "メッセージを音読中...",
    stop: "停止",
    
    quickQuestions: "始めるための簡単な質問：",
    voicePrompt: "音声入力を試してください！マイクアイコンをクリックして症状を話してください。",
    ttsPrompt: "AIの回答は音読できます - スピーカーアイコンを探してください！",
    
    disclaimer: "このAIアシスタントは一般的な健康情報のみを提供します。医療アドバイスについては常に医療専門家にご相談ください。",
    features: "音声入力 • コピーと音読機能が利用可能",
    
    selectLanguage: "言語を選択",
    
    sampleQuestions: [
      "頭痛と熱があります",
      "胸の痛みにはどうすればいいですか？",
      "皮膚科医が必要です",
      "予約はどうやって取りますか？",
      "糖尿病の症状は何ですか？"
    ]
  },
  
  ko: {
    chatTitle: "MEDIBOT AI 어시스턴트",
    chatSubtitle: "당신의 지능형 의료 파트너",
    placeholder: "증상을 설명하거나 건강 질문을 하세요...",
    send: "전송",
    listening: "듣고 있습니다... 지금 말하세요",
    thinking: "MEDIBOT이 생각하고 있습니다...",
    
    copy: "메시지 복사",
    readAloud: "소리내어 읽기",
    stopReading: "읽기 중지",
    startVoice: "음성 입력 시작",
    stopVoice: "듣기 중지",
    
    copied: "메시지가 클립보드에 복사되었습니다!",
    voiceInput: "음성 입력:",
    readingAloud: "메시지를 소리내어 읽는 중...",
    stop: "중지",
    
    quickQuestions: "시작하기 위한 빠른 질문:",
    voicePrompt: "음성 입력을 시도해보세요! 마이크 아이콘을 클릭하여 증상을 말하세요.",
    ttsPrompt: "AI 응답을 소리내어 읽을 수 있습니다 - 스피커 아이콘을 찾으세요!",
    
    disclaimer: "이 AI 어시스턴트는 일반적인 건강 정보만 제공합니다. 의료 조언은 항상 의료 전문가와 상담하세요.",
    features: "음성 입력 • 복사 및 소리내어 읽기 기능 사용 가능",
    
    selectLanguage: "언어 선택",
    
    sampleQuestions: [
      "두통과 열이 있어요",
      "가슴 통증에는 어떻게 해야 하나요?",
      "피부과 의사가 필요해요",
      "예약은 어떻게 하나요?",
      "당뇨병의 증상은 무엇인가요?"
    ]
  },
  
  ar: {
    chatTitle: "مساعد MEDIBOT الذكي",
    chatSubtitle: "رفيقك الطبي الذكي",
    placeholder: "صف أعراضك أو اسأل سؤالاً صحياً...",
    send: "إرسال",
    listening: "يستمع... تحدث الآن",
    thinking: "MEDIBOT يفكر...",
    
    copy: "نسخ الرسالة",
    readAloud: "قراءة بصوت عالٍ",
    stopReading: "إيقاف القراءة",
    startVoice: "بدء الإدخال الصوتي",
    stopVoice: "إيقاف الاستماع",
    
    copied: "تم نسخ الرسالة إلى الحافظة!",
    voiceInput: "الإدخال الصوتي:",
    readingAloud: "قراءة الرسالة بصوت عالٍ...",
    stop: "إيقاف",
    
    quickQuestions: "أسئلة سريعة للبدء:",
    voicePrompt: "جرب الإدخال الصوتي! انقر على أيقونة الميكروفون لتتحدث عن أعراضك.",
    ttsPrompt: "يمكن قراءة ردود الذكاء الاصطناعي بصوت عالٍ - ابحث عن أيقونة السماعة!",
    
    disclaimer: "يوفر هذا المساعد الذكي معلومات صحية عامة فقط. استشر دائماً المختصين الصحيين للحصول على المشورة الطبية.",
    features: "الإدخال الصوتي • النسخ والقراءة بصوت عالٍ متاحان",
    
    selectLanguage: "اختر اللغة",
    
    sampleQuestions: [
      "لدي صداع وحمى",
      "ماذا يجب أن أفعل لألم الصدر؟",
      "أحتاج طبيب جلدية",
      "كيف أحجز موعداً؟",
      "ما هي أعراض السكري؟"
    ]
  },
  
  hi: {
    chatTitle: "MEDIBOT AI सहायक",
    chatSubtitle: "आपका बुद्धिमान चिकित्सा साथी",
    placeholder: "अपने लक्षणों का वर्णन करें या स्वास्थ्य प्रश्न पूछें...",
    send: "भेजें",
    listening: "सुन रहा है... अब बोलें",
    thinking: "MEDIBOT सोच रहा है...",
    
    copy: "संदेश कॉपी करें",
    readAloud: "जोर से पढ़ें",
    stopReading: "पढ़ना बंद करें",
    startVoice: "आवाज इनपुट शुरू करें",
    stopVoice: "सुनना बंद करें",
    
    copied: "संदेश क्लिपबोर्ड में कॉपी हो गया!",
    voiceInput: "आवाज इनपुट:",
    readingAloud: "संदेश जोर से पढ़ रहा है...",
    stop: "रोकें",
    
    quickQuestions: "शुरुआत के लिए त्वरित प्रश्न:",
    voicePrompt: "आवाज इनपुट आजमाएं! अपने लक्षण बोलने के लिए माइक्रोफोन आइकन पर क्लिक करें।",
    ttsPrompt: "AI उत्तर जोर से पढ़े जा सकते हैं - स्पीकर आइकन देखें!",
    
    disclaimer: "यह AI सहायक केवल सामान्य स्वास्थ्य जानकारी प्रदान करता है। चिकित्सा सलाह के लिए हमेशा स्वास्थ्य पेशेवरों से सलाह लें।",
    features: "आवाज इनपुट • कॉपी और जोर से पढ़ना उपलब्ध",
    
    selectLanguage: "भाषा चुनें",
    
    sampleQuestions: [
      "मुझे सिरदर्द और बुखार है",
      "सीने के दर्द के लिए मुझे क्या करना चाहिए?",
      "मुझे त्वचा विशेषज्ञ चाहिए",
      "मैं अपॉइंटमेंट कैसे बुक करूं?",
      "मधुमेह के लक्षण क्या हैं?"
    ]
  },
  
  ru: {
    chatTitle: "ИИ-помощник MEDIBOT",
    chatSubtitle: "Ваш умный медицинский компаньон",
    placeholder: "Опишите ваши симптомы или задайте вопрос о здоровье...",
    send: "Отправить",
    listening: "Слушаю... Говорите сейчас",
    thinking: "MEDIBOT думает...",
    
    copy: "Копировать сообщение",
    readAloud: "Читать вслух",
    stopReading: "Остановить чтение",
    startVoice: "Начать голосовой ввод",
    stopVoice: "Остановить прослушивание",
    
    copied: "Сообщение скопировано в буфер обмена!",
    voiceInput: "Голосовой ввод:",
    readingAloud: "Читаю сообщение вслух...",
    stop: "Остановить",
    
    quickQuestions: "Быстрые вопросы для начала:",
    voicePrompt: "Попробуйте голосовой ввод! Нажмите на значок микрофона, чтобы рассказать о ваших симптомах.",
    ttsPrompt: "Ответы ИИ можно читать вслух - ищите значок динамика!",
    
    disclaimer: "Этот ИИ-помощник предоставляет только общую информацию о здоровье. Всегда консультируйтесь с медицинскими специалистами для получения медицинских советов.",
    features: "Голосовой ввод • Копирование и чтение вслух доступны",
    
    selectLanguage: "Выбрать язык",
    
    sampleQuestions: [
      "У меня головная боль и температура",
      "Что делать при боли в груди?",
      "Мне нужен дерматолог",
      "Как записаться на прием?",
      "Каковы симптомы диабета?"
    ]
  },
  
  ta: {
    chatTitle: "மெடிபாட் AI உதவியாளர்",
    chatSubtitle: "உங்கள் அறிவார்ந்த மருத்துவ துணைவர்",
    placeholder: "உங்கள் அறிகுறிகளை விவரிக்கவும் அல்லது சுகாதார கேள்வி கேட்கவும்...",
    send: "அனுப்பு",
    listening: "கேட்கிறது... இப்போது பேசுங்கள்",
    thinking: "மெடிபாட் சிந்திக்கிறது...",
    
    copy: "செய்தியை நகலெடுக்கவும்",
    readAloud: "சத்தமாக படிக்கவும்",
    stopReading: "படிப்பதை நிறுத்தவும்",
    startVoice: "குரல் உள்ளீட்டைத் தொடங்கவும்",
    stopVoice: "கேட்பதை நிறுத்தவும்",
    
    copied: "செய்தி கிளிப்போர்டுக்கு நகலெடுக்கப்பட்டது!",
    voiceInput: "குரல் உள்ளீடு:",
    readingAloud: "செய்தியை சத்தமாக படிக்கிறது...",
    stop: "நிறுத்து",
    
    quickQuestions: "தொடங்குவதற்கான விரைவான கேள்விகள்:",
    voicePrompt: "குரல் உள்ளீட்டை முயற்சிக்கவும்! உங்கள் அறிகுறிகளைப் பேச மைக்ரோஃபோன் ஐகானைக் கிளிக் செய்யவும்.",
    ttsPrompt: "AI பதில்களை சத்தமாக படிக்க முடியும் - ஸ்பீக்கர் ஐகானைத் தேடுங்கள்!",
    
    disclaimer: "இந்த AI உதவியாளர் பொதுவான சுகாதார தகவல்களை மட்டுமே வழங்குகிறது. மருத்துவ ஆலோசனைக்கு எப்போதும் சுகாதார நிபுணர்களை அணுகவும்.",
    features: "குரல் உள்ளீடு • நகலெடுத்து சத்தமாக படிக்கும் வசதி உள்ளது",
    
    selectLanguage: "மொழியைத் தேர்ந்தெடுக்கவும்",
    
    sampleQuestions: [
      "எனக்கு தலைவலி மற்றும் காய்ச்சல் உள்ளது",
      "மார்பு வலிக்கு நான் என்ன செய்ய வேண்டும்?",
      "எனக்கு ஒரு தோல் மருத்துவர் தேவை",
      "நான் எப்படி அப்பாயிண்ட்மென்ட் புக் செய்வது?",
      "நீரிழிவு நோயின் அறிகுறிகள் என்ன?"
    ]
  }
};

export const LanguageProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState('en');

  // Load saved language preference
  useEffect(() => {
    const savedLanguage = localStorage.getItem('medibot-language');
    if (savedLanguage && SUPPORTED_LANGUAGES[savedLanguage]) {
      setCurrentLanguage(savedLanguage);
    } else {
      // Try to detect browser language
      const browserLang = navigator.language.split('-')[0];
      if (SUPPORTED_LANGUAGES[browserLang]) {
        setCurrentLanguage(browserLang);
      }
    }
  }, []);

  // Apply RTL direction for Arabic
  useEffect(() => {
    const isRTL = SUPPORTED_LANGUAGES[currentLanguage]?.rtl;
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = currentLanguage;
  }, [currentLanguage]);

  const changeLanguage = (languageCode) => {
    if (SUPPORTED_LANGUAGES[languageCode]) {
      setCurrentLanguage(languageCode);
      localStorage.setItem('medibot-language', languageCode);
    }
  };

  const t = (key) => {
    return translations[currentLanguage]?.[key] || translations.en[key] || key;
  };

  const getCurrentLanguageInfo = () => {
    return SUPPORTED_LANGUAGES[currentLanguage];
  };

  const value = {
    currentLanguage,
    changeLanguage,
    t,
    getCurrentLanguageInfo,
    supportedLanguages: SUPPORTED_LANGUAGES,
    isRTL: SUPPORTED_LANGUAGES[currentLanguage]?.rtl || false
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};