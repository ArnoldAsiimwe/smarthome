
document.addEventListener('DOMContentLoaded', function() {
    // Sample device data
    const devices = [
        { id: 1, name: 'Living Room Lights', type: 'lights', status: 'on', icon: 'lightbulb' },
        { id: 2, name: 'Alexa Echo', type: 'alexa', status: 'idle', icon: 'microphone' },
        { id: 3, name: 'Smart Watch', type: 'watch', status: 'active', icon: 'clock' },
        { id: 4, name: 'Thermostat', type: 'thermostat', status: 'off', temperature: 72, icon: 'temperature-low' },
        { id: 5, name: 'Smart Phone', type: 'phone', status: 'connected', icon: 'mobile' },
        { id: 6, name: 'Bedroom Lights', type: 'lights', status: 'off', icon: 'lightbulb' }
    ];

    // Sample routines data
    let routines = [
        { 
            id: 1, 
            name: 'Morning Routine', 
            time: '07:00', 
            days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], 
            actions: [
                { deviceId: 1, command: 'turnOn', value: null },
                { deviceId: 2, command: 'playMusic', value: null }
            ] 
        },
        { 
            id: 2, 
            name: 'Night Routine', 
            time: '22:30', 
            days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], 
            actions: [
                { deviceId: 1, command: 'turnOff', value: null },
                { deviceId: 6, command: 'turnOff', value: null },
                { deviceId: 4, command: 'setTemperature', value: 68 }
            ] 
        }
    ];

    // DOM Elements
    const devicesGrid = document.querySelector('.devices-grid');
    const routinesList = document.querySelector('.routines-list');
    const syncBtn = document.getElementById('syncBtn');
    const lastSynced = document.getElementById('lastSynced');
    const addRoutineBtn = document.getElementById('addRoutineBtn');
    const routineModal = document.getElementById('routineModal');
    const actionModal = document.getElementById('actionModal');
    const routineForm = document.getElementById('routineForm');
    const actionForm = document.getElementById('actionForm');
    const actionsContainer = document.getElementById('actionsContainer');
    const addActionBtn = document.getElementById('addActionBtn');
    const actionDeviceSelect = document.getElementById('actionDevice');
    const actionCommandSelect = document.getElementById('actionCommand');
    const valueInput = document.getElementById('valueInput');
    const actionValue = document.getElementById('actionValue');
    const closeBtns = document.querySelectorAll('.close-btn');

    // Current routine being edited
    let currentRoutineId = null;
    let currentActions = [];

    // Initialize the dashboard
    function initDashboard() {
        renderDevices();
        renderRoutines();
        updateLastSynced();
    }

    // Render devices to the grid
    function renderDevices() {
        devicesGrid.innerHTML = '';
        devices.forEach(device => {
            const deviceCard = document.createElement('div');
            deviceCard.className = 'device-card';
            deviceCard.innerHTML = `
                <div class="device-icon">
                    <i class="fas fa-${device.icon}"></i>
                </div>
                <div class="device-name">${device.name}</div>
                <div class="device-status">Status: ${device.status}</div>
                <div class="device-actions">
                    <label class="toggle-switch">
                        <input type="checkbox" ${device.status === 'on' || device.status === 'active' ? 'checked' : ''}>
                        <span class="toggle-slider"></span>
                    </label>
                </div>
            `;
            devicesGrid.appendChild(deviceCard);

            // Add event listener to toggle switch
            const toggle = deviceCard.querySelector('input[type="checkbox"]');
            toggle.addEventListener('change', () => {
                device.status = toggle.checked ? 'on' : 'off';
                if (device.type === 'thermostat') {
                    device.status = toggle.checked ? 'active' : 'off';
                }
                if (device.type === 'alexa' || device.type === 'phone' || device.type === 'watch') {
                    device.status = toggle.checked ? 'active' : 'idle';
                }
                deviceCard.querySelector('.device-status').textContent = 'Status: ${device.status}';
            });
        });
    }

    // Render routines to the list
    function renderRoutines() {
        routinesList.innerHTML = '';
        routines.forEach(routine => {
            const routineItem = document.createElement('div');
            routineItem.className = 'routine-item';
            
            // Format days
            const daysText = routine.days.length === 7 ? 'Every day' : 
                            routine.days.length === 5 && 
                            !routine.days.includes('Sat') && 
                            !routine.days.includes('Sun') ? 'Weekdays' : 
                            routine.days.join(', ');
            
            // Format actions
            const actionsText = routine.actions.map(action => {
                const device = devices.find(d => d.id === action.deviceId);
                let actionText = `${device.name}: `;
                switch(action.command) {
                    case 'turnOn':
                        actionText += 'Turn On';
                        break;
                    case 'turnOff':
                        actionText += 'Turn Off';
                        break;
                    case 'setTemperature':
                        actionText += 'Set Temp to ${action.value}°F';
                        break;
                    case 'setBrightness':
                        actionText += 'Set Brightness to ${action.value}%';
                        break;
                    case 'playMusic':
                        actionText += 'Play Music';
                        break;
                }
                return actionText;
            }).join('; ');

            routineItem.innerHTML = `
                <div class="routine-info">
                    <div class="routine-name">${routine.name}</div>
                    <div class="routine-schedule">${routine.time} • ${daysText}</div>
                    <div class="routine-actions-text" style="font-size: 0.8rem; color: #666; margin-top: 5px;">${actionsText}</div>
                </div>
                <div class="routine-actions">
                    <button class="action-btn edit-btn" data-id="${routine.id}"><i class="fas fa-edit"></i> Edit</button>
                    <button class="action-btn delete-btn" data-id="${routine.id}"><i class="fas fa-trash"></i> Delete</button>
                </div>
            `;
            routinesList.appendChild(routineItem);
        });

        // Add event listeners to edit and delete buttons
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const routineId = parseInt(e.target.getAttribute('data-id') || e.target.parentElement.getAttribute('data-id'));
                editRoutine(routineId);
            });
        });

        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const routineId = parseInt(e.target.getAttribute('data-id') || e.target.parentElement.getAttribute('data-id'));
                deleteRoutine(routineId);
            });
        });
    }

    // Update last synced time
    function updateLastSynced() {
        const now = new Date();
        lastSynced.textContent = now.toLocaleTimeString();
    }

    // Sync devices
    syncBtn.addEventListener('click', () => {
        syncBtn.disabled = true;
        syncBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Syncing...';
        
        // Simulate sync delay
        setTimeout(() => {
            updateLastSynced();
            syncBtn.disabled = false;
            syncBtn.innerHTML = '<i class="fas fa-sync"></i> Sync Devices';
            
            // Show success message
            alert('All devices have been successfully synced!');
        }, 1500);
    });

    // Open add routine modal
    addRoutineBtn.addEventListener('click', () => {
        currentRoutineId = null;
        currentActions = [];
        document.getElementById('routineName').value = '';
        document.getElementById('routineTime').value = '';
        document.querySelectorAll('input[name="day"]').forEach(checkbox => {
            checkbox.checked = false;
        });
        actionsContainer.innerHTML = '';
        routineModal.style.display = 'block';
    });

    // Close modals
    closeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            routineModal.style.display = 'none';
            actionModal.style.display = 'none';
        });
    });

    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === routineModal) {
            routineModal.style.display = 'none';
        }
        if (e.target === actionModal) {
            actionModal.style.display = 'none';
        }
    });

    // Open add action modal
    addActionBtn.addEventListener('click', () => {
        // Populate device select
        actionDeviceSelect.innerHTML = '<option value="">Select a device</option>';
        devices.forEach(device => {
            const option = document.createElement('option');
            option.value = device.id;
            option.textContent = device.name;
            actionDeviceSelect.appendChild(option);
        });
        
        actionForm.reset();
        valueInput.style.display = 'none';
        actionModal.style.display = 'block';
    });

    // Show/hide value input based on command
    actionCommandSelect.addEventListener('change', () => {
        if (actionCommandSelect.value === 'setTemperature' || actionCommandSelect.value === 'setBrightness') {
            valueInput.style.display = 'block';
        } else {
            valueInput.style.display = 'none';
        }
    });

    // Add action to routine
    actionForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const deviceId = parseInt(actionDeviceSelect.value);
        const command = actionCommandSelect.value;
        const value = command === 'setTemperature' || command === 'setBrightness' ? parseInt(actionValue.value) : null;
        
        const device = devices.find(d => d.id === deviceId);
        
        let actionText = `${device.name}: `;
        switch(command) {
            case 'turnOn':
                actionText += 'Turn On';
                break;
            case 'turnOff':
                actionText += 'Turn Off';
                break;
            case 'setTemperature':
                actionText += 'Set Temp to ${value}°F';
                break;
            case 'setBrightness':
                actionText += 'Set Brightness to ${value}%';
                break;
            case 'playMusic':
                actionText += 'Play Music';
                break;
        }
        
        // Add action to current actions
        const action = { deviceId, command, value };
        currentActions.push(action);
        
        // Add action to UI
        const actionItem = document.createElement('div');
        actionItem.className = 'action-item';
        actionItem.innerHTML = `
            <span class="action-text">${actionText}</span>
            <button class="remove-action" data-index="${currentActions.length - 1}"><i class="fas fa-times"></i></button>
        `;
        actionsContainer.appendChild(actionItem);
        
        // Add event listener to remove button
        actionItem.querySelector('.remove-action').addEventListener('click', (e) => {
            const index = parseInt(e.target.getAttribute('data-index') || e.target.parentElement.getAttribute('data-index'));
            currentActions.splice(index, 1);
            actionItem.remove();
            
            // Update data-index for remaining items
            document.querySelectorAll('.action-item .remove-action').forEach((btn, i) => {
                btn.setAttribute('data-index', i);
            });
        });
        
        // Close modal
        actionModal.style.display = 'none';
    });

    // Save routine
    routineForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const name = document.getElementById('routineName').value;
        const time = document.getElementById('routineTime').value;
        const days = Array.from(document.querySelectorAll('input[name="day"]:checked')).map(checkbox => checkbox.value);
        
        if (days.length === 0) {
            alert('Please select at least one day for the routine.');
            return;
        }
        
        if (currentActions.length === 0) {
            alert('Please add at least one action to the routine.');
            return;
        }
        
        if (currentRoutineId) {
            // Update existing routine
            const routineIndex = routines.findIndex(r => r.id === currentRoutineId);
            if (routineIndex !== -1) {
                routines[routineIndex] = {
                    id: currentRoutineId,
                    name,
                    time,
                    days,
                    actions: [...currentActions]
                };
            }
        } else {
            // Add new routine
            const newRoutine = {
                id: routines.length > 0 ? Math.max(...routines.map(r => r.id)) + 1 : 1,
                name,
                time,
                days,
                actions: [...currentActions]
            };
            routines.push(newRoutine);
        }
        
        // Update UI
        renderRoutines();
        
        // Close modal
        routineModal.style.display = 'none';
    });

    // Edit routine
    function editRoutine(routineId) {
        const routine = routines.find(r => r.id === routineId);
        if (!routine) return;
        
        currentRoutineId = routineId;
        currentActions = [...routine.actions];
        
        // Fill form
        document.getElementById('routineName').value = routine.name;
        document.getElementById('routineTime').value = routine.time;
        document.querySelectorAll('input[name="day"]').forEach(checkbox => {
            checkbox.checked = routine.days.includes(checkbox.value);
        });
        
        // Clear and repopulate actions
        actionsContainer.innerHTML = '';
        routine.actions.forEach((action, index) => {
            const device = devices.find(d => d.id === action.deviceId);
            
            let actionText = `${device.name}: `;
            switch(action.command) {
                case 'turnOn':
                    actionText += 'Turn On';
                    break;
                case 'turnOff':
                    actionText += 'Turn Off';
                    break;
                case 'setTemperature':
                    actionText += 'Set Temp to ${action.value}°F';
                    break;
                case 'setBrightness':
                    actionText += 'Set Brightness to ${action.value}%';
                    break;
                case 'playMusic':
                    actionText += 'Play Music';
                    break;
            }
            
            const actionItem = document.createElement('div');
            actionItem.className = 'action-item';
            actionItem.innerHTML = `
                <span class="action-text">${actionText}</span>
                <button class="remove-action" data-index="${index}"><i class="fas fa-times"></i></button>
            `;
            actionsContainer.appendChild(actionItem);
            
            // Add event listener to remove button
            actionItem.querySelector('.remove-action').addEventListener('click', (e) => {
                const idx = parseInt(e.target.getAttribute('data-index') || e.target.parentElement.getAttribute('data-index'));
                currentActions.splice(idx, 1);
                actionItem.remove();
                
                // Update data-index for remaining items
                document.querySelectorAll('.action-item .remove-action').forEach((btn, i) => {
                    btn.setAttribute('data-index', i);
                });
            });
        });
        
        // Open modal
        routineModal.style.display = 'block';
    }

    // Delete routine
    function deleteRoutine(routineId) {
        if (confirm('Are you sure you want to delete this routine?')) {
            routines = routines.filter(r => r.id !== routineId);
            renderRoutines();
        }
    }

    // Initialize the dashboard
    initDashboard();
});