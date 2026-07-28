"use client";

import { useEffect, useRef, type Dispatch } from "react";
import { monitorForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { extractClosestEdge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge";
import type { Board as BoardType } from "@/lib/types";
import type { BoardAction } from "@/lib/boardReducer";
import { accentForColumn } from "@/lib/accents";
import Column from "./Column";

interface BoardProps {
  board: BoardType;
  dispatch: Dispatch<BoardAction>;
}

export default function Board({ board, dispatch }: BoardProps) {
  const boardRef = useRef(board);
  useEffect(() => { boardRef.current = board; }, [board]);

  useEffect(() => {
    return monitorForElements({
      canMonitor: ({ source }) => source.data.type === "card",
      onDrop({ source, location }) {
        const target = location.current.dropTargets[0];
        if (!target) return;

        const cardId = source.data.cardId as string;
        const targetColumnId = target.data.columnId as string;
        const column = boardRef.current.columns.find((c) => c.id === targetColumnId);
        if (!column) return;

        const withoutSource = column.cardIds.filter((id) => id !== cardId);

        let index: number;
        if (target.data.type === "card") {
          const targetCardId = target.data.cardId as string;
          index = withoutSource.indexOf(targetCardId);
          if (index === -1) return;
          if (extractClosestEdge(target.data) === "bottom") index += 1;
        } else {
          index = withoutSource.length;
        }

        dispatch({ type: "moveCard", cardId, toColumnId: targetColumnId, toIndex: index });
      },
    });
  }, [dispatch]);

  return (
    <main className="scroll-slim flex flex-1 gap-6 overflow-x-auto px-6 pt-6 pb-6 md:px-10">
      {board.columns.map((column, i) => (
        <Column
          key={column.id}
          column={column}
          cards={column.cardIds.map((id) => board.cards[id])}
          accent={accentForColumn(i)}
          dispatch={dispatch}
        />
      ))}
    </main>
  );
}
