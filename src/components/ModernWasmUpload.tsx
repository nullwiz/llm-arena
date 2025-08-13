import React, { useState, useRef, useCallback } from 'react';
import { Upload, FileText, Package, CheckCircle, AlertCircle, X, Sparkles, Zap, GamepadIcon } from 'lucide-react';
import { wasmGameLoader } from '../services/WasmGameLoader';
import { GameMetadata } from '../interfaces/WasmGameEngine';
import { ModalPortal } from './ModalPortal';

interface ModernWasmUploadProps {
  onClose: () => void;
  onGameUploaded: (gameId: string) => void;
}

interface UploadState {
  wasmFile: File | null;
  metadataFile: File | null;
  wasmStatus: 'none' | 'dragover' | 'selected' | 'validated' | 'error';
  metadataStatus: 'none' | 'dragover' | 'selected' | 'validated' | 'error';
  wasmError: string | null;
  metadataError: string | null;
  parsedMetadata: GameMetadata | null;
  isUploading: boolean;
  uploadProgress: number;
  uploadError: string | null;
}

export function ModernWasmUpload({ onClose, onGameUploaded }: ModernWasmUploadProps) {
  const [state, setState] = useState<UploadState>({
    wasmFile: null,
    metadataFile: null,
    wasmStatus: 'none',
    metadataStatus: 'none',
    wasmError: null,
    metadataError: null,
    parsedMetadata: null,
    isUploading: false,
    uploadProgress: 0,
    uploadError: null
  });

  const wasmInputRef = useRef<HTMLInputElement>(null);
  const metadataInputRef = useRef<HTMLInputElement>(null);

  const updateState = (updates: Partial<UploadState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };


  const handleDragOver = useCallback((e: React.DragEvent, type: 'wasm' | 'metadata') => {
    e.preventDefault();
    e.stopPropagation();
    if (type === 'wasm') {
      updateState({ wasmStatus: 'dragover' });
    } else {
      updateState({ metadataStatus: 'dragover' });
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent, type: 'wasm' | 'metadata') => {
    e.preventDefault();
    e.stopPropagation();
    if (type === 'wasm') {
      updateState({ wasmStatus: state.wasmFile ? 'selected' : 'none' });
    } else {
      updateState({ metadataStatus: state.metadataFile ? 'selected' : 'none' });
    }
  }, [state.wasmFile, state.metadataFile]);

  const handleDrop = async (e: React.DragEvent, type: 'wasm' | 'metadata') => {
    e.preventDefault();
    e.stopPropagation();

    const files = Array.from(e.dataTransfer.files);
    const file = files[0];

    if (!file) return;

    if (type === 'wasm') {
      if (file.name.endsWith('.wasm')) {
        await handleWasmFile(file);
      } else {
        updateState({ wasmStatus: 'error', wasmError: 'Please drop a .wasm file' });
      }
    } else {
      if (file.name.endsWith('.json')) {
        await handleMetadataFile(file);
      } else {
        updateState({ metadataStatus: 'error', metadataError: 'Please drop a .json file' });
      }
    }
  };

  const handleWasmFile = async (file: File) => {
    updateState({
      wasmFile: file,
      wasmStatus: 'selected',
      wasmError: null
    });

    try {
      const arrayBuffer = await file.arrayBuffer();
      const wasmBytes = new Uint8Array(arrayBuffer);
      

      if (wasmBytes.length < 8 || 
          wasmBytes[0] !== 0x00 || wasmBytes[1] !== 0x61 || 
          wasmBytes[2] !== 0x73 || wasmBytes[3] !== 0x6d) {
        throw new Error('Invalid WASM file: Missing WASM magic number');
      }


      await WebAssembly.compile(wasmBytes);
      
      updateState({ wasmStatus: 'validated' });
    } catch (error: unknown) {
      updateState({
        wasmStatus: 'error',
        wasmError: `WASM validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  };

  const handleMetadataFile = async (file: File) => {
    updateState({
      metadataFile: file,
      metadataStatus: 'selected',
      metadataError: null,
      parsedMetadata: null
    });

    try {
      const text = await file.text();
      const metadata = JSON.parse(text);
      

      if (!metadata.name || typeof metadata.name !== 'string') {
        throw new Error('Metadata must have a valid name');
      }

      updateState({
        metadataStatus: 'validated',
        parsedMetadata: metadata
      });
    } catch (error: unknown) {
      updateState({
        metadataStatus: 'error',
        metadataError: `Metadata validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  };

  const handleUpload = async () => {
    if (!state.wasmFile || !state.metadataFile || !state.parsedMetadata) {
      updateState({ uploadError: 'Both WASM and metadata files are required' });
      return;
    }

    updateState({ isUploading: true, uploadProgress: 0, uploadError: null });

    try {

      const progressInterval = setInterval(() => {
        setState(prev => ({
          ...prev,
          uploadProgress: Math.min(prev.uploadProgress + Math.random() * 20, 90)
        }));
      }, 100);

      const wasmBytes = new Uint8Array(await state.wasmFile.arrayBuffer());
      
      const result = await wasmGameLoader.loadGameFromBytes(wasmBytes, state.parsedMetadata);
      
      clearInterval(progressInterval);
      updateState({ uploadProgress: 100 });

      if (!result.success || !result.game) {
        throw new Error(result.error || 'Failed to load game');
      }

      setTimeout(() => {
        onGameUploaded(result.game!.id);
        onClose();
      }, 500);
    } catch (error: unknown) {
      updateState({
        isUploading: false,
        uploadProgress: 0,
        uploadError: `Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  };

  const getDropZoneClasses = (status: string, baseClasses: string) => {
    const classes = [baseClasses];
    
    switch (status) {
      case 'dragover':
        classes.push('border-gray-400 bg-gray-500/10 scale-105 shadow-gray-500/25');
        break;
      case 'validated':
        classes.push('border-green-400 bg-green-500/10 shadow-green-500/25');
        break;
      case 'error':
        classes.push('border-red-400 bg-red-500/10 shadow-red-500/25');
        break;
      case 'selected':
        classes.push('border-gray-500 bg-gray-700/20 shadow-gray-900/20');
        break;
      default:
        classes.push('border-gray-600 hover:border-gray-500 hover:bg-gray-800/50');
    }
    
    return classes.join(' ');
  };

  const getGameIcon = (metadata: GameMetadata | null) => {
    if (!metadata) return '🎮';
    const gameType = metadata.gameType?.toLowerCase() || metadata.name.toLowerCase();
    
    if (gameType.includes('chess')) return '♟️';
    if (gameType.includes('tic')) return '⭕';
    if (gameType.includes('puzzle')) return '🧩';
    if (gameType.includes('strategy')) return '🎯';
    if (gameType.includes('card')) return '🃏';
    return '🎮';
  };

  const canUpload = state.wasmStatus === 'validated' && 
                   state.metadataStatus === 'validated' && 
                   !state.isUploading;

  return (
    <ModalPortal>
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 crt-noise crt-flicker-strong">
        {}
        <button aria-label="Close modal backdrop" onClick={onClose} className="absolute inset-0 w-full h-full cursor-default"></button>
        {}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-gray-400 rounded-full animate-pulse opacity-60"></div>
          <div className="absolute top-3/4 right-1/4 w-1 h-1 bg-gray-500 rounded-full animate-ping opacity-30"></div>
          <div className="absolute top-1/2 left-3/4 w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce opacity-40"></div>
        </div>

        <div className="relative bg-gray-900 rounded-2xl p-8 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto terminal-border crt-surface crt-vignette crt-noise scanlines shadow-2xl">
        {}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gray-800 rounded-xl border border-gray-700">
              <GamepadIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-100 header-glow">
                Upload WASM Game
              </h2>
              <p className="text-gray-400 text-sm">Drag & drop your game files or click to browse</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-all duration-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {}
          <div
            className={getDropZoneClasses(
              state.wasmStatus,
              "relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 cursor-pointer group"
            )}
            onDragOver={(e) => handleDragOver(e, 'wasm')}
            onDragLeave={(e) => handleDragLeave(e, 'wasm')}
            onDrop={(e) => handleDrop(e, 'wasm')}
            onClick={() => wasmInputRef.current?.click()}
          >
            <input
              ref={wasmInputRef}
              type="file"
              accept=".wasm"
              onChange={(e) => e.target.files?.[0] && handleWasmFile(e.target.files[0])}
              className="hidden"
            />
            
            <div className="space-y-4">
              <div className="relative">
                <Package className={`w-16 h-16 mx-auto transition-all duration-300 ${
                  state.wasmStatus === 'validated' ? 'text-green-400' :
                  state.wasmStatus === 'error' ? 'text-red-400' :
                  state.wasmStatus === 'dragover' ? 'text-gray-300 scale-110' :
                  'text-gray-400 group-hover:text-gray-300'
                }`} />
                {state.wasmStatus === 'validated' && (
                  <CheckCircle className="w-6 h-6 text-green-400 absolute -top-1 -right-1 bg-gray-900 rounded-full" />
                )}
                {state.wasmStatus === 'error' && (
                  <AlertCircle className="w-6 h-6 text-red-400 absolute -top-1 -right-1 bg-gray-900 rounded-full" />
                )}
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">WASM Game File</h3>
                <p className="text-gray-400 text-sm mb-4">
                  Drop your .wasm file here or click to browse
                </p>
                
                {state.wasmFile && (
                  <div className="bg-gray-800/50 rounded-lg p-3 text-left">
                    <div className="text-sm text-gray-300 font-medium">{state.wasmFile.name}</div>
                    <div className="text-xs text-gray-500">{(state.wasmFile.size / 1024).toFixed(1)} KB</div>
                  </div>
                )}
                
                {state.wasmError && (
                  <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3 text-left">
                    <div className="text-sm text-red-400">{state.wasmError}</div>
                  </div>
                )}
                
                {state.wasmStatus === 'validated' && (
                  <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-3 text-left">
                    <div className="text-sm text-green-400 flex items-center">
                      <Sparkles className="w-4 h-4 mr-2" />
                      WASM file validated successfully
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {}
          <div
            className={getDropZoneClasses(
              state.metadataStatus,
              "relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 cursor-pointer group"
            )}
            onDragOver={(e) => handleDragOver(e, 'metadata')}
            onDragLeave={(e) => handleDragLeave(e, 'metadata')}
            onDrop={(e) => handleDrop(e, 'metadata')}
            onClick={() => metadataInputRef.current?.click()}
          >
            <input
              ref={metadataInputRef}
              type="file"
              accept=".json"
              onChange={(e) => e.target.files?.[0] && handleMetadataFile(e.target.files[0])}
              className="hidden"
            />
            
            <div className="space-y-4">
              <div className="relative">
                <FileText className={`w-16 h-16 mx-auto transition-all duration-300 ${
                  state.metadataStatus === 'validated' ? 'text-green-400' :
                  state.metadataStatus === 'error' ? 'text-red-400' :
                  state.metadataStatus === 'dragover' ? 'text-gray-300 scale-110' :
                  'text-gray-400 group-hover:text-gray-300'
                }`} />
                {state.metadataStatus === 'validated' && (
                  <CheckCircle className="w-6 h-6 text-green-400 absolute -top-1 -right-1 bg-gray-900 rounded-full" />
                )}
                {state.metadataStatus === 'error' && (
                  <AlertCircle className="w-6 h-6 text-red-400 absolute -top-1 -right-1 bg-gray-900 rounded-full" />
                )}
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Metadata File</h3>
                <p className="text-gray-400 text-sm mb-4">
                  Drop your metadata.json file here or click to browse
                </p>
                
                {state.metadataFile && (
                  <div className="bg-gray-800/50 rounded-lg p-3 text-left">
                    <div className="text-sm text-gray-300 font-medium">{state.metadataFile.name}</div>
                    <div className="text-xs text-gray-500">{(state.metadataFile.size / 1024).toFixed(1)} KB</div>
                  </div>
                )}
                
                {state.metadataError && (
                  <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3 text-left">
                    <div className="text-sm text-red-400 whitespace-pre-line">{state.metadataError}</div>
                  </div>
                )}
                
                {state.parsedMetadata && (
                  <div className="bg-gray-800/50 border border-gray-600/40 rounded-lg p-4 text-left">
                    <div className="flex items-center mb-3">
                      <div className="text-2xl mr-3">{getGameIcon(state.parsedMetadata)}</div>
                      <div>
                        <div className="text-sm font-medium text-gray-200">{state.parsedMetadata.name}</div>
                        {state.parsedMetadata.author && (
                          <div className="text-xs text-gray-400">by {state.parsedMetadata.author}</div>
                        )}
                      </div>
                    </div>
                    
                    {state.parsedMetadata.aiPrompts && (
                      <div className="flex items-center text-xs text-gray-300 bg-gray-500/10 rounded-full px-3 py-1 w-fit">
                        <Zap className="w-3 h-3 mr-1" />
                        AI Prompts Included
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {}
        {state.isUploading && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-300">Uploading game...</span>
              <span className="text-sm text-gray-300">{Math.round(state.uploadProgress)}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-gray-400/80 to-gray-300/80 transition-all duration-300 ease-out"
                style={{ width: `${state.uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {}
        {state.uploadError && (
          <div className="mb-6 bg-red-900/20 border border-red-500/30 rounded-xl p-4">
            <div className="flex items-center text-red-400">
              <AlertCircle className="w-5 h-5 mr-2" />
              <span>{state.uploadError}</span>
            </div>
          </div>
        )}

        {}
        <div className="flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-6 py-3 text-gray-400 hover:text-white hover:bg-gray-700 rounded-xl transition-all duration-200"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!canUpload}
            className={`px-8 py-3 rounded-xl font-medium transition-all duration-200 flex items-center ${
              canUpload
                ? 'bg-gradient-to-r from-gray-800 to-gray-800 hover:from-gray-700 hover:to-gray-700 text-gray-100 border border-gray-600 shadow-md hover:shadow-gray-400/15'
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
            }`}
          >
            {state.isUploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload Game
              </>
            )}
          </button>
        </div>
        </div>
      </div>
    </ModalPortal>
  );
}
