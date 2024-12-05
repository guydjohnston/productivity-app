const focusMinutesEl = document.getElementById("focus-minutes");
const focusSecondsEl = document.getElementById("focus-seconds");
const breakMinutesEl = document.getElementById("break-minutes");
const breakSecondsEl = document.getElementById("break-seconds");
const endingHoursEl = document.getElementById("ending-hours");
const endingMinutesEl = document.getElementById("ending-minutes");
const focusBtn = document.getElementById("focus-btn");
const breakBtn = document.getElementById("break-btn");
const resetBtn = document.getElementById("reset-btn");
const focusSessionMarkers = document.querySelectorAll(".focus-session-marker");
const breakSessionMarkers = document.querySelectorAll(".break-session-marker");

const removeFocusSessionBtn = document.getElementById("remove-focus-session-btn");
const addFocusSessionBtn = document.getElementById("add-focus-session-btn");
const removeFocusMinBtn = document.getElementById("remove-focus-min-btn");
const addFocusMinBtn = document.getElementById("add-focus-min-btn");
const removeBreakSessionBtn = document.getElementById("remove-break-session-btn");
const addBreakSessionBtn = document.getElementById("add-break-session-btn");
const removeBreakMinBtn = document.getElementById("remove-break-min-btn");
const addBreakMinBtn = document.getElementById("add-break-min-btn");

const msPerSecond = 1000;
const msPerMinute = 60 * msPerSecond;

const focusSessionMinutes = 0.2;
const focusToBreakRatio = 5;
const totalFocusSessions = 4;

// Class for the focus and break timers
class TimerState {
    constructor(name, fullSessionMinutes, button, minutesElement, secondsElement, sessionMarkerClass, totalSessions) {
        this.name = name;
        this.sessionsCompleted = 0;
        this.isTimerRunning = false;
        this.fullSessionMs = fullSessionMinutes * msPerMinute;
        this.msLeftInSession = fullSessionMinutes * msPerMinute;
        this.sessionEndTime = null;
        this.button = button;
        this.minutesElement = minutesElement;
        this.secondsElement = secondsElement;
        this.sessionMarkers = document.querySelectorAll(`.${sessionMarkerClass}`);
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
    totalFocusSessions
);

// Create timer state object for the break timer
const breakTimerState = new TimerState(
    "Break",
    focusSessionMinutes / focusToBreakRatio, // Set the length of each break session to always be 1/5 the length of a focus session
    breakBtn,
    breakMinutesEl,
    breakSecondsEl,
    "break-session-marker",
    totalFocusSessions - 1 // There's always one fewer break session than focus sessions
);

const updateEndingTime = (state, currentTime) => {
    // If neither timer is running, unset the ending time and exit this function
    if (!focusTimerState.isTimerRunning && !breakTimerState.isTimerRunning) {
        endingHoursEl.textContent = "??";
        endingMinutesEl.textContent = "??";
        return;
    }

    if (focusTimerState.isTimerRunning) {
        
    }

    // Work out ending time based on length of focus and break sessions not yet completed
    const endingTime = currentTime + focusTimeLeft + (focusTimerState.totalSessions - focusTimerState.sessionsCompleted) * focusTimerState.fullSessionMs + breakTimeLeft + (breakTimerState.totalFocusSessions - breakTimerState.sessionsCompleted) * breakTimerState.fullSessionMs;

    const date = new Date(endingTime);
    const hours = date.getHours;
    const minutes = date.getMinutes;

    endingHoursEl.textContent = hours;
    endingMinutesEl.textContent = minutes;
};

// Save all relevant timer data to local storage
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

// Load all relevant timer data from local storage
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

// Fully reset the focus or break timer back to its initial state
const fullyResetTimer = (state) => {
    pauseTimer(state);
    state.msLeftInSession = state.fullSessionMs;
    state.sessionsCompleted = 0;
    saveTimerState(state);
    updateCountdownDisplay(state, state.msLeftInSession);
    updateSessionsDisplay(state);
};

// Finish the working day and reset both timers when the final focus session is completed
finalFocusSessionCompleted = () => {
    alert("Focus time completed for today!");
    fullyResetTimer(focusTimerState);
    fullyResetTimer(breakTimerState);
};

// Start the next session of the focus or break timer
const nextSessionOfSameTimer = (state, sessionsCompleted) => {
    
    // Update number of sessions completed and sessions display
    state.sessionsCompleted += sessionsCompleted;
    updateSessionsDisplay(state);

    // Check if final focus session has been completed, exit this function if so
    if (focusTimerState.sessionsCompleted >= focusTimerState.totalSessions) {
        finalFocusSessionCompleted();
        return;
    }

    // Reset end time for the next session and save all updated data to local storage
    state.sessionEndTime += sessionsCompleted * state.fullSessionMs;
    saveTimerState(state);

    // Continue updating the same timer recursively
    updateTimer(state);
};

// Stop the break timer running and start the next focus sessions
const breakTimerToFocusTimer = (breakSessionsCompleted, focusSessionsCompleted) => {

    // Update number of sessions completed and sessions display for both timers
    breakTimerState.sessionsCompleted += breakSessionsCompleted;
    focusTimerState.sessionsCompleted += focusSessionsCompleted;
    updateSessionsDisplay(breakTimerState);
    updateSessionsDisplay(focusTimerState);

    // Check if final focus session has been completed, exit this function if so
    if (focusTimerState.sessionsCompleted >= focusTimerState.totalSessions) {
        finalFocusSessionCompleted();
        return;
    }

    // Set end time for  next focus session based on previous end time of break timer and length of break and focus sessions completed
    focusTimerState.sessionEndTime = breakTimerState.sessionEndTime + breakSessionsCompleted * breakTimerState.fullSessionMs + focusSessionsCompleted * focusTimerState.fullSessionMs;

    // Reset time left in break timer and unset the end time, ready for the next break session
    breakTimerState.msLeftInSession = breakTimerState.fullSessionMs;
    breakTimerState.sessionEndTime = null;

    // Update countdown display for break timer
    updateCountdownDisplay(breakTimerState, breakTimerState.msLeftInSession);

    // Save all updated data to local storage for both timers
    saveTimerState(breakTimerState);
    saveTimerState(focusTimerState);

    // Start next focus session by starting the focus timer (which also pauses the break timer)
    startTimer(focusTimerState);
};

// Determine what to do next when a focus session ends
const completeFocusSession = (timePastSessionEnd) => {
    // One focus session is always completed, work out how many others are completed (if any)
    const focusSessionsCompleted = 1 + Math.floor(timePastSessionEnd / focusTimerState.fullSessionMs);

    // Continue running the focus timer with the next session
    nextSessionOfSameTimer(focusTimerState, focusSessionsCompleted);
};

// Determine what to do next when a break session ends
const completeBreakSession = (timePastSessionEnd) => {
    // Work out how many break sessions the user had accrued at the last update
    const breakSessionsAccrued = focusTimerState.sessionsCompleted - breakTimerState.sessionsCompleted;

    // Work out how many of the accrued break sessions have been completed
    const breakSessionsCompleted = timePastSessionEnd >= breakSessionsAccrued * breakTimerState.fullSessionMs
        ? breakSessionsAccrued
        : 1 + Math.floor(timePastSessionEnd / breakTimerState.fullSessionMs);

    if (breakSessionsCompleted < breakSessionsAccrued) {
        // Continue running the break timer with the next session
        nextSessionOfSameTimer(breakTimerState, breakSessionsCompleted);
    }
    // If all of the accrued break sessions have been completed (and possibly one or more focus sessions)
    else {
        // Work out how many focus sessions have been completed
        const focusSessionsCompleted = Math.floor((timePastSessionEnd - breakSessionsCompleted * breakTimerState.fullSessionMs) / focusTimerState.fullSessionMs);

        // Switch from the break timer to the focus timer, taking into account how many of each session have been completed
        breakTimerToFocusTimer(breakSessionsCompleted, focusSessionsCompleted);
    }
};

const updateTimer = (state) => {
    // Only continue running the timer if it's toggled to be running
    if (state.isTimerRunning) {
        const currentTime = Date.now();

        // If one or more timer session(s) has been completed since the last update, determine what to do next and don't update the timer
        if (currentTime >= state.sessionEndTime) {
            if (state === focusTimerState) {
                completeFocusSession(currentTime - state.sessionEndTime);
            }
            // If the break timer was running at the last timer update
            else if (state === breakTimerState) {
                completeBreakSession(currentTime - state.sessionEndTime);
            };
            return;
        }

        // Work out how many milliseconds there are between now and the session end time
        const msToDisplay = state.sessionEndTime - currentTime;

        // Update the minutes and seconds displayed
        updateCountdownDisplay(state, msToDisplay);

        // Run this function again in one second
        setTimeout(() => updateTimer(state), 1000);
    }
};

const startTimer = (state) => {
    // Pause the break timer when starting the focus timer, and vice-versa
    if (state === focusTimerState) {
        if (breakTimerState.isTimerRunning === true) pauseTimer(breakTimerState);
    } else if (state === breakTimerState) {
        if (focusTimerState.isTimerRunning === true) pauseTimer(focusTimerState);
    }

    // If the session end time isn't already set
    if (!state.sessionEndTime) {
        // Set the end time in milliseconds for the current focus session
        state.sessionEndTime = Date.now() + state.msLeftInSession;
    }

    // Unset the time left in the current session until the timer is paused again
    state.msLeftInSession = null;

    state.button.textContent = `Pause ${state.name} Timer`;
    state.isTimerRunning = true;
    saveTimerState(state);

    // Start updating the timer recursively
    updateTimer(state);
};

const pauseTimer = (state) => {
    // If the time left hasn't already been set for the next session
    if (!state.msLeftInSession) {
        // Save the number of milliseconds left in the current focus sessions, for when the focus timer is restarted
        state.msLeftInSession = state.sessionEndTime - Date.now();
    }

    // Unset the end time for the current focus session until the focus timer is started again
    state.sessionEndTime = null;

    state.button.textContent = `Start ${state.name} Timer`;
    state.isTimerRunning = false;
    saveTimerState(state);
}

const startOrPauseTimer = (state) => {
    // If all the break sessions are completed, don't start the break timer
    if (state === breakTimerState && breakTimerState.sessionsCompleted >= breakTimerState.totalSessions) {
        alert("No more break sessions left!");
        return;
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
    // Update button text
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

const removeMinute = (state) => {
    const currentTime = Date.now();

    if (state.isTimerRunning) {
        // Only if the timer has more than a minute to go
        if (state.sessionEndTime - currentTime > 1 * msPerMinute) {
            // Remove a minute from the timer
            state.sessionEndTime -= 1 * msPerMinute;

            // Update the countdown display and save updated data to local storage
            updateCountdownDisplay(state, state.sessionEndTime - currentTime);
            saveTimerState(state);
        }
    } else {
        // Only if the timer has more than a minute to go 
        if (state.msLeftInSession > 1 * msPerMinute) {
            // Remove a minute from the timer
            state.msLeftInSession -= 1 * msPerMinute;

            // Update the countdown display and save updated data to local storage
            updateCountdownDisplay(state, state.msLeftInSession);
            saveTimerState(state);
        }
    }
};

const addMinute = (state) => {
    if (state.isTimerRunning) {
        const currentTime = Date.now();
        // Add one minute to the timer
        state.sessionEndTime += 1 * msPerMinute;
        // Update the countdown display
        updateCountdownDisplay(state, state.sessionEndTime - currentTime);
    } else {
        // Add one minute to the timer
        state.msLeftInSession += 1 * msPerMinute;
        // Update the countdown display
        updateCountdownDisplay(state, state.msLeftInSession);
    }
    // Save updated data to local storage
    saveTimerState(state);
};

window.onload = (event) => {
    // When the page loads,  data from local storage for both timers
    loadTimerState(focusTimerState);
    loadTimerState(breakTimerState);

    // If one of the timers was running, resume the running timer
    if (focusTimerState.isTimerRunning) {
        resumeRunningTimer(focusTimerState);
    } else if (breakTimerState.isTimerRunning) {
        resumeRunningTimer(breakTimerState);
    }
    // If neither timer was running, update both displays using the time left in the session and update both sessions displays
    else {
        updateCountdownDisplay(focusTimerState, focusTimerState.msLeftInSession);
        updateCountdownDisplay(breakTimerState, breakTimerState.msLeftInSession);
        updateSessionsDisplay(focusTimerState);
        updateSessionsDisplay(breakTimerState);
    }
};

focusBtn.addEventListener("click", () => startOrPauseTimer(focusTimerState));
breakBtn.addEventListener("click", () => startOrPauseTimer(breakTimerState));
resetBtn.addEventListener("click", resetBothTimers);

removeFocusSessionBtn.addEventListener("click", () => removeCompletedSession(focusTimerState));
addFocusSessionBtn.addEventListener("click", () => addCompletedSession(focusTimerState));
removeFocusMinBtn.addEventListener("click", () => removeMinute(focusTimerState));
addFocusMinBtn.addEventListener("click", () => addMinute(focusTimerState));

removeBreakSessionBtn.addEventListener("click", () => removeCompletedSession(breakTimerState));
addBreakSessionBtn.addEventListener("click", () => addCompletedSession(breakTimerState));
removeBreakMinBtn.addEventListener("click", () => removeMinute(breakTimerState));
addBreakMinBtn.addEventListener("click", () => addMinute(breakTimerState));