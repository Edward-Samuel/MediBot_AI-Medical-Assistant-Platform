const FAQ = require("../models/FAQ");
const pineconeService = require("./pineconeService");
const documentProcessor = require("./documentProcessor");
const openRouterService = require("./openRouterService");
const memoryMonitor = require("../utils/memoryMonitor");
const cacheService = require("./cacheService");

class FAQService {
  constructor() {
    this.initialized = false;
  }

  async initialize() {
    try {
      const [pineconeReady, cacheReady] = await Promise.all([
        pineconeService.initialize(),
        cacheService.initialize(),
      ]);

      this.initialized = pineconeReady;

      if (this.initialized) {
        console.log("FAQ service initialized successfully");
      } else {
        console.log(
          "FAQ service initialized without Pinecone (limited functionality)",
        );
      }

      return this.initialized;
    } catch (error) {
      console.error("❌ Failed to initialize FAQ service:", error.message);
      return false;
    }
  }

  async uploadFAQ(fileData, adminId) {
    return await memoryMonitor.withMemoryMonitoring(async () => {
      const {
        filePath,
        originalName,
        fileSize,
        title,
        category,
        description,
        tags,
      } = fileData;

      // Check memory before starting
      const memoryStatus = memoryMonitor.checkMemoryStatus();
      if (memoryStatus.status === "emergency") {
        throw new Error(
          "System memory too low to process file. Please try again later.",
        );
      }

      // Validate file type
      if (!documentProcessor.validateFileType(originalName)) {
        throw new Error("Unsupported file type");
      }

      const fileType = documentProcessor.getFileType(originalName);

      // Process document with memory monitoring
      memoryMonitor.logMemoryUsage("Before document processing");
      const processedData = await documentProcessor.processFile(
        filePath,
        fileType,
        originalName,
      );
      memoryMonitor.logMemoryUsage("After document processing");

      // Force cleanup after document processing
      memoryMonitor.forceCleanup();

      // Create FAQ document
      const faq = new FAQ({
        title: title || originalName,
        filename: originalName,
        originalName,
        fileType,
        fileSize,
        content: processedData.content,
        chunks: processedData.chunks,
        uploadedBy: adminId,
        category: category || "General",
        description: description || "",
        tags: tags || [],
        isQAFormat: processedData.isQAFormat || false,
        qaCount: processedData.qaCount || 0,
        processingStats: {
          totalChunks: processedData.chunks.length,
          qaChunks: processedData.chunks.filter(
            (c) =>
              c.metadata.type === "qa_pair" ||
              c.metadata.type === "detected_qa",
          ).length,
          contentChunks: processedData.chunks.filter(
            (c) => c.metadata.type === "content_chunk",
          ).length,
          processingTime: Date.now(),
        },
      });

      // Save to database first
      await faq.save();

      // Upload to Pinecone if available
      let pineconeIds = [];
      if (this.initialized) {
        try {
          memoryMonitor.logMemoryUsage("Before Pinecone upload");

          pineconeIds = await pineconeService.upsertChunks(
            processedData.chunks,
            faq._id.toString(),
            {
              title: faq.title,
              category: faq.category,
              fileType: faq.fileType,
              uploadedAt: faq.uploadedAt.toISOString(),
            },
          );

          memoryMonitor.logMemoryUsage("After Pinecone upload");

          // Update FAQ with Pinecone IDs
          faq.pineconeIds = pineconeIds;
          await faq.save();
        } catch (pineconeError) {
          console.error("Failed to upload to Pinecone:", pineconeError.message);
          // Continue without Pinecone - FAQ is still saved in database
        }
      }

      // Final cleanup
      memoryMonitor.forceCleanup();

      console.log(`FAQ uploaded successfully: ${faq.title}`);
      return faq;
    }, `FAQ Upload: ${fileData.originalName}`);
  }

  async searchFAQ(query, options = {}) {
    try {
      const { limit = 5, category, includeInactive = false } = options;

      // Generate cache key
      const cacheKey = cacheService.generateKey(
        "faq_search",
        query.toLowerCase().trim(),
        limit,
        category || "all",
        includeInactive,
      );

      // Try to get from cache first
      const cachedResult = await cacheService.get(cacheKey);
      if (cachedResult) {
        console.log("🚀 FAQ search cache hit");
        return cachedResult;
      }

      if (!this.initialized) {
        // Fallback to database search if Pinecone is not available
        const result = await this.searchFAQDatabase(query, options);
        // Cache database results for shorter time (15 minutes)
        await cacheService.set(cacheKey, result, 900);
        return result;
      }

      // Search using Pinecone with Q&A prioritization
      const searchResults = await pineconeService.searchSimilar(query, {
        topK: limit * 3, // Get more results to filter and prioritize
        filter: {
          isActive: true,
          ...(category && { category }),
        },
      });

      if (searchResults.length === 0) {
        return {
          results: [],
          query,
          totalResults: 0,
          source: "pinecone",
        };
      }

      // Prioritize Q&A pairs over regular content
      const qaPairs = searchResults.filter(
        (result) => result.metadata.isQAPair,
      );
      const regularContent = searchResults.filter(
        (result) => !result.metadata.isQAPair,
      );

      // Combine with Q&A pairs first
      const prioritizedResults = [...qaPairs, ...regularContent].slice(
        0,
        limit * 2,
      );

      // Group results by FAQ and get the best chunks
      const faqGroups = {};
      prioritizedResults.forEach((result) => {
        const faqId = result.metadata.faqId;
        if (!faqGroups[faqId]) {
          faqGroups[faqId] = [];
        }
        faqGroups[faqId].push(result);
      });

      // Get FAQ details and format results
      const results = [];
      for (const [faqId, chunks] of Object.entries(faqGroups)) {
        if (results.length >= limit) break;

        try {
          const faq = await FAQ.findById(faqId);
          if (!faq || (!includeInactive && !faq.isActive)) continue;

          // Get the best matching chunk
          const bestChunk = chunks[0];

          // Format the result based on chunk type
          let relevantText = bestChunk.metadata.text;
          if (
            bestChunk.metadata.isQAPair &&
            bestChunk.metadata.question &&
            bestChunk.metadata.answer
          ) {
            relevantText = `Q: ${bestChunk.metadata.question}\nA: ${bestChunk.metadata.answer}`;
          }

          results.push({
            faqId: faq._id,
            title: faq.title,
            category: faq.category,
            relevantText: relevantText,
            score: bestChunk.score,
            uploadedAt: faq.uploadedAt,
            tags: faq.tags,
            isQAPair: bestChunk.metadata.isQAPair || false,
            question: bestChunk.metadata.question || null,
            answer: bestChunk.metadata.answer || null,
          });
        } catch (error) {
          console.error(`Error fetching FAQ ${faqId}:`, error.message);
        }
      }

      const result = {
        results,
        query,
        totalResults: results.length,
        source: "pinecone",
      };

      // Cache the result for 1 hour
      await cacheService.set(cacheKey, result, 3600);

      return result;
    } catch (error) {
      console.error("❌ Error searching FAQ:", error.message);
      // Fallback to database search
      return this.searchFAQDatabase(query, options);
    }
  }

  async searchFAQDatabase(query, options = {}) {
    try {
      const { limit = 5, category, includeInactive = false } = options;

      const searchFilter = {
        $text: { $search: query },
        ...(category && { category }),
        ...(includeInactive ? {} : { isActive: true }),
      };

      const faqs = await FAQ.find(searchFilter)
        .select("title category content uploadedAt tags")
        .limit(limit)
        .sort({ score: { $meta: "textScore" } });

      const results = faqs.map((faq) => ({
        faqId: faq._id,
        title: faq.title,
        category: faq.category,
        relevantText: faq.content.substring(0, 500) + "...",
        score: 0.5, // Default score for database search
        uploadedAt: faq.uploadedAt,
        tags: faq.tags,
      }));

      return {
        results,
        query,
        totalResults: results.length,
        source: "database",
      };
    } catch (error) {
      console.error("❌ Error in database search:", error.message);
      return {
        results: [],
        query,
        totalResults: 0,
        source: "database",
        error: error.message,
      };
    }
  }

  async generateAnswer(query, searchResults) {
    try {
      if (!searchResults.results || searchResults.results.length === 0) {
        return "I don't have specific information about that topic yet.";
      }

      console.log("🔍 Generating answer for query:", query);
      console.log(" Search results count:", searchResults.results.length);

      // Prepare context from search results with Q&A prioritization
      const context = searchResults.results
        .map((result, index) => {
          console.log(`📋 Result ${index + 1}:`, {
            isQAPair: result.isQAPair,
            hasQuestion: !!result.question,
            hasAnswer: !!result.answer,
            score: result.score,
            questionPreview: result.question?.substring(0, 50),
            answerPreview: result.answer?.substring(0, 50),
            relevantTextPreview: result.relevantText?.substring(0, 50),
          });

          if (result.isQAPair && result.question && result.answer) {
            return `[${index + 1}] Q: ${result.question}\nA: ${result.answer}`;
          } else {
            return `[${index + 1}] ${result.relevantText}`;
          }
        })
        .join("\n\n");

      console.log("Generated context for OpenRouter:");
      console.log("=".repeat(50));
      console.log(context);
      console.log("=".repeat(50));

      // Generate answer using OpenRouter with improved prompt
      const prompt = `Based on the following FAQ context, answer the user's question about "${query}".

Context:
${context}

Question: ${query}

Instructions:
- If the context contains relevant information that can answer the question, provide a comprehensive answer
- If the context is somewhat related but doesn't fully answer the question, provide what information you can and mention what's missing
- If the context is completely unrelated or doesn't contain useful information, respond EXACTLY with: "I don't have specific information about that topic yet."
- When providing medical information, always include appropriate disclaimers
- Be clear, concise, and helpful
- Use the most relevant information from the context to construct your answer`;

      console.log("Sending improved prompt to OpenRouter...");
      const response = await openRouterService.generateResponse(prompt, [], {
        maxTokens: 400,
        temperature: 0.1, // Very low temperature for factual responses
      });

      console.log("OpenRouter response:", response.content);

      // Additional check: if the AI response is too generic or unhelpful, fall back
      const genericResponses = [
        "I don't have enough information",
        "The context doesn't provide",
        "Based on the limited information",
        "I cannot provide a complete answer",
      ];

      const isGenericResponse = genericResponses.some((phrase) =>
        response.content.toLowerCase().includes(phrase.toLowerCase()),
      );

      if (isGenericResponse) {
        console.log("AI response was too generic, returning fallback");
        return "I don't have specific information about that topic yet.";
      }

      return response.content;
    } catch (error) {
      console.error("❌ Error generating answer:", error.message);
      return "I don't have specific information about that topic yet.";
    }
  }

  async getFAQById(faqId) {
    try {
      const faq = await FAQ.findById(faqId).populate("uploadedBy", "username");
      return faq;
    } catch (error) {
      console.error("❌ Error getting FAQ by ID:", error.message);
      throw error;
    }
  }

  async getAllFAQs(options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        category,
        isActive,
        sortBy = "uploadedAt",
        sortOrder = "desc",
      } = options;

      const filter = {};
      if (category) filter.category = category;
      if (isActive !== undefined) filter.isActive = isActive;

      const sort = {};
      sort[sortBy] = sortOrder === "desc" ? -1 : 1;

      const faqs = await FAQ.find(filter)
        .populate("uploadedBy", "username")
        .sort(sort)
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await FAQ.countDocuments(filter);

      return {
        faqs,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        totalFAQs: total,
      };
    } catch (error) {
      console.error("❌ Error getting all FAQs:", error.message);
      throw error;
    }
  }

  async updateFAQStatus(faqId, isActive) {
    try {
      const faq = await FAQ.findById(faqId);
      if (!faq) {
        throw new Error("FAQ not found");
      }

      faq.isActive = isActive;
      await faq.save();

      // Update Pinecone if available
      if (this.initialized && faq.pineconeIds.length > 0) {
        if (isActive) {
          // Reactivate chunks
          await pineconeService.index.update({
            filter: { faqId: faqId.toString() },
            setMetadata: { isActive: true },
          });
        } else {
          // Deactivate chunks
          await pineconeService.deactivateChunks(faqId.toString());
        }
      }

      console.log(
        `FAQ ${faqId} status updated to ${isActive ? "active" : "inactive"}`,
      );
      return faq;
    } catch (error) {
      console.error("❌ Error updating FAQ status:", error.message);
      throw error;
    }
  }

  async deleteFAQ(faqId) {
    try {
      const faq = await FAQ.findById(faqId);
      if (!faq) {
        throw new Error("FAQ not found");
      }

      // Delete from Pinecone if available
      if (this.initialized && faq.pineconeIds.length > 0) {
        await pineconeService.deleteChunks(faq.pineconeIds);
      }

      // Delete from database
      await FAQ.findByIdAndDelete(faqId);

      console.log(`FAQ ${faqId} deleted successfully`);
      return true;
    } catch (error) {
      console.error("❌ Error deleting FAQ:", error.message);
      throw error;
    }
  }

  async getCategories() {
    try {
      const categories = await FAQ.distinct("category", { isActive: true });
      return categories.filter((cat) => cat && cat.trim().length > 0);
    } catch (error) {
      console.error("❌ Error getting categories:", error.message);
      return [];
    }
  }

  async getStats() {
    try {
      const stats = await FAQ.aggregate([
        {
          $group: {
            _id: null,
            totalFAQs: { $sum: 1 },
            activeFAQs: { $sum: { $cond: ["$isActive", 1, 0] } },
            totalChunks: {
              $sum: {
                $cond: [{ $isArray: "$chunks" }, { $size: "$chunks" }, 0],
              },
            },
            avgChunksPerFaq: {
              $avg: {
                $cond: [{ $isArray: "$chunks" }, { $size: "$chunks" }, 0],
              },
            },
          },
        },
      ]);

      const categoryStats = await FAQ.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: "$category", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]);

      const pineconeStats = this.initialized
        ? await pineconeService.getIndexStats()
        : null;

      return {
        database: stats[0] || {
          totalFAQs: 0,
          activeFAQs: 0,
          totalChunks: 0,
          avgChunksPerFaq: 0,
        },
        categories: categoryStats,
        pinecone: pineconeStats,
        serviceStatus: {
          pineconeInitialized: this.initialized,
          documentProcessorReady: true,
        },
      };
    } catch (error) {
      console.error("❌ Error getting stats:", error.message);
      return {
        database: {
          totalFAQs: 0,
          activeFAQs: 0,
          totalChunks: 0,
          avgChunksPerFaq: 0,
        },
        categories: [],
        pinecone: null,
        serviceStatus: {
          pineconeInitialized: this.initialized,
          documentProcessorReady: true,
        },
        error: error.message,
      };
    }
  }

  isInitialized() {
    return this.initialized;
  }
}

module.exports = new FAQService();
