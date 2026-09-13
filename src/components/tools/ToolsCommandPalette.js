import React, {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { FaSearch } from "react-icons/fa";
import { TOOL_CATEGORIES, getAllTools } from "../../pages/tools/catalog";

const isEditableTarget = (target) => {
  if (!target || !(target instanceof Element)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (target.isContentEditable) return true;
  return Boolean(target.closest("[contenteditable='true']"));
};

const buildEntries = () => {
  const categories = TOOL_CATEGORIES.map((category) => ({
    id: `cat:${category.id}`,
    kind: "category",
    label: category.title,
    hint: category.shortLabel || category.title,
    path: category.path,
    searchText: `${category.title} ${category.shortLabel || ""} ${
      category.description || ""
    }`.toLowerCase(),
  }));

  const tools = getAllTools().map((tool) => ({
    id: `tool:${tool.categoryId}:${tool.id}`,
    kind: "tool",
    label: tool.label,
    hint: tool.categoryTitle,
    path: tool.path,
    searchText: `${tool.label} ${tool.shortLabel || ""} ${tool.categoryTitle} ${
      tool.id
    }`.toLowerCase(),
  }));

  return [...categories, ...tools];
};

const filterEntries = (entries, query) => {
  const q = query.trim().toLowerCase();
  if (!q) return entries;
  return entries.filter((entry) => entry.searchText.includes(q));
};

/**
 * Lightweight Cmd/Ctrl-K (and `/`) command palette for the tools catalog.
 * No third-party cmdk dependency.
 */
const ToolsCommandPalette = () => {
  const navigate = useNavigate();
  const dialogId = useId();
  const listId = useId();
  const inputRef = useRef(null);
  const dialogRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const entries = useMemo(() => buildEntries(), []);
  const results = useMemo(
    () => filterEntries(entries, query),
    [entries, query]
  );

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setActiveIndex(0);
  }, []);

  const openPalette = useCallback(() => {
    setOpen(true);
    setQuery("");
    setActiveIndex(0);
  }, []);

  const goTo = useCallback(
    (entry) => {
      if (!entry?.path) return;
      close();
      navigate(entry.path);
    },
    [close, navigate]
  );

  useEffect(() => {
    const onKeyDown = (event) => {
      const metaK =
        (event.metaKey || event.ctrlKey) &&
        !event.altKey &&
        event.key.toLowerCase() === "k";

      if (metaK) {
        event.preventDefault();
        setOpen((prev) => {
          if (prev) {
            setQuery("");
            setActiveIndex(0);
            return false;
          }
          setQuery("");
          setActiveIndex(0);
          return true;
        });
        return;
      }

      if (
        event.key === "/" &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey &&
        !isEditableTarget(event.target)
      ) {
        event.preventDefault();
        openPalette();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [openPalette]);

  useEffect(() => {
    if (!open) return undefined;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusTimer = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 0);

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        close();
        return;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveIndex((index) =>
          results.length ? (index + 1) % results.length : 0
        );
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((index) =>
          results.length
            ? (index - 1 + results.length) % results.length
            : 0
        );
        return;
      }

      if (event.key === "Enter") {
        event.preventDefault();
        const entry = results[activeIndex];
        if (entry) goTo(entry);
      }
    };

    // Basic focus trap within the dialog
    const onFocusIn = (event) => {
      if (!dialogRef.current) return;
      if (!dialogRef.current.contains(event.target)) {
        inputRef.current?.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown, true);
    document.addEventListener("focusin", onFocusIn);

    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown, true);
      document.removeEventListener("focusin", onFocusIn);
    };
  }, [open, close, results, activeIndex, goTo]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    if (activeIndex >= results.length) {
      setActiveIndex(results.length ? results.length - 1 : 0);
    }
  }, [results, activeIndex]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-start justify-center px-3 pt-[12vh] sm:px-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/35"
        aria-label="Dismiss command palette"
        onClick={close}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={dialogId}
        className="relative z-10 flex w-full max-w-lg flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl"
      >
        <h2 id={dialogId} className="sr-only">
          Search tools
        </h2>
        <div className="flex items-center gap-2 border-b border-gray-100 px-3 py-2.5">
          <FaSearch className="h-3.5 w-3.5 shrink-0 text-gray-400" aria-hidden />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search tools and categories…"
            className="min-w-0 flex-1 border-0 bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-0"
            aria-autocomplete="list"
            aria-controls={listId}
            aria-activedescendant={
              results[activeIndex]
                ? `${listId}-option-${activeIndex}`
                : undefined
            }
            autoComplete="off"
            spellCheck={false}
          />
          <kbd className="hidden shrink-0 rounded border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-[10px] font-medium text-gray-500 sm:inline">
            Esc
          </kbd>
        </div>

        <ul
          id={listId}
          role="listbox"
          aria-label="Matching tools"
          className="max-h-[min(22rem,50vh)] overflow-y-auto py-1"
        >
          {!results.length ? (
            <li className="px-3 py-6 text-center text-sm text-gray-500">
              No matches
            </li>
          ) : (
            results.map((entry, index) => {
              const isActive = index === activeIndex;
              return (
                <li key={entry.id} role="presentation">
                  <button
                    type="button"
                    id={`${listId}-option-${index}`}
                    role="option"
                    aria-selected={isActive}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => goTo(entry)}
                    className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm transition-colors ${
                      isActive
                        ? "bg-primary-50 text-primary-800"
                        : "text-gray-800 hover:bg-gray-50"
                    }`}
                  >
                    <span className="min-w-0 truncate font-medium">
                      {entry.label}
                    </span>
                    <span
                      className={`shrink-0 text-xs ${
                        isActive ? "text-primary-600" : "text-gray-400"
                      }`}
                    >
                      {entry.kind === "category" ? "Category" : entry.hint}
                    </span>
                  </button>
                </li>
              );
            })
          )}
        </ul>

        <div className="flex items-center gap-3 border-t border-gray-100 px-3 py-2 text-[11px] text-gray-400">
          <span>
            <kbd className="rounded border border-gray-200 bg-gray-50 px-1 py-0.5 font-sans">
              ↑↓
            </kbd>{" "}
            navigate
          </span>
          <span>
            <kbd className="rounded border border-gray-200 bg-gray-50 px-1 py-0.5 font-sans">
              ↵
            </kbd>{" "}
            open
          </span>
          <span className="ml-auto hidden sm:inline">
            <kbd className="rounded border border-gray-200 bg-gray-50 px-1 py-0.5 font-sans">
              ⌘K
            </kbd>{" "}
            toggle
          </span>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ToolsCommandPalette;
