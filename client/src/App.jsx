import { useState } from 'react'
import './index.css'
import Login from './Login';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  if (!isAuthenticated) {
    return <Login onLogin={() => setIsAuthenticated(true)} />;
  }

  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [config, setConfig] = useState({
    style: '',
    color: '',
    description: ''
  });

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
      setGeneratedImage(null); // Reset result
    }
  };

  const [mode, setMode] = useState('preset'); // 'preset' or 'reference'
  const [referenceImage, setReferenceImage] = useState(null);
  const [referencePreviewUrl, setReferencePreviewUrl] = useState(null);

  const handleReferenceChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setReferenceImage(file);
      setReferencePreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleGenerate = async () => {
    if (!selectedImage) return;

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('image', selectedImage);
    formData.append('mode', mode);
    formData.append('description', config.description);

    if (mode === 'preset') {
      formData.append('style', config.style);
      formData.append('color', config.color);
    } else if (mode === 'reference' && referenceImage) {
      formData.append('reference_image', referenceImage);
    }

    try {
      // Note: In production, use the actual IP or relative path if served from same origin
      const response = await fetch('/api/generate-hairstyle', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate');
      }

      // Since our current backend might only return text (due to API limits), 
      // we handle that. If it returns an image (base64 or url), we display it.
      if (data.image) {
        setGeneratedImage(data.image);
        // Scroll to result on mobile
        setTimeout(() => {
          document.getElementById('result-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      } else if (data.description) {
        // Fallback if only text is returned
        alert(`Generation Complete (Text Mode): ${data.description}`);
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{
          fontSize: 'clamp(2rem, 5vw, 2.5rem)',
          marginBottom: '0.5rem',
          background: 'var(--accent-gradient)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          letterSpacing: '-0.02em'
        }}>
          AI Hair Assistant
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Transform your look with AI</p>
      </header>

      <div className="grid-layout">
        {/* Left Column: Input */}
        <div className="glass-panel">
          <h2 style={{ marginTop: 0 }}>1. Upload Photo</h2>
          <div className="upload-zone" onClick={() => document.getElementById('fileInput').click()}>
            <input
              type="file"
              id="fileInput"
              accept="image/*"
              onChange={handleImageChange}
              style={{ display: 'none' }}
            />
            {previewUrl ? (
              <img src={previewUrl} alt="Preview" className="preview-image" />
            ) : (
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>📸</span>
                <p style={{ margin: 0, fontSize: '1.1rem' }}>Tap to upload a selfie</p>
              </div>
            )}
          </div>

          <div style={{ marginTop: '2rem', textAlign: 'left' }}>
            <h2 style={{ marginTop: 0 }}>2. Configure Style</h2>

            {/* Mode Switcher */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', background: 'var(--bg-secondary)', padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)' }}>
              <button
                key="btn-preset"
                onClick={() => setMode('preset')}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  background: mode === 'preset' ? 'var(--accent-gradient)' : 'transparent',
                  color: mode === 'preset' ? 'white' : 'var(--text-secondary)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
                Presets
              </button>
              <button
                key="btn-reference"
                onClick={() => setMode('reference')}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  background: mode === 'reference' ? 'var(--accent-gradient)' : 'transparent',
                  color: mode === 'reference' ? 'white' : 'var(--text-secondary)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
                Reference Image
              </button>
            </div>

            {mode === 'preset' ? (
              <>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Hairstyle</label>
                <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
                  <select
                    value={config.style}
                    onChange={(e) => setConfig({ ...config, style: e.target.value })}
                  >
                    <option value="">No Selection</option>
                    <option>Bob Cut</option>
                    <option>Pixie Cut</option>
                    <option>Long Layers</option>
                    <option>Buzz Cut</option>
                    <option>Curly Shag</option>
                    <option>Afro</option>
                    <option>Mohawk</option>
                  </select>
                </div>

                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Hair Color</label>
                <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
                  <select
                    value={config.color}
                    onChange={(e) => setConfig({ ...config, color: e.target.value })}
                  >
                    <option value="">No Selection</option>
                    <option>Blonde</option>
                    <option>Brunette</option>
                    <option>Black</option>
                    <option>Red</option>
                    <option>Silver/Grey</option>
                    <option>Pastel Pink</option>
                    <option>Blue</option>
                  </select>
                </div>
              </>
            ) : (
              <>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Reference Image</label>
                <div className="upload-zone" style={{ minHeight: '150px', padding: '1rem', marginBottom: '1.5rem' }} onClick={() => document.getElementById('refInput').click()}>
                  <input
                    type="file"
                    id="refInput"
                    accept="image/*"
                    onChange={handleReferenceChange}
                    style={{ display: 'none' }}
                  />
                  {referencePreviewUrl ? (
                    <img src={referencePreviewUrl} alt="Reference" className="preview-image" style={{ maxHeight: '200px' }} />
                  ) : (
                    <div style={{ textAlign: 'center' }}>
                      <span style={{ fontSize: '2rem', display: 'block', marginBottom: '0.5rem' }}>🖼️</span>
                      <p style={{ margin: 0, fontSize: '0.9rem' }}>Upload style reference</p>
                    </div>
                  )}
                </div>
              </>
            )}

            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Custom Instructions</label>
            <textarea
              rows="3"
              placeholder={mode === 'preset' ? "E.g., 'Make it messy', 'Add bangs'" : "E.g., 'Copy the bangs exactly', 'Make it slightly longer'"}
              value={config.description}
              onChange={(e) => setConfig({ ...config, description: e.target.value })}
              style={{ resize: 'none' }}
            />
          </div>

          <button
            className="btn-primary"
            style={{ width: '100%', marginTop: '2rem' }}
            onClick={handleGenerate}
            disabled={loading || !selectedImage}
          >
            {loading ? 'Generating...' : '✨ Generate New Look'}
          </button>

          {error && <p style={{ color: '#ef4444', marginTop: '1rem' }}>{error}</p>}
        </div>

        {/* Right Column: Result */}
        <div className="glass-panel" id="result-panel">
          <h2 style={{ marginTop: 0 }}>Result</h2>
          <div style={{
            minHeight: '300px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.2)',
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden'
          }}>
            {loading ? (
              <div className="loading-spinner"></div>
            ) : generatedImage ? (
              <img src={generatedImage} alt="Generated" className="preview-image" />
            ) : (
              <p style={{ color: 'var(--text-secondary)' }}>Generated image will appear here</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
