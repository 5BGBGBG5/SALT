export interface FileValidationResult {
  isValid: boolean;
  error?: string;
  details?: {
    size: number;
    type: string;
    extension: string;
  };
}

export const validateFile = (file: File): FileValidationResult => {
  const MAX_SIZE = 10 * 1024 * 1024; // 10MB
  const ALLOWED_TYPES = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/markdown'
  ];
  const ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.txt', '.md'];

  const details = {
    size: file.size,
    type: file.type,
    extension: '.' + file.name.split('.').pop()?.toLowerCase() || ''
  };

  // Check file size
  if (file.size > MAX_SIZE) {
    return {
      isValid: false,
      error: `File size ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds maximum allowed size of 10MB`,
      details
    };
  }

  // Check file extension
  if (!ALLOWED_EXTENSIONS.includes(details.extension)) {
    return {
      isValid: false,
      error: `File extension ${details.extension} is not supported. Allowed types: ${ALLOWED_EXTENSIONS.join(', ')}`,
      details
    };
  }

  // Check MIME type (if provided by browser)
  if (file.type && !ALLOWED_TYPES.includes(file.type)) {
    return {
      isValid: false,
      error: `File type ${file.type} is not supported. Allowed types: PDF, DOCX, TXT, MD`,
      details
    };
  }

  return {
    isValid: true,
    details
  };
};

export const validateFileContent = async (file: File): Promise<FileValidationResult> => {
  // Basic validation first
  const basicValidation = validateFile(file);
  if (!basicValidation.isValid) {
    return basicValidation;
  }

  try {
    // Read first few bytes to verify file signature
    const buffer = await file.slice(0, 8).arrayBuffer();
    const bytes = new Uint8Array(buffer);

    // PDF signature: %PDF
    if (file.name.toLowerCase().endsWith('.pdf')) {
      const pdfSignature = [0x25, 0x50, 0x44, 0x46]; // %PDF
      const matches = pdfSignature.every((byte, index) => bytes[index] === byte);
      if (!matches) {
        return {
          isValid: false,
          error: 'File appears to be corrupted or not a valid PDF',
          details: basicValidation.details
        };
      }
    }

    // DOCX signature: PK (ZIP archive)
    if (file.name.toLowerCase().endsWith('.docx')) {
      const zipSignature = [0x50, 0x4B]; // PK
      const matches = zipSignature.every((byte, index) => bytes[index] === byte);
      if (!matches) {
        return {
          isValid: false,
          error: 'File appears to be corrupted or not a valid DOCX',
          details: basicValidation.details
        };
      }
    }

    return basicValidation;
  } catch {
    return {
      isValid: false,
      error: 'Unable to validate file content',
      details: basicValidation.details
    };
  }
};
