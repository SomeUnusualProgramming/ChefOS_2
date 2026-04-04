import { useState, useRef, useCallback } from 'react';
import { Camera, Upload, X, ScanLine, Loader2, ImagePlus } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { Language } from '@/types/chefos';
import { toast } from 'sonner';

interface ReceiptScannerProps {
  language: Language;
  onProductsDetected: (products: DetectedProduct[]) => void;
}

export interface DetectedProduct {
  name: string;
  quantity?: number;
  unit?: string;
  price?: number;
  rawText: string;
  confidence: number;
}

export default function ReceiptScanner({ language, onProductsDetected }: ReceiptScannerProps) {
  const { t } = useTranslation(language);
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [useCamera, setUseCamera] = useState(false);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Wybierz plik obrazu (JPG, PNG)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Zdjęcie jest za duże (max 10MB)');
      return;
    }

    setCapturedImage(file);
    setPreviewUrl(URL.createObjectURL(file));
  }, []);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCameraActive(true);
      setUseCamera(true);
    } catch (err) {
      toast.error('Brak dostępu do kamery. Sprawdź uprawnienia.');
      console.error('Camera error:', err);
    }
  }, []);

  const stopCamera = useCallback(() => {
    const stream = videoRef.current?.srcObject as MediaStream;
    stream?.getTracks().forEach(track => track.stop());
    setIsCameraActive(false);
    setUseCamera(false);
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);

    canvas.toBlob(blob => {
      if (!blob) return;
      const file = new File([blob], 'receipt-capture.jpg', { type: 'image/jpeg' });
      setCapturedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
      stopCamera();
    }, 'image/jpeg', 0.95);
  }, [stopCamera]);

  const processReceipt = useCallback(async () => {
    if (!capturedImage) {
      toast.error('Najpierw wybierz lub zrób zdjęcie paragonu');
      return;
    }

    setIsProcessing(true);

    try {
      // Convert image to base64
      const base64Image = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(capturedImage);
      });

      // Extract base64 data (remove data:image/... prefix)
      const base64Data = base64Image.split(',')[1];

      // Call AI Vision API
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `You are a receipt parsing assistant. Analyze the receipt image and extract all food/grocery products.

Return ONLY a JSON array in this exact format:
[
  {
    "name": "product name in Polish",
    "quantity": number (if visible),
    "unit": "unit like kg, g, l, ml, szt, opak (if visible)",
    "price": number (if visible),
    "rawText": "exact text from receipt",
    "confidence": 0.0-1.0
  }
]

Rules:
- Extract only food/grocery items, ignore non-food items like "torba", "torebka", "koszyk"
- Combine multi-line entries (product name on one line, price on next)
- If quantity is not specified, use 1
- Convert "2x1.5" style to quantity: 3, unit: "l" for drinks
- Be precise with Polish product names
- Confidence should reflect OCR quality and name clarity`
            },
            {
              role: 'user',
              content: [
                { type: 'text', text: 'Extract all products from this receipt:' },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:image/jpeg;base64,${base64Data}`,
                    detail: 'high'
                  }
                }
              ]
            }
          ],
          max_tokens: 2000,
          temperature: 0.1,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error('Empty response from AI');
      }

      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = content.match(/\[\s*\{[\s\S]*\}\s*\]/);
      if (!jsonMatch) {
        throw new Error('Could not parse products from response');
      }

      const products: DetectedProduct[] = JSON.parse(jsonMatch[0]);

      if (products.length === 0) {
        toast.warning('Nie znaleziono produktów na paragonie');
        return;
      }

      toast.success(`Znaleziono ${products.length} produktów`);
      onProductsDetected(products);

      // Reset scanner
      setIsOpen(false);
      setCapturedImage(null);
      setPreviewUrl(null);

    } catch (err) {
      console.error('Receipt processing error:', err);
      toast.error('Błąd przetwarzania paragonu. Spróbuj ponownie.');
    } finally {
      setIsProcessing(false);
    }
  }, [capturedImage, onProductsDetected]);

  const reset = useCallback(() => {
    setCapturedImage(null);
    setPreviewUrl(null);
    if (useCamera) {
      startCamera();
    }
  }, [useCamera, startCamera]);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="gradient-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2"
      >
        <ScanLine size={18} />
        Skanuj paragon
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-background/95 z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/50">
        <h2 className="text-lg font-semibold text-foreground">Skanowanie paragonu</h2>
        <button
          onClick={() => {
            setIsOpen(false);
            stopCamera();
            setCapturedImage(null);
            setPreviewUrl(null);
          }}
          className="p-2 hover:bg-muted rounded-full transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {!capturedImage ? (
          <div className="space-y-4">
            {/* Camera or Upload Selection */}
            {!useCamera ? (
              <div className="space-y-4">
                {/* Upload Option */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-muted rounded-xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
                >
                  <Upload size={32} className="mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm font-medium text-foreground">Wybierz zdjęcie z galerii</p>
                  <p className="text-xs text-muted-foreground mt-1">JPG, PNG (max 10MB)</p>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileSelect}
                />

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">lub</span>
                  </div>
                </div>

                {/* Camera Option */}
                <button
                  onClick={startCamera}
                  className="w-full border border-border rounded-xl p-6 text-center hover:bg-muted/50 transition-colors"
                >
                  <Camera size={32} className="mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm font-medium text-foreground">Zrób zdjęcie kamerą</p>
                </button>
              </div>
            ) : (
              <div className="relative">
                {/* Camera Preview */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full aspect-[3/4] object-cover rounded-xl bg-black"
                />
                <canvas ref={canvasRef} className="hidden" />

                {/* Capture Button */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
                  <button
                    onClick={capturePhoto}
                    className="w-16 h-16 rounded-full bg-white border-4 border-background shadow-lg flex items-center justify-center"
                  >
                    <div className="w-12 h-12 rounded-full bg-primary" />
                  </button>
                </div>

                {/* Cancel Camera */}
                <button
                  onClick={stopCamera}
                  className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full"
                >
                  <X size={20} />
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4 flex flex-col h-full">
            {/* Preview */}
            <div className="relative flex-1 min-h-0 flex items-center justify-center bg-black/5 rounded-xl overflow-hidden">
              <img
                src={previewUrl!}
                alt="Receipt preview"
                className="max-w-full max-h-[60vh] object-contain rounded-xl"
              />
              <button
                onClick={reset}
                className="absolute top-3 right-3 p-2 bg-black/60 text-white rounded-full hover:bg-black/80 transition-colors"
              >
                <ImagePlus size={18} />
              </button>
            </div>

            {/* Action Buttons - always visible at bottom */}
            <div className="flex-shrink-0">
              {isProcessing ? (
                <div className="text-center py-6">
                  <Loader2 size={32} className="mx-auto animate-spin text-primary mb-2" />
                  <p className="text-sm text-muted-foreground">Analizowanie paragonu...</p>
                  <p className="text-xs text-muted-foreground">AI rozpoznaje produkty</p>
                </div>
              ) : (
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setCapturedImage(null);
                      setPreviewUrl(null);
                    }}
                    className="flex-1 bg-muted text-muted-foreground py-3 rounded-xl text-sm font-medium"
                  >
                    Wybierz inne
                  </button>
                  <button
                    onClick={processReceipt}
                    className="flex-1 gradient-primary text-primary-foreground py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2"
                  >
                    <ScanLine size={18} />
                    Skanuj
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
