const loadPdfJsLibrary = () => {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if (window.pdfjsLib) {
      resolve(window.pdfjsLib);
      return;
    }

    // Create script elements to load PDF.js
    const script = document.createElement("script");
    script.src =
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js";
    script.async = true;

    script.onload = () => {
      // Set the worker source
      window.pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js";

      resolve(window.pdfjsLib);
    };

    script.onerror = () => {
      reject(new Error("Failed to load PDF.js library"));
    };

    document.body.appendChild(script);
  });
};

// Extract text from PDF using dynamically loaded PDF.js
export const extractPdfText = async (file) => {
  try {
    // Load the PDF.js library
    const pdfjsLib = await loadPdfJsLibrary();

    // Read file as array buffer
    const arrayBuffer = await readFileAsArrayBuffer(file);

    // Load the PDF document
    const pdf = await pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
    }).promise;

    let fullText = "";

    // Extract text from each page
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item) => item.str).join(" ");
      fullText += pageText + "\n\n";
    }

    return fullText.trim();
  } catch (error) {
    console.error("PDF extraction error:", error);
    // Fallback for when PDF.js fails
    return `[Could not extract text from PDF. Error: ${error.message}]`;
  }
};

// Helper to read file as array buffer
const readFileAsArrayBuffer = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => resolve(event.target.result);
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
};
