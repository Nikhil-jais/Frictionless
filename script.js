/* =========================================================
   FRICTIONLESS V2
   PRODUCTIVITY SYSTEM
   COMPLETE JAVASCRIPT
   ========================================================= */

"use strict";

/* =========================================================
   STORAGE
   ========================================================= */

const STORAGE = {
    tasks: "frictionless_tasks",
    goals: "frictionless_goals",
    note: "frictionless_note",
    theme: "frictionless_theme",
    appearance: "frictionless_appearance",
    focusMinutes: "frictionless_focus_minutes",
    focusSessions: "frictionless_focus_sessions"
};

/* =========================================================
   STATE
   ========================================================= */

let tasks = [];
let goals = [];

let currentFilter = "all";
let currentSort = "newest";
let currentCategory = "all";

let selectedTheme = localStorage.getItem(STORAGE.theme) || "aurora";
let appearance =
    localStorage.getItem(STORAGE.appearance) || "dark";

let calendarDate = new Date();

let timerSeconds = 25 * 60;
let timerRunning = false;
let timerInterval = null;

let focusMinutes =
    Number(localStorage.getItem(STORAGE.focusMinutes)) || 0;

let focusSessions =
    Number(localStorage.getItem(STORAGE.focusSessions)) || 0;

/* =========================================================
   DOM HELPERS
   ========================================================= */

const $ = (selector) =>
    document.querySelector(selector);

const $$ = (selector) =>
    document.querySelectorAll(selector);

/* =========================================================
   DOM REFERENCES
   ========================================================= */

const taskInput = $("#taskInput");
const createTaskButton = $("#createTaskButton");
const taskList = $("#taskList");
const taskEmpty = $("#taskEmpty");
const taskCounter = $("#taskCounter");
const taskSortButton = $("#taskSortButton");
const categoryFilter = $("#categoryFilter");

const completedStat = $("#completedStat");
const activeStat = $("#activeStat");
const focusStat = $("#focusStat");
const progressStat = $("#progressStat");

const focusStatus = $("#focusStatus");
const timerRing = $("#timerRing");
const timerDisplay = $("#timerDisplay");
const timerStart = $("#timerStart");
const timerReset = $("#timerReset");

const streakStat = $("#streakStat");
const streakLarge = $("#streakLarge");
const streakMessage = $("#streakMessage");
const streakWeek = $("#streakWeek");

const currentTime = $("#currentTime");
const currentDate = $("#currentDate");

const calendarMonth = $("#calendarMonth");
const calendarYear = $("#calendarYear");
const calendarGrid = $("#calendarGrid");
const previousMonth = $("#previousMonth");
const nextMonth = $("#nextMonth");
const todayButton = $("#todayButton");

const upcomingCount = $("#upcomingCount");
const upcomingList = $("#upcomingList");

const weeklyTrend = $("#weeklyTrend");
const activityChart = $("#activityChart");

const totalCompletedStat = $("#totalCompletedStat");
const totalFocusStat = $("#totalFocusStat");
const bestStreakStat = $("#bestStreakStat");
const overallProgressStat = $("#overallProgressStat");

const goalsGrid = $("#goalsGrid");
const goalsEmpty = $("#goalsEmpty"); 

const noteInput = $("#noteInput");
const noteStatus = $("#noteStatus");
const characterCount = $("#characterCount");
const saveNoteButton = $("#saveNoteButton");

const searchInput = $("#searchInput");
const searchResult = $("#searchResult");
const searchSection = $("#searchSection");

const themeButton = $("#themeButton");
const settingsButton = $("#settingsButton");

const taskModal = $("#taskModal");
const closeTaskModal = $("#closeTaskModal");
const modalTaskInput = $("#modalTaskInput");
const modalTaskCategory = $("#modalTaskCategory");
const modalTaskPriority = $("#modalTaskPriority");
const modalTaskDate = $("#modalTaskDate");
const modalTaskReminder = $("#modalTaskReminder");
const modalAddTask = $("#modalAddTask");

const goalModal = $("#goalModal");
const closeGoalModal = $("#closeGoalModal");
const goalNameInput = $("#goalNameInput");
const goalTargetInput = $("#goalTargetInput");
const goalDateInput = $("#goalDateInput");
const createGoalButton = $("#createGoalButton");

const settingsModal = $("#settingsModal");
const closeSettingsModal = $("#closeSettingsModal");

const exportDataButton = $("#exportDataButton");
const clearDataButton = $("#clearDataButton");

const toast = $("#toast");
const toastMessage = $("#toastMessage");

/* =========================================================
   LOAD DATA
   ========================================================= */

function loadData() {
    try {
        const savedTasks =
            JSON.parse(
                localStorage.getItem(STORAGE.tasks)
            ) || [];

        tasks = Array.isArray(savedTasks)
            ? savedTasks.map(normalizeTask) 
            : [];

        const savedGoals =
            JSON.parse(
                localStorage.getItem(STORAGE.goals) 
            ) || [];

        goals = Array.isArray(savedGoals)
            ? savedGoals.map(normalizeGoal)
            : [];
    } catch (error) {
        console.error("Frictionless data error:", error);
        tasks = [];
        goals = [];
    }  

    if (noteInput) {
        noteInput.value =
            localStorage.getItem(STORAGE.note) || "";  
    }

    applyTheme();
}

/* =========================================================
   DATA NORMALIZATION
   ========================================================= */

function normalizeTask(task) {
    return {
        id:
            task.id ||
            `${Date.now()}-${Math.random()
                .toString(36)
                .slice(2)}`,

        text: String(task.text || "").trim(),

        completed: Boolean(task.completed),

        createdAt:
            task.createdAt ||
            new Date().toISOString(),

        completedAt:
            task.completedAt || null,

        category:
            task.category ||
            "General",

        priority:
            task.priority ||
            "medium",

        dueDate:
            task.dueDate ||
            "",

        reminder:
            task.reminder ||
            ""
    };
}

function normalizeGoal(goal) {
    return {
        id:
            goal.id ||
            `${Date.now()}-${Math.random()
                .toString(36)
                .slice(2)}`,

        name: String(goal.name || "Untitled Goal"),

        target:
            Math.max(
                1,
                Number(goal.target) || 1
            ),

        progress:
            Math.max(
                0,
                Number(goal.progress) || 0
            ),

        dueDate:
            goal.dueDate || "",

        createdAt:
            goal.createdAt ||
            new Date().toISOString()
    };
}

/* =========================================================
   SAVE DATA
   ========================================================= */

function saveTasks() {
    localStorage.setItem(
        STORAGE.tasks,
        JSON.stringify(tasks)
    );
}

function saveGoals() {
    localStorage.setItem(
        STORAGE.goals,
        JSON.stringify(goals)
    );
}

function saveFocusData() {
    localStorage.setItem(
        STORAGE.focusMinutes,
        String(focusMinutes)
    );

    localStorage.setItem(
        STORAGE.focusSessions,
        String(focusSessions)
    );
}

/* =========================================================
   TOAST
   ========================================================= */

let toastTimeout;

function showToast(message) {
    if (!toast || !toastMessage) return;

    toastMessage.textContent = message;

    toast.classList.add("show", "active");

    clearTimeout(toastTimeout);

    toastTimeout = setTimeout(() => {
        toast.classList.remove("show", "active");
    }, 2800);
}

/* =========================================================
   DATE HELPERS
   ========================================================= */

function pad(number) {
    return String(number).padStart(2, "0");
}

function localDateKey(date = new Date()) {
    return (
        date.getFullYear() +
        "-" +
        pad(date.getMonth() + 1) +
        "-" +
        pad(date.getDate())
    );
}

function parseDateKey(value) {
    if (!value) return null;

    const parts = value.split("-").map(Number);

    if (parts.length !== 3) return null;

    return new Date(
        parts[0],
        parts[1] - 1,
        parts[2]
    );
}

function formatDate(value) {
    if (!value) return "No date";

    const date = parseDateKey(value);

    if (!date || Number.isNaN(date.getTime())) {
        return "No date";
    }

    return date.toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric"
    });
}

function isToday(value) {
    return value === localDateKey();
}

function daysFromToday(value) {
    const date = parseDateKey(value);

    if (!date) return Infinity;

    const today = parseDateKey(localDateKey());

    return Math.round(
        (date - today) / 86400000
    );
}

/* =========================================================
   CLOCK
   ========================================================= */

function updateClock() {
    const now = new Date();

    if (currentTime) {
        currentTime.textContent =
            now.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit"
            });
    }

    if (currentDate) {
        currentDate.textContent =
            now.toLocaleDateString(undefined, {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric"
            });
    }
}

setInterval(updateClock, 1000);
updateClock();

/* =========================================================
   TASK CREATION
   ========================================================= */

function createTask(options = {}) {
    const text =
        String(options.text || "").trim();

    if (!text) {
        showToast("Write a task first ✍️");
        return null;
    }

    const task = {
        id:
            Date.now().toString() +
            Math.random()
                .toString(36)
                .slice(2),

        text,

        completed: false,

        createdAt: new Date().toISOString(),

        completedAt: null,

        category:
            options.category ||
            "General",

        priority:
            options.priority ||
            "medium",

        dueDate:
            options.dueDate ||
            "",

        reminder:
            options.reminder ||
            ""
    };

    tasks.unshift(task);

    saveTasks();
    renderEverything();

    showToast("Task added successfully ✨");

    return task;
}

function addTaskFromInput() {
    if (!taskInput) return;

    const value = taskInput.value;

    const task = createTask({
        text: value,
        category: "General",
        priority: "medium"
    });

    if (task) {
        taskInput.value = "";
        taskInput.focus();
    }
}

/* =========================================================
   DELETE TASK
   ========================================================= */

function deleteTask(id) {
    const task = tasks.find(
        (item) => item.id === id
    );

    if (!task) return;

    tasks = tasks.filter(
        (item) => item.id !== id
    );

    saveTasks();
    renderEverything();

    showToast("Task removed");
}

/* =========================================================
   TOGGLE TASK
   ========================================================= */

function toggleTask(id) {
    const task = tasks.find(
        (item) => item.id === id
    );

    if (!task) return;

    task.completed = !task.completed;

    if (task.completed) {
        task.completedAt = new Date().toISOString();

        showToast("Task completed 🎉");

        autoAdvanceGoals();
    } else {
        task.completedAt = null;

        showToast("Task marked active");
    }

    saveTasks();
    saveGoals();

    renderEverything();
}

/* =========================================================
   TASK FILTER
   ========================================================= */

function getVisibleTasks() {
    let result = [...tasks];

    if (currentFilter === "active") {
        result = result.filter(
            (task) => !task.completed
        );
    }

    if (currentFilter === "completed") {
        result = result.filter(
            (task) => task.completed
        );
    }

    if (currentCategory !== "all") {
        result = result.filter(
            (task) =>
                task.category === currentCategory
        );
    }

    result.sort((a, b) => {
        if (currentSort === "oldest") {
            return (
                new Date(a.createdAt) -
                new Date(b.createdAt)
            );
        }

        if (currentSort === "priority") {
            const values = {
                high: 3,
                medium: 2,
                low: 1
            };

            return (
                values[b.priority] -
                values[a.priority]
            );
        }

        if (currentSort === "due") {
            if (!a.dueDate) return 1;
            if (!b.dueDate) return -1;

            return (
                parseDateKey(a.dueDate) -
                parseDateKey(b.dueDate)
            );
        }

        return (
            new Date(b.createdAt) -
            new Date(a.createdAt)
        );
    });

    return result;
}

/* =========================================================
   TASK RENDER
   ========================================================= */

function renderTasks() {
    if (!taskList) return;

    taskList.innerHTML = "";

    const visibleTasks =
        getVisibleTasks();

    if (taskCounter) {
        taskCounter.textContent =
            `${visibleTasks.length} ${
                visibleTasks.length === 1
                    ? "task"
                    : "tasks"
            }`;
    }

    if (taskEmpty) {
        taskEmpty.style.display =
            visibleTasks.length
                ? "none"
                : "block";
    }

    visibleTasks.forEach(
        (task, index) => {
            const item =
                document.createElement("article");

            item.className =
                "task-item" +
                (task.completed
                    ? " completed"
                    : "");

            item.style.animationDelay =
                `${index * 0.035}s`;

            const check =
                document.createElement("button");

            check.className = "task-check";
            check.type = "button";
            check.setAttribute(
                "aria-label",
                task.completed
                    ? "Mark task active"
                    : "Complete task"
            );

            check.textContent =
                task.completed ? "✓" : "";

            check.addEventListener(
                "click",
                () => toggleTask(task.id)
            );

            const content =
                document.createElement("div");

            content.className = "task-content";

            const title =
                document.createElement("div");

            title.className = "task-title";
            title.textContent = task.text;

            const meta =
                document.createElement("div");

            meta.className = "task-meta";

            const categoryBadge =
                document.createElement("span");

            categoryBadge.className =
                "task-badge";

            categoryBadge.textContent =
                task.category;

            meta.appendChild(categoryBadge);

            const priorityBadge =
                document.createElement("span");

            priorityBadge.className =
                `task-badge priority-${task.priority}`;

            priorityBadge.textContent =
                `${capitalize(task.priority)} priority`;

            meta.appendChild(priorityBadge);

            if (task.dueDate) {
                const dateBadge =
                    document.createElement("span");

                dateBadge.className =
                    "task-badge";

                dateBadge.textContent =
                    isToday(task.dueDate)
                        ? "Today"
                        : formatDate(
                              task.dueDate
                          );

                meta.appendChild(dateBadge);
            }

            if (task.reminder) {
                const reminderBadge =
                    document.createElement("span");

                reminderBadge.className =
                    "task-badge";

                reminderBadge.textContent =
                    "🔔 Reminder";

                meta.appendChild(
                    reminderBadge
                );
            }

            content.appendChild(title);
            content.appendChild(meta);

            const actions =
                document.createElement("div");

            actions.className =
                "task-actions";

            const deleteButton =
                document.createElement("button");

            deleteButton.type = "button";
            deleteButton.className =
                "task-delete";

            deleteButton.setAttribute(
                "aria-label",
                "Delete task"
            );

            deleteButton.textContent = "×";

            deleteButton.addEventListener(
                "click",
                () => deleteTask(task.id)
            );

            actions.appendChild(
                deleteButton
            );

            item.appendChild(check);
            item.appendChild(content);
            item.appendChild(actions);

            taskList.appendChild(item);
        }
    );
}

/* =========================================================
   STATS
   ========================================================= */

function updateStats() {
    const total = tasks.length;

    const completed =
        tasks.filter(
            (task) => task.completed
        ).length;

    const active = total - completed;

    const progress =
        total > 0
            ? Math.round(
                  (completed / total) * 100
              )
            : 0;

    if (completedStat) {
        completedStat.textContent =
            completed;
    }

    if (activeStat) {
        activeStat.textContent =
            active;
    }

    if (focusStat) {
        focusStat.textContent =
            `${focusMinutes}m`;
    }

    if (progressStat) {
        progressStat.textContent =
            `${progress}%`;
    }

    if (totalCompletedStat) {
        totalCompletedStat.textContent =
            completed;
    }

    if (totalFocusStat) {
        totalFocusStat.textContent =
            `${focusMinutes}m`;
    }

    if (overallProgressStat) {
        overallProgressStat.textContent =
            `${progress}%`;
    }
}

/* =========================================================
   CATEGORY FILTER
   ========================================================= */

function populateCategoryFilter() {
    if (!categoryFilter) return;

    const categories = [
        "all",
        ...new Set(
            tasks
                .map(
                    (task) =>
                        task.category
                )
                .filter(Boolean)
        )
    ];

    categoryFilter.innerHTML = "";

    categories.forEach(
        (category) => {
            const option =
                document.createElement("option");

            option.value = category;

            option.textContent =
                category === "all"
                    ? "All categories"
                    : category;

            categoryFilter.appendChild(
                option
            );
        }
    );

    categoryFilter.value =
        categories.includes(
            currentCategory
        )
            ? currentCategory
            : "all";
}

/* =========================================================
   CAPITALIZE
   ========================================================= */

function capitalize(value) {
    if (!value) return "";

    return (
        value.charAt(0).toUpperCase() +
        value.slice(1)
    );
}

/* =========================================================
   FOCUS TIMER
   ========================================================= */

function updateTimerDisplay() {
    if (!timerDisplay) return;

    const minutes =
        Math.floor(timerSeconds / 60);

    const seconds =
        timerSeconds % 60;

    timerDisplay.textContent =
        `${pad(minutes)}:${pad(seconds)}`;

    if (focusStatus) {
        focusStatus.textContent =
            timerRunning
                ? "● Focus session running"
                : "○ Ready for focus";
    }

    if (timerStart) {
        timerStart.textContent =
            timerRunning
                ? "Pause"
                : "Start Focus";
    }

    if (timerRing) {
        const total = 25 * 60;

        const progress =
            1 - timerSeconds / total;

        const degrees =
            Math.max(
                0,
                Math.min(360, progress * 360)
            );

        timerRing.style.background =
            `radial-gradient(
                circle at center,
                var(--surface-solid) 61%,
                transparent 62%
            ),
            conic-gradient(
                from -90deg,
                var(--accent) 0deg,
                var(--accent-2) ${degrees}deg,
                rgba(255,255,255,0.07) ${degrees}deg
            )`;
    }
}

function startTimer() {
    if (timerRunning) {
        clearInterval(timerInterval);

        timerRunning = false;

        updateTimerDisplay();

        showToast("Focus paused");
        return;
    }

    timerRunning = true;

    timerInterval =
        setInterval(() => {
            timerSeconds--;

            if (timerSeconds <= 0) {
                timerSeconds = 0;

                clearInterval(
                    timerInterval
                );

                timerRunning = false;

                completeFocusSession();

                return;
            }

            updateTimerDisplay();
        }, 1000);

    updateTimerDisplay();

    showToast(
        "Focus session started 🚀"
    );
}

function resetTimer() {
    clearInterval(timerInterval);

    timerRunning = false;
    timerSeconds = 25 * 60;

    updateTimerDisplay();

    showToast("Timer reset");
}

function completeFocusSession() {
    focusMinutes += 25;
    focusSessions += 1;

    saveFocusData();

    timerSeconds = 25 * 60;

    updateTimerDisplay();
    updateStats();
    renderAnalytics();

    showToast(
        "Focus session complete! 🎉 +25 minutes"
    );
}

/* =========================================================
   STREAK CALCULATION
   ========================================================= */

function getCompletionDates() {
    const dates = new Set();

    tasks.forEach((task) => {
        if (!task.completedAt) return;

        const date =
            new Date(task.completedAt);

        if (
            !Number.isNaN(
                date.getTime()
            )
        ) {
            dates.add(
                localDateKey(date)
            );
        }
    });

    return dates;
}

function calculateCurrentStreak() {
    const completedDates =
        getCompletionDates();

    let streak = 0;

    const date = new Date();

    const today =
        localDateKey(date);

    const yesterdayDate =
        new Date(date);

    yesterdayDate.setDate(
        yesterdayDate.getDate() - 1
    );

    const yesterday =
        localDateKey(
            yesterdayDate
        );

    if (
        !completedDates.has(today) &&
        !completedDates.has(yesterday)
    ) {
        return 0;
    }

    if (!completedDates.has(today)) {
        date.setDate(
            date.getDate() - 1
        );
    }

    while (
        completedDates.has(
            localDateKey(date)
        )
    ) {
        streak++;

        date.setDate(
            date.getDate() - 1
        );
    }

    return streak;
}

function calculateBestStreak() {
    const completedDates =
        [...getCompletionDates()]
            .sort();

    if (!completedDates.length) {
        return 0;
    }

    let best = 1;
    let current = 1;

    for (
        let i = 1;
        i < completedDates.length;
        i++
    ) {
        const previous =
            parseDateKey(
                completedDates[i - 1]
            );

        const currentDateValue =
            parseDateKey(
                completedDates[i]
            );

        const difference =
            Math.round(
                (currentDateValue -
                    previous) /
                    86400000
            );

        if (difference === 1) {
            current++;
            best = Math.max(
                best,
                current
            );
        } else {
            current = 1;
        }
    }

    return best;
}

/* =========================================================
   STREAK UI
   ========================================================= */

function renderStreak() {
    const currentStreak =
        calculateCurrentStreak();

    const bestStreak =
        calculateBestStreak();

    if (streakStat) {
        streakStat.textContent =
            currentStreak;
    }

    if (streakLarge) {
        streakLarge.textContent =
            currentStreak;
    }

    if (bestStreakStat) {
        bestStreakStat.textContent =
            bestStreak;
    }

    if (streakMessage) {
        if (currentStreak === 0) {
            streakMessage.textContent =
                "Complete a task today to start your streak.";
        } else if (
            currentStreak < 3
        ) {
            streakMessage.textContent =
                "Nice start. Keep the momentum going.";
        } else if (
            currentStreak < 7
        ) {
            streakMessage.textContent =
                "You're building a real habit. Keep going.";
        } else {
            streakMessage.textContent =
                "Amazing consistency. You're on fire 🔥";
        }
    }

    if (!streakWeek) return;

    streakWeek.innerHTML = "";

    const completedDates =
        getCompletionDates();

    const today =
        new Date();

    const dayNames = [
        "S",
        "M",
        "T",
        "W",
        "T",
        "F",
        "S"
    ];

    for (let i = 6; i >= 0; i--) {
        const date =
            new Date(today);

        date.setDate(
            today.getDate() - i
        );

        const wrapper =
            document.createElement("div");

        wrapper.className =
            "streak-day";

        if (
            completedDates.has(
                localDateKey(date)
            )
        ) {
            wrapper.classList.add(
                "active"
            );
        }

        const label =
            document.createElement("div");

        label.className =
            "streak-day-label";

        label.textContent =
            dayNames[date.getDay()];

        const dot =
            document.createElement("div");

        dot.className =
            "streak-day-dot";

        wrapper.appendChild(label);
        wrapper.appendChild(dot);

        streakWeek.appendChild(
            wrapper
        );
    }
}

/* =========================================================
   CALENDAR
   ========================================================= */

function renderCalendar() {
    if (!calendarGrid) return;

    const year =
        calendarDate.getFullYear();

    const month =
        calendarDate.getMonth();

    if (calendarMonth) {
        calendarMonth.textContent =
            new Date(
                year,
                month,
                1
            ).toLocaleString(
                undefined,
                {
                    month: "long"
                }
            );
    }

    if (calendarYear) {
        calendarYear.textContent =
            year;
    }

    calendarGrid.innerHTML = "";

    const weekdays = [
        "Sun",
        "Mon",
        "Tue",
        "Wed",
        "Thu",
        "Fri",
        "Sat"
    ];

    weekdays.forEach(
        (day) => {
            const weekday =
                document.createElement(
                    "div"
                );

            weekday.className =
                "calendar-weekday";

            weekday.textContent = day;

            calendarGrid.appendChild(
                weekday
            );
        }
    );

    const firstDay =
        new Date(
            year,
            month,
            1
        ).getDay();

    const daysInMonth =
        new Date(
            year,
            month + 1,
            0
        ).getDate();

    const previousDays =
        new Date(
            year,
            month,
            0
        ).getDate();

    const totalCells =
        Math.ceil(
            (firstDay +
                daysInMonth) /
                7
        ) * 7;

    for (
        let index = 0;
        index < totalCells;
        index++
    ) {
        const cell =
            document.createElement(
                "div"
            );

        cell.className =
            "calendar-day";

        let dayNumber;
        let cellDate;

        if (index < firstDay) {
            dayNumber =
                previousDays -
                firstDay +
                index +
                1;

            cellDate =
                new Date(
                    year,
                    month - 1,
                    dayNumber
                );

            cell.classList.add(
                "other-month"
            );
        } else if (
            index >=
            firstDay + daysInMonth
        ) {
            dayNumber =
                index -
                firstDay -
                daysInMonth +
                1;

            cellDate =
                new Date(
                    year,
                    month + 1,
                    dayNumber
                );

            cell.classList.add(
                "other-month"
            );
        } else {
            dayNumber =
                index -
                firstDay +
                1;

            cellDate =
                new Date(
                    year,
                    month,
                    dayNumber
                );
        }

        const dateKey =
            localDateKey(cellDate);

        if (
            dateKey ===
            localDateKey()
        ) {
            cell.classList.add(
                "today"
            );
        }

        const number =
            document.createElement(
                "div"
            );

        number.className =
            "calendar-number";

        number.textContent =
            dayNumber;

        cell.appendChild(number);

        const count =
            tasks.filter(
                (task) =>
                    task.dueDate ===
                    dateKey
            ).length;

        if (count > 0) {
            const dot =
                document.createElement(
                    "div"
                );

            dot.className =
                "calendar-task-dot";

            cell.appendChild(dot);

            const countText =
                document.createElement(
                    "div"
                );

            countText.className =
                "calendar-task-count";

            countText.textContent =
                `${count} ${
                    count === 1
                        ? "task"
                        : "tasks"
                }`;

            cell.appendChild(
                countText
            );
        }

        cell.addEventListener(
            "click",
            () => {
                const date =
                    dateKey;

                if (modalTaskDate) {
                    modalTaskDate.value =
                        date;
                }

                openModal(taskModal);

                if (modalTaskInput) {
                    modalTaskInput.focus();
                }
            }
        );

        calendarGrid.appendChild(cell);
    }
}

/* =========================================================
   UPCOMING TASKS
   ========================================================= */

function renderUpcoming() {
    if (!upcomingList) return;

    upcomingList.innerHTML = "";

    const upcoming =
        tasks
            .filter(
                (task) =>
                    !task.completed &&
                    task.dueDate
            )
            .sort(
                (a, b) =>
                    parseDateKey(
                        a.dueDate
                    ) -
                    parseDateKey(
                        b.dueDate
                    )
            )
            .slice(0, 5);

    if (upcomingCount) {
        upcomingCount.textContent =
            upcoming.length;
    }

    if (!upcoming.length) {
        const empty =
            document.createElement(
                "div"
            );

        empty.className =
            "empty-state";

        empty.innerHTML =
            "<strong>No upcoming tasks</strong><p>Add a due date to your tasks to see them here.</p>";

        upcomingList.appendChild(
            empty
        );

        return;
    }

    upcoming.forEach(
        (task) => {
            const item =
                document.createElement(
                    "div"
                );

            item.className =
                "upcoming-item";

            const title =
                document.createElement(
                    "div"
                );

            title.className =
                "upcoming-title";

            title.textContent =
                task.text;

            const date =
                document.createElement(
                    "div"
                );

            date.className =
                "upcoming-date";

            const difference =
                daysFromToday(
                    task.dueDate
                );

            if (difference === 0) {
                date.textContent =
                    "Today";
            } else if (
                difference === 1
            ) {
                date.textContent =
                    "Tomorrow";
            } else if (
                difference > 1
            ) {
                date.textContent =
                    `In ${difference}d`;
            } else {
                date.textContent =
                    `${Math.abs(
                        difference
                    )}d overdue`;
            }

            item.appendChild(title);
            item.appendChild(date);

            upcomingList.appendChild(
                item
            );
        }
    );
}

/* =========================================================
   ANALYTICS
   ========================================================= */

function getLastSevenDays() {
    const days = [];

    for (let i = 6; i >= 0; i--) {
        const date =
            new Date();

        date.setDate(
            date.getDate() - i
        );

        days.push(date);
    }

    return days;
}

function getCompletedOnDate(dateKey) {
    return tasks.filter(
        (task) =>
            task.completedAt &&
            localDateKey(
                new Date(
                    task.completedAt
                )
            ) === dateKey
    ).length;
}

function renderAnalytics() {
    const days =
        getLastSevenDays();

    if (weeklyTrend) {
        weeklyTrend.innerHTML = "";

        const values =
            days.map(
                (date) =>
                    getCompletedOnDate(
                        localDateKey(
                            date
                        )
                    )
            );

        const max =
            Math.max(
                1,
                ...values
            );

        days.forEach(
            (date, index) => {
                const column =
                    document.createElement(
                        "div"
                    );

                column.className =
                    "trend-column";

                const bar =
                    document.createElement(
                        "div"
                    );

                bar.className =
                    "trend-bar";

                const height =
                    Math.max(
                        5,
                        (values[index] /
                            max) *
                            85
                    );

                bar.style.height =
                    `${height}%`;

                bar.title =
                    `${values[index]} completed`;

                const label =
                    document.createElement(
                        "div"
                    );

                label.className =
                    "trend-label";

                label.textContent =
                    date.toLocaleDateString(
                        undefined,
                        {
                            weekday:
                                "short"
                        }
                    ).slice(0, 3);

                column.appendChild(bar);
                column.appendChild(label);

                weeklyTrend.appendChild(
                    column
                );
            }
        );
    }

    if (activityChart) {
        activityChart.innerHTML = "";

        const activityDays = [];

        for (
            let i = 13;
            i >= 0;
            i--
        ) {
            const date =
                new Date();

            date.setDate(
                date.getDate() - i
            );

            activityDays.push(date);
        }

        const values =
            activityDays.map(
                (date) =>
                    getCompletedOnDate(
                        localDateKey(
                            date
                        )
                    )
            );

        const max =
            Math.max(
                1,
                ...values
            );

        values.forEach(
            (value, index) => {
                const column =
                    document.createElement(
                        "div"
                    );

                column.className =
                    "activity-column";

                const bar =
                    document.createElement(
                        "div"
                    );

                bar.className =
                    "activity-bar";

                const height =
                    Math.max(
                        5,
                        (value / max) *
                            90
                    );

                bar.style.height =
                    `${height}%`;

                bar.title =
                    `${value} completed`;

                column.appendChild(bar);

                activityChart.appendChild(
                    column
                );
            }
        );
    }
}

/* =========================================================
   GOALS
   ========================================================= */

function createGoal() {
    if (!goalNameInput) return;

    const name =
        goalNameInput.value.trim();

    const target =
        Number(
            goalTargetInput
                ? goalTargetInput.value
                : 1
        );

    const dueDate =
        goalDateInput
            ? goalDateInput.value
            : "";

    if (!name) {
        showToast("Enter a goal name 🎯");
        return;
    }

    const goal = {
        id:
            Date.now().toString() +
            Math.random()
                .toString(36)
                .slice(2),

        name,

        target:
            Math.max(1, target || 1),

        progress: 0,

        dueDate,

        createdAt:
            new Date().toISOString()
    };

    goals.unshift(goal);

    saveGoals();
    renderGoals();

    closeModal(goalModal);

    if (goalNameInput) {
        goalNameInput.value = "";
    }

    if (goalTargetInput) {
        goalTargetInput.value = "";
    }

    if (goalDateInput) {
        goalDateInput.value = "";
    }

    showToast("Goal created 🎯");
}

function deleteGoal(id) {
    goals = goals.filter(
        (goal) => goal.id !== id
    );

    saveGoals();
    renderGoals();

    showToast("Goal removed");
}

function updateGoalProgress(
    id,
    value
) {
    const goal =
        goals.find(
            (item) =>
                item.id === id
        );

    if (!goal) return;

    goal.progress =
        Math.max(
            0,
            Math.min(
                goal.target,
                Number(value) || 0
            )
        );

    saveGoals();
    renderGoals();
}

function autoAdvanceGoals() {
    goals.forEach(
        (goal) => {
            if (
                goal.progress <
                goal.target
            ) {
                goal.progress += 1;
            }
        }
    );

    saveGoals();
}

function renderGoals() {
    if (!goalsGrid) return;

    goalsGrid.innerHTML = "";

    if (goalsEmpty) {
        goalsEmpty.style.display =
            goals.length
                ? "none"
                : "block";
    }

    goals.forEach(
        (goal) => {
            const card =
                document.createElement(
                    "article"
                );

            card.className =
                "goal-card";

            const percent =
                Math.min(
                    100,
                    Math.round(
                        (goal.progress /
                            goal.target) *
                            100
                    )
                );

            const top =
                document.createElement(
                    "div"
                );

            top.className =
                "goal-top";

            const info =
                document.createElement(
                    "div"
                );

            const name =
                document.createElement(
                    "div"
                );

            name.className =
                "goal-name";

            name.textContent =
                goal.name;

            const deadline =
                document.createElement(
                    "div"
                );

            deadline.className =
                "goal-deadline";

            deadline.textContent =
                goal.dueDate
                    ? `Deadline: ${formatDate(
                          goal.dueDate
                      )}`
                    : "No deadline";

            info.appendChild(name);
            info.appendChild(
                deadline
            );

            const percentElement =
                document.createElement(
                    "div"
                );

            percentElement.className =
                "goal-percent";

            percentElement.textContent =
                `${percent}%`;

            top.appendChild(info);
            top.appendChild(
                percentElement
            );

            const progress =
                document.createElement(
                    "div"
                );

            progress.className =
                "goal-progress";

            const progressBar =
                document.createElement(
                    "div"
                );

            progressBar.className =
                "goal-progress-bar";

            progressBar.style.width =
                `${percent}%`;

            progress.appendChild(
                progressBar
            );

            const footer =
                document.createElement(
                    "div"
                );

            footer.className =
                "goal-footer";

            const amount =
                document.createElement(
                    "span"
                );

            amount.textContent =
                `${goal.progress} / ${goal.target}`;

            const deleteButton =
                document.createElement(
                    "button"
                );

            deleteButton.type = "button";

            deleteButton.textContent =
                "Delete";

            deleteButton.style.background =
                "transparent";

            deleteButton.style.color =
                "var(--muted)";

            deleteButton.style.cursor =
                "pointer";

            deleteButton.addEventListener(
                "click",
                () =>
                    deleteGoal(
                        goal.id
                    )
            );

            footer.appendChild(amount);
            footer.appendChild(
                deleteButton
            );

            card.appendChild(top);
            card.appendChild(progress);
            card.appendChild(footer);

            goalsGrid.appendChild(card);
        }
    );
}

/* =========================================================
   NOTES
   ========================================================= */

function updateCharacterCount() {
    if (!noteInput || !characterCount) {
        return;
    }

    characterCount.textContent =
        `${noteInput.value.length} characters`;
}

function saveNote() {
    if (!noteInput) return;

    localStorage.setItem(
        STORAGE.note,
        noteInput.value
    );

    if (noteStatus) {
        noteStatus.textContent =
            "Saved locally just now";
    }

    showToast("Note saved 💾");
}

function autosaveNote() {
    if (!noteInput) return;

    localStorage.setItem(
        STORAGE.note,
        noteInput.value
    );

    if (noteStatus) {
        noteStatus.textContent =
            "Autosaved locally";
    }

    updateCharacterCount();
}

/* =========================================================
   SEARCH
   ========================================================= */

function performSearch() {
    if (!searchInput || !searchResult) {
        return;
    }

    const query =
        searchInput.value
            .trim()
            .toLowerCase();

    if (!query) {
        searchResult.textContent =
            "Type something to search your tasks, goals, and notes.";
        return;
    }

    const matchingTasks =
        tasks.filter(
            (task) =>
                task.text
                    .toLowerCase()
                    .includes(query) ||
                task.category
                    .toLowerCase()
                    .includes(query)
        );

    const matchingGoals =
        goals.filter(
            (goal) =>
                goal.name
                    .toLowerCase()
                    .includes(query)
        );

    const noteMatch =
        noteInput &&
        noteInput.value
            .toLowerCase()
            .includes(query);

    searchResult.innerHTML =
        `<strong>${matchingTasks.length}</strong> task${
            matchingTasks.length === 1
                ? ""
                : "s"
        }, <strong>${matchingGoals.length}</strong> goal${
            matchingGoals.length === 1
                ? ""
                : "s"
        }${
            noteMatch
                ? ", and a matching note"
                : ""
        }.`;

    searchSection &&
        searchSection.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });
}

/* =========================================================
   THEME SYSTEM
   ========================================================= */

function applyTheme() {
    document.body.dataset.theme =
        selectedTheme;

    document.body.classList.toggle(
        "light-mode",
        appearance === "light"
    );

    $$(".theme-button").forEach(
        (button) => {
            button.classList.toggle(
                "active",
                button.dataset.theme ===
                    selectedTheme
            );
        }
    );

    $$(".appearance-button").forEach(
        (button) => {
            button.classList.toggle(
                "active",
                button.dataset.appearance ===
                    appearance
            );
        }
    );
}

function setTheme(theme) {
    selectedTheme = theme;

    localStorage.setItem(
        STORAGE.theme,
        theme
    );

    applyTheme();

    showToast(
        `${capitalize(theme)} theme applied ✨`
    );
}

function setAppearance(value) {
    appearance = value;

    localStorage.setItem(
        STORAGE.appearance,
        value
    );

    applyTheme();

    showToast(
        `${capitalize(value)} mode enabled`
    );
}

/* =========================================================
   MODALS
   ========================================================= */

function openModal(modal) {
    if (!modal) return;

    modal.classList.add(
        "open",
        "active"
    );

    document.body.style.overflow =
        "hidden";
}

function closeModal(modal) {
    if (!modal) return;

    modal.classList.remove(
        "open",
        "active"
    );

    if (
        !document.querySelector(
            ".modal.open, .modal.active"
        )
    ) {
        document.body.style.overflow =
            "";
    }
}

function openTaskCreator() {
    openModal(taskModal);

    if (modalTaskInput) {
        setTimeout(
            () =>
                modalTaskInput.focus(),
            100
        );
    }
}

function addTaskFromModal() {
    if (!modalTaskInput) return;

    const task =
        createTask({
            text:
                modalTaskInput.value,

            category:
                modalTaskCategory
                    ? modalTaskCategory
                          .value
                    : "General",

            priority:
                modalTaskPriority
                    ? modalTaskPriority
                          .value
                    : "medium",

            dueDate:
                modalTaskDate
                    ? modalTaskDate.value
                    : "",

            reminder:
                modalTaskReminder
                    ? modalTaskReminder.value
                    : ""
        });

    if (!task) return;

    modalTaskInput.value = "";

    if (modalTaskDate) {
        modalTaskDate.value = "";
    }

    if (modalTaskReminder) {
        modalTaskReminder.value = "";
    }

    closeModal(taskModal);
}

/* =========================================================
   SETTINGS
   ========================================================= */

function openSettings() {
    openModal(settingsModal);
}

function exportData() {
    const data = {
        app: "Frictionless",
        version: "2.0",
        exportedAt:
            new Date().toISOString(),

        tasks,
        goals,

        note:
            localStorage.getItem(
                STORAGE.note
            ) || "",

        theme: selectedTheme,

        appearance,

        focusMinutes,

        focusSessions
    };

    const blob =
        new Blob(
            [
                JSON.stringify(
                    data,
                    null,
                    2
                )
            ],
            {
                type:
                    "application/json"
            }
        );

    const url =
        URL.createObjectURL(blob);

    const link =
        document.createElement("a");

    link.href = url;

    link.download =
        `frictionless-backup-${localDateKey()}.json`;

    document.body.appendChild(link);

    link.click();

    link.remove();

    URL.revokeObjectURL(url);

    showToast(
        "Your Frictionless data was exported 💾"
    );
}

function clearAllData() {
    const confirmed =
        window.confirm(
            "This will permanently clear your Frictionless tasks, goals, note, focus data, and preferences on this browser. Continue?"
        );

    if (!confirmed) return;

    Object.values(STORAGE).forEach(
        (key) =>
            localStorage.removeItem(
                key
            )
    );

    tasks = [];
    goals = [];

    selectedTheme = "aurora";
    appearance = "dark";

    focusMinutes = 0;
    focusSessions = 0;

    saveTasks();
    saveGoals();

    if (noteInput) {
        noteInput.value = "";
    }

    applyTheme();
    renderEverything();

    closeModal(settingsModal);

    showToast(
        "Workspace cleared"
    );
}

/* =========================================================
   NAVIGATION
   ========================================================= */

function setupNavigation() {
    $$("[data-scroll]").forEach(
        (button) => {
            button.addEventListener(
                "click",
                () => {
                    const target =
                        button.dataset.scroll;

                    const element =
                        document.getElementById(
                            target
                        );

                    if (element) {
                        element.scrollIntoView(
                            {
                                behavior:
                                    "smooth",
                                block:
                                    "start"
                            }
                        );
                    }
                }
            );
        }
    );
}

/* =========================================================
   EVENT LISTENERS
   ========================================================= */

if (createTaskButton) {
    createTaskButton.addEventListener(
        "click",
        addTaskFromInput
    );
}

if (taskInput) {
    taskInput.addEventListener(
        "keydown",
        (event) => {
            if (
                event.key ===
                "Enter"
            ) {
                addTaskFromInput();
            }
        }
    );
}

$$("[data-filter]").forEach(
    (button) => {
        button.addEventListener(
            "click",
            () => {
                currentFilter =
                    button.dataset.filter;

                $$("[data-filter]").forEach(
                    (item) =>
                        item.classList.toggle(
                            "active",
                            item.dataset
                                .filter ===
                                currentFilter
                        )
                );

                renderTasks();
            }
        );
    }
);

if (categoryFilter) {
    categoryFilter.addEventListener(
        "change",
        () => {
            currentCategory =
                categoryFilter.value;

            renderTasks();
        }
    );
}

if (taskSortButton) {
    taskSortButton.addEventListener(
        "click",
        () => {
            const options = [
                "newest",
                "oldest",
                "priority",
                "due"
            ];

            const currentIndex =
                options.indexOf(
                    currentSort
                );

            currentSort =
                options[
                    (currentIndex + 1) %
                        options.length
                ];

            const labels = {
                newest:
                    "Newest first",
                oldest:
                    "Oldest first",
                priority:
                    "Priority first",
                due:
                    "Due date first"
            };

            taskSortButton.textContent =
                labels[currentSort];

            renderTasks();
        }
    );
}

if (timerStart) {
    timerStart.addEventListener(
        "click",
        startTimer
    );
}

if (timerReset) {
    timerReset.addEventListener(
        "click",
        resetTimer
    );
}

if (previousMonth) {
    previousMonth.addEventListener(
        "click",
        () => {
            calendarDate.setMonth(
                calendarDate.getMonth() -
                    1
            );

            renderCalendar();
        }
    );
}

if (nextMonth) {
    nextMonth.addEventListener(
        "click",
        () => {
            calendarDate.setMonth(
                calendarDate.getMonth() +
                    1
            );

            renderCalendar();
        }
    );
}

if (todayButton) {
    todayButton.addEventListener(
        "click",
        () => {
            calendarDate =
                new Date();

            renderCalendar();
        }
    );
}

if (saveNoteButton) {
    saveNoteButton.addEventListener(
        "click",
        saveNote
    );
}

if (noteInput) {
    noteInput.addEventListener(
        "input",
        autosaveNote
    );
}

if (searchInput) {
    searchInput.addEventListener(
        "input",
        performSearch
    );
}

if (searchButton) {
    searchButton.addEventListener(
        "click",
        () => {
            if (searchSection) {
                searchSection.scrollIntoView(
                    {
                        behavior:
                            "smooth",
                        block:
                            "center"
                    }
                );
            }

            if (searchInput) {
                setTimeout(
                    () =>
                        searchInput.focus(),
                    300
                );
            }
        }
    );
}

if (themeButton) {
    themeButton.addEventListener(
        "click",
        openSettings
    );
}

if (settingsButton) {
    settingsButton.addEventListener(
        "click",
        openSettings
    );
}

if (addTaskButton) {
    addTaskButton.addEventListener(
        "click",
        openTaskCreator
    );
}

if (quickTaskButton) {
    quickTaskButton.addEventListener(
        "click",
        openTaskCreator
    );
}

if (quickFocusButton) {
    quickFocusButton.addEventListener(
        "click",
        () => {
            document
                .getElementById(
                    "focus"
                )
                ?.scrollIntoView({
                    behavior:
                        "smooth"
                });
        }
    );
}

if (quickNoteButton) {
    quickNoteButton.addEventListener(
        "click",
        () => {
            noteInput?.focus();

            noteInput?.scrollIntoView({
                behavior: "smooth",
                block: "center"
            });
        }
    );
}

if (quickGoalButton) {
    quickGoalButton.addEventListener(
        "click",
        () =>
            openModal(goalModal)
    );
}

if (focusButton) {
    focusButton.addEventListener(
        "click",
        () => {
            document
                .getElementById(
                    "focus"
                )
                ?.scrollIntoView({
                    behavior:
                        "smooth"
                });
        }
    );
}

if (addGoalButton) {
    addGoalButton.addEventListener(
        "click",
        () =>
            openModal(goalModal)
    );
}

if (emptyGoalButton) {
    emptyGoalButton.addEventListener(
        "click",
        () =>
            openModal(goalModal)
    );
}

if (createGoalButton) {
    createGoalButton.addEventListener(
        "click",
        createGoal
    );
}

if (closeTaskModal) {
    closeTaskModal.addEventListener(
        "click",
        () =>
            closeModal(taskModal)
    );
}

if (closeGoalModal) {
    closeGoalModal.addEventListener(
        "click",
        () =>
            closeModal(goalModal)
    );
}

if (closeSettingsModal) {
    closeSettingsModal.addEventListener(
        "click",
        () =>
            closeModal(settingsModal)
    );
}

modalAddTask?.addEventListener(
    "click",
    addTaskFromModal
);

$$(".theme-button").forEach(
    (button) => {
        button.addEventListener(
            "click",
            () => {
                const theme =
                    button.dataset.theme;

                if (theme) {
                    setTheme(theme);
                }
            }
        );
    }
);

$$(".appearance-button").forEach(
    (button) => {
        button.addEventListener(
            "click",
            () => {
                const value =
                    button.dataset
                        .appearance;

                if (value) {
                    setAppearance(
                        value
                    );
                }
            }
        );
    }
);

if (exportDataButton) {
    exportDataButton.addEventListener(
        "click",
        exportData
    );
}

if (clearDataButton) {
    clearDataButton.addEventListener(
        "click",
        clearAllData
    );
}

/* =========================================================
   CLOSE MODALS BY BACKDROP
   ========================================================= */

$$(".modal").forEach(
    (modal) => {
        modal.addEventListener(
            "click",
            (event) => {
                if (
                    event.target ===
                    modal
                ) {
                    closeModal(modal);
                }
            }
        );
    }
);

/* =========================================================
   ESCAPE KEY
   ========================================================= */

document.addEventListener(
    "keydown",
    (event) => {
        if (
            event.key === "Escape"
        ) {
            $$(".modal").forEach(
                (modal) =>
                    closeModal(modal)
            );
        }

        if (
            (event.ctrlKey ||
                event.metaKey) &&
            event.key.toLowerCase() ===
                "k"
        ) {
            event.preventDefault();

            if (searchSection) {
                searchSection.scrollIntoView(
                    {
                        behavior:
                            "smooth",
                        block:
                            "center"
                    }
                );
            }

            setTimeout(
                () =>
                    searchInput?.focus(),
                250
            );
        }
    }
);

/* =========================================================
   REMINDERS
   ========================================================= */

function checkReminders() {
    const now = new Date();

    const currentDateValue =
        localDateKey(now);

    const currentTimeValue =
        `${pad(now.getHours())}:${pad(
            now.getMinutes()
        )}`;

    tasks.forEach(
        (task) => {
            if (
                task.completed ||
                !task.reminder ||
                !task.dueDate
            ) {
                return;
            }

            if (
                task.dueDate ===
                    currentDateValue &&
                task.reminder ===
                    currentTimeValue
            ) {
                showToast(
                    `🔔 Reminder: ${task.text}`
                );
            }
        }
    );
}

setInterval(
    checkReminders,
    60000
);

/* =========================================================
   RENDER EVERYTHING
   ========================================================= */

function renderEverything() {
    populateCategoryFilter();

    renderTasks();

    updateStats();

    updateTimerDisplay();

    renderStreak();

    renderCalendar();

    renderUpcoming();

    renderAnalytics();

    renderGoals();

    updateCharacterCount();
}

/* =========================================================
   INITIALIZATION
   ========================================================= */

loadData();

setupNavigation();

renderEverything();

showToast(
    "Frictionless is ready ✨"
);

/* =========================================================
   DEBUG HELPER
   ========================================================= */

window.Frictionless = {
    tasks,
    goals,

    addTask: createTask,

    deleteTask,

    toggleTask,

    setTheme,

    setAppearance,

    exportData
};

/* =========================================================
   END
   ========================================================= */
