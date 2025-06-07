import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  FileText, 
  Image, 
  X, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  Brain
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface DocumentUploaderProps {
  onQuizGenerated: (quiz: any) => void;
  gameMode: string;
  onClose: () => void;
}

interface UploadedFile {
  file: File;
  preview?: string;
  type: 'document' | 'image';
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

const DocumentUploader: React.FC<DocumentUploaderProps> = ({ 
  onQuizGenerated, 
  gameMode, 
  onClose 
}) => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const supportedFormats = {
    documents: ['.pdf', '.doc', '.docx', '.txt', '.md'],
    images: ['.jpg', '.jpeg', '.png', '.gif', '.webp']
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      handleFiles(files);
    }
  };

  const handleFiles = (files: File[]) => {
    const validFiles: UploadedFile[] = [];

    files.forEach(file => {
      const extension = '.' + file.name.split('.').pop()?.toLowerCase();
      const isDocument = supportedFormats.documents.includes(extension);
      const isImage = supportedFormats.images.includes(extension);

      if (isDocument || isImage) {
        const uploadedFile: UploadedFile = {
          file,
          type: isDocument ? 'document' : 'image',
          status: 'pending'
        };

        // Create preview for images
        if (isImage) {
          const reader = new FileReader();
          reader.onload = (e) => {
            setUploadedFiles(prev => prev.map(f => 
              f.file === file ? { ...f, preview: e.target?.result as string } : f
            ));
          };
          reader.readAsDataURL(file);
        }

        validFiles.push(uploadedFile);
      } else {
        toast.error(`Unsupported file format: ${extension}`);
      }
    });

    setUploadedFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (fileToRemove: File) => {
    setUploadedFiles(prev => prev.filter(f => f.file !== fileToRemove));
  };

  const generateQuizFromFiles = async () => {
    if (uploadedFiles.length === 0) {
      toast.error('Please upload at least one file');
      return;
    }

    setIsGenerating(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      
      uploadedFiles.forEach(({ file }, index) => {
        formData.append(`files`, file);
      });

      formData.append('gameMode', gameMode);
      formData.append('difficulty', 'medium');      formData.append('questionCount', gameMode === 'speed' ? '20' : gameMode === 'survival' ? '100' : '10');

      const token = localStorage.getItem('eduToken');
      
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);
      
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/ai/generate-quiz-from-files`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        throw new Error(`Failed to generate quiz: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success && result.quiz) {
        setUploadedFiles(prev => prev.map(f => ({ ...f, status: 'success' })));
        toast.success('Quiz generated successfully!');
        onQuizGenerated(result.quiz);
      } else {
        throw new Error(result.message || 'Failed to generate quiz');
      }

    } catch (error) {
      console.error('Quiz generation error:', error);
      setUploadedFiles(prev => prev.map(f => ({ ...f, status: 'error', error: error.message })));
      toast.error('Failed to generate quiz from files. Please try again.');
    } finally {
      setIsGenerating(false);
      setUploadProgress(0);
    }
  };

  const getFileIcon = (type: string, extension: string) => {
    if (type === 'image') {
      return <Image className="h-6 w-6 text-blue-500" />;
    }
    return <FileText className="h-6 w-6 text-green-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <Card className="bg-white/10 backdrop-blur border-white/20 text-white">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Brain className="h-6 w-6 text-purple-400" />
                <span>Generate Quiz from Documents</span>
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-white hover:bg-white/20"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-purple-200">
              Upload documents or images to generate AI-powered quiz questions
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            
            {/* Upload Area */}
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive 
                  ? 'border-purple-400 bg-purple-500/20' 
                  : 'border-white/30 hover:border-white/50'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <Upload className="h-12 w-12 text-purple-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Drop files here or click to upload
              </h3>
              <p className="text-sm text-purple-200 mb-4">
                Supports documents (PDF, DOC, TXT) and images (JPG, PNG, GIF)
              </p>
                <input
                type="file"
                multiple
                accept={[...supportedFormats.documents, ...supportedFormats.images].join(',')}
                onChange={handleFileInput}
                className="hidden"
                id="file-upload-input"
              />
              <Button 
                variant="outline" 
                className="border-white/30 text-white hover:bg-white/20"
                onClick={() => document.getElementById('file-upload-input')?.click()}
                type="button"
              >
                <Upload className="h-4 w-4 mr-2" />
                Browse Files
              </Button>
            </div>

            {/* Supported Formats */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-green-400" />
                  <span>Documents</span>
                </h4>
                <div className="flex flex-wrap gap-1">
                  {supportedFormats.documents.map(format => (
                    <Badge key={format} variant="outline" className="text-xs border-green-400/30 text-green-400">
                      {format}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center space-x-2">
                  <Image className="h-4 w-4 text-blue-400" />
                  <span>Images</span>
                </h4>
                <div className="flex flex-wrap gap-1">
                  {supportedFormats.images.map(format => (
                    <Badge key={format} variant="outline" className="text-xs border-blue-400/30 text-blue-400">
                      {format}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Uploaded Files */}
            {uploadedFiles.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-3">Uploaded Files ({uploadedFiles.length})</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {uploadedFiles.map((uploadedFile, index) => (
                    <div key={index} className="flex items-center space-x-3 bg-white/5 rounded-lg p-3">
                      {uploadedFile.preview ? (
                        <img 
                          src={uploadedFile.preview} 
                          alt="Preview" 
                          className="w-10 h-10 object-cover rounded"
                        />
                      ) : (
                        getFileIcon(uploadedFile.type, uploadedFile.file.name.split('.').pop() || '')
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{uploadedFile.file.name}</p>
                        <p className="text-xs text-purple-200">
                          {formatFileSize(uploadedFile.file.size)} • {uploadedFile.type}
                        </p>
                      </div>

                      <div className="flex items-center space-x-2">
                        {uploadedFile.status === 'success' && (
                          <CheckCircle className="h-4 w-4 text-green-400" />
                        )}
                        {uploadedFile.status === 'error' && (
                          <AlertCircle className="h-4 w-4 text-red-400" />
                        )}
                        {uploadedFile.status === 'pending' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(uploadedFile.file)}
                            className="text-white hover:bg-white/20 p-1"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Progress Bar */}
            {isGenerating && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Generating quiz questions...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-white/20">
              <div className="text-sm text-purple-200 flex items-center gap-2">
                <span>Game Mode:</span>
                <Badge variant="outline" className="border-purple-400/30 text-purple-400">{gameMode}</Badge>
              </div>
              
              <div className="space-x-2">
                <Button
                  variant="outline"
                  onClick={onClose}
                  disabled={isGenerating}
                  className="border-white/30 text-white hover:bg-white/20"
                >
                  Cancel
                </Button>
                <Button
                  onClick={generateQuizFromFiles}
                  disabled={uploadedFiles.length === 0 || isGenerating}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Brain className="h-4 w-4 mr-2" />
                      Generate Quiz
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default DocumentUploader;
