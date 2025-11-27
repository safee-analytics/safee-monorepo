"use client";

import { useState, useMemo, Dispatch, SetStateAction, DragEvent } from "react";
import { motion } from "framer-motion";
import { LeadCard } from "./LeadCard";
import { useUpdateLead } from "@/lib/api/hooks";
import type { paths } from "@/lib/api/types";

type LeadResponse = paths["/crm/leads"]["get"]["responses"]["200"]["content"]["application/json"][number];
type StageResponse = paths["/crm/stages"]["get"]["responses"]["200"]["content"]["application/json"][number];

interface LeadKanbanBoardProps {
  leads: LeadResponse[];
  stages: StageResponse[];
}

interface CardType {
  id: string;
  lead: LeadResponse;
  stageId: number;
}

type ColumnType = string;

export function LeadKanbanBoard({ leads, stages }: LeadKanbanBoardProps) {
  const updateLeadMutation = useUpdateLead();

  // Convert leads to cards format
  const initialCards: CardType[] = useMemo(
    () =>
      leads.map((lead) => ({
        id: lead.id.toString(),
        lead,
        stageId: lead.stage?.id || 0,
      })),
    [leads],
  );

  const [cards, setCards] = useState<CardType[]>(initialCards);

  // Update cards when leads change
  useMemo(() => {
    setCards(
      leads.map((lead) => ({
        id: lead.id.toString(),
        lead,
        stageId: lead.stage?.id || 0,
      })),
    );
  }, [leads]);

  const sortedStages = useMemo(
    () => [...stages].sort((a, b) => (a.sequence || 0) - (b.sequence || 0)),
    [stages],
  );

  // Generate default colors
  const defaultColors = ["#3B82F6", "#8B5CF6", "#EC4899", "#10B981", "#F59E0B", "#EF4444"];

  const getStageColor = (stage: StageResponse) => {
    if (stage.color) {
      return typeof stage.color === "number" ? `#${stage.color.toString(16).padStart(6, "0")}` : stage.color;
    }
    return defaultColors[(stage.sequence || 0) % defaultColors.length];
  };

  const handleCardMove = async (cardId: string, newStageId: number) => {
    const card = cards.find((c) => c.id === cardId);
    if (!card || card.stageId === newStageId) return;

    try {
      await updateLeadMutation.mutateAsync({
        leadId: card.lead.id,
        data: {
          stageId: newStageId,
        },
      });
    } catch (error) {
      console.error("Failed to update lead stage:", error);
    }
  };

  return (
    <div className="h-full overflow-x-auto px-6 py-4">
      <div className="flex gap-4 pb-4">
        {sortedStages.map((stage) => (
          <Column
            key={stage.id}
            stage={stage}
            cards={cards}
            setCards={setCards}
            color={getStageColor(stage)}
            onCardMove={handleCardMove}
          />
        ))}
      </div>
    </div>
  );
}

interface ColumnProps {
  stage: StageResponse;
  cards: CardType[];
  setCards: Dispatch<SetStateAction<CardType[]>>;
  color: string;
  onCardMove: (cardId: string, newStageId: number) => void;
}

const Column = ({ stage, cards, setCards, color, onCardMove }: ColumnProps) => {
  const [active, setActive] = useState(false);

  const handleDragStart = (e: DragEvent, card: CardType) => {
    e.dataTransfer.setData("cardId", card.id);
  };

  const handleDragEnd = (e: DragEvent) => {
    const cardId = e.dataTransfer.getData("cardId");

    setActive(false);
    clearHighlights();

    const indicators = getIndicators();
    const { element } = getNearestIndicator(e, indicators);

    const before = element.dataset.before || "-1";

    if (before !== cardId) {
      let copy = [...cards];

      let cardToTransfer = copy.find((c) => c.id === cardId);
      if (!cardToTransfer) return;

      const oldStageId = cardToTransfer.stageId;
      cardToTransfer = { ...cardToTransfer, stageId: stage.id };

      copy = copy.filter((c) => c.id !== cardId);

      const moveToBack = before === "-1";

      if (moveToBack) {
        copy.push(cardToTransfer);
      } else {
        const insertAtIndex = copy.findIndex((el) => el.id === before);
        if (insertAtIndex === undefined) return;

        copy.splice(insertAtIndex, 0, cardToTransfer);
      }

      setCards(copy);

      // Only update if stage changed
      if (oldStageId !== stage.id) {
        onCardMove(cardId, stage.id);
      }
    }
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    highlightIndicator(e);
    setActive(true);
  };

  const clearHighlights = (els?: HTMLElement[]) => {
    const indicators = els || getIndicators();
    indicators.forEach((i) => {
      i.style.opacity = "0";
    });
  };

  const highlightIndicator = (e: DragEvent) => {
    const indicators = getIndicators();
    clearHighlights(indicators);
    const el = getNearestIndicator(e, indicators);
    el.element.style.opacity = "1";
  };

  const getNearestIndicator = (e: DragEvent, indicators: HTMLElement[]) => {
    const DISTANCE_OFFSET = 50;

    const el = indicators.reduce(
      (closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = e.clientY - (box.top + DISTANCE_OFFSET);

        if (offset < 0 && offset > closest.offset) {
          return { offset: offset, element: child };
        } else {
          return closest;
        }
      },
      {
        offset: Number.NEGATIVE_INFINITY,
        element: indicators[indicators.length - 1],
      },
    );

    return el;
  };

  const getIndicators = () => {
    return Array.from(document.querySelectorAll(`[data-column="${stage.id}"]`) as unknown as HTMLElement[]);
  };

  const handleDragLeave = () => {
    clearHighlights();
    setActive(false);
  };

  const filteredCards = cards.filter((c) => c.stageId === stage.id);
  const totalRevenue = filteredCards.reduce((sum, card) => sum + (card.lead.expectedRevenue || 0), 0);

  return (
    <div className="w-80 shrink-0">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
          <h3 className="font-semibold text-gray-900">{stage.name}</h3>
          <span className="px-2 py-0.5 bg-gray-200 text-gray-600 text-xs rounded-full">
            {filteredCards.length}
          </span>
        </div>
      </div>
      {totalRevenue > 0 && (
        <p className="text-xs text-gray-500 mb-3">${(totalRevenue / 1000).toFixed(1)}K total</p>
      )}
      <div
        onDrop={handleDragEnd}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`min-h-[400px] w-full rounded-xl transition-colors ${
          active ? "bg-gray-100" : "bg-gray-50"
        }`}
      >
        <div className="p-2 space-y-2">
          {filteredCards.map((card) => (
            <Card key={card.id} card={card} handleDragStart={handleDragStart} stageId={stage.id} />
          ))}
          <DropIndicator beforeId={null} column={stage.id.toString()} />
        </div>
      </div>
    </div>
  );
};

interface CardProps {
  card: CardType;
  handleDragStart: (e: DragEvent, card: CardType) => void;
  stageId: number;
}

const Card = ({ card, handleDragStart, stageId }: CardProps) => {
  return (
    <>
      <DropIndicator beforeId={card.id} column={stageId.toString()} />
      <motion.div
        layout
        layoutId={card.id}
        draggable="true"
        onDragStart={(e) => handleDragStart(e as any, card)}
        className="cursor-grab active:cursor-grabbing"
      >
        <LeadCard lead={card.lead} />
      </motion.div>
    </>
  );
};

interface DropIndicatorProps {
  beforeId: string | null;
  column: string;
}

const DropIndicator = ({ beforeId, column }: DropIndicatorProps) => {
  return (
    <div
      data-before={beforeId || "-1"}
      data-column={column}
      className="my-0.5 h-0.5 w-full bg-blue-400 opacity-0"
    />
  );
};
