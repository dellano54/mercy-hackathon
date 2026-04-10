const callStatus = document.getElementById('call-status');
const actionBtn = document.getElementById('action-btn');
const contactName = document.getElementById('contact-name');

const media = new MediaHandler();
let socket = null;
let isSessionActive = false;
let callTimer = null;
let seconds = 0;

function formatTime(s) {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function updateCallStatus(status, isTimer = false) {
    if (isTimer) {
        callStatus.textContent = formatTime(seconds);
    } else {
        callStatus.textContent = status;
    }
}

function startTimer() {
    seconds = 0;
    clearInterval(callTimer);
    callTimer = setInterval(() => {
        seconds++;
        updateCallStatus('', true);
    }, 1000);
}

function stopTimer() {
    clearInterval(callTimer);
}

function startSession() {
    isSessionActive = true;
    updateCallStatus('Connecting...');
    actionBtn.style.backgroundColor = '#ff3b30'; // Red
    actionBtn.style.transform = 'rotate(135deg)';
    actionBtn.querySelector('svg').style.transform = 'rotate(45deg)'; // Rotate icon inside red button to point down

    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    socket = new WebSocket(`${protocol}//${location.host}/ws/caller`);
    socket.binaryType = 'arraybuffer';

    socket.onopen = async () => {
        console.log('Connected to Aegis');
        updateCallStatus('0:00');
        startTimer();
        await media.startMic((pcmData) => {
            if (socket && socket.readyState === WebSocket.OPEN) {
                socket.send(pcmData);
            }
        });
    };

    socket.onmessage = async (e) => {
        if (typeof e.data !== 'string') {
            // Raw PCM audio from Gemini
            media.playChunk(e.data);
            return;
        }

        const msg = JSON.parse(e.data);
        console.log('Received message:', msg);

        switch (msg.type) {
            case 'interrupted':
                console.log('AI Interrupted by user');
                media.stopPlayback();
                break;

            case 'tool_call':
                console.log(`SYSTEM: ${msg.name.toUpperCase()} initiated...`);
                break;
            
            case 'ai_response':
                console.log('AI:', msg.text);
                break;
            
            case 'user_transcript':
                console.log('User:', msg.text);
                break;
        }
    };

    socket.onclose = () => {
        if (isSessionActive) endSession();
    };

    socket.onerror = (err) => {
        console.error('Socket error:', err);
        updateCallStatus('Connection Error');
        endSession();
    };
}

function endSession() {
    if (!isSessionActive) return;
    isSessionActive = false;
    stopTimer();
    updateCallStatus('Call Ended');
    
    // UI Change to "Call" button (Green, upright)
    actionBtn.style.backgroundColor = '#34c759'; // Green
    actionBtn.style.transform = 'rotate(0deg)';
    actionBtn.querySelector('svg').style.transform = 'rotate(-135deg)'; // Tilt to look like dialer icon

    media.stopMic();
    media.stopPlayback();

    if (socket) {
        socket.close();
        socket = null;
    }
    
    setTimeout(() => {
        if (!isSessionActive) updateCallStatus('Ready');
    }, 3000);
}

actionBtn.onclick = () => {
    if (isSessionActive) {
        endSession();
    } else {
        startSession();
    }
};

// Initial State: Show as a green "Call" button
window.onload = () => {
    updateCallStatus('Aegis Emergency Dispatch');
    actionBtn.style.backgroundColor = '#34c759'; // Green
    actionBtn.style.transform = 'rotate(0deg)';
    actionBtn.querySelector('svg').style.transform = 'rotate(-135deg)'; // Tilt to look like dialer icon
};
