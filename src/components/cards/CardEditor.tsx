import { useState, useRef, useEffect, useMemo } from "react";
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
  ArrowPathIcon,
  Bars3BottomLeftIcon,
  Bars3Icon,
  Bars3BottomRightIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import { colorAPI, Color, CardElement, Card, ShapeType } from "@/services/api";
import EyedropperButton from "@/components/ui/EyedropperButton";
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

// Alignment icons (design-tool style: bold line + bars)
const AlignLeftIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="inline-block">
    <rect x="2" y="6" width="3" height="12" rx="0.5" />
    <rect x="7" y="7" width="10" height="2" rx="0.5" />
    <rect x="7" y="12" width="14" height="2" rx="0.5" />
  </svg>
);
const AlignCenterHIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="inline-block">
    <rect x="10.5" y="4" width="3" height="16" rx="0.5" />
    <rect x="4" y="7" width="6" height="2" rx="0.5" />
    <rect x="14" y="7" width="6" height="2" rx="0.5" />
    <rect x="2" y="12" width="8" height="2" rx="0.5" />
    <rect x="14" y="12" width="8" height="2" rx="0.5" />
  </svg>
);
const AlignRightIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="inline-block">
    <rect x="19" y="6" width="3" height="12" rx="0.5" />
    <rect x="4" y="7" width="10" height="2" rx="0.5" />
    <rect x="3" y="12" width="14" height="2" rx="0.5" />
  </svg>
);
const AlignTopIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="inline-block">
    <rect x="6" y="2" width="12" height="3" rx="0.5" />
    <rect x="7" y="7" width="2" height="12" rx="0.5" />
    <rect x="12" y="7" width="2" height="10" rx="0.5" />
    <rect x="17" y="7" width="2" height="12" rx="0.5" />
  </svg>
);
const AlignCenterVIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="inline-block">
    <rect x="6" y="10.5" width="12" height="3" rx="0.5" />
    <rect x="7" y="4" width="2" height="6" rx="0.5" />
    <rect x="12" y="6" width="2" height="6" rx="0.5" />
    <rect x="17" y="4" width="2" height="6" rx="0.5" />
    <rect x="7" y="14" width="2" height="6" rx="0.5" />
    <rect x="12" y="12" width="2" height="6" rx="0.5" />
    <rect x="17" y="14" width="2" height="6" rx="0.5" />
  </svg>
);
const AlignBottomIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="inline-block">
    <rect x="6" y="19" width="12" height="3" rx="0.5" />
    <rect x="7" y="5" width="2" height="12" rx="0.5" />
    <rect x="12" y="7" width="2" height="10" rx="0.5" />
    <rect x="17" y="5" width="2" height="12" rx="0.5" />
  </svg>
);

// Card dimensions (matching mobile app constants)
const ASPECT_RATIO = 4 / 3;
const CARD_WIDTH = 450;
const CARD_HEIGHT = CARD_WIDTH * ASPECT_RATIO;

// Convert text elements for backend (fontSize px → %). Only call with text elements; shapes are not sent.
const convertToBackendValues = (textElements: CardElement[], artboardWidth: number): CardElement[] => {
  return textElements.map((el) => {
    const fontSizePx = typeof el.fontSize === "number" ? el.fontSize : 14;
    const fontSizePct = artboardWidth > 0 ? (fontSizePx / artboardWidth) * 100 : 5;
    return {
      ...el,
      type: "text" as const,
      fontStyleIndex: el.fontStyleIndex ?? 0,
      color: el.color || "#000000",
      scale: el.scale ?? 1,
      rotate: el.rotate ?? 0,
      bold: !!el.bold,
      italic: !!el.italic,
      alignment: el.alignment || "center",
      lineHeight: typeof el.lineHeight === "number" ? el.lineHeight : 1,
      fontSize: Math.round(fontSizePct * 100) / 100,
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

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [alignMode, setAlignMode] = useState<"artboard" | "selection">("artboard");
  const [history, setHistory] = useState<Card[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [backgroundImage, setBackgroundImage] = useState<File>();
  const [saving, setSaving] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const colorInputRef = useRef<HTMLInputElement>(null);
  const elementRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const elementInnerRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [containerSize, setContainerSize] = useState({
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    aspectRatio: ASPECT_RATIO,
  });

  const [showColorPicker, setShowColorPicker] = useState(false);

  const [colorsList, setColorsList] = useState<string[]>([]);

  const [showHorAlignLine, setShowHorAlignLine] = useState(false);
  const [showVerAlignLine, setShowVerAlignLine] = useState(false);

  const resizingRef = useRef<{
    id: string;
    handle: string;
    startX: number;
    startY: number;
    startWidth: number;
    startHeight: number;
    startPosX: number;
    startPosY: number;
  } | null>(null);

  const [resizing, setResizing] = useState(false);
  const MIN_TEXT_BOX_PCT = 5;
  const cardDataRef = useRef(cardData);
  cardDataRef.current = cardData;

  // useEffect(() => {
  //   if (containerRef.current) {
  //     setContainerSize({
  //       width: containerRef.current.offsetWidth,
  //       height: containerRef.current.offsetHeight,
  //     });
  //   }
  // }, []);

  useEffect(() => {
    // Add initial card state to history and normalize text fontSize (% → px) for existing cards
    if (initialData) {
      const normalized = initialData.elements?.length
        ? {
            ...initialData,
            elements: initialData.elements.map((el) => {
              if (el.type === "text" || el.type === undefined) {
                const f = el.fontSize ?? 5;
                const fontSizePx = f <= 100 ? Math.round((f / 100) * CARD_WIDTH) : f;
                const width = el.width ?? 80;
                const height = el.height ?? 15;
                return { ...el, fontSize: fontSizePx, width, height };
              }
              return el;
            }),
          }
        : initialData;
      if (initialData.elements?.length > 0) {
        setHistory([normalized]);
        setHistoryIndex(0);
      }
      setCardData(normalized);
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

  useEffect(() => {
    if (selectedIds.size === 0) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const step = e.shiftKey ? 5 : 1;
      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault();
          nudgeElement(-step, 0);
          break;
        case "ArrowRight":
          e.preventDefault();
          nudgeElement(step, 0);
          break;
        case "ArrowUp":
          e.preventDefault();
          nudgeElement(0, -step);
          break;
        case "ArrowDown":
          e.preventDefault();
          nudgeElement(0, step);
          break;
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedIds.size, cardData.elements]);

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
      positionX: 10,
      positionY: 10,
      color: "#000000FF",
      fontStyleIndex: 0,
      bold: false,
      italic: false,
      scale: 1,
      rotate: 0,
      alignment: "center",
      lineHeight: 1,
      fontSize: 14,
      width: 22,
      height: 4,
    };

    const newCardData = {
      ...cardData,
      elements: [...cardData.elements, newElement],
    };

    setCardData(newCardData);
    addToHistory(newCardData);
    setSelectedIds(new Set([newElement.id]));
  };

  const defaultShapeSize = { w: 15, h: 10 };

  const addShape = (shapeType: ShapeType) => {
    const baseId = Date.now().toString();
    const cw = containerSize.width;
    const ch = containerSize.height;
    const centerX = 50 - defaultShapeSize.w / 2;
    const centerY = 50 - defaultShapeSize.h / 2;

    let newElement: CardElement;

    if (shapeType === "line") {
      const len = 20;
      newElement = {
        id: baseId,
        type: "line",
        positionX: 50 - len / 2,
        positionY: 50,
        positionX2: 50 + len / 2,
        positionY2: 50,
        color: "#000000FF",
        strokeWidth: 2,
      };
    } else if (shapeType === "rect-fill" || shapeType === "rect-border") {
      newElement = {
        id: baseId,
        type: shapeType,
        positionX: centerX,
        positionY: centerY,
        width: defaultShapeSize.w,
        height: defaultShapeSize.h,
        color: "#000000FF",
        strokeWidth: shapeType === "rect-border" ? 2 : undefined,
      };
    } else {
      newElement = {
        id: baseId,
        type: shapeType,
        positionX: centerX,
        positionY: centerY,
        width: defaultShapeSize.w,
        height: defaultShapeSize.h,
        color: "#000000FF",
        strokeWidth: shapeType === "circle-border" ? 2 : undefined,
      };
    }

    const newCardData = {
      ...cardData,
      elements: [...cardData.elements, newElement],
    };
    setCardData(newCardData);
    addToHistory(newCardData);
    setSelectedIds(new Set([newElement.id]));
  };

  const removeElement = (id: string) => {
    const newCardData = {
      ...cardData,
      elements: cardData.elements.filter((el) => el.id !== id),
    };

    setCardData(newCardData);
    addToHistory(newCardData);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const removeSelectedElements = () => {
    if (selectedIds.size === 0) return;
    const newCardData = {
      ...cardData,
      elements: cardData.elements.filter((el) => !selectedIds.has(el.id)),
    };
    setCardData(newCardData);
    addToHistory(newCardData);
    setSelectedIds(new Set());
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

  const updateElementsBatch = (
    updatesById: Array<{ id: string; updates: Partial<CardElement> }>
  ) => {
    if (updatesById.length === 0) return;
    const idSet = new Set(updatesById.map((u) => u.id));
    const newCardData = {
      ...cardData,
      elements: cardData.elements.map((el) => {
        if (!idSet.has(el.id)) return el;
        const pair = updatesById.find((u) => u.id === el.id);
        return pair ? { ...el, ...pair.updates } : el;
      }),
    };
    setCardData(newCardData);
    addToHistory(newCardData);
  };

  type AlignToCanvasOption =
    | "left"
    | "right"
    | "top"
    | "bottom"
    | "center-h"
    | "center-v"
    | "center";

  const alignToCanvas = (option: AlignToCanvasOption) => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0 || !containerRef.current) return;

    const cw = containerSize.width;
    const ch = containerSize.height;

    const run = () => {
      const updatesById: Array<{ id: string; updates: Partial<CardElement> }> = [];

      for (const id of ids) {
        const el = elementRefs.current[id];
        const elem = cardData.elements.find((e) => e.id === id);
        if (!el || !elem) continue;

        const er = el.getBoundingClientRect();
        const widthPct = (er.width / cw) * 100;
        const heightPct = (er.height / ch) * 100;

        let positionX = elem.positionX;
        let positionY = elem.positionY;

        switch (option) {
          case "left":
            positionX = 0;
            break;
          case "right":
            positionX = 100 - widthPct;
            break;
          case "top":
            positionY = 0;
            break;
          case "bottom":
            positionY = 100 - heightPct;
            break;
          case "center-h":
            positionX = 50 - widthPct / 2;
            break;
          case "center-v":
            positionY = 50 - heightPct / 2;
            break;
          case "center":
            positionX = 50 - widthPct / 2;
            positionY = 50 - heightPct / 2;
            break;
        }
        updatesById.push({ id, updates: { positionX, positionY } });
      }

      if (updatesById.length > 0) updateElementsBatch(updatesById);
    };

    requestAnimationFrame(run);
  };

  const alignToSelection = (option: AlignToCanvasOption) => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    if (ids.length === 1) {
      alignToCanvas(option);
      return;
    }

    const cw = containerSize.width;
    const ch = containerSize.height;

    const run = () => {
      const rects: Array<{ id: string; left: number; top: number; width: number; height: number }> = [];
      for (const id of ids) {
        const el = elementRefs.current[id];
        const elem = cardData.elements.find((e) => e.id === id);
        if (!el || !elem) continue;
        const er = el.getBoundingClientRect();
        const leftPct = (elem.positionX / 100) * cw;
        const topPct = (elem.positionY / 100) * ch;
        const wPct = (er.width / cw) * 100;
        const hPct = (er.height / ch) * 100;
        rects.push({
          id,
          left: elem.positionX,
          top: elem.positionY,
          width: wPct,
          height: hPct,
        });
      }
      if (rects.length < 2) return;

      const selLeft = Math.min(...rects.map((r) => r.left));
      const selRight = Math.max(...rects.map((r) => r.left + r.width));
      const selTop = Math.min(...rects.map((r) => r.top));
      const selBottom = Math.max(...rects.map((r) => r.top + r.height));
      const selCenterX = (selLeft + selRight) / 2;
      const selCenterY = (selTop + selBottom) / 2;

      const updatesById: Array<{ id: string; updates: Partial<CardElement> }> = [];
      for (const r of rects) {
        let positionX = r.left;
        let positionY = r.top;
        switch (option) {
          case "left":
            positionX = selLeft;
            break;
          case "right":
            positionX = selRight - r.width;
            break;
          case "center-h":
          case "center":
            positionX = selCenterX - r.width / 2;
            break;
        }
        switch (option) {
          case "top":
            positionY = selTop;
            break;
          case "bottom":
            positionY = selBottom - r.height;
            break;
          case "center-v":
          case "center":
            positionY = selCenterY - r.height / 2;
            break;
        }
        updatesById.push({ id: r.id, updates: { positionX, positionY } });
      }
      if (updatesById.length > 0) updateElementsBatch(updatesById);
    };

    requestAnimationFrame(run);
  };

  const handleAlign = (option: AlignToCanvasOption) => {
    if (alignMode === "artboard") alignToCanvas(option);
    else alignToSelection(option);
  };

  const nudgeElement = (dx: number, dy: number) => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    const updatesById: Array<{ id: string; updates: Partial<CardElement> }> = [];
    for (const id of ids) {
      const elem = cardData.elements.find((e) => e.id === id);
      if (!elem) continue;
      updatesById.push({
        id,
        updates: {
          positionX: Math.max(0, Math.min(100, elem.positionX + dx)),
          positionY: Math.max(0, Math.min(100, elem.positionY + dy)),
        },
      });
    }
    if (updatesById.length > 0) updateElementsBatch(updatesById);
  };

  const handleElementClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (e.ctrlKey || e.metaKey) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
    } else {
      setSelectedIds(new Set([id]));
    }
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

    if (Math.abs(x) <= CENTER_THRESHOLD) x = 0;
    if (Math.abs(y) <= CENTER_THRESHOLD) y = 0;

    const posXPercent = Math.round((x / width) * 100);
    const posYPercent = Math.round((y / height) * 100);

    if (element.type === "line" && element.positionX2 != null && element.positionY2 != null) {
      const oldLeft = (Math.min(element.positionX, element.positionX2) / 100) * width;
      const oldTop = (Math.min(element.positionY, element.positionY2) / 100) * height;
      const deltaX = ((x - oldLeft) / width) * 100;
      const deltaY = ((y - oldTop) / height) * 100;
      updateElement(id, {
        positionX: element.positionX + deltaX,
        positionY: element.positionY + deltaY,
        positionX2: element.positionX2 + deltaX,
        positionY2: element.positionY2 + deltaY,
      });
    } else {
      updateElement(id, {
        positionX: posXPercent,
        positionY: posYPercent,
      });
    }
  };

  const handleResizeStart = (id: string, handle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const element = cardData.elements.find((el) => el.id === id);
    if (!element || (element.type !== "text" && element.type !== undefined)) return;
    resizingRef.current = {
      id,
      handle,
      startX: e.clientX,
      startY: e.clientY,
      startWidth: element.width ?? 80,
      startHeight: element.height ?? 15,
      startPosX: element.positionX,
      startPosY: element.positionY,
    };
    setResizing(true);
  };

  useEffect(() => {
    if (!resizing) return;
    const onMouseMove = (e: MouseEvent) => {
      const r = resizingRef.current;
      if (!r) return;
      const cw = containerSize.width;
      const ch = containerSize.height;
      const deltaXPct = ((e.clientX - r.startX) / cw) * 100;
      const deltaYPct = ((e.clientY - r.startY) / ch) * 100;
      let posX = r.startPosX;
      let posY = r.startPosY;
      let w = r.startWidth;
      let h = r.startHeight;
      const hh = r.handle;
      if (hh.includes("e")) w = Math.max(MIN_TEXT_BOX_PCT, Math.min(100 - posX, r.startWidth + deltaXPct));
      if (hh.includes("w")) {
        posX = Math.max(0, r.startPosX + deltaXPct);
        w = r.startWidth + r.startPosX - posX;
        if (w < MIN_TEXT_BOX_PCT) {
          w = MIN_TEXT_BOX_PCT;
          posX = r.startPosX + r.startWidth - MIN_TEXT_BOX_PCT;
        }
        if (posX + w > 100) w = 100 - posX;
      }
      if (hh.includes("s")) h = Math.max(MIN_TEXT_BOX_PCT, Math.min(100 - posY, r.startHeight + deltaYPct));
      if (hh.includes("n")) {
        posY = Math.max(0, r.startPosY + deltaYPct);
        h = r.startHeight + r.startPosY - posY;
        if (h < MIN_TEXT_BOX_PCT) {
          h = MIN_TEXT_BOX_PCT;
          posY = r.startPosY + r.startHeight - MIN_TEXT_BOX_PCT;
        }
        if (posY + h > 100) h = 100 - posY;
      }
      setCardData((prev) => {
        const next = {
          ...prev,
          elements: prev.elements.map((el) =>
            el.id === r.id ? { ...el, positionX: posX, positionY: posY, width: w, height: h } : el
          ),
        };
        cardDataRef.current = next;
        return next;
      });
    };
    const onMouseUp = () => {
      if (resizingRef.current) addToHistory(cardDataRef.current);
      resizingRef.current = null;
      setResizing(false);
    };
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
  }, [resizing, containerSize.width, containerSize.height]);

  // Image handling
  const hasBackground = !!(backgroundImage || cardData.background_image);
  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".gif"],
    },
    onDrop: (acceptedFiles) => {
      const file = acceptedFiles[0];
      setBackgroundImage(file);
    },
    noClick: hasBackground,
  });

  const handleRemoveBackground = () => {
    setBackgroundImage(undefined);
    setCardData((prev) => ({ ...prev, background_image: undefined }));
  };

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

  // Save card data: send all elements (text + shapes). Text converted for backend; shapes include lineHeight for validation.
  const handleSave = async () => {
    if (!containerRef.current) return;
    setSelectedIds(new Set());
    setSaving(true);
    try {
      const elementsForBackend = cardData.elements.map((el) => {
        if (el.type === "text" || el.type === undefined) {
          return convertToBackendValues([el], containerSize.width)[0];
        }
        return { ...el, lineHeight: 1 };
      });

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

    await onSave({
      ...cardData,
      elements: elementsForBackend,
      background_image: backgroundImage || undefined,
      preview_image: previewImage || undefined,
      aspect_ratio: containerSize.aspectRatio,
    });
    } finally {
      setSaving(false);
    }
  };

  const primarySelectedId = selectedIds.size > 0 ? Array.from(selectedIds)[0] : null;
  const getSelectedElementData = () =>
    primarySelectedId
      ? cardData.elements.find((el) => el.id === primarySelectedId)
      : null;

  const selectedElementData = getSelectedElementData();

  const designColors = useMemo(() => {
    const seen = new Set<string>();
    const colors: string[] = [];
    for (const el of cardData.elements) {
      const c = el.color;
      if (c && typeof c === "string" && !seen.has(c)) {
        seen.add(c);
        colors.push(c);
      }
    }
    return colors;
  }, [cardData.elements]);

  const handleDesignColorClick = (color: string) => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    if (ids.length === 1) {
      updateElement(ids[0], { color });
    } else {
      updateElementsBatch(ids.map((id) => ({ id, updates: { color } })));
    }
  };

  const [fontDropdownOpen, setFontDropdownOpen] = useState(false);
  const fontDropdownRef = useRef<HTMLDivElement>(null);
  const colorPickerRef = useRef<HTMLDivElement>(null);
  const propertyPanelRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const designColorsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (fontDropdownOpen && fontDropdownRef.current && !fontDropdownRef.current.contains(target)) {
        setFontDropdownOpen(false);
      }
      if (showColorPicker && colorPickerRef.current && !colorPickerRef.current.contains(target)) {
        setShowColorPicker(false);
      }
      const inArtboard = containerRef.current?.contains(target);
      const inPropertyPanel = propertyPanelRef.current?.contains(target);
      const inToolbar = toolbarRef.current?.contains(target);
      const inDesignColors = designColorsRef.current?.contains(target);
      if (!inArtboard && !inPropertyPanel && !inToolbar && !inDesignColors) {
        setSelectedIds(new Set());
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [fontDropdownOpen, showColorPicker]);

  return (
    <div className="flex flex-col h-full">
      <div ref={toolbarRef} className="flex justify-between mb-4 flex-wrap gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <button
            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-md flex items-center text-sm font-medium text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleUndo}
            disabled={historyIndex <= 0}
          >
            <ArrowUturnLeftIcon className="h-4 w-4 mr-1" />
            Undo
          </button>
          <button
            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-md flex items-center text-sm font-medium text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
          >
            <ArrowUturnRightIcon className="h-4 w-4 mr-1" />
            Redo
          </button>
          <button
            className="px-3 py-1.5 bg-primary-100 text-primary-800 hover:bg-primary-200 rounded-md flex items-center text-sm font-medium"
            onClick={addElement}
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            Add Text
          </button>
          <div className="flex items-center gap-1 border-l border-gray-300 pl-2">
            <span className="text-xs text-gray-500">Shapes:</span>
            <button
              type="button"
              onClick={() => addShape("line")}
              className="p-1.5 rounded hover:bg-gray-200 text-gray-600 border border-transparent hover:border-gray-300"
              title="Straight line"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="12" x2="20" y2="12" /></svg>
            </button>
            <button
              type="button"
              onClick={() => addShape("rect-fill")}
              className="p-1.5 rounded hover:bg-gray-200 text-gray-600 border border-transparent hover:border-gray-300"
              title="Filled rectangle"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="6" width="16" height="12" rx="1" /></svg>
            </button>
            <button
              type="button"
              onClick={() => addShape("rect-border")}
              className="p-1.5 rounded hover:bg-gray-200 text-gray-600 border border-transparent hover:border-gray-300"
              title="Rectangle border"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="6" width="16" height="12" rx="1" /></svg>
            </button>
            <button
              type="button"
              onClick={() => addShape("circle-fill")}
              className="p-1.5 rounded hover:bg-gray-200 text-gray-600 border border-transparent hover:border-gray-300"
              title="Filled circle"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="8" /></svg>
            </button>
            <button
              type="button"
              onClick={() => addShape("circle-border")}
              className="p-1.5 rounded hover:bg-gray-200 text-gray-600 border border-transparent hover:border-gray-300"
              title="Circle border"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="8" /></svg>
            </button>
          </div>
          {selectedIds.size > 0 && (
            <>
              <span className="text-gray-400 mx-1">|</span>
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-500 self-center">Align to:</span>
                <div className="flex rounded-md overflow-hidden border border-gray-300">
                  <button
                    type="button"
                    onClick={() => setAlignMode("artboard")}
                    className={`px-2 py-1.5 text-xs font-medium ${
                      alignMode === "artboard"
                        ? "bg-primary-100 text-primary-800 border-primary-300"
                        : "bg-white text-gray-600 hover:bg-gray-50"
                    }`}
                    title="Align relative to artboard"
                  >
                    Artboard
                  </button>
                  <button
                    type="button"
                    onClick={() => setAlignMode("selection")}
                    className={`px-2 py-1.5 text-xs font-medium border-l border-gray-300 ${
                      alignMode === "selection"
                        ? "bg-primary-100 text-primary-800 border-primary-300"
                        : "bg-white text-gray-600 hover:bg-gray-50"
                    }`}
                    title="Align selected elements to each other"
                  >
                    Selection
                  </button>
                </div>
              </div>
              <span className="text-xs text-gray-500 self-center">:</span>
              <div className="flex items-center gap-0.5 bg-gray-100 rounded-md p-0.5">
                <button
                  type="button"
                  onClick={() => handleAlign("left")}
                  className="p-1.5 rounded hover:bg-gray-200 text-gray-600"
                  title="Align left"
                >
                  <AlignLeftIcon />
                </button>
                <button
                  type="button"
                  onClick={() => handleAlign("center-h")}
                  className="p-1.5 rounded hover:bg-gray-200 text-gray-600"
                  title="Align horizontal center"
                >
                  <AlignCenterHIcon />
                </button>
                <button
                  type="button"
                  onClick={() => handleAlign("right")}
                  className="p-1.5 rounded hover:bg-gray-200 text-gray-600"
                  title="Align right"
                >
                  <AlignRightIcon />
                </button>
                <button
                  type="button"
                  onClick={() => handleAlign("top")}
                  className="p-1.5 rounded hover:bg-gray-200 text-gray-600"
                  title="Align top"
                >
                  <AlignTopIcon />
                </button>
                <button
                  type="button"
                  onClick={() => handleAlign("center-v")}
                  className="p-1.5 rounded hover:bg-gray-200 text-gray-600"
                  title="Align vertical middle"
                >
                  <AlignCenterVIcon />
                </button>
                <button
                  type="button"
                  onClick={() => handleAlign("bottom")}
                  className="p-1.5 rounded hover:bg-gray-200 text-gray-600"
                  title="Align bottom"
                >
                  <AlignBottomIcon />
                </button>
              </div>
              <span className="text-xs text-gray-400 self-center ml-1">Nudge: ↑↓←→ · Ctrl+click: multi-select</span>
            </>
          )}
        </div>
        <button
          className="px-4 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-md flex items-center font-medium disabled:opacity-70 disabled:cursor-not-allowed"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? (
            <>
              <ArrowPathIcon className="h-4 w-4 mr-1 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <CheckIcon className="h-4 w-4 mr-1" />
              Save Card
            </>
          )}
        </button>
      </div>

      <div className="flex flex-grow gap-4 min-h-0">
        {/* Design colors - vertical strip on left */}
        {designColors.length > 0 && (
          <div ref={designColorsRef} className="flex flex-col items-center shrink-0 pt-10">
            <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-2">Design colors</span>
            <div className="flex flex-col gap-1.5">
              {designColors.map((color, i) => (
                <button
                  key={`${color}-${i}`}
                  type="button"
                  onClick={() => handleDesignColorClick(color)}
                  disabled={selectedIds.size === 0}
                  title={selectedIds.size > 0 ? `Apply ${color} to selected` : "Select an element first"}
                  className={`w-8 h-8 rounded-lg border-2 transition-all shrink-0 ${
                    selectedIds.size === 0
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:ring-2 hover:ring-primary-500 hover:ring-offset-2 hover:scale-110 cursor-pointer border-gray-300"
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        )}
        {/* Artboard container */}
        <div className="flex flex-col items-center flex-1 min-w-0">
          <div className="mb-2 flex items-center justify-center gap-2 w-full">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Artboard
            </span>
            <span className="text-xs text-gray-400">
              {Math.round(containerSize.width)} × {Math.round(containerSize.height)}
            </span>
          </div>
          <div
            className="rounded-xl border-2 border-gray-300 bg-gray-200 shadow-xl flex items-center justify-center p-4"
            style={{ minHeight: containerSize.height + 32 }}
          >
            <div
              ref={containerRef}
              className="relative overflow-hidden flex items-center justify-center rounded-lg shadow-inner"
              onClick={(e) => {
                if (e.target === e.currentTarget) setSelectedIds(new Set());
              }}
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
              opacity: hasBackground ? 0 : 1,
              borderStyle: "none",
              pointerEvents: hasBackground ? "none" : undefined,
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
          {hasBackground && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveBackground();
              }}
              title="Remove background image"
              className="absolute top-2 right-2 z-20 p-2 rounded-lg bg-white/90 hover:bg-white shadow-md border border-gray-200 flex items-center justify-center text-gray-600 hover:text-red-600 transition-colors"
              aria-label="Remove background image"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          )}
          {cardData.elements.map((element) => {
            const cw = containerSize.width;
            const ch = containerSize.height;
            const isLine = element.type === "line";
            const lineBoxLeft = isLine && element.positionX2 != null && element.positionY2 != null
              ? (Math.min(element.positionX, element.positionX2) / 100) * cw
              : (element.positionX / 100) * cw;
            const lineBoxTop = isLine && element.positionX2 != null && element.positionY2 != null
              ? (Math.min(element.positionY, element.positionY2) / 100) * ch
              : (element.positionY / 100) * ch;
            const posX = isLine ? lineBoxLeft : (element.positionX / 100) * cw;
            const posY = isLine ? lineBoxTop : (element.positionY / 100) * ch;

            return (
            <Draggable
              key={element.id}
              position={{ x: posX, y: posY }}
              onDrag={handleDrag}
              onStop={(e, data) => handleDragStop(element.id, e, data)}
              bounds="parent"
            >
              <div
                ref={(el) => {
                  elementRefs.current[element.id] = el;
                }}
                className={`absolute cursor-move ${
                  selectedIds.has(element.id)
                    ? "ring-2 ring-primary-500"
                    : ""
                }`}
                onClick={(e) => handleElementClick(e, element.id)}
              >
                {element.type === "text" || element.type === undefined ? (
                  <>
                <div
                  className="w-full h-full overflow-hidden flex flex-col"
                  style={{
                    width: `${((element.width ?? 80) / 100) * cw}px`,
                    height: `${((element.height ?? 15) / 100) * ch}px`,
                  }}
                >
                  <div
                    ref={(el) => {
                      elementInnerRefs.current[element.id] = el;
                    }}
                    style={{
                      fontFamily:
                        element.bold && EDITOR_FONTS[element.fontStyleIndex ?? 0]?.bold
                          ? EDITOR_FONTS[element.fontStyleIndex ?? 0].bold!
                          : EDITOR_FONTS[element.fontStyleIndex ?? 0]?.regular ||
                            "Arial",
                      fontSize: `${(element.fontSize ?? 14)}px`,
                      color: element.color,
                      textAlign: element.alignment ?? "center",
                      padding: "5px",
                      lineHeight: element.lineHeight ?? 1,
                      transform: `rotate(${element.rotate ?? 0}rad)`,
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                      overflow: "hidden",
                      width: "100%",
                      height: "100%",
                    }}
                  >
                    {element.text ?? ""}
                  </div>
                </div>

                {selectedIds.has(element.id) && (
                  <>
                    {(["n", "s", "e", "w", "ne", "nw", "se", "sw"] as const).map((handle) => (
                      <div
                        key={handle}
                        className="absolute bg-primary-500 border-2 border-white z-20 hover:bg-primary-600"
                        style={{
                          width: handle.length === 1 && (handle === "n" || handle === "s") ? "16px" : handle.length === 1 ? "6px" : "10px",
                          height: handle.length === 1 && (handle === "e" || handle === "w") ? "16px" : handle.length === 1 ? "6px" : "10px",
                          left: handle.includes("w") ? "-5px" : handle === "n" || handle === "s" ? "50%" : undefined,
                          right: handle.includes("e") ? "-5px" : undefined,
                          top: handle.includes("n") ? "-5px" : handle === "e" || handle === "w" ? "50%" : undefined,
                          bottom: handle.includes("s") ? "-5px" : undefined,
                          transform: handle === "n" || handle === "s" ? "translateX(-50%)" : handle === "e" || handle === "w" ? "translateY(-50%)" : undefined,
                          cursor: handle === "n" || handle === "s" ? "ns-resize" : handle === "e" || handle === "w" ? "ew-resize" : handle === "ne" || handle === "sw" ? "nesw-resize" : "nwse-resize",
                        }}
                        onMouseDown={(ev) => handleResizeStart(element.id, handle, ev)}
                      />
                    ))}
                    <button
                    className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeElement(element.id);
                    }}
                  >
                    <TrashIcon className="h-3 w-3" />
                  </button>
                  </>
                )}
              </>
            ) : (
                  <>
                {element.type === "line" && element.positionX2 != null && element.positionY2 != null && (
                  (() => {
                    const minX = Math.min(element.positionX, element.positionX2);
                    const minY = Math.min(element.positionY, element.positionY2);
                    const sw = element.strokeWidth ?? 2;
                    const w = (Math.abs(element.positionX2 - element.positionX) / 100) * cw + sw * 2;
                    const h = (Math.abs(element.positionY2 - element.positionY) / 100) * ch + sw * 2;
                    const x1 = ((element.positionX - minX) / 100) * cw + sw;
                    const y1 = ((element.positionY - minY) / 100) * ch + sw;
                    const x2 = ((element.positionX2 - minX) / 100) * cw + sw;
                    const y2 = ((element.positionY2 - minY) / 100) * ch + sw;
                    return (
                      <svg width={w} height={h} style={{ display: "block" }}>
                        <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={element.color} strokeWidth={sw} />
                      </svg>
                    );
                  })()
                )}
                {(element.type === "rect-fill" || element.type === "rect-border") && element.width != null && element.height != null && (
                  <svg
                    width={(element.width / 100) * cw}
                    height={(element.height / 100) * ch}
                    style={{ display: "block" }}
                  >
                    {element.type === "rect-fill" ? (
                      <rect width="100%" height="100%" fill={element.color} rx="2" />
                    ) : (
                      <rect width="100%" height="100%" fill="none" stroke={element.color} strokeWidth={element.strokeWidth ?? 2} rx="2" />
                    )}
                  </svg>
                )}
                {(element.type === "circle-fill" || element.type === "circle-border") && element.width != null && element.height != null && (
                  <svg
                    width={(element.width / 100) * cw}
                    height={(element.height / 100) * ch}
                    style={{ display: "block" }}
                  >
                    <ellipse
                      cx="50%"
                      cy="50%"
                      rx="50%"
                      ry="50%"
                      fill={element.type === "circle-fill" ? element.color : "none"}
                      stroke={element.type === "circle-border" ? element.color : "none"}
                      strokeWidth={element.type === "circle-border" ? (element.strokeWidth ?? 2) : 0}
                    />
                  </svg>
                )}
                {selectedIds.has(element.id) && (
                  <button
                    className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-1 z-10"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeElement(element.id);
                    }}
                  >
                    <TrashIcon className="h-3 w-3" />
                  </button>
                )}
                  </>
                )}
              </div>
            </Draggable>
            );
          })}
            </div>
          </div>
        </div>

        <div ref={propertyPanelRef} className="w-80 border border-gray-200 rounded-lg bg-white shadow-sm flex-shrink-0 overflow-y-auto flex flex-col min-h-[500px]">
          {selectedIds.size > 1 ? (
            <div className="p-4 space-y-4">
              <p className="text-sm font-medium text-gray-700">
                {selectedIds.size} elements selected
              </p>
              <p className="text-xs text-gray-500">
                Use <strong>Align to: Selection</strong> in the toolbar to align these to each other, or <strong>Artboard</strong> to align relative to the card.
              </p>
              <button
                type="button"
                onClick={removeSelectedElements}
                className="w-full flex items-center justify-center gap-2 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md border border-red-200"
              >
                <TrashIcon className="h-4 w-4" />
                Remove all selected
              </button>
            </div>
          ) : selectedElementData ? (
            selectedElementData.type === "text" || selectedElementData.type === undefined ? (
            <div className="p-4 space-y-5">
              {/* Section: Text */}
              <section>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                  Text
                </h3>
                <textarea
                  value={selectedElementData.text ?? ""}
                  onChange={(e) =>
                    updateElement(selectedElementData.id, {
                      text: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                  rows={3}
                  placeholder="Enter text..."
                />
              </section>

              {/* Section: Font */}
              <section>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Font
                </h3>
                <div className="space-y-3">
                  <div className="relative" ref={fontDropdownRef}>
                    <button
                      type="button"
                      onClick={() => setFontDropdownOpen(!fontDropdownOpen)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 text-left flex justify-between items-center text-sm bg-white"
                      style={{
                        fontFamily: `"${
                          EDITOR_FONTS[selectedElementData.fontStyleIndex ?? 0].regular
                        }", sans-serif`,
                      }}
                    >
                      {EDITOR_FONTS[selectedElementData.fontStyleIndex ?? 0].name}
                      <ChevronDownIcon
                        className={`h-5 w-5 text-gray-400 transition-transform ${
                          fontDropdownOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    {fontDropdownOpen && (
                      <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm border border-gray-200">
                        {EDITOR_FONTS.map((font, index) => (
                          <div
                            key={index}
                            className={`cursor-pointer select-none py-2 pl-3 pr-9 hover:bg-primary-50 ${
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
                              fontSize: "14px",
                            }}
                          >
                            {font.name}
                            {selectedElementData.fontStyleIndex === index && (
                              <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-primary-600">
                                <CheckIcon className="h-5 w-5" />
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Size (px)</span>
                      <span>{selectedElementData.fontSize ?? 14} px</span>
                    </div>
                    <input
                      type="range"
                      min="8"
                      max="120"
                      step={1}
                      value={selectedElementData.fontSize ?? 14}
                      onChange={(e) =>
                        updateElement(selectedElementData.id, {
                          fontSize: parseInt(e.target.value, 10),
                        })
                      }
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
                    />
                    <input
                      type="number"
                      min={8}
                      max={200}
                      value={selectedElementData.fontSize ?? 14}
                      onChange={(e) => {
                        const v = parseInt(e.target.value, 10);
                        if (!isNaN(v)) updateElement(selectedElementData.id, { fontSize: Math.max(8, Math.min(200, v)) });
                      }}
                      className="mt-1 w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      className={`flex-1 px-3 py-1.5 border rounded-md text-sm font-bold ${
                        selectedElementData.bold &&
                        EDITOR_FONTS[selectedElementData.fontStyleIndex ?? 0]?.bold
                          ? "bg-primary-100 border-primary-400 text-primary-800"
                          : "bg-white border-gray-300 text-gray-600"
                      } ${
                        !EDITOR_FONTS[selectedElementData.fontStyleIndex ?? 0]?.bold
                          ? "opacity-50 cursor-not-allowed"
                          : "hover:bg-gray-50"
                      }`}
                      onClick={() => {
                        if (
                          EDITOR_FONTS[selectedElementData.fontStyleIndex ?? 0]?.bold
                        ) {
                          updateElement(selectedElementData.id, {
                            bold: !selectedElementData.bold,
                          });
                        }
                      }}
                      disabled={
                        !EDITOR_FONTS[selectedElementData.fontStyleIndex ?? 0]?.bold
                      }
                      title={
                        !EDITOR_FONTS[selectedElementData.fontStyleIndex ?? 0]?.bold
                          ? "Bold not available for this font"
                          : "Bold"
                      }
                    >
                      B
                    </button>
                  </div>
                </div>
              </section>

              {/* Section: Paragraph (alignment + line height) */}
              <section>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Paragraph
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500 mb-1.5">Text alignment</p>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          updateElement(selectedElementData.id, {
                            alignment: "left",
                          })
                        }
                        className={`flex-1 flex justify-center items-center py-2 rounded-md border ${
                          selectedElementData.alignment === "left"
                            ? "bg-primary-100 border-primary-400 text-primary-700"
                            : "bg-white border-gray-300 text-gray-600 hover:bg-gray-50"
                        }`}
                        title="Align left"
                      >
                        <Bars3BottomLeftIcon className="h-5 w-5" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          updateElement(selectedElementData.id, {
                            alignment: "center",
                          })
                        }
                        className={`flex-1 flex justify-center items-center py-2 rounded-md border ${
                          selectedElementData.alignment === "center"
                            ? "bg-primary-100 border-primary-400 text-primary-700"
                            : "bg-white border-gray-300 text-gray-600 hover:bg-gray-50"
                        }`}
                        title="Align center"
                      >
                        <Bars3Icon className="h-5 w-5" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          updateElement(selectedElementData.id, {
                            alignment: "right",
                          })
                        }
                        className={`flex-1 flex justify-center items-center py-2 rounded-md border ${
                          selectedElementData.alignment === "right"
                            ? "bg-primary-100 border-primary-400 text-primary-700"
                            : "bg-white border-gray-300 text-gray-600 hover:bg-gray-50"
                        }`}
                        title="Align right"
                      >
                        <Bars3BottomRightIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Line height</span>
                      <span>{selectedElementData.lineHeight}</span>
                    </div>
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
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
                    />
                  </div>
                </div>
              </section>

              {/* Section: Color */}
              <section>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <SwatchIcon className="h-4 w-4" />
                  Color
                </h3>
                <div className="grid grid-cols-4 gap-2">
                  <div className="relative" ref={colorPickerRef}>
                    <button
                      type="button"
                      onClick={() => setShowColorPicker((v) => !v)}
                      className={`w-9 h-9 rounded-lg border-2 flex items-center justify-center cursor-pointer ${
                        !colorsList.includes(selectedElementData.color)
                          ? "ring-2 ring-primary-500 ring-offset-2 border-primary-400"
                          : "border-gray-300"
                      }`}
                      style={{
                        background:
                          "conic-gradient(red, yellow, lime, cyan, blue, magenta, red)",
                      }}
                      title="Custom color"
                    />
                    {showColorPicker && (
                      <div className="absolute z-50 mt-2 p-3 bg-white border border-gray-200 rounded-lg shadow-xl left-0 top-full">
                        <HexAlphaColorPicker
                          color={selectedElementData.color}
                          onChange={(color) =>
                            updateElement(selectedElementData.id, { color })
                          }
                        />
                        <input
                          type="text"
                          className="mt-2 w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                          value={selectedElementData.color}
                          onChange={(e) => {
                            const val = e.target.value;
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
                            className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-md"
                            onClick={() => setShowColorPicker(false)}
                          >
                            Done
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  <EyedropperButton
                    onPick={(c) => updateElement(selectedElementData.id, { color: c })}
                    title="Pick color from screen"
                    className="w-9 h-9"
                  />
                  {colorsList.map((color, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        updateElement(selectedElementData.id, {
                          color: color,
                        });
                      }}
                      className={`w-9 h-9 rounded-lg border-2 ${
                        selectedElementData.color === color
                          ? "ring-2 ring-primary-500 ring-offset-2 border-primary-400"
                          : "border-gray-300 hover:border-gray-400"
                      }`}
                      style={{ backgroundColor: color }}
                      aria-label={`Color ${index}`}
                    />
                  ))}
                </div>
              </section>

              {/* Section: Transform (rotation) */}
              <section>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Transform
                </h3>
                <div>
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Rotation</span>
                    <span>
                      {Math.round(
                        (selectedElementData.rotate ?? 0) * (180 / Math.PI)
                      )}
                      °
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="360"
                    value={Math.round(
                      (selectedElementData.rotate ?? 0) * (180 / Math.PI)
                    )}
                    onChange={(e) =>
                      updateElement(selectedElementData.id, {
                        rotate:
                          (parseInt(e.target.value) * Math.PI) / 180,
                      })
                    }
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
                  />
                </div>
              </section>

              {/* Section: Position */}
              <section>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Position
                </h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">X %</label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={Math.round(selectedElementData.positionX)}
                        onChange={(e) => {
                          const newX = parseInt(e.target.value, 10);
                          if (!isNaN(newX))
                            updateElement(selectedElementData.id, {
                              positionX: Math.max(0, Math.min(100, newX)),
                            });
                        }}
                        className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Y %</label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={Math.round(selectedElementData.positionY)}
                        onChange={(e) => {
                          const newY = parseInt(e.target.value, 10);
                          if (!isNaN(newY))
                            updateElement(selectedElementData.id, {
                              positionY: Math.max(0, Math.min(100, newY)),
                            });
                        }}
                        className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1.5">Nudge (Shift = 5×)</p>
                    <div className="grid grid-cols-3 gap-1 max-w-[140px] mx-auto">
                      <div />
                      <button
                        type="button"
                        onClick={() => nudgeElement(0, -1)}
                        className="p-1.5 rounded border border-gray-300 bg-white hover:bg-gray-50"
                      >
                        <ArrowUpIcon className="h-4 w-4 mx-auto" />
                      </button>
                      <div />
                      <button
                        type="button"
                        onClick={() => nudgeElement(-1, 0)}
                        className="p-1.5 rounded border border-gray-300 bg-white hover:bg-gray-50"
                      >
                        <ArrowLeftIcon className="h-4 w-4 mx-auto" />
                      </button>
                      <div className="p-1.5 rounded border border-gray-200 bg-gray-50 text-center text-xs text-gray-400">
                        •
                      </div>
                      <button
                        type="button"
                        onClick={() => nudgeElement(1, 0)}
                        className="p-1.5 rounded border border-gray-300 bg-white hover:bg-gray-50"
                      >
                        <ArrowRightIcon className="h-4 w-4 mx-auto" />
                      </button>
                      <div />
                      <button
                        type="button"
                        onClick={() => nudgeElement(0, 1)}
                        className="p-1.5 rounded border border-gray-300 bg-white hover:bg-gray-50"
                      >
                        <ArrowDownIcon className="h-4 w-4 mx-auto" />
                      </button>
                      <div />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      removeElement(selectedElementData.id);
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md border border-red-200"
                  >
                    <TrashIcon className="h-4 w-4" />
                    Remove element
                  </button>
                </div>
              </section>
            </div>
          ) : (
            <div className="p-4 space-y-5">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Shape
              </h3>
              <p className="text-sm text-gray-600 capitalize">{selectedElementData.type.replace("-", " ")}</p>
              <section>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <SwatchIcon className="h-4 w-4" />
                  Color
                </h3>
                <div className="grid grid-cols-4 gap-2">
                  <div className="relative" ref={colorPickerRef}>
                    <button
                      type="button"
                      onClick={() => setShowColorPicker((v) => !v)}
                      className={`w-9 h-9 rounded-lg border-2 flex items-center justify-center cursor-pointer ${!colorsList.includes(selectedElementData.color) ? "ring-2 ring-primary-500 ring-offset-2 border-primary-400" : "border-gray-300"}`}
                      style={{ background: "conic-gradient(red, yellow, lime, cyan, blue, magenta, red)" }}
                      title="Custom color"
                    />
                    {showColorPicker && (
                      <div className="absolute z-50 mt-2 p-3 bg-white border border-gray-200 rounded-lg shadow-xl left-0 top-full">
                        <HexAlphaColorPicker
                          color={selectedElementData.color}
                          onChange={(color) => updateElement(selectedElementData.id, { color })}
                        />
                        <input
                          type="text"
                          className="mt-2 w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                          value={selectedElementData.color}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (/^#?[0-9A-Fa-f]{6,8}$/.test(val.replace("#", ""))) {
                              updateElement(selectedElementData.id, { color: val.startsWith("#") ? val : `#${val}` });
                            }
                          }}
                          placeholder="#RRGGBB"
                          maxLength={9}
                        />
                        <button type="button" className="mt-2 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-md" onClick={() => setShowColorPicker(false)}>Done</button>
                      </div>
                    )}
                  </div>
                  <EyedropperButton
                    onPick={(c) => updateElement(selectedElementData.id, { color: c })}
                    title="Pick color from screen"
                    className="w-9 h-9"
                  />
                  {colorsList.map((color, i) => (
                    <button key={i} onClick={() => updateElement(selectedElementData.id, { color })} className={`w-9 h-9 rounded-lg border-2 ${selectedElementData.color === color ? "ring-2 ring-primary-500 ring-offset-2 border-primary-400" : "border-gray-300"}`} style={{ backgroundColor: color }} />
                  ))}
                </div>
              </section>
              {(selectedElementData.type === "line" || selectedElementData.type === "rect-border" || selectedElementData.type === "circle-border") && (
                <section>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Stroke width</label>
                  <input type="range" min="1" max="20" value={selectedElementData.strokeWidth ?? 2} onChange={(e) => updateElement(selectedElementData.id, { strokeWidth: parseInt(e.target.value, 10) })} className="w-full" />
                  <p className="text-right text-xs text-gray-500">{selectedElementData.strokeWidth ?? 2}px</p>
                </section>
              )}
              {(selectedElementData.type === "line") && selectedElementData.positionX2 != null && selectedElementData.positionY2 != null && (
                <section>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">End point (%)</label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-gray-500">X</label>
                      <input type="number" value={Math.round(selectedElementData.positionX2)} onChange={(e) => updateElement(selectedElementData.id, { positionX2: Math.max(0, Math.min(100, Number(e.target.value))) })} className="w-full px-3 py-1.5 border rounded text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500">Y</label>
                      <input type="number" value={Math.round(selectedElementData.positionY2)} onChange={(e) => updateElement(selectedElementData.id, { positionY2: Math.max(0, Math.min(100, Number(e.target.value))) })} className="w-full px-3 py-1.5 border rounded text-sm" />
                    </div>
                  </div>
                </section>
              )}
              {(selectedElementData.type === "rect-fill" || selectedElementData.type === "rect-border" || selectedElementData.type === "circle-fill" || selectedElementData.type === "circle-border") && selectedElementData.width != null && selectedElementData.height != null && (
                <section>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Size (%)</label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-gray-500">Width</label>
                      <input type="number" min="1" max="100" value={Math.round(selectedElementData.width)} onChange={(e) => updateElement(selectedElementData.id, { width: Math.max(1, Math.min(100, Number(e.target.value))) })} className="w-full px-3 py-1.5 border rounded text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500">Height</label>
                      <input type="number" min="1" max="100" value={Math.round(selectedElementData.height)} onChange={(e) => updateElement(selectedElementData.id, { height: Math.max(1, Math.min(100, Number(e.target.value))) })} className="w-full px-3 py-1.5 border rounded text-sm" />
                    </div>
                  </div>
                </section>
              )}
              <section>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Position (%)</label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-500">X</label>
                    <input type="number" value={Math.round(selectedElementData.positionX)} onChange={(e) => updateElement(selectedElementData.id, { positionX: Math.max(0, Math.min(100, Number(e.target.value))) })} className="w-full px-3 py-1.5 border rounded text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500">Y</label>
                    <input type="number" value={Math.round(selectedElementData.positionY)} onChange={(e) => updateElement(selectedElementData.id, { positionY: Math.max(0, Math.min(100, Number(e.target.value))) })} className="w-full px-3 py-1.5 border rounded text-sm" />
                  </div>
                </div>
              </section>
              <button type="button" onClick={() => removeElement(selectedElementData.id)} className="w-full flex items-center justify-center gap-2 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md border border-red-200">
                <TrashIcon className="h-4 w-4" />
                Remove shape
              </button>
            </div>
          )
          ) : (
            <div className="p-4 space-y-5">
              <p className="text-sm font-medium text-gray-700 mb-2">No element selected</p>
              <p className="text-xs text-gray-500 mb-4">Click a text or shape on the artboard, or add one to edit.</p>
              {/* Always show panel structure for consistent size */}
              <section>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Text</h3>
                <textarea disabled className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm bg-gray-50 text-gray-400" rows={3} placeholder="Select an element to edit" />
              </section>
              <section>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Font</h3>
                <div className="space-y-3">
                  <div className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm bg-gray-50 text-gray-400">Poppins</div>
                  <div>
                    <div className="flex justify-between text-xs text-gray-500 mb-1"><span>Size (px)</span><span>14 px</span></div>
                    <input disabled type="range" className="w-full h-2 bg-gray-200 rounded-lg opacity-50" />
                  </div>
                </div>
              </section>
              <section>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Paragraph</h3>
                <div className="space-y-2">
                  <div className="flex gap-1 opacity-50">
                    <div className="flex-1 py-2 rounded-md border border-gray-200 bg-gray-50" />
                    <div className="flex-1 py-2 rounded-md border border-gray-200 bg-gray-50" />
                    <div className="flex-1 py-2 rounded-md border border-gray-200 bg-gray-50" />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-gray-500 mb-1"><span>Line height</span><span>1</span></div>
                    <input disabled type="range" className="w-full h-2 bg-gray-200 rounded-lg opacity-50" />
                  </div>
                </div>
              </section>
              <section>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1"><SwatchIcon className="h-4 w-4" />Color</h3>
                <div className="grid grid-cols-4 gap-2 opacity-50">
                  <div className="w-9 h-9 rounded-lg border-2 border-gray-200 bg-gray-100" />
                  <div className="w-9 h-9 rounded-lg border-2 border-gray-200 bg-gray-100" />
                  {colorsList.slice(0, 2).map((c, i) => <div key={i} className="w-9 h-9 rounded-lg border-2 border-gray-200" style={{ backgroundColor: c }} />)}
                </div>
              </section>
              <section>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Transform</h3>
                <input disabled type="range" className="w-full h-2 bg-gray-200 rounded-lg opacity-50" />
              </section>
              <section>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Position</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div><label className="block text-xs text-gray-500 mb-1">X %</label><input disabled className="w-full px-3 py-1.5 border border-gray-200 rounded-md text-sm bg-gray-50" /></div>
                  <div><label className="block text-xs text-gray-500 mb-1">Y %</label><input disabled className="w-full px-3 py-1.5 border border-gray-200 rounded-md text-sm bg-gray-50" /></div>
                </div>
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
