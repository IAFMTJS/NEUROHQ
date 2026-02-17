# DARK COMMANDER – STEP 2
Home Screen Implementation
Uses ONLY tokens from DESIGN_SYSTEM.md

---

# 1. HTML STRUCTURE

<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Dark Commander</title>
  <link rel="stylesheet" href="styles.css" />
</head>
<body>

  <div class="container">

    <!-- HEADER -->
    <header>
      <h1>Commander</h1>
      <p class="text-soft">System Overview</p>
    </header>

    <!-- MASCOT SECTION -->
    <section class="card mascot-card">
      <div class="mascot-wrapper">
        <img src="mascot.png" alt="Mascot" />
      </div>
    </section>

    <!-- STAT SECTION -->
    <section class="stats">

      <div class="stat-ring energy">
        <div class="stat-inner">
          <span>82%</span>
        </div>
      </div>

      <div class="stat-ring focus">
        <div class="stat-inner">
          <span>65%</span>
        </div>
      </div>

      <div class="stat-ring load">
        <div class="stat-inner">
          <span>30%</span>
        </div>
      </div>

    </section>

    <!-- PRIMARY ACTION -->
    <button class="primary-btn">
      Start Mission
    </button>

    <!-- STATUS CARD -->
    <section class="card">
      <h3>Brain Status</h3>
      <div class="progress">
        <div class="progress-fill" style="width:65%"></div>
      </div>
      <p class="text-soft">Focus stability at 65%</p>
    </section>

  </div>

  <!-- BOTTOM NAV -->
  <nav class="bottom-nav">
    <div class="nav-item active">Home</div>
    <div class="nav-item">Missions</div>
    <div class="nav-item">Growth</div>
  </nav>

</body>
</html>

---

# 2. ADDITIONAL CSS (EXTENSIONS TO DESIGN SYSTEM)

Add this to styles.css after tokens + components.

---

/* Background Layer */

body {
  margin: 0;
  background:
    radial-gradient(circle at 50% 20%, rgba(37,99,235,0.12), transparent 60%),
    var(--bg-main);
  color: var(--text-main);
  font-family: Inter, system-ui, sans-serif;
}

/* Header */

header h1 {
  font-size: 28px;
  margin: 0;
}

.text-soft {
  color: var(--text-soft);
  font-size: 13px;
}

/* Mascot */

.mascot-card {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 32px;
}

.mascot-wrapper {
  width: 140px;
  height: 140px;
  border-radius: 50%;
  background: var(--bg-elevated);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 30px var(--glow-cyan);
}

.mascot-wrapper img {
  width: 80%;
  object-fit: contain;
}

/* Stats Layout Override */

.stats {
  margin-top: 8px;
}

/* Navigation Fix */

.bottom-nav {
  position: fixed;
  bottom: 0;
  width: 100%;
}

.container {
  padding-bottom: 100px;
}

---

# 3. STRICT RULES

- Do not change spacing scale
- Do not introduce new shadows
- Do not introduce new border radii
- Do not add glow outside defined values
- If a new component is needed, derive it from .card or .primary-btn

---

END OF STEP 2