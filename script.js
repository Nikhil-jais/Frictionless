"use strict";

const STORAGE_TASKS = "frictionless_tasks";
const STORAGE_NOTE = "frictionless_note";
const STORAGE_THEME = "frictionless_theme";
const STORAGE_FOCUS = "frictionless_focus_minutes";

let tasks = JSON.parse(localStorage.getItem(STORAGE_TASKS) || "[]");
let currentFilter = "all";

let timerSeconds = 25 * 60;
let timerRunning = false;
let timerInterval = null;
let focusMinutes = Number(localStorage.getItem(STORAGE_FOCUS) || 0);

const taskInput = document.getElementById("taskInput");
const createTaskButton = document.getElementById("createTaskButton");
const taskList = document.getElementById("taskList");
const taskEmpty = document.getElementById("taskEmpty");
const taskCounter = document.getElementById("taskCounter");

const completedStat = document.getElementById("completedStat");
const activeStat = document.getElementById("activeStat");
const focusStat = document.getElementById("focusStat");
const progressStat = document.getElementById("progressStat");

const noteInput = document.getElementById("noteInput");
const noteStatus = document.getElementById("noteStatus");
const characterCount = document.getElementById("characterCount");

const timerDisplay = document.getElementById("timerDisplay");
const timerStart = document.getElementById("timerStart");
const timerReset = document.getElementById("timerReset");
const timerRing = document.querySelector(".timer-ring");
const focusStatus = document.getElementById("focusStatus");

const toast = document.getElementById("toast");
const toastMessage = document.getElementById("toastMessage");

const modal = document.getElementById("taskModal");
const modalTaskInput = document.getElementById("modalTaskInput");

const searchInput = document.getElementById("searchInput");
const searchResult = document.getElementById("searchResult");

function saveTasks() {
    localStorage.setItem(STORAGE_TASKS, JSON.stringify(tasks));
}

function showToast(message) {
    toastMessage.textContent = message;
    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
    }, 2200);
}

function createTask(text) {
    const cleanText = text.trim();

    if (!cleanText) {
        showToast("Write a task first.");
        return;
    }

    tasks.unshift({
        id: Date.now(),
        text: cleanText,
        completed: false,
        createdAt: new Date().toISOString()
    });

    saveTasks();
    renderTasks();
    updateStats();

    showToast("Task added.");
}

function deleteTask(id) {
    tasks = tasks.filter(task => task.id !== id);

    saveTasks();
    renderTasks();
    updateStats();

    showToast("Task removed.");
}

function toggleTask(id) {
    const task = tasks.find(item => item.id === id);

    if (!task) {
        return;
    }

    task.completed = !task.completed;

    saveTasks();
    renderTasks();
    updateStats();

    showToast(task.completed ? "Task completed! 🎉" : "Task reopened.");
}

function getVisibleTasks() {
    if (currentFilter === "active") {
        return tasks.filter(task => !task.completed);
    }

    if (currentFilter === "completed") {
        return tasks.filter(task => task.completed);
    }

    return tasks;
}

function renderTasks() {
    taskList.innerHTML = "";

    const visibleTasks = getVisibleTasks();

    if (visibleTasks.length === 0) {
        taskEmpty.style.display = "block";
        return;
    }

    taskEmpty.style.display = "none";

    visibleTasks.forEach(task => {
        const item = document.createElement("div");

        item.className = "task-item";

        if (task.completed) {
            item.classList.add("completed");
        }

        item.innerHTML = `
            <button class="task-check" aria-label="Complete task">
                ${task.completed ? "✓" : ""}
            </button>

            <span class="task-text"></span>

            <button class="delete-task" aria-label="Delete task">
                ×
            </button>
        `;

        const textElement = item.querySelector(".task-text");
        textElement.textContent = task.text;

        item.querySelector(".task-check").addEventListener(
            "click",
            () => toggleTask(task.id)
        );

        item.querySelector(".delete-task").addEventListener(
            "click",
            () => deleteTask(task.id)
        );

        taskList.appendChild(item);
    });
}

function updateStats() {
    const completed = tasks.filter(task => task.completed).length;
    const active = tasks.filter(task => !task.completed).length;

    const progress = tasks.length === 0
        ? 0
        : Math.round((completed / tasks.length) * 100);

    completedStat.textContent = completed;
    activeStat.textContent = active;
    focusStat.textContent = focusMinutes;
    progressStat.textContent = `${progress}%`;

    taskCounter.textContent =
        `${tasks.length} ${tasks.length === 1 ? "task" : "tasks"}`;
}

function addTaskFromInput() {
    createTask(taskInput.value);
    taskInput.value = "";
    taskInput.focus();
}

createTaskButton.addEventListener("click", addTaskFromInput);

taskInput.addEventListener("keydown", event => {
    if (event.key === "Enter") {
        addTaskFromInput();
    }
});

document.querySelectorAll(".filter-button").forEach(button => {
    button.addEventListener("click", () => {

        document
            .querySelectorAll(".filter-button")
            .forEach(item => item.classList.remove("active"));

        button.classList.add("active");

        currentFilter = button.dataset.filter;

        renderTasks();
    });
});


function updateClock() {
    const now = new Date();

    const time = now.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
    });

    const date = now.toLocaleDateString([], {
        weekday: "long",
        month: "short",
        day: "numeric"
    });

    document.getElementById("currentTime").textContent = time;
    document.getElementById("currentDate").textContent = date;
}

setInterval(updateClock, 1000);
updateClock();


function updateTimerDisplay() {
    const minutes = Math.floor(timerSeconds / 60);
    const seconds = timerSeconds % 60;

    timerDisplay.textContent =
        `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

    const totalSeconds = 25 * 60;
    const percentage =
        ((totalSeconds - timerSeconds) / totalSeconds) * 360;

    timerRing.style.background =
        `conic-gradient(var(--accent) ${percentage}deg, rgba(255,255,255,0.06) ${percentage}deg)`;
}

function startTimer() {

    if (timerRunning) {
        timerRunning = false;
        clearInterval(timerInterval);

        timerStart.textContent = "Resume";
        focusStatus.textContent = "Paused";

        return;
    }

    timerRunning = true;

    timerStart.textContent = "Pause";
    focusStatus.textContent = "Focusing";

    timerInterval = setInterval(() => {

        if (timerSeconds <= 0) {

            clearInterval(timerInterval);

            timerRunning = false;
            timerStart.textContent = "Start";
            focusStatus.textContent = "Complete";

            focusMinutes += 25;

            localStorage.setItem(
                STORAGE_FOCUS,
                focusMinutes
            );

            timerSeconds = 25 * 60;

            updateTimerDisplay();
            updateStats();

            showToast("Focus session complete! 🎯");

            return;
        }

        timerSeconds--;

        updateTimerDisplay();

    }, 1000);
}

function resetTimer() {

    clearInterval(timerInterval);

    timerRunning = false;
    timerSeconds = 25 * 60;

    timerStart.textContent = "Start";
    focusStatus.textContent = "Ready";

    updateTimerDisplay();
}

timerStart.addEventListener("click", startTimer);
timerReset.addEventListener("click", resetTimer);


noteInput.value = localStorage.getItem(STORAGE_NOTE) || "";

function updateNoteInfo() {
    characterCount.textContent =
        `${noteInput.value.length} characters`;
}

noteInput.addEventListener("input", () => {

    localStorage.setItem(
        STORAGE_NOTE,
        noteInput.value
    );

    noteStatus.textContent = "Saved locally";
    updateNoteInfo();
});

document.getElementById("saveNoteButton").addEventListener("click", () => {

    localStorage.setItem(
        STORAGE_NOTE,
        noteInput.value
    );

    noteStatus.textContent = "Saved just now";

    showToast("Note saved.");
});

updateNoteInfo();


const taskModalButton = document.getElementById("addTaskButton");
const closeTaskModal = document.getElementById("closeTaskModal");
const modalAddTask = document.getElementById("modalAddTask");

taskModalButton.addEventListener("click", () => {

    modal.classList.add("show");

    setTimeout(() => {
        modalTaskInput.focus();
    }, 100);
});

closeTaskModal.addEventListener("click", () => {
    modal.classList.remove("show");
});

modal.addEventListener("click", event => {

    if (event.target === modal) {
        modal.classList.remove("show");
    }
});

modalAddTask.addEventListener("click", () => {

    createTask(modalTaskInput.value);

    modalTaskInput.value = "";

    modal.classList.remove("show");
});

modalTaskInput.addEventListener("keydown", event => {

    if (event.key === "Enter") {
        modalAddTask.click();
    }

    if (event.key === "Escape") {
        modal.classList.remove("show");
    }
});


document.getElementById("focusButton").addEventListener("click", () => {

    document
        .querySelector(".focus-panel")
        .scrollIntoView({
            behavior: "smooth",
            block: "center"
        });

    showToast("Focus mode is ready.");
});


document.getElementById("noteButton").addEventListener("click", () => {

    noteInput.focus();

    noteInput.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });
});


const themeButton = document.getElementById("themeButton");

function applySavedTheme() {

    const savedTheme =
        localStorage.getItem(STORAGE_THEME);

    if (savedTheme === "light") {
        document.body.classList.add("light-mode");
    }
}

themeButton.addEventListener("click", () => {

    document.body.classList.toggle("light-mode");

    const light =
        document.body.classList.contains("light-mode");

    localStorage.setItem(
        STORAGE_THEME,
        light ? "light" : "dark"
    );

    showToast(
        light
            ? "Light mode enabled."
            : "Dark mode enabled."
    );
});

applySavedTheme();


searchInput.addEventListener("input", () => {

    const query =
        searchInput.value.trim().toLowerCase();

    if (!query) {
        searchResult.textContent =
            "Type to search your tasks and notes.";

        return;
    }

    const matchingTasks =
        tasks.filter(task =>
            task.text.toLowerCase().includes(query)
        );

    const noteMatches =
        noteInput.value.toLowerCase().includes(query);

    const totalMatches =
        matchingTasks.length + (noteMatches ? 1 : 0);

    if (totalMatches === 0) {

        searchResult.textContent =
            `No results found for "${query}".`;

        return;
    }

    searchResult.textContent =
        `${totalMatches} result${totalMatches === 1 ? "" : "s"} found for "${query}".`;
});


document.addEventListener("keydown", event => {

    if (
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === "k"
    ) {

        event.preventDefault();

        searchInput.focus();
    }
});


renderTasks();
updateStats();
updateTimerDisplay();
