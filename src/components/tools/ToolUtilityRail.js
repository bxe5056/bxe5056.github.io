import React, { useCallback, useSyncExternalStore } from "react";
import { Link } from "react-router-dom";
import { FaStar, FaRegStar, FaTimes } from "react-icons/fa";
import SharedPasteBar from "./SharedPasteBar";
import {
  getRecentsSnapshot,
  subscribeRecents,
  toggleFavorite,
  isFavorite,
} from "../../utils/tools/recents";

const MAX_VISIBLE = 8;

const RailLinkList = ({ title, items, emptyLabel, onToggleFavorite }) => (
  <section>
    <h3 className="mb-1 px-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
      {title}
    </h3>
    {!items.length ? (
      <p className="px-2 text-[11px] leading-snug text-slate-400">{emptyLabel}</p>
    ) : (
      <ul className="flex flex-col gap-0.5">
        {items.slice(0, MAX_VISIBLE).map((item) => {
          const favorited = isFavorite(item.path);
          return (
            <li key={`${title}-${item.path}`} className="w-full">
              <div className="group flex w-full items-center rounded-md hover:bg-gray-50">
                <Link
                  to={item.path}
                  className="min-w-0 flex-1 truncate px-2 py-2 text-sm font-medium leading-none text-gray-600 hover:text-primary-700"
                >
                  {item.label}
                </Link>
                <button
                  type="button"
                  aria-label={favorited ? "Remove favorite" : "Add favorite"}
                  onClick={() => onToggleFavorite(item)}
                  className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-amber-500 opacity-80 hover:bg-amber-50 hover:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                >
                  {favorited ? (
                    <FaStar className="h-3.5 w-3.5" aria-hidden />
                  ) : (
                    <FaRegStar className="h-3.5 w-3.5" aria-hidden />
                  )}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    )}
  </section>
);

/**
 * Shared paste + recents/favorites panel.
 * Shown inside the on-demand utilities drawer / bottom sheet.
 */
const ToolUtilityRail = ({ onClose, showClose = false }) => {
  const { recents, favorites } = useSyncExternalStore(
    subscribeRecents,
    getRecentsSnapshot,
    () => ({ recents: [], favorites: [] })
  );

  const handleToggleFavorite = useCallback((item) => {
    toggleFavorite(item);
  }, []);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex h-7 shrink-0 items-center justify-between gap-2 px-0.5">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          Utilities
        </p>
        {showClose && (
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-400 hover:bg-gray-100 hover:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            aria-label="Close utilities"
          >
            <FaTimes className="h-3.5 w-3.5" aria-hidden />
          </button>
        )}
      </div>

      <SharedPasteBar variant="rail" />

      <div className="space-y-4 py-0.5">
        <RailLinkList
          title="Favorites"
          items={favorites}
          emptyLabel="Star a tool to pin it here."
          onToggleFavorite={handleToggleFavorite}
        />
        <RailLinkList
          title="Recents"
          items={recents}
          emptyLabel="Tools you open show up here."
          onToggleFavorite={handleToggleFavorite}
        />
      </div>
    </div>
  );
};

export default ToolUtilityRail;
