// Configuration
const CONFIG = {
    ENGAGEMENT_DATE: new Date('2026-01-28T00:00:00').getTime(),
    MARRIAGE_DATE: new Date('2026-06-18T00:00:00').getTime(),
    GOOGLE_MAPS_API_KEY: 'YOUR_GOOGLE_MAPS_API_KEY', // Replace with your key in index.html script tag
    LOCATIONS: {
        engagement: {
            name: 'Hotel Padmavathi',
            address: 'Palpannai, Trichy, Tamil Nadu',
            lat: 10.8131113,
            lng: 78.7057293,
            mapLink: 'https://maps.app.goo.gl/7YjUhTCX7Niii8My6'
        },
        marriage: {
            name: 'Sri Naraiyana Mahal',
            address: 'Trichy, Tamil Nadu',
            lat: 10.8732209,
            lng: 78.7062234,
            mapLink: 'https://maps.app.goo.gl/aerwBkYg2dg1Xda67'
        }
    },
    // Photos will be loaded from photos.json file (auto-generated)
    // Run: node generate-photos.js to create photos.json from folders
};

// Countdown Timer
let timerInterval = null;

function formatDate(date) {
    const day = date.getDate();
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    
    const getOrdinal = (n) => {
        const s = ['th', 'st', 'nd', 'rd'];
        const v = n % 100;
        return n + (s[(v - 20) % 10] || s[v] || s[0]);
    };
    
    return `${getOrdinal(day)} ${month} ${year}`;
}

function formatFooterDate(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
}

function updateCountdown() {
    try {
        const now = Date.now();
        let targetDate, eventName, isEngagement;

        if (now < CONFIG.ENGAGEMENT_DATE) {
            targetDate = CONFIG.ENGAGEMENT_DATE;
            eventName = 'Engagement';
            isEngagement = true;
        } else if (now < CONFIG.MARRIAGE_DATE) {
            targetDate = CONFIG.MARRIAGE_DATE;
            eventName = 'Wedding';
            isEngagement = false;
        } else {
            const daysEl = document.getElementById('days');
            const hoursEl = document.getElementById('hours');
            const minutesEl = document.getElementById('minutes');
            const secondsEl = document.getElementById('seconds');
            
            if (daysEl) daysEl.textContent = '00';
            if (hoursEl) hoursEl.textContent = '00';
            if (minutesEl) minutesEl.textContent = '00';
            if (secondsEl) secondsEl.textContent = '00';
            
            const eventDateEl = document.getElementById('eventDate');
            if (eventDateEl) {
                eventDateEl.textContent = formatDate(new Date(CONFIG.MARRIAGE_DATE));
            }
            const footerDateEl = document.getElementById('footerDate');
            if (footerDateEl) {
                footerDateEl.textContent = formatFooterDate(new Date(CONFIG.MARRIAGE_DATE));
            }
            // Update status to "Married" after marriage date
            const statusTextEl = document.getElementById('statusText');
            if (statusTextEl) {
                statusTextEl.textContent = 'Married';
            }
            updateVenueDisplay('marriage');
            return;
        }

        // Update date display
        const eventDateEl = document.getElementById('eventDate');
        if (eventDateEl) {
            if (isEngagement) {
                eventDateEl.textContent = formatDate(new Date(CONFIG.ENGAGEMENT_DATE));
            } else {
                eventDateEl.textContent = formatDate(new Date(CONFIG.MARRIAGE_DATE));
            }
        }

        // Update footer date dynamically based on current event
        const footerDateEl = document.getElementById('footerDate');
        if (footerDateEl) {
            footerDateEl.textContent = formatFooterDate(new Date(targetDate));
        }

        // Update venue display based on current event
        updateVenueDisplay(isEngagement ? 'engagement' : 'marriage');

        // Update header status text
        const statusTextEl = document.getElementById('statusText');
        if (statusTextEl) {
            if (now < CONFIG.ENGAGEMENT_DATE) {
                statusTextEl.textContent = 'Engaged';
            } else {
                statusTextEl.textContent = 'Married';
            }
        }

        const difference = targetDate - now;

        if (difference > 0) {
            const days = Math.floor(difference / (1000 * 60 * 60 * 24));
            const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((difference % (1000 * 60)) / 1000);

            const daysEl = document.getElementById('days');
            const hoursEl = document.getElementById('hours');
            const minutesEl = document.getElementById('minutes');
            const secondsEl = document.getElementById('seconds');
            
            if (daysEl) daysEl.textContent = String(days).padStart(2, '0');
            if (hoursEl) hoursEl.textContent = String(hours).padStart(2, '0');
            if (minutesEl) minutesEl.textContent = String(minutes).padStart(2, '0');
            if (secondsEl) secondsEl.textContent = String(seconds).padStart(2, '0');
        }
    } catch (error) {
        console.error('Error in updateCountdown:', error);
    }
}

function updateVenueDisplay(locationType) {
    const location = CONFIG.LOCATIONS[locationType];
    if (!location) return;

    const venueLabel = document.getElementById('venueLabel');
    const venueName = document.getElementById('venueName');
    const venueAddress = document.getElementById('venueAddress');
    
    if (venueLabel) {
        venueLabel.textContent = locationType === 'engagement' ? 'Engagement Venue' : 'Wedding Venue';
    }
    if (venueName) {
        venueName.textContent = location.name;
    }
    if (venueAddress) {
        venueAddress.textContent = location.address;
    }
}

function startCountdown() {
    updateCountdown();
    timerInterval = setInterval(updateCountdown, 1000);
}

// Photo Gallery
let currentCategory = 'others';
let currentSubCategory = 'all'; // For filtering within "others"
let photosData = { wedding: [], engagement: [], others: [] };
let currentPage = 1;
const IMAGES_PER_PAGE = 24; // Increased to fill more space

// Get images list from server
async function getImagesList(category, subCategory = 'all') {
    try {
        // For "others" category, combine or filter team-bride and team-groom photos
        if (category === 'others') {
            const allImages = [];
            
            // Fetch team-bride photos if needed
            if (subCategory === 'all' || subCategory === 'team-bride') {
                const teamBrideResponse = await fetch(`/api/photos?category=team-bride`);
                if (teamBrideResponse.ok) {
                    const brideData = await teamBrideResponse.json();
                    const brideImages = (brideData.images || []).map(img => {
                        const photoData = typeof img === 'string' ? { filename: img, url: null } : img;
                        return {
                            ...photoData,
                            url: photoData.url || `photos/team-bride/${photoData.filename}`
                        };
                    });
                    allImages.push(...brideImages);
                }
            }
            
            // Fetch team-groom photos if needed
            if (subCategory === 'all' || subCategory === 'team-groom') {
                const teamGroomResponse = await fetch(`/api/photos?category=team-groom`);
                if (teamGroomResponse.ok) {
                    const groomData = await teamGroomResponse.json();
                    const groomImages = (groomData.images || []).map(img => {
                        const photoData = typeof img === 'string' ? { filename: img, url: null } : img;
                        return {
                            ...photoData,
                            url: photoData.url || `photos/team-groom/${photoData.filename}`
                        };
                    });
                    allImages.push(...groomImages);
                }
            }
            
            console.log(`Found ${allImages.length} images for others (subCategory: ${subCategory})`);
            return allImages;
        }
        
        // For other categories, fetch normally
        const response = await fetch(`/api/photos?category=${category}`);
        console.log('Fetch response:', response.status, response.statusText);
        if (response.ok) {
            const data = await response.json();
            console.log(`Found ${data.images?.length || 0} images for ${category}:`, data.images?.slice(0, 5));
            return data.images || [];
        } else {
            console.error('Response not OK:', response.status, response.statusText);
            const errorText = await response.text();
            console.error('Error response:', errorText);
        }
    } catch (error) {
        console.error('Error fetching images:', error);
        console.error('Make sure the server is running: node server.js');
    }
    return [];
}

async function fetchPhotos(category, page = 1) {
    const loadingEl = document.getElementById('galleryLoading');
    const errorEl = document.getElementById('galleryError');
    const gridEl = document.getElementById('photoGrid');
    const paginationEl = document.getElementById('pagination');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const paginationInfo = document.getElementById('paginationInfo');

    loadingEl.style.display = 'block';
    errorEl.style.display = 'none';
    gridEl.innerHTML = '';
    paginationEl.style.display = 'none';

    try {
        // Get all images from server
        console.log(`Fetching photos for category: ${category}, subCategory: ${currentSubCategory}, page: ${page}`);
        const allImages = await getImagesList(category, currentSubCategory);
        console.log(`Total images received: ${allImages.length}`);
        loadingEl.style.display = 'none';
        
        if (allImages.length > 0) {
            // Shuffle photos for assorted layout
            const shuffledImages = [...allImages].sort(() => Math.random() - 0.5);
            
            // Calculate pagination
            const totalPages = Math.ceil(shuffledImages.length / IMAGES_PER_PAGE);
            const startIndex = (page - 1) * IMAGES_PER_PAGE;
            const endIndex = startIndex + IMAGES_PER_PAGE;
            const photos = shuffledImages.slice(startIndex, endIndex);

            // Display photos for current page
            gridEl.innerHTML = photos.map((photo) => {
                // Handle both string (filename) and object (filename + url) formats
                const photoData = typeof photo === 'string' ? { filename: photo, url: null } : photo;
                // For "others" category, URL is already set in getImagesList, otherwise use default path
                const photoUrl = photoData.url || `photos/${category}/${photoData.filename}`;
                const photoAlt = photoData.filename;
                const photoFilename = photoData.filename || photoUrl.split('/').pop();
                // Escape quotes in URLs and filenames for safe HTML insertion
                const safeUrl = photoUrl.replace(/'/g, "\\'");
                const safeFilename = photoFilename.replace(/'/g, "\\'");
                
                return `
                    <div class="photo-item">
                        <img src="${photoUrl}" alt="${photoAlt}" loading="lazy" onclick="window.open('${safeUrl}', '_blank')">
                        <button class="download-btn" onclick="event.stopPropagation(); event.preventDefault(); downloadImage('${safeUrl}', '${safeFilename}'); return false;" title="Download image" type="button">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                <polyline points="7 10 12 15 17 10"></polyline>
                                <line x1="12" y1="15" x2="12" y2="3"></line>
                            </svg>
                        </button>
                    </div>
                `;
            }).join('');

            // Show pagination
            if (totalPages > 1) {
                paginationEl.style.display = 'flex';
                paginationInfo.textContent = `Page ${page} of ${totalPages} (${shuffledImages.length} photos)`;
                
                prevBtn.disabled = page === 1;
                nextBtn.disabled = page >= totalPages;
                
                prevBtn.onclick = () => {
                    if (page > 1) {
                        currentPage = page - 1;
                        fetchPhotos(category, currentPage);
                        window.scrollTo({ top: gridEl.offsetTop - 100, behavior: 'smooth' });
                    }
                };
                
                nextBtn.onclick = () => {
                    if (page < totalPages) {
                        currentPage = page + 1;
                        fetchPhotos(category, currentPage);
                        window.scrollTo({ top: gridEl.offsetTop - 100, behavior: 'smooth' });
                    }
                };
            }
        } else {
            gridEl.innerHTML = '<div class="error" style="display: flex; align-items: center; justify-content: center; padding: 40px 20px; text-align: center; color: #8B0000; font-size: 1.2rem; min-height: 200px; width: 100%;">No photos available to view</div>';
        }
    } catch (error) {
        loadingEl.style.display = 'none';
        errorEl.textContent = 'Error loading photos. Make sure the server is running.';
        errorEl.style.display = 'block';
    }
}

async function initGallery() {
    // Reset discovered images when switching categories
    const tabButtons = document.querySelectorAll('.tab-btn');
    const subTabContainer = document.getElementById('subTabContainer');
    const subTabButtons = document.querySelectorAll('.sub-tab-btn');
    
    // Show/hide sub-tabs based on initial category
    if (currentCategory === 'others') {
        subTabContainer.style.display = 'flex';
        subTabButtons.forEach(b => b.classList.remove('active'));
        document.querySelector('.sub-tab-btn[data-subcategory="all"]')?.classList.add('active');
    } else {
        subTabContainer.style.display = 'none';
    }
    
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            tabButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentCategory = btn.dataset.category;
            currentPage = 1; // Reset to first page when switching categories
            
            // Show/hide sub-tabs based on category
            if (currentCategory === 'others') {
                subTabContainer.style.display = 'flex';
                currentSubCategory = 'all'; // Reset to 'all' when switching to others
                subTabButtons.forEach(b => b.classList.remove('active'));
                document.querySelector('.sub-tab-btn[data-subcategory="all"]')?.classList.add('active');
            } else {
                subTabContainer.style.display = 'none';
                currentSubCategory = 'all';
            }
            
            fetchPhotos(currentCategory, currentPage);
        });
    });
    
    // Handle sub-tab clicks
    subTabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            if (currentCategory !== 'others') return;
            
            subTabButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentSubCategory = btn.dataset.subcategory;
            currentPage = 1; // Reset to first page when switching sub-categories
            fetchPhotos(currentCategory, currentPage);
        });
    });

    fetchPhotos(currentCategory, currentPage);
}


// Google Maps - Using embedded iframes (no API key required)
let currentMapLocation = 'marriage';

// Convert Google Maps share link to embed URL
function getEmbedUrl(shareLink) {
    // Extract place ID or coordinates from share link
    // For now, we'll use the share link directly in an iframe
    // Google Maps embed URLs format: https://www.google.com/maps/embed?pb=...
    // Since we have share links, we'll convert them to embed format
    
    // Try to extract place ID from the share link
    // If it's a maps.app.goo.gl link, we need to get the actual place ID
    // For simplicity, we'll use the coordinates to create an embed URL
    
    return shareLink;
}

// Create embed URL from coordinates
function createEmbedUrl(lat, lng, name) {
    // Use Google Maps embed with coordinates
    const encodedName = encodeURIComponent(name);
    return `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3928.5!2d${lng}!3d${lat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTAuNDc5MDUgNzguNzA0Nw!5e0!3m2!1sen!2sin!4v1234567890123!5m2!1sen!2sin`;
}

function updateMapLocation(locationType) {
    const location = CONFIG.LOCATIONS[locationType];
    if (!location) return;

    currentMapLocation = locationType;
    const mapFrame = document.getElementById('mapFrame');
    const mapElement = document.getElementById('map');

    if (!mapElement || !mapFrame) {
        console.error('Map element not found');
        return;
    }

    // Create embed URL using coordinates and place name (no API key required)
    // Using the place name in the query for better accuracy
    const placeName = encodeURIComponent(location.name + ' ' + location.address);
    const embedUrl = `https://www.google.com/maps?q=${placeName}&ll=${location.lat},${location.lng}&z=15&output=embed`;
    mapFrame.src = embedUrl;

    // Update map info display
    document.getElementById('mapVenueName').textContent = location.name;
    document.getElementById('mapVenueAddress').textContent = location.address;
    document.getElementById('mapLink').href = location.mapLink;
    
    // Update event date based on location type
    const venueDateEl = document.getElementById('mapVenueDate');
    if (venueDateEl) {
        if (locationType === 'engagement') {
            venueDateEl.textContent = formatDate(new Date(CONFIG.ENGAGEMENT_DATE));
        } else if (locationType === 'marriage') {
            venueDateEl.textContent = formatDate(new Date(CONFIG.MARRIAGE_DATE));
        }
    }

    // Update active tab
    document.querySelectorAll('.location-tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`.location-tab-btn[data-location="${locationType}"]`).classList.add('active');
}

function initLocationTabs() {
    const tabButtons = document.querySelectorAll('.location-tab-btn');
    
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const locationType = btn.dataset.location;
            updateMapLocation(locationType);
        });
    });
}


// Header Slideshow
let currentHeaderImageIndex = 0;
let headerImages = [];
let headerSlideshowInterval = null;

async function initHeaderSlideshow() {
    try {
        console.log('Loading header images...');
        const response = await fetch('/api/header-images');
        console.log('Header images response:', response.status);
        
        if (response.ok) {
            const data = await response.json();
            headerImages = data.images || [];
            const folderName = data.folder || 'header'; // Use folder name from server
            console.log(`Found ${headerImages.length} header images from ${folderName} folder:`, headerImages);
            
            if (headerImages.length > 0) {
                const slideshowEl = document.getElementById('headerSlideshow');
                if (slideshowEl) {
                    // Create image elements using the folder name from server (simpler innerHTML approach)
                    slideshowEl.innerHTML = headerImages.map((img, index) => {
                        const imgPath = `photos/${folderName}/${img}`;
                        return `<img src="${imgPath}" alt="Header ${index + 1}" class="${index === 0 ? 'active' : ''}" onload="console.log('✅ Header image ${index + 1} loaded:', '${img}')" onerror="console.error('❌ Failed to load:', '${imgPath}'); this.style.display='none';">`;
                    }).join('');
                    
                    console.log(`Header slideshow initialized with ${headerImages.length} images from ${folderName} folder`);
                    
                    // Wait a bit for images to start loading, then start slideshow
                    setTimeout(() => {
                        startHeaderSlideshow();
                    }, 500);
                } else {
                    console.error('Header slideshow element not found');
                }
            } else {
                console.warn('No header images found. Using default background.');
                // If no header images, use default background
                const headerSection = document.querySelector('.header-section');
                if (headerSection) {
                    headerSection.style.background = '#8B0000';
                }
            }
        } else {
            console.error('Failed to fetch header images:', response.status, response.statusText);
            const headerSection = document.querySelector('.header-section');
            if (headerSection) {
                headerSection.style.background = '#8B0000';
            }
        }
    } catch (error) {
        console.error('Error loading header images:', error);
        console.error('Make sure the server is running: node server.js');
        // Fallback to default background
        const headerSection = document.querySelector('.header-section');
        if (headerSection) {
            headerSection.style.background = '#8B0000';
        }
    }
}

function startHeaderSlideshow() {
    // Clear any existing interval
    if (headerSlideshowInterval) {
        clearInterval(headerSlideshowInterval);
    }
    
    // Get only visible images (not hidden due to errors)
    const images = Array.from(document.querySelectorAll('.header-slideshow img')).filter(img => 
        img.style.display !== 'none'
    );
    
    if (images.length === 0) {
        console.warn('⚠️ No visible images found in slideshow container');
        const headerSection = document.querySelector('.header-section');
        if (headerSection) {
            headerSection.style.background = '#8B0000';
        }
        return;
    }
    
    console.log(`✅ Found ${images.length} visible image elements in DOM`);
    
    // If only one image, just show it
    if (images.length <= 1) {
        console.log('Single header image - showing static image');
        if (images[0]) {
            images[0].classList.add('active');
            console.log('✅ Single image activated');
        }
        return;
    }
    
    console.log(`🎬 Starting header slideshow with ${images.length} images`);
    
    // Ensure first image is visible and others are hidden
    images.forEach((img, idx) => {
        if (idx === 0) {
            img.classList.add('active');
            console.log(`✅ Image 1/${images.length} activated`);
        } else {
            img.classList.remove('active');
        }
    });
    
    currentHeaderImageIndex = 0;
    
    // Start cycling through images
    headerSlideshowInterval = setInterval(() => {
        const currentImages = Array.from(document.querySelectorAll('.header-slideshow img')).filter(img => 
            img.style.display !== 'none'
        );
        
        if (currentImages.length === 0) {
            console.warn('⚠️ No visible images found during slideshow cycle');
            clearInterval(headerSlideshowInterval);
            return;
        }
        
        // Remove active class from current image
        if (currentImages[currentHeaderImageIndex]) {
            currentImages[currentHeaderImageIndex].classList.remove('active');
        }
        
        // Move to next image
        currentHeaderImageIndex = (currentHeaderImageIndex + 1) % currentImages.length;
        
        // Add active class to new image
        if (currentImages[currentHeaderImageIndex]) {
            currentImages[currentHeaderImageIndex].classList.add('active');
            console.log(`🔄 Switched to image ${currentHeaderImageIndex + 1}/${currentImages.length}`);
        }
    }, 4000); // Change image every 4 seconds
    
    console.log('✅ Slideshow interval started');
}

// Gallery Preview
async function loadGalleryPreview() {
    const previewGrid = document.getElementById('galleryPreviewGrid');
    if (!previewGrid) return;

    try {
        // Get engagement photos only for Engagement Story section
        const images = await getImagesList('engagement');
        
        // Map images to include URL
        const previewImages = images.map(img => {
            const photoData = typeof img === 'string' ? { filename: img, url: null } : img;
            return {
                ...photoData,
                category: 'engagement',
                url: photoData.url || `photos/engagement/${photoData.filename}`
            };
        });

        // Shuffle and take up to 6 images for preview (or all if less than 6)
        const shuffled = previewImages.sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, Math.min(6, shuffled.length));

        if (selected.length === 0) {
            previewGrid.innerHTML = '<div class="preview-loading">No photos available for preview</div>';
            return;
        }

        previewGrid.innerHTML = selected.map(photo => `
            <div class="gallery-preview-item" onclick="window.open('${photo.url}', '_blank')">
                <img src="${photo.url}" alt="${photo.filename}" loading="lazy">
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading gallery preview:', error);
        previewGrid.innerHTML = '<div class="preview-loading">Error loading preview</div>';
    }
}

// Smooth scroll navigation
function initNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const navMenu = document.querySelector('.nav-menu');
    const mainNav = document.querySelector('.main-nav');
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                // On desktop, menu is a left sidebar, so we don't need to account for its height
                // On mobile, menu is a top bar, so we need to account for its height
                const isMobile = document.body.classList.contains('mobile-device');
                let targetPosition = targetElement.offsetTop;
                
                if (isMobile) {
                    const navHeight = document.querySelector('.main-nav').offsetHeight;
                    targetPosition = targetElement.offsetTop - navHeight;
                } else {
                    // On desktop, just add a small offset for better positioning
                    targetPosition = targetElement.offsetTop - 20;
                }
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
                
                // Don't hide menu on mobile - keep it always visible
            }
        });
    });
    
    // Also hide menu when clicking on logo (home link)
    const logoLink = document.querySelector('.nav-logo-text');
    if (logoLink) {
        logoLink.addEventListener('click', (e) => {
            e.preventDefault();
            const targetElement = document.getElementById('home');
            
            if (targetElement) {
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
                
                // Don't hide menu on mobile - keep it always visible
            }
        });
    }
    
    // Keep menu always visible on mobile - no auto-hide on scroll
    
    // Menu toggle button functionality
    const menuToggleBtn = document.getElementById('menuToggleBtn');
    if (menuToggleBtn && mainNav) {
        menuToggleBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const isClosed = mainNav.classList.contains('menu-closed');
            
            if (isClosed) {
                mainNav.classList.remove('menu-closed');
                if (!document.body.classList.contains('mobile-device')) {
                    document.body.classList.remove('menu-closed');
                }
                menuToggleBtn.classList.add('active');
            } else {
                mainNav.classList.add('menu-closed');
                if (!document.body.classList.contains('mobile-device')) {
                    document.body.classList.add('menu-closed');
                }
                menuToggleBtn.classList.remove('active');
            }
        });
        
        // Close menu when clicking outside on desktop
        if (window.innerWidth >= 768 && !document.body.classList.contains('mobile-device')) {
            document.addEventListener('click', (e) => {
                if (mainNav && !mainNav.contains(e.target) && 
                    menuToggleBtn && !menuToggleBtn.contains(e.target) &&
                    !mainNav.classList.contains('menu-closed')) {
                    mainNav.classList.add('menu-closed');
                    if (document.body.classList.contains('mobile-device')) {
                        document.body.classList.add('menu-closed');
                    } else {
                        document.body.classList.add('menu-closed');
                    }
                    menuToggleBtn.classList.remove('active');
                }
            });
        }
    }

    // Update active nav link on scroll
    window.addEventListener('scroll', () => {
        const sections = document.querySelectorAll('section[id]');
        const isMobile = document.body.classList.contains('mobile-device');
        // On desktop, menu is on the left, so we don't need to add navHeight
        // On mobile, menu is on top, so we need to account for it
        const navHeight = isMobile ? document.querySelector('.main-nav').offsetHeight : 0;
        const scrollPos = window.scrollY + navHeight + 100;

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');
            const navLink = document.querySelector(`.nav-link[href="#${sectionId}"]`);

            if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
                navLinks.forEach(link => link.classList.remove('active'));
                if (navLink) navLink.classList.add('active');
            }
        });
    });
}

// Device Detection
function detectDevice() {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
    const isTablet = /ipad|android(?!.*mobile)|tablet/i.test(userAgent.toLowerCase());
    const screenWidth = window.innerWidth || document.documentElement.clientWidth;
    
    // Consider mobile if screen width is less than 768px or device is detected as mobile
    const isMobileDevice = isMobile || (!isTablet && screenWidth < 768);
    
    // Add device class to body
    if (isMobileDevice) {
        document.body.classList.add('mobile-device');
        document.documentElement.classList.add('mobile-device');
    } else {
        document.body.classList.add('desktop-device');
        document.documentElement.classList.add('desktop-device');
    }
    
    console.log('Device detected:', {
        isMobile: isMobileDevice,
        userAgent: userAgent,
        screenWidth: screenWidth
    });
    
    return isMobileDevice;
}

    // Initialize everything
document.addEventListener('DOMContentLoaded', async () => {
    // Detect device first
    detectDevice();
    
    // Initialize menu - start closed on desktop, open on mobile
    const mainNav = document.getElementById('mainNav');
    const menuToggleBtn = document.getElementById('menuToggleBtn');
    if (mainNav && menuToggleBtn) {
        if (window.innerWidth >= 768 && !document.body.classList.contains('mobile-device')) {
            // Desktop: start closed
            mainNav.classList.add('menu-closed');
            document.body.classList.add('menu-closed');
        } else {
            // Mobile: always visible, never closed
            mainNav.classList.remove('menu-closed');
            document.body.classList.remove('menu-closed');
            menuToggleBtn.classList.add('active');
            // Force menu to stay visible on mobile
            mainNav.style.transform = 'translateY(0)';
            mainNav.style.opacity = '1';
            mainNav.style.pointerEvents = 'auto';
        }
    }
    
    await initHeaderSlideshow();
    startCountdown();
    await initGallery();
    // Gallery preview now uses static photos in HTML
    initLocationTabs();
    initNavigation();
    
    // Initialize footer date dynamically
    updateCountdown(); // This will set the footer date based on current event
    

    // Initialize map with embedded iframe (no API key needed)
    updateMapLocation('marriage');
    
    // Initialize photo upload
    initPhotoUpload();
    
    // Re-detect on resize (but don't change class if already set)
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            const screenWidth = window.innerWidth || document.documentElement.clientWidth;
            if (screenWidth < 768 && !document.body.classList.contains('mobile-device')) {
                document.body.classList.remove('desktop-device');
                document.body.classList.add('mobile-device');
                document.documentElement.classList.remove('desktop-device');
                document.documentElement.classList.add('mobile-device');
            } else if (screenWidth >= 768 && !document.body.classList.contains('desktop-device')) {
                document.body.classList.remove('mobile-device');
                document.body.classList.add('desktop-device');
                document.documentElement.classList.remove('mobile-device');
                document.documentElement.classList.add('desktop-device');
            }
        }, 250);
    });
});

// Photo Upload Functionality
function initPhotoUpload() {
    const uploadBtn = document.getElementById('uploadBtn');
    const fileInput = document.getElementById('photoUpload');
    const uploadProgress = document.getElementById('uploadProgress');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    const uploadMessage = document.getElementById('uploadMessage');
    const uploadedPreview = document.getElementById('uploadedPreview');
    
    if (!fileInput) {
        console.error('File input not found');
        return;
    }
    
    console.log('Initializing photo upload...');
    
    // Upload button click
    if (uploadBtn) {
        uploadBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Upload button clicked');
            fileInput.click();
        });
    }
    
    // File input change
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            console.log('Files selected:', e.target.files.length);
            handleFileUpload(e.target.files);
        }
    });
    
    async function handleFileUpload(files) {
        const validFiles = Array.from(files).filter(file => {
            const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'];
            return validTypes.includes(file.type);
        });
        
        if (validFiles.length === 0) {
            showUploadMessage('Please select valid image files (JPG, PNG, GIF, WEBP, BMP)', 'error');
            return;
        }
        
        if (validFiles.length > 20) {
            showUploadMessage('Maximum 20 files allowed at once', 'error');
            return;
        }
        
        // Check file sizes
        const oversizedFiles = validFiles.filter(file => file.size > 10 * 1024 * 1024);
        if (oversizedFiles.length > 0) {
            showUploadMessage('Some files exceed 10MB limit. Please resize them.', 'error');
            return;
        }
        
        // Show progress
        uploadProgress.style.display = 'block';
        uploadMessage.style.display = 'none';
        uploadedPreview.innerHTML = '';
        progressFill.style.width = '0%';
        progressText.textContent = 'Preparing upload...';
        
        const formData = new FormData();
        validFiles.forEach(file => {
            formData.append('photos', file);
        });
        
        try {
            const xhr = new XMLHttpRequest();
            
            // Track upload progress
            xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable) {
                    const percentComplete = (e.loaded / e.total) * 100;
                    progressFill.style.width = percentComplete + '%';
                    progressText.textContent = `Uploading... ${Math.round(percentComplete)}%`;
                }
            });
            
            xhr.addEventListener('load', () => {
                console.log('Upload response status:', xhr.status);
                console.log('Upload response:', xhr.responseText);
                
                if (xhr.status === 200) {
                    try {
                        const response = JSON.parse(xhr.responseText);
                        progressFill.style.width = '100%';
                        progressText.textContent = 'Upload complete!';
                        
                        console.log('✅ Upload successful:', response);
                        showUploadMessage(`✅ Successfully uploaded ${response.files.length} photo(s)!`, 'success');
                        
                        // Show preview of uploaded files
                        uploadedPreview.innerHTML = `<p class="uploaded-count">${response.files.length} photo(s) uploaded</p>`;
                        
                        // Refresh the gallery if "Others" tab is active
                        const activeTab = document.querySelector('.tab-btn.active');
                        if (activeTab && activeTab.dataset.category === 'others') {
                            setTimeout(() => {
                                initGallery();
                            }, 1000);
                        }
                        
                        // Hide progress after 2 seconds
                        setTimeout(() => {
                            uploadProgress.style.display = 'none';
                            fileInput.value = ''; // Reset input
                        }, 2000);
                    } catch (parseError) {
                        console.error('Error parsing response:', parseError);
                        showUploadMessage('❌ Upload response error', 'error');
                        uploadProgress.style.display = 'none';
                    }
                } else {
                    try {
                        const error = JSON.parse(xhr.responseText);
                        console.error('Upload failed:', error);
                        showUploadMessage(`❌ Upload failed: ${error.error || 'Unknown error'}`, 'error');
                    } catch (parseError) {
                        console.error('Upload failed with status:', xhr.status, 'Response:', xhr.responseText);
                        showUploadMessage(`❌ Upload failed: Server error (${xhr.status})`, 'error');
                    }
                    uploadProgress.style.display = 'none';
                }
            });
            
            xhr.addEventListener('error', () => {
                showUploadMessage('❌ Network error. Please try again.', 'error');
                uploadProgress.style.display = 'none';
            });
            
            xhr.open('POST', '/api/upload');
            xhr.send(formData);
            
        } catch (error) {
            console.error('Upload error:', error);
            showUploadMessage('❌ Upload failed. Please try again.', 'error');
            uploadProgress.style.display = 'none';
        }
    }
    
    function showUploadMessage(message, type) {
        uploadMessage.textContent = message;
        uploadMessage.className = `upload-message ${type}`;
        uploadMessage.style.display = 'block';
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            uploadMessage.style.display = 'none';
        }, 5000);
    }
}

// Download image function
async function downloadImage(imageUrl, filename) {
    try {
        // Fetch the image as a blob
        const response = await fetch(imageUrl);
        if (!response.ok) {
            throw new Error('Failed to fetch image');
        }
        
        const blob = await response.blob();
        
        // Create a temporary URL for the blob
        const blobUrl = window.URL.createObjectURL(blob);
        
        // Create a temporary anchor element and trigger download
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = filename || 'image.jpg';
        document.body.appendChild(link);
        link.click();
        
        // Clean up
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
        
        console.log('Image downloaded successfully:', filename);
    } catch (error) {
        console.error('Error downloading image:', error);
        // Fallback: open image in new tab if download fails
        window.open(imageUrl, '_blank');
    }
}

// Make downloadImage available globally
window.downloadImage = downloadImage;

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (timerInterval) clearInterval(timerInterval);
});
