import { create } from "zustand";

export interface HistoryAction {
  type: string;
  timestamp: number;
  data: unknown;
  undo: () => Promise<void>;
  redo: () => Promise<void>;
  description: string;
}

interface HistoryState {
  undoStack: HistoryAction[];
  redoStack: HistoryAction[];
  maxHistorySize: number;

  // Actions
  addAction: (action: HistoryAction) => void;
  undo: () => Promise<void>;
  redo: () => Promise<void>;
  canUndo: () => boolean;
  canRedo: () => boolean;
  clearHistory: () => void;
  getLastAction: () => HistoryAction | null;
}

export const useHistoryStore = create<HistoryState>((set, get) => ({
  undoStack: [],
  redoStack: [],
  maxHistorySize: 50,

  addAction: (action: HistoryAction) => {
    set((state) => {
      const newUndoStack = [...state.undoStack, action];

      // Limit stack size
      if (newUndoStack.length > state.maxHistorySize) {
        newUndoStack.shift();
      }

      return {
        undoStack: newUndoStack,
        redoStack: [], // Clear redo stack when new action is added
      };
    });
  },

  undo: async () => {
    const { undoStack, redoStack } = get();
    if (undoStack.length === 0) return;

    const action = undoStack[undoStack.length - 1];

    try {
      await action.undo();

      set({
        undoStack: undoStack.slice(0, -1),
        redoStack: [...redoStack, action],
      });
    } catch (err) {
      console.error("Failed to undo action:", err);
      throw err;
    }
  },

  redo: async () => {
    const { undoStack, redoStack } = get();
    if (redoStack.length === 0) return;

    const action = redoStack[redoStack.length - 1];

    try {
      await action.redo();

      set({
        undoStack: [...undoStack, action],
        redoStack: redoStack.slice(0, -1),
      });
    } catch (err) {
      console.error("Failed to redo action:", err);
      throw err;
    }
  },

  canUndo: () => get().undoStack.length > 0,

  canRedo: () => get().redoStack.length > 0,

  clearHistory: () => {
    set({ undoStack: [], redoStack: [] });
  },

  getLastAction: () => {
    const { undoStack } = get();
    return undoStack.length > 0 ? undoStack[undoStack.length - 1] : null;
  },
}));

/**
 * Hook for creating history actions with common patterns
 */
export function useHistory() {
  const addAction = useHistoryStore((state) => state.addAction);
  const undo = useHistoryStore((state) => state.undo);
  const redo = useHistoryStore((state) => state.redo);
  const canUndo = useHistoryStore((state) => state.canUndo);
  const canRedo = useHistoryStore((state) => state.canRedo);

  /**
   * Create a history action for updating a case
   */
  const createUpdateAction = (
    caseId: string,
    oldData: Record<string, unknown>,
    newData: Record<string, unknown>,
    updateFn: (data: Record<string, unknown>) => Promise<void>,
    description: string,
  ): HistoryAction => ({
    type: "UPDATE_CASE",
    timestamp: Date.now(),
    data: { caseId, oldData, newData },
    undo: async () => {
      await updateFn(oldData);
    },
    redo: async () => {
      await updateFn(newData);
    },
    description,
  });

  /**
   * Create a history action for deleting a case
   */
  const createDeleteAction = (
    caseData: Record<string, unknown> & { id: string },
    deleteFn: (id: string) => Promise<void>,
    restoreFn: (data: Record<string, unknown>) => Promise<void>,
    description: string,
  ): HistoryAction => ({
    type: "DELETE_CASE",
    timestamp: Date.now(),
    data: caseData,
    undo: async () => {
      await restoreFn(caseData);
    },
    redo: async () => {
      await deleteFn(caseData.id);
    },
    description,
  });

  /**
   * Create a history action for creating a case
   */
  const createCreateAction = (
    caseData: Record<string, unknown>,
    createFn: (data: Record<string, unknown>) => Promise<{ id: string }>,
    deleteFn: (id: string) => Promise<void>,
    description: string,
  ): HistoryAction => {
    let createdId: string | null = null;

    return {
      type: "CREATE_CASE",
      timestamp: Date.now(),
      data: caseData,
      undo: async () => {
        if (createdId) {
          await deleteFn(createdId);
        }
      },
      redo: async () => {
        const result = await createFn(caseData);
        createdId = result.id;
      },
      description,
    };
  };

  /**
   * Create a history action for bulk operations
   */
  const createBulkAction = (
    caseIds: string[],
    oldStates: Record<string, unknown>,
    newStates: Record<string, unknown>,
    updateFn: (updates: Record<string, unknown>) => Promise<void>,
    description: string,
  ): HistoryAction => ({
    type: "BULK_UPDATE",
    timestamp: Date.now(),
    data: { caseIds, oldStates, newStates },
    undo: async () => {
      await updateFn(oldStates);
    },
    redo: async () => {
      await updateFn(newStates);
    },
    description,
  });

  return {
    addAction,
    undo,
    redo,
    canUndo: canUndo(),
    canRedo: canRedo(),
    createUpdateAction,
    createDeleteAction,
    createCreateAction,
    createBulkAction,
  };
}
