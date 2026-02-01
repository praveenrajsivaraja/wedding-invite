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
        // For "others" category, combine or filter team-bride and team-groom photos, plus uploaded photos
        if (category === 'others') {
            const allImages = [];
            
            // Fetch uploaded photos from "others" folder (for photos uploaded via portal)
            if (subCategory === 'all') {
                const othersResponse = await fetch(`/api/photos?category=others`);
                if (othersResponse.ok) {
                    const othersData = await othersResponse.json();
                    const othersImages = (othersData.images || []).map(img => {
                        const photoData = typeof img === 'string' ? { filename: img, url: null } : img;
                        return {
                            ...photoData,
                            url: photoData.url || `photos/others/${photoData.filename}`
                        };
                    });
                    allImages.push(...othersImages);
                }
            }
            
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
                const pageText = translations[currentLanguage]?.gallery?.page || 'Page';
                const ofText = translations[currentLanguage]?.gallery?.of || 'of';
                const photosText = translations[currentLanguage]?.gallery?.photos || 'photos';
                paginationInfo.textContent = `${pageText} ${page} ${ofText} ${totalPages} (${shuffledImages.length} ${photosText})`;
                
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
            const noPhotosText = translations[currentLanguage]?.gallery?.noPhotos || 'No photos available to view';
            gridEl.innerHTML = `<div class="error" style="display: flex; align-items: center; justify-content: center; padding: 40px 20px; text-align: center; color: #8B0000; font-size: 1.2rem; min-height: 200px; width: 100%; margin: 0 auto;">${noPhotosText}</div>`;
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
// Language Translations
const translations = {
    en: {
        header: {
            groom: 'Chennai Paiyan',
            weds: 'Weds',
            bride: 'Trichy Ponnu',
            saveTheDate: 'SAVE THE DATE'
        },
        timer: {
            days: 'DAYS',
            hours: 'HOURS',
            minutes: 'MINUTES',
            seconds: 'SECONDS'
        },
        about: {
            title: 'Our Story',
            paragraph1: 'It was at the divine Thiruvanaikoil Temple where our eyes first met, and in that moment, we fell in love at first sight. What started as a traditional matchmaking turned into an extraordinary journey of discovery, filled with love, laughter, and countless emotions.',
            paragraph2: 'From romantic dinners at Rough Top Restaurant to exploring the wonders of Birds Park, from thrilling bike rides to cozy car rides, and even trying ice skating together—every moment became a cherished memory.',
            paragraph3: 'As we take this beautiful step forward, we invite you to be part of our celebration. Your presence and blessings make our special day even more meaningful.'
        },
        engagement: {
            title: 'Engagement Story',
            paragraph1: 'As we exchanged rings, time seemed to stand still. In that quiet yet powerful moment, promises were sealed and their journey toward forever truly began.',
            paragraph2: 'The celebration grew sweeter with the cake cutting, followed by an unforgettable surprise. Hidden within the cake was a special gift for her an iPhone and her reaction, filled with pure happiness and delightful excitement, became one of the most cherished moments of the day.',
            paragraph3: 'Equally touching was a gesture straight from the heart. She gifted him a silver bangle, delicately engraved with our names a timeless symbol of love, thoughtfulness, and a bond meant to last forever.',
            paragraph4: 'Reuniting with cousins after a long time filled the celebration with warmth and laughter. Endless selfies, group photos, shared stories, and joyful moments turned the gathering into a beautiful reunion of love and togetherness.',
            paragraph5: 'More than a celebration, the engagement marked the beginning of their forever, a day filled with memories they will cherish for a lifetime.',
            discoverMore: 'DISCOVER MORE'
        },
        gallery: {
            title: 'Our Memories',
            subtitle: 'Gallery',
            engagement: 'Engagement',
            others: 'Others',
            all: 'All',
            teamBride: 'Team Bride',
            teamGroom: 'Team Groom',
            loading: 'Loading photos...',
            noPhotos: 'No photos available to view',
            page: 'Page',
            of: 'of',
            photos: 'photos'
        },
        upload: {
            title: 'Upload Your Photos',
            description: 'Share your favorite moments with us! Please select the appropriate category when uploading.',
            button: 'Upload Photos'
        },
        venue: {
            title: 'Venue Locations',
            engagement: 'Engagement',
            wedding: 'Wedding',
            openMaps: '📍 Open in Google Maps',
            mapNote: 'Interactive map - Click and drag to explore'
        },
        footer: {
            title: 'Forever & Always',
            madeWithLove: 'MADE WITH LOVE',
            developedBy: 'Designed and Developed by Praveenraj Madhumitha'
        }
    },
    ta: {
        header: {
            groom: 'சென்னை பையன்',
            weds: 'திருமணம்',
            bride: 'திருச்சி பொண்ணு',
            saveTheDate: 'தேதியை சேமிக்கவும்'
        },
        timer: {
            days: 'நாட்கள்',
            hours: 'மணி',
            minutes: 'நிமிடங்கள்',
            seconds: 'வினாடிகள்'
        },
        about: {
            title: 'எங்கள் கதை',
            paragraph1: 'புனிதமான திருவணைகோயில் கோவிலில் நம் கண்கள் முதல் முறையாக சந்தித்தன, அந்த தருணத்தில், நாம் முதல் பார்வையில் காதலில் விழுந்தோம். பாரம்பரிய திருமண ஏற்பாட்டாக தொடங்கியது அன்பு, சிரிப்பு மற்றும் எண்ணற்ற உணர்ச்சிகளால் நிரப்பப்பட்ட ஒரு அசாதாரண கண்டுபிடிப்பு பயணமாக மாறியது.',
            paragraph2: 'ரஃப் டாப் உணவகத்தில் ரொமான்டிக் இரவு உணவிலிருந்து பேர்ட்ஸ் பார்க்கின் அதிசயங்களை ஆராய்வது, உற்சாகமான பைக் சவாரிகளிலிருந்து வசதியான கார் சவாரிகள், மற்றும் ஒன்றாக ஐஸ் ஸ்கேட்டிங் முயற்சிப்பது வரை - ஒவ்வொரு தருணமும் ஒரு விலைமதிப்பற்ற நினைவாக மாறியது.',
            paragraph3: 'நாம் இந்த அழகான படியை முன்னோக்கி எடுக்கும்போது, எங்கள் கொண்டாட்டத்தின் ஒரு பகுதியாக நீங்கள் இருக்குமாறு அழைக்கிறோம். உங்கள் வருகை மற்றும் ஆசீர்வாதங்கள் எங்கள் சிறப்பு நாளை இன்னும் அர்த்தமுள்ளதாக்குகின்றன.'
        },
        engagement: {
            title: 'நிச்சயதார்த்த கதை',
            paragraph1: 'நாங்கள் மோதிரங்களை பரிமாறிக்கொண்டபோது, நேரம் நிற்கிறது போல் தோன்றியது. அந்த அமைதியான ஆனால் சக்திவாய்ந்த தருணத்தில், வாக்குறுதிகள் முத்திரையிடப்பட்டன மற்றும் அவர்களின் என்றென்றும் நடக்கும் பயணம் உண்மையில் தொடங்கியது.',
            paragraph2: 'கேக் வெட்டுவதுடன் கொண்டாட்டம் இனிமையாக வளர்ந்தது, அதைத் தொடர்ந்து மறக்கமுடியாத ஆச்சரியம். கேக்கிற்குள் மறைக்கப்பட்டிருந்தது அவளுக்கான ஒரு சிறப்பு பரிசு - ஒரு ஐஃபோன் மற்றும் அவளின் எதிர்வினை, தூய மகிழ்ச்சி மற்றும் மகிழ்ச்சிகரமான உற்சாகத்தால் நிரப்பப்பட்டது, அது நாளின் மிகவும் விலைமதிப்பற்ற தருணங்களில் ஒன்றாக மாறியது.',
            paragraph3: 'சமமாக தொடர்புடையது இதயத்திலிருந்து நேரடியாக ஒரு சைகை. அவள் அவனுக்கு ஒரு வெள்ளி வளையத்தை பரிசளித்தாள், நம் பெயர்களுடன் நுட்பமாக செதுக்கப்பட்டது - அன்பு, சிந்தனை மற்றும் என்றென்றும் நீடிக்கும் பிணைப்பின் காலமற்ற சின்னம்.',
            paragraph4: 'நீண்ட காலத்திற்குப் பிறகு உறவினர்களுடன் மீண்டும் சேர்வது கொண்டாட்டத்தை வெப்பம் மற்றும் சிரிப்பால் நிரப்பியது. முடிவில்லாத செல்ஃபிகள், குழு புகைப்படங்கள், பகிரப்பட்ட கதைகள் மற்றும் மகிழ்ச்சியான தருணங்கள் கூட்டத்தை அன்பு மற்றும் ஒற்றுமையின் அழகான மீண்டும் சேர்த்தலாக மாற்றியது.',
            paragraph5: 'ஒரு கொண்டாட்டத்தை விட, நிச்சயதார்த்தம் அவர்களின் என்றென்றும் நடக்கும் தொடக்கத்தைக் குறித்தது, அவர்கள் வாழ்நாள் முழுவதும் வைத்திருப்பார்கள் என்ற நினைவுகளால் நிரப்பப்பட்ட ஒரு நாள்.',
            discoverMore: 'மேலும் கண்டறிய'
        },
        gallery: {
            title: 'எங்கள் நினைவுகள்',
            subtitle: 'புகைப்பட காட்சி',
            engagement: 'நிச்சயதார்த்தம்',
            others: 'மற்றவை',
            all: 'அனைத்தும்',
            teamBride: 'மணமகள் அணி',
            teamGroom: 'மணமகன் அணி',
            loading: 'புகைப்படங்கள் ஏற்றப்படுகின்றன...',
            noPhotos: 'பார்க்க புகைப்படங்கள் இல்லை',
            page: 'பக்கம்',
            of: 'இல்',
            photos: 'புகைப்படங்கள்'
        },
        upload: {
            title: 'உங்கள் புகைப்படங்களை பதிவேற்றவும்',
            description: 'எங்களுடன் உங்கள் பிடித்த தருணங்களை பகிர்ந்து கொள்ளுங்கள்! பதிவேற்றும்போது பொருத்தமான வகையைத் தேர்ந்தெடுக்கவும்.',
            button: 'புகைப்படங்களை பதிவேற்றவும்'
        },
        venue: {
            title: 'இடங்கள்',
            engagement: 'நிச்சயதார்த்தம்',
            wedding: 'திருமணம்',
            openMaps: '📍 கூகிள் மேப்ஸில் திறக்க',
            mapNote: 'ஊடாடும் வரைபடம் - ஆராய கிளிக் செய்து இழுக்கவும்'
        },
        footer: {
            title: 'அன்புக்கும் உண்டு அடைக்கும் தாள்',
            madeWithLove: 'அன்புடன் உருவாக்கப்பட்டது',
            developedBy: 'பிரவீன்ராஜ் மதுமிதாவால் வடிவமைக்கப்பட்டு உருவாக்கப்பட்டது'
        }
    }
};

// Current language
let currentLanguage = localStorage.getItem('language') || 'en';

// Function to update all text based on current language
function updateLanguage(lang) {
    currentLanguage = lang;
    localStorage.setItem('language', lang);
    document.documentElement.lang = lang;
    
    // Update all elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        const keys = key.split('.');
        let translation = translations[lang];
        
        for (const k of keys) {
            translation = translation?.[k];
        }
        
        if (translation) {
            if (element.tagName === 'INPUT' || element.tagName === 'BUTTON') {
                if (element.tagName === 'BUTTON' && element.querySelector('span[data-i18n]')) {
                    // Handle button with nested span
                    const span = element.querySelector('span[data-i18n]');
                    if (span) {
                        span.textContent = translation;
                    } else {
                        element.textContent = translation;
                    }
                } else {
                    element.textContent = translation;
                }
            } else {
                element.textContent = translation;
            }
        }
    });
    
    // Update language toggle button text
    const langBtn = document.getElementById('languageText');
    if (langBtn) {
        langBtn.textContent = lang === 'en' ? 'தமிழ்' : 'English';
    }
    
    // Refresh gallery to update dynamic text
    if (typeof initGallery === 'function' && document.getElementById('photoGrid')) {
        setTimeout(() => {
            initGallery();
        }, 100);
    }
}

// Initialize language on page load
function initLanguage() {
    updateLanguage(currentLanguage);
}

// Function to scroll to gallery section
function scrollToGallery() {
    const gallerySection = document.getElementById('gallery');
    if (gallerySection) {
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
        const navHeight = isMobile ? 50 : 0; // Account for mobile menu height
        const galleryPosition = gallerySection.offsetTop - navHeight;
        
        window.scrollTo({
            top: galleryPosition,
            behavior: 'smooth'
        });
    }
}

// Make scrollToGallery available globally
window.scrollToGallery = scrollToGallery;

document.addEventListener('DOMContentLoaded', async () => {
    // Initialize language first
    initLanguage();
    
    // Language toggle button
    const languageToggleBtn = document.getElementById('languageToggleBtn');
    if (languageToggleBtn) {
        languageToggleBtn.addEventListener('click', () => {
            const newLang = currentLanguage === 'en' ? 'ta' : 'en';
            updateLanguage(newLang);
        });
    }
    
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
    
    // Ensure no capture attribute is set (to prevent camera from opening)
    if (fileInput.hasAttribute('capture')) {
        fileInput.removeAttribute('capture');
    }
    
    // Set specific accept types to prefer gallery over camera
    fileInput.setAttribute('accept', 'image/jpeg,image/jpg,image/png,image/gif,image/webp');
    
    console.log('Initializing photo upload...');
    
    // Upload button click
    if (uploadBtn) {
        uploadBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Upload button clicked');
            
            // Remove any capture attribute that might force camera
            if (fileInput.hasAttribute('capture')) {
                fileInput.removeAttribute('capture');
            }
            
            try {
                // For mobile, ensure the input is accessible but don't force camera
                fileInput.style.display = 'block';
                fileInput.style.position = 'absolute';
                fileInput.style.opacity = '0';
                fileInput.style.width = '100%';
                fileInput.style.height = '100%';
                fileInput.style.top = '0';
                fileInput.style.left = '0';
                
                // Small delay to ensure styles are applied
                setTimeout(() => {
                    fileInput.click();
                    // Reset after click
                    setTimeout(() => {
                        fileInput.style.display = 'none';
                    }, 100);
                }, 10);
            } catch (error) {
                console.error('Error triggering file input:', error);
                // Fallback: try direct click
                fileInput.click();
            }
        });
    }
    
    // Track if upload is in progress to prevent duplicate uploads
    let isUploading = false;
    
    // File input change
    fileInput.addEventListener('change', (e) => {
        console.log('File input changed, files:', e.target.files);
        if (e.target.files && e.target.files.length > 0) {
            console.log('Files selected:', e.target.files.length);
            handleFileUpload(e.target.files);
        } else {
            console.warn('No files selected or files array is empty');
        }
    });
    
    // Also handle input event for better mobile support
    fileInput.addEventListener('input', (e) => {
        console.log('File input event triggered, files:', e.target.files);
        if (e.target.files && e.target.files.length > 0) {
            console.log('Files selected via input event:', e.target.files.length);
            handleFileUpload(e.target.files);
    
    async function handleFileUpload(files) {
        if (!files || files.length === 0) {
            showUploadMessage('No files selected. Please try again.', 'error');
            return;
        }
        
        const validFiles = Array.from(files).filter(file => {
            console.log('Validating file:', {
                name: file.name,
                type: file.type,
                size: file.size
            });
            
            // Check MIME type (case-insensitive check)
            const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'];
            const fileType = file.type ? file.type.toLowerCase() : '';
            const hasValidMimeType = validTypes.includes(fileType);
            
            // Also check file extension for mobile browsers that might not set MIME type correctly
            const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.JPG', '.JPEG', '.PNG', '.GIF', '.WEBP', '.BMP'];
            const fileName = file.name || '';
            const hasValidExtension = validExtensions.some(ext => fileName.endsWith(ext));
            
            // If MIME type is empty or not recognized, rely on extension
            const isValid = hasValidMimeType || (fileType === '' && hasValidExtension) || hasValidExtension;
            
            if (!isValid) {
                console.warn('File rejected:', file.name, 'Type:', file.type, 'Extension check:', hasValidExtension);
            }
            
            return isValid;
        });
        
        if (validFiles.length === 0) {
            showUploadMessage('Please select valid image files (JPG, PNG, GIF, WEBP, BMP). Some mobile browsers may require selecting images from the gallery.', 'error');
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
        
        // Check if mobile device - upload files sequentially for better reliability
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        if (isMobile && validFiles.length > 1) {
            // Sequential upload for mobile (more reliable)
            uploadFilesSequentially(validFiles);
        } else {
            // Batch upload for desktop (faster)
            uploadFilesBatch(validFiles);
        }
    }
    
    async function uploadFilesSequentially(files) {
        const totalFiles = files.length;
        let uploadedCount = 0;
        let failedCount = 0;
        const uploadedFiles = [];
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');
        const uploadProgress = document.getElementById('uploadProgress');
        const uploadedPreview = document.getElementById('uploadedPreview');
        const fileInput = document.getElementById('photoUpload');
        
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const fileNumber = i + 1;
            
            progressText.textContent = `Uploading ${fileNumber}/${totalFiles}...`;
            
            try {
                const result = await uploadSingleFile(file, i, totalFiles, uploadedCount, failedCount);
                if (result.success) {
                    uploadedCount++;
                    uploadedFiles.push(result.file);
                    const progress = ((uploadedCount + failedCount) / totalFiles) * 100;
                    progressFill.style.width = progress + '%';
                } else {
                    failedCount++;
                    console.error(`Failed to upload file ${fileNumber}:`, result.error);
                }
            } catch (error) {
                failedCount++;
                console.error(`Error uploading file ${fileNumber}:`, error);
            }
        }
        
        // Final status
        progressFill.style.width = '100%';
        if (uploadedCount > 0) {
            progressText.textContent = `Upload complete! ${uploadedCount} of ${totalFiles} uploaded`;
            showUploadMessage(`✅ Successfully uploaded ${uploadedCount} photo(s)!${failedCount > 0 ? ` (${failedCount} failed)` : ''}`, 'success');
            uploadedPreview.innerHTML = `<p class="uploaded-count">${uploadedCount} photo(s) uploaded</p>`;
            
            // Refresh the gallery if "Others" tab is active
            const activeTab = document.querySelector('.tab-btn.active');
            if (activeTab && activeTab.dataset.category === 'others') {
                setTimeout(() => {
                    initGallery();
                }, 1000);
            }
        } else {
            progressText.textContent = 'Upload failed';
            showUploadMessage(`❌ Failed to upload files. Please try again.`, 'error');
            isUploading = false; // Reset upload flag immediately on failure
        }
        
        // Hide progress after 2 seconds
        setTimeout(() => {
            uploadProgress.style.display = 'none';
            fileInput.value = ''; // Reset input
            if (!isUploading) {
                isUploading = false; // Ensure flag is reset
            }
        }, 2000);
    }
    
    function uploadSingleFile(file, fileIndex, totalFiles, currentUploaded, currentFailed) {
        return new Promise((resolve, reject) => {
            const formData = new FormData();
            formData.append('photos', file);
            const progressFill = document.getElementById('progressFill');
            
            const xhr = new XMLHttpRequest();
            
            // Track upload progress for single file
            xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable) {
                    const percentComplete = (e.loaded / e.total) * 100;
                    // Update progress within the current file's portion
                    const baseProgress = (currentUploaded + currentFailed) / totalFiles * 100;
                    const fileProgress = percentComplete / totalFiles;
                    progressFill.style.width = Math.min(baseProgress + fileProgress, 100) + '%';
                }
            });
            
            xhr.addEventListener('load', () => {
                if (xhr.status === 200) {
                    try {
                        const response = JSON.parse(xhr.responseText);
                        if (response.files && response.files.length > 0) {
                            resolve({ success: true, file: response.files[0] });
                        } else {
                            resolve({ success: false, error: 'No file in response' });
                        }
                    } catch (parseError) {
                        console.error('Error parsing response:', parseError);
                        resolve({ success: false, error: 'Invalid response' });
                    }
                } else {
                    try {
                        const error = JSON.parse(xhr.responseText);
                        resolve({ success: false, error: error.error || 'Upload failed' });
                    } catch (parseError) {
                        resolve({ success: false, error: `Server error (${xhr.status})` });
                    }
                }
            });
            
            xhr.addEventListener('error', (e) => {
                console.error('XHR error:', e);
                resolve({ success: false, error: 'Network error' });
            });
            
            xhr.addEventListener('timeout', () => {
                console.error('Upload timeout');
                resolve({ success: false, error: 'Upload timeout' });
            });
            
            // Set timeout for mobile (longer timeout for slower connections)
            xhr.timeout = 60000; // 1 minute per file
            
            xhr.open('POST', '/api/upload');
            xhr.send(formData);
        });
    }
    
    function uploadFilesBatch(files) {
        const formData = new FormData();
        files.forEach(file => {
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
                            isUploading = false; // Reset upload flag
                        }, 2000);
                    } catch (parseError) {
                        console.error('Error parsing response:', parseError);
                        showUploadMessage('❌ Upload response error', 'error');
                        uploadProgress.style.display = 'none';
                        isUploading = false; // Reset upload flag
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
                    isUploading = false; // Reset upload flag
                }
            });
            
            xhr.addEventListener('error', (e) => {
                console.error('XHR error:', e);
                showUploadMessage('❌ Network error. Please check your connection and try again.', 'error');
                uploadProgress.style.display = 'none';
                isUploading = false; // Reset upload flag
            });
            
            xhr.addEventListener('abort', () => {
                console.warn('Upload aborted');
                showUploadMessage('❌ Upload was cancelled. Please try again.', 'error');
                uploadProgress.style.display = 'none';
            });
            
            xhr.addEventListener('timeout', () => {
                console.error('Upload timeout');
                showUploadMessage('❌ Upload timed out. Please try again with smaller files or better connection.', 'error');
                uploadProgress.style.display = 'none';
            });
            
            // Set timeout for mobile (longer timeout for slower connections)
            xhr.timeout = 120000; // 2 minutes
            
            xhr.open('POST', '/api/upload');
            xhr.send(formData);
            
        } catch (error) {
            console.error('Upload error:', error);
            showUploadMessage('❌ Upload failed. Please try again.', 'error');
            uploadProgress.style.display = 'none';
            isUploading = false; // Reset upload flag
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
