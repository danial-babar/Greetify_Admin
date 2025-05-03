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
  translateX?: number;
  translateY?: number;
  colorIndex: number;
  fontStyleIndex: number;
  bold: boolean;
  italic?: boolean;
  scale: number;
  rotate: number;
  alignment: 'left' | 'center' | 'right';
  centerX?: number;
  centerY?: number;
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
const convertToBackendValues = (elements: CardElement[], containerWidth: number, containerHeight: number) => {
  return elements.map(el => {
    // Calculate percentages correctly for mobile app positioning
    // Mobile app uses percentages for layout, but needs exact positions
    const posXPercent = Math.round((el.positionX / containerWidth) * 100);
    const posYPercent = Math.round((el.positionY / containerHeight) * 100);
    
    // Instead of calculating an offset, we'll use the exact position for centerX/Y
    // This ensures the text appears at the exact same position in the mobile app
    const centerX = el.positionX;
    const centerY = el.positionY;
    
    return {
      ...el,
      // Store position in percentages as the mobile app expects
      positionX: posXPercent,
      positionY: posYPercent,
      // Store exact pixel coordinates to ensure precise positioning
      translateX: el.positionX,
      translateY: el.positionY,
      // For mobile app, use the exact position as center points
      centerX: Math.round(centerX),
      centerY: Math.round(centerY),
      // Ensure all required properties are included
      type: 'text' as const,
      fontStyleIndex: el.fontStyleIndex || 0,
      colorIndex: el.colorIndex || 0,
      scale: el.scale || 1,
      rotate: el.rotate || 0,
      bold: !!el.bold,
      italic: !!el.italic,
      alignment: el.alignment || 'center'
    };
  });
};

// Convert values from backend (percentages) to editor values (pixels)
const convertFromBackendValues = (elements: CardElement[], containerWidth: number, containerHeight: number) => {
  return elements.map(el => {
    // For most accurate positioning, use translateX/Y when available
    // as they contain the exact pixel positions from the editor
    let posX, posY;
    
    if (el.translateX !== undefined && el.translateY !== undefined) {
      // Use the absolute pixel values if available
      posX = el.translateX;
      posY = el.translateY;
    } else if (el.centerX !== undefined && el.centerY !== undefined) {
      // If translateX/Y not available but centerX/Y is, use that
      posX = el.centerX;
      posY = el.centerY;
    } else {
      // Fall back to calculating from percentages
      posX = (el.positionX / 100) * containerWidth;
      posY = (el.positionY / 100) * containerHeight;
    }
    
    // Ensure all properties are properly set with consistent positioning
    return {
      ...el,
      id: el.id || Date.now().toString(),
      type: 'text' as const,
      text: el.text || '',
      positionX: typeof posX === 'number' ? posX : 0,
      positionY: typeof posY === 'number' ? posY : 0,
      translateX: typeof posX === 'number' ? posX : 0,
      translateY: typeof posY === 'number' ? posY : 0,
      centerX: typeof posX === 'number' ? posX : 0,
      centerY: typeof posY === 'number' ? posY : 0,
      fontStyleIndex: el.fontStyleIndex || 0,
      colorIndex: el.colorIndex || 0,
      scale: el.scale || 1,
      rotate: el.rotate || 0,
      bold: !!el.bold,
      italic: !!el.italic,
      alignment: el.alignment || 'center'
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
    // Calculate the center of the container
    const centerPositionX = containerSize.width / 2;
    const centerPositionY = containerSize.height / 2;
    
    const newElement: CardElement = {
      id: Date.now().toString(),
      type: 'text',
      text: 'New Text',
      // Position text in the center of the card
      positionX: centerPositionX,
      positionY: centerPositionY,
      // Use the same positions for all positioning properties to ensure consistency
      translateX: centerPositionX,
      translateY: centerPositionY,
      centerX: centerPositionX,
      centerY: centerPositionY,
      // Visual properties
      colorIndex: 0, // Black by default
      fontStyleIndex: 0, // First font by default
      bold: false,
      italic: false,
      scale: 1,
      rotate: 0,
      alignment: 'center'
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
      elements: cardData.elements.map(el => 
        el.id === id ? { ...el, ...updates } : el
      )
    };
    
    setCardData(newCardData);
    addToHistory(newCardData);
  };

  const handleDragStop = (id: string, e: any, data: { x: number, y: number }) => {
    // When dragging stops, update all position-related properties together
    updateElement(id, {
      positionX: data.x,
      positionY: data.y,
      // Ensure translateX/Y and centerX/Y match exactly to maintain positioning consistency
      translateX: data.x,
      translateY: data.y,
      centerX: data.x,
      centerY: data.y
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
    
    const elementsForBackend = convertToBackendValues(cardData.elements, width, height);
    
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
          className="border border-gray-300 rounded-lg relative overflow-hidden"
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
              defaultPosition={{ x: element.positionX, y: element.positionY }}
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
                    fontSize: `${element.scale * 16}px`,
                    color: editorColors[element.colorIndex] || '#000000',
                    fontWeight: element.bold ? 'bold' : 'normal',
                    fontStyle: element.italic ? 'italic' : 'normal',
                    textAlign: element.alignment,
                    transform: `rotate(${element.rotate}deg)`,
                    padding: '5px',
                    minWidth: '50px',
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
        
        <div className="w-1/3 ml-4 border border-gray-200 rounded-lg p-4 bg-white overflow-y-auto">
          <h3 className="font-medium text-lg mb-4">Element Properties</h3>
          
          {selectedElementData ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Text Content
                </label>
                <input
                  type="text"
                  value={selectedElementData.text}
                  onChange={(e) => updateElement(selectedElementData.id, { text: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Font Family
                </label>
                <select
                  value={selectedElementData.fontStyleIndex}
                  onChange={(e) => updateElement(selectedElementData.id, { fontStyleIndex: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                >
                  {EDITOR_FONTS.map((font, index) => (
                    <option key={font.value} value={index}>{font.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Scale (Font Size)
                </label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  step="0.1"
                  value={selectedElementData.scale}
                  onChange={(e) => updateElement(selectedElementData.id, { scale: parseFloat(e.target.value) })}
                  className="w-full"
                />
                <div className="text-right text-sm text-gray-500">{Math.round(selectedElementData.scale * 16)}px</div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Style
                  </label>
                  <div className="flex space-x-2">
                    <button
                      className={`px-3 py-1 border ${selectedElementData.bold ? 'bg-primary-100 border-primary-300' : 'bg-white border-gray-300'} rounded-md`}
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
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rotation
                </label>
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={selectedElementData.rotate}
                  onChange={(e) => updateElement(selectedElementData.id, { rotate: parseInt(e.target.value) })}
                  className="w-full"
                />
                <div className="text-right text-sm text-gray-500">{selectedElementData.rotate}°</div>
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
                          positionX: newX,
                          translateX: newX,
                          centerX: newX
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
                          positionY: newY,
                          translateY: newY,
                          centerY: newY
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