import React from "react";
import styles from "./ToolScaffold.module.css";

/**
 * Standard tool body layout: Input → Controls → Preview → Output actions.
 * Presentational only - callers own all business logic and slot contents.
 */
const ToolScaffold = ({
  title,
  description,
  /** Hide title when ToolLayout / chip switcher already shows the same label. */
  hideTitle = false,
  input,
  controls,
  preview,
  actions,
  stickyActions = true,
  className = "",
}) => {
  const visibleTitle = hideTitle ? null : title;
  const showHeader = Boolean(visibleTitle || description);
  const showInput = input != null && input !== false;
  const showControls = controls != null && controls !== false;
  const showPreview = preview != null && preview !== false;
  const showActions = actions != null && actions !== false;

  return (
    <div className={`${styles.root}${className ? ` ${className}` : ""}`}>
      {showHeader && (
        <header className={styles.header}>
          {visibleTitle ? <h2 className={styles.title}>{visibleTitle}</h2> : null}
          {description ? (
            <p
              className={
                visibleTitle
                  ? styles.description
                  : `${styles.description} ${styles.descriptionAlone}`
              }
            >
              {description}
            </p>
          ) : null}
        </header>
      )}

      {showInput && (
        <section className={styles.section} aria-label="Input">
          <div className={styles.sectionLabel}>Input</div>
          <div className={styles.sectionBody}>{input}</div>
        </section>
      )}

      {showControls && (
        <section className={styles.section} aria-label="Controls">
          <div className={styles.sectionLabel}>Controls</div>
          <div className={`${styles.sectionBody} ${styles.controls}`}>
            {controls}
          </div>
        </section>
      )}

      {showPreview && (
        <section className={styles.section} aria-label="Preview">
          <div className={styles.sectionLabel}>Preview</div>
          <div className={styles.sectionBody}>{preview}</div>
        </section>
      )}

      {showActions && (
        <footer
          className={`${styles.actions}${
            stickyActions ? ` ${styles.actionsSticky}` : ""
          }`}
          aria-label="Output actions"
        >
          {actions}
        </footer>
      )}
    </div>
  );
};

export default ToolScaffold;
