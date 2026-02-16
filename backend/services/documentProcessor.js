const fs = require("fs").promises;
const fsSync = require("fs");
const path = require("path");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");
const csv = require("csv-parser");
const { marked } = require("marked");
const { v4: uuidv4 } = require("uuid");
const alternativePdfProcessor = require("./alternativePdfProcessor");

class DocumentProcessor {
  constructor() {
    this.chunkSize = 500; // Larger chunks for Q&A pairs
    this.chunkOverlap = 100; // Overlap for context
    this.qaPatterns = [
      /Q\s*\d*\s*[:.]\s*(.*?)\s*A\s*\d*\s*[:.]\s*(.*?)(?=Q\s*\d*\s*[:.]\s*|$)/gis,
      /Question\s*\d*\s*[:.]\s*(.*?)\s*Answer\s*\d*\s*[:.]\s*(.*?)(?=Question\s*\d*\s*[:.]\s*|$)/gis,
      /\d+\.\s*(.*?)\s*Answer\s*[:.]\s*(.*?)(?=\d+\.\s*|$)/gis,
      /\*\*Q\d*\*\*\s*(.*?)\s*\*\*A\d*\*\*\s*(.*?)(?=\*\*Q\d*\*\*|$)/gis,
      /(\d+\.\s*.*?\?)\s*(.*?)(?=\d+\.\s*.*?\?|$)/gis, // Numbered questions
      /(What\s+.*?\?|How\s+.*?\?|Why\s+.*?\?|When\s+.*?\?|Where\s+.*?\?|Who\s+.*?\?|Which\s+.*?\?|Can\s+.*?\?|Is\s+.*?\?|Are\s+.*?\?|Do\s+.*?\?|Does\s+.*?\?|Will\s+.*?\?|Should\s+.*?\?)\s*(.*?)(?=(?:What\s+.*?\?|How\s+.*?\?|Why\s+.*?\?|When\s+.*?\?|Where\s+.*?\?|Who\s+.*?\?|Which\s+.*?\?|Can\s+.*?\?|Is\s+.*?\?|Are\s+.*?\?|Do\s+.*?\?|Does\s+.*?\?|Will\s+.*?\?|Should\s+.*?\?)|$)/gis, // Natural questions
    ];
  }

  async processFile(filePath, fileType, originalName) {
    try {
      console.log(
        `📄 Processing ${fileType.toUpperCase()} file: ${originalName}`,
      );

      let content = "";

      switch (fileType.toLowerCase()) {
        case "pdf":
          content = await this.processPDF(filePath);
          break;
        case "docx":
          content = await this.processDOCX(filePath);
          break;
        case "txt":
          content = await this.processTXT(filePath);
          break;
        case "csv":
          content = await this.processCSV(filePath);
          break;
        case "md":
          content = await this.processMarkdown(filePath);
          break;
        default:
          throw new Error(`Unsupported file type: ${fileType}`);
      }

      // Clean and validate content
      content = this.cleanContent(content);

      if (!content || content.trim().length < 10) {
        throw new Error(
          "File appears to be empty or contains insufficient content",
        );
      }

      // Extract Q&A pairs first
      const qaChunks = this.extractQAPairs(content);

      // If Q&A pairs found, use them; otherwise create regular chunks
      const chunks =
        qaChunks.length > 0 ? qaChunks : this.createChunks(content);

      console.log(
        `Processed ${originalName}: ${content.length} characters, ${chunks.length} chunks (${qaChunks.length > 0 ? "Q&A format" : "regular format"})`,
      );

      return {
        content,
        chunks,
        wordCount: content.split(/\s+/).length,
        characterCount: content.length,
        isQAFormat: qaChunks.length > 0,
        qaCount: qaChunks.length,
      };
    } catch (error) {
      console.error(`❌ Error processing file ${originalName}:`, error.message);
      throw error;
    }
  }

  async processPDF(filePath) {
    try {
      // Check file size first
      const stats = await fs.stat(filePath);
      const fileSizeMB = stats.size / (1024 * 1024);

      console.log(`📄 PDF file size: ${fileSizeMB.toFixed(2)}MB`);

      if (fileSizeMB > 10) {
        throw new Error(
          "PDF file too large (>10MB). Please use a smaller file.",
        );
      }

      // Try pdf-parse first with memory-optimized options
      try {
        console.log("Attempting PDF processing with pdf-parse...");

        const dataBuffer = await fs.readFile(filePath);

        // Use pdf-parse with memory-optimized options
        const data = await pdfParse(dataBuffer, {
          max: 20, // Limit to first 20 pages
          version: "v1.10.100", // Use older, more stable version
        });

        // Clean and limit the extracted text
        let text = data.text || "";

        // Limit text length to prevent memory issues
        if (text.length > 8000) {
          console.warn(
            `PDF text truncated from ${text.length} to 8000 characters for memory efficiency`,
          );
          text = text.substring(0, 8000) + "...";
        }

        if (text.trim().length < 10) {
          throw new Error("Insufficient text extracted from PDF");
        }

        console.log("PDF processed successfully with pdf-parse");
        return text;
      } catch (pdfParseError) {
        console.warn(`pdf-parse failed: ${pdfParseError.message}`);
        console.log("Trying alternative PDF processing...");

        // Try alternative PDF processor
        const alternativeText =
          await alternativePdfProcessor.processPDF(filePath);
        console.log("PDF processed successfully with alternative method");
        return alternativeText;
      }
    } catch (error) {
      console.error("❌ All PDF processing methods failed:", error.message);
      throw new Error(
        `Failed to process PDF: ${error.message}. The PDF might be corrupted, password-protected, or contain only images.`,
      );
    }
  }

  async processDOCX(filePath) {
    try {
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value;
    } catch (error) {
      throw new Error(`Failed to process DOCX: ${error.message}`);
    }
  }

  async processTXT(filePath) {
    try {
      const content = await fs.readFile(filePath, "utf8");
      return content;
    } catch (error) {
      throw new Error(`Failed to process TXT: ${error.message}`);
    }
  }

  async processCSV(filePath) {
    try {
      return new Promise((resolve, reject) => {
        const results = [];
        const stream = require("fs").createReadStream(filePath);

        stream
          .pipe(csv())
          .on("data", (data) => results.push(data))
          .on("end", () => {
            // Convert CSV data to readable text
            const content = results
              .map((row) => {
                return Object.entries(row)
                  .map(([key, value]) => `${key}: ${value}`)
                  .join(", ");
              })
              .join("\n");

            resolve(content);
          })
          .on("error", reject);
      });
    } catch (error) {
      throw new Error(`Failed to process CSV: ${error.message}`);
    }
  }

  async processMarkdown(filePath) {
    try {
      const markdownContent = await fs.readFile(filePath, "utf8");
      // Convert markdown to plain text
      const htmlContent = marked(markdownContent);
      // Strip HTML tags to get plain text
      const plainText = htmlContent.replace(/<[^>]*>/g, "");
      return plainText;
    } catch (error) {
      throw new Error(`Failed to process Markdown: ${error.message}`);
    }
  }

  extractQAPairs(content) {
    const qaPairs = [];
    let pairIndex = 0;

    console.log("Extracting Q&A pairs from content...");
    console.log(`📄 Content length: ${content.length} characters`);

    // Try different Q&A patterns
    for (const pattern of this.qaPatterns) {
      const matches = [...content.matchAll(pattern)];

      if (matches.length > 0) {
        console.log(
          `Found ${matches.length} Q&A pairs using pattern ${this.qaPatterns.indexOf(pattern) + 1}`,
        );

        for (const match of matches) {
          const rawQuestion = match[1];
          const rawAnswer = match[2];

          console.log(`Raw match ${pairIndex + 1}:`);
          console.log(`   Question: "${rawQuestion?.substring(0, 100)}..."`);
          console.log(`   Answer: "${rawAnswer?.substring(0, 100)}..."`);

          const question = this.cleanText(rawQuestion);
          const answer = this.cleanText(rawAnswer);

          console.log(`🧹 Cleaned match ${pairIndex + 1}:`);
          console.log(`   Question: "${question?.substring(0, 100)}..."`);
          console.log(`   Answer: "${answer?.substring(0, 100)}..."`);
          console.log(`   Question length: ${question?.length || 0}`);
          console.log(`   Answer length: ${answer?.length || 0}`);

          if (question && answer && question.length > 5 && answer.length > 5) {
            // Limit question and answer length to prevent schema issues
            const truncatedQuestion =
              question.length > 500
                ? question.substring(0, 500) + "..."
                : question;
            const truncatedAnswer =
              answer.length > 500 ? answer.substring(0, 500) + "..." : answer;

            qaPairs.push({
              id: uuidv4(),
              text: `Q: ${truncatedQuestion}\nA: ${truncatedAnswer}`,
              metadata: {
                chunkIndex: pairIndex,
                type: "qa_pair",
                question: truncatedQuestion,
                answer: truncatedAnswer,
                questionLength: truncatedQuestion.length,
                answerLength: truncatedAnswer.length,
                startChar: 0,
                endChar: truncatedQuestion.length + truncatedAnswer.length,
              },
            });
            console.log(`Added Q&A pair ${pairIndex + 1}`);
            pairIndex++;
          } else {
            console.log(
              `❌ Skipped match ${pairIndex + 1} - insufficient content`,
            );
          }
        }

        // If we found Q&A pairs with this pattern, use them
        if (qaPairs.length > 0) {
          console.log(
            `Using ${qaPairs.length} Q&A pairs from pattern ${this.qaPatterns.indexOf(pattern) + 1}`,
          );
          break;
        }
      }
    }

    // If no structured Q&A found, try to detect FAQ-like content
    if (qaPairs.length === 0) {
      const faqPairs = this.detectFAQContent(content);
      qaPairs.push(...faqPairs);
    }

    console.log(` Extracted ${qaPairs.length} Q&A pairs total`);
    return qaPairs;
  }

  detectFAQContent(content) {
    const faqPairs = [];
    let pairIndex = 0;

    // Split content into potential Q&A sections
    const lines = content
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    let currentQuestion = "";
    let currentAnswer = "";
    let isCollectingAnswer = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Check if line looks like a question
      if (this.looksLikeQuestion(line)) {
        // Save previous Q&A pair if exists
        if (currentQuestion && currentAnswer) {
          // Limit question and answer length
          const truncatedQuestion =
            currentQuestion.length > 500
              ? currentQuestion.substring(0, 500) + "..."
              : currentQuestion;
          const truncatedAnswer =
            currentAnswer.length > 500
              ? currentAnswer.substring(0, 500) + "..."
              : currentAnswer;

          faqPairs.push({
            id: uuidv4(),
            text: `Q: ${truncatedQuestion}\nA: ${truncatedAnswer}`,
            metadata: {
              chunkIndex: pairIndex,
              type: "detected_qa",
              question: truncatedQuestion,
              answer: truncatedAnswer,
              questionLength: truncatedQuestion.length,
              answerLength: truncatedAnswer.length,
              startChar: 0,
              endChar: truncatedQuestion.length + truncatedAnswer.length,
            },
          });
          pairIndex++;
        }

        currentQuestion = this.cleanText(line);
        currentAnswer = "";
        isCollectingAnswer = true;
      } else if (isCollectingAnswer && line.length > 0) {
        // Collect answer lines
        currentAnswer += (currentAnswer ? " " : "") + line;
      }
    }

    // Don't forget the last pair
    if (currentQuestion && currentAnswer) {
      // Limit question and answer length
      const truncatedQuestion =
        currentQuestion.length > 500
          ? currentQuestion.substring(0, 500) + "..."
          : currentQuestion;
      const truncatedAnswer =
        currentAnswer.length > 500
          ? currentAnswer.substring(0, 500) + "..."
          : currentAnswer;

      faqPairs.push({
        id: uuidv4(),
        text: `Q: ${truncatedQuestion}\nA: ${truncatedAnswer}`,
        metadata: {
          chunkIndex: pairIndex,
          type: "detected_qa",
          question: truncatedQuestion,
          answer: truncatedAnswer,
          questionLength: truncatedQuestion.length,
          answerLength: truncatedAnswer.length,
          startChar: 0,
          endChar: truncatedQuestion.length + truncatedAnswer.length,
        },
      });
    }

    return faqPairs;
  }

  looksLikeQuestion(text) {
    // Check if text looks like a question
    const questionIndicators = [
      text.endsWith("?"),
      text.toLowerCase().startsWith("what"),
      text.toLowerCase().startsWith("how"),
      text.toLowerCase().startsWith("why"),
      text.toLowerCase().startsWith("when"),
      text.toLowerCase().startsWith("where"),
      text.toLowerCase().startsWith("who"),
      text.toLowerCase().startsWith("which"),
      text.toLowerCase().startsWith("can"),
      text.toLowerCase().startsWith("is"),
      text.toLowerCase().startsWith("are"),
      text.toLowerCase().startsWith("do"),
      text.toLowerCase().startsWith("does"),
      text.toLowerCase().startsWith("will"),
      text.toLowerCase().startsWith("should"),
      /^q\d*[:.]/i.test(text),
      /^question\d*[:.]/i.test(text),
      /^\d+\./i.test(text) && text.includes("?"),
    ];

    return (
      questionIndicators.some((indicator) => indicator) && text.length > 10
    );
  }

  cleanText(text) {
    if (!text) return "";

    return text
      .replace(/^(Q\d*|Question\d*|A\d*|Answer\d*)[:.]\s*/i, "") // Remove Q/A prefixes
      .replace(/^\d+\.\s*/, "") // Remove numbering
      .replace(/^\*\*.*?\*\*\s*/, "") // Remove markdown bold
      .replace(/\s+/g, " ") // Normalize whitespace
      .replace(/[\r\n]+/g, " ") // Replace line breaks with spaces
      .trim();
  }

  cleanContent(content) {
    if (!content) return "";

    return (
      content
        // Remove excessive whitespace
        .replace(/\s+/g, " ")
        // Remove special characters that might cause issues
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
        // Trim whitespace
        .trim()
    );
  }

  createChunks(content) {
    const chunks = [];
    const contentLength = content.length;

    // Use appropriate chunk size for FAQ content
    const effectiveChunkSize = Math.min(this.chunkSize, 500);
    const effectiveOverlap = Math.min(this.chunkOverlap, 100);

    if (contentLength <= effectiveChunkSize) {
      // Content is small enough to be a single chunk
      chunks.push({
        id: uuidv4(),
        text: content,
        metadata: {
          chunkIndex: 0,
          type: "content_chunk",
          startChar: 0,
          endChar: contentLength,
        },
      });
      return chunks;
    }

    let startIndex = 0;
    let chunkIndex = 0;
    const maxChunks = 100; // Allow more chunks for FAQ content

    while (startIndex < contentLength && chunkIndex < maxChunks) {
      let endIndex = Math.min(startIndex + effectiveChunkSize, contentLength);

      // Try to break at sentence boundaries
      if (endIndex < contentLength) {
        const sentenceEnd = content.lastIndexOf(".", endIndex);
        const questionEnd = content.lastIndexOf("?", endIndex);
        const exclamationEnd = content.lastIndexOf("!", endIndex);
        const newlineEnd = content.lastIndexOf("\n", endIndex);

        const bestEnd = Math.max(
          sentenceEnd,
          questionEnd,
          exclamationEnd,
          newlineEnd,
        );

        if (bestEnd > startIndex + effectiveChunkSize * 0.5) {
          endIndex = bestEnd + 1;
        }
      }

      const chunkText = content.substring(startIndex, endIndex).trim();

      if (chunkText.length > 20) {
        // Only include meaningful chunks
        chunks.push({
          id: uuidv4(),
          text: chunkText,
          metadata: {
            chunkIndex,
            type: "content_chunk",
            startChar: startIndex,
            endChar: endIndex,
          },
        });
        chunkIndex++;
      }

      // Move start index with overlap
      startIndex = endIndex - effectiveOverlap;
      if (startIndex < 0) startIndex = 0;
    }

    if (chunkIndex >= maxChunks) {
      console.warn(`Document truncated to ${maxChunks} chunks`);
    }

    return chunks;
  }

  getSupportedFileTypes() {
    return ["pdf", "docx", "txt", "csv", "md"];
  }

  validateFileType(filename) {
    const extension = path.extname(filename).toLowerCase().substring(1);
    return this.getSupportedFileTypes().includes(extension);
  }

  getFileType(filename) {
    return path.extname(filename).toLowerCase().substring(1);
  }
}

module.exports = new DocumentProcessor();
