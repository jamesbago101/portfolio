document.addEventListener('DOMContentLoaded', function() {
    const doorContainer = document.getElementById('doorContainer');
    const knob1 = document.getElementById('doorknob1');
    const knob2 = document.getElementById('doorknob2');
    const knobOpened = document.getElementById('doorknobOpened');
    const openDoorHint = document.getElementById('openDoorHint');
    const openDoorCenter = document.getElementById('openDoorCenter');
    const doorknobHintOverlay = document.getElementById('doorknobHint');
    const whiteScreenTransition = document.getElementById('whiteScreenTransition');
    const progressBarFill = document.getElementById('progressBarFill');
    const loadingPercentage = document.getElementById('loadingPercentage');
    let isOpened = false;
	let lastClientX = 0;
	let lastClientY = 0;
    
    // Horizontal pan for mobile to view more of the scene
    let isPanningHorizontally = false;
    let panStartX = 0;
    let panBaseX = 0;
    let panOffsetX = 0; // pixels
    // Calculate pan range based on viewport - allow viewing full image width
    let maxPanPixels = Math.max(400, window.innerWidth * 0.75); // at least 400px, or 75% of screen width

    // Preload door images to prevent loading delay
    const closedDoorImg = new Image();
    const openedDoorImg = new Image();
    closedDoorImg.src = 'assets/img/closed_door.png';
    openedDoorImg.src = 'assets/img/opened_door.png';

    // Cursor movement/jelly effect removed - no more parallax on mouse move
    // Mouse move detection for cursor updates only
    document.addEventListener('mousemove', function(e) {
        updateCursor(e.clientX, e.clientY);
    });

    // Remove global cursor state; handled via CSS :active on knobs

    // Ensure knobs are focusable/clickable
    [knob1, knob2].forEach(function(el){
        el.setAttribute('tabindex','0');
    });

    // Derived clickable region relative to the canvas (percent of viewport)
    function isWithinKnobRegion(clientX, clientY) {
        const rect = doorContainer.getBoundingClientRect();
        // Only allow clicks if container has proper dimensions
        if (rect.width === 0 || rect.height === 0) return false;
        
        // Check center area (where dot is positioned)
        const centerX = rect.left + rect.width * 0.5;
        const centerY = rect.top + rect.height * 0.5;
        const radius = Math.min(rect.width, rect.height) * 0.1; // 10% of smaller dimension
        
        const dx = clientX - centerX;
        const dy = clientY - centerY;
        return (dx * dx + dy * dy) <= (radius * radius);
    }

    function flashClickedCursor(target) {
        const prevEl = target.style.cursor;
        const prevBody = document.body.style.cursor;
        const clicked = "url('assets/img/cursor_pointer.png') 16 16, auto";
        const normal = "url('assets/img/cursor_normal.png') 16 16, auto";
        target.style.cursor = clicked;
        document.body.style.cursor = clicked;
        setTimeout(function(){
            target.style.cursor = prevEl || normal;
            document.body.style.cursor = prevBody || normal;
        }, 120);
    }

    knob1.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        if (!isWithinKnobRegion(e.clientX, e.clientY)) return;
        if (isOpened) return;
        if (openDoorHint) {
            openDoorHint.classList.remove('visible');
            openDoorHint.hidden = true;
        }
        if (openDoorCenter) openDoorCenter.classList.remove('visible');
        // Immediately hide doorknob hint overlay to prevent pop-up on opened door
        if (doorknobHintOverlay) {
            doorknobHintOverlay.classList.remove('visible');
            doorknobHintOverlay.style.opacity = '0'; // Force instant removal
        }
        flashClickedCursor(knob1);
        // Trigger white screen transition then redirect
        triggerWhiteScreenTransition();
    });

    knob2.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        // knob2 removed - no longer needed
    });

    // Mobile touch support
    knob1.addEventListener('touchstart', function(e) {
        e.preventDefault();
        const touch = e.touches[0];
        if (!isWithinKnobRegion(touch.clientX, touch.clientY)) return;
        if (isOpened) return;
        if (openDoorHint) {
            openDoorHint.classList.remove('visible');
            openDoorHint.hidden = true;
        }
        if (openDoorCenter) openDoorCenter.classList.remove('visible');
        // Immediately hide doorknob hint overlay to prevent pop-up on opened door
        if (doorknobHintOverlay) {
            doorknobHintOverlay.classList.remove('visible');
            doorknobHintOverlay.style.opacity = '0'; // Force instant removal
        }
        flashClickedCursor(knob1);
        // Trigger white screen transition then redirect
        triggerWhiteScreenTransition();
    });

    knob2.addEventListener('touchstart', function(e) {
        e.preventDefault();
        // knob2 removed - no longer needed
    });

	// Hover detection for cursor change
	function updateCursor(clientX, clientY) {
		const clickedCursor = "url('assets/img/cursor_pointer.png') 16 16, auto";
		const defaultCursor = "url('assets/img/cursor_normal.png') 16 16, auto";

        if (isOpened) {
            document.body.classList.remove('pointer-cursor');
            document.body.style.cursor = defaultCursor;
            if (openDoorHint) openDoorHint.classList.remove('visible');
            if (openDoorCenter) openDoorCenter.classList.remove('visible');
            if (doorknobHintOverlay) doorknobHintOverlay.classList.remove('visible');
            return;
        }

		// Use knob-region OR hint-dot proximity as the trigger
		const isOverKnob = isWithinKnobRegion(clientX, clientY);
		let isOverHint = false;
		if (openDoorHint && !openDoorHint.hidden) {
			const hintRect = openDoorHint.getBoundingClientRect();
			const hintCenterX = hintRect.left + hintRect.width / 2;
			const hintCenterY = hintRect.top + hintRect.height / 2;
			const dx = clientX - hintCenterX;
			const dy = clientY - hintCenterY;
			const radiusPx = Math.max(hintRect.width, hintRect.height) / 2 + 4; // tolerance
			isOverHint = (dx * dx + dy * dy) <= (radiusPx * radiusPx);
		}

        if (isOverKnob || isOverHint) {
            document.body.classList.add('pointer-cursor');
            document.body.style.cursor = clickedCursor;
			if (openDoorHint && !openDoorHint.hidden) openDoorHint.classList.add('visible');
			if (openDoorCenter) openDoorCenter.classList.add('visible');
			if (doorknobHintOverlay) doorknobHintOverlay.classList.add('visible');
		} else {
            document.body.classList.remove('pointer-cursor');
            document.body.style.cursor = defaultCursor;
			if (openDoorHint) openDoorHint.classList.remove('visible');
			if (openDoorCenter) openDoorCenter.classList.remove('visible');
			if (doorknobHintOverlay) doorknobHintOverlay.classList.remove('visible');
		}
	}

    // Touch handlers for horizontal panning
    document.addEventListener('touchstart', function(event) {
        lastClientX = event.touches[0].clientX;
        lastClientY = event.touches[0].clientY;
        // Begin horizontal pan gesture (mobile)
        isPanningHorizontally = true;
        panStartX = event.touches[0].clientX;
        panBaseX = panOffsetX;
    });

    document.addEventListener('touchmove', function(e) {
        if (e.touches.length > 0) {
            lastClientX = e.touches[0].clientX;
            lastClientY = e.touches[0].clientY;
            updateCursor(lastClientX, lastClientY);
            
            // Horizontal panning (disabled when door is opened)
            if (!isOpened && isPanningHorizontally) {
                const dx = e.touches[0].clientX - panStartX;
                panOffsetX = Math.max(-maxPanPixels, Math.min(maxPanPixels, panBaseX + dx));
                // Apply as CSS var so all layered backgrounds shift together
                doorContainer.style.setProperty('--panX', panOffsetX + 'px');
                // Reposition dot so it moves with the background
                positionOpenDoorHint();
                // Prevent default to allow smooth panning without scrolling
                e.preventDefault();
            }
        }
    });

    document.addEventListener('touchend', function(event) {
        isPanningHorizontally = false;
    });

    // Position the hint at the center of the screen
    function positionOpenDoorHint() {
        if (!openDoorHint) return;
        const rect = doorContainer.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;

        // Position at center (50%, 50%)
        const centerX = rect.left + rect.width * 0.5;
        const centerY = rect.top + rect.height * 0.5;
        
        // Convert to container-relative coordinates and add pan offset
        const left = (centerX - rect.left) + panOffsetX;
        const top = centerY - rect.top;

		openDoorHint.style.left = left + 'px';
		openDoorHint.style.top = top + 'px';
    }

    // White screen transition then redirect
    function triggerWhiteScreenTransition() {
        if (!whiteScreenTransition) return;
        
        // First, show the opened door
        doorContainer.classList.add('opened');
        
        // Wait for opened door to be visible, then transition to white
        setTimeout(function() {
            whiteScreenTransition.classList.add('active');
            
            // Preload all room.html images before redirecting
            preloadRoomImages(function() {
                // All images loaded, redirect to room.html
                window.location.href = 'room.html';
            });
        }, 600); // Delay to show opened door first (600ms)
    }

    // Preload all images needed for room.html
    function preloadRoomImages(callback) {
        const imagesToLoad = [
            'assets/img/room_bg.png',
            'assets/img/lamp_light.png',
            'assets/img/cat.png',
            'assets/img/pc.png',
            'assets/img/coffee.png',
            'assets/img/cursor_normal.png',
            'assets/img/cursor_pointer.png'
        ];
        
        let loadedCount = 0;
        let displayedPercent = 0;
        const totalImages = imagesToLoad.length;
        
        // Update progress function with smooth animation
        function updateProgress() {
            const actualPercent = Math.round((loadedCount / totalImages) * 100);
            
            // Smooth animation to actual percent
            const animateProgress = function() {
                if (displayedPercent < actualPercent) {
                    displayedPercent += 2; // Increase by 2% each frame for smoother animation
                    if (displayedPercent > actualPercent) {
                        displayedPercent = actualPercent;
                    }
                    
                    if (progressBarFill) {
                        progressBarFill.style.width = displayedPercent + '%';
                    }
                    if (loadingPercentage) {
                        loadingPercentage.textContent = displayedPercent + '%';
                    }
                    
                    if (displayedPercent < actualPercent) {
                        setTimeout(animateProgress, 100); // Slower delay for more gradual animation
                    }
                }
            };
            
            animateProgress();
        }
        
        if (totalImages === 0) {
            displayedPercent = 100;
            updateProgress();
            callback();
            return;
        }
        
        // Initialize progress at 0%
        updateProgress();
        
        imagesToLoad.forEach(function(src) {
            const img = new Image();
            img.onload = function() {
                loadedCount++;
                updateProgress();
                if (loadedCount === totalImages) {
                    // Wait for animation to catch up to 100%
                    setTimeout(function() {
                        displayedPercent = 100;
                        if (progressBarFill) progressBarFill.style.width = '100%';
                        if (loadingPercentage) loadingPercentage.textContent = '100%';
                        setTimeout(callback, 400); // Small delay to show 100%
                    }, 500);
                }
            };
            img.onerror = function() {
                // Even if image fails, count it and continue
                loadedCount++;
                updateProgress();
                if (loadedCount === totalImages) {
                    setTimeout(function() {
                        displayedPercent = 100;
                        if (progressBarFill) progressBarFill.style.width = '100%';
                        if (loadingPercentage) loadingPercentage.textContent = '100%';
                        setTimeout(callback, 400); // Small delay to show 100%
                    }, 500);
                }
            };
            img.src = src;
        });
    }

    // Initial position and on resize
    positionOpenDoorHint();
    window.addEventListener('resize', function() {
        positionOpenDoorHint();
        // Recalculate max pan on resize - expanded to 75% of viewport width
        maxPanPixels = Math.max(400, window.innerWidth * 0.75);
    });

    // Prevent clicks outside knob area from doing anything
    doorContainer.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        // Only allow clicks within knob region (center)
        if (!isWithinKnobRegion(e.clientX, e.clientY)) {
            return;
        }
    });
});

