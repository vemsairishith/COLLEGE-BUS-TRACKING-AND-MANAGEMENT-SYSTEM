const API_URL = 'http://localhost:3000/api';
let token = localStorage.getItem('adminToken');
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

    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, name, role: 'admin', email, password, contact })
        });

        const data = await response.json();
        if (response.ok) {
            token = data.token;
            localStorage.setItem('adminToken', token);
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
        if (response.ok && data.user.role === 'admin') {
            token = data.token;
            localStorage.setItem('adminToken', token);
            currentUser = data.user;
            showMessage('Login successful!', 'success');
            loadDashboard();
        } else {
            showMessage('Invalid credentials or not an admin account', 'error');
        }
    } catch (error) {
        showMessage('Error: ' + error.message, 'error');
    }
}

async function checkAuth() {
    if (!token) return;
    // Simple check - in production, verify token with backend
    loadDashboard();
}

function logout() {
    token = null;
    localStorage.removeItem('adminToken');
    currentUser = null;
    document.getElementById('loginSection').classList.remove('hidden');
    document.getElementById('registerSection').classList.add('hidden');
    document.getElementById('dashboardSection').classList.add('hidden');
}

async function loadDashboard() {
    document.getElementById('loginSection').classList.add('hidden');
    document.getElementById('registerSection').classList.add('hidden');
    document.getElementById('dashboardSection').classList.remove('hidden');

    await loadStats();
    await loadBuses();
    await loadBusesForRoute();
    await loadRoutes();
    await loadAllocations();
    await loadDrivers();
    await loadStudents();
}

async function loadStats() {
    try {
        const response = await fetch(`${API_URL}/admin/summary`, {
            headers: { 'Authorization': token }
        });
        const stats = await response.json();
        
        document.getElementById('dashboardStats').innerHTML = `
            <div class="stat-card">
                <h3>${stats.totalBuses}</h3>
                <p>Total Buses</p>
            </div>
            <div class="stat-card">
                <h3>${stats.activeRoutes}</h3>
                <p>Active Routes</p>
            </div>
            <div class="stat-card">
                <h3>${stats.studentsAllocated}</h3>
                <p>Students Allocated</p>
            </div>
            <div class="stat-card">
                <h3>${stats.busesEnRoute}</h3>
                <p>Buses En Route</p>
            </div>
        `;
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

async function loadBuses() {
    try {
        const response = await fetch(`${API_URL}/buses`, {
            headers: { 'Authorization': token }
        });
        const buses = await response.json();
        
        const tbody = document.querySelector('#busesTable tbody');
        tbody.innerHTML = buses.map(bus => `
            <tr>
                <td>${bus.busId}</td>
                <td>${bus.busNumber}</td>
                <td>${bus.capacity}</td>
                <td>${bus.driverId ? bus.driverId.name : 'No Driver'}</td>
                <td><span class="status-badge status-${bus.status.toLowerCase()}">${bus.status}</span></td>
                <td>${bus.currentStop || 'N/A'}</td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading buses:', error);
    }
}

async function loadRoutes() {
    try {
        const response = await fetch(`${API_URL}/routes`, {
            headers: { 'Authorization': token }
        });
        const routes = await response.json();
        
        const tbody = document.querySelector('#routesTable tbody');
        tbody.innerHTML = routes.map(route => `
            <tr>
                <td>${route.routeId}</td>
                <td>${route.routeName}</td>
                <td>${route.stops.join(', ')}</td>
                <td>${route.busId ? route.busId.busNumber : 'No Bus'}</td>
                <td>${route.driverId ? route.driverId.name : 'No Driver'}</td>
            </tr>
        `).join('');

        // Populate route dropdown
        const routeSelect = document.getElementById('allocationRoute');
        routeSelect.innerHTML = '<option value="">Select Route</option>' + 
            routes.map(r => `<option value="${r._id}">${r.routeName}</option>`).join('');
    } catch (error) {
        console.error('Error loading routes:', error);
    }
}

async function loadAllocations() {
    try {
        const response = await fetch(`${API_URL}/allocations`, {
            headers: { 'Authorization': token }
        });
        const allocations = await response.json();
        
        const tbody = document.querySelector('#allocationsTable tbody');
        tbody.innerHTML = allocations.map(alloc => `
            <tr>
                <td>${alloc.allocationId}</td>
                <td>${alloc.studentId.name}</td>
                <td>${alloc.routeId.routeName}</td>
                <td>${alloc.assignedStop}</td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading allocations:', error);
    }
}

async function loadDrivers() {
    try {
        const response = await fetch(`${API_URL}/admin/users/driver`, {
            headers: { 'Authorization': token }
        });
        const drivers = await response.json();
        
        const busDriverSelect = document.getElementById('busDriver');
        const routeDriverSelect = document.getElementById('routeDriver');
        
        const options = '<option value="">No Driver Assigned</option>' + 
            drivers.map(d => `<option value="${d._id}">${d.name} (${d.contact})</option>`).join('');
        
        busDriverSelect.innerHTML = options;
        routeDriverSelect.innerHTML = options;
    } catch (error) {
        console.error('Error loading drivers:', error);
    }
}

async function loadStudents() {
    try {
        const response = await fetch(`${API_URL}/admin/users/student`, {
            headers: { 'Authorization': token }
        });
        const students = await response.json();
        
        const studentSelect = document.getElementById('allocationStudent');
        studentSelect.innerHTML = '<option value="">Select Student</option>' + 
            students.map(s => `<option value="${s._id}">${s.name} (${s.email})</option>`).join('');
    } catch (error) {
        console.error('Error loading students:', error);
    }
}

async function addBus() {
    const busId = document.getElementById('busId').value;
    const busNumber = document.getElementById('busNumber').value;
    const capacity = document.getElementById('busCapacity').value;
    const driverId = document.getElementById('busDriver').value;

    try {
        const response = await fetch(`${API_URL}/buses`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token
            },
            body: JSON.stringify({ busId, busNumber, capacity: parseInt(capacity), driverId: driverId || null })
        });

        const data = await response.json();
        if (response.ok) {
            showMessage('Bus added successfully!', 'success');
            document.getElementById('busId').value = '';
            document.getElementById('busNumber').value = '';
            document.getElementById('busCapacity').value = '';
            document.getElementById('busDriver').value = '';
            loadBuses();
            loadStats();
        } else {
            showMessage(data.message || 'Error adding bus', 'error');
        }
    } catch (error) {
        showMessage('Error: ' + error.message, 'error');
    }
}

async function addRoute() {
    const routeId = document.getElementById('routeId').value;
    const routeName = document.getElementById('routeName').value;
    const stops = document.getElementById('routeStops').value.split(',').map(s => s.trim());
    const timings = document.getElementById('routeTimings').value.split(',').map(t => t.trim());
    const busId = document.getElementById('routeBus').value;
    const driverId = document.getElementById('routeDriver').value;

    try {
        const response = await fetch(`${API_URL}/routes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token
            },
            body: JSON.stringify({ routeId, routeName, stops, timings, busId: busId || null, driverId: driverId || null })
        });

        const data = await response.json();
        if (response.ok) {
            showMessage('Route added successfully!', 'success');
            document.getElementById('routeId').value = '';
            document.getElementById('routeName').value = '';
            document.getElementById('routeStops').value = '';
            document.getElementById('routeTimings').value = '';
            document.getElementById('routeBus').value = '';
            document.getElementById('routeDriver').value = '';
            loadRoutes();
            loadStats();
        } else {
            showMessage(data.message || 'Error adding route', 'error');
        }
    } catch (error) {
        showMessage('Error: ' + error.message, 'error');
    }
}

async function assignStudent() {
    const allocationId = document.getElementById('allocationId').value;
    const studentId = document.getElementById('allocationStudent').value;
    const routeId = document.getElementById('allocationRoute').value;
    const assignedStop = document.getElementById('allocationStop').value;

    try {
        const response = await fetch(`${API_URL}/routes/assign`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token
            },
            body: JSON.stringify({ allocationId, studentId, routeId, assignedStop })
        });

        const data = await response.json();
        if (response.ok) {
            showMessage('Student assigned successfully!', 'success');
            document.getElementById('allocationId').value = '';
            document.getElementById('allocationStudent').value = '';
            document.getElementById('allocationRoute').value = '';
            document.getElementById('allocationStop').value = '';
            loadAllocations();
            loadStats();
        } else {
            showMessage(data.message || 'Error assigning student', 'error');
        }
    } catch (error) {
        showMessage('Error: ' + error.message, 'error');
    }
}

// Load buses for route dropdown
async function loadBusesForRoute() {
    try {
        const response = await fetch(`${API_URL}/buses`, {
            headers: { 'Authorization': token }
        });
        const buses = await response.json();
        
        const busSelect = document.getElementById('routeBus');
        busSelect.innerHTML = '<option value="">No Bus Assigned</option>' + 
            buses.map(b => `<option value="${b._id}">${b.busNumber}</option>`).join('');
    } catch (error) {
        console.error('Error loading buses:', error);
    }
}

// Load buses when route section is accessed
document.addEventListener('DOMContentLoaded', () => {
    if (token) {
        checkAuth();
    }
});

// Update route bus dropdown when buses are loaded
const originalLoadBuses = loadBuses;
loadBuses = async function() {
    await originalLoadBuses();
    await loadBusesForRoute();
};

