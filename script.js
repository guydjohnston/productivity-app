const focusMinutesEl = document.getElementById("focus-minutes");
const focusSecondsEl = document.getElementById("focus-seconds");
const breakMinutesEl = document.getElementById("break-minutes");
const breakSecondsEl = document.getElementById("break-seconds");
const focusBtn = document.getElementById("focus-btn");
const breakBtn = document.getElementById("break-btn");
const resetBtn = document.getElementById("reset-btn");
const focusSessionMarkers = document.querySelectorAll(".focus-session-marker");
const breakSessionMarkers = document.querySelectorAll(".break-session-marker");
const addFocusSessionBtn = document.getElementById("add-focus-session-btn");
const removeFocusSessionBtn = document.getElementById("remove-focus-session-btn");
const addBreakSessionBtn = document.getElementById("add-break-session-btn");
const removeBreakSessionBtn = document.getElementById("remove-break-session-btn");

const msPerSecond = 1000;
const msPerMinute = 60 * msPerSecond;

const focusSessionMinutes = 0.1;
const totalFocusSessions = 4;

// Class for the focus and break timers
class TimerState {
    constructor(name, fullSessionMinutes, button, minutesElement, secondsElement, sessionMarkerClass, addSessionButton, removeSessionButton, totalSessions) {
        this.name = name;
        this.sessionsCompleted = 0;
        this.isTimerRunning = false;
        this.fullSessionMinutes = fullSessionMinutes;
        this.msLeftInSession = fullSessionMinutes * msPerMinute;
        this.sessionEndTime = null;
        this.button = button;
        this.minutesElement = minutesElement;
        this.secondsElement = secondsElement;
        this.sessionMarkers = document.querySelectorAll(`.${sessionMarkerClass}`);
        this.addSessionButton = addSessionButton;
        this.removeSessionButton = removeSessionButton;
        this.totalSessions = totalSessions;
    }
}

// Create timer state object for the focus timer
const focusTimerState = new TimerState(
    "Focus",
    focusSessionMinutes,
    focusBtn,
    focusMinutesEl,
    focusSecondsEl,
    "focus-session-marker",
    addFocusSessionBtn,
    removeBreakSessionBtn,
    totalFocusSessions
);

// Create timer state object for the break timer
const breakTimerState = new TimerState(
    "Break",
    focusSessionMinutes / 5, // Set the length of each break session to always be 1/5 the length of a focus session
    breakBtn,
    breakMinutesEl,
    breakSecondsEl,
    "break-session-marker",
    addBreakSessionBtn,
    removeBreakSessionBtn,
    totalFocusSessions - 1 // There's always one fewer break session than focus sessions
);

const saveTimerState = (state) => {
    const timerName = state.name.toLowerCase() + "Timer";
    
    // An object with the variables that need to be saved for each timer when the browser window is closed
    const timerStateSaved = {
        sessionsCompleted: state.sessionsCompleted,
        isTimerRunning: state.isTimerRunning,
        msLeftInSession: state.msLeftInSession,
        sessionEndTime: state.sessionEndTime
    };
    
    localStorage.setItem(timerName, JSON.stringify(timerStateSaved));
};

const loadTimerState = (state) => {
    const timerName = state.name.toLowerCase() + "Timer";

    const timerStateLoaded = JSON.parse(localStorage.getItem(timerName));

    // If there was data saved in local storage, update timer state object using values from local storage then update time displayed and display of sessions completed
    if (timerStateLoaded) {
        Object.assign(state, timerStateLoaded);
    }
};

// Update the minutes and seconds shown on the timer display
const updateCountdownDisplay = (state, msToDisplay) => {
    const minutesDisplayed = Math.floor(msToDisplay / msPerMinute).toString().padStart(2, "0");
    const secondsDisplayed = Math.round((msToDisplay / msPerSecond) % 60).toString().padStart(2, "0");

    // Update the focus timer display on the page
    state.minutesElement.textContent = minutesDisplayed;
    state.secondsElement.textContent = secondsDisplayed;
};

// Update the visual markers on the page to show the number of focus or break sessions completed
const updateSessionsDisplay = (state) => {
    state.sessionMarkers.forEach((marker, index) => {
        if (index < state.sessionsCompleted) {
            marker.classList.add("completed");
        } else {
            marker.classList.remove("completed");
        };
    });
};

const fullyResetTimer = (state) => {
    pauseTimer(state);
    state.msLeftInSession = state.fullSessionMinutes * msPerMinute;
    state.sessionsCompleted = 0;
    saveTimerState(state);
    updateCountdownDisplay(state, state.msLeftInSession);
    updateSessionsDisplay(state);
};

const resetTimerEndTime = (state) => {
    const currentTime = Date.now();
    state.sessionEndTime = currentTime + state.fullSessionMinutes * msPerMinute;
    saveTimerState(state);
};

const endTimerSession = (state) => {
    // Reset the time left for the next session
    resetTimerEndTime(state);

    // Update the number of sessions completed and display it on the screen
    state.sessionsCompleted++;
    saveTimerState(state);
    updateSessionsDisplay(state);

    if (state === breakTimerState) {
        // If there's still another break session due, start the next break session
        if (breakTimerState.sessionsCompleted < focusTimerState.sessionsCompleted) {

            // Continue updating the break timer recursively
            updateTimer(breakTimerState);
            return;
        }
        // Otherwise pause the break timer and start the next focus session
        else {
            // alert("Break session finished. Back to work!");
            pauseTimer(breakTimerState);
            startTimer(focusTimerState);
            return;
        }
    }

    if (state === focusTimerState) {
        // When all the focus sessions are complete for the day, alert the user and stop and reset both timers
        if (focusTimerState.sessionsCompleted === focusTimerState.totalSessions) {
            setTimeout(() => {
                alert("Focus time completed for today!");
                fullyResetTimer(focusTimerState);
                fullyResetTimer(breakTimerState);
            }, 100);
            return;
        }
        // Otherwise continue with the next focus session
        else {
            updateTimer(focusTimerState);
        }
    };
};

const updateTimer = (state) => {
    // Only continue running the timer if it's toggled to be running
    if (state.isTimerRunning) {
        const currentTime = Date.now();

        // If the timer has ended, determine what to do next and don't update the timer display
        if (currentTime >= state.sessionEndTime) {
            endTimerSession(state);
            return;
        }

        // Work out how many milliseconds there are between now and the session end time
        const msToDisplay = state.sessionEndTime - currentTime;

        // Update the minutes and seconds displayed
        updateCountdownDisplay(state, msToDisplay);

        // Run this function again in one second
        setTimeout(() => updateTimer(state), 1000);
        return;
    }
};

const startTimer = (state) => {
    // Pause the break timer when starting the focus timer, and vice-versa
    if (state === focusTimerState) {
        if (breakTimerState.isTimerRunning === true) pauseTimer(breakTimerState);
    } else if (state === breakTimerState) {
        if (focusTimerState.isTimerRunning === true) pauseTimer(focusTimerState);
    }

    // Set the end time in milliseconds for the current focus session
    state.sessionEndTime = Date.now() + state.msLeftInSession;

    // Unset the time left in the current session until the timer is paused again
    state.msLeftInSession = null;

    state.button.textContent = `Pause ${state.name} Timer`;
    state.isTimerRunning = true;
    saveTimerState(state);

    // Start updating the timer recursively
    updateTimer(state);
};

const pauseTimer = (state) => {
    // Save the number of milliseconds left in the current focus sessions, for when the focus timer is restarted
    state.msLeftInSession = state.sessionEndTime - Date.now();

    // Unset the end time for the current focus session until the focus timer is started again
    state.sessionEndTime = null;

    state.button.textContent = `Start ${state.name} Timer`;
    state.isTimerRunning = false;
    saveTimerState(state);
}

const startOrPauseTimer = (state) => {
    // If all the break sessions are completed, don't start the break timer
    if (state === breakTimerState) {
        if (breakTimerState.sessionsCompleted >= breakTimerState.totalSessions) {
            alert("No more break sessions left!");
            return;
        }
    }

    // Start/resume or pause the timer, depending on whether it's already running
    if (!state.isTimerRunning) {
        startTimer(state);
    } else {
        pauseTimer(state);
    };
};

// Fully reset both timers
const resetBothTimers = () => {
    fullyResetTimer(focusTimerState);
    fullyResetTimer(breakTimerState);
};

const resumeRunningTimer = (state) => {
    state.button.textContent = `Pause ${state.name} Timer`;

    // Update the display of the timer that's not running
    if (state === focusTimerState) {
        updateCountdownDisplay(breakTimerState, breakTimerState.msLeftInSession);
    } else if (state === breakTimerState) {
        updateCountdownDisplay(focusTimerState, focusTimerState.msLeftInSession);
    }

    // Update both sessions displays
    updateSessionsDisplay(focusTimerState);
    updateSessionsDisplay(breakTimerState);

    // Continue updating the timer that's running recursively (which will also update its timer display)
    updateTimer(state);
};

window.onload = (event) => {
    // When the page loads, load stored data from local storage for both timers
    loadTimerState(focusTimerState);
    loadTimerState(breakTimerState);

    // If one of the timers was running, resume the running timer
    if (focusTimerState.isTimerRunning) {
        resumeRunningTimer(focusTimerState);
    } else if (breakTimerState.isTimerRunning) {
        resumeRunningTimer(breakTimerState);
    }
    // Otherwise, update both displays using the time left in the session and update both sessions displays
    else {
        updateCountdownDisplay(focusTimerState, focusTimerState.msLeftInSession);
        updateCountdownDisplay(breakTimerState, breakTimerState.msLeftInSession);
        updateSessionsDisplay(focusTimerState);
        updateSessionsDisplay(breakTimerState);
    }
};

const removeCompletedSession = (state) => {
    // If there's at least one session completed, remove one and update the sessions display
    if (state.sessionsCompleted > 0) {
        state.sessionsCompleted--;
        updateSessionsDisplay(state);
    }
};

const addCompletedSession = (state) => {
    // If it won't lead to the final session being completed, add another completed session and update the sessions display
    if (state.sessionsCompleted < state.totalSessions - 1) {
        state.sessionsCompleted++;
        updateSessionsDisplay(state);
    } 
};

focusBtn.addEventListener("click", () => startOrPauseTimer(focusTimerState));
breakBtn.addEventListener("click", () => startOrPauseTimer(breakTimerState));
resetBtn.addEventListener("click", resetBothTimers);

removeFocusSessionBtn.addEventListener("click", () => removeCompletedSession(focusTimerState));
addFocusSessionBtn.addEventListener("click", () => addCompletedSession(focusTimerState));
removeBreakSessionBtn.addEventListener("click", () => removeCompletedSession(breakTimerState));
addBreakSessionBtn.addEventListener("click", () => addCompletedSession(breakTimerState));