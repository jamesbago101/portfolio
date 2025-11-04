document.addEventListener('DOMContentLoaded', function() {
    // Preload cursor images to prevent blinking
    const cursorImg = new Image();
    cursorImg.src = 'assets/img/cursor_normal.png';
    
    const roomContainer = document.getElementById('roomContainer');
    const doorOverlay = document.getElementById('doorOverlay');
    const lampHint = document.getElementById('lampHint');
    const lampLight = document.getElementById('lampLight');
    const lampCenter = document.getElementById('lampCenter');
    const portfolioHint = document.getElementById('portfolioHint');
    const portfolioCenter = document.getElementById('portfolioCenter');
    const proposalHint = document.getElementById('proposalHint');
    const proposalCenter = document.getElementById('proposalCenter');
    
    // Hamburger menu elements
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const comicMenu = document.getElementById('comicMenu');
    const audioToggleBtn = document.getElementById('audioToggleBtn');
    const audioText = document.getElementById('audioText');
    const backgroundAudio = document.getElementById('backgroundAudio');
    const exitRoomBtn = document.getElementById('exitRoomBtn');
    
    let doorIsOpen = true;
    let lampIsOn = false;
    let menuOpen = false;
    let audioEnabled = false;
    let currentX = 0;
    let currentY = 0;
    let targetX = 0;
    let targetY = 0;
    let touchStartX = 0;
    let touchEndX = 0;
    let isMoving = false;
    let swipeStartTime = 0;
    const enableDoorSwipe = false; // disable swipe-to-close/open to prevent black screen on mobile

    // Input capability detection
    const supportsHover = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    // Approximate monitor center in background image coordinates
    // Adjust if needed based on your asset
    const monitorOrigin = { xPercent: 50, yPercent: 50 };

    // Ensure transform-origin points roughly to the monitor
    if (roomContainer) {
        roomContainer.style.transformOrigin = `${monitorOrigin.xPercent}% ${monitorOrigin.yPercent}%`;
    }

    // Jelly/Parallax effect - track mouse movement over page (like index.html)
    document.addEventListener('mousemove', function(event) {
        if (doorIsOpen) {
            const centerX = window.innerWidth / 2;
            const centerY = window.innerHeight / 2;
            const mouseX = event.clientX;
            const mouseY = event.clientY;
            targetX = (mouseX - centerX) / centerX * 15;
            targetY = (mouseY - centerY) / centerY * 15;
            requestAnimationFrame(updateTransform);
        }
        // Update cursor for hamburger menu and lamp
        updateCursor(event.clientX, event.clientY);
    });

    function updateTransform() {
        if (!doorIsOpen) return;
        currentX += (targetX - currentX) * 0.1;
        currentY += (targetY - currentY) * 0.1;
        const base = `translate(${currentX * 0.5}px, ${currentY * 0.5}px) rotateX(${currentY * 0.5}deg) rotateY(${currentX * 0.5}deg)`;
        roomContainer.style.transform = base;
        if (doorIsOpen) requestAnimationFrame(updateTransform);
    }

    // Disable tilt-based door control on touch devices to avoid accidental black screen
    // You can re-enable for desktop devices if desired by checking supportsHover
    // (We skip adding the listener entirely on mobile/coarse pointers.)
    if (window.DeviceOrientationEvent && supportsHover) {
        window.addEventListener('deviceorientation', function(event) {
            let tilt = event.beta;
            if (tilt > 0 && doorIsOpen) {
                closeDoor();
            } else if (tilt < 0 && !doorIsOpen) {
                openDoor();
            }
        });
    }

    // Touch swipe for mobile (only for door toggle, not for jelly effect)
    document.addEventListener('touchstart', function(event) {
        touchStartX = event.touches[0].clientX;
        swipeStartTime = Date.now();
        isMoving = true;
    });

    document.addEventListener('touchmove', function(event) {
        if (isMoving) {
            touchEndX = event.touches[0].clientX;
            if (doorIsOpen) {
                // Allow jelly effect on touch move when door is open
                const touch = event.touches[0];
                const centerX = window.innerWidth / 2;
                const centerY = window.innerHeight / 2;
                const touchX = touch.clientX;
                const touchY = touch.clientY;
                targetX = (touchX - centerX) / centerX * 15;
                targetY = (touchY - centerY) / centerY * 15;
                requestAnimationFrame(updateTransform);
            }
            // Update cursor on touch move (for hamburger menu and lamp)
            if (event.touches.length > 0) {
                updateCursor(event.touches[0].clientX, event.touches[0].clientY);
                // On touch devices, explicitly toggle labels when finger is near dots
                if (lampCenter) {
                    if (isWithinLampRegion(event.touches[0].clientX, event.touches[0].clientY)) {
                        lampCenter.classList.add('visible');
                    } else {
                        lampCenter.classList.remove('visible');
                    }
                }
                if (portfolioCenter) {
                    if (isWithinPortfolioRegion(event.touches[0].clientX, event.touches[0].clientY)) {
                        portfolioCenter.classList.add('visible');
                    } else {
                        portfolioCenter.classList.remove('visible');
                    }
                }
                if (proposalCenter) {
                    if (isWithinProposalRegion(event.touches[0].clientX, event.touches[0].clientY)) {
                        proposalCenter.classList.add('visible');
                    } else {
                        proposalCenter.classList.remove('visible');
                    }
                }
            }
        }
    });

    document.addEventListener('touchend', function(event) {
        if (isMoving) {
            const swipeDistance = touchEndX - touchStartX;
            const swipeTime = Date.now() - swipeStartTime;
            
            // If menu is open, don't change door state or transforms
            if (menuOpen) {
                isMoving = false;
                if (lampCenter) lampCenter.classList.remove('visible');
                if (portfolioCenter) portfolioCenter.classList.remove('visible');
                return;
            }

            if (enableDoorSwipe) {
                // Only trigger door toggle on quick, deliberate swipes
                if (swipeTime < 500) {
                    if (swipeDistance < -120 && doorIsOpen) {
                        // Swipe left = close door
                        closeDoor();
                    } else if (swipeDistance > 120 && !doorIsOpen) {
                        // Swipe right = open door
                        openDoor();
                    }
                }
            } // when disabled, do nothing (keep current state)
            
            isMoving = false;
            // Hide labels after touch ends if not over hints
            if (lampCenter) lampCenter.classList.remove('visible');
            if (portfolioCenter) portfolioCenter.classList.remove('visible');
            if (proposalCenter) proposalCenter.classList.remove('visible');
        }
    });

    function openDoor() {
        doorOverlay.classList.remove('closing');
        doorOverlay.classList.add('opening');
        doorIsOpen = true;
        roomContainer.style.transform = 'none';
        // Ensure door overlay doesn't block menu when door opens
        if (menuOpen && doorOverlay) {
            doorOverlay.style.pointerEvents = 'none';
            doorOverlay.style.zIndex = '1';
        }
    }

    function closeDoor() {
        doorOverlay.classList.remove('opening');
        doorOverlay.classList.add('closing');
        doorIsOpen = false;
        roomContainer.style.transform = 'none';
        // Ensure door overlay doesn't block menu even when closed
        if (menuOpen && doorOverlay) {
            doorOverlay.style.pointerEvents = 'none';
            doorOverlay.style.zIndex = '1';
        }
    }

    // Load lamp_light.png to detect lamp position
    let lampImageLoaded = false;
    let lampPosition = { x: 0.5, y: 0.3 }; // Default center-top
    
    // Adjustable offset for fine-tuning dot position
    // Based on your screenshot showing left: 678.656px; top: 283.304px
    // For a typical 1920x1080 screen: X = 678/1920 ≈ 0.353, Y = 283/1080 ≈ 0.262
    // Adjust these values to match your desired position
    const lampOffset = { x: -0.45, y: -0.04 }; // Moved even more left
    
    const lampImg = new Image();
    lampImg.onload = function() {
        lampImageLoaded = true;
        // Analyze lamp_light.png to find where the lamp (brightest/non-transparent area) is
        detectLampPosition(this);
    };
    lampImg.src = 'assets/img/lamp_light.png';
    
    function detectLampPosition(img) {
        // Create a canvas to analyze the image
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        try {
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            
            // Find the top-left edge of the lamp light area (bright pixels)
            let minX = canvas.width;
            let minY = canvas.height;
            let foundLamp = false;
            
            // Sample pixels to find the leftmost and topmost bright area
            for (let y = 0; y < canvas.height; y += 5) {
                for (let x = 0; x < canvas.width; x += 5) {
                    const i = (y * canvas.width + x) * 4;
                    const r = data[i];
                    const g = data[i + 1];
                    const b = data[i + 2];
                    const a = data[i + 3];
                    const brightness = (r + g + b) / 3;
                    
                    // Find bright, non-transparent pixels (lamp light)
                    if (a > 50 && brightness > 100) {
                        if (x < minX) minX = x;
                        if (y < minY) minY = y;
                        foundLamp = true;
                    }
                }
            }
            
            // Fixed position: half of center (0.5 / 2 = 0.25) on left side, top area
            // Portrait center is 0.5, half of that is 0.25 (25% from left)
            lampPosition.x = 0.25; // Half of center (25% from left)
            lampPosition.y = 0.22; // Top area (22% from top)
        } catch (e) {
            // Fallback: use same fixed position
            lampPosition.x = 0.25; // Half of center (25% from left)
            lampPosition.y = 0.22; // Top area (22% from top)
        }
        
        // Position the hint after detection/fallback
        positionLampHint();
    }
    
    // Lamp detection and interaction
    function isWithinLampRegion(clientX, clientY) {
        // Prefer checking against the actual dot element so it's accurate
        if (lampHint) {
            const dotRect = lampHint.getBoundingClientRect();
            const dotCenterX = dotRect.left + dotRect.width / 2;
            const dotCenterY = dotRect.top + dotRect.height / 2;
            // radius ~= half of visible dot container (40px) so 20px, slightly forgiving
            const radius = Math.max(dotRect.width, dotRect.height) * 0.55;
            const dx = clientX - dotCenterX;
            const dy = clientY - dotCenterY;
            return (dx * dx + dy * dy) <= (radius * radius);
        }
        // Fallback to image-relative region if dot isn't available yet
        const rect = roomContainer.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return false;
        const isMobile = window.innerWidth <= 768;
        const lampCenterXR = lampPosition.x;
        const lampCenterYR = lampPosition.y;
        const lampRadiusR = isMobile ? 0.05 : 0.04;
        const centerX = rect.left + rect.width * lampCenterXR;
        const centerY = rect.top + rect.height * lampCenterYR;
        const radius = rect.width * lampRadiusR;
        const dx = clientX - centerX;
        const dy = clientY - centerY;
        return (dx * dx + dy * dy) <= (radius * radius);
    }

    // Portfolio (monitor center) detection
    function isWithinPortfolioRegion(clientX, clientY) {
        if (portfolioHint) {
            const rect = portfolioHint.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            const radius = Math.max(rect.width, rect.height) * 0.55;
            const dx = clientX - cx;
            const dy = clientY - cy;
            return (dx * dx + dy * dy) <= (radius * radius);
        }
        return false;
    }

    function isWithinProposalRegion(clientX, clientY) {
        if (proposalHint) {
            const rect = proposalHint.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            const radius = Math.max(rect.width, rect.height) * 0.55;
            const dx = clientX - cx;
            const dy = clientY - cy;
            return (dx * dx + dy * dy) <= (radius * radius);
        }
        return false;
    }
    
    function positionLampHint() {
        if (!lampHint) return;
        const rect = roomContainer.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) {
            // Retry if container not ready
            setTimeout(positionLampHint, 100);
            return;
        }
        
        // Use detected lamp position from lamp_light.png with offset
        // Ensure position stays within bounds (0 to 1)
        let finalX = lampPosition.x;
        let finalY = lampPosition.y;
        
        // Ensure position is valid (no clamping needed for fixed position)
        // finalX and finalY are already set from lampPosition
        
        const centerX = rect.left + rect.width * finalX;
        const centerY = rect.top + rect.height * finalY;
        
        const left = centerX - rect.left;
        const top = centerY - rect.top;
        
        lampHint.style.left = left + 'px';
        lampHint.style.top = top + 'px';
        
        // Debug: Uncomment to see where the dot is positioned
        // console.log('Lamp hint positioned at:', left.toFixed(2), top.toFixed(2), 'Position:', finalX.toFixed(3), finalY.toFixed(3));
    }
    
    // Cursor update function (like index.html) - checks hamburger menu and lamp
    function updateCursor(clientX, clientY) {
        const clickedCursor = "url('assets/img/cursor_pointer.png') 16 16, auto";
        const defaultCursor = "url('assets/img/cursor_normal.png') 16 16, auto";
        
        // Check hamburger menu first (highest priority)
        let isOverHamburger = false;
        if (hamburgerBtn) {
            const hamburgerRect = hamburgerBtn.getBoundingClientRect();
            isOverHamburger = clientX >= hamburgerRect.left && 
                              clientX <= hamburgerRect.right && 
                              clientY >= hamburgerRect.top && 
                              clientY <= hamburgerRect.bottom;
        }
        
        if (isOverHamburger) {
            document.body.style.cursor = clickedCursor;
            document.body.classList.add('pointer-cursor');
            // Hide lamp text
            if (lampCenter) lampCenter.classList.remove('visible');
            return;
        }
        
        if (!doorIsOpen) {
            document.body.style.cursor = defaultCursor;
            document.body.classList.remove('pointer-cursor');
            if (lampCenter) lampCenter.classList.remove('visible');
            return;
        }
        
        // Check portfolio (monitor center) first
        const overPortfolio = isWithinPortfolioRegion(clientX, clientY);
        if (overPortfolio) {
            document.body.style.cursor = clickedCursor;
            document.body.classList.add('pointer-cursor');
            if (supportsHover && portfolioCenter) portfolioCenter.classList.add('visible');
            if (lampCenter) lampCenter.classList.remove('visible');
            if (proposalCenter) proposalCenter.classList.remove('visible');
            positionPortfolioHint();
            return;
        }

        // Then check proposal (envelope) dot
        const overProposal = isWithinProposalRegion(clientX, clientY);
        if (overProposal) {
            document.body.style.cursor = clickedCursor;
            document.body.classList.add('pointer-cursor');
            if (supportsHover && proposalCenter) proposalCenter.classList.add('visible');
            if (lampCenter) lampCenter.classList.remove('visible');
            if (portfolioCenter) portfolioCenter.classList.remove('visible');
            return;
        }

        // Check lamp area
        const isOverLamp = isWithinLampRegion(clientX, clientY);
        
        if (isOverLamp) {
            document.body.style.cursor = clickedCursor;
            document.body.classList.add('pointer-cursor');
            // Only auto-show label when hover is supported; on touch it appears when finger is near via touchmove
            if (supportsHover && lampCenter) lampCenter.classList.add('visible');
        } else {
            document.body.style.cursor = defaultCursor;
            document.body.classList.remove('pointer-cursor');
            if (lampCenter) lampCenter.classList.remove('visible');
            if (portfolioCenter) portfolioCenter.classList.remove('visible');
            if (proposalCenter) proposalCenter.classList.remove('visible');
        }
        
        // Make sure hint is positioned
        positionLampHint();
        positionPortfolioHint();
    }
    
    // Keep old function name for backward compatibility
    function updateLampCursor(clientX, clientY) {
        updateCursor(clientX, clientY);
    }
    
    // Touch move detection for lamp (already handled in existing touchmove, but update cursor)
    
    // Lamp click handler - make the dot itself clickable
    if (lampHint) {
        lampHint.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            if (doorIsOpen) {
                toggleLamp();
            }
        });
        
        lampHint.addEventListener('touchstart', function(e) {
            e.preventDefault();
            e.stopPropagation();
            if (doorIsOpen) {
                toggleLamp();
            }
        });
    }
    
    // Proposal click handler - dot redirects to proposal.html
    if (proposalHint) {
        proposalHint.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            window.location.href = 'proposal.html';
        });
        proposalHint.addEventListener('touchstart', function(e) {
            e.preventDefault();
            e.stopPropagation();
            window.location.href = 'proposal.html';
        });
    }
    
    // Center-region zoom removed per request

    // Portfolio hint positioning (monitor center)
    function positionPortfolioHint() {
        if (!portfolioHint) return;
        const rect = roomContainer.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) {
            setTimeout(positionPortfolioHint, 100);
            return;
        }
        // Always center of the container
        const centerX = rect.left + rect.width * 0.5;
        const centerY = rect.top + rect.height * 0.5;
        portfolioHint.style.left = (centerX - rect.left) + 'px';
        portfolioHint.style.top = (centerY - rect.top) + 'px';
    }

    // Zoom behavior removed

    // Also allow clicking in the lamp region (backup)
    roomContainer.addEventListener('click', function(e) {
        if (!doorIsOpen) return;
        if (isWithinLampRegion(e.clientX, e.clientY)) {
            toggleLamp();
            return;
        }
        if (isWithinPortfolioRegion(e.clientX, e.clientY)) {
            window.location.href = 'portfolio.html';
            return;
        }
        if (isWithinProposalRegion(e.clientX, e.clientY)) {
            window.location.href = 'proposal.html';
            return;
        }
        // Center click zoom removed
    });
    
    // Lamp touch handler (backup)
    roomContainer.addEventListener('touchstart', function(e) {
        if (!doorIsOpen) return;
        if (e.touches.length > 0) {
            const touch = e.touches[0];
            if (isWithinLampRegion(touch.clientX, touch.clientY)) {
                e.preventDefault();
                toggleLamp();
                return;
            }
            if (isWithinPortfolioRegion(touch.clientX, touch.clientY)) {
                e.preventDefault();
                window.location.href = 'portfolio.html';
                return;
            }
            if (isWithinProposalRegion(touch.clientX, touch.clientY)) {
                e.preventDefault();
                window.location.href = 'proposal.html';
                return;
            }
            // Center touch zoom removed
        }
    });
    
    function toggleLamp() {
        lampIsOn = !lampIsOn;
        if (lampLight) {
            if (lampIsOn) {
                lampLight.classList.add('active');
            } else {
                lampLight.classList.remove('active');
            }
        }
        
        // Flash cursor feedback
        const clickedCursor = "url('assets/img/cursor_pointer.png') 16 16, auto";
        const normalCursor = "url('assets/img/cursor_normal.png') 16 16, auto";
        document.body.style.cursor = clickedCursor;
        setTimeout(function() {
            document.body.style.cursor = normalCursor;
        }, 120);
    }
    
    // Position lamp hint on load and resize
    function initializeLampHint() {
        positionLampHint();
        // Make sure hint is positioned and ready
        if (lampHint && doorIsOpen) {
            lampHint.hidden = false;
        }
    }
    
    initializeLampHint();
    window.addEventListener('resize', function() {
        positionLampHint();
        positionPortfolioHint();
    });

    // Initialize door as open
    openDoor();
    
    // Re-position hints after door opens (no auto-show on touch devices)
    setTimeout(function() {
        positionLampHint();
        positionPortfolioHint();
    }, 300);
    
    // Also update on first mouse move to ensure hint appears
    let firstMouseMove = true;
    document.addEventListener('mousemove', function(e) {
        if (firstMouseMove) {
            firstMouseMove = false;
            updateLampCursor(e.clientX, e.clientY);
        }
    }, { once: true });
    
    // Hamburger Menu Functionality
    if (hamburgerBtn && comicMenu) {
        hamburgerBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            toggleMenu();
        });
        
        // Update cursor when hovering over hamburger menu
        hamburgerBtn.addEventListener('mouseenter', function() {
            document.body.style.cursor = "url('assets/img/cursor_pointer.png') 16 16, auto";
        });
        
        // Cursor updates are handled in the global mousemove event via updateCursor()
    }
    
    function toggleMenu() {
        menuOpen = !menuOpen;
        if (hamburgerBtn) {
            hamburgerBtn.classList.toggle('active', menuOpen);
        }
        if (comicMenu) {
            comicMenu.classList.toggle('open', menuOpen);
        }
        
        // Force the door visual state to OPEN while interacting with the menu
        // to prevent accidental full-black overlay on mobile
        if (doorOverlay) {
            doorIsOpen = true;
            doorOverlay.style.pointerEvents = 'none';
            doorOverlay.style.zIndex = '1';
            doorOverlay.classList.remove('closing');
            doorOverlay.classList.add('opening');
            doorOverlay.style.opacity = '0';
        }
    }
    
    // Audio Toggle Functionality
    if (audioToggleBtn && backgroundAudio && audioText) {
        audioToggleBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            toggleAudio();
        });
    }

    // Exit Room button
    if (exitRoomBtn) {
        exitRoomBtn.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = 'index.html';
        });
    }
    
    function toggleAudio() {
        audioEnabled = !audioEnabled;
        
        if (audioEnabled) {
            // User wants to enable audio
            backgroundAudio.play().then(function() {
                if (audioToggleBtn) audioToggleBtn.classList.add('active');
                if (audioText) audioText.textContent = 'Disable Audio';
                // Flash cursor feedback
                const clickedCursor = "url('assets/img/cursor_pointer.png') 16 16, auto";
                document.body.style.cursor = clickedCursor;
                setTimeout(function() {
                    document.body.style.cursor = "url('assets/img/cursor_normal.png') 16 16, auto";
                }, 120);
            }).catch(function(error) {
                // Audio play failed (likely user interaction required)
                console.log('Audio play failed:', error);
                audioEnabled = false;
                // Show message or handle error
                alert('Please click Enable Audio to allow background music playback.');
            });
        } else {
            // User wants to disable audio
            backgroundAudio.pause();
            backgroundAudio.currentTime = 0;
            if (audioToggleBtn) audioToggleBtn.classList.remove('active');
            if (audioText) audioText.textContent = 'Enable Audio';
            // Flash cursor feedback
            const clickedCursor = "url('assets/img/cursor_pointer.png') 16 16, auto";
            document.body.style.cursor = clickedCursor;
            setTimeout(function() {
                document.body.style.cursor = "url('assets/img/cursor_normal.png') 16 16, auto";
            }, 120);
        }
    }
    
    // Close menu when clicking outside
    document.addEventListener('click', function(e) {
        if (menuOpen && comicMenu && hamburgerBtn) {
            // Don't close if clicking inside menu or hamburger button
            if (!comicMenu.contains(e.target) && !hamburgerBtn.contains(e.target)) {
                toggleMenu();
            }
        }
    });
    
    // Prevent door overlay from interfering with menu on mobile
    if (doorOverlay) {
        doorOverlay.addEventListener('click', function(e) {
            // If menu is open, don't let door overlay block clicks
            if (menuOpen) {
                e.stopPropagation();
            }
        });
    }
});


