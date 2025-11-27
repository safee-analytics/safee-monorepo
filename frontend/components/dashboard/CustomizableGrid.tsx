"use client";

import { useState } from "react";
import { motion, useDragControls } from "framer-motion";
import { Grip, X, ChevronsLeftRight } from "lucide-react";

export type WidgetSize = "small" | "medium" | "large";
export type WidgetComponent = React.ComponentType;

export interface Widget {
  id: string;
  title: string;
  component: WidgetComponent;
  size: WidgetSize;
  minSize: WidgetSize;
  maxSize: WidgetSize;
}

interface CustomizableGridProps {
  widgets: Widget[];
  onReorderWidgets?: (widgets: Widget[]) => void;
  onRemoveWidget?: (id: string) => void;
  onResizeWidget?: (id: string, newSize: WidgetSize) => void;
}

const sizeClasses: Record<WidgetSize, string> = {
  small: "col-span-1",
  medium: "col-span-2",
  large: "col-span-3",
};

export const CustomizableGrid = ({
  widgets,
  onReorderWidgets,
  onRemoveWidget,
  onResizeWidget,
}: CustomizableGridProps) => {
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [draggedWidget, setDraggedWidget] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = (id: string, index: number) => {
    setDraggedWidget(id);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedWidget) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (!draggedWidget || !onReorderWidgets) return;

    const dragIndex = widgets.findIndex((w) => w.id === draggedWidget);
    if (dragIndex === -1 || dragIndex === dropIndex) {
      setDraggedWidget(null);
      setDragOverIndex(null);
      return;
    }

    const newWidgets = [...widgets];
    const [removed] = newWidgets.splice(dragIndex, 1);
    newWidgets.splice(dropIndex, 0, removed);

    onReorderWidgets(newWidgets);
    setDraggedWidget(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedWidget(null);
    setDragOverIndex(null);
  };

  return (
    <div>
      {/* Customization Toggle */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Dashboard Widgets</h2>
        <button
          onClick={() => setIsCustomizing(!isCustomizing)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm ${
            isCustomizing
              ? "bg-safee-600 text-white hover:bg-safee-700"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          {isCustomizing ? "✓ Done" : "Customize Dashboard"}
        </button>
      </div>

      {/* Grid */}
      <div
        className="grid grid-cols-3 gap-6 auto-rows-auto"
        onDragOver={(e) => {
          e.preventDefault();
          // Allow dropping anywhere in the grid
        }}
        onDrop={(e) => {
          e.preventDefault();
          // If dropped on empty space, append to end
          if (draggedWidget && onReorderWidgets) {
            handleDrop(e as any, widgets.length);
          }
        }}
      >
        {widgets.map((widget, index) => (
          <GridWidget
            key={widget.id}
            widget={widget}
            index={index}
            isCustomizing={isCustomizing}
            isDragged={draggedWidget === widget.id}
            isDragOver={dragOverIndex === index}
            onRemove={() => onRemoveWidget?.(widget.id)}
            onResize={(newSize) => onResizeWidget?.(widget.id, newSize)}
            onDragStart={() => handleDragStart(widget.id, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
          />
        ))}
      </div>
    </div>
  );
};

interface GridWidgetProps {
  widget: Widget;
  index: number;
  isCustomizing: boolean;
  isDragged: boolean;
  isDragOver: boolean;
  onRemove?: () => void;
  onResize?: (newSize: WidgetSize) => void;
  onDragStart?: () => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  onDragEnd?: () => void;
}

const GridWidget = ({
  widget,
  index,
  isCustomizing,
  isDragged,
  isDragOver,
  onRemove,
  onResize,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: GridWidgetProps) => {
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStartX, setResizeStartX] = useState(0);
  const [resizeDirection, setResizeDirection] = useState<"grow" | "shrink" | null>(null);
  const Component = widget.component;

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove?.();
  };

  const handleResizeDragStart = (e: React.DragEvent, direction: "grow" | "shrink") => {
    e.stopPropagation();
    setIsResizing(true);
    setResizeStartX(e.clientX);
    setResizeDirection(direction);
  };

  const handleResizeDrag = (e: React.DragEvent) => {
    if (!isResizing || !onResize || !resizeDirection) return;

    // Prevent default drag behavior
    if (e.clientX === 0) return; // Ignore ghost drag events

    const dragDistance = Math.abs(e.clientX - resizeStartX);
    const threshold = 100; // pixels to drag before resize

    if (dragDistance > threshold) {
      const sizes: WidgetSize[] = ["small", "medium", "large"];
      const sizeValues = { small: 1, medium: 2, large: 3 };
      const currentIndex = sizes.indexOf(widget.size);

      if (resizeDirection === "grow") {
        const nextIndex = currentIndex + 1;
        if (nextIndex < sizes.length) {
          const nextSize = sizes[nextIndex];
          if (sizeValues[nextSize] <= sizeValues[widget.maxSize]) {
            onResize(nextSize);
            setResizeStartX(e.clientX); // Reset threshold
          }
        }
      } else {
        const prevIndex = currentIndex - 1;
        if (prevIndex >= 0) {
          const prevSize = sizes[prevIndex];
          if (sizeValues[prevSize] >= sizeValues[widget.minSize]) {
            onResize(prevSize);
            setResizeStartX(e.clientX); // Reset threshold
          }
        }
      }
    }
  };

  const handleResizeDragEnd = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(false);
    setResizeDirection(null);
  };

  return (
    <motion.div
      layout
      draggable={isCustomizing}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={`${sizeClasses[widget.size]} h-full relative ${isDragged ? "opacity-50" : ""}`}
      transition={{
        layout: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
      }}
    >
      {/* Drop indicator */}
      {isDragOver && isCustomizing && (
        <div className="absolute inset-0 border-2 border-dashed border-safee-500 bg-safee-50 rounded-xl z-50 pointer-events-none" />
      )}

      <div
        className={`relative h-full bg-white rounded-xl border-2 transition-all p-6 ${
          isCustomizing
            ? "border-safee-300 hover:border-safee-400 hover:shadow-lg ring-2 ring-safee-400 ring-offset-2"
            : "border-gray-200 shadow-sm"
        }`}
        style={{
          touchAction: "none",
        }}
      >
        {/* Customization Controls */}
        {isCustomizing && (
          <>
            {/* Remove Button - Highest z-index */}
            <button
              onClick={handleRemove}
              className="absolute top-2 right-2 z-30 p-2 bg-white rounded-lg border border-gray-200 hover:bg-red-50 hover:border-red-300 transition-colors shadow-sm"
              title="Remove widget"
            >
              <X className="w-4 h-4 text-gray-600 hover:text-red-600" />
            </button>

            {/* Drag Handle */}
            <div
              className="absolute top-2 left-2 z-20 cursor-grab active:cursor-grabbing hover:scale-110 transition-transform"
              title="Drag to reorder"
            >
              <div className="p-2 bg-white rounded-lg border border-gray-200 shadow-md hover:shadow-lg hover:border-safee-300 transition-all">
                <Grip className="w-4 h-4 text-gray-600" />
              </div>
            </div>

            {/* Resize Handles - Lower z-index, positioned inside widget bounds */}
            {/* Right Edge - Drag to Make Larger */}
            {widget.size !== widget.maxSize && (
              <div
                draggable
                onDragStart={(e) => handleResizeDragStart(e, "grow")}
                onDrag={handleResizeDrag}
                onDragEnd={handleResizeDragEnd}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-16 flex items-center justify-center cursor-ew-resize hover:bg-safee-100 rounded-lg transition-colors z-10 group"
                title="Drag to make larger"
              >
                <div className="p-1.5 bg-white rounded border border-gray-200 shadow-sm group-hover:border-safee-400 group-hover:shadow-md transition-all">
                  <ChevronsLeftRight className="w-3 h-3 text-gray-600 group-hover:text-safee-600" />
                </div>
              </div>
            )}

            {/* Left Edge - Drag to Make Smaller */}
            {widget.size !== widget.minSize && (
              <div
                draggable
                onDragStart={(e) => handleResizeDragStart(e, "shrink")}
                onDrag={handleResizeDrag}
                onDragEnd={handleResizeDragEnd}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-6 h-16 flex items-center justify-center cursor-ew-resize hover:bg-safee-100 rounded-lg transition-colors z-10 group"
                title="Drag to make smaller"
              >
                <div className="p-1.5 bg-white rounded border border-gray-200 shadow-sm group-hover:border-safee-400 group-hover:shadow-md transition-all">
                  <ChevronsLeftRight className="w-3 h-3 text-gray-600 group-hover:text-safee-600" />
                </div>
              </div>
            )}
          </>
        )}

        {/* Widget Content */}
        <div className={isCustomizing ? "pointer-events-none select-none" : ""}>
          <Component />
        </div>
      </div>
    </motion.div>
  );
};
