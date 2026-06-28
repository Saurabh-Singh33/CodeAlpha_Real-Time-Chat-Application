import React, { useRef, useEffect, useState, useContext } from 'react';
import { SocketContext } from '../context/SocketContext';
import { Trash2 } from 'lucide-react';

export default function Whiteboard({ roomId }) {
  const canvasRef = useRef(null);
  const contextRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const { socket } = useContext(SocketContext);

  useEffect(() => {
    const canvas = canvasRef.current;
    // Set actual size in memory (scaled for retina displays)
    canvas.width = canvas.parentElement.clientWidth * 2;
    canvas.height = canvas.parentElement.clientHeight * 2;
    canvas.style.width = `${canvas.parentElement.clientWidth}px`;
    canvas.style.height = `${canvas.parentElement.clientHeight}px`;

    const context = canvas.getContext('2d');
    context.scale(2, 2);
    context.lineCap = 'round';
    context.strokeStyle = '#000000';
    context.lineWidth = 3;
    contextRef.current = context;

    // Handle incoming draw events
    const onDraw = ({ x0, y0, x1, y1, color }) => {
      const ctx = canvas.getContext('2d');
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.strokeStyle = color;
      ctx.stroke();
      ctx.closePath();
    };

    const onClear = () => {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };

    socket.on('draw', onDraw);
    socket.on('clear-board', onClear);

    return () => {
      socket.off('draw', onDraw);
      socket.off('clear-board', onClear);
    };
  }, [socket]);

  const [currentPos, setCurrentPos] = useState({ x: 0, y: 0 });

  const startDrawing = ({ nativeEvent }) => {
    const { offsetX, offsetY } = nativeEvent;
    setCurrentPos({ x: offsetX, y: offsetY });
    setIsDrawing(true);
  };

  const finishDrawing = () => {
    setIsDrawing(false);
  };

  const draw = ({ nativeEvent }) => {
    if (!isDrawing) return;
    const { offsetX, offsetY } = nativeEvent;
    
    // Draw locally
    contextRef.current.beginPath();
    contextRef.current.moveTo(currentPos.x, currentPos.y);
    contextRef.current.lineTo(offsetX, offsetY);
    contextRef.current.strokeStyle = '#000000';
    contextRef.current.stroke();
    contextRef.current.closePath();

    // Broadcast
    socket.emit('draw', {
      roomId,
      x0: currentPos.x,
      y0: currentPos.y,
      x1: offsetX,
      y1: offsetY,
      color: '#000000'
    });

    setCurrentPos({ x: offsetX, y: offsetY });
  };

  const clearBoard = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    socket.emit('clear-board', roomId);
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '0.5rem', background: 'rgba(255,255,255,0.9)', borderTopLeftRadius: '12px', borderTopRightRadius: '12px' }}>
        <button className="btn btn-icon" onClick={clearBoard} style={{ color: 'var(--accent-danger)' }} title="Clear Board">
          <Trash2 size={20} />
        </button>
      </div>
      <div className="whiteboard-container" style={{ flex: 1, borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseUp={finishDrawing}
          onMouseMove={draw}
          onMouseOut={finishDrawing}
        />
      </div>
    </div>
  );
}
