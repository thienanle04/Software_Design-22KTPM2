import React from 'react';
import styles from '/src/styles/NotFound.module.css'; // Scoped styles

function NotFound() {
  return (
    <div className={styles.container}>
      <section className={styles.home}>
        <div className={styles.image}>
          <img
            src="/src/assets/images/Scarecrow.png"
            alt="Scarecrow"
            width="100px"
          />
        </div>

        <div className={styles.content}>
          <h1>I have bad news for you</h1>
          <p>The page you are looking for might be removed or is temporarily unavailable</p>
          <a href="/" className={styles.btn}>Back to Homepage</a>
        </div>
      </section>
    </div>
  );
}

export default NotFound;