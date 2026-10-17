import fs from "fs";
import Tesseract from "tesseract.js";
import { fromPath } from "pdf2pic";
import pdfjsLib from "pdfjs-dist/legacy/build/pdf.js";

// Silence non-critical pdf.js console warnings (like TrueType font parsing)
pdfjsLib.GlobalWorkerOptions.verbosity = pdfjsLib.VerbosityLevel.ERRORS;

// ===== Helper function: PDF → Image → OCR =====
async function pdfToImageAndOCR(pdfPath) {
  const textOutput = [];
  const convert = fromPath(pdfPath, { density: 200, saveFilename: "page" });

  // Convert 1st page → test OCR
  const firstPage = await convert(1, true);
  const firstOCR = await Tesseract.recognize(firstPage.path, "eng");
  textOutput.push(firstOCR.data.text);

  // If PDF has multiple pages → loop extract
  const totalPages = firstOCR.data.conf > 40 ? firstOCR.data.blocks.length : 1;

  for (let i = 2; i <= totalPages; i++) {
    const result = await convert(i, true);
    const ocr = await Tesseract.recognize(result.path, "eng");
    textOutput.push(ocr.data.text);
  }

  return textOutput.join("\n");
}

// ===== Main Hybrid Extractor =====
export async function extractTextHybrid(filePath, mimeType) {
  let text = "";

  // IMAGE FILES → OCR directly
  if (mimeType.startsWith("image/")) {
    const result = await Tesseract.recognize(filePath, "eng");
    return result.data.text;
  }

  // PDF FILES → Try pure text extraction first
  if (mimeType === "application/pdf") {
    try {
      const pdf = await pdfjsLib.getDocument(filePath).promise;
      let pdfText = "";

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const content = await page.getTextContent();
        const strings = content.items.map((item) => item.str).join(" ");
        pdfText += strings + "\n";
      }

      // If extracted text is significant → return now (FAST)
      if (pdfText.trim().length > 200) return pdfText;

      // Else fallback to OCR image extraction
      return await pdfToImageAndOCR(filePath);
    } catch {
      // Any PDF.js failure → direct OCR fallback
      return await pdfToImageAndOCR(filePath);
    }
  }

  return "";
}
