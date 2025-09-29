import React, { useMemo, useRef, useState } from 'react';
import { Player } from '@remotion/player';
import { CaptionComposition } from '../video/CaptionComposition.jsx';
import { CaptionStyleSelector } from './CaptionStyleSelector.jsx';
import { generateCaptions, renderVideo } from './sttClient.js';

export default function App() {
  const [videoUrl, setVideoUrl] = useState(null);
  const [segments, setSegments] = useState([]);
  const [styleKey, setStyleKey] = useState('bottom-centered');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const fileRef = useRef(null);

  const durationInSeconds = useMemo(() => {
    if (!videoUrl) return 0;
    return 600;
  }, [videoUrl]);

  const onFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    setVideoUrl(url);
  };

  const onGenerate = async () => {
    if (!fileRef.current?.files?.[0]) return;
    setIsTranscribing(true);
    try {
      const { segments } = await generateCaptions(fileRef.current.files[0]);
      setSegments(segments);
    } catch (e) {
      console.error(e);
      alert('Failed to generate captions');
    } finally {
      setIsTranscribing(false);
    }
  };

  const onRender = async () => {
    if (!fileRef.current?.files?.[0]) return;
    try {
      const blob = await renderVideo(fileRef.current.files[0], segments, styleKey);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'captioned.mp4';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert('Render failed');
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', height: '100%', gap: 16, padding: 16 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h2 style={{ margin: 0 }}>Remotion Captioner</h2>
        <input accept="video/mp4" type="file" ref={fileRef} onChange={onFileChange} />
        <button onClick={onGenerate} disabled={!fileRef.current?.files?.[0] || isTranscribing}>
          {isTranscribing ? 'Transcribing…' : 'Generate Captions'}
        </button>
        <CaptionStyleSelector value={styleKey} onChange={setStyleKey} />
        <button onClick={onRender} disabled={!videoUrl || segments.length === 0}>Render MP4</button>
        <div style={{ color: 'var(--muted)', fontSize: 12 }}>
          Hinglish supported. Fonts: Noto Sans + Noto Sans Devanagari.
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {videoUrl ? (
          <Player
            component={CaptionComposition}
            compositionWidth={1280}
            compositionHeight={720}
            durationInFrames={Math.max(1, Math.floor(durationInSeconds * 30))}
            fps={30}
            inputProps={{ videoUrl, segments, styleKey }}
            controls
          />
        ) : (
          <div style={{ color: 'var(--muted)' }}>Upload an MP4 to preview</div>
        )}
      </div>
    </div>
  );
}


