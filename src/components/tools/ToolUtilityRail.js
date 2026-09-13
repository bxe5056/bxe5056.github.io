import React, { useCallback, useSyncExternalStore } from "react";
import { Link } from "react-router-dom";
import {
  FaClock,
  FaStar,
  FaRegStar,
  FaTimes,
} from "react-icons/fa";
import SharedPasteBar from "./SharedPasteBar";
import {
  getRecentsSnapshot,
  subscribeRecents,
  toggleFavorite,
  isFavorite,
} from "../../utils/tools/recents";

const MAX_VISIBLE = 8;

const RailLinkList = ({ title, icon, items, emptyLabel, onToggleFavorite }) => (
  <section>
    <h3 className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
      {icon}
      {title}
    </h3>
    {!items.length ? (
      <p className="text-xs text-slate-400">{emptyLabel}</p>
    ) : (
      <ul className="space-y-1">
        {items.slice(0, MAX_VISIBLE).map((item) => {
          const favorited = isFavorite(item.path);
          return (
            <li
              key={`${title}-${item.path}`}
              className="group flex items-center gap-1 rounded-md border border-transparent px-1.5 py-1 hover:border-gray-100 hover:bg-gray-50"
            >
              <Link
                to={item.path}
                className="min-w-0 flex-1 truncate text-sm text-gray-700 hover:text-primary-600"
              >
                {item.label}
              </Link>
              <button
                type="button"
                aria-label={favorited ? "Remove favorite" : "Add favorite"}
                onClick={() => onToggleFavorite(item)}
                className="shrink-0 rounded p-1 text-amber-500 opacity-70 hover:bg-amber-50 hover:opacity-100"
              >
                {favorited ? (
                  <FaStar className="h-3 w-3" />
                ) : (
                  <FaRegStar className="h-3 w-3" />
                )}
              </button>
            </li>
          );
        })}
      </ul>
    )}
  </section>
);

/**
 * Right utility rail: shared paste + recents/favorites.
 * Renders as an in-flow panel on desktop, or inside a drawer shell from parent.
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
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          Utilities
        </p>
        {showClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-slate-400 hover:bg-gray-100 hover:text-slate-600"
            aria-label="Close utilities"
          >
            <FaTimes className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <SharedPasteBar variant="rail" />

      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto">
        <RailLinkList
          title="Favorites"
          icon={<FaStar className="text-amber-500" aria-hidden />}
          items={favorites}
          emptyLabel="Star a tool to pin it here."
          onToggleFavorite={handleToggleFavorite}
        />
        <RailLinkList
          title="Recents"
          icon={<FaClock className="text-slate-400" aria-hidden />}
          items={recents}
          emptyLabel="Tools you open show up here."
          onToggleFavorite={handleToggleFavorite}
        />
      </div>
    </div>
  );
};

export default ToolUtilityRail;
