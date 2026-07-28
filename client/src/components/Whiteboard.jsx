import React, { useRef, useEffect, useState, useContext, useCallback } from 'react';
import { SocketContext } from '../context/SocketContext';
import { Trash2, Download, Eraser, Edit2, RotateCcw } from 'lucide-react';

export default function Whiteboard({ roomId }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#000000');
  const [lineWidth, setLineWidth] = useState(4);
  const [tool, setTool] = useState('pen'); // 'pen' | 'eraser'
  const { socket } = useContext(SocketContext);
  const [currentPos, setCurrentPos] = useState({ x: 0, y: 0 });

  const colors = ['#000000', '#3b82f6', '#10b981', '#f43f5e', '#8b5cf6', '#f59e0b', '#ffffff'];

  // Handle canvas sizing with high-DPI resolution
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // Save existing contents before resize
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(canvas, 0, 0);

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // Fill white background for whiteboard
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Restore contents
    if (tempCanvas.width > 0 && tempCanvas.height > 0) {
      ctx.drawImage(tempCanvas, 0, 0, tempCanvas.width / dpr, tempCanvas.height / dpr, 0, 0, width, height);
    }
  }, []);

  useEffect(() => {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [resizeCanvas]);

  useEffect(() => {
    if (!socket) return;

    const onDraw = ({ x0N, y0N, x1N, y1N, strokeColor, strokeWidth, isEraser }) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const dpr = window.devicePixelRatio || 1;

      const width = canvas.width / dpr;
      const height = canvas.height / dpr;

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(x0N * width, y0N * height);
      ctx.lineTo(x1N * width, y1N * height);
      ctx.strokeStyle = isEraser ? '#ffffff' : strokeColor;
      ctx.lineWidth = strokeWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
      ctx.closePath();
      ctx.restore();
    };

    const onClear = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const dpr = window.devicePixelRatio || 1;
      const width = canvas.width / dpr;
      const height = canvas.height / dpr;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
    };

    socket.on('draw', onDraw);
    socket.on('clear-board', onClear);

    return () => {
      socket.off('draw', onDraw);
      socket.off('clear-board', onClear);
    };
  }, [socket]);

  const getCanvasCoords = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const startDrawing = (e) => {
    const coords = getCanvasCoords(e);
    setCurrentPos(coords);
    setIsDrawing(true);
  };

  const finishDrawing = () => {
    setIsDrawing(false);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const coords = getCanvasCoords(e);
    const dpr = window.devicePixelRatio || 1;
    const width = canvas.width / dpr;
    const height = canvas.height / dpr;

    const activeColor = tool === 'eraser' ? '#ffffff' : color;

    // Draw locally
    const ctx = canvas.getContext('2d');
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(currentPos.x, currentPos.y);
    ctx.lineTo(coords.x, coords.y);
    ctx.strokeStyle = activeColor;
    ctx.lineWidth = tool === 'eraser' ? lineWidth * 3 : lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.closePath();
    ctx.restore();

    // Broadcast normalized coordinates (0 to 1) so drawings scale on all display resolutions
    if (socket) {
      socket.emit('draw', {
        roomId,
        x0N: currentPos.x / width,
        y0N: currentPos.y / height,
        x1N: coords.x / width,
        y1N: coords.y / height,
        strokeColor: activeColor,
        strokeWidth: tool === 'eraser' ? lineWidth * 3 : lineWidth,
        isEraser: tool === 'eraser'
      });
    }

    setCurrentPos(coords);
  };

  const clearBoard = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr);

    if (socket) {
      socket.emit('clear-board', roomId);
    }
  };

  const downloadCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `whiteboard-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
      {/* Whiteboard Toolbar */}
      <div className="whiteboard-toolbar">
        {/* Colors & Tools */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <button 
              className={`feature-btn ${tool === 'pen' ? 'active' : ''}`}
              onClick={() => setTool('pen')}
              style={{ padding: '6px 12px', fontSize: '0.8rem' }}
            >
              <Edit2 size={15} /> Pen
            </button>
            <button 
              className={`feature-btn ${tool === 'eraser' ? 'active' : ''}`}
              onClick={() => setTool('eraser')}
              style={{ padding: '6px 12px', fontSize: '0.8rem' }}
            >
              <Eraser size={15} /> Eraser
            </button>
          </div>

          {tool === 'pen' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(0,0,0,0.2)', padding: '4px 10px', borderRadius: '20px' }}>
              {colors.map(c => (
                <div 
                  key={c}
                  className={`color-dot ${color === c ? 'active' : ''}`}
                  style={{ background: c }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
          )}

          {/* Stroke Width Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            <span>Size:</span>
            {[2, 5, 10].map(size => (
              <button
                key={size}
                onClick={() => setLineWidth(size)}
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  background: lineWidth === size ? 'var(--accent-indigo)' : 'rgba(255,255,255,0.08)',
                  color: 'white',
                  border: 'none',
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                {size === 2 ? 'S' : size === 5 ? 'M' : 'L'}
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button className="btn btn-secondary" onClick={downloadCanvas} style={{ padding: '6px 12px', fontSize: '0.8rem' }} title="Download Canvas">
            <Download size={15} /> Save
          </button>
          <button className="btn btn-danger" onClick={clearBoard} style={{ padding: '6px 12px', fontSize: '0.8rem' }} title="Clear Board">
            <Trash2 size={15} /> Clear
          </button>
        </div>
      </div>

      {/* Canvas Container */}
      <div ref={containerRef} className="whiteboard-container">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseUp={finishDrawing}
          onMouseMove={draw}
          onMouseLeave={finishDrawing}
          style={{ cursor: tool === 'eraser' ? 'cell' : 'crosshair', display: 'block' }}
        />
      </div>
    </div>
  );
}
