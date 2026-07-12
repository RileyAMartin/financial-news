import styles from "./ProjectOverview.module.css";
import architecturalDiagram from "/architectural_diagram.svg";

export default function ProjectOverview() {
  return (
    <div className={styles.projectOverview}>
      <div className={styles.portfolioLinks}>
        <a href="https://github.com/RileyAMartin" target="_blank" rel="noopener noreferrer" className={styles.portfolioButton}>
          GitHub Profile
        </a>
        <a href="https://rileymartin.me" target="_blank" rel="noopener noreferrer" className={styles.portfolioButton}>
          Personal Portfolio
        </a>
      </div>

      <div className={styles.content}>
        <h1>About The Project</h1>
        <p>
          This platform is an end-to-end data engineering project designed to automatically ingest, model, and visualise global financial data. The goal was to build a centralised monitor that connects daily currency fluctuations and macro-economic indicators with the headlines driving them.
        </p>
        <p>
          The entire pipeline utilises modular architecture, data warehousing, and automated orchestration to schedule and run each pipeline.
        </p>

        <h3>The Tech Stack</h3>
        <ul>
          <li><strong>Orchestration:</strong> Apache Airflow</li>
          <li><strong>Ingestion / Compute:</strong> GCP Cloud Functions</li>
          <li><strong>Data Warehouse:</strong> Google BigQuery</li>
          <li><strong>Data Transformation:</strong> dbt</li>
          <li><strong>Operational Database:</strong> PostgreSQL</li>
          <li><strong>Backend API:</strong> Node.js / Express</li>
          <li><strong>Frontend Dashboard:</strong> React</li>
        </ul>

        <h2>System Architecture & Data Flow</h2>
        <a href={architecturalDiagram} target="_blank" rel="noopener noreferrer" className={styles.diagramLink}>
          <img src={architecturalDiagram} alt="System Architecture Diagram" className={styles.architectureDiagram} />
        </a>

        <h3>1. Ingestion & Orchestration (EL)</h3>
        <p>
          The pipeline begins with <strong>Apache Airflow</strong>, which acts as the central orchestration engine of the project. To ensure a highly modular system that is easy to maintain and modify, the workflows are split into decoupled DAGs based on the update schedules of the different data sources:
        </p>
        <ul>
          <li><code>hourly_news_dag</code>: Pulls real-time financial articles from RSS feeds.</li>
          <li><code>daily_fx_dag</code>: Ingests currency data from the Yahoo Finance API.</li>
          <li><code>weekly_economics_dag</code>: Fetches macro-economic indicators from the IMF QNEA API.</li>
        </ul>
        <p>
          Instead of running heavy, continuous compute servers, Airflow triggers lightweight, stateless <strong>GCP Cloud Functions</strong>. These functions handle the network requests, catch API errors, and stream the raw payloads directly into the data warehouse.
        </p>

        <h3>2. Warehousing & Data Transformation (T)</h3>
        <p>
          Raw data lands in <strong>Google BigQuery</strong>, which serves as the analytics data warehouse. To maintain clean data lineage, the warehouse is split into explicit layers managed by <strong>dbt</strong>:
        </p>
        <ul>
          <li><strong>Staging Layer:</strong> Raw data is ingested as-is, isolating upstream API quirks from downstream dependencies.</li>
          <li><strong>Intermediate Layer:</strong> Data cleaning happens here. This includes standardising diverse formats, managing text-based country keyword tagging, and utilising custom dbt macros to parse complex strings—like the IMF's unconventional date formatting.</li>
          <li><strong>Marts Layer:</strong> Data is modeled using a classic <strong>Star Schema</strong> optimised for analytical queries, splitting the data into clean Fact tables (<code>fct_fx</code>, <code>fct_news</code>, <code>fct_economics</code>) and Dimension tables (<code>dim_countries</code>, <code>dim_currencies</code>, <code>dim_date</code>).</li>
        </ul>

        <h3>3. Operational Serving (Reverse ETL & API)</h3>
        <p>
          While BigQuery is incredible for heavy transformations and deep analytical scans, it is not designed to serve fast, concurrent queries to a web application frontend.
        </p>
        <p>
          To bridge this gap, a <strong>Reverse ETL Cloud Function</strong> syncs the final, modeled data down into a transactional <strong>PostgreSQL</strong> database.
        </p>
        <p>
          The <strong>Node.js & Express</strong> backend queries this Postgres instance using an isolated repository pattern. To ensure security and system reliability, the backend leverages strict custom validation middlewares to filter parameters like country codes, currency formats, and pagination limits before hitting the database.
        </p>

        <h3>4. User Interface</h3>
        <p>
          The final layer is an interactive <strong>React</strong> dashboard. It communicates with the backend via a REST API, pulling clean JSON payloads to display cross-correlated economic trends, exchange rates, and news metrics in a responsive interface.
        </p>

        <h2>Engineering Challenges & Lessons Learned</h2>

        <h3>Balancing Transactional vs. Analytical Workloads</h3>
        <p>
          One of the earliest decisions was choosing how to serve data to the dashboard. Initially, it seemed simpler to have the Node.js backend query BigQuery directly. However, analytical warehouses are optimised for columns and mass aggregations, not rapid, concurrent row lookups for a web UI. Implementing an explicit Reverse ETL process to push data to PostgreSQL significantly optimised response times and mimics production architectures where OLAP and OLTP systems are separated.
        </p>

        <h3>Creating a Flexible Data Architecture</h3>
        <p>
          Initially, the data pipeline wasn't able to handle changes made to upstream data. For instance, if the logic for mapping news articles to different countries changed, there would be no way to easily update the presentation database. To make the pipeline architecture more flexible, I implemented full refresh and watermarked update capabilities in the Reverse ETL function, allowing the database to update or refresh based on adjustments to upstream data.
        </p>


        <h3>Making a Safe API</h3>
        <p>
          Building a dashboard meant expecting diverse parameters from user inputs. The Node.js layer was designed defensively, implementing robust modular components and customised testing suites to ensure that query constraints (like date ranges, frequencies, and country formatting) are completely validated at the gateway level.
        </p>
      </div>
    </div>
  );
}
