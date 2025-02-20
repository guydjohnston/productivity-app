// Global configuration variables
const focusSessionMinutes = 100;
const focusToBreakRatio = 5;
const focusSessionsPerDay = 4;

// Variables to help with converting between milliseconds, seconds and minutes
const msPerSecond = 1000;
const msPerMinute = 60 * msPerSecond;

// Two session types for creating references to HTML elements
const sessionTypes = ["focus", "break"];

// Mapping of ids and class names of HTML elements
const pageElements = {
    ...Object.fromEntries(sessionTypes.map(type => [
        type,
        {
            minutes: `${type}-minutes`,
            seconds: `${type}-seconds`,
            addSessionBtn: `add-${type}-session-btn`,
            removeSessionBtn: `remove-${type}-session-btn`,
            addMinBtn: `add-${type}-min-btn`,
            removeMinBtn: `remove-${type}-min-btn`,
            timerBtn: `${type}-timer-btn`,
            sessionMarkers: `.${type}-session-marker`
        }
    ])),
    ending: {
        current: {
            hours: "current-ending-hours",
            minutes: "current-ending-minutes"
        },
        previous: "previous-ending-times"
    },
    resetBtn: "reset-btn"
};

// Replace ids and class names with HTML elements
const mapElements = (obj) => {
    for (const [key, value] of Object.entries(obj)) {
        // Replace class and id names with HTML objects 
        if (typeof value === "string") {
            obj[key] = value.startsWith(".")
                ? document.querySelectorAll(value)
                : document.getElementById(value);
        }
        // Recursively map nested objects
        else if (typeof value === "object") {
            mapElements(value);
        }
    }
};
mapElements(pageElements);

// Class for the focus and break timers
class TimerState {
    constructor(name, fullSessionMinutes, btn, minutesElement, secondsElement, sessionMarkers, totalSessions) {
        this.name = name;
        this.sessionsCompleted = 0;
        this.isTimerRunning = false;
        this.fullSessionMs = fullSessionMinutes * msPerMinute;
        this.msLeftInSession = fullSessionMinutes * msPerMinute;
        // this.sessionEndTime = null;
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
    previous: []
};

// Update display of current ending time
const updateCurrentEndingTimeDisplay = () => {
    // If current ending is null, display current ending time as unknown and exit this function
    if (!endingTime.current) {
        pageElements.ending.current.hours.textContent = "??";
        pageElements.ending.current.minutes.textContent = "??";
        return;
    }

    // Destructure array for current ending time
    const [endingTimeValue, timeCreatedAt] = endingTime.current;

    // Create date object from current ending time in milliseconds
    const date = new Date(endingTimeValue);

    // Update HTML text content using hours and minutes from date object
    pageElements.ending.current.hours.textContent = date.getHours().toString().padStart(2, "0");
    pageElements.ending.current.minutes.textContent = date.getMinutes().toString().padStart(2, "0");
};

// Update display of previous ending times
const updatePreviousEndingTimesDisplay = () => {
    // Clear text from the HTML from the previous time this function was run
    pageElements.ending.previous.innerHTML = "";

    // Iterate backwards through the array of previous ending times
    for (const [time, createdAt] of [...endingTime.previous].reverse()) {
        // Create date object for this previous ending time
        const endingTimeDate = new Date(time);

        // Create date object for time it was created at
        const createdAtDate = new Date(createdAt);

        // Text to insert into HTML for ending time
        const hoursText = endingTimeDate.getHours().toString().padStart(2, "0");
        const minutesText = endingTimeDate.getMinutes().toString().padStart(2, "0");

        // Text to insert into HTML for time it was created at
        const createdAtHoursText = createdAtDate.getHours().toString().padStart(2, "0");
        const createdAtMinutesText = createdAtDate.getMinutes().toString().padStart(2, "0");

        // Add text to the HTML for each entry in the array of previous ending times
        pageElements.ending.previous.innerHTML +=
            `<p>${hoursText}:${minutesText} created at ${createdAtHoursText}:${createdAtMinutesText}</p>`;
    }
};

// Save all relevant timer data to local storage
const saveTimerState = (state) => {
    const timerName = state.name.toLowerCase() + "Timer";

    // Create object with relevant variables that need to be saved for each timer
    const timerStateSaved = {
        sessionsCompleted: state.sessionsCompleted,
        isTimerRunning: state.isTimerRunning,
        msLeftInSession: state.msLeftInSession,
        // sessionEndTime: state.sessionEndTime
    };

    // Save object to local storage
    localStorage.setItem(timerName, JSON.stringify(timerStateSaved));
};

// Load all relevant timer data from local storage
const loadTimerState = (state) => {
    const timerName = state.name.toLowerCase() + "Timer";

    // Create object from data loaded from local storage
    const timerStateLoaded = JSON.parse(localStorage.getItem(timerName));

    // Update timer state object using values loaded from local storage
    Object.assign(state, timerStateLoaded);
};

// Save object with current and previous ending times to local storage
const saveEndingTimes = () => {
    localStorage.setItem("endingTime", JSON.stringify(endingTime));
};

// Update ending times object using values loaded from local storage
const loadEndingTimes = () => {
    Object.assign(endingTime, JSON.parse(localStorage.getItem("endingTime")));
};

// Update the minutes and seconds shown on the timer display
const updateCountdownDisplay = (state, msToDisplay) => {
    // Convert milliseconds left in timer to minutes and seconds with a leading zero
    const minutesDisplayed = Math.floor(msToDisplay / msPerMinute).toString().padStart(2, "0");
    const secondsDisplayed = Math.floor((msToDisplay / msPerSecond) % 60).toString().padStart(2, "0");

    // Update text contents of HTML elements with numbers of minutes and seconds
    state.minutesElement.textContent = minutesDisplayed;
    state.secondsElement.textContent = secondsDisplayed;
};

// Update the visual markers on the page to show the number of focus or break sessions completed
const updateSessionsDisplay = (state) => {
    state.sessionMarkers.forEach((marker, index) => {
        if (index < state.sessionsCompleted) marker.classList.add("completed");
        else marker.classList.remove("completed");
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
};

// Helper function for saving ending times and updating displays for current and previous ending times
const saveAndDisplayEndingTimes = () => {
    saveEndingTimes();
    updateCurrentEndingTimeDisplay();
    updatePreviousEndingTimesDisplay();
}

// Fully reset the whole application, including the states of both timers and current and previous ending times
const resetEverything = () => {
    // Reset focus and break timers
    fullyResetTimer(focusTimerState);
    fullyResetTimer(breakTimerState);

    // Unset current ending time and empty array of previous ending times
    endingTime.current = null;
    endingTime.previous = [];

    // Save ending time data to local storage and update displays
    saveAndDisplayEndingTimes();
}

// Finish the working day and reset both timers when the final focus session is completed
const finalFocusSessionCompleted = () => {
    // Alert the user by vibrating the device (if the device supports it)
    if ("vibrate" in navigator) {
        navigator.vibrate([500, 500, 500]);
    }

    alert("Focus time completed for today!");

    // Reset the whole application
    resetEverything();
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
    // state.sessionEndTime += sessionsCompleted * state.fullSessionMs;

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
    }

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
    // breakTimerState.sessionEndTime = null;

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
    }

    // One focus session is always completed, work out how many more are completed (if any)
    const focusSessionsCompleted = 1 + Math.floor(timePastSessionEnd / focusTimerState.fullSessionMs);

    // Continue to the next session of the focus timer
    nextSessionOfSameTimer(focusTimerState, focusSessionsCompleted);
};

// Determine what to do next when a break session ends
const completeBreakSession = (timePastSessionEnd) => {
    // Alert the user by vibrating the device (if the device supports it)
    if ("vibrate" in navigator) {
        navigator.vibrate([500, 500, 500]);
    }

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
    // Only continue running the timer if it's set to be running
    if (!state.isTimerRunning) return;

    // Define which is the other timer not being started
    const otherState = state === focusTimerState ? breakTimerState : focusTimerState;

    // Work out when the current session should end from the overall ending time
    const remainingTimeInCurrentSessions = state.msLeftInSession + otherState.msLeftInSession;

    const remainingTimeInFutureSessions = (state.totalSessions - state.sessionsCompleted - 1) * state.fullSessionMs
        + (otherState.totalSessions - otherState.sessionsCompleted - 1) * otherState.fullSessionMs;

    const currentSessionEndTime = endingTime.current[0]
        - remainingTimeInCurrentSessions
        - remainingTimeInFutureSessions;

    // Find current time
    const currentTime = Date.now();

    // If one or more timer sessions have been completed since the last update (because the browser window was closed), determine what to do next and don't update the timer by exiting this function
    if (currentTime >= currentSessionEndTime) {
        if (state === focusTimerState) {
            completeFocusSession(currentTime - currentSessionEndTime);
        }
        // If the break timer was running at the last timer update
        else if (state === breakTimerState) {
            completeBreakSession(currentTime - currentSessionEndTime);
        };
        return;
    }

    // Work out how many milliseconds there are between now and the current session end time
    const msToDisplay = currentSessionEndTime - currentTime;

    // Update the minutes and seconds displayed on the countdown that's running
    updateCountdownDisplay(state, msToDisplay);

    // Run this function again in one second
    setTimeout(() => updateTimer(state), 1000);
};

// Pause the relevant timer
const pauseTimer = (state) => {
    // Only if both timers are now paused (not switching from one timer to the other)
    if (!focusTimerState.isTimerRunning && !breakTimerState.isTimerRunning) {
        // If current ending time isn't null
        // Save a copy of current ending time to array of previous ending times
        // if (endingTime.current)
        endingTime.previous.push([...endingTime.current]);

        // Unset current ending time
        endingTime.current = null;

        // Save ending times to local storage and update the displays
        saveAndDisplayEndingTimes();
    }

    // Toggle timer to not be running
    state.isTimerRunning = false;

    // If the time left hasn't already been set for the next session
    // if (!state.msLeftInSession) {
    //     const currentTime = Date.now();

    //     // Save the number of milliseconds left in the current focus sessions, for when the focus timer is restarted
    //     state.msLeftInSession = state.sessionEndTime - currentTime;
    // }

    // Define which is the timer not being paused
    const otherState = state === focusTimerState
        ? breakTimerState
        : focusTimerState;

    // Work out when the current session should end from the overall ending time
    const remainingTimeInCurrentSessions = otherState.msLeftInSession;

    const remainingTimeInFutureSessions = (state.totalSessions - state.sessionsCompleted - 1) * state.fullSessionMs
        + (otherState.totalSessions - otherState.sessionsCompleted - 1) * otherState.fullSessionMs;

    const currentSessionEndTime = endingTime.current[0]
        - remainingTimeInCurrentSessions
        - remainingTimeInFutureSessions;

    // Save time left in current session for next time this timer is started
    state.msLeftInSession = currentSessionEndTime - Date.now();

    // Unset the end time for the current focus session until the focus timer is started again
    // state.sessionEndTime = null;

    // Update text on the relevant start/pause button
    state.btn.textContent = `Start ${state.name} Timer`;

    // Save updated timer data to local storage
    saveTimerState(state);
}

// Start or resume the relevant timer
const startTimer = (state) => {
    // Define which is the other timer not being started
    const otherState = state === focusTimerState ? breakTimerState : focusTimerState;

    // Find the current time
    const currentTime = Date.now();

    // If both timers were paused, set the ending time
    if (!focusTimerState.isTimerRunning && !breakTimerState.isTimerRunning) {
        // Set current ending time using time left in both current sessions and all sessions not yet started
        const remainingCurrentSessions = state.msLeftInSession + otherState.msLeftInSession;
        const remainingFutureSessions = (state.totalSessions - state.sessionsCompleted - 1) * state.fullSessionMs
            + (otherState.totalSessions - otherState.sessionsCompleted - 1) * otherState.fullSessionMs;
        endingTime.current = [
            currentTime + remainingCurrentSessions + remainingFutureSessions,
            currentTime // Save current time as the time when this ending time was created
        ];

        // Save updated ending times to local storage and update the displays
        saveAndDisplayEndingTimes();
    }

    // If the session end time isn't already set
    // if (!state.sessionEndTime) {
    // Set the end time in milliseconds for the current focus session
    // state.sessionEndTime = currentTime + state.msLeftInSession;
    // }

    // Unset the time left in the current session until the timer is paused again
    state.msLeftInSession = null;

    // Update text on the relevant start/pause button
    state.btn.textContent = `Pause ${state.name} Timer`;

    // Toggle timer to be running
    state.isTimerRunning = true;

    // Pause the other timer if it's already running
    if (otherState.isTimerRunning) pauseTimer(otherState);

    // Save updated timer data to local storage
    saveTimerState(state);

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

    // Update ending time displays
    updateCurrentEndingTimeDisplay();
    updatePreviousEndingTimesDisplay();

    // Continue updating the timer that's running recursively (which will also update its timer display)
    updateTimer(state);
};

// Helper function to update the current and previous ending times
const updateEndingTimes = (msToAdd, isPreviousEndingTimeLogged) => {
    // Only if choosing to log previous ending time
    if (isPreviousEndingTimeLogged) {
        // Add copy of current ending time to array of previous ending times 
        endingTime.previous.push([...endingTime.current]);
    }

    // Destructure array for current ending time
    let [endingTimeValue, timeCreatedAt] = endingTime.current;

    // Update current ending time by adding amount of time in milliseconds passed to this function
    endingTimeValue += msToAdd;

    // Save current time as the time when current ending time was created
    timeCreatedAt = Date.now();

    // Update array for current ending time
    endingTime.current = [endingTimeValue, timeCreatedAt];

    // Save updated ending times to local storage and update the displays
    saveAndDisplayEndingTimes();
};

// Reduce number of completed sessions of relevant timer by one
const removeCompletedSession = (state) => {
    // If there are no sessions completed, do nothing and exit this function
    if (state.sessionsCompleted <= 0) return;

    // Update sessions completed and sessions display
    state.sessionsCompleted--;
    updateSessionsDisplay(state);

    // Save updated data to local storage
    saveTimerState(state);

    // Only if one of the timers is running
    if (focusTimerState.isTimerRunning || breakTimerState.isTimerRunning) {
        // Update ending times (logging previous ending time) by adding length of a full session to current ending time
        updateEndingTimes(state.fullSessionMs, true);
    }
};

// Increase completed sessions of relevant timer by one
const addCompletedSession = (state) => {
    // If there's one or fewer of the relevant session left, don't add another one and exit this function
    if (state.sessionsCompleted >= state.totalSessions - 1) return;

    // Update number of completed sessions and sessions display
    state.sessionsCompleted++;
    updateSessionsDisplay(state);

    // Save updated data to local storage
    saveTimerState(state);

    // Only if one of the timers is running
    if (focusTimerState.isTimerRunning || breakTimerState.isTimerRunning) {
        // Update ending times (logging previous ending time) by subtracting length of a full session from current ending time
        updateEndingTimes(-state.fullSessionMs, true);
    }
};

// Remove a minute from relevant timer
const removeMinute = (state, isPreviousEndingTimeLogged) => {
    if (state.isTimerRunning) {
        // Work out current time once for each time it's used in this function
        const currentTime = Date.now();

        // If timer has a minute or less to go, do nothing and exit this function
        if (state.sessionEndTime - currentTime <= msPerMinute) return;

        // If timer is running, remove a minute from end time of current session
        state.sessionEndTime -= msPerMinute;

        // Update countdown display based on difference between session end time and current time
        updateCountdownDisplay(state, state.sessionEndTime - currentTime);
    } else {
        // If timer has a minute or less to go, do nothing and exit this function
        if (state.msLeftInSession <= msPerMinute) return;

        // If timer isn't running, remove a minute from time left in current session
        state.msLeftInSession -= msPerMinute;

        // Update countdown display based on time left in current session
        updateCountdownDisplay(state, state.msLeftInSession);
    }

    // Save updated data to local storage
    saveTimerState(state);

    // Only if one of the timers is running
    if (focusTimerState.isTimerRunning || breakTimerState.isTimerRunning) {
        // Update ending times (choosing whether or not to log previous time) by subtracting a minute from current ending time
        updateEndingTimes(-msPerMinute, isPreviousEndingTimeLogged);
    }
};

// Add an extra minute to relevant timer
const addMinute = (state, isPreviousEndingTimeLogged) => {
    // Only if one of the timers is running
    if (focusTimerState.isTimerRunning || breakTimerState.isTimerRunning) {
        // Update ending times (choosing whether or not to log previous ending time) by adding a minute to current ending time
        updateEndingTimes(msPerMinute, isPreviousEndingTimeLogged);
    }
    
    // If the relevant timer is running
    if (state.isTimerRunning) {
        // Add a minute to session end time if timer is running
        // state.sessionEndTime += msPerMinute;

        // Update countdown display based on difference between session end time and current time
        updateCountdownDisplay(state, state.sessionEndTime - Date.now());
    } else {
        // Add a minute to time left in current session if timer isn't running
        state.msLeftInSession += msPerMinute;
        // Update countdown display based on time left in current session
        updateCountdownDisplay(state, state.msLeftInSession);
    }

    // Save updated data to local storage
    saveTimerState(state);
};

// When the window loads for the first time or after being reopened
window.onload = (event) => {
    // Load data for both timers and ending time values from local storage
    loadTimerState(focusTimerState);
    loadTimerState(breakTimerState);
    loadEndingTimes();

    // If one of the timers was running, resume that timer
    if (focusTimerState.isTimerRunning) {
        resumeRunningTimer(focusTimerState);
    } else if (breakTimerState.isTimerRunning) {
        resumeRunningTimer(breakTimerState);
    }
    // If neither timer was running, update both countdown displays, both sessions displays and previous ending time display
    else {
        updateCountdownDisplay(focusTimerState, focusTimerState.msLeftInSession);
        updateCountdownDisplay(breakTimerState, breakTimerState.msLeftInSession);
        updateSessionsDisplay(focusTimerState);
        updateSessionsDisplay(breakTimerState);
        updatePreviousEndingTimesDisplay();
    }
};

// Mapping of buttons that can't be held down to the functions they trigger
const btnActions = {
    timerBtn: startOrPauseTimer,
    removeSessionBtn: removeCompletedSession,
    addSessionBtn: addCompletedSession,
};

// Add event listeners for buttons that can't be held down
const addListeners = (timerName, state) => {
    for (const [btn, func] of Object.entries(btnActions)) {
        pageElements[timerName][btn].addEventListener("click", () => func(state));
    }
};
addListeners("focus", focusTimerState);
addListeners("break", breakTimerState);

// Boolean to track whether the button was held down instead of being pressed quickly
let btnHeldDown;

// Variables to capture the ids of the timeout and interval so they can be stopped later
let timeoutId;
let intervalId;

// Trigger the function once if the button is pressed quickly or keep triggering it if the button is held down
const btnPressed = (func, state) => {
    // Set boolean as false if the timeout doesn't finish
    btnHeldDown = false;

    // Wait a short amount of time before repeatedly adding more minutes
    timeoutId = setTimeout(() => {
        // Set boolean to true to show button was held down
        btnHeldDown = true;

        // Only if one of the timers is running
        if (focusTimerState.isTimerRunning || breakTimerState.isTimerRunning) {
            // Add current ending time to array of previous ending times
            endingTime.previous.push([...endingTime.current]);
        }

        // While the button is still held down, keep triggering the relevant function (without logging previous ending time) at a set interval
        intervalId = setInterval(() => func(state, false), 100);
    }, 1000);
};

// Stop triggering the function when the button is released
const btnReleased = (func, state) => {
    // Stop the timeout and interval
    clearTimeout(timeoutId);
    clearInterval(intervalId);

    // Trigger the function once (logging previous ending time) if the button was pressed quickly and not held down
    if (!btnHeldDown) func(state, true);
};

// Mapping of buttons that can be held down to the functions they trigger
const heldDownBtnActions = {
    removeMinBtn: removeMinute,
    addMinBtn: addMinute
};

// Add event listeners for buttons that can be held down
const addHeldDownListeners = (timerName, state) => {
    for (const [btn, func] of Object.entries(heldDownBtnActions)) {
        pageElements[timerName][btn].addEventListener("pointerdown", () => btnPressed(func, state));
        pageElements[timerName][btn].addEventListener("pointerup", () => btnReleased(func, state));
        pageElements[timerName][btn].addEventListener("pointercancel", () => btnReleased(func, state));
    }
};
addHeldDownListeners("focus", focusTimerState);
addHeldDownListeners("break", breakTimerState);

// Add event listener for reset button
pageElements.resetBtn.addEventListener("click", resetEverything);

/*

Two states:

1. One of the timers is running:

- Work out ending time, based on time left in current session of each timer and remaining sessions left
- Work out time left in current session from ending time

ending time === time left in focus session + time left in break session + length of focus sessions left + length of break sessions left

time left in current session of running timer === ending time - length of focus sessions left - length of break sessions left - time left in session of timer not running

2. Neither timer is running:

- Save time left in current session of both timers
- Keep track of numbers of complete sessions left for both timers

When to change between the two states:

- When starting one of the timers
- When pausing one of the timers
- When resetting both timers

*/