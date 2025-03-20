import React, { useState } from "react";
import {
  Container,
  TextField,
  Button,
  Typography,
  Box,
  CircularProgress,
  Snackbar,
  Alert,
  Paper,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import axios from "axios";
import * as mammoth from "mammoth";
import { extractPdfText } from "./components/PdfExtractor";
import "./styles.css";

// Helper function to read file as text
const readAsText = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => resolve(event.target.result);
    reader.onerror = (error) => reject(error);
    reader.readAsText(file);
  });
};

// Helper function to extract text from Word documents
const extractWordText = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const arrayBuffer = event.target.result;
        const result = await mammoth.extractRawText({ arrayBuffer });
        resolve(result.value);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
};

// Helper function to extract text from HTML
const extractHtmlText = async (file) => {
  const html = await readAsText(file);
  const div = document.createElement("div");
  div.innerHTML = html;
  return div.textContent || div.innerText || "";
};

// File converter plugin
const FileConverter = {
  // Extract text from different file types
  extractText: async (file) => {
    if (!file) return null;

    const fileType = file.type;
    const fileName = file.name.toLowerCase();

    // Plain text files
    if (fileType === "text/plain") {
      return await readAsText(file);
    }

    // PDF files
    else if (fileType === "application/pdf" || fileName.endsWith(".pdf")) {
      return await extractPdfText(file);
    }

    // Word documents
    else if (
      fileType ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      fileType === "application/msword" ||
      fileName.endsWith(".docx") ||
      fileName.endsWith(".doc")
    ) {
      return await extractWordText(file);
    }

    // Rich text format
    else if (fileType === "application/rtf" || fileName.endsWith(".rtf")) {
      return await readAsText(file);
    }

    // HTML files
    else if (
      fileType === "text/html" ||
      fileName.endsWith(".html") ||
      fileName.endsWith(".htm")
    ) {
      return await extractHtmlText(file);
    }

    // CSV files
    else if (fileType === "text/csv" || fileName.endsWith(".csv")) {
      return await readAsText(file);
    }

    // JSON files
    else if (fileType === "application/json" || fileName.endsWith(".json")) {
      return await readAsText(file);
    }

    // Markdown files
    else if (fileType === "text/markdown" || fileName.endsWith(".md")) {
      return await readAsText(file);
    }

    // XML files
    else if (fileType === "application/xml" || fileName.endsWith(".xml")) {
      return await readAsText(file);
    }

    // Unsupported file type
    else {
      throw new Error(`Unsupported file type: ${fileType}`);
    }
  },
};

const App = () => {
  const [textInput, setTextInput] = useState("");
  const [file, setFile] = useState(null);
  const [fileText, setFileText] = useState("");
  const [loading, setLoading] = useState(false);
  const [processingFile, setProcessingFile] = useState(false);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);

  // Handle text input change
  const handleTextChange = (event) => {
    setTextInput(event.target.value);
  };

  // Handle file selection and conversion
  const handleFileChange = async (event) => {
    const selectedFile = event.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setProcessingFile(true);
    setError(null);

    try {
      const extractedText = await FileConverter.extractText(selectedFile);
      setFileText(extractedText);
      // Update the text input with the file content
      setTextInput(extractedText);
    } catch (err) {
      console.error("File conversion error:", err);
      setError(`Error converting file: ${err.message}`);
    } finally {
      setProcessingFile(false);
    }
  };

  // Make API call
  const handleApiCall = async () => {
    setLoading(true);
    setResponse(null);
    setError(null);

    let inputData = textInput || fileText;

    if (!inputData) {
      setError("Please enter text or upload a file.");
      setLoading(false);
      return;
    }

    const apiKey = "AIzaSyDVmSSWq-GRgCeBNyBTYh-C1ca048Fo85U"; // Store securely
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: `Analyze the PRD below and generate a **structured to-do list** for developers to complete **before submitting a PR**.
    
    ### Guidelines:
    - Focus only on **development** and **pre-PR manual testing**.
    - **Exclude deployment, CI/CD, and post-merge tasks**.
    - **Exclude unit tests** (assumed to be automated).
    - Testing should be written for developers performing **manual unit tests** (not testers). No automated test instructions.
    - Ensure **every task has a heading and a description**.
    - Categorize tasks into **Backend, Frontend, and Testing**.
    
    ### Format:
    Return a JSON array where each task follows this structure:
    {
      "id": 1,
      "heading": "[Short Task Title]",
      "description": "[Brief Explanation]",
      "category": "[backend/frontend/testing]",
      "completed": false
    }
    
    ### PRD Content:
    ${inputData}
    
    Ensure all necessary development and testing tasks are **clearly outlined**.`,
            },
          ],
        },
      ],
    };

    try {
      console.log("Sending request:", requestBody);

      const res = await axios.post(apiUrl, requestBody, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      let generatedText =
        res.data?.candidates?.[0]?.content?.parts?.[0]?.text ||
        "No response received.";
      // console.log("API Response:", generatedText);
      generatedText = generatedText.replace(/```json\n|\n```/g, "").trim();
      console.log(JSON.parse(generatedText));
      setResponse(generatedText);
    } catch (err) {
      console.error("API Error:", err);
      setError("Failed to fetch response from API.");
    }

    setLoading(false);
  };

  return (
    <Container maxWidth="md" sx={{ mt: 5 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
        <Typography variant="h4" gutterBottom align="center">
          NeuroTask – Smart task breakdown
        </Typography>

        {/* Text Input */}
        <TextField
          label="Enter PRD Text"
          variant="outlined"
          fullWidth
          multiline
          rows={4}
          value={textInput}
          onChange={handleTextChange}
          sx={{ mb: 3 }}
        />

        {/* File Upload */}
        <Box sx={{ mb: 3, display: "flex", alignItems: "center", gap: 2 }}>
          <Button
            variant="contained"
            component="label"
            startIcon={<CloudUploadIcon />}
            disabled={processingFile}
          >
            {processingFile ? "Processing..." : "Upload PRD File"}
            <input type="file" hidden onChange={handleFileChange} />
          </Button>
          {file && <Typography>{file.name}</Typography>}
          {processingFile && <CircularProgress size={20} />}
        </Box>

        {/* File Info */}
        {file && fileText && (
          <Paper elevation={1} sx={{ mb: 3, p: 2, backgroundColor: "#f0f7ff" }}>
            <Typography variant="body2" color="textSecondary">
              File processed successfully: {file.name} (
              {Math.round(file.size / 1024)} KB)
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Extracted {fileText.length} characters of text
            </Typography>
          </Paper>
        )}

        {/* Submit Button */}
        <Button
          variant="contained"
          color="primary"
          fullWidth
          onClick={handleApiCall}
          disabled={loading || processingFile}
        >
          {loading ? <CircularProgress size={24} /> : "Generate My Task"}
        </Button>

        {/* Response Display */}
        {response && (
          <Paper elevation={2} sx={{ mt: 3, p: 2, backgroundColor: "#f4f6f8" }}>
            <Typography variant="h6">Generated Task List:</Typography>
            <Typography>{response}</Typography>
          </Paper>
        )}

        {/* Error Message */}
        <Snackbar
          open={!!error}
          autoHideDuration={4000}
          onClose={() => setError(null)}
        >
          <Alert severity="error">{error}</Alert>
        </Snackbar>
      </Paper>
    </Container>
  );
};

export default App;
