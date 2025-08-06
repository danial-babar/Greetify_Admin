import { useState, useRef, useEffect } from "react";
import Draggable from "react-draggable";
import { useDropzone } from "react-dropzone";
import { HexAlphaColorPicker } from "react-colorful";
import {
  TrashIcon,
  PlusIcon,
  ArrowUturnLeftIcon,
  ArrowUturnRightIcon,
  CheckIcon,
  SwatchIcon,
} from "@heroicons/react/24/outline";
import { colorAPI, Color, CardElement, Card } from "@/services/api";
// @ts-ignore
import html2canvas from "html2canvas";

export type UpdatedCardData = Omit<
  Card,
  "background_image" | "preview_image"
> & {
  background_image?: File;
  preview_image?: File;
};

// Match exact with mobile app
const EDITOR_FONTS = [
  { name: "Poppins", regular: "Poppins-Regular", bold: "Poppins-Bold" },
  { name: "Roboto", regular: "Roboto-Regular", bold: "Roboto-Bold" },
  { name: "Amatic SC", regular: "AmaticSC-Regular", bold: "AmaticSC-Bold" },
  { name: "Caveat", regular: "Caveat-Regular", bold: "Caveat-Bold" },
  { name: "GreatVibes", regular: "GreatVibes-Regular", bold: null },
  { name: "Allura", regular: "Allura-Regular", bold: null },
  { name: "Freehand", regular: "Freehand-Regular", bold: null },
  { name: "Fuggles", regular: "Fuggles-Regular", bold: null },
  { name: "Parisienne", regular: "Parisienne-Regular", bold: null },
  { name: "AlexBrush", regular: "AlexBrush-Regular", bold: null },
  { name: "Caprasimo", regular: "Caprasimo-Regular", bold: null },
  { name: "Kalam", regular: "Kalam-Regular", bold: "Kalam-Bold" },
  {
    name: "Belanosima",
    regular: "Belanosima-Regular",
    bold: "Belanosima-Regular",
  },
  { name: "Oswald", regular: "Oswald-Regular", bold: "Oswald-Bold" },
  { name: "Zendots", regular: "Zendots-Regular", bold: null },
  { name: "Syne", regular: "Syne-Regular", bold: "Syne-Bold" },
  { name: "Sora", regular: "Sora-Regular", bold: "Sora-Bold" },
  { name: "Satisfy", regular: "Satisfy-Regular", bold: null },
  { name: "Mulish", regular: "Mulish-Regular", bold: "Mulish-Bold" },
  { name: "Montserrat", regular: "Montserrat-Regular", bold: "Montserrat-Bold" },
];

const CENTER_THRESHOLD = 6;

// Card dimensions (matching mobile app constants)
const ASPECT_RATIO = 4 / 3;
const CARD_WIDTH = 450;
const CARD_HEIGHT = CARD_WIDTH * ASPECT_RATIO;

// Convert values from editor (pixels) to backend values (percentages)
const convertToBackendValues = (elements: CardElement[]) => {
  return elements.map((el) => {
    return {
      ...el,
      type: "text" as const,
      fontStyleIndex: el.fontStyleIndex || 0,
      color: el.color || "#000000",
      scale: el.scale || 1,
      rotate: el.rotate || 0,
      bold: !!el.bold,
      italic: !!el.italic,
      alignment: el.alignment || "center",
      lineHeight: el.lineHeight || 1,
      fontSize: el.fontSize || 5,
    };
  });
};

export default function CardEditor({
  initialData,
  onSave,
}: {
  initialData?: Card;
  onSave: (cardData: UpdatedCardData) => Promise<void>;
}) {
  const [cardData, setCardData] = useState<Card>(
    initialData || {
      name: "New Card",
      category_id: "",
      sub_category_id: "",
      elements: [],
    }
  );

  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [history, setHistory] = useState<Card[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [backgroundImage, setBackgroundImage] = useState<File>();

  const containerRef = useRef<HTMLDivElement>(null);
  const colorInputRef = useRef<HTMLInputElement>(null);
  const [containerSize, setContainerSize] = useState({
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    aspectRatio: ASPECT_RATIO,
  });

  const [showColorPicker, setShowColorPicker] = useState(false);

  const [colorsList, setColorsList] = useState<string[]>([]);

  const [showHorAlignLine, setShowHorAlignLine] = useState(false);
  const [showVerAlignLine, setShowVerAlignLine] = useState(false);

  // useEffect(() => {
  //   if (containerRef.current) {
  //     setContainerSize({
  //       width: containerRef.current.offsetWidth,
  //       height: containerRef.current.offsetHeight,
  //     });
  //   }
  // }, []);

  useEffect(() => {
    // Add initial card state to history if it exists
    if (initialData) {
      if (initialData.elements?.length > 0) {
        setHistory([initialData]);
        setHistoryIndex(0);
      }
      setCardData(initialData);
    }
  }, [initialData]);

  useEffect(() => {
    colorAPI.getAll().then((data) => {
      let arr: Color[] = [];
      if (Array.isArray(data)) arr = data;
      else if (Array.isArray(data?.data)) arr = data.data;
      setColorsList(arr.map((c) => c.color));
    });
  }, []);

  // History management
  const addToHistory = (newCardData: Card) => {
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
      type: "text",
      text: "New text",
      positionX: 0,
      positionY: 0,
      color: "#000000FF",
      fontStyleIndex: 0,
      bold: false,
      italic: false,
      scale: 1,
      rotate: 0, // 0 radians
      alignment: "center",
      lineHeight: 1,
      fontSize: 5,
    };

    const newCardData = {
      ...cardData,
      elements: [...cardData.elements, newElement],
    };

    setCardData(newCardData);
    addToHistory(newCardData);
    setSelectedElement(newElement.id);
  };

  const removeElement = (id: string) => {
    const newCardData = {
      ...cardData,
      elements: cardData.elements.filter((el) => el.id !== id),
    };

    setCardData(newCardData);
    addToHistory(newCardData);
    setSelectedElement(null);
  };

  const updateElement = (id: string, updates: Partial<CardElement>) => {
    const newCardData = {
      ...cardData,
      elements: cardData.elements.map((el) => {
        if (el.id !== id) return el;

        // Create the updated element
        const updatedElement = { ...el, ...updates };

        return updatedElement;
      }),
    };

    setCardData(newCardData);
    addToHistory(newCardData);
  };

  const handleDrag = (e: any, data: { x: number; y: number }) => {
    const { x, y } = data;
    if (Math.abs(x) <= CENTER_THRESHOLD) setShowVerAlignLine(true);
    else setShowVerAlignLine(false);
    if (Math.abs(y) <= CENTER_THRESHOLD) setShowHorAlignLine(true);
    else setShowHorAlignLine(false);
  };

  const handleDragStop = (
    id: string,
    e: any,
    data: { x: number; y: number }
  ) => {
    setShowHorAlignLine(false);
    setShowVerAlignLine(false);
    const element = cardData.elements.find((el) => el.id === id);
    if (!element) return;

    let { x, y } = data;

    const { width, height } = containerSize;

    // Snap to center or edges
    if (Math.abs(x) <= CENTER_THRESHOLD) x = 0;
    if (Math.abs(y) <= CENTER_THRESHOLD) y = 0;

    const posXPercent = Math.round((x / width) * 100);
    const posYPercent = Math.round((y / height) * 100);

    updateElement(id, {
      positionX: posXPercent,
      positionY: posYPercent,
    });
  };
  // Image handling
  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".gif"],
    },
    onDrop: (acceptedFiles) => {
      const file = acceptedFiles[0];
      setBackgroundImage(file);
    },
  });

  // Inject font-face declarations
  useEffect(() => {
    const fontFaceStyles = EDITOR_FONTS.map((font) => {
      const styles = [];

      // Regular font
      styles.push(`
        @font-face {
          font-family: '${font.regular}';
          src: url('/fonts/${font.regular}.ttf') format('truetype');
          font-weight: normal;
          font-style: normal;
          font-display: swap;
        }
      `);

      // Bold font if available
      if (font.bold) {
        styles.push(`
          @font-face {
            font-family: '${font.bold}';
            src: url('/fonts/${font.bold}.ttf') format('truetype');
            font-weight: bold;
            font-style: normal;
            font-display: swap;
          }
        `);
      }

      return styles.join("\n");
    }).join("\n");

    const styleElement = document.createElement("style");
    styleElement.textContent = fontFaceStyles;
    document.head.appendChild(styleElement);

    // Cleanup function
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []); // Empty dependency array means this runs once on mount

  useEffect(() => {
    if (backgroundImage) {
      const img = new window.Image();
      img.onload = () => {
        const aspect = img.height / img.width;
        setContainerSize({
          width: CARD_WIDTH,
          height: Math.round(CARD_WIDTH * aspect),
          aspectRatio: aspect,
        });
      };
      img.src = URL.createObjectURL(backgroundImage);
      // Clean up the object URL after image loads
      return () => URL.revokeObjectURL(img.src);
    }
  }, [backgroundImage]);

  // When cardData.background_image changes (for edit mode), update height if it's an image URL
  useEffect(() => {
    if (
      cardData.background_image &&
      typeof cardData.background_image === "string"
    ) {
      const img = new window.Image();
      img.onload = () => {
        const aspect = img.height / img.width;
        setContainerSize({
          width: CARD_WIDTH,
          height: Math.round(CARD_WIDTH * aspect),
          aspectRatio: aspect,
        });
      };
      img.src = cardData.background_image;
    }
  }, [cardData.background_image]);

  // Save card data
  const handleSave = async () => {
    if (!containerRef.current) return;
    setSelectedElement(null);
    const elementsForBackend = convertToBackendValues(cardData.elements);

    let previewImage: File | undefined = undefined;
    const dropzone = containerRef.current.querySelector(
      "[data-dropzone]"
    ) as HTMLElement;
    let prevDropzoneDisplay = "";
    if (dropzone) {
      prevDropzoneDisplay = dropzone.style.display;
      dropzone.style.display = "none";
    }
    await new Promise((r) => setTimeout(r, 50));
    const canvas = await html2canvas(containerRef.current, {
      backgroundColor: null,
      useCORS: true,
      scale: 0.5,
    });
    if (dropzone) dropzone.style.display = prevDropzoneDisplay;
    previewImage = await new Promise<File | undefined>((resolve) => {
      canvas.toBlob(
        (blob: Blob | null) => {
          if (!blob) return resolve(undefined);
          const file = new File([blob], "preview.png", { type: "image/png" });
          console.log("file", file);
          resolve(file);
        },
        "image/png",
        0.3
      );
    });

    onSave({
      ...cardData,
      elements: elementsForBackend,
      background_image: backgroundImage || undefined,
      preview_image: previewImage || undefined,
      aspect_ratio: containerSize.aspectRatio,
    });
  };

  // Get selected element
  const getSelectedElementData = () => {
    return cardData.elements.find((el) => el.id === selectedElement);
  };

  const selectedElementData = getSelectedElementData();

  const [fontDropdownOpen, setFontDropdownOpen] = useState(false);

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
          className="relative overflow-hidden flex items-center justify-center"
          style={{
            backgroundImage: backgroundImage
              ? `url(${URL.createObjectURL(backgroundImage)})`
              : cardData.background_image
              ? `url(${cardData.background_image})`
              : "none",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            width: containerSize.width,
            height: containerSize.height,
          }}
        >
          {/* Alignment lines */}
          {showHorAlignLine && (
            <div
              className="absolute left-0 right-0 h-px"
              style={{
                top: `${containerSize.height / 2}px`,
                backgroundColor: "rgba(255, 255, 255, 0.7)",
              }}
            />
          )}
          {showVerAlignLine && (
            <div
              className="absolute top-0 bottom-0 w-px"
              style={{
                left: `${containerSize.width / 2}px`,
                backgroundColor: "rgba(255, 255, 255, 0.7)",
              }}
            />
          )}
          <div
            {...getRootProps()}
            data-dropzone
            className="absolute inset-0 flex items-center justify-center border-2 border-dashed border-gray-300 bg-gray-50 cursor-pointer"
            style={{
              opacity: backgroundImage || cardData.background_image ? 0 : 1,
              borderStyle: "none",
            }}
          >
            <input {...getInputProps()} />
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Drag and drop an image here, or click to select
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Image will be stretched to fit card dimensions
              </p>
            </div>
          </div>
          {cardData.elements.map((element) => (
            <Draggable
              key={element.id}
              position={{
                x: (element.positionX / 100) * containerSize.width,
                y: (element.positionY / 100) * containerSize.height,
              }}
              onDrag={handleDrag}
              onStop={(e, data) => handleDragStop(element.id, e, data)}
              bounds="parent"
            >
              <div
                className={`absolute cursor-move ${
                  selectedElement === element.id
                    ? "ring-2 ring-primary-500"
                    : ""
                }`}
                onClick={() => setSelectedElement(element.id)}
              >
                <div
                  style={{
                    fontFamily:
                      element.bold && EDITOR_FONTS[element.fontStyleIndex]?.bold
                        ? EDITOR_FONTS[element.fontStyleIndex].bold!
                        : EDITOR_FONTS[element.fontStyleIndex]?.regular ||
                          "Arial",
                    fontSize: `${
                      (element.fontSize / 100) * containerSize.width
                    }px`,
                    color: element.color,
                    // fontWeight: element.bold && !EDITOR_FONTS[element.fontStyleIndex]?.bold ? 'bold' : 'normal',
                    // fontStyle: element.italic ? 'italic' : 'normal',
                    textAlign: element.alignment,
                    padding: "5px",
                    minWidth: "50px",
                    lineHeight: element.lineHeight,
                    transform: `rotate(${element.rotate}rad)`,
                    whiteSpace: "pre-wrap",
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

        <div className="w-80 border-gray-200 p-4 overflow-y-auto">
          {selectedElementData ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Text
                </label>
                <textarea
                  value={selectedElementData.text}
                  onChange={(e) =>
                    updateElement(selectedElementData.id, {
                      text: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Font Style
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setFontDropdownOpen(!fontDropdownOpen)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-left flex justify-between items-center"
                    style={{
                      fontFamily: `"${
                        EDITOR_FONTS[selectedElementData.fontStyleIndex].regular
                      }", sans-serif`,
                    }}
                  >
                    {EDITOR_FONTS[selectedElementData.fontStyleIndex].name}
                    <svg
                      className="h-5 w-5 text-gray-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>

                  {fontDropdownOpen && (
                    <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                      {EDITOR_FONTS.map((font, index) => (
                        <div
                          key={index}
                          className={`cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-primary-50 ${
                            selectedElementData.fontStyleIndex === index
                              ? "bg-primary-100"
                              : ""
                          }`}
                          onClick={() => {
                            updateElement(selectedElementData.id, {
                              fontStyleIndex: index,
                            });
                            setFontDropdownOpen(false);
                          }}
                          style={{
                            fontFamily: `"${font.regular}", sans-serif`,
                            fontSize: "16px",
                          }}
                        >
                          {font.name}
                          {selectedElementData.fontStyleIndex === index && (
                            <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-primary-600">
                              <svg
                                className="h-5 w-5"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Font Size
                </label>
                <input
                  type="range"
                  min="1"
                  max="100"
                  step={1}
                  value={selectedElementData.fontSize}
                  onChange={(e) =>
                    updateElement(selectedElementData.id, {
                      fontSize: parseInt(e.target.value),
                    })
                  }
                  className="w-full"
                />
                <div className="text-right text-sm text-gray-500">
                  {selectedElementData.fontSize}%
                </div>
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
                  onChange={(e) =>
                    updateElement(selectedElementData.id, {
                      lineHeight: parseFloat(e.target.value),
                    })
                  }
                  className="w-full"
                />
                <div className="text-right text-sm text-gray-500">
                  {selectedElementData.lineHeight}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Style
                </label>
                <div className="flex space-x-2">
                  <button
                    className={`px-3 py-1 border ${
                      selectedElementData.bold &&
                      EDITOR_FONTS[selectedElementData.fontStyleIndex]?.bold
                        ? "bg-primary-100 border-primary-300"
                        : "bg-white border-gray-300"
                    } rounded-md font-bold ${
                      !EDITOR_FONTS[selectedElementData.fontStyleIndex]?.bold
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    }`}
                    onClick={() => {
                      if (
                        EDITOR_FONTS[selectedElementData.fontStyleIndex]?.bold
                      ) {
                        updateElement(selectedElementData.id, {
                          bold: !selectedElementData.bold,
                        });
                      }
                    }}
                    disabled={
                      !EDITOR_FONTS[selectedElementData.fontStyleIndex]?.bold
                    }
                    title={
                      !EDITOR_FONTS[selectedElementData.fontStyleIndex]?.bold
                        ? "Bold not available for this font"
                        : "Toggle bold"
                    }
                  >
                    B
                  </button>
                  {/* <button
                    className={`px-3 py-1 border ${selectedElementData.italic ? 'bg-primary-100 border-primary-300' : 'bg-white border-gray-300'} rounded-md italic`}
                    onClick={() => updateElement(selectedElementData.id, { italic: !selectedElementData.italic })}
                  >
                    I
                  </button> */}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Alignment
                </label>
                <div className="flex space-x-2">
                  <button
                    className={`px-3 py-1 border ${
                      selectedElementData.alignment === "left"
                        ? "bg-primary-100 border-primary-300"
                        : "bg-white border-gray-300"
                    } rounded-md`}
                    onClick={() =>
                      updateElement(selectedElementData.id, {
                        alignment: "left",
                      })
                    }
                  >
                    L
                  </button>
                  <button
                    className={`px-3 py-1 border ${
                      selectedElementData.alignment === "center"
                        ? "bg-primary-100 border-primary-300"
                        : "bg-white border-gray-300"
                    } rounded-md`}
                    onClick={() =>
                      updateElement(selectedElementData.id, {
                        alignment: "center",
                      })
                    }
                  >
                    C
                  </button>
                  <button
                    className={`px-3 py-1 border ${
                      selectedElementData.alignment === "right"
                        ? "bg-primary-100 border-primary-300"
                        : "bg-white border-gray-300"
                    } rounded-md`}
                    onClick={() =>
                      updateElement(selectedElementData.id, {
                        alignment: "right",
                      })
                    }
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
                  value={Math.round(
                    selectedElementData.rotate * (180 / Math.PI)
                  )} // Convert radians to degrees for display
                  onChange={(e) =>
                    updateElement(selectedElementData.id, {
                      rotate: (parseInt(e.target.value) * Math.PI) / 180, // Convert degrees to radians for storage
                    })
                  }
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
                  {/* Multiple color icon at first index */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowColorPicker((v) => !v)}
                      className={`w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center cursor-pointer ${
                        !colorsList.includes(selectedElementData.color)
                          ? "ring-2 ring-primary-500 ring-offset-2"
                          : ""
                      }`}
                      style={{
                        background:
                          "conic-gradient(red, yellow, lime, cyan, blue, magenta, red)",
                      }}
                      title="Custom color"
                    ></button>
                    {showColorPicker && (
                      <div className="absolute z-50 mt-2 p-3 bg-white border border-gray-300 rounded-lg shadow-lg left-10">
                        <HexAlphaColorPicker
                          color={selectedElementData.color}
                          onChange={(color) =>
                            updateElement(selectedElementData.id, { color })
                          }
                        />
                        <input
                          type="text"
                          className="mt-2 w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                          value={selectedElementData.color}
                          onChange={(e) => {
                            const val = e.target.value;
                            // Accept hex with or without #, and with alpha
                            if (
                              /^#?[0-9A-Fa-f]{6,8}$/.test(val.replace("#", ""))
                            ) {
                              updateElement(selectedElementData.id, {
                                color: val.startsWith("#") ? val : `#${val}`,
                              });
                            } else {
                              updateElement(selectedElementData.id, {
                                color: val,
                              });
                            }
                          }}
                          placeholder="#RRGGBB or #RRGGBBAA"
                          maxLength={9}
                        />
                        <div className="flex justify-end mt-2">
                          <button
                            type="button"
                            className="px-2 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
                            onClick={() => setShowColorPicker(false)}
                          >
                            Done
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Regular color palette */}
                  {colorsList.map((color, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        updateElement(selectedElementData.id, {
                          color: color,
                        });
                      }}
                      className={`w-8 h-8 rounded-full border border-gray-300 ${
                        selectedElementData.color === color
                          ? "ring-2 ring-primary-500 ring-offset-2"
                          : ""
                      }`}
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
