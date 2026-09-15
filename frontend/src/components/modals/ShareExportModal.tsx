import React, { useState, useRef, useEffect } from 'react';
import Konva from 'konva';
import {
  X,
  Download,
  Video,
  FileJson,
  Copy,
  Check,
  Upload,
  RotateCcw,
} from 'lucide-react';
import { useTacticalStore } from '../../store/useTacticalStore';

interface ShareExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  stageRef: React.RefObject<Konva.Stage>;
}

export const ShareExportModal: React.FC<ShareExportModalProps> = ({
  isOpen,
  onClose,
  stageRef,
}) => {
  const [copied, setCopied] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordProgress, setRecordProgress] = useState(0);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);
  const [recordedExt, setRecordedExt] = useState<string>('webm');

  const videoPreviewRef = useRef<HTMLVideoElement>(null);

  const sport = useTacticalStore((s) => s.sport);
  const courtVariant = useTacticalStore((s) => s.courtVariant);
  const playTitle = useTacticalStore((s) => s.playTitle);
  const players = useTacticalStore((s) => s.players);
  const steps = useTacticalStore((s) => s.steps);
  const loadPlay = useTacticalStore((s) => s.loadPlay);
  const setIsPlaying = useTacticalStore((s) => s.setIsPlaying);
  const setCurrentStepIndex = useTacticalStore((s) => s.setCurrentStepIndex);
  const setStepProgress = useTacticalStore((s) => s.setStepProgress);

  // Clean up object URLs when modal unmounts
  useEffect(() => {
    return () => {
      if (recordedVideoUrl) {
        URL.revokeObjectURL(recordedVideoUrl);
      }
    };
  }, [recordedVideoUrl]);

  if (!isOpen) return null;

  const playData = {
    title: playTitle,
    sport,
    courtVariant,
    players,
    steps,
    createdAt: Date.now(),
  };

  // 1. Export PNG Image Snapshot
  const handleExportPNG = () => {
    const stage = stageRef.current;
    if (!stage) return;
    const dataUrl = stage.toDataURL({ pixelRatio: 2 });
    const link = document.createElement('a');
    link.download = `${playTitle.replace(/\s+/g, '_')}_phase.png`;
    link.href = dataUrl;
    link.click();
  };

  // 2. Export JSON File
  const handleExportJSON = () => {
    const jsonStr = JSON.stringify(playData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `${playTitle.replace(/\s+/g, '_')}.json`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  };

  // 3. Copy Shareable Web Link
  const handleCopyShareLink = () => {
    try {
      const compactJson = JSON.stringify(playData);
      const encoded = btoa(unescape(encodeURIComponent(compactJson)));
      const url = `${window.location.origin}${window.location.pathname}#play=${encoded}`;
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.error('Failed to generate share link:', e);
    }
  };

  // 4. Import JSON
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.steps && parsed.sport) {
          loadPlay(parsed);
          onClose();
        } else {
          alert('Неверный формат тактического файла');
        }
      } catch (err) {
        alert('Ошибка при чтении файла JSON');
      }
    };
    reader.readAsText(file);
  };

  // 5. High-Reliability Video Recording with Mobile Codec Detection & Canvas Rendering
  const handleRecordVideo = async () => {
    const stage = stageRef.current;
    if (!stage) return;

    try {
      setIsRecording(true);
      setRecordProgress(0);
      if (recordedVideoUrl) {
        URL.revokeObjectURL(recordedVideoUrl);
        setRecordedVideoUrl(null);
      }

      // Auto-detect optimal video container for iOS (MP4) vs Android/Chrome (WebM/MP4)
      const candidateTypes = [
        'video/mp4;codecs=avc1',
        'video/mp4',
        'video/webm;codecs=vp9',
        'video/webm;codecs=vp8',
        'video/webm',
      ];
      let selectedMime = candidateTypes.find((t) => MediaRecorder.isTypeSupported(t)) || '';
      if (!selectedMime && typeof MediaRecorder !== 'undefined') {
        selectedMime = 'video/webm';
      }

      const ext = selectedMime.includes('mp4') ? 'mp4' : 'webm';
      setRecordedExt(ext);

      // Dedicated offscreen recording canvas
      const stageW = Math.max(360, Math.round(stage.width()));
      const stageH = Math.max(300, Math.round(stage.height()));

      const recordCanvas = document.createElement('canvas');
      recordCanvas.width = stageW;
      recordCanvas.height = stageH;
      const ctx = recordCanvas.getContext('2d');

      if (!ctx) {
        alert('Не удалось инициализировать видеорендерер');
        setIsRecording(false);
        return;
      }

      const stream = (recordCanvas as any).captureStream
        ? (recordCanvas as any).captureStream(30)
        : null;

      if (!stream) {
        alert('Запись видео не поддерживается в данном браузере');
        setIsRecording(false);
        return;
      }

      const recorder = new MediaRecorder(
        stream,
        selectedMime ? { mimeType: selectedMime } : undefined
      );

      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const videoBlob = new Blob(chunks, { type: selectedMime || 'video/webm' });
        const url = URL.createObjectURL(videoBlob);
        setRecordedVideoUrl(url);
        setIsRecording(false);
        setIsPlaying(false);
      };

      const captureStageFrame = () => {
        ctx.fillStyle = '#0b0f19';
        ctx.fillRect(0, 0, stageW, stageH);

        const layers = stage.getLayers();
        for (const layer of layers) {
          const nativeCanvas = (layer as any).getNativeCanvasElement
            ? (layer as any).getNativeCanvasElement()
            : (layer.getCanvas() as any)?._canvas;
          if (nativeCanvas) {
            ctx.drawImage(nativeCanvas, 0, 0, stageW, stageH);
          }
        }
      };

      // Rewind to start
      setCurrentStepIndex(0);
      setStepProgress(0);
      setIsPlaying(false);
      stage.batchDraw();
      captureStageFrame();

      // Start recording with 100ms buffer flush
      recorder.start(100);

      // Deterministic frame generation at 30 FPS
      const totalDurationSec = steps.reduce((acc, s) => acc + (s.duration || 1.8), 0);
      const fps = 30;
      const totalFrames = Math.max(30, Math.round(totalDurationSec * fps));
      let currentFrame = 0;

      const frameInterval = 1000 / fps;
      const timer = setInterval(() => {
        currentFrame++;
        const overallT = currentFrame / totalFrames;
        const p = Math.min(100, Math.round(overallT * 100));
        setRecordProgress(p);

        const totalSteps = steps.length;
        if (totalSteps <= 1) {
          setStepProgress(overallT);
        } else {
          const stepFloat = overallT * (totalSteps - 1);
          const sIdx = Math.min(totalSteps - 1, Math.floor(stepFloat));
          const sProg = stepFloat - sIdx;
          setCurrentStepIndex(sIdx);
          setStepProgress(sProg);
        }

        stage.batchDraw();
        captureStageFrame();

        if (currentFrame >= totalFrames) {
          clearInterval(timer);
          setTimeout(() => {
            recorder.stop();
          }, 350);
        }
      }, frameInterval);
    } catch (err) {
      console.error('Video recording failed:', err);
      setIsRecording(false);
    }
  };

  const handleDownloadRecordedVideo = () => {
    if (!recordedVideoUrl) return;
    const a = document.createElement('a');
    a.href = recordedVideoUrl;
    a.download = `${playTitle.replace(/\s+/g, '_')}_anim.${recordedExt}`;
    a.click();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header-title">
            <h3>Поделиться и Экспорт</h3>
            <p className="modal-subtitle">Комбинация: {playTitle}</p>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={22} />
          </button>
        </div>

        <div className="modal-body">
          {/* Option 1: Share Link */}
          <div className="export-card primary-card">
            <div className="export-card-info">
              <h4>📱 Интерактивная ссылка (Рекомендуется)</h4>
              <p>Отправьте игрокам в Telegram или WhatsApp. Откроется на любом смартфоне без установки приложений!</p>
            </div>
            <button className="btn-modal-action primary" onClick={handleCopyShareLink}>
              {copied ? <Check size={18} /> : <Copy size={18} />}
              <span>{copied ? '✓ Ссылка скопирована!' : 'Скопировать ссылку'}</span>
            </button>
          </div>

          {/* Option 2: Video Recording */}
          <div className="export-card">
            <div className="export-card-info">
              <h4>🎬 Запись видеоролика ({recordedExt.toUpperCase()})</h4>
              <p>Автоматически записывает анимацию движения игроков и передач в видеофайл.</p>
            </div>

            {/* Progress indicator */}
            {isRecording && (
              <div className="recording-progress-container">
                <div className="recording-progress-bar">
                  <div
                    className="recording-progress-fill"
                    style={{ width: `${recordProgress}%` }}
                  />
                </div>
                <span className="recording-status">Запись анимации: {recordProgress}%</span>
              </div>
            )}

            {/* Video preview player */}
            {recordedVideoUrl && !isRecording && (
              <div className="video-preview-wrapper">
                <video
                  ref={videoPreviewRef}
                  src={recordedVideoUrl}
                  controls
                  autoPlay
                  loop
                  playsInline
                  className="video-preview-player"
                />
                <div className="video-preview-actions">
                  <button
                    className="btn-modal-action primary download-btn"
                    onClick={handleDownloadRecordedVideo}
                  >
                    <Download size={18} />
                    <span>Скачать видео .{recordedExt}</span>
                  </button>
                  <button
                    className="btn-modal-action"
                    onClick={handleRecordVideo}
                    title="Записать заново"
                  >
                    <RotateCcw size={16} />
                    <span>Заново</span>
                  </button>
                </div>
              </div>
            )}

            {!recordedVideoUrl && !isRecording && (
              <button className="btn-modal-action" onClick={handleRecordVideo}>
                <Video size={18} />
                <span>Записать видео</span>
              </button>
            )}
          </div>

          {/* Option 3: PNG Snapshot */}
          <div className="export-card">
            <div className="export-card-info">
              <h4>📸 Снимок схемы (PNG)</h4>
              <p>Сохранить изображение текущей расстановки со стрелками в высоком разрешении.</p>
            </div>
            <button className="btn-modal-action" onClick={handleExportPNG}>
              <Download size={18} />
              <span>Скачать PNG</span>
            </button>
          </div>

          {/* Option 4: JSON Backup & Import */}
          <div className="export-card">
            <div className="export-card-info">
              <h4>💾 Файл тактики (JSON)</h4>
              <p>Сохранить на устройство или загрузить готовую тактику из файла.</p>
            </div>
            <div className="btn-group-actions">
              <button className="btn-modal-action" onClick={handleExportJSON}>
                <FileJson size={18} />
                <span>Экспорт JSON</span>
              </button>
              <label className="btn-modal-action upload-label">
                <Upload size={18} />
                <span>Загрузить JSON</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportJSON}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
