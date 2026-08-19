// app.js

"use strict";

/*
  ============================================================
  FINORA AI — FRONTEND FINANCIAL DECISION-MAKING DEMO
  ============================================================

  Architecture overview:
  1. MOCK_DB contains the client-side demo "database".
  2. State is kept in a small local object so the UI can evolve
     without coupling every function directly to DOM elements.
  3. Rendering functions transform state/data into UI.
  4. Event handlers keep user interaction separate from rendering.
  5. The AI advisor uses Promise + setTimeout to simulate an API.
  6. A real backend can later replace simulateAIResponse() with
     fetch("/api/advisor", {...}) without redesigning the UI.

  IMPORTANT:
  This is a frontend-only simulation. It does not connect to real
  banks, brokerage accounts, payment providers, or AI services.
*/

// ============================================================
// 1. MOCK DATABASE
// ============================================================

const MOCK_DB = {
  user: {
    firstName: "Precious",
    displayName: "Precious M.",
    initials: "PM"
  },

  metrics: {
    totalBalance: 18420.72,
    balanceChange: 8.6,

    monthlyExpenses: 3268.48,
    expenseChange: -4.2,

    riskScore: 82
  },

  chart: {
    sixMonthLabels: ["Mar", "Apr", "May", "Jun", "Jul", "Aug"],
    sixMonthBalance: [10800, 12150, 11720, 14380, 16240, 18420],
    sixMonthIncome: [7100, 6900, 7450, 7900, 8200, 8500],

    oneYearLabels: [
      "Sep", "Oct", "Nov", "Dec",
      "Jan", "Feb", "Mar", "Apr",
      "May", "Jun", "Jul", "Aug"
    ],
    oneYearBalance: [
      8600, 9100, 9700, 10300,
      10800, 11200, 10800, 12150,
      11720, 14380, 16240, 18420
    ],
    oneYearIncome: [
      6500, 6700, 6550, 7000,
      7100, 7050, 7100, 6900,
      7450, 7900, 8200, 8500
    ]
  },

  allocations: [
    {
      name: "Housing",
      amount: 1200,
      percent: 36.7,
      color: "#059669"
    },
    {
      name: "Food & Dining",
      amount: 640,
      percent: 19.6,
      color: "#34d399"
    },
    {
      name: "Transport",
      amount: 438,
      percent: 13.4,
      color: "#fbbf24"
    },
    {
      name: "Shopping",
      amount: 362,
      percent: 11.1,
      color: "#60a5fa"
    },
    {
      name: "Other",
      amount: 628.48,
      percent: 19.2,
      color: "#cbd5e1"
    }
  ],

  transactions: [
    {
      name: "Salary Deposit",
      category: "Income",
      date: "Aug 18",
      amount: 8500,
      type: "income",
      icon: "↗"
    },
    {
      name: "Apartment Rent",
      category: "Housing",
      date: "Aug 15",
      amount: -1200,
      type: "expense",
      icon: "⌂"
    },
    {
      name: "Groceries",
      category: "Food & Dining",
      date: "Aug 14",
      amount: -186.45,
      type: "expense",
      icon: "▦"
    },
    {
      name: "Index Fund",
      category: "Investment",
      date: "Aug 12",
      amount: -450,
      type: "expense",
      icon: "↗"
    },
    {
      name: "Ride Share",
      category: "Transport",
      date: "Aug 10",
      amount: -38.2,
      type: "expense",
      icon: "→"
    }
  ],

  goals: [
    {
      name: "Emergency Fund",
      current: 6800,
      target: 10000,
      percent: 68
    },
    {
      name: "New Laptop",
      current: 1540,
      target: 2200,
      percent: 70
    },
    {
      name: "Investment Reserve",
      current: 3200,
      target: 5000,
      percent: 64
    }
  ],

  investments: [
    {
      symbol: "VOO",
      type: "ETF",
      price: 582.17,
      change: "+3.8%",
      weight: 42
    },
    {
      symbol: "QQQ",
      type: "ETF",
      price: 512.64,
      change: "+5.2%",
      weight: 29
    },
    {
      symbol: "BND",
      type: "Bond ETF",
      price: 74.82,
      change: "+1.4%",
      weight: 17
    },
    {
      symbol: "Cash",
      type: "Liquidity",
      price: 2190.32,
      change: "Stable",
      weight: 12
    }
  ]
};

// ============================================================
// 2. APPLICATION STATE
// ============================================================

const state = {
  chartRange: "6m",
  advisorLoading: false,
  lastAdvisorQuestion: "",
  mobileNavOpen: false,
  searchOpen: false
};

// ============================================================
// 3. DOM CACHE
// ============================================================

const dom = {
  sidebar: document.getElementById("sidebar"),
  navOverlay: document.getElementById("navOverlay"),
  mobileMenuButton: document.getElementById("mobileMenuButton"),

  totalBalance: document.getElementById("totalBalance"),
  monthlyExpenses: document.getElementById("monthlyExpenses"),
  riskScore: document.getElementById("riskScore"),
  riskLabel: document.getElementById("riskLabel"),
  riskMeterFill: document.getElementById("riskMeterFill"),

  balanceChange: document.getElementById("balanceChange"),
  expenseChange: document.getElementById("expenseChange"),

  balanceChart: document.getElementById("balanceChart"),
  chartLinePath: document.getElementById("chartLinePath"),
  chartAreaPath: document.getElementById("chartAreaPath"),
  chartPoints: document.getElementById("chartPoints"),
  chartXAxis: document.getElementById("chartXAxis"),

  allocationList: document.getElementById("allocationList"),
  donutTotal: document.getElementById("donutTotal"),

  advisorForm: document.getElementById("advisorForm"),
  advisorInput: document.getElementById("advisorInput"),
  advisorSubmit: document.getElementById("advisorSubmit"),
  advisorResponse: document.getElementById("advisorResponse"),

  transactionList: document.getElementById("transactionList"),
  goalsList: document.getElementById("goalsList"),
  investmentGrid: document.getElementById("investmentGrid"),

  searchButton: document.getElementById("searchButton"),
  searchModal: document.getElementById("searchModal"),
  searchInput: document.getElementById("searchInput"),
  searchResults: document.getElementById("searchResults"),

  notificationButton: document.getElementById("notificationButton"),
  notificationsPopover: document.getElementById("notificationsPopover"),

  accountMenuButton: document.getElementById("accountMenuButton"),
  accountPopover: document.getElementById("accountPopover"),

  upgradeButton: document.getElementById("upgradeButton"),
  addGoalButton: document.getElementById("addGoalButton"),

  viewTransactionsButton: document.getElementById("viewTransactionsButton"),

  toast: document.getElementById("toast"),
  toastIcon: document.getElementById("toastIcon"),
  toastMessage: document.getElementById("toastMessage")
};

// ============================================================
// 4. FORMATTERS / UTILITY FUNCTIONS
// ============================================================

/**
 * Formats a number as a US dollar value.
 *
 * In a real application, currency and locale should probably
 * come from user settings rather than being hard-coded.
 */
const formatCurrency = (
  value,
  {
    maximumFractionDigits = 2,
    minimumFractionDigits = 2
  } = {}
) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits,
    minimumFractionDigits
  }).format(value);

/**
 * Small helper for creating safe HTML text.
 *
 * The demo does not accept raw HTML from the AI query, but
 * escaping user-provided text is still a good habit for UI code.
 */
const escapeHTML = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

/**
 * Simulates a small amount of asynchronous work.
 */
const wait = (milliseconds) =>
  new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });

// ============================================================
// 5. RENDER DASHBOARD METRICS
// ============================================================

const getRiskLabel = (score) => {
  if (score >= 80) return "Strong position";
  if (score >= 65) return "Healthy";
  if (score >= 50) return "Moderate";
  return "Needs attention";
};

const renderMetrics = () => {
  const {
    totalBalance,
    balanceChange,
    monthlyExpenses,
    expenseChange,
    riskScore
  } = MOCK_DB.metrics;

  dom.totalBalance.textContent = formatCurrency(totalBalance);
  dom.monthlyExpenses.textContent = formatCurrency(monthlyExpenses);

  dom.balanceChange.textContent =
    `${balanceChange >= 0 ? "+" : ""}${balanceChange.toFixed(1)}%`;

  dom.expenseChange.textContent =
    `${expenseChange >= 0 ? "+" : ""}${expenseChange.toFixed(1)}%`;

  dom.expenseChange.classList.toggle(
    "metric-change--positive",
    expenseChange < 0
  );

  dom.expenseChange.classList.toggle(
    "metric-change--negative",
    expenseChange >= 0
  );

  dom.riskScore.textContent = riskScore;
  dom.riskLabel.textContent = getRiskLabel(riskScore);

  /*
    The fill percentage is deliberately tied directly to the
    score so the visual remains understandable to a beginner.
  */
  window.requestAnimationFrame(() => {
    dom.riskMeterFill.style.width = `${riskScore}%`;
  });
};

// ============================================================
// 6. CHART RENDERING
// ============================================================

/**
 * Converts an array of values into SVG path coordinates.
 *
 * This approach avoids external charting libraries while still
 * producing a smooth responsive financial chart.
 */
const buildChartPath = (values, width, height, padding = 12) => {
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const valueRange = maxValue - minValue || 1;

  const stepX = (width - padding * 2) / Math.max(values.length - 1, 1);

  const points = values.map((value, index) => {
    const x = padding + index * stepX;

    const normalized = (value - minValue) / valueRange;
    const y =
      height -
      padding -
      normalized * (height - padding * 2);

    return { x, y };
  });

  const line = points
    .map((point, index) => {
      if (index === 0) {
        return `M${point.x},${point.y}`;
      }

      const previous = points[index - 1];

      /*
        A simple midpoint-based curve creates a smoother visual
        without needing a charting dependency.
      */
      const midpointX = (previous.x + point.x) / 2;

      return [
        `C${midpointX},${previous.y}`,
        `${midpointX},${point.y}`,
        `${point.x},${point.y}`
      ].join(" ");
    })
    .join(" ");

  const area = `${line}
    L${points.at(-1).x},${height}
    L${points[0].x},${height}
    Z`;

  return { line, area, points };
};

const getChartData = () => {
  if (state.chartRange === "1y") {
    return {
      labels: MOCK_DB.chart.oneYearLabels,
      balance: MOCK_DB.chart.oneYearBalance
    };
  }

  return {
    labels: MOCK_DB.chart.sixMonthLabels,
    balance: MOCK_DB.chart.sixMonthBalance
  };
};

const renderChart = () => {
  const chartWidth = 900;
  const chartHeight = 340;

  const { labels, balance } = getChartData();

  const { line, area, points } = buildChartPath(
    balance,
    chartWidth,
    chartHeight,
    18
  );

  dom.chartLinePath.setAttribute("d", line);
  dom.chartAreaPath.setAttribute("d", area);

  dom.chartPoints.innerHTML = points
    .map(
      ({ x, y }, index) => `
        <circle
          class="chart-point"
          cx="${x}"
          cy="${y}"
          r="6"
          fill="#ffffff"
          stroke="#059669"
          stroke-width="4"
          data-point-index="${index}"
          tabindex="0"
          aria-label="${escapeHTML(labels[index])}: ${formatCurrency(balance[index], {
            maximumFractionDigits: 0,
            minimumFractionDigits: 0
          })}"
        ></circle>
      `
    )
    .join("");

  dom.chartXAxis.innerHTML = labels
    .map((label) => `<span>${escapeHTML(label)}</span>`)
    .join("");

  /*
    The path lives inside a viewBox, therefore it scales with the
    chart container automatically on smaller screens.
  */
};

// ============================================================
// 7. ALLOCATION RENDERING
// ============================================================

const renderAllocations = () => {
  const total = MOCK_DB.allocations.reduce(
    (sum, category) => sum + category.amount,
    0
  );

  dom.donutTotal.textContent = formatCurrency(total, {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0
  });

  dom.allocationList.innerHTML = MOCK_DB.allocations
    .map(
      (category) => `
        <div class="allocation-item">
          <div class="allocation-item__main">
            <div class="allocation-item__top">
              <span class="allocation-item__name">
                <i
                  class="legend-dot"
                  style="background:${category.color}"
                  aria-hidden="true"
                ></i>
                ${escapeHTML(category.name)}
              </span>
              <span class="allocation-item__percent">
                ${category.percent.toFixed(1)}%
              </span>
            </div>

            <div class="allocation-item__bottom">
              <span class="allocation-item__amount">
                ${formatCurrency(category.amount)}
              </span>

              <div class="allocation-item__bar" aria-hidden="true">
                <div
                  class="allocation-item__fill"
                  style="width:${category.percent}%;background:${category.color}"
                ></div>
              </div>
            </div>
          </div>
        </div>
      `
    )
    .join("");
};

// ============================================================
// 8. TRANSACTION RENDERING
// ============================================================

const renderTransactions = () => {
  dom.transactionList.innerHTML = MOCK_DB.transactions
    .map((transaction) => {
      const amountPrefix = transaction.amount >= 0 ? "+" : "";

      return `
        <article class="transaction-item">
          <span
            class="transaction-icon transaction-icon--${transaction.type}"
            aria-hidden="true"
          >
            ${escapeHTML(transaction.icon)}
          </span>

          <div class="transaction-item__main">
            <div class="transaction-item__name">
              ${escapeHTML(transaction.name)}
            </div>

            <div class="transaction-item__meta">
              <span>${escapeHTML(transaction.category)}</span>
              <span>•</span>
              <span>${escapeHTML(transaction.date)}</span>
            </div>
          </div>

          <div
            class="transaction-item__amount transaction-item__amount--${transaction.type}"
          >
            ${amountPrefix}${formatCurrency(Math.abs(transaction.amount))}
          </div>
        </article>
      `;
    })
    .join("");
};

// ============================================================
// 9. GOALS RENDERING
// ============================================================

const renderGoals = () => {
  dom.goalsList.innerHTML = MOCK_DB.goals
    .map(
      (goal) => `
        <article class="goal-item">
          <div class="goal-item__header">
            <span class="goal-item__name">${escapeHTML(goal.name)}</span>
            <span class="goal-item__percent">${goal.percent}%</span>
          </div>

          <div
            class="goal-item__progress"
            role="progressbar"
            aria-valuemin="0"
            aria-valuemax="100"
            aria-valuenow="${goal.percent}"
            aria-label="${escapeHTML(goal.name)} progress"
          >
            <div
              class="goal-item__fill"
              style="width:${goal.percent}%"
            ></div>
          </div>

          <div class="goal-item__progress-row">
            <span class="goal-item__meta">
              ${formatCurrency(goal.current)}
            </span>
            <span class="goal-item__meta">
              ${formatCurrency(goal.target)}
            </span>
          </div>
        </article>
      `
    )
    .join("");
};

// ============================================================
// 10. INVESTMENT RENDERING
// ============================================================

const renderInvestments = () => {
  dom.investmentGrid.innerHTML = MOCK_DB.investments
    .map(
      (investment) => `
        <article class="investment-item">
          <div class="investment-item__top">
            <span class="investment-item__symbol">
              ${escapeHTML(investment.symbol)}
            </span>

            <span class="investment-item__type">
              ${escapeHTML(investment.type)}
            </span>
          </div>

          <div class="investment-item__price">
            ${formatCurrency(investment.price)}
          </div>

          <div class="investment-item__change">
            ${escapeHTML(investment.change)}
          </div>

          <div
            class="investment-mini-bar"
            aria-label="${investment.weight}% portfolio allocation"
          >
            <span style="width:${investment.weight}%"></span>
          </div>
        </article>
      `
    )
    .join("");
};

// ============================================================
// 11. AI RESPONSE ENGINE
// ============================================================

/**
 * Generates a deterministic simulated recommendation.
 *
 * A real backend can eventually replace this function with an
 * API request. Everything above this boundary should remain
 * largely unchanged.
 */
const createAIRecommendation = (question) => {
  const normalized = question.toLowerCase();

  const emergencyFundStrong =
    MOCK_DB.goals.find((goal) => goal.name === "Emergency Fund")?.percent ?? 0;

  let decision = "Build liquidity first";
  let confidence = 91;

  let rationale = [
    "Your current profile has a healthy balance, but your emergency reserve is not yet fully funded.",
    "Maintaining accessible cash reduces the chance that a short-term expense forces you to sell investments at an inconvenient time.",
    "Once your cash buffer is stronger, excess monthly cash flow can be redirected toward longer-term assets."
  ];

  let riskLevel = "Moderate";
  let action = "Keep the decision reversible while strengthening your cash position.";

  /*
    Simple intent detection is enough for a frontend demo.
    Later, the backend/AI model would understand the language.
  */

  if (
    normalized.includes("invest") ||
    normalized.includes("stock") ||
    normalized.includes("stocks") ||
    normalized.includes("portfolio")
  ) {
    if (emergencyFundStrong >= 75) {
      decision = "Invest a measured portion";
      confidence = 94;

      rationale = [
        "Your emergency-fund progress is relatively strong, which gives you more flexibility to allocate surplus cash toward long-term growth.",
        "A diversified approach is preferable to concentrating the entire amount in a single technology stock or theme.",
        "The investment should fit a multi-year time horizon and be money you can leave untouched through market volatility."
      ];

      riskLevel = "Moderate–Low";
      action =
        "Consider investing gradually rather than committing the full amount at once.";
    } else {
      decision = "Split the amount";
      confidence = 93;

      rationale = [
        `Your emergency fund is currently around ${emergencyFundStrong}% funded, so liquidity still has meaningful value.`,
        "Allocating part of the amount to cash and part toward diversified investments creates a balance between resilience and long-term growth.",
        "This reduces the impact of making one large decision at a single market price."
      ];

      riskLevel = "Moderate";
      action =
        "Prioritize the cash buffer, then invest the remainder using a diversified strategy.";
    }
  }

  if (
    normalized.includes("expense") ||
    normalized.includes("spending") ||
    normalized.includes("budget")
  ) {
    decision = "Target high-frequency spending";
    confidence = 96;

    rationale = [
      "Your largest spending categories provide the best opportunity for improvement without requiring a complete lifestyle reset.",
      "Small recurring expenses are easier to optimize than large fixed commitments.",
      "A focused monthly target is more sustainable than an aggressive short-term spending cut."
    ];

    riskLevel = "Low";
    action =
      "Set a monthly reduction target and review the top three variable categories every week.";
  }

  if (
    normalized.includes("save") ||
    normalized.includes("saving") ||
    normalized.includes("savings")
  ) {
    decision = "Increase automated savings";
    confidence = 95;

    rationale = [
      "Your current balance provides room to improve your savings rate without requiring extreme changes.",
      "Automation helps convert good intentions into consistent behavior.",
      "A dedicated goal-based account makes progress easier to measure and reduces accidental spending."
    ];

    riskLevel = "Low";
    action =
      "Automate a fixed transfer immediately after each income event.";
  }

  if (
    normalized.includes("debt") ||
    normalized.includes("loan") ||
    normalized.includes("credit")
  ) {
    decision = "Prioritize expensive debt";
    confidence = 97;

    rationale = [
      "High-interest debt can reduce the effective return of other financial strategies.",
      "Reducing expensive debt produces a more predictable benefit than chasing uncertain investment gains.",
      "Once costly balances are controlled, the freed cash flow can strengthen savings and investing."
    ];

    riskLevel = "Low–Moderate";
    action =
      "Attack the highest-cost debt first while preserving a basic emergency reserve.";
  }

  return {
    decision,
    confidence,
    riskLevel,
    action,
    rationale,
    emergencyFundStrong
  };
};

/**
 * Fake AI request.
 *
 * The function intentionally returns a Promise and uses setTimeout
 * to model network latency and backend processing time.
 */
const simulateAIResponse = async (question) => {
  /*
    Variable latency makes the frontend feel more realistic than
    using one fixed delay every time.
  */
  const latency = 1200 + Math.floor(Math.random() * 1000);

  await wait(latency);

  const recommendation = createAIRecommendation(question);

  return {
    question,
    recommendation
  };
};

// ============================================================
// 12. RENDER AI RESPONSE
// ============================================================

const renderAIResponse = ({ question, recommendation }) => {
  const {
    decision,
    confidence,
    riskLevel,
    action,
    rationale,
    emergencyFundStrong
  } = recommendation;

  const nextSteps = [
    {
      title: "Check your liquidity",
      text: `Emergency-fund progress is currently ${emergencyFundStrong}%.`
    },
    {
      title: "Set a decision limit",
      text: "Define the amount you are comfortable committing before acting."
    },
    {
      title: "Review again",
      text: "Reassess after your next meaningful income or expense change."
    }
  ];

  dom.advisorResponse.innerHTML = `
    <article class="ai-response">

      <header class="ai-response__header">
        <div>
          <span class="ai-badge">
            <span aria-hidden="true">✦</span>
            AI recommendation
          </span>

          <h3 class="ai-response__title">
            ${escapeHTML(decision)}
          </h3>

          <p class="ai-response__question">
            “${escapeHTML(question)}”
          </p>
        </div>

        <span class="ai-badge">
          ${confidence}% confidence
        </span>
      </header>

      <section class="ai-response__decision">
        <div>
          <p class="ai-decision__label">Recommended posture</p>
          <h4 class="ai-decision__title">
            ${escapeHTML(action)}
          </h4>
        </div>

        <div class="ai-decision__score" aria-label="${confidence}% recommendation confidence">
          <strong>${confidence}%</strong>
          <span>confidence</span>
        </div>
      </section>

      <div class="ai-response-grid">

        <section class="ai-panel">
          <h4>Why this makes sense</h4>
          <ul>
            ${rationale
              .map((point) => `<li>${escapeHTML(point)}</li>`)
              .join("")}
          </ul>
        </section>

        <section class="ai-panel">
          <h4>Risk assessment</h4>
          <p>
            Current decision risk: <strong>${escapeHTML(riskLevel)}</strong>.
            The recommendation prioritizes flexibility and avoids relying on a
            single uncertain outcome.
          </p>
        </section>

      </div>

      <section>
        <h4 class="card-title">Suggested next steps</h4>

        <div class="ai-next-steps">
          ${nextSteps
            .map(
              (step, index) => `
                <article class="ai-next-step">
                  <span class="ai-next-step__number">${index + 1}</span>

                  <div>
                    <strong>${escapeHTML(step.title)}</strong>
                    <span>${escapeHTML(step.text)}</span>
                  </div>
                </article>
              `
            )
            .join("")}
        </div>
      </section>

      <p class="ai-response__disclaimer">
        Simulation only. This recommendation is generated from demo data and
        should not be interpreted as personalized regulated financial advice.
        A production implementation should connect this layer to a secure
        backend, validated financial data and appropriate compliance controls.
      </p>
    </article>
  `;
};

// ============================================================
// 13. AI FORM HANDLING
// ============================================================

const setAdvisorLoading = (isLoading) => {
  state.advisorLoading = isLoading;

  dom.advisorSubmit.disabled = isLoading;
  dom.advisorSubmit.classList.toggle("is-loading", isLoading);
  dom.advisorInput.disabled = isLoading;
};

const handleAdvisorSubmit = async (event) => {
  event.preventDefault();

  const question = dom.advisorInput.value.trim();

  if (!question) {
    showToast("Please enter a financial question.", "!");
    dom.advisorInput.focus();
    return;
  }

  /*
    Hard stop prevents duplicate requests if the user somehow
    triggers submit twice before the first operation completes.
  */
  if (state.advisorLoading) return;

  state.lastAdvisorQuestion = question;
  setAdvisorLoading(true);

  dom.advisorResponse.innerHTML = `
    <div class="empty-advisor-state" aria-label="AI is processing your question">
      <div class="empty-advisor-state__icon" aria-hidden="true">
        <span class="loading-spark">✦</span>
      </div>

      <h3>Analysing your decision...</h3>

      <p>
        Comparing your financial profile with a simulated recommendation model.
      </p>
    </div>
  `;

  try {
    const response = await simulateAIResponse(question);

    /*
      Confirm that the user has not navigated into another input
      flow while the fake request was running.
    */
    if (state.lastAdvisorQuestion === question) {
      renderAIResponse(response);
    }

    showToast("AI analysis completed.");
  } catch (error) {
    console.error("Advisor simulation failed:", error);

    dom.advisorResponse.innerHTML = `
      <div class="empty-advisor-state">
        <div class="empty-advisor-state__icon" aria-hidden="true">!</div>
        <h3>Something went wrong.</h3>
        <p>
          The simulated advisor could not complete the analysis.
          Please try again.
        </p>
      </div>
    `;

    showToast("AI analysis failed.", "!");
  } finally {
    setAdvisorLoading(false);
  }
};

// ============================================================
// 14. MOBILE NAVIGATION
// ============================================================

const setMobileNav = (open) => {
  state.mobileNavOpen = open;

  dom.sidebar.classList.toggle("open", open);
  dom.navOverlay.classList.toggle("visible", open);

  dom.mobileMenuButton.setAttribute("aria-expanded", String(open));
  dom.navOverlay.setAttribute("aria-hidden", String(!open));
};

const closeMobileNav = () => {
  setMobileNav(false);
};

// ============================================================
// 15. MODALS
// ============================================================

const openModal = (modalElement) => {
  modalElement.hidden = false;

  const input = modalElement.querySelector("input");

  if (input) {
    window.setTimeout(() => input.focus(), 40);
  }
};

const closeModal = (modalElement) => {
  modalElement.hidden = true;
};

const togglePopover = (popover) => {
  popover.hidden = !popover.hidden;
};

const closeAllPopovers = () => {
  dom.notificationsPopover.hidden = true;
  dom.accountPopover.hidden = true;
};

// ============================================================
// 16. SEARCH
// ============================================================

const buildSearchIndex = () => {
  const transactionItems = MOCK_DB.transactions.map((item) => ({
    type: "Transaction",
    title: item.name,
    meta: `${item.category} • ${item.date}`,
    value: item.amount >= 0
      ? `+${formatCurrency(item.amount)}`
      : `-${formatCurrency(Math.abs(item.amount))}`,
    icon: "T"
  }));

  const goalItems = MOCK_DB.goals.map((goal) => ({
    type: "Goal",
    title: goal.name,
    meta: `${goal.percent}% complete`,
    value: formatCurrency(goal.current),
    icon: "G"
  }));

  const investmentItems = MOCK_DB.investments.map((investment) => ({
    type: "Investment",
    title: investment.symbol,
    meta: investment.type,
    value: formatCurrency(investment.price),
    icon: "I"
  }));

  return [...transactionItems, ...goalItems, ...investmentItems];
};

const searchDashboard = (query) => {
  const normalized = query.trim().toLowerCase();

  if (!normalized) {
    dom.searchResults.innerHTML = `
      <p class="empty-search">
        Start typing to search your dashboard.
      </p>
    `;
    return;
  }

  const matches = buildSearchIndex().filter((item) =>
    `${item.title} ${item.meta}`
      .toLowerCase()
      .includes(normalized)
  );

  if (!matches.length) {
    dom.searchResults.innerHTML = `
      <p class="empty-search">
        No matching records found.
      </p>
    `;
    return;
  }

  dom.searchResults.innerHTML = matches
    .slice(0, 8)
    .map(
      (item) => `
        <button class="search-result" type="button">
          <span class="search-result__icon">${escapeHTML(item.icon)}</span>

          <span>
            <span class="search-result__title">
              ${escapeHTML(item.title)}
            </span>
            <span class="search-result__meta">
              ${escapeHTML(item.meta)}
            </span>
          </span>

          <span class="search-result__value">
            ${escapeHTML(item.value)}
          </span>
        </button>
      `
    )
    .join("");
};

// ============================================================
// 17. TOAST SYSTEM
// ============================================================

let toastTimer = null;

const showToast = (message, icon = "✓") => {
  dom.toastIcon.textContent = icon;
  dom.toastMessage.textContent = message;

  dom.toast.classList.add("show");

  window.clearTimeout(toastTimer);

  toastTimer = window.setTimeout(() => {
    dom.toast.classList.remove("show");
  }, 2800);
};

// ============================================================
// 18. SIDEBAR NAVIGATION BEHAVIOUR
// ============================================================

const setActiveNavigation = (sectionId) => {
  document.querySelectorAll(".sidebar-link").forEach((link) => {
    const isActive = link.dataset.section === sectionId;

    link.classList.toggle("active", isActive);

    if (isActive) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });
};

const handleNavigationClick = (event) => {
  const link = event.currentTarget;
  const sectionId = link.dataset.section;

  setActiveNavigation(sectionId);
  closeMobileNav();
};

// ============================================================
// 19. INTERACTION: QUICK PROMPTS
// ============================================================

const handlePromptChip = (event) => {
  dom.advisorInput.value = event.currentTarget.dataset.prompt;
  dom.advisorInput.focus();

  /*
    Scroll gently to make the active input visible when the
    chip was clicked from a smaller viewport.
  */
  dom.advisorInput.scrollIntoView({
    behavior: "smooth",
    block: "center"
  });
};

// ============================================================
// 20. CHART RANGE TOGGLE
// ============================================================

const handleChartRangeChange = (event) => {
  const button = event.currentTarget;
  const range = button.dataset.range;

  state.chartRange = range;

  document.querySelectorAll(".chart-toggle").forEach((toggle) => {
    toggle.classList.toggle(
      "active",
      toggle.dataset.range === range
    );
  });

  renderChart();
};

// ============================================================
// 21. SCROLL-AWARE NAVIGATION
// ============================================================

const observeDashboardSections = () => {
  const sections = [
    document.getElementById("dashboard"),
    document.getElementById("advisor"),
    document.getElementById("transactions"),
    document.getElementById("investments"),
    document.getElementById("goals")
  ].filter(Boolean);

  const observer = new IntersectionObserver(
    (entries) => {
      /*
        Pick the section with the strongest visible intersection.
      */
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort(
          (a, b) =>
            b.intersectionRatio - a.intersectionRatio
        );

      const active = visible[0];

      if (!active) return;

      setActiveNavigation(active.target.id);
    },
    {
      threshold: [0.2, 0.35, 0.5],
      rootMargin: "-25% 0px -55% 0px"
    }
  );

  sections.forEach((section) => observer.observe(section));
};

// ============================================================
// 22. EVENT BINDINGS
// ============================================================

const bindEvents = () => {
  // AI advisor submission
  dom.advisorForm.addEventListener("submit", handleAdvisorSubmit);

  // Prompt chips
  document
    .querySelectorAll(".prompt-chip")
    .forEach((chip) => {
      chip.addEventListener("click", handlePromptChip);
    });

  // Chart toggles
  document
    .querySelectorAll(".chart-toggle")
    .forEach((toggle) => {
      toggle.addEventListener("click", handleChartRangeChange);
    });

  // Mobile nav
  dom.mobileMenuButton.addEventListener("click", () => {
    setMobileNav(!state.mobileNavOpen);
  });

  dom.navOverlay.addEventListener("click", closeMobileNav);

  // Sidebar navigation
  document
    .querySelectorAll(".sidebar-link")
    .forEach((link) => {
      link.addEventListener("click", handleNavigationClick);
    });

  // Search modal
  dom.searchButton.addEventListener("click", () => {
    closeAllPopovers();
    openModal(dom.searchModal);
    state.searchOpen = true;
  });

  dom.searchInput.addEventListener("input", (event) => {
    searchDashboard(event.target.value);
  });

  // Search result buttons
  dom.searchResults.addEventListener("click", (event) => {
    const result = event.target.closest(".search-result");

    if (!result) return;

    closeModal(dom.searchModal);
    state.searchOpen = false;
    showToast("Search result selected.");
  });

  // Notification popover
  dom.notificationButton.addEventListener("click", (event) => {
    event.stopPropagation();

    dom.accountPopover.hidden = true;
    togglePopover(dom.notificationsPopover);
  });

  // Account popover
  dom.accountMenuButton.addEventListener("click", (event) => {
    event.stopPropagation();

    dom.notificationsPopover.hidden = true;
    togglePopover(dom.accountPopover);
  });

  // Global click closes transient UI
  document.addEventListener("click", (event) => {
    const clickedNotification =
      dom.notificationsPopover.contains(event.target) ||
      dom.notificationButton.contains(event.target);

    const clickedAccount =
      dom.accountPopover.contains(event.target) ||
      dom.accountMenuButton.contains(event.target);

    if (!clickedNotification) {
      dom.notificationsPopover.hidden = true;
    }

    if (!clickedAccount) {
      dom.accountPopover.hidden = true;
    }
  });

  // Close modal using dedicated buttons
  document
    .querySelectorAll("[data-close-modal]")
    .forEach((button) => {
      button.addEventListener("click", () => {
        const modalId = button.dataset.closeModal;
        const modal = document.getElementById(modalId);

        if (modal) {
          closeModal(modal);
          state.searchOpen = false;
        }
      });
    });

  // Close modal by clicking outside it
  dom.searchModal.addEventListener("click", (event) => {
    if (event.target === dom.searchModal) {
      closeModal(dom.searchModal);
      state.searchOpen = false;
    }
  });

  // Escape key closes transient UI
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;

    closeMobileNav();
    closeAllPopovers();

    if (!dom.searchModal.hidden) {
      closeModal(dom.searchModal);
      state.searchOpen = false;
    }
  });

  // Upgrade action
  dom.upgradeButton.addEventListener("click", () => {
    showToast("Pro preview is simulated in this frontend demo.");
  });

  // Add goal action
  dom.addGoalButton.addEventListener("click", () => {
    showToast("Goal creation would open a form in the full app.");
  });

  // View transactions action
  dom.viewTransactionsButton.addEventListener("click", () => {
    showToast("Showing the latest transactions already loaded.");
  });

  // Allocation menu
  const allocationMenuButton =
    document.getElementById("allocationMenuButton");

  allocationMenuButton.addEventListener("click", () => {
    showToast("Spending allocation menu opened.");
  });
};

// ============================================================
// 23. INITIALIZATION
// ============================================================

const initializeApp = () => {
  /*
    Render all dynamic sections first.
    Keeping initialization explicit makes future backend
    hydration or saved-state loading easier.
  */
  renderMetrics();
  renderChart();
  renderAllocations();
  renderTransactions();
  renderGoals();
  renderInvestments();

  bindEvents();
  observeDashboardSections();

  /*
    Current nav defaults to Dashboard. The hash can be used to
    deep-link into another dashboard section.
  */
  const initialSection =
    window.location.hash.replace("#", "") || "dashboard";

  setActiveNavigation(initialSection);

  /*
    If a valid hash was supplied, scroll after the first paint.
  */
  if (initialSection !== "dashboard") {
    const target = document.getElementById(initialSection);

    if (target) {
      window.requestAnimationFrame(() => {
        target.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      });
    }
  }
};

// ============================================================
// 24. START APPLICATION
// ============================================================

document.addEventListener("DOMContentLoaded", initializeApp);