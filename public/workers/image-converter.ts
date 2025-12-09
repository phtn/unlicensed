// // workers/image-converter.worker.ts
// interface ConversionRequest {
//   imageData: ImageData;
//   format: 'avif' | 'webp' | 'jpeg';
//   quality?: number;
// }

// interface ConversionResponse {
//   blob: Blob;
//   size: number;
//   format: string;
// }

// interface ErrorResponse {
//   error: string;
// }

// self.addEventListener('message', async (event: MessageEvent<ConversionRequest>) => {
//   try {
//     const { imageData, format, quality = 0.8 } = event.data;

//     // Create an OffscreenCanvas (available in workers)
//     const canvas = new OffscreenCanvas(imageData.width, imageData.height);
//     const ctx = canvas.getContext('2d');

//     if (!ctx) {
//       throw new Error('Failed to get canvas context');
//     }

//     // Put the image data onto the canvas
//     ctx.putImageData(imageData, 0, 0);

//     // Convert to desired format
//     const mimeType = `image/${format}`;
//     const blob = await canvas.convertToBlob({
//       type: mimeType,
//       quality: quality
//     });

//     const response: ConversionResponse = {
//       blob,
//       size: blob.size,
//       format: mimeType
//     };

//     // Transfer the blob to avoid copying
//     self.postMessage(response, [blob as unknown as Transferable]);
//   } catch (error) {
//     const errorResponse: ErrorResponse = {
//       error: error instanceof Error ? error.message : 'Unknown error occurred'
//     };
//     self.postMessage(errorResponse);
//   }
// });

// export {};

// // hooks/useImageConverter.ts
// import { useRef, useCallback } from 'react';

// interface ConversionOptions {
//   format: 'avif' | 'webp' | 'jpeg';
//   quality?: number;
// }

// interface ConversionResult {
//   blob: Blob;
//   size: number;
//   format: string;
//   originalSize: number;
//   compressionRatio: number;
// }

// export function useImageConverter() {
//   const workerRef = useRef<Worker | null>(null);

//   const initWorker = useCallback(() => {
//     if (!workerRef.current) {
//       workerRef.current = new Worker(
//         new URL('../workers/image-converter.worker.ts', import.meta.url)
//       );
//     }
//     return workerRef.current;
//   }, []);

//   const convert = useCallback(
//     async (
//       file: File,
//       options: ConversionOptions
//     ): Promise<ConversionResult> => {
//       return new Promise((resolve, reject) => {
//         const worker = initWorker();

//         // Load the image file
//         const reader = new FileReader();

//         reader.onload = async (e: ProgressEvent<FileReader>) => {
//           try {
//             const arrayBuffer = e.target?.result as ArrayBuffer;
//             if (!arrayBuffer) {
//               throw new Error('Failed to read file');
//             }

//             // Create an image bitmap from the file
//             const blob = new Blob([arrayBuffer], { type: file.type });
//             const imageBitmap = await createImageBitmap(blob);

//             // Create a canvas to extract ImageData
//             const canvas = document.createElement('canvas');
//             canvas.width = imageBitmap.width;
//             canvas.height = imageBitmap.height;
//             const ctx = canvas.getContext('2d');

//             if (!ctx) {
//               throw new Error('Failed to get canvas context');
//             }

//             ctx.drawImage(imageBitmap, 0, 0);
//             const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

//             // Set up worker message handler
//             const handleMessage = (event: MessageEvent) => {
//               if ('error' in event.data) {
//                 reject(new Error(event.data.error));
//               } else {
//                 const result: ConversionResult = {
//                   ...event.data,
//                   originalSize: file.size,
//                   compressionRatio: ((file.size - event.data.size) / file.size) * 100
//                 };
//                 resolve(result);
//               }
//               worker.removeEventListener('message', handleMessage);
//             };

//             const handleError = (error: ErrorEvent) => {
//               reject(error);
//               worker.removeEventListener('error', handleError);
//             };

//             worker.addEventListener('message', handleMessage);
//             worker.addEventListener('error', handleError);

//             // Send to worker
//             worker.postMessage({
//               imageData,
//               format: options.format,
//               quality: options.quality
//             });
//           } catch (error) {
//             reject(error);
//           }
//         };

//         reader.onerror = () => reject(new Error('Failed to read file'));
//         reader.readAsArrayBuffer(file);
//       });
//     },
//     [initWorker]
//   );

//   const terminate = useCallback(() => {
//     if (workerRef.current) {
//       workerRef.current.terminate();
//       workerRef.current = null;
//     }
//   }, []);

//   return { convert, terminate };
// }

// // components/ImageConverterDemo.tsx
// 'use client';

// import { useState } from 'react';
// import { useImageConverter } from '../hooks/useImageConverter';

// export default function ImageConverterDemo() {
//   const [selectedFile, setSelectedFile] = useState<File | null>(null);
//   const [previewUrl, setPreviewUrl] = useState<string>('');
//   const [convertedUrl, setConvertedUrl] = useState<string>('');
//   const [isConverting, setIsConverting] = useState(false);
//   const [stats, setStats] = useState<{
//     originalSize: number;
//     newSize: number;
//     compressionRatio: number;
//   } | null>(null);

//   const { convert, terminate } = useImageConverter();

//   const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (file) {
//       setSelectedFile(file);
//       setPreviewUrl(URL.createObjectURL(file));
//       setConvertedUrl('');
//       setStats(null);
//     }
//   };

//   const handleConvert = async (format: 'avif' | 'webp' | 'jpeg') => {
//     if (!selectedFile) return;

//     setIsConverting(true);
//     try {
//       const result = await convert(selectedFile, {
//         format,
//         quality: 0.8
//       });

//       const url = URL.createObjectURL(result.blob);
//       setConvertedUrl(url);
//       setStats({
//         originalSize: result.originalSize,
//         newSize: result.size,
//         compressionRatio: result.compressionRatio
//       });
//     } catch (error) {
//       console.error('Conversion error:', error);
//       alert('Failed to convert image');
//     } finally {
//       setIsConverting(false);
//     }
//   };

//   const formatBytes = (bytes: number): string => {
//     if (bytes === 0) return '0 Bytes';
//     const k = 1024;
//     const sizes = ['Bytes', 'KB', 'MB'];
//     const i = Math.floor(Math.log(bytes) / Math.log(k));
//     return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
//   };

//   return (
//     <div className="max-w-4xl mx-auto p-6">
//       <h1 className="text-3xl font-bold mb-6">Image Converter</h1>

//       <div className="mb-6">
//         <input
//           type="file"
//           accept="image/*"
//           onChange={handleFileSelect}
//           className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
//         />
//       </div>

//       {selectedFile && (
//         <div className="grid md:grid-cols-2 gap-6 mb-6">
//           <div>
//             <h3 className="font-semibold mb-2">Original</h3>
//             <img src={previewUrl} alt="Original" className="w-full border rounded" />
//           </div>

//           {convertedUrl && (
//             <div>
//               <h3 className="font-semibold mb-2">Converted</h3>
//               <img src={convertedUrl} alt="Converted" className="w-full border rounded" />
//             </div>
//           )}
//         </div>
//       )}

//       {selectedFile && (
//         <div className="flex gap-3 mb-6">
//           <button
//             onClick={() => handleConvert('avif')}
//             disabled={isConverting}
//             className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
//           >
//             Convert to AVIF
//           </button>
//           <button
//             onClick={() => handleConvert('webp')}
//             disabled={isConverting}
//             className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
//           >
//             Convert to WebP
//           </button>
//           <button
//             onClick={() => handleConvert('jpeg')}
//             disabled={isConverting}
//             className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-gray-400"
//           >
//             Convert to JPEG
//           </button>
//         </div>
//       )}

//       {isConverting && (
//         <div className="text-center py-4">
//           <p className="text-gray-600">Converting image...</p>
//         </div>
//       )}

//       {stats && (
//         <div className="bg-gray-50 p-4 rounded">
//           <h3 className="font-semibold mb-2">Conversion Stats</h3>
//           <p>Original Size: {formatBytes(stats.originalSize)}</p>
//           <p>New Size: {formatBytes(stats.newSize)}</p>
//           <p className="text-green-600 font-semibold">
//             Compression: {stats.compressionRatio.toFixed(2)}% reduction
//           </p>
//         </div>
//       )}
//     </div>
//   );
// }
