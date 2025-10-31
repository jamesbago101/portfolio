document.addEventListener('DOMContentLoaded', function() {
    const doorContainer = document.getElementById('doorContainer');
    const knob1 = document.getElementById('doorknob1');
    const knob2 = document.getElementById('doorknob2');
    const knobOpened = document.getElementById('doorknobOpened');
    const entryBubble = document.getElementById('entryBubble');
    const bubbleBackdrop = document.getElementById('bubbleBackdrop');
    const bubbleYes = document.getElementById('bubbleYes');
    const bubbleNo = document.getElementById('bubbleNo');
    const openDoorHint = document.getElementById('openDoorHint');
    const openDoorCenter = document.getElementById('openDoorCenter');
    const doorknobHintOverlay = document.getElementById('doorknobHint');
    let isOpened = false;
    let currentX = 0;
    let currentY = 0;
    let targetX = 0;
    let targetY = 0;
	let lastClientX = 0;
	let lastClientY = 0;

    // Preload door images to prevent loading delay
    const closedDoorImg = new Image();
    const openedDoorImg = new Image();
    closedDoorImg.src = 'assets/img/closed_door.png';
    openedDoorImg.src = 'assets/img/opened_door.png';

    // Jelly/Parallax effect - track mouse movement over page
	document.addEventListener('mousemove', function(event) {
		lastClientX = event.clientX;
		lastClientY = event.clientY;
        if (!isOpened) {
            const centerX = window.innerWidth / 2;
            const centerY = window.innerHeight / 2;
            const mouseX = event.clientX;
            const mouseY = event.clientY;
            targetX = (mouseX - centerX) / centerX * 15;
            targetY = (mouseY - centerY) / centerY * 15;
            requestAnimationFrame(updateTransform);
        }
    });

    function updateTransform() {
        if (isOpened) return;
        currentX += (targetX - currentX) * 0.1;
        currentY += (targetY - currentY) * 0.1;
        doorContainer.style.transform = `translate(${currentX * 0.5}px, ${currentY * 0.5}px) rotateX(${currentY * 0.5}deg) rotateY(${currentX * 0.5}deg)`;
        if (!isOpened) requestAnimationFrame(updateTransform);
    }

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
        
        // Mobile-friendly adjustments
        const isMobile = window.innerWidth <= 768;
        const knobCenterXR = isMobile ? 0.60 : 0.58; // moved more toward center
        const knobCenterYR = isMobile ? 0.56 : 0.54; // moved more toward center
        const knobRadiusR = isMobile ? 0.08 : 0.06;  // Larger click area on mobile

        const centerX = rect.left + rect.width * knobCenterXR;
        const centerY = rect.top + rect.height * knobCenterYR;
        const radius = rect.width * knobRadiusR;
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
        flashClickedCursor(knob1);
        openDoor();
        knob1.hidden = true;
        knob2.hidden = false;
    });

    knob2.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        if (!isWithinKnobRegion(e.clientX, e.clientY)) return;
        if (!isOpened) return;
        flashClickedCursor(knob2);
        closeDoor();
        knob2.hidden = true;
        knob1.hidden = false;
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
        flashClickedCursor(knob1);
        openDoor();
        knob1.hidden = true;
        knob2.hidden = false;
    });

    knob2.addEventListener('touchstart', function(e) {
        e.preventDefault();
        const touch = e.touches[0];
        if (!isWithinKnobRegion(touch.clientX, touch.clientY)) return;
        if (!isOpened) return;
        flashClickedCursor(knob2);
        closeDoor();
        knob2.hidden = true;
        knob1.hidden = false;
    });

	// Hover detection for cursor change
	function updateCursor(clientX, clientY) {
		const clickedCursor = "url('assets/img/cursor_pointer.png') 16 16, auto";
		const defaultCursor = "url('assets/img/cursor_normal.png') 16 16, auto";

        // If door is opened and bubble is visible, only allow pointer cursor on Yes/No buttons
        if (isOpened && entryBubble && !entryBubble.hidden) {
            const yesRect = bubbleYes.getBoundingClientRect();
            const noRect = bubbleNo.getBoundingClientRect();
            const isOverYes = clientX >= yesRect.left && clientX <= yesRect.right &&
                              clientY >= yesRect.top && clientY <= yesRect.bottom;
            const isOverNo = clientX >= noRect.left && clientX <= noRect.right &&
                             clientY >= noRect.top && clientY <= noRect.bottom;
            
            if (isOverYes || isOverNo) {
                document.body.classList.add('pointer-cursor');
                document.body.style.cursor = clickedCursor;
            } else {
                document.body.classList.remove('pointer-cursor');
                document.body.style.cursor = defaultCursor;
            }
            
            if (openDoorHint) openDoorHint.classList.remove('visible');
            if (openDoorCenter) openDoorCenter.classList.remove('visible');
            if (doorknobHintOverlay) doorknobHintOverlay.classList.remove('visible');
            return;
        }

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

    // Mouse move detection
    document.addEventListener('mousemove', function(e) {
        updateCursor(e.clientX, e.clientY);
    });

    // Touch move detection for mobile
	document.addEventListener('touchmove', function(e) {
        if (e.touches.length > 0) {
			lastClientX = e.touches[0].clientX;
			lastClientY = e.touches[0].clientY;
			updateCursor(lastClientX, lastClientY);
        }
    });

    // Position the hint at the knob center
    function positionOpenDoorHint() {
        if (!openDoorHint) return;
        const rect = doorContainer.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;

        const isMobile = window.innerWidth <= 768;
        const knobCenterXR = isMobile ? 0.60 : 0.58; // match hit-test center
        const knobCenterYR = isMobile ? 0.56 : 0.54; // match hit-test center

		const centerX = rect.left + rect.width * knobCenterXR;
		const centerY = rect.top + rect.height * knobCenterYR;

        // Convert viewport coords to container-relative
        const left = centerX - rect.left;
        const top = centerY - rect.top;

		openDoorHint.style.left = left + 'px';
		openDoorHint.style.top = top + 'px';

        // Size the hint overlay (and doorknob hint) to the clickable radius
        const knobRadiusR = isMobile ? 0.08 : 0.06;
        const radiusPx = rect.width * knobRadiusR;
        const sizePx = Math.round(radiusPx * 2);
        doorContainer.style.setProperty('--knob-left', left + 'px');
        doorContainer.style.setProperty('--knob-top', top + 'px');
        doorContainer.style.setProperty('--knob-size', sizePx + 'px');
    }

    // Initial position and on resize
    positionOpenDoorHint();
    window.addEventListener('resize', positionOpenDoorHint);

    // Prevent clicks outside knob area from doing anything
    doorContainer.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        // Only allow clicks within knob region
        if (!isWithinKnobRegion(e.clientX, e.clientY)) {
            return;
        }
    });

    // Prevent clicks on backdrop (blocks outside clicks)
    if (bubbleBackdrop) {
        bubbleBackdrop.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            // Do nothing - blocks clicks outside bubble
        });
    }

    // Bubble button events
    bubbleYes.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        window.location.href = 'room.html';
    });

    bubbleNo.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        closeDoor();
    });

    function openDoor() {
        doorContainer.classList.add('opened');
        isOpened = true;
        doorContainer.style.transform = 'none';
        entryBubble.hidden = false;
        // Show backdrop to block outside interactions
        if (bubbleBackdrop) bubbleBackdrop.hidden = false;
        if (openDoorHint) {
            openDoorHint.classList.remove('visible');
            openDoorHint.hidden = true;
        }
		doorContainer.classList.remove('knob-glow');
        document.body.classList.remove('pointer-cursor');
        if (openDoorCenter) openDoorCenter.classList.remove('visible');
        if (doorknobHintOverlay) doorknobHintOverlay.classList.remove('visible');
        // Hide regular knobs and show opened doorknob
        knob1.hidden = true;
        knob2.hidden = true;
        if (knobOpened) knobOpened.hidden = false;
        flashClickedCursor(knob2);
    }

    function closeDoor() {
        doorContainer.classList.remove('opened');
        isOpened = false;
        entryBubble.hidden = true;
        // Hide backdrop to allow interactions again
        if (bubbleBackdrop) bubbleBackdrop.hidden = true;
        // Reset knob visibility - hide opened doorknob, show knob1, hide knob2
        if (knobOpened) knobOpened.hidden = true;
        knob1.hidden = false;
        knob2.hidden = true;
        if (openDoorHint) openDoorHint.hidden = false;
        if (openDoorCenter) openDoorCenter.classList.remove('visible');
        // Immediately recompute cursor state at current pointer position
        positionOpenDoorHint();
        requestAnimationFrame(function(){
            updateCursor(lastClientX, lastClientY);
        });
    }
});

