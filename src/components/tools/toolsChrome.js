/**
 * Matches MainLayout `pt-16`. NavBar height is locked to 4rem on /tools*
 * so sticky chrome at this offset stays flush (no 8px scroll gap).
 */
export const TOOLS_SITE_HEADER = "4rem";

/** Solid tools chrome under the site header (dense single row). */
export const TOOLS_CHROME_HEIGHT = "2.75rem";

export const TOOLS_STICKY_TOP = TOOLS_SITE_HEADER;

export const TOOLS_RAIL_STICKY_TOP = `calc(${TOOLS_SITE_HEADER} + ${TOOLS_CHROME_HEIGHT})`;

export const TOOLS_WORKSPACE_OFFSET = `calc(${TOOLS_SITE_HEADER} + ${TOOLS_CHROME_HEIGHT})`;

/** localStorage key for left tools rail collapsed preference. */
export const TOOLS_RAIL_COLLAPSED_KEY = "tools-rail-collapsed";

export const TOOLS_RAIL_WIDTH = "13.75rem";
export const TOOLS_RAIL_WIDTH_COLLAPSED = "3.25rem";
