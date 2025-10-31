document.addEventListener('DOMContentLoaded', function() {
    const doorOverlay = document.getElementById('doorOverlay');
    const goBackButton = document.getElementById('goBackButton');
    let doorIsOpen = true;
    
    // Go back button functionality
    if (goBackButton) {
        goBackButton.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            window.location.href = 'index.html';
        });
    }
    let tiltThreshold = 0.3; // Sensitivity for tilt detection
    let lastMouseX = 0;
    let touchStartX = 0;
    let touchEndX = 0;
    let isMoving = false;

    // Accelerometer/Gyroscope for mobile devices
    if (window.DeviceOrientationEvent) {
        window.addEventListener('deviceorientation', function(event) {
            // Beta = front-to-back tilt
            let tilt = event.beta;
            
            if (tilt > 0 && doorIsOpen) {
                // Tilt right (or backward in landscape) = close door
                closeDoor();
            } else if (tilt < 0 && !doorIsOpen) {
                // Tilt left (or forward in landscape) = open door
                openDoor();
            }
        });
    }

    // Mouse movement for desktop
    let trackingMouse = false;
    document.addEventListener('mousemove', function(event) {
        if (!trackingMouse) {
            lastMouseX = event.clientX;
            trackingMouse = true;
            return;
        }

        const deltaX = event.clientX - lastMouseX;
        
        if (deltaX < -20 && doorIsOpen) {
            // Mouse moved left = close door
            closeDoor();
            trackingMouse = false;
        } else if (deltaX > 20 && !doorIsOpen) {
            // Mouse moved right = open door
            openDoor();
            trackingMouse = false;
        }
        
        lastMouseX = event.clientX;
    });

    // Touch swipe for mobile
    document.addEventListener('touchstart', function(event) {
        touchStartX = event.touches[0].clientX;
        isMoving = true;
    });

    document.addEventListener('touchmove', function(event) {
        if (isMoving) {
            touchEndX = event.touches[0].clientX;
        }
    });

    document.addEventListener('touchend', function(event) {
        if (isMoving) {
            const swipeDistance = touchEndX - touchStartX;
            
            if (swipeDistance < -50 && doorIsOpen) {
                // Swipe left = close door
                closeDoor();
            } else if (swipeDistance > 50 && !doorIsOpen) {
                // Swipe right = open door
                openDoor();
            }
            
            isMoving = false;
        }
    });

    function openDoor() {
        doorOverlay.classList.remove('closing');
        doorOverlay.classList.add('opening');
        doorIsOpen = true;
    }

    function closeDoor() {
        doorOverlay.classList.remove('opening');
        doorOverlay.classList.add('closing');
        doorIsOpen = false;
    }

    // Initialize door as open
    openDoor();
});


