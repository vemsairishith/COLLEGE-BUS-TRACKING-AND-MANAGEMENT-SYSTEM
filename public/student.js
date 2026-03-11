const API_URL = 'http://localhost:3000/api';
let token = localStorage.getItem('studentToken');
let currentUser = null;

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
    const address = document.getElementById('regAddress').value;

    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, name, role: 'student', email, password, contact, address })
        });

        const data = await response.json();
        if (response.ok) {
            token = data.token;
            localStorage.setItem('studentToken', token);
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
        if (response.ok && data.user.role === 'student') {
            token = data.token;
            localStorage.setItem('studentToken', token);
            currentUser = data.user;
            showMessage('Login successful!', 'success');
            loadDashboard();
        } else {
            showMessage('Invalid credentials or not a student account', 'error');
        }
    } catch (error) {
        showMessage('Error: ' + error.message, 'error');
    }
}

async function checkAuth() {
    if (!token || !currentUser) return;
    loadDashboard();
}

function logout() {
    token = null;
    localStorage.removeItem('studentToken');
    currentUser = null;
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
    if (!currentUser || !currentUser.id) {
        showMessage('User information not available', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/routes/student/${currentUser.id}`, {
            headers: { 'Authorization': token }
        });

        const data = await response.json();
        
        if (response.ok) {
            const route = data.route;
            const allocation = data.allocation;
            
            const routeInfoDiv = document.getElementById('routeInfo');
            routeInfoDiv.innerHTML = `
                <div class="tracking-info">
                    <h3>Route Details</h3>
                    <div class="info-item">
                        <strong>Route Name:</strong> ${route.routeName}
                    </div>
                    <div class="info-item">
                        <strong>Bus Number:</strong> ${route.busId ? route.busId.busNumber : 'Not Assigned'}
                    </div>
                    <div class="info-item">
                        <strong>Driver Name:</strong> ${route.driverId ? route.driverId.name : 'Not Assigned'}
                    </div>
                    <div class="info-item">
                        <strong>Driver Contact:</strong> ${route.driverId ? route.driverId.contact : 'N/A'}
                    </div>
                    <div class="info-item">
                        <strong>Your Stop:</strong> ${allocation.assignedStop}
                    </div>
                    <div class="info-item">
                        <strong>All Stops:</strong> ${route.stops.join(' → ')}
                    </div>
                </div>
                
                <div class="tracking-info" style="margin-top: 20px; background: #fff3cd; border-left-color: #ffc107;">
                    <h3>Live Tracking Status</h3>
                    <div class="info-item" style="font-size: 1.3em; font-weight: bold; color: #667eea;">
                        ${data.statusMessage}
                    </div>
                    <div class="info-item">
                        <strong>Current Bus Location:</strong> ${route.busId?.currentStop || 'Not Started'}
                    </div>
                    <div class="info-item">
                        <strong>Bus Status:</strong> <span class="status-badge status-${route.busId?.status?.toLowerCase() || 'active'}">${route.busId?.status || 'Active'}</span>
                    </div>
                    ${data.stopsAway > 0 ? `
                    <div class="info-item">
                        <strong>Estimated Time:</strong> Approximately ${data.stopsAway * 5} minutes
                    </div>
                    ` : ''}
                </div>
            `;
        } else {
            document.getElementById('routeInfo').innerHTML = `
                <div class="message error">
                    ${data.message || 'No route assigned. Please contact admin.'}
                </div>
            `;
        }
    } catch (error) {
        showMessage('Error loading route information: ' + error.message, 'error');
        document.getElementById('routeInfo').innerHTML = `
            <div class="message error">
                Error loading route information. Please try again.
            </div>
        `;
    }
}

async function refreshTracking() {
    await loadRouteInfo();
    showMessage('Tracking information refreshed!', 'success');
}

// Auto-refresh every 30 seconds
setInterval(() => {
    if (token && currentUser && !document.getElementById('dashboardSection').classList.contains('hidden')) {
        loadRouteInfo();
    }
}, 30000);

