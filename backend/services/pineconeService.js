const { Pinecone } = require("@pinecone-database/pinecone");
const embeddingService = require("./embeddingService");

class PineconeService {
  constructor() {
    this.pinecone = null;
    this.index = null;
    this.initialized = false;
    this.indexName = process.env.PINECONE_INDEX_NAME || "medibot-faq";
    this.dimension = 384; // all-MiniLM-L6-v2 embedding dimension
  }

  async initialize() {
    try {
      if (!process.env.PINECONE_API_KEY) {
        console.log("Pinecone API key not found - FAQ system will be disabled");
        return false;
      }

      // Initialize embedding service
      const embeddingInitialized = await embeddingService.initialize();
      if (!embeddingInitialized) {
        console.log(
          "Embedding service failed to initialize - FAQ embeddings will be disabled",
        );
        return false;
      }

      // Initialize Pinecone
      this.pinecone = new Pinecone({
        apiKey: process.env.PINECONE_API_KEY,
      });

      // Get or create index
      await this.ensureIndex();

      this.initialized = true;
      console.log("Pinecone service initialized successfully");
      return true;
    } catch (error) {
      console.error("Failed to initialize Pinecone service:", error.message);
      return false;
    }
  }

  async ensureIndex() {
    try {
      // Check if index exists
      const indexList = await this.pinecone.listIndexes();
      const indexExists = indexList.indexes?.some(
        (index) => index.name === this.indexName,
      );

      if (!indexExists) {
        console.log(`Creating Pinecone index: ${this.indexName}`);
        await this.pinecone.createIndex({
          name: this.indexName,
          dimension: this.dimension,
          metric: "cosine",
          spec: {
            serverless: {
              cloud: "aws",
              region: "us-east-1",
            },
          },
        });

        // Wait for index to be ready
        console.log("⏳ Waiting for index to be ready...");
        await this.waitForIndexReady();
      }

      this.index = this.pinecone.index(this.indexName);
      console.log(`Connected to Pinecone index: ${this.indexName}`);
    } catch (error) {
      console.error("Error ensuring Pinecone index:", error.message);
      throw error;
    }
  }

  async waitForIndexReady(maxWaitTime = 60000) {
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitTime) {
      try {
        const indexStats = await this.index.describeIndexStats();
        if (indexStats) {
          console.log("Index is ready");
          return;
        }
      } catch (error) {
        // Index not ready yet, continue waiting
      }

      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    throw new Error("Index creation timeout");
  }

  async generateEmbedding(text) {
    if (!this.initialized) {
      throw new Error("Pinecone service not initialized");
    }

    try {
      return await embeddingService.generateEmbedding(text);
    } catch (error) {
      console.error("Error generating embedding:", error.message);
      throw error;
    }
  }

  async upsertChunks(chunks, faqId, metadata = {}) {
    if (!this.initialized) {
      throw new Error("Pinecone service not initialized");
    }

    try {
      console.log(`Processing ${chunks.length} chunks for FAQ ${faqId}...`);

      // Separate Q&A pairs from regular chunks
      const qaPairs = chunks.filter(
        (chunk) =>
          chunk.metadata.type === "qa_pair" ||
          chunk.metadata.type === "detected_qa",
      );
      const regularChunks = chunks.filter(
        (chunk) => chunk.metadata.type === "content_chunk",
      );

      console.log(
        ` Found ${qaPairs.length} Q&A pairs and ${regularChunks.length} regular chunks`,
      );

      // Process Q&A pairs first (they're more important)
      const processedIds = [];

      // Process Q&A pairs
      for (let i = 0; i < qaPairs.length; i++) {
        const chunk = qaPairs[i];
        console.log(`   Processing Q&A pair ${i + 1}/${qaPairs.length}...`);

        try {
          const embedding = await this.generateEmbedding(chunk.text);

          const vector = {
            id: chunk.id,
            values: embedding,
            metadata: {
              faqId,
              chunkIndex: chunk.metadata.chunkIndex,
              type: chunk.metadata.type,
              question: chunk.metadata.question || "",
              answer: chunk.metadata.answer || "",
              text: chunk.text.substring(0, 300), // Store more text for Q&A
              ...metadata,
              isActive: true,
              isQAPair: true,
            },
          };

          await this.index.upsert([vector]);
          processedIds.push(chunk.id);

          console.log(`   Processed Q&A pair ${i + 1}/${qaPairs.length}`);

          // Memory cleanup
          if (global.gc) {
            global.gc();
          }

          await new Promise((resolve) => setTimeout(resolve, 300));
        } catch (error) {
          console.error(
            `Error processing Q&A pair ${i + 1}:`,
            error.message,
          );
          continue;
        }
      }

      // Process regular chunks (limit to prevent memory issues)
      const maxRegularChunks = Math.min(regularChunks.length, 20);

      for (let i = 0; i < maxRegularChunks; i++) {
        const chunk = regularChunks[i];
        console.log(
          `   Processing content chunk ${i + 1}/${maxRegularChunks}...`,
        );

        try {
          const embedding = await this.generateEmbedding(chunk.text);

          const vector = {
            id: chunk.id,
            values: embedding,
            metadata: {
              faqId,
              chunkIndex: chunk.metadata.chunkIndex,
              type: chunk.metadata.type,
              text: chunk.text.substring(0, 200),
              ...metadata,
              isActive: true,
              isQAPair: false,
            },
          };

          await this.index.upsert([vector]);
          processedIds.push(chunk.id);

          console.log(
            `   Processed content chunk ${i + 1}/${maxRegularChunks}`,
          );

          // Memory cleanup
          if (global.gc) {
            global.gc();
          }

          await new Promise((resolve) => setTimeout(resolve, 200));
        } catch (error) {
          console.error(
            `Error processing content chunk ${i + 1}:`,
            error.message,
          );
          continue;
        }
      }

      if (regularChunks.length > maxRegularChunks) {
        console.warn(
          `Processed only ${maxRegularChunks} out of ${regularChunks.length} content chunks for memory efficiency`,
        );
      }

      console.log(
        `Completed processing ${processedIds.length} chunks for FAQ ${faqId} (${qaPairs.length} Q&A pairs, ${Math.min(regularChunks.length, maxRegularChunks)} content chunks)`,
      );
      return processedIds;
    } catch (error) {
      console.error("Error upserting chunks:", error.message);
      throw error;
    }
  }

  async searchSimilar(query, options = {}) {
    if (!this.initialized) {
      throw new Error("Pinecone service not initialized");
    }

    try {
      const {
        topK = 5,
        includeMetadata = true,
        filter = { isActive: true },
      } = options;

      // Generate query embedding
      const queryEmbedding = await this.generateEmbedding(query);

      // Search in Pinecone
      const searchResponse = await this.index.query({
        vector: queryEmbedding,
        topK,
        includeMetadata,
        filter,
      });

      return searchResponse.matches || [];
    } catch (error) {
      console.error("Error searching similar chunks:", error.message);
      throw error;
    }
  }

  async deleteChunks(chunkIds) {
    if (!this.initialized) {
      throw new Error("Pinecone service not initialized");
    }

    try {
      if (chunkIds.length === 0) return;

      await this.index.deleteMany(chunkIds);
      console.log(`Deleted ${chunkIds.length} chunks from Pinecone`);
    } catch (error) {
      console.error("Error deleting chunks:", error.message);
      throw error;
    }
  }

  async deactivateChunks(faqId) {
    if (!this.initialized) {
      throw new Error("Pinecone service not initialized");
    }

    try {
      // Update metadata to mark as inactive
      await this.index.update({
        filter: { faqId },
        setMetadata: { isActive: false },
      });

      console.log(`Deactivated chunks for FAQ ${faqId}`);
    } catch (error) {
      console.error("Error deactivating chunks:", error.message);
      throw error;
    }
  }

  async getIndexStats() {
    if (!this.initialized) {
      return { error: "Service not initialized" };
    }

    try {
      const stats = await this.index.describeIndexStats();
      return stats;
    } catch (error) {
      console.error("Error getting index stats:", error.message);
      return { error: error.message };
    }
  }

  isInitialized() {
    return this.initialized;
  }
}

module.exports = new PineconeService();
