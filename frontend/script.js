const API_URL = 'http://localhost:3000/api'; // Ensure this is correct

let token = ''; // Store the JWT token

// Function to display error messages
function displayError(message) {
    const errorMessageDiv = document.getElementById('error-message');
    errorMessageDiv.innerText = message; // Set the error message
}

// Clear error messages
function clearError() {
    const errorMessageDiv = document.getElementById('error-message');
    errorMessageDiv.innerText = ''; // Clear the error message
}

async function signup() {
    clearError(); // Clear previous error messages
    const username = document.getElementById('signup-username').value;
    const password = document.getElementById('signup-password').value;
    const email = document.getElementById('signup-email').value;

    const response = await fetch(`${API_URL}/signup`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password, email }),
    });

    const data = await response.json();
    if (!response.ok) {
        displayError(data.errors ? data.errors.map(err => err.msg).join(', ') : data.message);
    } else {
        alert('Signup successful!');
    }
}

async function login() {
    clearError(); // Clear previous error messages
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
    });

    const data = await response.json();
    if (!response.ok) {
        displayError(data.message || 'Login failed!');
    } else {
        token = data.token; // Store the token
        localStorage.setItem('token', token); // Save token to localStorage
        alert('Login successful!');
        await fetchExercises(); // Fetch exercises after successful login
        await listWorkouts(); // List workouts after successful login
    }
}

async function fetchExercises() {
    clearError(); // Clear previous error messages
    const response = await fetch(`${API_URL}/exercises`, {
        method: 'GET',
        headers: {
            'Authorization': token,
        },
    });

    const exercises = await response.json();
    const workoutExercisesSelect = document.getElementById('workout-exercises');
    const updateWorkoutExercisesSelect = document.getElementById('update-workout-exercises');
    workoutExercisesSelect.innerHTML = ''; // Clear previous exercises
    updateWorkoutExercisesSelect.innerHTML = ''; // Clear previous exercises in update section

    if (!response.ok) {
        displayError(exercises.message || 'Failed to fetch exercises');
    } else {
        exercises.forEach(exercise => {
            const option = document.createElement('option');
            option.value = exercise.id; // Assuming exercise has an 'id' field
            option.textContent = exercise.name; // Display exercise name
            workoutExercisesSelect.appendChild(option);
            updateWorkoutExercisesSelect.appendChild(option.cloneNode(true)); // Clone option for update section
        });
    }
}

async function createExercise() {
    clearError(); // Clear previous error messages
    const name = document.getElementById('exercise-name').value;
    const description = document.getElementById('exercise-description').value;
    const category = document.getElementById('exercise-category').value;
    const muscle_group = document.getElementById('exercise-muscle-group').value;

    const response = await fetch(`${API_URL}/exercises`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': token,
        },
        body: JSON.stringify({ name, description, category, muscle_group }),
    });

    const data = await response.json();
    if (!response.ok) {
        displayError(data.errors ? data.errors.map(err => err.msg).join(', ') : data.message);
    } else {
        alert('Exercise created successfully!');
        await fetchExercises(); // Refresh the exercise list
    }
}

async function createWorkout() {
    clearError(); // Clear previous error messages
    const date = new Date(document.getElementById('workout-date').value).toISOString();
    const comments = document.getElementById('workout-comments').value;
    const scheduled_time = new Date(document.getElementById('scheduled_time').value).toISOString(); // Get scheduled_time
    const exercises = Array.from(document.getElementById('workout-exercises').selectedOptions).map(option => ({
        exercise_id: option.value,
    }));

    const response = await fetch(`${API_URL}/workouts`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': token,
        },
        body: JSON.stringify({ date, comments, scheduled_time, exercises }), // Include scheduled_time
    });

    const data = await response.json();
    if (!response.ok) {
        displayError(data.errors ? data.errors.map(err => err.msg).join(', ') : data.message);
    } else {
        alert('Workout created successfully!');
    }
}

async function updateWorkout() {
    clearError(); // Clear previous error messages
    const id = document.getElementById('update-workout-id').value;
    const scheduled_time = new Date(document.getElementById('update-scheduled_time').value).toISOString(); // Get scheduled_time
    const comments = document.getElementById('update-workout-comments').value;
    const exercises = Array.from(document.getElementById('update-workout-exercises').selectedOptions).map(option => ({
        exercise_id: option.value,
    }));

    const response = await fetch(`${API_URL}/workouts/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': token,
        },
        body: JSON.stringify({ scheduled_time, comments, exercises }), // Include scheduled_time
    });

    const data = await response.json();
    if (!response.ok) {
        displayError(data.errors ? data.errors.map(err => err.msg).join(', ') : data.message);
    } else {
        alert('Workout updated successfully!');
        await listWorkouts(); // Refresh the workout list
        document.getElementById('update-workout').style.display = 'none'; // Hide the update form
    }
}

async function listWorkouts() {
    clearError(); // Clear previous error messages
    const response = await fetch(`${API_URL}/workouts`, {
        method: 'GET',
        headers: {
            'Authorization': token,
        },
    });

    const workouts = await response.json();
    const workoutsList = document.getElementById('workouts');
    workoutsList.innerHTML = ''; // Clear previous workouts

    if (!response.ok) {
        displayError(workouts.message || 'Failed to fetch workouts');
    } else {
        workouts.forEach(workout => {
            const li = document.createElement('li');
            li.textContent = `Workout ID: ${workout.id}, Date: ${workout.date}, Comments: ${workout.comments}, Scheduled Time: ${workout.scheduled_time}`;
            
            // Display associated exercises
            const exercises = workout.workout_exercises.map(we => we.exercise.name).join(', ');
            li.textContent += `, Exercises: ${exercises}`; // Append exercises to the list item
            
            // Create a delete button
            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Delete';
            deleteButton.onclick = () => deleteWorkout(workout.id); // Call delete function with workout ID
            
            li.appendChild(deleteButton); // Append delete button to the list item
            li.onclick = () => populateUpdateForm(workout); // Add click event to populate update form
            workoutsList.appendChild(li);
        });
    }
}

async function populateUpdateForm(workout) {
    document.getElementById('update-workout-id').value = workout.id; // Set the hidden ID field

    // Convert the scheduled_time to local time for datetime-local input
    const scheduledTime = new Date(workout.scheduled_time);
    const localScheduledTime = new Date(scheduledTime.getTime() - scheduledTime.getTimezoneOffset() * 60000); // Adjust for local timezone
    const formattedScheduledTime = localScheduledTime.toISOString().slice(0, 16); // Get YYYY-MM-DDTHH:MM
    document.getElementById('update-scheduled_time').value = formattedScheduledTime; // Set scheduled time

    document.getElementById('update-workout-comments').value = workout.comments; // Set comments

    // Clear previous exercises in the update dropdown
    const updateWorkoutExercisesSelect = document.getElementById('update-workout-exercises');
    updateWorkoutExercisesSelect.innerHTML = ''; 

    // Populate the update dropdown with exercises
    await fetchExercisesForUpdate(workout);

    // Show the update form
    document.getElementById('update-workout').style.display = 'block'; 
}

// Fetch exercises for the update form
async function fetchExercisesForUpdate(workout) {
    clearError(); // Clear previous error messages
    const response = await fetch(`${API_URL}/exercises`, {
        method: 'GET',
        headers: {
            'Authorization': token,
        },
    });

    const exercises = await response.json();
    const updateWorkoutExercisesSelect = document.getElementById('update-workout-exercises');
    updateWorkoutExercisesSelect.innerHTML = ''; // Clear previous exercises

    if (!response.ok) {
        displayError(exercises.message || 'Failed to fetch exercises');
    } else {
        exercises.forEach(exercise => {
            const option = document.createElement('option');
            option.value = exercise.id; // Assuming exercise has an 'id' field
            option.textContent = exercise.name; // Display exercise name
            // Mark as selected if it's part of the workout
            option.selected = workout.workout_exercises.some(we => we.exercise.id === exercise.id);
            updateWorkoutExercisesSelect.appendChild(option);
        });
    }
}

async function generateReport() {
    clearError(); // Clear previous error messages
    const response = await fetch(`${API_URL}/reports`, {
        method: 'GET',
        headers: {
            'Authorization': token,
        },
    });

    const report = await response.json();
    const reportOutput = document.getElementById('report-output');
    if (!response.ok) {
        displayError(report.message || 'Failed to generate report');
    } else {
        // Format the report output
        const reportText = `Total Workouts: ${report.totalWorkouts}
Total Exercises: ${report.totalExercises}
Most Common Exercises:
${report.mostCommonExercises.map(ex => `${ex.name}: ${ex.count}`).join('\n')}
`;
        reportOutput.textContent = reportText; // Display the formatted report
    }
}
async function deleteWorkout(id) {
    clearError(); // Clear previous error messages
    const response = await fetch(`${API_URL}/workouts/${id}`, {
        method: 'DELETE',
        headers: {
            'Authorization': token,
        },
    });

    if (!response.ok) {
        const data = await response.json();
        displayError(data.message || 'Failed to delete workout');
    } else {
        alert('Workout deleted successfully!');
        await listWorkouts(); // Refresh the workout list after deletion
    }
}
// On dashboard page load, check for token and fetch exercises
window.onload = async () => {

    token = localStorage.getItem('token'); // Retrieve token from localStorage
    if (!token) {
        alert('You need to log in first!');
        window.location.href = 'index.html'; // Redirect to login page if not logged in
    } else {
        await fetchExercises(); // Fetch exercises for the workout creation
        await listWorkouts(); // List workouts on load
    }
};