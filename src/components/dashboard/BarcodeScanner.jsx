
import React, { useRef, useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Camera, X, Loader2, CheckCircle, Info } from "lucide-react";

export default function BarcodeScanner({ isOpen, onClose, onBarcodeScanned }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    try {
      setError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment', // Back camera for better barcode scanning
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('לא ניתן לגשת למצלמה. אנא ודא שנתת הרשאה לשימוש במצלמה.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const captureAndScanBarcode = async () => {
    if (!videoRef.current || !canvasRef.current || isProcessing) return;
    
    setIsProcessing(true);
    setError(null);
    setSuccess(null);
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw current video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    try {
      // Convert canvas to data URL first, then to blob
      const dataURL = canvas.toDataURL('image/jpeg', 0.8);
      
      // Convert data URL to blob
      const responseBlob = await fetch(dataURL);
      const blob = await responseBlob.blob();
      
      if (!blob || blob.size === 0) {
        throw new Error('לא ניתן ליצור תמונה מהמצלמה');
      }

      // Create a proper File object with correct properties
      const imageFile = new File([blob], `barcode_${Date.now()}.jpg`, { 
        type: "image/jpeg",
        lastModified: Date.now()
      });
      
      console.log('Created file:', {
        name: imageFile.name,
        size: imageFile.size,
        type: imageFile.type
      });
      
      // Upload image and extract barcode
      const { UploadFile, InvokeLLM } = await import('@/api/integrations');
      const uploadResult = await UploadFile({ file: imageFile });
      
      if (!uploadResult || !uploadResult.file_url) {
        throw new Error('העלאת התמונה נכשלה');
      }

      // Use AI to extract barcode and nutrition facts
      const response = await InvokeLLM({
        prompt: `The user has provided an image of a food product. Your task is to extract the following information:
1.  **Barcode:** Find the EAN-13 or UPC barcode number.
2.  **Nutrition Facts per 100g:** Extract calories, protein, carbohydrates, and fat.
3.  **Product Name:** Identify the product's name.

Return the result as a JSON object with the following structure. If any field is not found, return null for that field.

{
  "barcode": "string | null",
  "name": "string | null",
  "calories": "number | null",
  "protein": "number | null",
  "carbs": "number | null",
  "fat": "number | null"
}`,
        file_urls: [uploadResult.file_url], // Corrected to use the full URL from the upload result
        response_json_schema: {
          type: "object",
          properties: {
            barcode: { type: ["string", "null"] },
            name: { type: ["string", "null"] },
            calories: { type: ["number", "null"] },
            protein: { type: ["number", "null"] },
            carbs: { type: ["number", "null"] },
            fat: { type: ["number", "null"] }
          }
        }
      });
      
      if (response && response.barcode && response.name) {
        setSuccess(`נמצא: ${response.name}`);
        setTimeout(() => {
          onBarcodeScanned({
            name: response.name,
            calories: response.calories || 0,
            protein: response.protein || 0,
            carbs: response.carbs || 0,
            fat: response.fat || 0,
            barcode: response.barcode
          });
          onClose();
        }, 1500);
      } else {
        setError('לא נמצא ברקוד או פרטי תזונה בתמונה. נסה שוב עם זווית אחרת.');
      }
    } catch (error) {
      console.error('Barcode scanning error:', error);
      setError(error.message || 'אירעה שגיאה בעיבוד התמונה');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Camera className="w-5 h-5" />
              סריקת ברקוד
            </div>
            <Button variant="ghost" size="icon" onClick={handleClose}>
              <X className="w-4 h-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <Alert className="bg-blue-50 border-blue-200 text-blue-800">
            <Info className="h-4 w-4" />
            <AlertTitle className="font-semibold">שים לב, הפיצ'ר בפיתוח</AlertTitle>
            <AlertDescription>
              הסריקה עלולה להציג נתונים לא מדויקים. מומלץ לוודא את התוצאה.
            </AlertDescription>
          </Alert>
          
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {success && (
            <Alert className="border-green-500 text-green-700">
              <CheckCircle className="w-4 h-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}
          
          <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
            <video 
              ref={videoRef} 
              className="w-full h-full object-cover"
              playsInline
              muted
            />
            
            {/* Barcode scanning overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="border-2 border-white border-dashed w-64 h-32 rounded-lg flex items-center justify-center">
                <p className="text-white text-sm text-center">מכוון את הברקוד לתוך המסגרת</p>
              </div>
            </div>
          </div>
          
          {/* Hidden canvas for image processing */}
          <canvas ref={canvasRef} className="hidden" />
          
          <div className="flex flex-col gap-4">
            <Button 
              onClick={captureAndScanBarcode}
              disabled={isProcessing || !stream}
              className="w-full bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 h-12"
            >
              {isProcessing ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  מעבד תמונה...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Camera className="w-5 h-5" />
                  צלם וסרוק ברקוד
                </div>
              )}
            </Button>
            
            <div className="text-center text-sm text-slate-600">
              מכוון את הברקוד לתוך המסגרת הלבנה ולחץ על כפתור הצילום
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
