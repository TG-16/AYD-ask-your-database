const { pipeline } = require("@xenova/transformers");

/**
 * Service to handle text-to-vector transformations.
 */
class EmbeddingService {
  constructor() {
    this.extractor = null;
    this.modelName = 'Xenova/all-MiniLM-L6-v2'; // Standard 384-dim model
  }

  /**
   * Initializes the pipeline if it hasn't been created yet.
   */
  async getExtractor() {
    if (!this.extractor) {
      this.extractor = await pipeline('feature-extraction', this.modelName);
    }
    return this.extractor;
  }

  /**
   * Generates a single embedding for an NL query input.
   * @param {string} text 
   * @returns {Promise<number[]>}
   */
  async generateSingle(text) {
    try {
      const extractor = await this.getExtractor();
      const output = await extractor(text, { 
        pooling: 'mean', 
        normalize: true 
      });

      // Convert from Tensor to standard JavaScript array
      return Array.from(output.data);
    } catch (error) {
      console.error("[embedding.service] Single generation failed:", error);
      throw new Error("Failed to generate vector embedding.");
    }
  }

  /**
   * Generates embeddings for a batch of strings.
   * Useful for bulk inserts or complex multi-vector queries.
   * @param {string[]} texts 
   * @returns {Promise<number[][]>}
   */
  async generateBatch(texts) {
    try {
      const extractor = await this.getExtractor();
      
      // Map through texts and generate embeddings in parallel
      const embeddings = await Promise.all(
        texts.map(async (text) => {
          const output = await extractor(text, { pooling: 'mean', normalize: true });
          return Array.from(output.data);
        })
      );

      return embeddings;
    } catch (error) {
      console.error("[embedding.service] Batch generation failed:", error);
      throw new Error("Failed to generate batch vector embeddings.");
    }
  }
}

module.exports = new EmbeddingService();