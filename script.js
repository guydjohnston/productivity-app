const focusMinutesEl = document.getElementById("focus-minutes");
const focusSecondsEl = document.getElementById("focus-seconds");
const breakMinutesEl = document.getElementById("break-minutes");
const breakSecondsEl = document.getElementById("break-seconds");
const focusBtn = document.getElementById("focus-btn");
const breakBtn = document.getElementById("break-btn");
const resetBtn = document.getElementById("reset-btn");
const focusSessionMarkers = document.querySelectorAll(".focus-session-marker");
const breakSessionMarkers = document.querySelectorAll(".break-session-marker");

const msPerSecond = 1000;
const msPerMinute = 60 * msPerSecond;

const focusSessionMinutes = 0.1;
const totalFocusSessions = 4;

// Class for the focus and break timers
class TimerState {
    constructor(name, fullSessionMinutes, button, minutesElement, secondsElement, sessionMarkerClass) {
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
    }
}

// Create timer state object for the focus timer
const focusTimerState = new TimerState(
    "Focus",
    focusSessionMinutes,
    focusBtn,
    focusMinutesEl,
    focusSecondsEl,
    "focus-session-marker"
);

// Create timer state object for the break timer
const breakTimerState = new TimerState(
    "Break",
    focusSessionMinutes / 5, // Set the length of each break session to always be 1/5 the length of a focus session
    breakBtn,
    breakMinutesEl,
    breakSecondsEl,
    "break-session-marker"
);

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
    console.log(`${timerName} state saved is`, timerStateSaved);
};

const loadTimerState = (state) => {
    const timerName = state.name.toLowerCase() + "Timer";

    const timerStateLoaded = JSON.parse(localStorage.getItem(timerName));
    console.log(`${timerName} state loaded is`, timerStateLoaded);

    // If there was data saved in local storage, update timer state object using values from local storage then update time displayed and display of sessions completed
    if (timerStateLoaded) {
        Object.assign(state, timerStateLoaded);
    }
};

const fullyResetTimer = (state) => {
    pauseTimer(state);
    state.msLeftInSession = state.fullSessionMinutes * msPerMinute;
    state.sessionsCompleted = 0;
    updateSessionsDisplay(state);
    state.minutesElement.textContent = "00";
    state.secondsElement.textContent = "00";
    saveTimerState(state);
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

    if (state.name === "Break") {
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

    if (state.name === "Focus") {
        // When all the focus sessions are complete for the day, alert the user and stop and reset both timers
        if (focusTimerState.sessionsCompleted === totalFocusSessions) {
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
    if (state.name === "Focus") {
        if (breakTimerState.isTimerRunning === true) pauseTimer(breakTimerState);
    } else if (state.name === "Break") {
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
    if (state.name === "Break") {
        if (breakTimerState.sessionsCompleted >= totalFocusSessions - 1) {
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

    // Update both sessions displays
    updateSessionsDisplay(focusTimerState);
    updateSessionsDisplay(breakTimerState);

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

focusBtn.addEventListener("click", () => startOrPauseTimer(focusTimerState));
breakBtn.addEventListener("click", () => startOrPauseTimer(breakTimerState));
resetBtn.addEventListener("click", resetBothTimers);