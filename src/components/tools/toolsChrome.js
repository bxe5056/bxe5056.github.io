/** Matches MainLayout `pt-16` / NavBar height on /tools* (scroll shrink locked). */
export const TOOLS_SITE_HEADER = "4rem";

/** Solid tools chrome under the site header. */
export const TOOLS_CHROME_HEIGHT = "3rem";

export const TOOLS_STICKY_TOP = TOOLS_SITE_HEADER;

export const TOOLS_RAIL_STICKY_TOP = `calc(${TOOLS_SITE_HEADER} + ${TOOLS_CHROME_HEIGHT})`;

export const TOOLS_WORKSPACE_OFFSET = `calc(${TOOLS_SITE_HEADER} + ${TOOLS_CHROME_HEIGHT})`;
