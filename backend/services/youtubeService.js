const axios = require("axios");

class YouTubeService {
  constructor() {
    this.baseUrl = "https://www.youtube.com/results";
    this.maxVideos = 3;
    this.videoIntentPatterns = [
      /\byoutube\b/i,
      /\bvideo\b/i,
      /\bvideos\b/i,
      /\bwatch\b/i,
      /\btutorial\b/i,
      /\bdemo\b/i,
      /\bdemonstration\b/i,
      /\bshow me\b/i,
      /\bhow to\b/i,
    ];
  }

  shouldProvideVideos(message = "") {
    return this.videoIntentPatterns.some((pattern) => pattern.test(message));
  }

  buildSearchQuery(message = "") {
    const lowerMessage = message.toLowerCase();
    const normalized = message
      .replace(/\b(search for|find|show me|give me|can you show me)\b/gi, "")
      .replace(/\b(youtube|video|videos|watch|tutorial|demo|demonstration)\b/gi, "")
      .replace(/\s+/g, " ")
      .trim();

    if (lowerMessage.includes("cpr")) {
      return "CPR tutorial American Heart Association";
    }

    if (lowerMessage.includes("heimlich") || lowerMessage.includes("choking")) {
      return "Heimlich maneuver tutorial American Red Cross";
    }

    if (lowerMessage.includes("first aid")) {
      return "first aid tutorial American Red Cross";
    }

    return `${normalized || message} medical tutorial`;
  }

  async searchVideos(message) {
    const query = this.buildSearchQuery(message);
    const searchUrl = `${this.baseUrl}?search_query=${encodeURIComponent(query)}`;

    try {
      const response = await axios.get(searchUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
          Cookie: "CONSENT=YES+cb.20210328-17-p0.en+FX+471",
        },
        timeout: 10000,
      });

      const initialData = this.extractInitialData(response.data);
      const renderers = this.collectVideoRenderers(initialData);
      const videos = this.normalizeVideos(renderers).slice(0, this.maxVideos);

      return {
        requested: true,
        query,
        searchUrl,
        videos,
        fallbackOnly: videos.length === 0,
      };
    } catch (error) {
      console.error("YouTube search failed:", error.message);

      return {
        requested: true,
        query,
        searchUrl,
        videos: [],
        fallbackOnly: true,
        error: error.message,
      };
    }
  }

  extractInitialData(html = "") {
    const patterns = [
      /var ytInitialData = (.*?);<\/script>/s,
      /window\["ytInitialData"\] = (.*?);<\/script>/s,
    ];

    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match?.[1]) {
        return JSON.parse(match[1]);
      }
    }

    throw new Error("Unable to parse YouTube search results");
  }

  collectVideoRenderers(node, results = []) {
    if (!node) {
      return results;
    }

    if (Array.isArray(node)) {
      node.forEach((item) => this.collectVideoRenderers(item, results));
      return results;
    }

    if (typeof node !== "object") {
      return results;
    }

    if (node.videoRenderer) {
      results.push(node.videoRenderer);
    }

    Object.values(node).forEach((value) =>
      this.collectVideoRenderers(value, results),
    );

    return results;
  }

  normalizeVideos(renderers) {
    const seenIds = new Set();

    return renderers
      .map((renderer) => {
        const videoId = renderer.videoId;
        if (!videoId || seenIds.has(videoId)) {
          return null;
        }

        seenIds.add(videoId);

        const thumbnails = renderer.thumbnail?.thumbnails || [];
        const bestThumbnail = thumbnails[thumbnails.length - 1]?.url || null;

        return {
          id: videoId,
          title: this.extractText(renderer.title) || "YouTube video",
          channelTitle:
            this.extractText(renderer.ownerText) ||
            this.extractText(renderer.longBylineText) ||
            "YouTube",
          duration: this.extractText(renderer.lengthText) || null,
          thumbnail: bestThumbnail,
          url: `https://www.youtube.com/watch?v=${videoId}`,
          embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}`,
        };
      })
      .filter(Boolean);
  }

  extractText(field) {
    if (!field) {
      return "";
    }

    if (field.simpleText) {
      return field.simpleText;
    }

    if (Array.isArray(field.runs)) {
      return field.runs.map((run) => run.text).join("");
    }

    return "";
  }
}

module.exports = new YouTubeService();
