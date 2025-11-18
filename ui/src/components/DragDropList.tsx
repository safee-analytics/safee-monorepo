"use client";

import { motion, Reorder, useDragControls } from "framer-motion";
import { ReactNode, useState } from "react";
import { GripVertical } from "lucide-react";
import { springs } from "../utils/animations";

export interface DragDropItem {
  id: string | number;
  [key: string]: unknown;
}

export interface DragDropListProps<T extends DragDropItem> {
  items: T[];
  onReorder: (items: T[]) => void;
  renderItem: (item: T, isDragging: boolean) => ReactNode;
  showHandle?: boolean;
  className?: string;
  itemClassName?: string;
  axis?: "x" | "y";
}

/**
 * Drag and Drop Sortable List with smooth animations
 * Monday.com style reordering with visual feedback
 *
 * @example
 * ```tsx
 * <DragDropList
 *   items={tasks}
 *   onReorder={setTasks}
 *   renderItem={(task) => (
 *     <div className="p-4">
 *       <h3>{task.title}</h3>
 *       <p>{task.description}</p>
 *     </div>
 *   )}
 *   showHandle
 * />
 * ```
 */
export function DragDropList<T extends DragDropItem>({
  items,
  onReorder,
  renderItem,
  showHandle = true,
  className = "",
  itemClassName = "",
  axis = "y",
}: DragDropListProps<T>) {
  return (
    <Reorder.Group
      axis={axis}
      values={items}
      onReorder={onReorder}
      className={`space-y-2 ${className}`}
    >
      {items.map((item) => (
        <DragDropItem
          key={item.id}
          item={item}
          renderItem={renderItem}
          showHandle={showHandle}
          itemClassName={itemClassName}
        />
      ))}
    </Reorder.Group>
  );
}

interface DragDropItemProps<T extends DragDropItem> {
  item: T;
  renderItem: (item: T, isDragging: boolean) => ReactNode;
  showHandle: boolean;
  itemClassName: string;
}

function DragDropItem<T extends DragDropItem>({
  item,
  renderItem,
  showHandle,
  itemClassName,
}: DragDropItemProps<T>) {
  const [isDragging, setIsDragging] = useState(false);
  const controls = useDragControls();

  return (
    <Reorder.Item
      value={item}
      dragListener={!showHandle}
      dragControls={controls}
      className={`
        relative bg-white rounded-xl border-2 transition-all
        ${isDragging ? "border-blue-400 shadow-2xl z-50" : "border-gray-200 shadow-sm"}
        ${itemClassName}
      `}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={() => setIsDragging(false)}
      whileDrag={{
        scale: 1.03,
        rotate: isDragging ? 1 : 0,
        boxShadow: "0 20px 40px rgba(0, 0, 0, 0.2)",
      }}
      transition={springs.snappy}
    >
      <div className="flex items-center gap-3">
        {showHandle && (
          <motion.div
            className="p-2 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
            onPointerDown={(e) => controls.start(e)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <GripVertical size={20} />
          </motion.div>
        )}
        <div className="flex-1">{renderItem(item, isDragging)}</div>
      </div>

      {/* Drag indicator */}
      {isDragging && (
        <motion.div
          className="absolute -left-1 top-0 bottom-0 w-1 bg-blue-600 rounded-full"
          initial={{ opacity: 0, scaleY: 0 }}
          animate={{ opacity: 1, scaleY: 1 }}
          exit={{ opacity: 0, scaleY: 0 }}
          transition={springs.bouncy}
        />
      )}
    </Reorder.Item>
  );
}

/**
 * Kanban Board - Drag between columns
 */
export interface KanbanColumn {
  id: string;
  title: string;
  items: DragDropItem[];
  color?: string;
}

export interface KanbanBoardProps {
  columns: KanbanColumn[];
  onColumnUpdate: (columnId: string, items: DragDropItem[]) => void;
  renderCard: (item: DragDropItem) => ReactNode;
  className?: string;
}

export function KanbanBoard({
  columns,
  onColumnUpdate,
  renderCard,
  className = "",
}: KanbanBoardProps) {
  const [draggedItem, setDraggedItem] = useState<DragDropItem | null>(null);

  return (
    <div className={`flex gap-4 overflow-x-auto pb-4 ${className}`}>
      {columns.map((column) => (
        <motion.div
          key={column.id}
          className="flex-shrink-0 w-80 bg-gray-50 rounded-2xl p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springs.smooth}
        >
          {/* Column Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              {column.color && (
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: column.color }}
                />
              )}
              <h3 className="font-semibold text-gray-900">{column.title}</h3>
              <span className="px-2 py-0.5 bg-gray-200 text-gray-600 text-xs rounded-full">
                {column.items.length}
              </span>
            </div>
          </div>

          {/* Column Items */}
          <Reorder.Group
            axis="y"
            values={column.items}
            onReorder={(items) => onColumnUpdate(column.id, items)}
            className="space-y-2 min-h-[200px]"
          >
            {column.items.map((item) => (
              <Reorder.Item
                key={item.id}
                value={item}
                className="bg-white rounded-lg p-3 shadow-sm border border-gray-200 cursor-grab active:cursor-grabbing"
                onDragStart={() => setDraggedItem(item)}
                onDragEnd={() => setDraggedItem(null)}
                whileDrag={{
                  scale: 1.05,
                  boxShadow: "0 10px 30px rgba(0, 0, 0, 0.15)",
                  rotate: 2,
                }}
                transition={springs.snappy}
              >
                {renderCard(item)}
              </Reorder.Item>
            ))}
          </Reorder.Group>
        </motion.div>
      ))}
    </div>
  );
}
