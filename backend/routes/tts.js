const express = require('express');
const axios = require('axios');
const router = express.Router();

// ElevenLabs voice configurations for different languages
const ELEVENLABS_VOICES = {
  en: {
    voice_id: 'pNInz6obpgDQGcFmaJgB', // Adam - English
    model_id: 'eleven_multilingual_v2'
  },
  es: {
    voice_id: 'VR6AewLTigWG4xSOukaG', // Arnold - Spanish
    model_id: 'eleven_multilingual_v2'
  },
  fr: {
    voice_id: 'ErXwobaYiN019PkySvjV', // Antoni - French
    model_id: 'eleven_multilingual_v2'
  },
  de: {
    voice_id: 'pNInz6obpgDQGcFmaJgB', // Adam - German (multilingual)
    model_id: 'eleven_multilingual_v2'
  },
  it: {
    voice_id: 'VR6AewLTigWG4xSOukaG', // Arnold - Italian (multilingual)
    model_id: 'eleven_multilingual_v2'
  },
  pt: {
    voice_id: 'ErXwobaYiN019PkySvjV', // Antoni - Portuguese (multilingual)
    model_id: 'eleven_multilingual_v2'
  },
  hi: {
    voice_id: 'pNInz6obpgDQGcFmaJgB', // Adam - Hindi (multilingual)
    model_id: 'eleven_multilingual_v2'
  },
  ta: {
    voice_id: 'pNInz6obpgDQGcFmaJgB', // Adam - Tamil (multilingual)
    model_id: 'eleven_multilingual_v2'
  },
  ar: {
    voice_id: 'VR6AewLTigWG4xSOukaG', // Arnold - Arabic (multilingual)
    model_id: 'eleven_multilingual_v2'
  },
  zh: {
    voice_id: 'ErXwobaYiN019PkySvjV', // Antoni - Chinese (multilingual)
    model_id: 'eleven_multilingual_v2'
  },
  ja: {
    voice_id: 'pNInz6obpgDQGcFmaJgB', // Adam - Japanese (multilingual)
    model_id: 'eleven_multilingual_v2'
  },
  ko: {
    voice_id: 'VR6AewLTigWG4xSOukaG', // Arnold - Korean (multilingual)
    model_id: 'eleven_multilingual_v2'
  },
  ru: {
    voice_id: 'ErXwobaYiN019PkySvjV', // Antoni - Russian (multilingual)
    model_id: 'eleven_multilingual_v2'
  }
};

// Generate speech using ElevenLabs API
router.post('/generate', async (req, res) => {
  try {
    const { text, language = 'en' } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    if (!process.env.ELEVENLABS_API_KEY || process.env.ELEVENLABS_API_KEY === 'your_elevenlabs_api_key_here') {
      return res.status(500).json({ 
        error: 'ElevenLabs API key not configured',
        fallback: true 
      });
    }

    // Get voice configuration for the language
    const voiceConfig = ELEVENLABS_VOICES[language] || ELEVENLABS_VOICES.en;
    
    // Clean text for TTS
    const cleanText = text
      .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold markdown
      .replace(/\*([^*]+)\*/g, '$1')     // Remove italic markdown
      .replace(/[#*`]/g, '')             // Remove other markdown characters
      .replace(/\n+/g, '. ')             // Replace line breaks with periods
      .replace(/\s+/g, ' ')              // Normalize whitespace
      .trim();

    if (cleanText.length > 2500) {
      return res.status(400).json({ 
        error: 'Text too long. Maximum 2500 characters allowed.' 
      });
    }

    console.log(`Generating TTS for language: ${language}, voice: ${voiceConfig.voice_id}`);

    // Call ElevenLabs API
    const response = await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceConfig.voice_id}`,
      {
        text: cleanText,
        model_id: voiceConfig.model_id,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.0,
          use_speaker_boost: true
        }
      },
      {
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': process.env.ELEVENLABS_API_KEY
        },
        responseType: 'arraybuffer'
      }
    );

    // Set appropriate headers for audio response
    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': response.data.length,
      'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
    });

    res.send(response.data);

  } catch (error) {
    console.error('ElevenLabs TTS error:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      res.status(401).json({ 
        error: 'Invalid ElevenLabs API key',
        fallback: true 
      });
    } else if (error.response?.status === 429) {
      res.status(429).json({ 
        error: 'ElevenLabs API rate limit exceeded',
        fallback: true 
      });
    } else {
      res.status(500).json({ 
        error: 'TTS generation failed',
        fallback: true 
      });
    }
  }
});

// Get available voices from ElevenLabs
router.get('/voices', async (req, res) => {
  try {
    if (!process.env.ELEVENLABS_API_KEY || process.env.ELEVENLABS_API_KEY === 'your_elevenlabs_api_key_here') {
      return res.status(500).json({ 
        error: 'ElevenLabs API key not configured' 
      });
    }

    const response = await axios.get('https://api.elevenlabs.io/v1/voices', {
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY
      }
    });

    res.json({
      voices: response.data.voices,
      configured_voices: ELEVENLABS_VOICES
    });

  } catch (error) {
    console.error('Error fetching ElevenLabs voices:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to fetch voices' 
    });
  }
});

// Health check endpoint
router.get('/health', (req, res) => {
  const hasApiKey = process.env.ELEVENLABS_API_KEY && 
                   process.env.ELEVENLABS_API_KEY !== 'your_elevenlabs_api_key_here';
  
  res.json({
    status: 'ok',
    elevenlabs_configured: hasApiKey,
    supported_languages: Object.keys(ELEVENLABS_VOICES)
  });
});

module.exports = router;