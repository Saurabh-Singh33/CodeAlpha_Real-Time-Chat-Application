import React, { useRef, useEffect, useState, useContext, useCallback } from 'react';
import { SocketContext } from '../context/SocketContext';
import { AuthContext } from '../context/AuthContext';
import { fabric } from 'fabric';
import { 
  Trash2, Download, Eraser, Edit2, Type, Square, Circle, Triangle, 
  Minus, ArrowRight, Highlighter, Image as ImageIcon, MousePointer2, 
  Hand, ZoomIn, ZoomOut, Undo, Redo, Plus, ChevronRight, ChevronLeft, Target,
  Lock, Unlock, Send
} from 'lucide-react';

export default function Whiteboard({ roomId, isHost }) {
  const containerRef = useRef(null);
  const canvasElementRef = useRef(null);
  const canvasRef = useRef(null);
  const { socket } = useContext(SocketContext);
  const { user } = useContext(AuthContext);

  const [tool, setTool] = useState('pen'); // pen, highlighter, eraser, text, rect, circle, triangle, line, arrow, pan, laser, select
  const [color, setColor] = useState('#000000');
  const [lineWidth, setLineWidth] = useState(4);
  
  const [pages, setPages] = useState(['']); // array of JSON strings
  const [currentPage, setCurrentPage] = useState(0);
  
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  
  const [cursors, setCursors] = useState({});
  const [lasers, setLasers] = useState({});

  const [studentDrawEnabled, setStudentDrawEnabled] = useState(false);

  const isRemoteUpdate = useRef(false);
  const isDrawingShape = useRef(false);
  const shapeStartRef = useRef({ x: 0, y: 0 });
  const currentShapeRef = useRef(null);
  const isPanning = useRef(false);
  const lastPanCoords = useRef({ x: 0, y: 0 });

  const colors = ['#000000', '#3b82f6', '#10b981', '#f43f5e', '#8b5cf6', '#f59e0b', '#ffffff'];

  // --- INIT LOCAL STORAGE ---
  useEffect(() => {
    const saved = localStorage.getItem(`varta-wb-${roomId}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setPages(parsed);
        }
      } catch (e) {
        console.error("Failed to parse local storage", e);
      }
    }
  }, [roomId]);

  // --- INIT FABRIC CANVAS ---
  useEffect(() => {
    if (!canvasElementRef.current || !containerRef.current) return;

    const canvas = new fabric.Canvas(canvasElementRef.current, {
      isDrawingMode: true,
      backgroundColor: '#ffffff',
      selection: false
    });
    canvasRef.current = canvas;

    const resize = () => {
      canvas.setWidth(containerRef.current.clientWidth);
      canvas.setHeight(containerRef.current.clientHeight);
      canvas.renderAll();
    };
    resize();
    window.addEventListener('resize', resize);

    // Initial tool setup
    setupTool(tool, canvas, color, lineWidth);

    // If we have saved pages, load the first one
    if (pages[0]) {
      loadState(pages[0], canvas);
    }

    // Spacebar to pan
    const handleKeyDown = (e) => {
      if (e.code === 'Space' && !isPanning.current && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
        isPanning.current = true;
        canvas.defaultCursor = 'grab';
      }
    };
    const handleKeyUp = (e) => {
      if (e.code === 'Space') {
        isPanning.current = false;
        setupTool(tool, canvas, color, lineWidth);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      canvas.dispose();
      canvasRef.current = null;
    };
    // eslint-disable-next-line
  }, []); // Run once

  // --- SYNC ENGINE ---
  const saveState = useCallback(() => {
    if (isRemoteUpdate.current || !canvasRef.current) return;
    const json = JSON.stringify(canvasRef.current.toJSON());
    
    setPages(prev => {
      const newPages = [...prev];
      newPages[currentPage] = json;
      localStorage.setItem(`varta-wb-${roomId}`, JSON.stringify(newPages));
      return newPages;
    });

    setUndoStack(prev => [...prev, json]);
    setRedoStack([]);

    if (socket) {
      socket.emit('whiteboard-update', { roomId, page: currentPage, state: json });
    }
  }, [currentPage, roomId, socket]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onPathCreated = () => saveState();
    const onObjectModified = () => saveState();
    const onObjectAdded = (e) => {
       if (!isDrawingShape.current) saveState();
    };
    const onObjectRemoved = () => saveState();

    canvas.on('path:created', onPathCreated);
    canvas.on('object:modified', onObjectModified);
    canvas.on('object:removed', onObjectRemoved);
    canvas.on('object:added', onObjectAdded);

    return () => {
      canvas.off('path:created', onPathCreated);
      canvas.off('object:modified', onObjectModified);
      canvas.off('object:removed', onObjectRemoved);
      canvas.off('object:added', onObjectAdded);
    };
  }, [saveState]);

  const loadState = (jsonStr, canvas = canvasRef.current) => {
    if (!canvas || !jsonStr) return;
    isRemoteUpdate.current = true;
    canvas.loadFromJSON(jsonStr, () => {
      canvas.renderAll();
      isRemoteUpdate.current = false;
    });
  };

  // Listen to remote updates
  useEffect(() => {
    if (!socket) return;
    
    const onUpdate = (data) => {
      if (data.page === currentPage) {
        loadState(data.state);
      }
      setPages(prev => {
        const newPages = [...prev];
        newPages[data.page] = data.state;
        localStorage.setItem(`varta-wb-${roomId}`, JSON.stringify(newPages));
        return newPages;
      });
    };

    const onPageSwitch = (data) => {
      setCurrentPage(data.page);
      if (data.state) {
        loadState(data.state);
      }
    };

    const onCursorMove = (data) => {
      if (data.userId === socket.id) return;
      setCursors(prev => ({ ...prev, [data.userId]: data }));
    };

    const onLaserPointer = (data) => {
      if (data.userId === socket.id) return;
      setLasers(prev => ({ ...prev, [data.userId]: data }));
      
      setTimeout(() => {
        setLasers(current => {
          const temp = { ...current };
          if (temp[data.userId]?.timestamp === data.timestamp) {
            delete temp[data.userId];
          }
          return temp;
        });
      }, 1000);
    };

    const onWhiteboardLock = (data) => {
      setStudentDrawEnabled(data.enabled);
    };

    socket.on('whiteboard-update', onUpdate);
    socket.on('whiteboard-page', onPageSwitch);
    socket.on('cursor-move', onCursorMove);
    socket.on('laser-pointer', onLaserPointer);
    socket.on('whiteboard-lock', onWhiteboardLock);

    return () => {
      socket.off('whiteboard-update', onUpdate);
      socket.off('whiteboard-page', onPageSwitch);
      socket.off('cursor-move', onCursorMove);
      socket.off('laser-pointer', onLaserPointer);
      socket.off('whiteboard-lock', onWhiteboardLock);
    };
  }, [socket, currentPage, roomId]);

  // --- TOOL SETUP ---
  const hexToRgba = (hex, opacity) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${opacity})`;
  };

  const setupTool = (currentTool, canvas, currentColor, currentWidth) => {
    if (!canvas) return;
    
    // Default resets
    canvas.isDrawingMode = false;
    canvas.selection = false;
    canvas.defaultCursor = 'default';

    canvas.off('mouse:over');
    canvas.off('mouse:out');
    canvas.off('mouse:down');
    canvas.off('mouse:move');
    canvas.off('mouse:up');

    // Global Mouse Move for cursors and laser
    canvas.on('mouse:move', (e) => {
      const pointer = canvas.getPointer(e.e);
      
      if (socket) {
        socket.emit('cursor-move', { 
          roomId, userId: socket.id, 
          username: user?.username || user?.name || 'User', 
          x: pointer.x, y: pointer.y 
        });
      }

      if (currentTool === 'laser' && socket) {
        const timestamp = Date.now();
        socket.emit('laser-pointer', { roomId, userId: socket.id, x: pointer.x, y: pointer.y, timestamp });
        setLasers(prev => ({ ...prev, [socket.id]: { x: pointer.x, y: pointer.y, timestamp } }));
        
        setTimeout(() => {
          setLasers(current => {
            const temp = { ...current };
            if (temp[socket.id]?.timestamp === timestamp) {
              delete temp[socket.id];
            }
            return temp;
          });
        }, 1000);
      }
    });

    // Enforce lock mode for non-hosts
    if (!isHost && !studentDrawEnabled) {
      canvas.defaultCursor = 'not-allowed';
      canvas.getObjects().forEach(obj => obj.set('selectable', false));
      canvas.renderAll();
      return; // Stop here, no tools apply
    }

    // Apply specific tool behavior
    if (currentTool === 'pen') {
      canvas.isDrawingMode = true;
      canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
      canvas.freeDrawingBrush.color = currentColor;
      canvas.freeDrawingBrush.width = currentWidth;
    } 
    else if (currentTool === 'highlighter') {
      canvas.isDrawingMode = true;
      canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
      canvas.freeDrawingBrush.color = hexToRgba(currentColor, 0.4);
      canvas.freeDrawingBrush.width = currentWidth * 4;
    }
    else if (currentTool === 'eraser') {
      canvas.defaultCursor = 'cell';
      let isMouseDown = false;
      
      canvas.on('mouse:over', (e) => {
        if (e.target) {
          e.target.set('opacity', 0.3);
          canvas.renderAll();
        }
      });
      canvas.on('mouse:out', (e) => {
        if (e.target) {
          e.target.set('opacity', 1);
          canvas.renderAll();
        }
      });
      canvas.on('mouse:down', (e) => {
        isMouseDown = true;
        if (e.target) {
          canvas.remove(e.target);
        }
      });
      canvas.on('mouse:move', (e) => {
        if (isMouseDown && e.target) {
          canvas.remove(e.target);
        }
      });
      canvas.on('mouse:up', () => {
        isMouseDown = false;
      });
    }
    else if (['rect', 'circle', 'triangle', 'line', 'arrow'].includes(currentTool)) {
      canvas.defaultCursor = 'crosshair';
      
      canvas.on('mouse:down', (e) => {
        isDrawingShape.current = true;
        const pointer = canvas.getPointer(e.e);
        shapeStartRef.current = { x: pointer.x, y: pointer.y };
        
        let shape;
        const strokeColor = currentColor;
        const strokeW = currentWidth;
        
        if (currentTool === 'rect') {
          shape = new fabric.Rect({
            left: pointer.x, top: pointer.y, width: 0, height: 0,
            fill: 'transparent', stroke: strokeColor, strokeWidth: strokeW
          });
        } else if (currentTool === 'circle') {
          shape = new fabric.Circle({
            left: pointer.x, top: pointer.y, radius: 0,
            fill: 'transparent', stroke: strokeColor, strokeWidth: strokeW
          });
        } else if (currentTool === 'triangle') {
          shape = new fabric.Triangle({
            left: pointer.x, top: pointer.y, width: 0, height: 0,
            fill: 'transparent', stroke: strokeColor, strokeWidth: strokeW
          });
        } else if (currentTool === 'line' || currentTool === 'arrow') {
          shape = new fabric.Line([pointer.x, pointer.y, pointer.x, pointer.y], {
            stroke: strokeColor, strokeWidth: strokeW
          });
        }
        
        currentShapeRef.current = shape;
        canvas.add(shape);
      });
      
      canvas.on('mouse:move', (e) => {
        if (!isDrawingShape.current || !currentShapeRef.current) return;
        const pointer = canvas.getPointer(e.e);
        const start = shapeStartRef.current;
        const shape = currentShapeRef.current;
        
        if (currentTool === 'rect' || currentTool === 'triangle') {
          shape.set({ width: Math.abs(start.x - pointer.x), height: Math.abs(start.y - pointer.y) });
          shape.set({ left: Math.min(start.x, pointer.x), top: Math.min(start.y, pointer.y) });
        } else if (currentTool === 'circle') {
          const radius = Math.max(Math.abs(start.x - pointer.x), Math.abs(start.y - pointer.y)) / 2;
          shape.set({ radius });
          shape.set({ left: Math.min(start.x, pointer.x), top: Math.min(start.y, pointer.y) });
        } else if (currentTool === 'line' || currentTool === 'arrow') {
          shape.set({ x2: pointer.x, y2: pointer.y });
        }
        canvas.renderAll();
      });
      
      canvas.on('mouse:up', () => {
        isDrawingShape.current = false;
        if (currentShapeRef.current) {
          saveState(); 
          currentShapeRef.current = null;
        }
      });
    }
    else if (currentTool === 'text') {
      canvas.defaultCursor = 'text';
      canvas.on('mouse:down', (e) => {
        const pointer = canvas.getPointer(e.e);
        const text = new fabric.IText('Text', {
          left: pointer.x, top: pointer.y, fontFamily: 'sans-serif',
          fill: currentColor, fontSize: Math.max(20, currentWidth * 5)
        });
        canvas.add(text);
        canvas.setActiveObject(text);
        text.enterEditing();
        text.selectAll();
        saveState();
      });
    }
    else if (currentTool === 'pan' || isPanning.current) {
      canvas.defaultCursor = isPanning.current ? 'grabbing' : 'grab';
      canvas.on('mouse:down', (e) => {
        isPanning.current = true;
        canvas.defaultCursor = 'grabbing';
        lastPanCoords.current = { x: e.e.clientX, y: e.e.clientY };
      });
      canvas.on('mouse:move', (e) => {
        if (isPanning.current) {
          const vpt = canvas.viewportTransform;
          vpt[4] += e.e.clientX - lastPanCoords.current.x;
          vpt[5] += e.e.clientY - lastPanCoords.current.y;
          canvas.requestRenderAll();
          lastPanCoords.current = { x: e.e.clientX, y: e.e.clientY };
        }
      });
      canvas.on('mouse:up', () => {
        isPanning.current = false;
        canvas.defaultCursor = 'grab';
      });
    }
    else if (currentTool === 'select') {
      canvas.selection = true;
      canvas.defaultCursor = 'default';
      canvas.getObjects().forEach(obj => obj.set('selectable', true));
    }
  };

  useEffect(() => {
    setupTool(tool, canvasRef.current, color, lineWidth);
    if (tool !== 'select' && canvasRef.current) {
      canvasRef.current.getObjects().forEach(obj => obj.set('selectable', false));
      canvasRef.current.discardActiveObject();
      canvasRef.current.renderAll();
    }
  }, [tool, color, lineWidth, isHost, studentDrawEnabled]);

  // --- ACTIONS ---
  const handleUndo = () => {
    if (undoStack.length <= 1) return;
    const currentState = undoStack.pop();
    const previousState = undoStack[undoStack.length - 1];
    
    setRedoStack(prev => [...prev, currentState]);
    setUndoStack([...undoStack]);
    
    loadState(previousState);
    if (socket) {
      socket.emit('whiteboard-update', { roomId, page: currentPage, state: previousState });
    }
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const nextState = redoStack.pop();
    
    setUndoStack(prev => [...prev, nextState]);
    setRedoStack([...redoStack]);
    
    loadState(nextState);
    if (socket) {
      socket.emit('whiteboard-update', { roomId, page: currentPage, state: nextState });
    }
  };

  const clearBoard = () => {
    if (!canvasRef.current) return;
    canvasRef.current.clear();
    canvasRef.current.backgroundColor = '#ffffff';
    saveState();
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file || !canvasRef.current) return;
    const reader = new FileReader();
    reader.onload = (f) => {
      const data = f.target.result;
      fabric.Image.fromURL(data, (img) => {
        img.scaleToWidth(Math.min(img.width, canvasRef.current.width / 2));
        canvasRef.current.add(img);
        canvasRef.current.centerObject(img);
        saveState();
      });
    };
    reader.readAsDataURL(file);
  };

  const changePage = (index) => {
    setCurrentPage(index);
    if (pages[index]) {
      loadState(pages[index]);
    } else {
      canvasRef.current?.clear();
      canvasRef.current.backgroundColor = '#ffffff';
    }
    if (socket) {
      socket.emit('whiteboard-page', { roomId, page: index, state: pages[index] });
    }
  };

  const addPage = () => {
    const newPages = [...pages, ''];
    setPages(newPages);
    changePage(newPages.length - 1);
  };

  const zoom = (direction) => {
    if (!canvasRef.current) return;
    let zoomLevel = canvasRef.current.getZoom();
    zoomLevel = direction === 'in' ? zoomLevel * 1.1 : zoomLevel / 1.1;
    canvasRef.current.zoomToPoint({ x: canvasRef.current.width / 2, y: canvasRef.current.height / 2 }, zoomLevel);
  };

  const sendToChat = () => {
    if (!canvasRef.current || !socket) return;
    
    // Save current zoom & pan
    const vpt = canvasRef.current.viewportTransform.slice();
    // Reset zoom & pan temporarily to capture the whole natural board
    canvasRef.current.setViewportTransform([1,0,0,1,0,0]);
    
    const dataURL = canvasRef.current.toDataURL({ format: 'png', multiplier: 1 });
    
    // Restore zoom & pan
    canvasRef.current.setViewportTransform(vpt);

    socket.emit('chat-message', {
      type: 'file',
      fileData: dataURL,
      fileName: `whiteboard-snapshot-${currentPage + 1}.png`,
      fileType: 'image/png',
      fileSize: 0,
      roomId
    });
  };

  const isViewOnly = !isHost && !studentDrawEnabled;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', borderRadius: 'var(--radius-lg)', overflow: 'hidden', background: '#ffffff', color: '#1F2937' }}>
      
      {/* Top Toolbar */}
      {isViewOnly ? (
        <div className="whiteboard-toolbar" style={{ display: 'flex', justifyContent: 'center', padding: '10px', background: '#f3f4f6', borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
          <span style={{ fontSize: '0.85rem', color: '#4B5563', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Lock size={14} />
            Host has locked the whiteboard. View only.
          </span>
        </div>
      ) : (
        <div className="whiteboard-toolbar" style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: '#f3f4f6', borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
          
          {/* Tools Section */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <button className={`feature-btn ${tool === 'select' ? 'active' : ''}`} onClick={() => setTool('select')} title="Select"><MousePointer2 size={16} /></button>
            <button className={`feature-btn ${tool === 'pen' ? 'active' : ''}`} onClick={() => setTool('pen')} title="Pen"><Edit2 size={16} /></button>
            <button className={`feature-btn ${tool === 'highlighter' ? 'active' : ''}`} onClick={() => setTool('highlighter')} title="Highlighter"><Highlighter size={16} /></button>
            <button className={`feature-btn ${tool === 'eraser' ? 'active' : ''}`} onClick={() => setTool('eraser')} title="Eraser"><Eraser size={16} /></button>
            <button className={`feature-btn ${tool === 'text' ? 'active' : ''}`} onClick={() => setTool('text')} title="Text"><Type size={16} /></button>
            
            <div style={{ borderLeft: '1px solid #d1d5db', height: '24px', margin: '0 4px' }}></div>
            
            <button className={`feature-btn ${tool === 'rect' ? 'active' : ''}`} onClick={() => setTool('rect')} title="Rectangle"><Square size={16} /></button>
            <button className={`feature-btn ${tool === 'circle' ? 'active' : ''}`} onClick={() => setTool('circle')} title="Circle"><Circle size={16} /></button>
            <button className={`feature-btn ${tool === 'triangle' ? 'active' : ''}`} onClick={() => setTool('triangle')} title="Triangle"><Triangle size={16} /></button>
            <button className={`feature-btn ${tool === 'line' ? 'active' : ''}`} onClick={() => setTool('line')} title="Line"><Minus size={16} /></button>
            <button className={`feature-btn ${tool === 'arrow' ? 'active' : ''}`} onClick={() => setTool('arrow')} title="Arrow"><ArrowRight size={16} /></button>
            
            <div style={{ borderLeft: '1px solid #d1d5db', height: '24px', margin: '0 4px' }}></div>
            
            <button className={`feature-btn ${tool === 'laser' ? 'active' : ''}`} onClick={() => setTool('laser')} title="Laser Pointer"><Target size={16} /></button>
            <button className={`feature-btn ${tool === 'pan' ? 'active' : ''}`} onClick={() => setTool('pan')} title="Pan (Spacebar)"><Hand size={16} /></button>
            <button className="feature-btn" onClick={() => zoom('in')} title="Zoom In"><ZoomIn size={16} /></button>
            <button className="feature-btn" onClick={() => zoom('out')} title="Zoom Out"><ZoomOut size={16} /></button>
            
            <div style={{ borderLeft: '1px solid #d1d5db', height: '24px', margin: '0 4px' }}></div>
            
            {/* Colors */}
            <div style={{ display: 'flex', gap: '4px' }}>
              {colors.map(c => (
                <div 
                  key={c} 
                  onClick={() => setColor(c)}
                  style={{ width: '20px', height: '20px', borderRadius: '50%', background: c, cursor: 'pointer', border: color === c ? '2px solid #1A73E8' : '1px solid #ccc' }} 
                />
              ))}
            </div>
            
            {/* Line Width */}
            <select value={lineWidth} onChange={(e) => setLineWidth(Number(e.target.value))} style={{ padding: '2px 4px', borderRadius: '4px', border: '1px solid #ccc' }}>
              <option value={2}>Thin</option>
              <option value={4}>Medium</option>
              <option value={8}>Thick</option>
            </select>
          </div>

          {/* Actions Section */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            
            {/* Host Student Draw Toggle */}
            {isHost && (
              <button 
                className={`feature-btn ${studentDrawEnabled ? 'active' : ''}`}
                onClick={() => {
                  const newState = !studentDrawEnabled;
                  setStudentDrawEnabled(newState);
                  if (socket) socket.emit('whiteboard-lock', { roomId, enabled: newState });
                }}
                title={studentDrawEnabled ? 'Lock student drawing' : 'Allow student drawing'}
              >
                {studentDrawEnabled ? <Unlock size={16} /> : <Lock size={16} />}
              </button>
            )}

            <div style={{ borderLeft: '1px solid #d1d5db', height: '24px', margin: '0 2px' }}></div>

            <button className="feature-btn" onClick={sendToChat} title="Send Snapshot to Chat">
              <Send size={16} />
            </button>

            <button className="feature-btn" onClick={handleUndo} disabled={undoStack.length <= 1} title="Undo"><Undo size={16} /></button>
            <button className="feature-btn" onClick={handleRedo} disabled={redoStack.length === 0} title="Redo"><Redo size={16} /></button>
            
            <label className="feature-btn" style={{ cursor: 'pointer', margin: 0 }} title="Upload Image">
              <ImageIcon size={16} />
              <input type="file" style={{ display: 'none' }} accept="image/*" onChange={handleImageUpload} />
            </label>
            
            <button className="btn btn-danger" onClick={clearBoard} style={{ padding: '6px 12px', fontSize: '0.8rem' }} title="Clear Board">
              <Trash2 size={15} /> Clear
            </button>
          </div>
        </div>
      )}

      {/* Canvas Area */}
      <div ref={containerRef} style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <canvas ref={canvasElementRef} style={{ position: 'absolute', top: 0, left: 0 }} />
        
        {/* Render Remote Cursors */}
        {Object.values(cursors).map(c => {
          if (!canvasRef.current) return null;
          const vpt = canvasRef.current.viewportTransform;
          const screenX = c.x * vpt[0] + vpt[4];
          const screenY = c.y * vpt[3] + vpt[5];
          
          return (
            <div key={c.userId} style={{
              position: 'absolute', left: screenX, top: screenY, 
              pointerEvents: 'none', zIndex: 10
            }}>
              <MousePointer2 size={16} color="#1A73E8" style={{ transform: 'rotate(-15deg)' }} />
              <div style={{ 
                background: '#1A73E8', color: 'white', fontSize: '10px', 
                padding: '2px 6px', borderRadius: '4px', whiteSpace: 'nowrap',
                marginTop: '4px', marginLeft: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }}>
                {c.username}'s cursor
              </div>
            </div>
          );
        })}

        {/* Render Laser Pointers */}
        {Object.values(lasers).map(l => {
          if (!canvasRef.current) return null;
          const vpt = canvasRef.current.viewportTransform;
          const screenX = l.x * vpt[0] + vpt[4];
          const screenY = l.y * vpt[3] + vpt[5];
          
          return (
            <div key={`laser-${l.userId}`} style={{
              position: 'absolute', left: screenX - 8, top: screenY - 8, 
              width: '16px', height: '16px', borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.8)', // Red-500
              boxShadow: '0 0 15px 5px rgba(239, 68, 68, 0.6)',
              pointerEvents: 'none', zIndex: 20
            }} />
          );
        })}
      </div>

      {/* Bottom Pagination */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '8px', background: '#f3f4f6', borderTop: '1px solid rgba(0,0,0,0.1)', gap: '8px' }}>
        <button className="btn-icon" style={{ width: '30px', height: '30px', background: 'transparent', border: 'none', boxShadow: 'none' }} onClick={() => changePage(Math.max(0, currentPage - 1))} disabled={currentPage === 0 || isViewOnly}>
          <ChevronLeft size={16} color={isViewOnly ? "#9CA3AF" : "#4B5563"} />
        </button>
        
        {pages.map((_, idx) => (
          <button 
            key={idx} 
            onClick={() => { if (!isViewOnly) changePage(idx); }}
            style={{ 
              padding: '4px 12px', borderRadius: '4px', border: '1px solid #ccc',
              cursor: isViewOnly ? 'not-allowed' : 'pointer',
              background: currentPage === idx ? '#1A73E8' : 'white', color: currentPage === idx ? 'white' : '#1F2937',
              opacity: isViewOnly && currentPage !== idx ? 0.6 : 1
            }}
          >
            {idx + 1}
          </button>
        ))}
        
        <button className="btn-icon" style={{ width: '30px', height: '30px', background: 'transparent', border: 'none', boxShadow: 'none' }} onClick={addPage} disabled={isViewOnly}>
          <Plus size={16} color={isViewOnly ? "#9CA3AF" : "#4B5563"} />
        </button>
        
        <button className="btn-icon" style={{ width: '30px', height: '30px', background: 'transparent', border: 'none', boxShadow: 'none' }} onClick={() => changePage(Math.min(pages.length - 1, currentPage + 1))} disabled={currentPage === pages.length - 1 || isViewOnly}>
          <ChevronRight size={16} color={isViewOnly ? "#9CA3AF" : "#4B5563"} />
        </button>
      </div>
    </div>
  );
}
