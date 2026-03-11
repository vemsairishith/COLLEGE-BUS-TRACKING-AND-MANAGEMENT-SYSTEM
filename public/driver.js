const API_URL = 'http://localhost:3000/api';
let token = localStorage.getItem('driverToken');
let currentUser = null;
let assignedRoute = null;
let assignedBus = null;

// Check if already logged in
if (token) {
    checkAuth();
}

function showMessage(text, type = 'success') {
    const messageDiv = document.getElementById('message');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = text;
    messageDiv.classList.remove('hidden');
    setTimeout(() => {
        messageDiv.classList.add('hidden');
    }, 5000);
}

function showLogin() {
    document.getElementById('loginSection').classList.remove('hidden');
    document.getElementById('registerSection').classList.add('hidden');
}

function showRegister() {
    document.getElementById('loginSection').classList.add('hidden');
    document.getElementById('registerSection').classList.remove('hidden');
}

async function register() {
    const userId = document.getElementById('regUserId').value;
    const name = document.getElementById('regName').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const contact = document.getElementById('regContact').value;

    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, name, role: 'driver', email, password, contact })
        });

        const data = await response.json();
        if (response.ok) {
            token = data.token;
            localStorage.setItem('driverToken', token);
            currentUser = data.user;
            showMessage('Registration successful!', 'success');
            loadDashboard();
        } else {
            showMessage(data.message || 'Registration failed', 'error');
        }
    } catch (error) {
        showMessage('Error: ' + error.message, 'error');
    }
}

async function login() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();
        if (response.ok && data.user.role === 'driver') {
            token = data.token;
            localStorage.setItem('driverToken', token);
            currentUser = data.user;
            showMessage('Login successful!', 'success');
            loadDashboard();
        } else {
            showMessage('Invalid credentials or not a driver account', 'error');
        }
    } catch (error) {
        showMessage('Error: ' + error.message, 'error');
    }
}

async function checkAuth() {
    if (!token) return;
    loadDashboard();
}

function logout() {
    token = null;
    localStorage.removeItem('driverToken');
    currentUser = null;
    assignedRoute = null;
    assignedBus = null;
    document.getElementById('loginSection').classList.remove('hidden');
    document.getElementById('registerSection').classList.add('hidden');
    document.getElementById('dashboardSection').classList.add('hidden');
}

async function loadDashboard() {
    document.getElementById('loginSection').classList.add('hidden');
    document.getElementById('registerSection').classList.add('hidden');
    document.getElementById('dashboardSection').classList.remove('hidden');

    await loadRouteInfo();
}

async function loadRouteInfo() {
    try {
        // Get all routes and find the one assigned to this driver
        const response = await fetch(`${API_URL}/routes`, {
            headers: { 'Authorization': token }
        });

        const routes = await response.json();
        assignedRoute = routes.find(r => r.driverId && (r.driverId._id === currentUser.id || r.driverId._id.toString() === currentUser.id));

        if (assignedRoute) {
            assignedBus = assignedRoute.busId;
            
            const routeInfoDiv = document.getElementById('routeInfo');
            routeInfoDiv.innerHTML = `
                <div class="tracking-info">
                    <h3>Route Details</h3>
                    <div class="info-item">
                        <strong>Route Name:</strong> ${assignedRoute.routeName}
                    </div>
                    <div class="info-item">
                        <strong>Route ID:</strong> ${assignedRoute.routeId}
                    </div>
                    <div class="info-item">
                        <strong>Bus Number:</strong> ${assignedBus ? assignedBus.busNumber : 'Not Assigned'}
                    </div>
                    <div class="info-item">
                        <strong>Current Stop:</strong> ${assignedBus?.currentStop || 'Not Started'}
                    </div>
                    <div class="info-item">
                        <strong>Bus Status:</strong> <span class="status-badge status-${assignedBus?.status?.toLowerCase() || 'active'}">${assignedBus?.status || 'Active'}</span>
                    </div>
                    <div class="info-item">
                        <strong>Stops:</strong> ${assignedRoute.stops.join(' → ')}
                    </div>
                    <div class="info-item">
                        <strong>Timings:</strong> ${assignedRoute.timings.join(', ')}
                    </div>
                </div>
            `;

            // Populate stop dropdown
            const stopSelect = document.getElementById('currentStop');
            stopSelect.innerHTML = '<option value="">Select Stop</option>' + 
                assignedRoute.stops.map(stop => 
                    `<option value="${stop}" ${stop === assignedBus?.currentStop ? 'selected' : ''}>${stop}</option>`
                ).join('');
        } else {
            document.getElementById('routeInfo').innerHTML = `
                <div class="message error">
                    No route assigned. Please contact admin.
                </div>
            `;
        }
    } catch (error) {
        showMessage('Error loading route information: ' + error.message, 'error');
    }
}

async function updateStatus() {
    if (!assignedBus) {
        showMessage('No bus assigned', 'error');
        return;
    }

    const currentStop = document.getElementById('currentStop').value;
    const busStatus = document.getElementById('busStatus').value;

    try {
        const response = await fetch(`${API_URL}/buses/${assignedBus._id}/location`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token
            },
            body: JSON.stringify({ currentStop, status: busStatus })
        });

        const data = await response.json();
        if (response.ok) {
            showMessage('Status updated successfully!', 'success');
            await loadRouteInfo();
        } else {
            showMessage(data.message || 'Error updating status', 'error');
        }
    } catch (error) {
        showMessage('Error: ' + error.message, 'error');
    }
}

