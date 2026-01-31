const { pipeline, env } = require('@xenova/transformers');
const cacheService = require('./cacheService');

// Configure transformers for memory efficiency
env.allowLocalModels = false;
env.allowRemoteModels = true;

class EmbeddingService {
  constructor() {
    this.model = null;
    this.initialized = false;
    this.modelName = 'Xenova/all-MiniLM-L6-v2';
    this.dimension = 384;
    this.maxLength = 128; // Further reduced context length
    this.batchSize = 1;
    this.processingQueue = [];
    this.isProcessing = false;
  }

  async initialize() {
    try {
      console.log('🔄 Initializing memory-optimized embedding model...');
      
      // Configure memory limits
      if (global.gc) {
        global.gc();
      }
      
      // Load the feature extraction pipeline with memory optimization
      this.model = await pipeline('feature-extraction', this.modelName, {
        quantized: true, // Use quantized model for memory efficiency
        device: 'cpu',   // Force CPU to avoid GPU memory issues
      });
      
      this.initialized = true;
      console.log('✅ Memory-optimized embedding service initialized');
      console.log(`📊 Model: ${this.modelName} (quantized)`);
      console.log(`📏 Embedding dimension: ${this.dimension}`);
      console.log(`📝 Max context length: ${this.maxLength} tokens`);
      
      return true;

    } catch (error) {
      console.error('❌ Failed to initialize embedding service:', error.message);
      console.error('💡 Make sure you have installed @xenova/transformers: npm install @xenova/transformers');
      return false;
    }
  }

  async generateEmbedding(text) {
    if (!this.initialized) {
      throw new Error('Embedding service not initialized');
    }

    try {
      // Check cache first
      const cacheKey = `embedding:${Buffer.from(text.substring(0, 100)).toString('base64')}`;
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        return cached;
      }

      // For Q&A pairs, allow longer text; for regular content, keep it shorter
      const isQAPair = text.includes('Q:') && text.includes('A:');
      const maxLength = isQAPair ? 200 : 100;
      
      // Truncate text based on type
      const truncatedText = text.length > maxLength ? text.substring(0, maxLength) : text;
      
      // Clean the text
      const cleanText = truncatedText.replace(/\s+/g, ' ').trim();
      
      if (!cleanText) {
        // Return zero vector for empty text
        return new Array(this.dimension).fill(0);
      }
      
      // Generate embedding with memory monitoring
      const startMemory = process.memoryUsage().heapUsed;
      
      const output = await this.model(cleanText, {
        pooling: 'mean',
        normalize: true
      });
      
      // Extract the embedding array
      let embedding;
      if (Array.isArray(output)) {
        embedding = output;
      } else if (output.data) {
        embedding = Array.from(output.data);
      } else {
        embedding = this.meanPool(output);
      }
      
      // Ensure correct dimension
      if (embedding.length !== this.dimension) {
        console.warn(`⚠️  Embedding dimension mismatch: got ${embedding.length}, expected ${this.dimension}`);
        // Pad or truncate to correct dimension
        if (embedding.length < this.dimension) {
          embedding = embedding.concat(new Array(this.dimension - embedding.length).fill(0));
        } else {
          embedding = embedding.slice(0, this.dimension);
        }
      }
      
      const endMemory = process.memoryUsage().heapUsed;
      const memoryUsed = (endMemory - startMemory) / 1024 / 1024;
      
      if (memoryUsed > 50) { // More than 50MB
        console.warn(`⚠️  High memory usage for embedding: ${memoryUsed.toFixed(2)}MB`);
      }
      
      // Cache the result for 24 hours
      await cacheService.set(cacheKey, embedding, 86400);
      
      // Force garbage collection
      if (global.gc) {
        global.gc();
      }
      
      return embedding;

    } catch (error) {
      console.error('❌ Error generating embedding:', error.message);
      console.error('📝 Text length:', text.length);
      console.error('💾 Memory usage:', process.memoryUsage());
      
      // Return zero vector as fallback
      return new Array(this.dimension).fill(0);
    }
  }

  // Mean pooling function for sentence embeddings
  meanPool(output) {
    try {
      if (!output || !output.data || !output.dims) {
        console.warn('⚠️  Invalid output format for mean pooling');
        return new Array(this.dimension).fill(0);
      }
      
      const embeddings = output.data;
      const seqLength = output.dims[1];
      const hiddenSize = output.dims[2];
      
      if (hiddenSize !== this.dimension) {
        console.warn(`⚠️  Dimension mismatch in mean pooling: ${hiddenSize} vs ${this.dimension}`);
      }
      
      // Mean pool across sequence length
      const pooled = new Array(Math.min(hiddenSize, this.dimension)).fill(0);
      
      for (let i = 0; i < seqLength; i++) {
        for (let j = 0; j < pooled.length; j++) {
          pooled[j] += embeddings[i * hiddenSize + j] || 0;
        }
      }
      
      // Average and normalize
      for (let j = 0; j < pooled.length; j++) {
        pooled[j] = (pooled[j] / seqLength) || 0;
      }
      
      // Pad to correct dimension if needed
      while (pooled.length < this.dimension) {
        pooled.push(0);
      }
      
      return pooled.slice(0, this.dimension);
      
    } catch (error) {
      console.error('❌ Error in mean pooling:', error.message);
      return new Array(this.dimension).fill(0);
    }
  }

  // Remove the meanPooling function as we're using [CLS] token instead

  async generateBatchEmbeddings(texts) {
    if (!this.initialized) {
      throw new Error('Embedding service not initialized');
    }

    try {
      const embeddings = [];
      
      console.log(`🔄 Processing ${texts.length} embeddings with aggressive memory optimization...`);
      
      for (let i = 0; i < texts.length; i++) {
        const text = texts[i];
        
        console.log(`   Processing embedding ${i + 1}/${texts.length}...`);
        
        try {
          const embedding = await this.generateEmbedding(text);
          embeddings.push(embedding);
          
          // Monitor memory usage
          const memUsage = process.memoryUsage();
          const heapUsedMB = memUsage.heapUsed / 1024 / 1024;
          
          if (heapUsedMB > 1000) { // More than 1GB
            console.warn(`⚠️  High memory usage: ${heapUsedMB.toFixed(2)}MB`);
            
            // Force multiple garbage collections
            if (global.gc) {
              global.gc();
              global.gc();
              global.gc();
            }
            
            // Longer delay for memory recovery
            await new Promise(resolve => setTimeout(resolve, 1000));
          } else {
            // Normal delay
            await new Promise(resolve => setTimeout(resolve, 100));
          }
          
        } catch (embeddingError) {
          console.error(`❌ Error processing embedding ${i + 1}:`, embeddingError.message);
          // Use a zero vector as fallback
          embeddings.push(new Array(this.dimension).fill(0));
        }
      }
      
      console.log(`✅ Completed processing ${embeddings.length} embeddings`);
      
      // Final cleanup
      if (global.gc) {
        global.gc();
      }
      
      return embeddings;

    } catch (error) {
      console.error('❌ Error generating batch embeddings:', error.message);
      throw error;
    }
  }

  getDimension() {
    return this.dimension;
  }

  getMaxLength() {
    return this.maxLength;
  }

  isInitialized() {
    return this.initialized;
  }

  getModelInfo() {
    return {
      name: this.modelName,
      dimension: this.dimension,
      maxLength: this.maxLength,
      initialized: this.initialized,
      description: 'all-MiniLM-L6-v2 - Lightweight general-purpose embedding model optimized for memory efficiency'
    };
  }
}

module.exports = new EmbeddingService();