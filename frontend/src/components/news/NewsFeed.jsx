import { useEffect, useRef } from "react";
import styles from "./newsFeed.module.css";
import { UI_CONSTANTS } from "../../utils/constants";
import { StatusBanner } from "../layout/StatusBanner";

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
      { rootMargin: UI_CONSTANTS.NEWS.INTERSECTION_ROOT_MARGIN }
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

            <p>{(article.summary || UI_CONSTANTS.NEWS.FALLBACK_SUMMARY).slice(0, UI_CONSTANTS.NEWS.MAX_SUMMARY_LENGTH)}...</p>

            <div className={styles.newsMetaRow}>
              <span className={styles.feedName}>
                {(article.feed_name || UI_CONSTANTS.NEWS.FALLBACK_SOURCE)
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
          <StatusBanner type="loading" message={items.length === 0 ? "Loading News" : "Loading More News"} isCard />
        )}

        {error && (
          <StatusBanner type="error" message={error} isCard />
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
