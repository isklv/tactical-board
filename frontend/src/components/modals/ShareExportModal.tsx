import React, { useState } from 'react';
import Konva from 'konva';
import {
  X,
  Download,
  Video,
  FileJson,
  Copy,
  Check,
  Upload,
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

  const sport = useTacticalStore((s) => s.sport);
  const courtVariant = useTacticalStore((s) => s.courtVariant);
  const playTitle = useTacticalStore((s) => s.playTitle);
  const players = useTacticalStore((s) => s.players);
  const steps = useTacticalStore((s) => s.steps);
  const loadPlay = useTacticalStore((s) => s.loadPlay);
  const setIsPlaying = useTacticalStore((s) => s.setIsPlaying);
  const setCurrentStepIndex = useTacticalStore((s) => s.setCurrentStepIndex);
  const setStepProgress = useTacticalStore((s) => s.setStepProgress);

  if (!isOpen) return null;

  const playData = {
    title: playTitle,
    sport,
    courtVariant,
    players,
    steps,
    createdAt: Date.now(),
  };

  // 1. Export PNG Image
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

  // 3. Copy Shareable Web Link (Encoded in hash)
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

  // 5. Record Video (WebM)
  const handleRecordVideo = async () => {
    const stage = stageRef.current;
    if (!stage) return;

    const canvas = stage.toCanvas();
    if (!canvas) return;

    try {
      setIsRecording(true);
      setRecordProgress(0);

      // Rewind to start
      setCurrentStepIndex(0);
      setStepProgress(0);
      setIsPlaying(false);

      const stream = (canvas as any).captureStream ? (canvas as any).captureStream(30) : null;
      if (!stream) {
        alert('Запись canvas не поддерживается в данном браузере');
        setIsRecording(false);
        return;
      }

      const recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
          ? 'video/webm;codecs=vp9'
          : 'video/webm',
      });

      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${playTitle.replace(/\s+/g, '_')}_animation.webm`;
        a.click();
        URL.revokeObjectURL(url);
        setIsRecording(false);
        setIsPlaying(false);
      };

      recorder.start();
      setIsPlaying(true);

      const totalDurationSec = steps.reduce((acc, s) => acc + (s.duration || 1.8), 0);
      const startTime = Date.now();

      const progressInterval = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        const p = Math.min(100, Math.round((elapsed / totalDurationSec) * 100));
        setRecordProgress(p);
        if (elapsed >= totalDurationSec) {
          clearInterval(progressInterval);
          recorder.stop();
        }
      }, 100);
    } catch (err) {
      console.error('Video recording failed:', err);
      setIsRecording(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Экспорт и Передача комбинации</h3>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {/* Option 1: Share Link */}
          <div className="export-card">
            <div className="export-card-info">
              <h4>Интерактивная ссылка для игроков</h4>
              <p>Отправьте ссылку в Telegram/WhatsApp — игроки откроют анимацию на телефоне без установки приложений.</p>
            </div>
            <button className="btn-modal-action primary" onClick={handleCopyShareLink}>
              {copied ? <Check size={18} /> : <Copy size={18} />}
              <span>{copied ? 'Ссылка скопирована!' : 'Скопировать ссылку'}</span>
            </button>
          </div>

          {/* Option 2: Video Recording */}
          <div className="export-card">
            <div className="export-card-info">
              <h4>Записать видеоролик (WebM / Видео)</h4>
              <p>Автоматически воспроизводит и записывает анимацию комбинации в видеофайл.</p>
            </div>
            <button
              className="btn-modal-action"
              onClick={handleRecordVideo}
              disabled={isRecording}
            >
              <Video size={18} />
              <span>{isRecording ? `Запись (${recordProgress}%)...` : 'Записать видео'}</span>
            </button>
          </div>

          {/* Option 3: PNG Snapshot */}
          <div className="export-card">
            <div className="export-card-info">
              <h4>Снимок схемы (PNG)</h4>
              <p>Сохраняет текущую фазу со стрелками в виде четкого изображения.</p>
            </div>
            <button className="btn-modal-action" onClick={handleExportPNG}>
              <Download size={18} />
              <span>Скачать PNG</span>
            </button>
          </div>

          {/* Option 4: JSON Backup & Import */}
          <div className="export-card">
            <div className="export-card-info">
              <h4>Файл тактики (JSON)</h4>
              <p>Экспорт исходных координат и шагов для бэкапа или загрузка существующего файла.</p>
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
