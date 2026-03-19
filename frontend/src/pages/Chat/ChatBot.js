/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Bot,
  User,
  Loader,
  AlertCircle,
  Mic,
  MicOff,
  Copy,
  Volume2,
  VolumeX,
  Save,
  Menu,
  Search,
  Globe,
  Play,
  Image,
  X,
  Camera,
  History,
} from "lucide-react";
import axios from "../../config/axios";
import toast from "react-hot-toast";
import { useLanguage } from "../../contexts/LanguageContext";
import { useAuth } from "../../contexts/AuthContext";
import ChatHistory from "../../components/Chat/ChatHistory";
import AppointmentBookingWidget from "../../components/Chat/AppointmentBookingWidget";
import AppointmentSelectionWidget from "../../components/Chat/AppointmentSelectionWidget";
import RescheduleWidget from "../../components/Chat/RescheduleWidget";
import TriageAlert from "../../components/Chat/TriageAlert";
import { formatDateTime } from "../../utils/dateFormatter";

const ChatBot = () => {
  const { t, getCurrentLanguageInfo, currentLanguage } = useLanguage();
  const { user } = useAuth();

  // Get token from localStorage (check both admin and regular tokens)
  const getToken = () =>
    localStorage.getItem("adminToken") || localStorage.getItem("token");

  // Create initial message based on current language
  const getInitialMessage = () => {
    const welcomeMessages = {
      en: "Hello! I'm MEDIBOT, your AI medical assistant. I can help you understand symptoms, provide health guidance, and recommend appropriate doctors. How can I assist you today?",
      es: "¡Hola! Soy MEDIBOT, tu asistente médico de IA. Puedo ayudarte a entender síntomas, proporcionar orientación de salud y recomendar doctores apropiados. ¿Cómo puedo asistirte hoy?",
      fr: "Bonjour! Je suis MEDIBOT, votre assistant médical IA. Je peux vous aider à comprendre les symptômes, fournir des conseils de santé et recommander des médecins appropriés. Comment puis-je vous aider aujourd'hui?",
      ta: "வணக்கம்! நான் மெடிபாட், உங்கள் AI மருத்துவ உதவியாளர். அறிகுறிகளைப் புரிந்துகொள்ளவும், சுகாதார வழிகாட்டுதலை வழங்கவும், பொருத்தமான மருத்துவர்களைப் பரிந்துரைக்கவும் என்னால் உதவ முடியும். இன்று நான் உங்களுக்கு எப்படி உதவ முடியும்?",
      hi: "नमस्ते! मैं MEDIBOT हूं, आपका AI मेडिकल असिस्टेंट। मैं लक्षणों को समझने, स्वास्थ्य मार्गदर्शन प्रदान करने और उपयुक्त डॉक्टरों की सिफारिश करने में आपकी मदद कर सकता हूं। आज मैं आपकी कैसे सहायता कर सकता हूं?",
    };

    return welcomeMessages[currentLanguage] || welcomeMessages.en;
  };

  const [messages, setMessages] = useState([
    {
      id: 1,
      role: "bot",
      content: getInitialMessage(),
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [selectedImages, setSelectedImages] = useState([]);
  const [imageModal, setImageModal] = useState({
    isOpen: false,
    imageUrl: "",
    imageName: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState(null);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [chatSaved, setChatSaved] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAppointmentWidget, setShowAppointmentWidget] = useState(false);
  const [appointmentData, setAppointmentData] = useState(null);
  const [showAppointmentSelection, setShowAppointmentSelection] = useState(false);
  const [appointmentSelectionMode, setAppointmentSelectionMode] = useState(null); // 'reschedule' or 'cancel'
  const [showRescheduleWidget, setShowRescheduleWidget] = useState(false);
  const [selectedAppointmentToReschedule, setSelectedAppointmentToReschedule] = useState(null);
  const [webSearchMode, setWebSearchMode] = useState(false);
  const [webSearchStatus, setWebSearchStatus] = useState({
    available: true, // Always available
    configured: true, // Always configured
    loading: false,
    error: null,
  });
  const [webSearchStatusChecked, setWebSearchStatusChecked] = useState(true); // Already checked
  const [quickQuestions, setQuickQuestions] = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  // followUpQuestions state removed - questions are stored in messages
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const speechSynthesisRef = useRef(null);
  const createdImageURLs = useRef(new Set()); // Track all created URLs for cleanup

  // Function to format AI response text
  const formatMessage = (text) => {
    if (!text) return "";

    // Handle different formatting patterns
    const formatText = (content) => {
      // Ensure content is a string
      if (!content) return null;
      if (typeof content !== "string") {
        console.warn(
          "formatText received non-string content:",
          typeof content,
          content,
        );
        // Try to convert to string
        content = String(content);
      }

      // Split by lines first to handle lists and paragraphs
      const lines = content.split("\n");

      return lines.map((line, lineIndex) => {
        if (!line.trim()) {
          return <br key={lineIndex} />;
        }

        // Handle numbered lists
        if (/^\d+\.\s/.test(line.trim())) {
          return (
            <div key={lineIndex} className="ml-4 mb-1">
              {formatInlineText(line)}
            </div>
          );
        }

        // Handle bullet points
        if (/^[-•*]\s/.test(line.trim())) {
          return (
            <div key={lineIndex} className="ml-4 mb-1 flex">
              <span className="mr-2">•</span>
              <span>{formatInlineText(line.replace(/^[-•*]\s/, ""))}</span>
            </div>
          );
        }

        // Regular paragraphs
        return (
          <div key={lineIndex} className="mb-2">
            {formatInlineText(line)}
          </div>
        );
      });
    };

    // Format inline text (bold, italic, etc.)
    const formatInlineText = (text) => {
      const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);

      return parts.map((part, index) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong
              key={index}
              className="font-semibold text-gray-900 dark:text-white"
            >
              {part.slice(2, -2)}
            </strong>
          );
        } else if (
          part.startsWith("*") &&
          part.endsWith("*") &&
          !part.startsWith("**")
        ) {
          return (
            <em key={index} className="italic text-gray-800 dark:text-gray-200">
              {part.slice(1, -1)}
            </em>
          );
        } else {
          return <span key={index}>{part}</span>;
        }
      });
    };

    return formatText(text);
  };

  // Update welcome message when language changes
  useEffect(() => {
    if (!currentSessionId) {
      setMessages([
        {
          id: 1,
          role: "bot",
          content: getInitialMessage(),
          timestamp: new Date(),
        },
      ]);
    }
  }, [currentLanguage]);

  // Load chat history for logged-in users
  const loadChatHistory = async (sessionId) => {
    const token = getToken();
    if (!user || !token || !sessionId) return;

    try {
      const response = await axios.get(
        `/api/chat-history/session/${sessionId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.data.messages) {
        console.log(
          "Loading chat history with",
          response.data.messages.length,
          "messages",
        );

        // Process messages to handle image data
        const processedMessages = response.data.messages.map(
          (message, index) => {
            if (message.images && message.images.length > 0) {
              console.log(
                `Message ${index} has ${message.images.length} images`,
              );

              const processedImages = message.images.map((img) => {
                console.log(
                  "Processing image:",
                  img.name,
                  "Data length:",
                  img.data?.length,
                );
                return {
                  id: Date.now() + Math.random(),
                  name: img.name,
                  preview: img.data, // Use base64 data URL directly
                  size: img.size,
                  type: img.type,
                };
              });

              return {
                ...message,
                images: processedImages,
                videoData: message.videoData || null,
                webSearchData: message.webSearchData || null,
                searchResults: message.searchResults || null,
                triageData: message.triageData || null,
                followUpQuestions: message.followUpQuestions || [],
              };
            }
            return {
              ...message,
              videoData: message.videoData || null,
              webSearchData: message.webSearchData || null,
              searchResults: message.searchResults || null,
              triageData: message.triageData || null,
              followUpQuestions: message.followUpQuestions || [],
            };
          },
        );

        console.log("Processed messages:", processedMessages.length);
        setMessages(processedMessages);
        setCurrentSessionId(sessionId);
        setChatSaved(true);
        setSidebarOpen(false); // Close sidebar after loading
        toast.success("Chat history loaded!");
      }
    } catch (error) {
      console.error("Error loading chat history:", error);
      toast.error("Failed to load chat history");
    }
  };

  // Create new chat session
  const createNewSession = async () => {
    const token = getToken();
    if (!user || !token) {
      // For guests, just reset the chat
      setMessages([
        {
          id: 1,
          role: "bot",
          content: getInitialMessage(),
          timestamp: new Date(),
        },
      ]);
      setCurrentSessionId(null);
      setChatSaved(false);
      return;
    }

    try {
      const response = await axios.post(
        "/api/chat-history/session",
        {
          language: currentLanguage,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      setCurrentSessionId(response.data.sessionId);
      setMessages([
        {
          id: 1,
          role: "bot",
          content: getInitialMessage(),
          timestamp: new Date(),
        },
      ]);
      setChatSaved(false);
      fetchQuickQuestions(); // Refresh questions for new session
      toast.success("New chat session created!");
    } catch (error) {
      console.error("Error creating new session:", error);
      toast.error("Failed to create new session");
    }
  };

  // Fetch dynamic quick questions
  const fetchQuickQuestions = async () => {
    setLoadingQuestions(true);
    try {
      const response = await axios.get('/api/quick-questions', {
        params: {
          language: currentLanguage,
          count: 5
        }
      });

      if (response.data.success && response.data.questions) {
        setQuickQuestions(response.data.questions);
      }
    } catch (error) {
      console.error('Error fetching quick questions:', error);
      // Fallback to default questions
      const fallbackQuestions = t("sampleQuestions") || [
        "I have a headache and fever",
        "What should I do for chest pain?",
        "I need a dermatologist",
        "How do I book an appointment?",
        "What are the symptoms of diabetes?",
      ];
      setQuickQuestions(fallbackQuestions);
    } finally {
      setLoadingQuestions(false);
    }
  };

  // Auto-scroll disabled - users can manually scroll
  // useEffect(() => {
  //   messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  // }, [messages]);

  // Fetch quick questions on mount and language change
  useEffect(() => {
    fetchQuickQuestions();
  }, [currentLanguage, user]);

  // Initialize speech recognition
  useEffect(() => {
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      setSpeechSupported(true);

      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();

      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;

      // Update language when currentLanguage changes
      const updateRecognitionLanguage = () => {
        if (recognitionRef.current) {
          const currentLangInfo = getCurrentLanguageInfo();
          recognitionRef.current.lang = currentLangInfo.speechLang;
          console.log(
            `Speech recognition language set to: ${currentLangInfo.speechLang}`,
          );
        }
      };

      updateRecognitionLanguage();

      recognitionRef.current.onstart = () => {
        setIsListening(true);
        console.log("Speech recognition started");
      };

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        const confidence = event.results[0][0].confidence;

        console.log(
          `Speech recognition result: "${transcript}" (confidence: ${confidence})`,
        );

        setInputMessage(transcript);
        setIsListening(false);

        // Show a toast with the recognized text
        toast.success(`${t("voiceInput")} "${transcript}"`);

        // Optional: Auto-send after a short delay (uncomment if desired)
        // setTimeout(() => {
        //   if (transcript.trim()) {
        //     handleSendMessage({ preventDefault: () => {} });
        //   }
        // }, 1500);
      };

      recognitionRef.current.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);

        // Language-specific error messages
        const errorMessages = {
          "not-allowed": {
            en: "Microphone access denied. Please allow microphone access and try again.",
            es: "Acceso al micrófono denegado. Permite el acceso al micrófono e inténtalo de nuevo.",
            fr: "Accès au microphone refusé. Veuillez autoriser l'accès au microphone et réessayer.",
            ta: "மைக்ரோஃபோன் அணுகல் மறுக்கப்பட்டது. மைக்ரோஃபோன் அணுகலை அனுமதித்து மீண்டும் முயற்சிக்கவும்.",
            hi: "माइक्रोफ़ोन एक्सेस अस्वीकृत। कृपया माइक्रोफ़ोन एक्सेस की अनुमति दें और पुनः प्रयास करें।",
          },
          "no-speech": {
            en: "No speech detected. Please try again.",
            es: "No se detectó habla. Inténtalo de nuevo.",
            fr: "Aucune parole détectée. Veuillez réessayer.",
            ta: "பேச்சு கண்டறியப்படவில்லை. மீண்டும் முயற்சிக்கவும்.",
            hi: "कोई भाषण नहीं मिला। कृपया पुनः प्रयास करें।",
          },
          "audio-capture": {
            en: "Audio capture failed. Please check your microphone.",
            es: "Falló la captura de audio. Verifica tu micrófono.",
            fr: "Échec de la capture audio. Vérifiez votre microphone.",
            ta: "ஆடியோ பிடிப்பு தோல்வியடைந்தது. உங்கள் மைக்ரோஃபோனைச் சரிபார்க்கவும்.",
            hi: "ऑडियो कैप्चर विफल। कृपया अपना माइक्रोफ़ोन जांचें।",
          },
          network: {
            en: "Network error occurred. Please check your connection.",
            es: "Error de red. Verifica tu conexión.",
            fr: "Erreur réseau. Vérifiez votre connexion.",
            ta: "நெட்வொர்க் பிழை ஏற்பட்டது. உங்கள் இணைப்பைச் சரிபார்க்கவும்.",
            hi: "नेटवर्क त्रुटि हुई। कृपया अपना कनेक्शन जांचें।",
          },
          default: {
            en: "Speech recognition error. Please try again.",
            es: "Error de reconocimiento de voz. Inténtalo de nuevo.",
            fr: "Erreur de reconnaissance vocale. Veuillez réessayer.",
            ta: "பேச்சு அங்கீகார பிழை. மீண்டும் முயற்சிக்கவும்.",
            hi: "वाक् पहचान त्रुटि। कृपया पुनः प्रयास करें।",
          },
        };

        const errorType =
          errorMessages[event.error] || errorMessages["default"];
        const errorMessage = errorType[currentLanguage] || errorType.en;
        toast.error(errorMessage);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
        console.log("Speech recognition ended");
      };
    }

    // Keyboard shortcuts
    const handleKeyDown = (event) => {
      // Ctrl/Cmd + M to toggle voice input
      if ((event.ctrlKey || event.metaKey) && event.key === "m") {
        event.preventDefault();
        if (speechSupported) {
          if (isListening) {
            stopListening();
          } else {
            startListening();
          }
        }
      }

      // Escape key handling
      if (event.key === "Escape") {
        event.preventDefault();

        // Close image modal first priority
        if (imageModal.isOpen) {
          closeImageModal();
        }
        // Stop speaking second priority
        else if (speakingMessageId) {
          stopSpeaking();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    isListening,
    speechSupported,
    speakingMessageId,
    currentLanguage,
    imageModal.isOpen,
  ]);

  // Start voice recognition
  const startListening = () => {
    if (recognitionRef.current && speechSupported) {
      try {
        recognitionRef.current.start();
      } catch (error) {
        console.error("Error starting speech recognition:", error);
        toast.error("Could not start voice recognition. Please try again.");
      }
    } else {
      toast.error("Speech recognition is not supported in your browser.");
    }
  };

  // Stop voice recognition
  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  // Copy message to clipboard
  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(t("copied"));
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      toast.success(t("copied"));
    }
  };

  // Image handling functions
  const handleImageSelect = (event) => {
    const files = Array.from(event.target.files);

    if (files.length === 0) return;

    console.log("Selected files:", files.length);

    const validFiles = files.filter((file) => {
      const isValidType = file.type.startsWith("image/");
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB limit

      if (!isValidType) {
        toast.error(`${file.name} is not a valid image file`);
        return false;
      }
      if (!isValidSize) {
        toast.error(`${file.name} is too large (max 10MB)`);
        return false;
      }
      return true;
    });

    if (validFiles.length > 0) {
      const newImages = validFiles.map((file, index) => {
        const preview = URL.createObjectURL(file);
        createdImageURLs.current.add(preview); // Track the URL
        console.log("Created preview URL:", preview);

        return {
          id: Date.now() + index + Math.random(),
          file,
          preview,
          name: file.name,
          size: file.size,
          type: file.type,
        };
      });

      setSelectedImages((prev) => {
        const combined = [...prev, ...newImages];
        const limited = combined.slice(0, 5); // Max 5 images

        // Clean up excess images
        if (combined.length > 5) {
          combined.slice(5).forEach((img) => {
            URL.revokeObjectURL(img.preview);
            createdImageURLs.current.delete(img.preview); // Remove from tracking
          });
          toast.error("Maximum 5 images allowed. Extra images were removed.");
        }

        return limited;
      });

      toast.success(
        `${validFiles.length} image${validFiles.length > 1 ? "s" : ""} added`,
      );

      if (validFiles.length < files.length) {
        toast.error("Some files were skipped due to invalid format or size");
      }
    }

    // Reset input
    event.target.value = "";
  };

  const removeImage = (imageId) => {
    setSelectedImages((prev) => {
      const imageToRemove = prev.find((img) => img.id === imageId);
      if (imageToRemove && imageToRemove.preview) {
        // Only revoke URL if it's still in selected images (not sent yet)
        URL.revokeObjectURL(imageToRemove.preview);
        createdImageURLs.current.delete(imageToRemove.preview);
        console.log("Revoked URL for removed image:", imageToRemove.name);
      }
      return prev.filter((img) => img.id !== imageId);
    });
  };

  const clearAllImages = () => {
    selectedImages.forEach((img) => {
      if (img.preview) {
        URL.revokeObjectURL(img.preview);
        createdImageURLs.current.delete(img.preview);
      }
    });
    setSelectedImages([]);
    toast.success("All images cleared");
  };

  const clearSelectedImagesOnly = () => {
    // Clear the selected images array without revoking URLs
    // URLs will be preserved for sent messages in chat history
    setSelectedImages([]);
  };

  const openImageFullSize = (imageUrl, imageName) => {
    // Handle both blob URLs and base64 data URLs
    if (imageUrl && imageName) {
      setImageModal({ isOpen: true, imageUrl, imageName });
    } else {
      console.error("Invalid image data:", { imageUrl, imageName });
    }
  };

  const closeImageModal = () => {
    setImageModal({ isOpen: false, imageUrl: "", imageName: "" });
  };

  // Convert image to base64
  const convertImageToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // ElevenLabs TTS with fallback to browser TTS
  const speakMessage = async (text, messageId) => {
    // Stop any currently speaking message
    if (speechSynthesisRef.current) {
      window.speechSynthesis.cancel();
    }

    // If clicking the same message that's currently speaking, stop it
    if (speakingMessageId === messageId) {
      setSpeakingMessageId(null);
      return;
    }

    // Clean text for speech
    const cleanText = text
      .replace(/\*\*([^*]+)\*\*/g, "$1") // Remove bold markdown
      .replace(/\*([^*]+)\*/g, "$1") // Remove italic markdown
      .replace(/[#*`]/g, "") // Remove other markdown characters
      .replace(/\n+/g, ". ") // Replace line breaks with periods
      .replace(/\s+/g, " ") // Normalize whitespace
      .trim();

    if (!cleanText) {
      console.warn("No text to speak");
      return;
    }

    const currentLangInfo = getCurrentLanguageInfo();
    console.log(
      `Attempting TTS for language: ${currentLangInfo.name} (${currentLangInfo.code})`,
    );

    setSpeakingMessageId(messageId);

    try {
      // Try ElevenLabs TTS first
      const response = await fetch("/api/tts/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: cleanText,
          language: currentLangInfo.code,
        }),
      });

      if (response.ok) {
        console.log("Using ElevenLabs TTS");
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);

        audio.onplay = () => {
          console.log(`Started ElevenLabs TTS for ${currentLangInfo.name}`);
        };

        audio.onended = () => {
          setSpeakingMessageId(null);
          URL.revokeObjectURL(audioUrl);
          console.log("Finished ElevenLabs TTS");
        };

        audio.onerror = (error) => {
          console.error("ElevenLabs audio playback error:", error);
          setSpeakingMessageId(null);
          URL.revokeObjectURL(audioUrl);
          // Fallback to browser TTS
          fallbackToBrowserTTS(cleanText, messageId, currentLangInfo);
        };

        await audio.play();
        return;
      } else {
        const errorData = await response.json();
        console.log("ElevenLabs TTS failed:", errorData.error);

        if (errorData.fallback) {
          // Fallback to browser TTS
          fallbackToBrowserTTS(cleanText, messageId, currentLangInfo);
        } else {
          throw new Error(errorData.error);
        }
      }
    } catch (error) {
      console.error("ElevenLabs TTS error:", error);
      // Fallback to browser TTS
      fallbackToBrowserTTS(cleanText, messageId, currentLangInfo);
    }
  };

  // Fallback to browser TTS (simplified version of previous implementation)
  const fallbackToBrowserTTS = (cleanText, messageId, currentLangInfo) => {
    if (!("speechSynthesis" in window)) {
      toast.error("Text-to-speech is not supported in your browser.");
      setSpeakingMessageId(null);
      return;
    }

    console.log("Falling back to browser TTS");

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = currentLangInfo.code === "ta" ? 0.7 : 0.8;
    utterance.pitch = 1;
    utterance.volume = 0.9;
    utterance.lang = currentLangInfo.speechLang;

    // Simple voice selection
    const voices = window.speechSynthesis.getVoices();
    const selectedVoice =
      voices.find((voice) =>
        voice.lang.toLowerCase().includes(currentLangInfo.code.toLowerCase()),
      ) || voices[0];

    if (selectedVoice) {
      utterance.voice = selectedVoice;
      console.log(
        `Using browser voice: ${selectedVoice.name} (${selectedVoice.lang})`,
      );
    }

    utterance.onstart = () => {
      console.log(`Started browser TTS for ${currentLangInfo.name}`);
    };

    utterance.onend = () => {
      setSpeakingMessageId(null);
      console.log("Finished browser TTS");
    };

    utterance.onerror = (event) => {
      setSpeakingMessageId(null);
      console.error("Browser TTS error:", event.error);

      if (currentLangInfo.code === "ta") {
        toast.error(
          "Tamil TTS not available. Please install Tamil language pack or use Chrome browser.",
        );
      } else if (currentLangInfo.code === "ar") {
        toast.error(
          "Arabic TTS not available. Please install Arabic language pack or use Chrome browser.",
        );
      } else {
        toast.error("Speech synthesis failed. Please try again.");
      }
    };

    speechSynthesisRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  // Stop speaking
  const stopSpeaking = () => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setSpeakingMessageId(null);
    }
  };

  // Enhanced debug function with ElevenLabs status
  const debugVoices = async () => {
    console.log("🔊 === TTS DEBUG INFO ===");
    console.log(`Browser: ${navigator.userAgent.split(" ")[0]}`);

    const currentLangInfo = getCurrentLanguageInfo();
    console.log(
      `Current Language: ${currentLangInfo.name} (${currentLangInfo.code})`,
    );
    console.log(`Target Speech Lang: ${currentLangInfo.speechLang}`);

    // Check ElevenLabs status
    try {
      const response = await fetch("/api/tts/health");
      if (response.ok) {
        const data = await response.json();
        console.log("\n🎙️ === ELEVENLABS STATUS ===");
        console.log(
          `ElevenLabs API: ${data.elevenlabs_configured ? "Configured" : "Not configured"}`,
        );
        console.log(
          `Supported Languages: ${data.supported_languages.join(", ")}`,
        );

        if (data.elevenlabs_configured) {
          console.log(
            "🎉 ElevenLabs TTS will be used for all languages including Tamil and Arabic!",
          );
        } else {
          console.log(
            "ElevenLabs not configured, falling back to browser TTS",
          );
          console.log(
            "💡 Add ELEVENLABS_API_KEY to backend/.env for better multilingual support",
          );
        }
      }
    } catch (error) {
      console.log("\nElevenLabs API not available:", error.message);
    }

    // Browser TTS info
    if ("speechSynthesis" in window) {
      const voices = window.speechSynthesis.getVoices();
      console.log(`\n🔊 Browser TTS: Available (${voices.length} voices)`);

      if (voices.length === 0) {
        console.log("No browser voices loaded yet. Try again in a moment.");
        return;
      }

      // Special check for Tamil and Arabic
      const tamilVoices = voices.filter(
        (v) =>
          v.lang.toLowerCase().includes("ta") ||
          v.name.toLowerCase().includes("tamil"),
      );

      const arabicVoices = voices.filter(
        (v) =>
          v.lang.toLowerCase().includes("ar") ||
          v.name.toLowerCase().includes("arabic"),
      );

      console.log(`🇮🇳 Browser Tamil voices: ${tamilVoices.length}`);
      tamilVoices.forEach((v) => console.log(`   ${v.name} (${v.lang})`));

      console.log(`🇸🇦 Browser Arabic voices: ${arabicVoices.length}`);
      arabicVoices.forEach((v) => console.log(`   ${v.name} (${v.lang})`));

      // Current language matches
      const langMatches = voices.filter((v) =>
        v.lang.toLowerCase().startsWith(currentLangInfo.code.toLowerCase()),
      );
      console.log(
        `\nBrowser voices for ${currentLangInfo.name}: ${langMatches.length}`,
      );
      langMatches.forEach((v) => console.log(`   ${v.name} (${v.lang})`));
    } else {
      console.log("\nBrowser TTS: Not supported");
    }
  };

  // Add debug function and auto-run in development
  useEffect(() => {
    window.debugVoices = debugVoices;

    // Add web search debug function
    window.debugWebSearch = async () => {
      console.log("=== WEB SEARCH DEBUG ===");
      console.log("Current status:", webSearchStatus);
      console.log("Status checked:", webSearchStatusChecked);

      // Reset and recheck
      setWebSearchStatusChecked(false);
      setWebSearchStatus({
        available: null,
        configured: null,
        loading: false,
        error: null,
      });

      console.log("Forcing fresh check...");
      await checkWebSearchStatus(true); // Force check
    };

    // Auto-run debug in development mode
    if (process.env.NODE_ENV === "development") {
      setTimeout(() => {
        console.log("🚀 Auto-running voice debug...");
        debugVoices();

        // Also log web search status for debugging
        setTimeout(() => {
          console.log("Current web search status:", {
            available: webSearchStatus.available,
            configured: webSearchStatus.configured,
            loading: webSearchStatus.loading,
            error: webSearchStatus.error,
            checked: webSearchStatusChecked,
          });
        }, 5000);
      }, 2000);
    }

    return () => {
      delete window.debugVoices;
      delete window.debugWebSearch;
    };
  }, [currentLanguage]);

  // Simplified web search status check - disabled, always available
  const checkWebSearchStatus = async (forceCheck = false) => {
    // Web search is always available, no need to check
    console.log("Web search is always available (check disabled)");
    return;
  };

  // Handle web search toggle - simplified, always available
  const handleWebSearchToggle = async () => {
    setWebSearchMode(!webSearchMode);
    console.log("Web search mode toggled:", !webSearchMode);
  };

  // Auto-check web search status on component mount - disabled
  useEffect(() => {
    // Web search is always available, no need to check
    console.log("Web search is always available");
  }, []);

  // Clean up speech synthesis and image URLs on component unmount
  useEffect(() => {
    return () => {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      // Cleanup all created image URLs when component unmounts
      createdImageURLs.current.forEach((url) => {
        URL.revokeObjectURL(url);
      });
      createdImageURLs.current.clear();
    };
  }, []); // Empty dependency array - only run on unmount

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if ((!inputMessage.trim() && selectedImages.length === 0) || isLoading)
      return;

    // Prepare message content
    let messageContent = inputMessage.trim();
    let imageData = [];

    // Process images if any
    if (selectedImages.length > 0) {
      try {
        imageData = await Promise.all(
          selectedImages.map(async (img) => ({
            name: img.name,
            size: img.size,
            type: img.file.type,
            data: await convertImageToBase64(img.file),
          })),
        );

        if (!messageContent) {
          messageContent = `I've uploaded ${selectedImages.length} image${selectedImages.length > 1 ? "s" : ""} for analysis. Please help me understand what you see.`;
        }
      } catch (error) {
        toast.error("Failed to process images");
        return;
      }
    }

    const userMessage = {
      id: Date.now(),
      role: "user",
      content: messageContent,
      images: selectedImages.map((img) => ({
        id: img.id,
        name: img.name,
        preview: img.preview,
        size: img.size,
      })),
      timestamp: new Date(),
      webSearchMode: webSearchMode, // Add web search mode indicator
    };

    setMessages((prev) => [...prev, userMessage]);
    const originalMessage = messageContent;
    setInputMessage("");
    clearSelectedImagesOnly(); // Clear selection without revoking URLs
    setIsLoading(true);

    try {
      // Prepare request headers
      const headers = {
        "Content-Type": "application/json",
      };

      // Add authorization header if user is logged in
      const token = getToken();
      if (user && token) {
        headers.Authorization = `Bearer ${token}`;
      }

      // Modify message for explicit web search
      let messageToSend = originalMessage;
      if (webSearchMode) {
        messageToSend = `search for ${originalMessage}`;
      }

      // Send message to AI endpoint with language information and session ID
      console.log("Sending to backend:", {
        messageLength: messageToSend?.length,
        imagesCount: imageData?.length,
        firstImageSample: imageData?.[0]
          ? {
              name: imageData[0].name,
              size: imageData[0].size,
              type: imageData[0].type,
              dataLength: imageData[0].data?.length,
            }
          : null,
      });

      const response = await axios.post(
        "/api/ai/chat",
        {
          message: messageToSend,
          images: imageData, // Include image data
          conversationHistory: messages.slice(-5), // Send last 5 messages for context
          language: currentLanguage,
          languageInfo: getCurrentLanguageInfo(),
          sessionId: currentSessionId,
        },
        { headers },
      );

      const botMessage = {
        id: Date.now() + 1,
        role: "bot",
        content:
          typeof response.data.response === "string"
            ? response.data.response
            : response.data.response?.formatted ||
              response.data.response?.text ||
              JSON.stringify(response.data.response),
        timestamp: new Date(),
        webSearchData: response.data.webSearchData,
        searchResults: response.data.searchResults,
        videoData: response.data.videoData || null,
        followUpQuestions: response.data.followUpQuestions || [], // Add follow-up questions
        triageData: response.data.triageData || null, // Add triage data
      };

      setMessages((prev) => [...prev, botMessage]);

      // Poll for follow-up questions after a short delay
      if (response.data.sessionId && user) {
        setTimeout(() => {
          fetchFollowUpQuestions(response.data.sessionId, botMessage.id);
        }, 2000); // Wait 2 seconds for async generation
      }

      // Update session ID and save status
      if (response.data.sessionId) {
        setCurrentSessionId(response.data.sessionId);
      }

      if (response.data.saved) {
        setChatSaved(true);
        if (!chatSaved) {
          toast.success(
            user ? "Chat saved to your history!" : "Chat session created!",
          );
        }
      }

      // Show web search notification
      if (response.data.webSearchData) {
        if (response.data.webSearchData.error) {
          toast.error(
            `Web search failed: ${response.data.webSearchData.error}`,
          );
        } else {
          toast.success(
            `Found ${response.data.webSearchData.resultsCount} medical sources`,
            { duration: 4000 },
          );
        }
      }

      // Show fallback notification if using local LLM
      if (response.data.usingFallback) {
        toast.info("Using local AI model - responses may vary", {
          duration: 3000,
        });
      }

      // Handle appointment booking data
      if (
        response.data.appointmentData &&
        (response.data.appointmentData.intent === "appointment_booking" ||
          response.data.appointmentData.intent ===
            "appointment_booking_login_required")
      ) {
        setAppointmentData(response.data.appointmentData);
        setShowAppointmentWidget(true);
      }

      // Handle appointment reschedule intent
      if (
        response.data.appointmentData &&
        response.data.appointmentData.intent === "appointment_reschedule"
      ) {
        setAppointmentData(response.data.appointmentData);
        setAppointmentSelectionMode('reschedule');
        setShowAppointmentSelection(true);
      }

      // Handle appointment cancel intent
      if (
        response.data.appointmentData &&
        response.data.appointmentData.intent === "appointment_cancel"
      ) {
        setAppointmentData(response.data.appointmentData);
        setAppointmentSelectionMode('cancel');
        setShowAppointmentSelection(true);
      }

      // Reset web search mode after sending
      setWebSearchMode(false);
    } catch (error) {
      console.error("Chat error:", error);

      // Check if we got a successful response with fallback content
      if (error.response?.status === 200 && error.response?.data?.response) {
        // This shouldn't happen, but if it does, treat it as success
        const botMessage = {
          id: Date.now() + 1,
          role: "bot",
          content:
            typeof error.response.data.response === "string"
              ? error.response.data.response
              : error.response.data.response?.formatted ||
                error.response.data.response?.text ||
                JSON.stringify(error.response.data.response),
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, botMessage]);
        return;
      }

      // Only show error messages for actual network/server failures
      // Don't show errors if the backend is working but using fallbacks
      if (error.response && error.response.status >= 500) {
        // Server error (5xx)
        const errorBotMessage = {
          id: Date.now() + 1,
          role: "bot",
          content:
            "I'm experiencing technical difficulties. Please try again in a moment.",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorBotMessage]);
        toast.error("Server error occurred");
      } else if (error.response && error.response.status === 429) {
        // Rate limiting (shouldn't happen with fallbacks)
        toast.error("Too many requests - please wait a moment");
      } else if (error.response) {
        // Other client errors (4xx) - but backend should handle these with fallbacks
        console.log(
          "Unexpected client error:",
          error.response.status,
          error.response.data,
        );
        toast.error("Unexpected error occurred");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickQuestion = (question) => {
    setInputMessage(question);
  };

  // Fetch follow-up questions asynchronously
  const fetchFollowUpQuestions = async (sessionId, messageId) => {
    try {
      const token = getToken();
      if (!token || !sessionId) return;

      console.log('Fetching follow-up questions for session:', sessionId);

      const response = await axios.get(
        `/api/ai/follow-up-questions/${sessionId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.followUpQuestions && response.data.followUpQuestions.length > 0) {
        console.log('Received follow-up questions:', response.data.followUpQuestions);
        
        // Update the last bot message with follow-up questions
        setMessages((prev) => {
          const updated = [...prev];
          const lastBotIndex = updated.map(m => m.role).lastIndexOf('bot');
          
          if (lastBotIndex !== -1) {
            updated[lastBotIndex] = {
              ...updated[lastBotIndex],
              followUpQuestions: response.data.followUpQuestions
            };
          }
          
          return updated;
        });
      }
    } catch (error) {
      console.error('Error fetching follow-up questions:', error);
      // Silently fail - follow-up questions are optional
    }
  };

  const handleCloseAppointmentWidget = () => {
    setShowAppointmentWidget(false);
    setAppointmentData(null);
  };

  const handleBookingComplete = (appointment) => {
    setShowAppointmentWidget(false);
    setAppointmentData(null);

    // Add a system message about the successful booking
    const bookingMessage = {
      id: Date.now() + 2,
      role: "bot",
      content: `**Appointment Confirmed!**\n\n**Doctor:** ${appointment.doctorName}\n**Date & Time:** ${formatDateTime(appointment.dateTime)}\n**Type:** ${appointment.type}\n**Fee:** ₹${appointment.fee?.total || "Free"}\n\nYou will receive a confirmation email shortly. You can view all your appointments in your dashboard.`,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, bookingMessage]);
  };

  const handleAppointmentSelectionClose = () => {
    setShowAppointmentSelection(false);
    setAppointmentSelectionMode(null);
    setAppointmentData(null);
  };

  const handleAppointmentSelectionConfirm = (result) => {
    setShowAppointmentSelection(false);
    
    if (appointmentSelectionMode === 'cancel') {
      // Appointment was cancelled
      const cancelMessage = {
        id: Date.now() + 2,
        role: "bot",
        content: `**Appointment Cancelled Successfully!**\n\n**Doctor:** ${result.appointment.doctorId?.name || 'Doctor'}\n**Date & Time:** ${formatDateTime(result.appointment.dateTime)}\n\nYour Google Calendar has been updated. If you need to book a new appointment, just let me know!`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, cancelMessage]);
      setAppointmentSelectionMode(null);
      setAppointmentData(null);
    } else if (appointmentSelectionMode === 'reschedule') {
      // For reschedule, show the date/time picker widget
      setSelectedAppointmentToReschedule(result);
      setShowRescheduleWidget(true);
      setAppointmentSelectionMode(null);
      setAppointmentData(null);
    }
  };

  const handleRescheduleWidgetClose = () => {
    setShowRescheduleWidget(false);
    setSelectedAppointmentToReschedule(null);
  };

  const handleRescheduleComplete = (result) => {
    setShowRescheduleWidget(false);
    setSelectedAppointmentToReschedule(null);
    
    const oldDateTime = formatDateTime(result.oldDateTime);
    const newDateTime = formatDateTime(result.newDateTime);
    
    const rescheduleMessage = {
      id: Date.now() + 2,
      role: "bot",
      content: `**Appointment Rescheduled Successfully!**\n\n**Doctor:** ${result.appointment.doctorId?.name || 'Doctor'}\n**Old Date & Time:** ${oldDateTime}\n**New Date & Time:** ${newDateTime}\n\nYour Google Calendar has been updated. You will receive a confirmation email shortly.`,
      timestamp: new Date(),
    };
    
    setMessages((prev) => [...prev, rescheduleMessage]);
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex bg-white dark:bg-gray-900">
      {/* Chat History Sidebar */}
      <ChatHistory
        onLoadSession={loadChatHistory}
        currentSessionId={currentSessionId}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onNewSession={createNewSession}
      />

      {/* Main Chat Interface */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setSidebarOpen((prev) => !prev)}
              className="flex items-center space-x-2 p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
              title={sidebarOpen ? "Close chat history" : "Open chat history"}
            >
              <Menu className="h-5 w-5 lg:hidden" />
              <History className="h-5 w-5 hidden lg:block" />
              <span className="hidden sm:inline text-sm font-medium">
                {sidebarOpen ? "Hide History" : "Chat History"}
              </span>
            </button>

            <div className="flex items-center space-x-2">
              <Bot className="h-6 w-6 text-green-600" />
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                MEDIBOT
              </h1>
            </div>
          </div>

          {/* Chat Controls */}
          <div className="flex items-center space-x-2">
            {user && (
              <>
                <button
                  onClick={createNewSession}
                  className="flex items-center space-x-1 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                  title="Start new chat"
                >
                  <Bot className="h-4 w-4" />
                  <span className="hidden sm:inline">New Chat</span>
                </button>

                {chatSaved && currentSessionId && (
                  <div className="flex items-center space-x-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-2 py-1 rounded-md text-xs">
                    <Save className="h-3 w-3" />
                    <span className="hidden sm:inline">Saved</span>
                  </div>
                )}
              </>
            )}

            {!user && (
              <div className="text-gray-500 dark:text-gray-400 text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-md">
                <span className="hidden sm:inline">
                  Login to save chat history
                </span>
                <span className="sm:hidden">Guest mode</span>
              </div>
            )}
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="max-w-3xl mx-auto px-4 py-6">
            {messages.map((message) => (
              <div key={message.id} className="mb-6 group">
                <div className="flex items-start space-x-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg p-3 -m-3 transition-colors">
                  {/* Avatar */}
                  <div
                    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      message.role === "user"
                        ? "bg-blue-600 text-white"
                        : "bg-green-600 text-white"
                    }`}
                  >
                    {message.role === "user" ? (
                      <User className="h-4 w-4" />
                    ) : (
                      <Bot className="h-4 w-4" />
                    )}
                  </div>

                  {/* Message Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {message.role === "user" ? "You" : "MEDIBOT"}
                      </div>
                      {message.webSearchMode && (
                        <div className="flex items-center space-x-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full text-xs">
                          <Search className="h-3 w-3" />
                          <span>Web Search</span>
                        </div>
                      )}
                      {message.webSearchData && (
                        <div className="flex items-center space-x-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full text-xs">
                          <Globe className="h-3 w-3" />
                          <span>
                            {message.webSearchData.resultsCount} sources
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="prose prose-sm max-w-none text-gray-700 dark:text-gray-300 leading-relaxed">
                      {formatMessage(message.content)}
                    </div>

                    {/* Display images for user messages */}
                    {message.images && message.images.length > 0 && (
                      <div className="mt-3">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {message.images.map((image) => (
                            <div
                              key={image.id}
                              className="relative group cursor-pointer"
                            >
                              <img
                                src={image.preview}
                                alt={image.name}
                                className="w-full h-24 object-cover rounded-lg border border-gray-200 dark:border-gray-600 hover:border-green-400 transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openImageFullSize(image.preview, image.name);
                                }}
                                onError={(e) => {
                                  console.error(
                                    "Image failed to load:",
                                    image.name,
                                    "URL:",
                                    image.preview,
                                  );
                                  e.target.style.display = "none";
                                }}
                                onLoad={() => {
                                  console.log(
                                    "Image loaded successfully:",
                                    image.name,
                                  );
                                }}
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openImageFullSize(
                                        image.preview,
                                        image.name,
                                      );
                                    }}
                                    className="p-2 bg-white dark:bg-gray-800 rounded-full shadow-lg hover:shadow-xl transition-shadow"
                                    title="View full size"
                                  >
                                    <Image className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                                  </button>
                                </div>
                              </div>
                              <div className="absolute bottom-1 left-1 right-1">
                                <div className="bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded truncate">
                                  {image.name}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                          Click images to view full size •{" "}
                          {message.images.length} image
                          {message.images.length > 1 ? "s" : ""}
                        </div>
                      </div>
                    )}

                    {/* Search Results Sources */}
                    {message.searchResults &&
                      message.searchResults.sources &&
                      message.searchResults.sources.length > 0 && (
                        <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-200 dark:border-blue-800">
                          <div className="flex items-center space-x-2 mb-2">
                            <Globe className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                              Medical Sources
                            </span>
                          </div>
                          <div className="space-y-1">
                            {message.searchResults.sources.map(
                              (source, index) => (
                                <div
                                  key={index}
                                  className="flex items-center space-x-2 text-xs"
                                >
                                  <span className="text-blue-600 dark:text-blue-400">
                                    •
                                  </span>
                                  <a
                                    href={source.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-100 hover:underline truncate"
                                  >
                                    {source.title}
                                  </a>
                                  <span className="text-gray-500 dark:text-gray-400">
                                    ({source.domain})
                                  </span>
                                </div>
                              ),
                            )}
                          </div>
                        </div>
                      )}

                    {/* Triage Assessment */}
                    {message.role === "bot" && message.triageData && (
                      <TriageAlert triageData={message.triageData} />
                    )}

                    {message.role === "bot" &&
                      message.videoData &&
                      (message.videoData.videos?.length > 0 ||
                        message.videoData.searchUrl) && (
                        <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-800">
                          <div className="flex items-center space-x-2 mb-3">
                            <Play className="h-4 w-4 text-red-600 dark:text-red-400" />
                            <span className="text-sm font-medium text-red-800 dark:text-red-200">
                              Recommended Videos
                            </span>
                          </div>

                          {message.videoData.videos?.length > 0 ? (
                            <div className="space-y-4">
                              {message.videoData.videos.map((video) => (
                                <div
                                  key={video.id}
                                  className="bg-white dark:bg-gray-800 rounded-lg border border-red-100 dark:border-red-900 overflow-hidden"
                                >
                                  <div className="aspect-video bg-black">
                                    <iframe
                                      src={video.embedUrl}
                                      title={video.title}
                                      className="w-full h-full"
                                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                      allowFullScreen
                                    />
                                  </div>
                                  <div className="p-3">
                                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                                      {video.title}
                                    </div>
                                    <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                      {video.channelTitle}
                                      {video.duration ? ` • ${video.duration}` : ""}
                                    </div>
                                    <a
                                      href={video.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center mt-2 text-xs text-red-700 dark:text-red-300 hover:underline"
                                    >
                                      Open on YouTube
                                    </a>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <a
                              href={message.videoData.searchUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-red-700 dark:text-red-300 hover:underline"
                            >
                              Open YouTube search results
                            </a>
                          )}
                        </div>
                      )}

                    {/* Action buttons for bot messages */}
                    {message.role === "bot" && (
                      <div className="flex items-center space-x-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => copyToClipboard(message.content)}
                          className="p-1.5 rounded-md text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          title={t("copy")}
                        >
                          <Copy className="h-3 w-3" />
                        </button>

                        <button
                          onClick={() =>
                            speakingMessageId === message.id
                              ? stopSpeaking()
                              : speakMessage(message.content, message.id)
                          }
                          className={`p-1.5 rounded-md transition-colors ${
                            speakingMessageId === message.id
                              ? "text-green-600 bg-green-100 dark:bg-green-900/20"
                              : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                          }`}
                          title={
                            speakingMessageId === message.id
                              ? t("stopReading")
                              : t("readAloud")
                          }
                        >
                          {speakingMessageId === message.id ? (
                            <VolumeX className="h-3 w-3" />
                          ) : (
                            <Volume2 className="h-3 w-3" />
                          )}
                        </button>
                      </div>
                    )}

                    {/* Follow-up Questions */}
                    {message.role === "bot" && 
                     message.followUpQuestions && 
                     message.followUpQuestions.length > 0 && 
                     messages[messages.length - 1].id === message.id && (
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                          💡 You might also want to ask:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {message.followUpQuestions.map((question, index) => (
                            <button
                              key={index}
                              onClick={() => {
                                setInputMessage(question);
                                // Optionally auto-send
                                // setTimeout(() => handleSendMessage({ preventDefault: () => {} }), 100);
                              }}
                              className="text-xs bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 text-gray-700 dark:text-gray-300 px-3 py-2 rounded-lg hover:from-green-100 hover:to-blue-100 dark:hover:from-green-900/30 dark:hover:to-blue-900/30 transition-all border border-green-200 dark:border-green-800 hover:border-green-300 dark:hover:border-green-700 hover:shadow-sm"
                            >
                              {question}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="mb-6 group">
                <div className="flex items-start space-x-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg p-3 -m-3 transition-colors">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                      MEDIBOT
                    </div>
                    <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
                      <Loader className="h-4 w-4 animate-spin" />
                      <span className="text-sm animate-pulse">
                        {t("thinking")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Quick Questions */}
        {messages.length === 1 && (
          <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className="max-w-3xl mx-auto px-4 py-6">
              {loadingQuestions ? (
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                  <Loader className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Loading personalized questions...</span>
                </div>
              ) : (
                <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-start">
                  <p className="w-full text-sm font-medium text-gray-700 dark:text-gray-300 sm:w-auto sm:min-w-fit sm:pt-2">
                    {t("quickQuestions") || "Quick questions to get started:"}
                  </p>
                  <div className="flex flex-1 flex-wrap gap-3">
                  {quickQuestions.map((question, index) => (
                    <button
                      key={index}
                      onClick={() => handleQuickQuestion(question)}
                      className="text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors border border-gray-200 dark:border-gray-600"
                    >
                      {question}
                    </button>
                  ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Input Form */}
        <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="max-w-3xl mx-auto px-4 py-4">
            {/* Web Search Toggle - Simplified */}
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleWebSearchToggle}
                  disabled={webSearchStatus.loading}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 border-2 ${
                    webSearchMode
                      ? "bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-600"
                      : webSearchStatus.loading
                        ? "bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 cursor-wait"
                        : webSearchStatus.available
                          ? "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-transparent hover:bg-gray-200 dark:hover:bg-gray-600"
                          : "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 cursor-not-allowed"
                  }`}
                  title={
                    webSearchMode
                      ? "Disable web search mode"
                      : "Enable web search mode"
                  }
                >
                  <Search
                    className={`h-4 w-4 ${webSearchMode ? "animate-pulse" : ""}`}
                  />
                  <span>Web Search</span>
                  {webSearchMode && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  )}
                </button>

                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {webSearchMode ? (
                    <span className="text-blue-600 dark:text-blue-400">
                      Will search trusted medical sources
                    </span>
                  ) : (
                    <span>Search current medical research and guidelines</span>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
                <Globe className="h-3 w-3" />
                <span>Trusted sources only</span>
              </div>
            </div>

            <form onSubmit={handleSendMessage} className="space-y-3">
              {/* Image Preview Section */}
              {selectedImages.length > 0 && (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {selectedImages.length} image
                      {selectedImages.length > 1 ? "s" : ""} selected
                    </span>
                    <button
                      type="button"
                      onClick={clearAllImages}
                      className="text-xs text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200 transition-colors"
                    >
                      Clear all
                    </button>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {selectedImages.map((image) => (
                      <div key={image.id} className="relative group">
                        <img
                          src={image.preview}
                          alt={image.name}
                          className="w-full h-16 object-cover rounded border border-gray-300 dark:border-gray-600 cursor-pointer hover:border-green-400 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            openImageFullSize(image.preview, image.name);
                          }}
                          onError={(e) => {
                            console.error(
                              "Preview image failed to load:",
                              image.name,
                            );
                            e.target.style.display = "none";
                          }}
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeImage(image.id);
                          }}
                          className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                          title="Remove image"
                        >
                          <X className="h-3 w-3" />
                        </button>
                        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs px-1 py-0.5 rounded-b truncate">
                          {image.name}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    Click images to preview • Click X to remove
                  </div>
                </div>
              )}

              <div className="flex space-x-3">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder={
                      webSearchMode
                        ? "Search medical information (e.g., 'diabetes treatment guidelines')"
                        : selectedImages.length > 0
                          ? "Describe what you'd like to know about these images..."
                          : t("placeholder")
                    }
                    className={`w-full px-4 py-3 border rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:border-transparent pr-20 shadow-sm transition-all duration-200 ${
                      webSearchMode
                        ? "border-blue-300 dark:border-blue-600 focus:ring-blue-500"
                        : "border-gray-300 dark:border-gray-600 focus:ring-green-500"
                    }`}
                    disabled={isLoading || isListening}
                  />

                  {/* Image Upload Button */}
                  <label className="absolute right-12 top-1/2 transform -translate-y-1/2 cursor-pointer">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                      disabled={isLoading || selectedImages.length >= 5}
                    />
                    <div
                      className={`p-2 rounded-full transition-all duration-200 ${
                        selectedImages.length >= 5
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : selectedImages.length > 0
                            ? "bg-green-100 text-green-600 hover:bg-green-200"
                            : "bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-500"
                      }`}
                      title={
                        selectedImages.length >= 5
                          ? "Maximum 5 images allowed"
                          : selectedImages.length > 0
                            ? `${selectedImages.length} image${selectedImages.length > 1 ? "s" : ""} selected`
                            : "Upload images"
                      }
                    >
                      <Camera className="h-4 w-4" />
                    </div>
                  </label>

                  {/* Voice Input Button */}
                  {speechSupported && (
                    <button
                      type="button"
                      onClick={isListening ? stopListening : startListening}
                      disabled={isLoading}
                      className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-2 rounded-full transition-all duration-200 ${
                        isListening
                          ? "bg-red-100 text-red-600 hover:bg-red-200 animate-pulse"
                          : "bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-500"
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                      title={isListening ? t("stopVoice") : t("startVoice")}
                    >
                      {isListening ? (
                        <MicOff className="h-4 w-4" />
                      ) : (
                        <Mic className="h-4 w-4" />
                      )}
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={
                    (!inputMessage.trim() && selectedImages.length === 0) ||
                    isLoading ||
                    isListening
                  }
                  className={`px-4 py-3 text-white rounded-xl transition-colors disabled:cursor-not-allowed flex items-center space-x-2 shadow-sm ${
                    webSearchMode
                      ? "bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-600"
                      : "bg-green-600 hover:bg-green-700 disabled:bg-gray-300 dark:disabled:bg-gray-600"
                  }`}
                >
                  {webSearchMode ? (
                    <Search className="h-4 w-4" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  <span className="hidden sm:inline">
                    {webSearchMode ? "Search" : t("send")}
                  </span>
                </button>
              </div>
            </form>

            {/* Voice Status Indicator */}
            {isListening && (
              <div className="mt-3 flex items-center justify-center space-x-2 text-red-600">
                <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
                <span className="text-sm">{t("listening")}</span>
                <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
              </div>
            )}

            {/* Speaking Status Indicator */}
            {speakingMessageId && (
              <div className="mt-3 flex items-center justify-center space-x-2 text-green-600">
                <Volume2 className="w-4 h-4 animate-pulse" />
                <span className="text-sm">{t("readingAloud")}</span>
                <button
                  onClick={stopSpeaking}
                  className="text-xs bg-green-100 dark:bg-green-900/20 px-2 py-1 rounded hover:bg-green-200 dark:hover:bg-green-800 transition-colors"
                >
                  {t("stop")}
                </button>
              </div>
            )}

            <div className="mt-3 flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
              <AlertCircle className="h-4 w-4" />
              <span>
                This AI assistant provides general health information only.
                Always consult healthcare professionals for medical advice.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Image Modal */}
      {imageModal.isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4"
          onClick={closeImageModal}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full h-full flex items-center justify-center">
            <button
              onClick={closeImageModal}
              className="absolute top-4 right-4 bg-white dark:bg-gray-800 text-gray-800 dark:text-white rounded-full p-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors z-10"
              title="Close"
            >
              <X className="h-6 w-6" />
            </button>
            <img
              src={imageModal.imageUrl}
              alt={imageModal.imageName}
              className="max-w-full max-h-full object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="absolute bottom-4 left-4 right-4 bg-black bg-opacity-50 text-white p-3 rounded-lg">
              <p className="text-sm font-medium truncate">
                {imageModal.imageName}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Appointment Booking Widget Overlay */}
      {showAppointmentWidget && appointmentData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <AppointmentBookingWidget
              appointmentData={appointmentData}
              onClose={handleCloseAppointmentWidget}
              onBookingComplete={handleBookingComplete}
            />
          </div>
        </div>
      )}

      {/* Appointment Selection Widget Overlay (for reschedule/cancel) */}
      {showAppointmentSelection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <AppointmentSelectionWidget
              appointmentData={appointmentData}
              mode={appointmentSelectionMode}
              onClose={handleAppointmentSelectionClose}
              onConfirm={handleAppointmentSelectionConfirm}
            />
          </div>
        </div>
      )}

      {/* Reschedule Widget Overlay (date/time picker) */}
      {showRescheduleWidget && selectedAppointmentToReschedule && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <RescheduleWidget
              appointment={selectedAppointmentToReschedule}
              onClose={handleRescheduleWidgetClose}
              onRescheduleComplete={handleRescheduleComplete}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatBot;
