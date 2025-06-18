import PDFDocument from "pdfkit"

// Default options for PDFKit
const defaultOptions = {
  size: 'A4',
  margin: 50,
  font: 'Helvetica' // Use built-in Helvetica font
}

// Create a wrapper function that creates PDFDocument with our default options
const createPDF = (options = {}) => {
  return new PDFDocument({
    ...defaultOptions,
    ...options
  })
}

export { createPDF } 