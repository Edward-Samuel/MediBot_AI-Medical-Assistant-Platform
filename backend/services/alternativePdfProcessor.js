const fs = require("fs").promises;
const { spawn } = require("child_process");
const path = require("path");

class AlternativePdfProcessor {
  constructor() {
    this.maxFileSize = 10 * 1024 * 1024; // 10MB limit
  }

  async processPDFWithPdftotext(filePath) {
    try {
      console.log("Attempting PDF processing with pdftotext...");

      return new Promise((resolve, reject) => {
        const pdftotext = spawn("pdftotext", [
          "-layout",
          "-nopgbrk",
          filePath,
          "-",
        ]);

        let output = "";
        let error = "";

        pdftotext.stdout.on("data", (data) => {
          output += data.toString();
        });

        pdftotext.stderr.on("data", (data) => {
          error += data.toString();
        });

        pdftotext.on("close", (code) => {
          if (code === 0) {
            // Limit output size
            if (output.length > 10000) {
              output = output.substring(0, 10000) + "...";
            }
            resolve(output);
          } else {
            reject(new Error(`pdftotext failed: ${error}`));
          }
        });

        // Timeout after 30 seconds
        setTimeout(() => {
          pdftotext.kill();
          reject(new Error("PDF processing timeout"));
        }, 30000);
      });
    } catch (error) {
      throw new Error(`Alternative PDF processing failed: ${error.message}`);
    }
  }

  async processPDFSimple(filePath) {
    try {
      console.log("Attempting simple PDF text extraction...");

      // Check file size
      const stats = await fs.stat(filePath);
      if (stats.size > this.maxFileSize) {
        throw new Error(
          `PDF file too large: ${Math.round(stats.size / 1024 / 1024)}MB (max: 10MB)`,
        );
      }

      // Read file as buffer
      const buffer = await fs.readFile(filePath);

      // Simple text extraction - look for text between stream objects
      const pdfText = buffer.toString("binary");
      const textMatches = pdfText.match(/stream\s*(.*?)\s*endstream/gs);

      if (!textMatches) {
        throw new Error("No readable text found in PDF");
      }

      let extractedText = "";
      for (const match of textMatches.slice(0, 10)) {
        // Limit to first 10 streams
        // Simple text extraction - this is very basic
        const streamContent = match.replace(/stream\s*|\s*endstream/g, "");
        const readableText = streamContent.replace(/[^\x20-\x7E\n\r]/g, " ");
        extractedText += readableText + " ";

        if (extractedText.length > 5000) break; // Limit total text
      }

      // Clean up the text
      extractedText = extractedText
        .replace(/\s+/g, " ")
        .replace(/[^\w\s.,!?;:()\-]/g, "")
        .trim();

      if (extractedText.length < 10) {
        throw new Error("Insufficient readable text extracted from PDF");
      }

      return extractedText.substring(0, 5000); // Limit to 5000 characters
    } catch (error) {
      throw new Error(`Simple PDF processing failed: ${error.message}`);
    }
  }

  async processPDF(filePath) {
    const methods = [
      () => this.processPDFWithPdftotext(filePath),
      () => this.processPDFSimple(filePath),
    ];

    for (let i = 0; i < methods.length; i++) {
      try {
        console.log(
          `Trying PDF processing method ${i + 1}/${methods.length}...`,
        );
        const result = await methods[i]();
        console.log(`PDF processing method ${i + 1} succeeded`);
        return result;
      } catch (error) {
        console.warn(`PDF processing method ${i + 1} failed: ${error.message}`);
        if (i === methods.length - 1) {
          throw error; // Last method failed
        }
      }
    }
  }
}

module.exports = new AlternativePdfProcessor();
