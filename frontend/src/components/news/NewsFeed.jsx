import { useEffect, useRef } from "react";
import styles from "./newsFeed.module.css";

export function NewsFeed({
  items,
  hasMore,
  loading,
  error,
  onLoadMore,
}) {
  const triggerRef = useRef(null);

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
      { rootMargin: "180px 0px" }
    );

    observer.observe(triggerRef.current);
    return () => observer.disconnect();
  }, [items.length, hasMore, loading, error, onLoadMore]);

  return (
    <section className={`panel ${styles.newsPanel}`}>
      <div className={styles.panelTitleRow}>
        <h2>News Feed</h2>
        <span>{items.length} articles</span>
      </div>

      <div className={styles.newsFeed}>
        {!loading && items.length === 0 && !error && (
          <article className={`${styles.newsCard} ${styles.endOfFeedCard}`} aria-live="polite">
            <p>No news articles matched this filter.</p>
          </article>
        )}

        {items.map((article, index) => (
          <article className={styles.newsCard} key={`${article.url || "article"}-${index}`}>
            <a
              href={article.url || "#"}
              target="_blank"
              rel="noreferrer"
              className={styles.newsTitle}
            >
              {article.title}
            </a>

            <p>{(article.summary || "No summary available").slice(0, 180)}...</p>

            <div className={styles.newsMetaRow}>
              <span className={styles.feedName}>
                {(article.feed_name || "Unknown source")
                  .replace(/_/g, " ")
                  .toUpperCase()}
              </span>
              <a href={article.url || "#"} target="_blank" rel="noreferrer">
                Source
              </a>
            </div>

            <div className={styles.tags}>
              {(article.country_codes || []).map((countryCode) => (
                <span className={styles.tag} key={`${article.url || index}-${countryCode}`}>
                  {countryCode}
                </span>
              ))}
            </div>
          </article>
        ))}

        {loading && (
          <div className="status-card loading-state" role="status" aria-live="polite">
            <span className="spinner" aria-hidden="true" />
            
            <span>{items.length === 0 ? "Loading News" : "Loading More News"}</span>
          </div>
        )}

        {error && (
          <div className="status-card error" role="alert">
            {error}
          </div>
        )}

        {!loading && !hasMore && items.length > 0 && (
          <article className={`${styles.newsCard} ${styles.endOfFeedCard}`} aria-live="polite">
            <p>End of feed.</p>
          </article>
        )}

        <div className={styles.feedTrigger} ref={triggerRef} />
      </div>
    </section>
  );
}
