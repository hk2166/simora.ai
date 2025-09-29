import React, { useMemo, useRef, useState } from 'react';
import { Player } from '@remotion/player';
import { CaptionComposition } from '../video/CaptionComposition.jsx';
import { CaptionStyleSelector, CAPTION_STYLES } from './CaptionStyleSelector.jsx';
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

  const styleKeys = useMemo(() => Object.keys(CAPTION_STYLES), []);
  const cycleStyle = () => {
    const idx = styleKeys.indexOf(styleKey);
    const next = styleKeys[(idx + 1) % styleKeys.length];
    setStyleKey(next);
  };

  return (
    <div>
      <header className="site-header">
        <div className="brand">
          <span className="brand-dot" />
          Remotion Captioner
        </div>
        <div className="muted-note">Fast subtitles for social video</div>
      </header>
      <div className="container">
        <div className="app-grid">
          <div className="sidebar">
            <div className="card">
              <h2 style={{ margin: 0 }}>Project</h2>
              <div className="muted-note">Upload and transcribe</div>
              <div style={{ height: 8 }} />
              <input accept="video/mp4" type="file" ref={fileRef} onChange={onFileChange} />
              <button onClick={onGenerate} disabled={!fileRef.current?.files?.[0] || isTranscribing}>
                {isTranscribing ? 'Transcribing…' : 'Generate Captions'}
              </button>
            </div>
            <div style={{ height: 12 }} />
            <div className="card">
              <h3 style={{ marginTop: 0, marginBottom: 6 }}>Style</h3>
              <CaptionStyleSelector value={styleKey} onChange={setStyleKey} />
              <div style={{ height: 8 }} />
              <button onClick={onRender} disabled={!videoUrl || segments.length === 0}>Render MP4</button>
              <div style={{ height: 6 }} />
              <div className="muted-note">Hinglish supported. Noto Sans families preloaded.</div>
            </div>
          </div>
          <div className="player-wrap">
            {videoUrl ? (
            <div className="player-shell">
              <Player
                component={CaptionComposition}
                compositionWidth={1280}
                compositionHeight={720}
                durationInFrames={Math.max(1, Math.floor(durationInSeconds * 30))}
                fps={30}
                inputProps={{ videoUrl, segments, styleKey }}
                controls
                style={{ width: '100%', height: 'auto' }}
              />
                
              </div>
            ) : (
              <div className="muted-note">Upload an MP4 to preview</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


