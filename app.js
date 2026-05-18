// SPA Navigation - No page reloads, header stays static
(function() {
    // Configuration
    const contentBasePath = 'content/';
    const defaultPage = 'home';
    
    // Track current page
    let currentPage = defaultPage;
    
    // Get elements
    const headerPlaceholder = document.getElementById('header-placeholder');
    const pageContent = document.getElementById('page-content');
    
    // Load header once
    function loadHeader() {
        return fetch('header.html')
            .then(response => response.text())
            .then(html => {
                headerPlaceholder.innerHTML = html;
                attachNavListeners();
                highlightActiveNav(defaultPage);
            })
            .catch(err => console.error('Error loading header:', err));
    }
    
    // Attach click listeners to nav buttons
    function attachNavListeners() {
        document.querySelectorAll('.nav-tab').forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const page = button.getAttribute('data-page');
                if (page && page !== currentPage) {
                    navigateTo(page);
                }
            });
        });
    }
    
    // Highlight active nav button
    function highlightActiveNav(page) {
        document.querySelectorAll('.nav-tab').forEach(button => {
            if (button.getAttribute('data-page') === page) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });
    }
    
    // Load page content
    function loadContent(page) {
        // Show loading state
        pageContent.innerHTML = '<div class="page-loading" style="text-align:center; padding:60px;"><i class="fas fa-spinner" style="font-size:2rem; animation:spin 1s linear infinite;"></i><p>Loading...</p></div>';
        
        return fetch(contentBasePath + page + '.html')
            .then(response => {
                if (!response.ok) throw new Error('Page not found');
                return response.text();
            })
            .then(html => {
                pageContent.innerHTML = html;
                executePageScripts(page);
            })
            .catch(err => {
                console.error('Error loading page:', err);
                pageContent.innerHTML = '<div style="text-align:center; padding:60px;"><h2>Page not found</h2><p>Sorry, that page doesn\'t exist.</p></div>';
            });
    }
    
    // Execute page-specific scripts (video player, modal, etc.)
    function executePageScripts(page) {
        // Update current page
        currentPage = page;
        
        // Update URL without reload
        window.history.pushState({ page: page }, '', '#' + page);
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // Execute page-specific initialization
        if (page === 'home') {
            initVideoPlayer();
        } else if (page === 'products') {
            initProductHotspots();
        } else if (page === 'testimonials') {
            // Any testimonials-specific JS
        } else if (page === 'demo') {
            // Any demo-specific JS
        } else if (page === 'contact') {
            initContactForm();
        }
    }
    
    // Home page video player
    function initVideoPlayer() {
        const v = document.getElementById('mspVideo');
        if (!v) return;
        
        const container = document.getElementById('videoPlayerContainer');
        const loading = document.getElementById('videoLoading');
        const playOverlay = document.getElementById('playButtonOverlay');
        const playBtn = document.getElementById('bigPlayBtn');
        const playPause = document.getElementById('playPauseBtn');
        const mute = document.getElementById('muteBtn');
        const full = document.getElementById('fullscreenBtn');
        const progress = document.getElementById('progressContainer');
        const progressBar = document.getElementById('progressBar');
        const bufferedBar = document.getElementById('bufferedBar');
        const timeDisp = document.getElementById('timeDisplay');
        const volSlider = document.getElementById('volumeSlider');
        const volLevel = document.getElementById('volumeLevel');
        
        let isDragging = false, isFull = false, hideTimer;
        
        v.volume = 0.7;
        if (volLevel) volLevel.style.width = '70%';
        
        function formatTime(s) {
            let m = Math.floor(s/60), sc = Math.floor(s%60);
            return m + ':' + (sc<10?'0':'') + sc;
        }
        
        function updateTime() {
            if (v.duration && timeDisp) {
                timeDisp.innerText = formatTime(v.currentTime) + ' / ' + formatTime(v.duration);
            }
        }
        
        function updateProgress() {
            if (v.duration && progressBar) {
                progressBar.style.width = (v.currentTime/v.duration)*100+'%';
            }
            updateTime();
        }
        
        function updateBuffered() {
            if (v.buffered.length && v.duration && bufferedBar) {
                bufferedBar.style.width = (v.buffered.end(v.buffered.length-1)/v.duration)*100+'%';
            }
        }
        
        function startPlay() {
            if (playOverlay) playOverlay.style.display = 'none';
            if (loading) loading.style.display = 'flex';
            v.play().then(() => {
                if (loading) loading.style.display = 'none';
                if (playPause) playPause.innerHTML = '⏸️';
            }).catch(() => {
                v.muted = true;
                if (mute) mute.innerHTML = '🔇';
                v.play().then(() => {
                    if (loading) loading.style.display = 'none';
                    if (playPause) playPause.innerHTML = '⏸️';
                });
            });
        }
        
        function showControls() {
            let ctrl = document.getElementById('videoControls');
            if (ctrl && playOverlay && playOverlay.style.display === 'none') {
                ctrl.style.opacity = '1';
                if (progress) progress.style.opacity = '1';
                clearTimeout(hideTimer);
                hideTimer = setTimeout(() => {
                    if (!v.paused) {
                        ctrl.style.opacity = '0';
                        if (progress) progress.style.opacity = '0';
                    }
                }, 3000);
            }
        }
        
        if (v) {
            v.addEventListener('progress', updateBuffered);
            v.addEventListener('timeupdate', updateProgress);
            v.addEventListener('loadedmetadata', () => { updateTime(); updateBuffered(); });
            v.addEventListener('ended', () => { if (playPause) playPause.innerHTML = '▶️'; });
        }
        
        if (playBtn) playBtn.addEventListener('click', startPlay);
        if (playOverlay) playOverlay.addEventListener('click', startPlay);
        if (playPause) {
            playPause.addEventListener('click', () => {
                if (v.paused) startPlay();
                else { v.pause(); playPause.innerHTML = '▶️'; }
                showControls();
            });
        }
        if (mute) {
            mute.addEventListener('click', () => {
                v.muted = !v.muted;
                mute.innerHTML = v.muted ? '🔇' : '🔊';
                showControls();
            });
        }
        if (full) {
            full.addEventListener('click', () => {
                if (!isFull) {
                    container.requestFullscreen();
                    isFull = true;
                    full.innerHTML = '🗗';
                } else {
                    document.exitFullscreen();
                    isFull = false;
                    full.innerHTML = '⛶';
                }
                showControls();
            });
        }
        if (progress) {
            progress.addEventListener('click', (e) => {
                let rect = progress.getBoundingClientRect();
                v.currentTime = ((e.clientX - rect.left) / rect.width) * v.duration;
                updateProgress();
                showControls();
            });
            progress.addEventListener('mousedown', (e) => {
                isDragging = true;
                let rect = progress.getBoundingClientRect();
                v.currentTime = ((e.clientX - rect.left) / rect.width) * v.duration;
                updateProgress();
                showControls();
                document.addEventListener('mousemove', onMove);
                document.addEventListener('mouseup', onUp);
            });
        }
        
        function onMove(e) {
            if (isDragging && progress) {
                let rect = progress.getBoundingClientRect();
                v.currentTime = ((e.clientX - rect.left) / rect.width) * v.duration;
                updateProgress();
                showControls();
            }
        }
        
        function onUp() {
            isDragging = false;
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
            showControls();
        }
        
        if (volSlider) {
            volSlider.addEventListener('click', (e) => {
                let rect = volSlider.getBoundingClientRect();
                let p = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
                v.volume = p;
                if (volLevel) volLevel.style.width = p * 100 + '%';
                if (p === 0) v.muted = true;
                else if (v.muted) v.muted = false;
                if (mute) mute.innerHTML = v.muted ? '🔇' : '🔊';
                showControls();
            });
        }
        
        if (container) container.addEventListener('mousemove', showControls);
        if (v) {
            v.addEventListener('play', showControls);
            v.addEventListener('pause', showControls);
        }
        
        document.addEventListener('fullscreenchange', () => {
            isFull = !!document.fullscreenElement;
            if (full) full.innerHTML = isFull ? '🗗' : '⛶';
        });
    }
    
    // Products page hotspots
    function initProductHotspots() {
        const modal = document.getElementById('imageModal');
        const modalImg = document.getElementById('modalImage');
        const closeModal = document.querySelector('.close-modal');
        
        function showFlyerWithBloom(imageUrl) {
            if (modal && modalImg) {
                modalImg.src = imageUrl;
                modal.style.display = 'flex';
                modalImg.style.animation = 'none';
                modalImg.offsetHeight;
                modalImg.style.animation = 'bloom 0.45s cubic-bezier(0.34, 1.2, 0.64, 1)';
            }
        }
        
        if (closeModal) {
            closeModal.onclick = () => {
                modal.style.display = 'none';
                if (modalImg) modalImg.style.animation = '';
            };
        }
        
        window.onclick = (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
                if (modalImg) modalImg.style.animation = '';
            }
        };
        
        const engineHotspot = document.getElementById('engineHotspot');
        const penHotspot = document.getElementById('penlubHotspot');
        const greaseHotspot = document.getElementById('greaseHotspot');
        const fuelHotspot = document.getElementById('fuelHotspot');
        const sprayCanImage = document.getElementById('sprayCanImage');
        
        if (engineHotspot) {
            engineHotspot.addEventListener('click', (e) => {
                e.stopPropagation();
                showFlyerWithBloom('product/ef.webp');
            });
        }
        if (penHotspot) {
            penHotspot.addEventListener('click', (e) => {
                e.stopPropagation();
                showFlyerWithBloom('product/pl.webp');
            });
        }
        if (greaseHotspot) {
            greaseHotspot.addEventListener('click', (e) => {
                e.stopPropagation();
                showFlyerWithBloom('product/ep2.webp');
            });
        }
        if (fuelHotspot) {
            fuelHotspot.addEventListener('click', (e) => {
                e.stopPropagation();
                showFlyerWithBloom('product/fc.webp');
            });
        }
        if (sprayCanImage) {
            sprayCanImage.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                showFlyerWithBloom('product/penlub-spray-can.webp');
            });
        }
    }
    
    // Contact form
    function initContactForm() {
        const contactForm = document.getElementById('contactForm');
        const submitBtn = document.getElementById('submitBtn');
        const formMessage = document.getElementById('formMessage');
        
        if (contactForm) {
            contactForm.addEventListener('submit', function(e) {
                e.preventDefault();
                if (submitBtn) submitBtn.disabled = true;
                if (submitBtn) submitBtn.textContent = 'Sending...';
                if (formMessage) formMessage.style.display = 'none';
                
                setTimeout(() => {
                    if (formMessage) {
                        formMessage.textContent = 'Thank you! Your message has been sent successfully.';
                        formMessage.className = 'form-message success';
                        formMessage.style.display = 'block';
                    }
                    contactForm.reset();
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.textContent = 'Send Message';
                    }
                    setTimeout(() => {
                        if (formMessage) formMessage.style.display = 'none';
                    }, 5000);
                }, 1000);
            });
        }
    }
    
    // Navigation function
    function navigateTo(page) {
        if (page === currentPage) return;
        
        // Fade out effect
        pageContent.style.opacity = '0';
        
        loadContent(page).then(() => {
            // Fade in
            pageContent.style.opacity = '1';
            highlightActiveNav(page);
        });
    }
    
    // Handle browser back/forward buttons
    window.addEventListener('popstate', (event) => {
        const page = event.state ? event.state.page : defaultPage;
        if (page !== currentPage) {
            pageContent.style.opacity = '0';
            loadContent(page).then(() => {
                pageContent.style.opacity = '1';
                highlightActiveNav(page);
                currentPage = page;
            });
        }
    });
    
    // Initialize the app
    function init() {
        pageContent.style.transition = 'opacity 0.15s ease';
        pageContent.style.opacity = '1';
        
        loadHeader().then(() => {
            // Get initial page from URL hash or default
            const hash = window.location.hash.substring(1);
            const initialPage = (hash && hash !== '') ? hash : defaultPage;
            navigateTo(initialPage);
        });
    }
    
    // Start the app
    init();
})();