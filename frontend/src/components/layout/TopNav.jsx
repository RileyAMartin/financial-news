import styles from "./TopNav.module.css";

export function TopNav() {
  return (
    <nav className={styles.topNav}>
      <div className={styles.brandBlock}>
        <span className={styles.brandCode}>FN</span>
        <div>
          <p className={styles.brandName}>International Finance</p>
          <p className={styles.brandSubtitle}>Global Dashboard</p>
        </div>
      </div>

      <div className={styles.navLinks} aria-label="Global navigation">
        <button type="button" className={styles.navLink}>
          Overview
        </button>
        <button type="button" className={`${styles.navLink} ${styles.active}`} aria-current="page">
          Dashboard
        </button>
      </div>
    </nav>
  );
}
 