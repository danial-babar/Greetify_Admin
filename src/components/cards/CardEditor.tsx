import { useState, useRef, useEffect } from 'react';
import Draggable from 'react-draggable';
import { HexColorPicker } from 'react-colorful';
import { useDropzone } from 'react-dropzone';
import { 
  TrashIcon, 
  PlusIcon, 
  ArrowUturnLeftIcon,
  ArrowUturnRightIcon,
  CheckIcon
} from '@heroicons/react/24/outline';

// Match mobile app data structure exactly
interface CardElement {
  id: string;
  type: 'text';
  text: string;
  positionX: number;
  positionY: number;
  colorIndex: number;
  fontStyleIndex: number;
  bold: boolean;
  italic?: boolean;
  scale: number;
  rotate: number;
  alignment: 'left' | 'center' | 'right';
  lineHeight: number;
  fontSize: number;
}

interface CardData {
  id?: string;
  name: string;
  category_id: string;
  sub_category_id: string;
  background_image?: string;
  preview_image?: string;
  elements: CardElement[];
}

// Match mobile app fonts
const EDITOR_FONTS = [
  { name: 'Arial', value: 'Arial' },
  { name: 'Comic Sans MS', value: 'Comic Sans MS' },
  { name: 'Courier New', value: 'Courier New' },
  { name: 'Georgia', value: 'Georgia' },
  { name: 'Times New Roman', value: 'Times New Roman' },
  { name: 'Trebuchet MS', value: 'Trebuchet MS' },
  { name: 'Verdana', value: 'Verdana' }
];

// Mobile app color palette
const editorColors = [
  '#000000', // Black
  '#FFFFFF', // White
  '#FF0000', // Red
  '#00FF00', // Green
  '#0000FF', // Blue
  '#FFFF00', // Yellow
  '#FF00FF', // Magenta
  '#00FFFF', // Cyan
  '#FFA500', // Orange
  '#800080', // Purple
  '#A52A2A', // Brown
  '#808080', // Gray
];

// Card dimensions (matching mobile app constants)
const CARD_WIDTH = 350;
const CARD_HEIGHT = 620;

// Convert values from editor (pixels) to backend values (percentages)
const convertToBackendValues = (elements: CardElement[]) => {
  return elements.map(el => {
    
    return {
      ...el,
      type: 'text' as const,
      fontStyleIndex: el.fontStyleIndex || 0,
      colorIndex: el.colorIndex || 0,
      scale: el.scale || 1,
      rotate: el.rotate || 0,
      bold: !!el.bold,
      italic: !!el.italic,
      alignment: el.alignment || 'center',
      lineHeight: el.lineHeight || 1,
      fontSize: el.fontSize || 5
    };
  });
};

export default function CardEditor({ 
  initialCard,
  onSave
}: { 
  initialCard?: CardData,
  onSave: (cardData: CardData) => void
}) {
  const [cardData, setCardData] = useState<CardData>(initialCard || {
    name: 'New Card',
    category_id: '',
    sub_category_id: '',
    elements: []
  });
  
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [history, setHistory] = useState<CardData[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: CARD_WIDTH, height: CARD_HEIGHT });
  
  useEffect(() => {
    if (containerRef.current) {
      setContainerSize({
        width: containerRef.current.offsetWidth,
        height: containerRef.current.offsetHeight
      });
    }
  }, []);

  useEffect(() => {
    if (initialCard?.background_image) {
      setBackgroundImage(initialCard.background_image);
    }
    
    // Add initial card state to history if it exists
    if (initialCard && initialCard.elements?.length > 0) {
      setHistory([initialCard]);
      setHistoryIndex(0);
    }
  }, [initialCard]);

  // History management
  const addToHistory = (newCardData: CardData) => {
    const newHistory = [...history.slice(0, historyIndex + 1), newCardData];
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setCardData(history[historyIndex - 1]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setCardData(history[historyIndex + 1]);
    }
  };

  // Element management
  const addElement = () => {
    const newElement: CardElement = {
      id: Date.now().toString(),
      type: 'text',
      text: 'New text',
      positionX: 0,
      positionY: 0,
      colorIndex: 0,
      fontStyleIndex: 0,
      bold: false,
      italic: false,
      scale: 1,
      rotate: 0, // 0 radians
      alignment: 'center',
      lineHeight: 1,
      fontSize: 5
    };
    
    const newCardData = {
      ...cardData,
      elements: [...cardData.elements, newElement]
    };
    
    setCardData(newCardData);
    addToHistory(newCardData);
    setSelectedElement(newElement.id);
  };

  const removeElement = (id: string) => {
    const newCardData = {
      ...cardData,
      elements: cardData.elements.filter(el => el.id !== id)
    };
    
    setCardData(newCardData);
    addToHistory(newCardData);
    setSelectedElement(null);
  };

  const updateElement = (id: string, updates: Partial<CardElement>) => {
    const newCardData = {
      ...cardData,
      elements: cardData.elements.map(el => {
        if (el.id !== id) return el;
        
        // Create the updated element
        const updatedElement = { ...el, ...updates };
        
        return updatedElement;
      })
    };
    
    setCardData(newCardData);
    addToHistory(newCardData);
  };

  const handleDragStop = (id: string, e: any, data: { x: number, y: number }) => {
    // Get the element being dragged
    const element = cardData.elements.find(el => el.id === id);
    if (!element) return;
    
    
    const posXPercent = Math.round((data.x / containerSize.width) * 100);
    const posYPercent = Math.round((data.y / containerSize.height) * 100);
    
    // Update position with percentages
    updateElement(id, {
      positionX: posXPercent,
      positionY: posYPercent
    });
  };

  // Image handling
  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif'],
    },
    onDrop: acceptedFiles => {
      const file = acceptedFiles[0];
      const reader = new FileReader();
      
      reader.onload = () => {
        setBackgroundImage(reader.result as string);
      };
      
      reader.readAsDataURL(file);
    }
  });

  // Save card data
  const handleSave = () => {
    if (!containerRef.current) return;
    
    const width = containerRef.current.offsetWidth;
    const height = containerRef.current.offsetHeight;
    
    const elementsForBackend = convertToBackendValues(cardData.elements);
    
    console.log("Preparing card data for save:", {
      ...cardData,
      elements: elementsForBackend,
      background_image: backgroundImage || undefined,
    });
    
    onSave({
      ...cardData,
      elements: elementsForBackend,
      background_image: backgroundImage || undefined,
    });
  };

  // Get selected element
  const getSelectedElementData = () => {
    return cardData.elements.find(el => el.id === selectedElement);
  };
  
  const selectedElementData = getSelectedElementData();
  {console.log('elements', cardData.elements)}

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between mb-4">
        <div className="flex space-x-2">
          <button 
            className="px-3 py-1 bg-gray-100 rounded flex items-center text-sm"
            onClick={handleUndo}
            disabled={historyIndex <= 0}
          >
            <ArrowUturnLeftIcon className="h-4 w-4 mr-1" />
            Undo
          </button>
          <button 
            className="px-3 py-1 bg-gray-100 rounded flex items-center text-sm"
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
          >
            <ArrowUturnRightIcon className="h-4 w-4 mr-1" />
            Redo
          </button>
          <button 
            className="px-3 py-1 bg-primary-100 text-primary-800 rounded flex items-center text-sm"
            onClick={addElement}
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            Add Text
          </button>
        </div>
        <button 
          className="px-4 py-1 bg-primary-600 text-white rounded flex items-center"
          onClick={handleSave}
        >
          <CheckIcon className="h-4 w-4 mr-1" />
          Save Card
        </button>
      </div>
      
      <div className="flex flex-grow">
        <div 
          ref={containerRef}
          className="border border-gray-300 rounded-lg relative overflow-hidden flex items-center justify-center"
          style={{ 
            backgroundImage: backgroundImage ? `url(${backgroundImage})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            width: CARD_WIDTH,
            height: CARD_HEIGHT
          }}
        >
          {!backgroundImage && (
            <div 
              {...getRootProps()} 
              className="absolute inset-0 flex items-center justify-center border-2 border-dashed border-gray-300 bg-gray-50 cursor-pointer"
            >
              <input {...getInputProps()} />
              <div className="text-center">
                <p className="text-sm text-gray-600">Drag and drop an image here, or click to select</p>
                <p className="text-xs text-gray-500 mt-1">Recommended size: 1080x1920 pixels</p>
              </div>
            </div>
          )}
          {cardData.elements.map((element) => (
            <Draggable
              key={element.id}
              defaultPosition={{ 
                x: ((element.positionX) / 100) * containerSize.width, 
                y: ((element.positionY) / 100) * containerSize.height
              }}
              onStop={(e, data) => handleDragStop(element.id, e, data)}
              bounds="parent"
            >
              <div 
                className={`absolute cursor-move ${selectedElement === element.id ? 'ring-2 ring-primary-500' : ''}`}
                onClick={() => setSelectedElement(element.id)}
              >
                <div
                  style={{
                    fontFamily: EDITOR_FONTS[element.fontStyleIndex]?.value || 'Arial',
                    fontSize: `${(element.fontSize / 100) * containerSize.width}px`,
                    color: editorColors[element.colorIndex] || '#000000',
                    fontWeight: element.bold ? 'bold' : 'normal',
                    fontStyle: element.italic ? 'italic' : 'normal',
                    textAlign: element.alignment,
                    padding: '5px',
                    minWidth: '50px',
                    lineHeight: element.lineHeight,
                    transform: `rotate(${element.rotate}rad)`,
                    whiteSpace: 'pre-wrap'
                  }}
                >
                  {element.text}
                </div>
                
                {selectedElement === element.id && (
                  <button
                    className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeElement(element.id);
                    }}
                  >
                    <TrashIcon className="h-3 w-3" />
                  </button>
                )}
              </div>
            </Draggable>
          ))}
        </div>
        
        <div className="w-80 border-l border-gray-200 p-4 overflow-y-auto">
          {selectedElementData ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Text
                </label>
                <textarea
                  value={selectedElementData.text}
                  onChange={(e) => updateElement(selectedElementData.id, { 
                    text: e.target.value
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Font Style
                </label>
                <select
                  value={selectedElementData.fontStyleIndex}
                  onChange={(e) => updateElement(selectedElementData.id, { fontStyleIndex: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                >
                  {EDITOR_FONTS.map((font, index) => (
                    <option key={index} value={index}>
                      {font.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Font Size
                </label>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={selectedElementData.fontSize}
                  onChange={(e) => updateElement(selectedElementData.id, { fontSize: parseInt(e.target.value) })}
                  className="w-full"
                />
                <div className="text-right text-sm text-gray-500">{selectedElementData.fontSize}%</div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Line Height
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="3"
                  step="0.1"
                  value={selectedElementData.lineHeight}
                  onChange={(e) => updateElement(selectedElementData.id, { lineHeight: parseFloat(e.target.value) })}
                  className="w-full"
                />
                <div className="text-right text-sm text-gray-500">{selectedElementData.lineHeight}</div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Style
                </label>
                <div className="flex space-x-2">
                  <button
                    className={`px-3 py-1 border ${selectedElementData.bold ? 'bg-primary-100 border-primary-300' : 'bg-white border-gray-300'} rounded-md font-bold`}
                    onClick={() => updateElement(selectedElementData.id, { bold: !selectedElementData.bold })}
                  >
                    B
                  </button>
                  <button
                    className={`px-3 py-1 border ${selectedElementData.italic ? 'bg-primary-100 border-primary-300' : 'bg-white border-gray-300'} rounded-md italic`}
                    onClick={() => updateElement(selectedElementData.id, { italic: !selectedElementData.italic })}
                  >
                    I
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Alignment
                </label>
                <div className="flex space-x-2">
                  <button
                    className={`px-3 py-1 border ${selectedElementData.alignment === 'left' ? 'bg-primary-100 border-primary-300' : 'bg-white border-gray-300'} rounded-md`}
                    onClick={() => updateElement(selectedElementData.id, { alignment: 'left' })}
                  >
                    L
                  </button>
                  <button
                    className={`px-3 py-1 border ${selectedElementData.alignment === 'center' ? 'bg-primary-100 border-primary-300' : 'bg-white border-gray-300'} rounded-md`}
                    onClick={() => updateElement(selectedElementData.id, { alignment: 'center' })}
                  >
                    C
                  </button>
                  <button
                    className={`px-3 py-1 border ${selectedElementData.alignment === 'right' ? 'bg-primary-100 border-primary-300' : 'bg-white border-gray-300'} rounded-md`}
                    onClick={() => updateElement(selectedElementData.id, { alignment: 'right' })}
                  >
                    R
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rotation
                </label>
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={Math.round(selectedElementData.rotate * (180 / Math.PI))} // Convert radians to degrees for display
                  onChange={(e) => updateElement(selectedElementData.id, { 
                    rotate: (parseInt(e.target.value) * Math.PI) / 180 // Convert degrees to radians for storage
                  })}
                  className="w-full"
                />
                <div className="text-right text-sm text-gray-500">
                  {Math.round(selectedElementData.rotate * (180 / Math.PI))}°
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Color
                </label>
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {editorColors.map((color, index) => (
                    <button
                      key={index}
                      onClick={() => updateElement(selectedElementData.id, { colorIndex: index })}
                      className={`w-8 h-8 rounded-full ${selectedElementData.colorIndex === index ? 'ring-2 ring-primary-500 ring-offset-2' : ''}`}
                      style={{ backgroundColor: color }}
                      aria-label={`Color ${index}`}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Position
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-500">X</label>
                    <input
                      type="number"
                      value={Math.round(selectedElementData.positionX)}
                      onChange={(e) => {
                        const newX = parseInt(e.target.value);
                        updateElement(selectedElementData.id, { 
                          positionX: newX
                        });
                      }}
                      className="w-full px-3 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500">Y</label>
                    <input
                      type="number"
                      value={Math.round(selectedElementData.positionY)}
                      onChange={(e) => {
                        const newY = parseInt(e.target.value);
                        updateElement(selectedElementData.id, { 
                          positionY: newY
                        });
                      }}
                      className="w-full px-3 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-gray-500 text-center p-8">
              Select an element to edit its properties
            </div>
          )}
        </div>
      </div>
    </div>
  );
}