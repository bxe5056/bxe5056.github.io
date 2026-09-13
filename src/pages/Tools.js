import React, { useCallback, useSyncExternalStore } from "react";
import { motion } from "framer-motion";
import {
  FaImage,
  FaPalette,
  FaCode,
  FaFont,
  FaTable,
  FaVectorSquare,
  FaFilePdf,
  FaStar,
  FaRegStar,
  FaClock,
} from "react-icons/fa";
import { Link } from "react-router-dom";
import PageContainer from "../components/common/PageContainer";
import { TOOL_CATEGORIES, getToolPath } from "./tools/catalog";
import {
  getRecentsSnapshot,
  subscribeRecents,
  toggleFavorite,
  isFavorite,
} from "../utils/tools/recents";

const categoryIcons = {
  data: <FaTable className="text-2xl" />,
  pdf: <FaFilePdf className="text-2xl" />,
  color: <FaPalette className="text-2xl" />,
  svg: <FaVectorSquare className="text-2xl" />,
  image: <FaImage className="text-2xl" />,
  dev: <FaCode className="text-2xl" />,
  text: <FaFont className="text-2xl" />,
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
  },
};

const getColorClasses = (color) => {
  const colorMap = {
    blue: "bg-blue-50 text-blue-600 hover:bg-blue-100",
    green: "bg-green-50 text-green-600 hover:bg-green-100",
    purple: "bg-purple-50 text-purple-600 hover:bg-purple-100",
    orange: "bg-orange-50 text-orange-600 hover:bg-orange-100",
    pink: "bg-pink-50 text-pink-600 hover:bg-pink-100",
    teal: "bg-teal-50 text-teal-600 hover:bg-teal-100",
    red: "bg-red-50 text-red-600 hover:bg-red-100",
  };
  return colorMap[color] || colorMap.blue;
};

/** Compact chip row; returns null when empty so it never eats the fold. */
const HubStripRow = ({ title, icon, items, onToggleFavorite }) => {
  if (!items.length) return null;

  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
      <span className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-gray-500 shrink-0">
        {icon}
        {title}
      </span>
      <ul className="flex flex-wrap gap-1.5 min-w-0">
        {items.map((item) => {
          const favorited = isFavorite(item.path);
          return (
            <li
              key={`${title}-${item.path}`}
              className="inline-flex items-center gap-0.5 rounded-md bg-gray-50 border border-gray-100 pl-2 pr-0.5 py-0.5 text-sm text-gray-800"
            >
              <Link
                to={item.path}
                className="hover:text-primary-600 transition-colors"
              >
                {item.label}
              </Link>
              <button
                type="button"
                aria-label={favorited ? "Remove favorite" : "Add favorite"}
                onClick={() => onToggleFavorite(item)}
                className="p-1 rounded text-amber-500 hover:bg-amber-50 transition-colors"
              >
                {favorited ? (
                  <FaStar className="text-xs" />
                ) : (
                  <FaRegStar className="text-xs" />
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

const Tools = () => {
  const { recents, favorites } = useSyncExternalStore(
    subscribeRecents,
    getRecentsSnapshot,
    () => ({ recents: [], favorites: [] })
  );

  const handleToggleFavorite = useCallback((item) => {
    toggleFavorite(item);
  }, []);

  const hasStrip = favorites.length > 0 || recents.length > 0;

  return (
    <PageContainer>
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-3">
          Developer Tools & Utilities
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-2">
          Browse {TOOL_CATEGORIES.length} categories — jump straight into a
          tool or open a full suite from the cards below.
        </p>
        <p className="text-sm text-gray-500">
          All processing stays in your browser
        </p>
      </div>

      {hasStrip ? (
        <div className="mb-8 space-y-2.5 border-b border-gray-100 pb-5">
          <HubStripRow
            title="Favorites"
            icon={<FaStar className="text-amber-500" />}
            items={favorites}
            onToggleFavorite={handleToggleFavorite}
          />
          <HubStripRow
            title="Recents"
            icon={<FaClock className="text-gray-400" />}
            items={recents}
            onToggleFavorite={handleToggleFavorite}
          />
        </div>
      ) : null}

      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {TOOL_CATEGORIES.map((category) => (
          <motion.div
            key={category.path}
            variants={itemVariants}
            className="relative group"
          >
            <div className="h-full bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 p-6 border border-gray-100">
              <Link to={category.path} className="block">
                <div className="flex items-center mb-4">
                  {categoryIcons[category.id]}
                  <h3 className="text-xl font-semibold text-gray-900 ml-3">
                    {category.title}
                  </h3>
                </div>
                <p className="text-gray-600 mb-4">{category.description}</p>
              </Link>
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700">Tools</h4>
                <div className="flex flex-wrap gap-2">
                  {category.tools.map((tool) => {
                    const path = getToolPath(category.path, tool.id);
                    const favorited = isFavorite(path);
                    return (
                      <span
                        key={tool.id}
                        className={`inline-flex items-center gap-1 rounded-full text-sm transition-colors ${getColorClasses(
                          category.color
                        )}`}
                      >
                        <Link
                          to={path}
                          className="pl-3 py-1 pr-1 hover:underline"
                        >
                          {tool.label}
                        </Link>
                        <button
                          type="button"
                          aria-label={
                            favorited
                              ? `Unfavorite ${tool.label}`
                              : `Favorite ${tool.label}`
                          }
                          onClick={() =>
                            handleToggleFavorite({
                              path,
                              label: tool.label,
                              category: category.id,
                            })
                          }
                          className="pr-2 py-1 text-current opacity-70 hover:opacity-100"
                        >
                          {favorited ? <FaStar /> : <FaRegStar />}
                        </button>
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </PageContainer>
  );
};

export default Tools;
