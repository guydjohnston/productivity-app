// Global configuration variables
const focusSessionMinutes = 100;
const focusToBreakRatio = 5;
const focusSessionsPerDay = 4;

// Variables to help with converting between milliseconds, seconds and minutes
const msPerSecond = 1000;
const msPerMinute = 60 * msPerSecond;

// Functions to identify HTML elements on the page by id and class
const getById = (id) => document.getElementById(id);
const getAllByClass = (className) => document.querySelectorAll(`.${className}`);

// Link to HTML elements to manipulate on the page
const pageElements = {
    focus: {
        minutes: getById("focus-minutes"),
        seconds: getById("focus-seconds"),
        addSessionBtn: getById("add-focus-session-btn"),
        removeSessionBtn: getById("remove-focus-session-btn"),
        addMinBtn: getById("add-focus-min-btn"),
        removeMinBtn: getById("remove-focus-min-btn"),
        timerBtn: getById("focus-btn"),
        sessionMarkers: getAllByClass("focus-session-marker")
    },
    break: {
        minutes: getById("break-minutes"),
        seconds: getById("break-seconds"),
        addSessionBtn: getById("add-break-session-btn"),
        removeSessionBtn: getById("remove-break-session-btn"),
        addMinBtn: getById("add-break-min-btn"),
        removeMinBtn: getById("remove-break-min-btn"),
        timerBtn: getById("break-btn"),
        sessionMarkers: getAllByClass("break-session-marker")
    },
    ending: {
        hours: getById("ending-hours"),
        minutes: getById("ending-minutes")
    },
    resetBtn: getById("reset-btn")
};

// Class for the focus and break timers
class TimerState {
    constructor(name, fullSessionMinutes, btn, minutesElement, secondsElement, sessionMarkers, totalSessions) {
        this.name = name;
        this.sessionsCompleted = 0;
        this.isTimerRunning = false;
        this.fullSessionMs = fullSessionMinutes * msPerMinute;
        this.msLeftInSession = fullSessionMinutes * msPerMinute;
        this.sessionEndTime = null;
        this.btn = btn;
        this.minutesElement = minutesElement;
        this.secondsElement = secondsElement;
        this.sessionMarkers = sessionMarkers;
        this.totalSessions = totalSessions;
    }
}

// Create timer state object for the focus timer
const focusTimerState = new TimerState(
    "Focus",
    focusSessionMinutes,
    pageElements.focus.timerBtn,
    pageElements.focus.minutes,
    pageElements.focus.seconds,
    pageElements.focus.sessionMarkers,
    focusSessionsPerDay
);

// Create timer state object for the break timer
const breakTimerState = new TimerState(
    "Break",
    focusSessionMinutes / focusToBreakRatio, // Set the length of each break session to always be 1/5 the length of a focus session
    pageElements.break.timerBtn,
    pageElements.break.minutes,
    pageElements.break.seconds,
    pageElements.break.sessionMarkers,
    focusSessionsPerDay - 1 // There's always one fewer break session than focus sessions
);

// Global object to track current and previous ending times in milliseconds when all focus and break sessions will be finished
const endingTime = {
    current: null,
    previous: null
};

// Update the time displayed for when the final focus session will finish
const updateEndingTimeDisplay = () => {
    // If no current ending time is set, display the ending time as unknown and exit this function
    if (!endingTime.current) {
        pageElements.ending.hours.textContent = "??";
        pageElements.ending.minutes.textContent = "??";
        return;
    }

    // Update display for ending time
    const date = new Date(endingTime.current);
    pageElements.ending.hours.textContent = date.getHours().toString().padStart(2, "0");;
    pageElements.ending.minutes.textContent = date.getMinutes().toString().padStart(2, "0");
};

// Save all relevant timer data to local storage
const saveTimerState = (state) => {
    const timerName = state.name.toLowerCase() + "Timer";

    // Create object with relevant variables that need to be saved for each timer
    const timerStateSaved = {
        sessionsCompleted: state.sessionsCompleted,
        isTimerRunning: state.isTimerRunning,
        msLeftInSession: state.msLeftInSession,
        sessionEndTime: state.sessionEndTime
    };

    // Save object to local storage
    localStorage.setItem(timerName, JSON.stringify(timerStateSaved));
};

// Load all relevant timer data from local storage
const loadTimerState = (state) => {
    const timerName = state.name.toLowerCase() + "Timer";

    // Create object from data loaded from local storage
    const timerStateLoaded = JSON.parse(localStorage.getItem(timerName));

    // If there was data saved in local storage
    if (timerStateLoaded) {
        // Update timer state object using values loaded from local storage
        Object.assign(state, timerStateLoaded);
    }
};

// Save object with current and previous ending times to local storage
const saveEndingTime = () => {
    localStorage.setItem("endingTime", JSON.stringify(endingTime));
};

// Load object with current and previous ending times from local storage
const loadEndingTime = () => {
    // Create object from current and previous ending times in local storage
    const endingTimeLoaded = JSON.parse(localStorage.getItem("endingTime"));

    // If there was an ending time object saved in local storage
    if (endingTimeLoaded) {
        // Update ending time object using values loaded from local storage
        Object.assign(endingTime, endingTimeLoaded);
    }
};

// Update the minutes and seconds shown on the timer display
const updateCountdownDisplay = (state, msToDisplay) => {
    const minutesDisplayed = Math.floor(msToDisplay / msPerMinute).toString().padStart(2, "0");
    const secondsDisplayed = Math.floor((msToDisplay / msPerSecond) % 60).toString().padStart(2, "0");

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
    // Stop the timer from running
    pauseTimer(state);

    // Reset time left in current session
    state.msLeftInSession = state.fullSessionMs;

    // Reset sessions completed and sessions display
    state.sessionsCompleted = 0;
    updateSessionsDisplay(state);

    // Reset countdown display
    updateCountdownDisplay(state, state.msLeftInSession);

    // Save updated timer data to local storage
    saveTimerState(state);

    // Unset current ending time, save to local storage and update display
    endingTime.current = null;
    saveEndingTime();
    updateEndingTimeDisplay();
};

// Finish the working day and reset both timers when the final focus session is completed
const finalFocusSessionCompleted = () => {
    // Alert the user by vibrating the device (if the device supports it)
    if ("vibrate" in navigator) {
        navigator.vibrate([500, 500, 500]);
        console.log("Vibrating the device - it's time to start working again");
    } else console.log("This device doesn't support vibration");

    alert("Focus time completed for today!");

    // Reset both timers
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

    // Reset end time for the next session
    state.sessionEndTime += sessionsCompleted * state.fullSessionMs;

    // Save updated data to local storage
    saveTimerState(state);

    // Continue updating the same timer recursively
    updateTimer(state);
};

// Stop the break timer running and start the next focus sessions
const breakTimerToFocusTimer = (breakSessionsCompleted, focusSessionsCompleted) => {
    // Alert the user by vibrating the device (if the device supports it)
    if ("vibrate" in navigator) {
        navigator.vibrate([500, 500, 500]);
        console.log("Vibrating the device - it's time to start working again");
    } else console.log("This device doesn't support vibration");

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

    // Reset time left in break timer and unset the end time, ready for the next break session
    breakTimerState.msLeftInSession = breakTimerState.fullSessionMs;
    breakTimerState.sessionEndTime = null;

    // Update countdown display for break timer
    updateCountdownDisplay(breakTimerState, breakTimerState.msLeftInSession);

    // Save all updated data to local storage for both timers
    saveTimerState(breakTimerState);
    saveTimerState(focusTimerState);

    // Start next focus session (which also pauses the break timer)
    startTimer(focusTimerState);
};

// Determine what to do next when a focus session ends
const completeFocusSession = (timePastSessionEnd) => {
    // Alert the user by vibrating the device (if the device supports it)
    if ("vibrate" in navigator) {
        navigator.vibrate([500, 500, 500]);
        console.log("Vibrating the device - it's time to take a break");
    } else console.log("This device doesn't support vibration");

    // One focus session is always completed, work out how many more are completed (if any)
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
        ? Math.max(1, breakSessionsAccrued)
        : 1 + Math.floor(timePastSessionEnd / breakTimerState.fullSessionMs);

    // If there are still accrued break sessions that haven't been completed yet
    if (breakSessionsCompleted < breakSessionsAccrued) {
        // Continue running the break timer with the next session
        nextSessionOfSameTimer(breakTimerState, breakSessionsCompleted);
    }
    // If all of the accrued break sessions have been completed (and possibly one or more focus sessions)
    else {
        // Work out how many focus sessions have been completed, on top of the break sessions completed
        const focusSessionsCompleted = Math.floor((timePastSessionEnd - (breakSessionsCompleted - 1) * breakTimerState.fullSessionMs) / focusTimerState.fullSessionMs);

        // Switch from the break timer to the focus timer, taking into account how many of each session have been completed
        breakTimerToFocusTimer(breakSessionsCompleted, focusSessionsCompleted);
    }
};

// Recursively update the running timer once per second
const updateTimer = (state) => {
    // Only continue running the timer if it's toggled to be running
    if (state.isTimerRunning) {
        const currentTime = Date.now();

        // If one or more timer session(s) has been completed since the last update, determine what to do next and don't update the timer by exiting this function
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

// Pause the relevant timer
const pauseTimer = (state) => {
    // If the time left hasn't already been set for the next session
    if (!state.msLeftInSession) {
        const currentTime = Date.now();

        // Save the number of milliseconds left in the current focus sessions, for when the focus timer is restarted
        state.msLeftInSession = state.sessionEndTime - currentTime;
    }

    // Unset the end time for the current focus session until the focus timer is started again
    state.sessionEndTime = null;

    // Update text on the relevant start/pause button
    state.btn.textContent = `Start ${state.name} Timer`;

    // Toggle timer to not be running
    state.isTimerRunning = false;

    // Save updated timer data to local storage
    saveTimerState(state);

    // Only if both timers are now paused
    if (!focusTimerState.isTimerRunning && !breakTimerState.isTimerRunning) {
        // Unset current ending time, save to local storage and update the display
        endingTime.current = null;
        saveEndingTime();
        updateEndingTimeDisplay();
    };
}

// Start or resume the relevant timer
const startTimer = (state) => {
    const currentTime = Date.now();

    // Define which is the timer not being started
    const otherState = state === focusTimerState
        ? breakTimerState
        : focusTimerState;

    // Pause the timer that's not being started
    pauseTimer(otherState);

    // If the session end time isn't already set
    if (!state.sessionEndTime) {
        // Set the end time in milliseconds for the current focus session
        state.sessionEndTime = currentTime + state.msLeftInSession;
    }

    // Unset the time left in the current session until the timer is paused again
    state.msLeftInSession = null;

    // Update text on the relevant start/pause button
    state.btn.textContent = `Pause ${state.name} Timer`;

    // Toggle timer to be running
    state.isTimerRunning = true;

    // Work out how much time is left in the current session of both timers
    const currentSessionsTimeLeft = (state.sessionEndTime - currentTime) + otherState.msLeftInSession;

    // Save updated timer data to local storage
    saveTimerState(state);

    // Update current ending time based on time left in both current sessions and all sessions not yet started
    endingTime.current = currentTime + currentSessionsTimeLeft + (state.totalSessions - state.sessionsCompleted - 1) * state.fullSessionMs + (otherState.totalSessions - otherState.sessionsCompleted - 1) * otherState.fullSessionMs;

    // Save updated ending time to local storage and update the display
    saveEndingTime();
    updateEndingTimeDisplay();

    // Start updating the timer recursively
    updateTimer(state);
};

// Start or pause the relevant timer depending on whether it's already running
const startOrPauseTimer = (state) => {
    // If all the break sessions are completed, don't start the break timer by exiting this function
    if (state === breakTimerState && breakTimerState.sessionsCompleted >= breakTimerState.totalSessions) {
        alert("No more break sessions left!");
        return;
    }

    // Start or pause the timer, depending on whether it's already running
    if (!state.isTimerRunning) startTimer(state);
    else pauseTimer(state);
};

// Resume a timer that was running when the page was closed
const resumeRunningTimer = (state) => {
    // Update button text
    state.btn.textContent = `Pause ${state.name} Timer`;

    // Update the display of the timer that's not running
    const otherState = state === focusTimerState
        ? breakTimerState
        : focusTimerState
    updateCountdownDisplay(otherState, otherState.msLeftInSession);

    // Update both sessions displays
    updateSessionsDisplay(state);
    updateSessionsDisplay(otherState);

    // Update ending time display
    updateEndingTimeDisplay();

    // Continue updating the timer that's running recursively (which will also update its timer display)
    updateTimer(state);
};

// Reduce number of completed sessions of relevant timer by one
const removeCompletedSession = (state) => {
    // Only if there's at least one session completed
    if (state.sessionsCompleted > 0) {

        // Update sessions completed and sessions display
        state.sessionsCompleted--;
        updateSessionsDisplay(state);

        // Save updated data to local storage
        saveTimerState(state);

        // Update current ending time by adding length of a full session
        endingTime.current += state.fullSessionMs;

        // Save updated ending time to local storage and update the display
        saveEndingTime();
        updateEndingTimeDisplay();
    }
};

// Increase completed sessions of relevant timer by one
const addCompletedSession = (state) => {
    // If all sessions have been completed, don't add another session and exit this function
    if (state.sessionsCompleted >= state.totalSessions) return;

    // If there's only one focus session left, don't add another focus session and exit this functino 
    if (state === focusTimerState && state.sessionsCompleted >= state.totalSessions - 1) return;

    // Update number of completed sessions and sessions display
    state.sessionsCompleted++;
    updateSessionsDisplay(state);

    // Save updated data to local storage
    saveTimerState(state);

    // Update current ending time by removing the length of a full session
    endingTime.current -= state.fullSessionMs;

    // Save updated ending time to local storage and update the display
    saveEndingTime();
    updateEndingTimeDisplay();
};

// Remove a minute from the current session of the timer
const removeMinute = (state) => {

    if (state.isTimerRunning) {
        const currentTime = Date.now();
        // Only if the timer has more than a minute to go
        if (state.sessionEndTime - currentTime > msPerMinute) {
            // Remove a minute from the timer
            state.sessionEndTime -= msPerMinute;

            // Shouldn't need to update the diplay - this should happen anyway each second
            // updateCountdownDisplay(state, state.sessionEndTime - currentTime);
        }
        //
    }
    // If the timer is paused
    else {
        // Only if the timer has more than a minute to go 
        if (state.msLeftInSession > msPerMinute) {
            // Remove a minute from the timer
            state.msLeftInSession -= msPerMinute;

            // Update the countdown display and save updated data to local storage
            updateCountdownDisplay(state, state.msLeftInSession);
        }
    }

    // Save updated data to local storage
    saveTimerState(state);

    // Update current ending time by removing a minute
    endingTime.current -= msPerMinute;

    // Save updated ending time to local storage and update the display
    saveEndingTime();
    updateEndingTimeDisplay();
};

// Add an extra minute to the current session of the timer
const addMinute = (state) => {
    if (state.isTimerRunning) {
        const currentTime = Date.now();
        // Add one minute to the timer
        state.sessionEndTime += msPerMinute;
        // Update the countdown display
        updateCountdownDisplay(state, state.sessionEndTime - currentTime);
    } else {
        // Add one minute to the timer
        state.msLeftInSession += msPerMinute;
        // Update the countdown display
        updateCountdownDisplay(state, state.msLeftInSession);
    }

    // Save updated data to local storage
    saveTimerState(state);

    // Update current ending time by adding one minute
    endingTime.current += msPerMinute;

    // Save updated ending time to local storage and update display
    saveEndingTime();
    updateEndingTimeDisplay();
};

// When the window loads for the first time or after being reopened
window.onload = (event) => {
    // Load data for both timers and ending time value from localstorage
    loadTimerState(focusTimerState);
    loadTimerState(breakTimerState);
    loadEndingTime();

    // If one of the timers was running, resume that timer
    if (focusTimerState.isTimerRunning) {
        resumeRunningTimer(focusTimerState);
    } else if (breakTimerState.isTimerRunning) {
        resumeRunningTimer(breakTimerState);
    }
    // If neither timer was running, update both displays using time left in current session and update sessions displays
    else {
        updateCountdownDisplay(focusTimerState, focusTimerState.msLeftInSession);
        updateCountdownDisplay(breakTimerState, breakTimerState.msLeftInSession);
        updateSessionsDisplay(focusTimerState);
        updateSessionsDisplay(breakTimerState);
    }
};

// Add event listeners for buttons related to focus timer
pageElements.focus.timerBtn.addEventListener("click", () => startOrPauseTimer(focusTimerState));
pageElements.focus.removeSessionBtn.addEventListener("click", () => removeCompletedSession(focusTimerState));
pageElements.focus.addSessionBtn.addEventListener("click", () => addCompletedSession(focusTimerState));
pageElements.focus.removeMinBtn.addEventListener("click", () => removeMinute(focusTimerState));
pageElements.focus.addMinBtn.addEventListener("click", () => addMinute(focusTimerState));

// Add event listeners for buttons related to break timer
pageElements.break.timerBtn.addEventListener("click", () => startOrPauseTimer(breakTimerState));
pageElements.break.removeSessionBtn.addEventListener("click", () => removeCompletedSession(breakTimerState));
pageElements.break.addSessionBtn.addEventListener("click", () => addCompletedSession(breakTimerState));
pageElements.break.removeMinBtn.addEventListener("click", () => removeMinute(breakTimerState));
pageElements.break.addMinBtn.addEventListener("click", () => addMinute(breakTimerState));

// Add event listener for reset button
pageElements.resetBtn.addEventListener("click", () => {
    fullyResetTimer(focusTimerState);
    fullyResetTimer(breakTimerState);
});