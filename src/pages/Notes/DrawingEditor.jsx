import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Stage, Layer, Line, Arrow, Circle, Rect, Text, Transformer } from 'react-konva';
import axios from 'axios';
import { ArrowLeft, Save, Undo, Redo, Trash2, Eraser, Pen, Circle as CircleIcon, Square, MoveRight, Type, MousePointer2, Moon, Sun } from 'lucide-react';
import clsx from 'clsx';
import { useTheme } from '../../context/ThemeContext';

const Shape = ({ shapeProps, isSelected, onSelect, onChange, toolMode }) => {
    const shapeRef = useRef();
    const trRef = useRef();

    useEffect(() => {
        if (isSelected) {
            trRef.current.nodes([shapeRef.current]);
            trRef.current.getLayer().batchDraw();
        }
    }, [isSelected]);

    const handleDragEnd = (e) => {
        onChange({
            ...shapeProps,
            x: e.target.x(),
            y: e.target.y(),
        });
    };

    const handleTransformEnd = (e) => {
        const node = shapeRef.current;
        const scaleX = node.scaleX();
        const scaleY = node.scaleY();

        node.scaleX(1);
        node.scaleY(1);

        const newProps = {
            ...shapeProps,
            x: node.x(),
            y: node.y(),
        };

        if (shapeProps.type === 'shape' || shapeProps.type === 'text') {
            newProps.width = Math.max(5, node.width() * scaleX);
            newProps.height = Math.max(5, node.height() * scaleY);

            if (shapeProps.tool === 'circle') {
                newProps.radius = Math.max(5, node.radius() * scaleX);
            }
            if (shapeProps.tool === 'text') {
                newProps.fontSize = Math.max(5, node.fontSize() * scaleY);
            }
        } else {
            node.scaleX(scaleX);
            node.scaleY(scaleY);
            newProps.scaleX = scaleX;
            newProps.scaleY = scaleY;
        }

        onChange(newProps);
    };

    const commonProps = {
        onClick: onSelect,
        onTap: onSelect,
        ref: shapeRef,
        ...shapeProps,
        draggable: toolMode === 'select',
        onDragEnd: handleDragEnd,
        onTransformEnd: handleTransformEnd,
    };

    const renderShape = () => {
        if (shapeProps.tool === 'pen' || shapeProps.tool === 'eraser') {
            return (
                <Line
                    {...commonProps}
                    stroke={shapeProps.tool === 'eraser' ? '#ffffff' : (shapeProps.stroke || '#4f46e5')}
                    strokeWidth={shapeProps.tool === 'eraser' ? 20 : (shapeProps.strokeWidth || 5)}
                    tension={0.5}
                    lineCap="round"
                    lineJoin="round"
                    globalCompositeOperation={shapeProps.tool === 'eraser' ? 'destination-out' : 'source-over'}
                />
            );
        } else if (shapeProps.tool === 'rectangle') {
            return (
                <Rect
                    {...commonProps}
                    stroke={shapeProps.stroke || '#4f46e5'}
                    strokeWidth={shapeProps.strokeWidth || 4}
                />
            );
        } else if (shapeProps.tool === 'circle') {
            return (
                <Circle
                    {...commonProps}
                    stroke={shapeProps.stroke || '#4f46e5'}
                    strokeWidth={shapeProps.strokeWidth || 4}
                />
            );
        } else if (shapeProps.tool === 'arrow') {
            return (
                <Arrow
                    {...commonProps}
                    stroke={shapeProps.stroke || '#4f46e5'}
                    strokeWidth={shapeProps.strokeWidth || 4}
                    fill={shapeProps.stroke || '#4f46e5'}
                />
            );
        } else if (shapeProps.tool === 'text') {
            return (
                <Text
                    {...commonProps}
                    fill={shapeProps.fill || '#4f46e5'}
                />
            );
        }
        return null;
    };

    return (
        <>
            {renderShape()}
            {isSelected && (
                <Transformer
                    ref={trRef}
                    borderDash={[6, 2]}
                    boundBoxFunc={(oldBox, newBox) => {
                        if (newBox.width < 5 || newBox.height < 5) return oldBox;
                        return newBox;
                    }}
                />
            )}
        </>
    );
};



const DrawingEditor = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isDarkMode, toggleTheme } = useTheme();
    const [tool, setTool] = useState('pen');
    const [elements, setElements] = useState([]);
    const [history, setHistory] = useState([]);
    const isDrawing = useRef(false);
    const [title, setTitle] = useState('');
    const [loading, setLoading] = useState(!!id);
    const [currentColor, setCurrentColor] = useState('#4f46e5');
    const [strokeWidth, setStrokeWidth] = useState(5);
    const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
    const [showCursor, setShowCursor] = useState(false);
    const [selectedId, setSelectedId] = useState(null);

    const LIGHT_COLOR = '#4f46e5';
    const DARK_COLOR = '#ef4444';

    useEffect(() => {
        if (id) {
            fetchNote();
        }
    }, [id]);

    useEffect(() => {
        // Auto-switch pen color if it matches the default theme color
        if (currentColor === LIGHT_COLOR && isDarkMode) {
            setCurrentColor(DARK_COLOR);
        } else if (currentColor === DARK_COLOR && !isDarkMode) {
            setCurrentColor(LIGHT_COLOR);
        }
    }, [isDarkMode]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
                e.preventDefault();
                if (e.shiftKey) {
                    handleRedo();
                } else {
                    handleUndo();
                }
            } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
                e.preventDefault();
                handleRedo();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [elements, history]);

    const fetchNote = async () => {
        try {
            const res = await axios.get(`/api/notes/${id}`);
            const note = res.data;
            setTitle(note.title);
            if (note.content) {
                const parsed = JSON.parse(note.content);
                const withIds = parsed.map((el, i) => ({ ...el, id: el.id || `el-${i}-${Date.now()}` }));
                setElements(withIds);
            }
            setLoading(false);
        } catch (error) {
            console.error('Error fetching drawing:', error);
            alert('Failed to load drawing');
            navigate('/');
        }
    };

    const checkDeselect = (e) => {
        const clickedOnEmpty = e.target === e.target.getStage();
        if (clickedOnEmpty) {
            setSelectedId(null);
        }
    };

    const handleMouseDown = (e) => {
        checkDeselect(e);

        if (tool === 'select') return;

        const pos = e.target.getStage().getPointerPosition();
        const newId = `el-${Date.now()}`;

        if (tool === 'text') {
            const text = prompt('Enter text:');
            if (text) {
                setElements([...elements, {
                    id: newId,
                    tool,
                    x: pos.x,
                    y: pos.y,
                    text,
                    type: 'text',
                    fontSize: 20,
                    fill: currentColor
                }]);
                setHistory([]);
            }
            return;
        }

        isDrawing.current = true;
        setSelectedId(null);

        if (tool === 'pen' || tool === 'eraser') {
            setElements([...elements, {
                id: newId,
                tool,
                points: [pos.x, pos.y],
                type: 'line',
                stroke: tool === 'eraser' ? '#ffffff' : currentColor,
                strokeWidth: tool === 'eraser' ? 20 : strokeWidth
            }]);
        } else if (tool === 'arrow') {
            setElements([...elements, {
                id: newId,
                tool,
                x: 0,
                y: 0,
                points: [pos.x, pos.y, pos.x, pos.y],
                type: 'line',
                stroke: currentColor,
                strokeWidth: strokeWidth
            }]);
        } else {
            setElements([...elements, {
                id: newId,
                tool,
                x: pos.x,
                y: pos.y,
                width: 0,
                height: 0,
                points: [pos.x, pos.y, pos.x, pos.y],
                type: 'shape',
                stroke: currentColor,
                strokeWidth: strokeWidth
            }]);
        }
        setHistory([]);
    };

    const handleMouseMove = (e) => {
        const stage = e.target.getStage();
        const point = stage.getPointerPosition();
        setCursorPos({ x: point.x, y: point.y });

        if (!isDrawing.current || tool === 'select') return;

        let lastElement = elements[elements.length - 1];

        if (lastElement.type === 'line') {
            lastElement.points = lastElement.points.concat([point.x, point.y]);
        } else {
            if (tool === 'rectangle' || tool === 'circle') {
                lastElement.width = point.x - lastElement.x;
                lastElement.height = point.y - lastElement.y;

                if (tool === 'circle') {
                    const dx = point.x - lastElement.x;
                    const dy = point.y - lastElement.y;
                    lastElement.radius = Math.sqrt(dx * dx + dy * dy);
                }
            } else if (tool === 'arrow') {
                lastElement.points = [lastElement.points[0], lastElement.points[1], point.x, point.y];
            }
        }

        elements.splice(elements.length - 1, 1, lastElement);
        setElements(elements.concat());
    };

    const handleMouseUp = () => {
        isDrawing.current = false;
    };

    const handleUndo = () => {
        if (elements.length === 0) return;
        const newElements = [...elements];
        const lastElement = newElements.pop();
        setElements(newElements);
        setHistory([...history, lastElement]);
    };

    const handleRedo = () => {
        if (history.length === 0) return;
        const newHistory = [...history];
        const nextElement = newHistory.pop();
        setElements([...elements, nextElement]);
        setHistory(newHistory);
    };

    const handleClear = () => {
        setHistory([...history, ...elements.reverse()]);
        setElements([]);
    };

    const handleSave = async () => {
        try {
            const noteData = {
                title: title || 'Untitled Drawing',
                type: 'drawing',
                content: JSON.stringify(elements)
            };

            if (id) {
                await axios.put(`/api/notes/${id}`, noteData);
            } else {
                await axios.post('/api/notes', noteData);
            }

            alert('Drawing Saved Successfully!');
            navigate('/');
        } catch (error) {
            console.error('Error saving drawing:', error);
            alert('Failed to save drawing.');
        }
    };

    const shouldUseCustomCursor = tool === 'pen' || tool === 'rectangle' || tool === 'circle' || tool === 'arrow';

    if (loading) {
        return <div className="flex justify-center items-center h-screen bg-background text-secondary">Loading...</div>;
    }

    return (
        <div className="min-h-screen bg-background flex flex-col transition-colors duration-300">
            {/* Toolbar */}
            <div className="bg-background border-b border-secondary/20 px-4 py-3 flex justify-between items-center shadow-sm z-10 flex-wrap gap-y-2">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/')}
                        className="p-2 hover:bg-secondary/10 rounded-lg transition-colors text-foreground"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Untitled Drawing"
                        className="text-lg font-bold bg-transparent border-none focus:outline-none placeholder-secondary text-foreground w-48 sm:w-auto"
                    />
                </div>

                <div className="flex items-center gap-2 bg-secondary/10 p-1 rounded-xl overflow-x-auto max-w-full">
                    <button
                        onClick={() => setTool('select')}
                        className={clsx("p-2 rounded-lg transition-all", tool === 'select' ? "bg-background shadow text-primary" : "text-secondary hover:text-foreground")}
                        title="Select & Move"
                    >
                        <MousePointer2 size={20} />
                    </button>

                    <div className="w-px h-6 bg-secondary/30 mx-1"></div>

                    <div className="flex items-center gap-2 px-2">
                        <div className="flex flex-col items-center">
                            <input
                                type="color"
                                value={currentColor}
                                onChange={(e) => setCurrentColor(e.target.value)}
                                className="w-8 h-8 rounded cursor-pointer border-none bg-transparent"
                                title="Color Picker"
                            />
                        </div>
                        <div className="flex flex-col items-center w-20">
                            <input
                                type="range"
                                min="2"
                                max="20"
                                value={strokeWidth}
                                onChange={(e) => setStrokeWidth(parseInt(e.target.value))}
                                className="w-full h-2 bg-secondary/30 rounded-lg appearance-none cursor-pointer accent-primary"
                                title="Brush Size"
                            />
                        </div>
                    </div>

                    <div className="w-px h-6 bg-secondary/30 mx-1"></div>

                    <button
                        onClick={() => setTool('pen')}
                        className={clsx("p-2 rounded-lg transition-all", tool === 'pen' ? "bg-background shadow text-primary" : "text-secondary hover:text-foreground")}
                        title="Pen"
                    >
                        <Pen size={20} />
                    </button>
                    <button
                        onClick={() => setTool('eraser')}
                        className={clsx("p-2 rounded-lg transition-all", tool === 'eraser' ? "bg-background shadow text-primary" : "text-secondary hover:text-foreground")}
                        title="Eraser"
                    >
                        <Eraser size={20} />
                    </button>

                    <div className="w-px h-6 bg-secondary/30 mx-1"></div>

                    <button
                        onClick={() => setTool('text')}
                        className={clsx("p-2 rounded-lg transition-all", tool === 'text' ? "bg-background shadow text-primary" : "text-secondary hover:text-foreground")}
                        title="Text"
                    >
                        <Type size={20} />
                    </button>

                    <button
                        onClick={() => setTool('arrow')}
                        className={clsx("p-2 rounded-lg transition-all", tool === 'arrow' ? "bg-background shadow text-primary" : "text-secondary hover:text-foreground")}
                        title="Arrow"
                    >
                        <MoveRight size={20} />
                    </button>
                    <button
                        onClick={() => setTool('rectangle')}
                        className={clsx("p-2 rounded-lg transition-all", tool === 'rectangle' ? "bg-background shadow text-primary" : "text-secondary hover:text-foreground")}
                        title="Rectangle"
                    >
                        <Square size={20} />
                    </button>
                    <button
                        onClick={() => setTool('circle')}
                        className={clsx("p-2 rounded-lg transition-all", tool === 'circle' ? "bg-background shadow text-primary" : "text-secondary hover:text-foreground")}
                        title="Circle"
                    >
                        <CircleIcon size={20} />
                    </button>

                    <div className="w-px h-6 bg-secondary/30 mx-1"></div>

                    <button onClick={handleUndo} disabled={elements.length === 0} className="p-2 text-secondary hover:text-foreground disabled:opacity-30 transition-colors" title="Undo"><Undo size={20} /></button>
                    <button onClick={handleRedo} disabled={history.length === 0} className="p-2 text-secondary hover:text-foreground disabled:opacity-30 transition-colors" title="Redo"><Redo size={20} /></button>
                    <button onClick={handleClear} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" title="Clear Canvas"><Trash2 size={20} /></button>
                </div>

                <div className="flex items-center gap-4 ml-auto">
                    <button
                        onClick={toggleTheme}
                        className="p-2 hover:bg-secondary/10 rounded-full transition-colors text-foreground"
                    >
                        {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                    </button>

                    <button
                        onClick={handleSave}
                        className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-hover transition-colors shadow-md hover:shadow-lg"
                    >
                        <Save size={18} />
                        <span>Save</span>
                    </button>
                </div>
            </div>

            {/* Canvas Area */}
            <div
                className={clsx("flex-1 bg-background relative overflow-hidden transition-colors duration-300", shouldUseCustomCursor ? "cursor-none" : tool === 'select' ? "cursor-move" : "cursor-default")}
                onMouseEnter={() => setShowCursor(true)}
                onMouseLeave={() => setShowCursor(false)}
            >
                {/* Grid Background */}
                <div className="absolute inset-0 bg-[radial-gradient(var(--secondary)_1px,transparent_1px)] [background-size:20px_20px] opacity-20 pointer-events-none" />

                <Stage
                    width={window.innerWidth}
                    height={window.innerHeight - 80}
                    onMouseDown={handleMouseDown}
                    onMousemove={handleMouseMove}
                    onMouseup={handleMouseUp}
                >
                    <Layer>
                        {elements.map((el, i) => (
                            <Shape
                                key={el.id || i}
                                shapeProps={el}
                                isSelected={el.id === selectedId}
                                toolMode={tool}
                                onSelect={() => {
                                    if (tool === 'select') {
                                        setSelectedId(el.id);
                                    }
                                }}
                                onChange={(newAttrs) => {
                                    const newElements = elements.slice();
                                    newElements[i] = newAttrs;
                                    setElements(newElements);
                                }}
                            />
                        ))}
                    </Layer>
                </Stage>

                {/* Custom Dot Cursor */}
                {showCursor && shouldUseCustomCursor && (
                    <div
                        className="absolute pointer-events-none rounded-full border border-gray-300 z-50 transform -translate-x-1/2 -translate-y-1/2"
                        style={{
                            left: cursorPos.x,
                            top: cursorPos.y,
                            width: strokeWidth,
                            height: strokeWidth,
                            backgroundColor: currentColor,
                            transition: 'width 0.1s, height 0.1s'
                        }}
                    ></div>
                )}

                {elements.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <p className="text-secondary text-2xl font-bold opacity-50">Start drawing something... 🎨</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DrawingEditor;
