import { useEffect, useRef } from "react";
import PropTypes from "prop-types";
import styles from "./newsFeed.module.css";
import { UI_CONSTANTS } from "../../utils/constants";

// Renders an infinite-scroll news feed for a given country/currency context
export function NewsFeed({ items, hasMore, loading, error, onLoadMore }) {
  const triggerRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!triggerRef.current || !hasMore || loading || error || items.length === 0) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onLoadMore();
        }
      },
      { 
        root: containerRef.current,
        rootMargin: UI_CONSTANTS.NEWS.INTERSECTION_ROOT_MARGIN 
      }
    );

    observer.observe(triggerRef.current);
    return () => observer.disconnect();
  }, [items.length, hasMore, loading, error, onLoadMore]);

  const formatDate = (dateString) => {
    if (!dateString) return "--/--/---- --:--";
    const d = new Date(dateString);
    const date = d.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" });
    const time = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
    return `${date} ${time}`;
  };

  return (
    <section className={styles.newsPanel}>
      <div className={styles.newsFeed} ref={containerRef}>
        {!loading && items.length === 0 && !error && !hasMore && (
          <div className={styles.endOfFeedCard}>
            <p>No news articles matched this filter.</p>
          </div>
        )}

        {items.map((article, index) => (
          <article className={styles.newsListItem} key={`${article.url || "article"}-${index}`}>
            <span className={styles.newsTimestamp}>{formatDate(article.published_at)}</span>
            <a
              href={article.url || "#"}
              target="_blank"
              rel="noreferrer"
              className={styles.newsTitle}
            >
              {article.title}
            </a>
            <span className={styles.feedName}>
              [{(article.feed_name || UI_CONSTANTS.NEWS.FALLBACK_SOURCE).replace(/_/g, " ").toUpperCase()}]
            </span>
          </article>
        ))}

        {(loading || (items.length === 0 && hasMore && !error)) && (
          <div style={{ color: "var(--color-terminal-header)", padding: "0.5rem" }}>LOADING...</div>
        )}

        {error && (
          <div style={{ color: "var(--color-terminal-neg)", padding: "0.5rem" }}>ERROR: {error}</div>
        )}

        {!loading && !hasMore && items.length > 0 && (
          <div className={styles.endOfFeedCard}>
            <p>EOF</p>
          </div>
        )}

        <div className={styles.feedTrigger} ref={triggerRef} />
      </div>
    </section>
  );
}

NewsFeed.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      origin: PropTypes.string,
      title: PropTypes.string,
      link: PropTypes.string,
      pub_date: PropTypes.string,
    })
  ).isRequired,
  hasMore: PropTypes.bool,
  loading: PropTypes.bool,
  error: PropTypes.string,
  onLoadMore: PropTypes.func.isRequired,
};
