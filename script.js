// Configuration
const CONFIG = {
    ENGAGEMENT_DATE: new Date('2026-01-28T00:00:00').getTime(),
    MARRIAGE_DATE: new Date(2026, 5, 18, 9, 30, 0).getTime(),
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
            name: 'Shree Narayana Mahall',
            address: 'Trichy, Tamil Nadu',
            lat: 10.8732209,
            lng: 78.7062234,
            mapLink: 'https://maps.app.goo.gl/aerwBkYg2dg1Xda67'
        }
    }
};

// Page loader
const PAGE_LOADER_MIN_MS = 700;
const PAGE_LOADER_MAX_MS = 15000;
let pageLoaderStartTime = Date.now();
let isPageLoaderHidden = false;

function setPageLoaderStatus(message) {
    const statusEl = document.getElementById('pageLoaderStatus');
    if (statusEl && message) {
        statusEl.textContent = message;
    }
}

function waitForFontsReady(timeoutMs = 5000) {
    if (!document.fonts?.ready) {
        return Promise.resolve();
    }
    return Promise.race([
        document.fonts.ready,
        new Promise((resolve) => setTimeout(resolve, timeoutMs))
    ]);
}

function waitForFirstHeaderImage(timeoutMs = 20000) {
    return new Promise((resolve) => {
        let isSettled = false;
        const finish = () => {
            if (isSettled) {
                return;
            }
            isSettled = true;
            resolve();
        };

        const getFirstImage = () =>
            document.querySelector('.header-slideshow-frame img.active') ||
            document.querySelector('.header-slideshow-frame img');

        const attachListeners = (img) => {
            if (!img) {
                return;
            }
            if (img.complete && img.naturalWidth) {
                finish();
                return;
            }
            if (img.dataset.loaderListen) {
                return;
            }
            img.dataset.loaderListen = '1';
            img.addEventListener('load', finish, { once: true });
            img.addEventListener('error', finish, { once: true });
        };

        attachListeners(getFirstImage());
        if (!getFirstImage()) {
            const frame = document.getElementById('headerSlideshow');
            if (frame) {
                const observer = new MutationObserver(() => {
                    const img = getFirstImage();
                    if (!img) {
                        return;
                    }
                    attachListeners(img);
                    if (isSettled) {
                        observer.disconnect();
                    }
                });
                observer.observe(frame, { childList: true, subtree: true });
                setTimeout(() => observer.disconnect(), timeoutMs);
            }
        }

        setTimeout(finish, timeoutMs);
    });
}

async function hidePageLoader() {
    if (isPageLoaderHidden) {
        return;
    }
    isPageLoaderHidden = true;

    const elapsed = Date.now() - pageLoaderStartTime;
    const remaining = Math.max(0, PAGE_LOADER_MIN_MS - elapsed);
    if (remaining > 0) {
        await new Promise((resolve) => setTimeout(resolve, remaining));
    }

    const loader = document.getElementById('pageLoader');
    document.documentElement.classList.remove('is-page-loading');
    document.body.classList.remove('is-page-loading');

    if (loader) {
        loader.classList.add('is-hidden');
        loader.setAttribute('aria-busy', 'false');
        window.setTimeout(() => loader.remove(), 550);
    }
}

function waitWithTimeout(promise, timeoutMs, taskLabel) {
    return Promise.race([
        promise,
        new Promise((resolve) => {
            setTimeout(() => {
                console.warn(`Page loader timeout: ${taskLabel}`);
                resolve();
            }, timeoutMs);
        })
    ]);
}

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
            setCountdownPhaseLabel('complete');
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

        setCountdownPhaseLabel(isEngagement ? 'engagement' : 'wedding');

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

/**
 * @param {'engagement' | 'wedding' | 'complete'} phase
 */
function setCountdownPhaseLabel(phase) {
    const el = document.getElementById('countdownLabel');
    if (!el) {
        return;
    }
    const header = translations.en?.header;
    if (!header) {
        return;
    }
    if (phase === 'engagement') {
        el.textContent = header.countdownEngagement || '';
    } else if (phase === 'wedding') {
        el.textContent = header.countdownWedding || '';
    } else {
        el.textContent = header.countdownComplete || '';
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
            
            return allImages;
        }
        
        // For other categories, fetch normally
        const response = await fetch(`/api/photos?category=${category}`);
        if (response.ok) {
            const data = await response.json();
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

async function fetchPhotos(category, page = 1, onRendered) {
    const loadingEl = document.getElementById('galleryLoading');
    const errorEl = document.getElementById('galleryError');
    const gridEl = document.getElementById('photoGrid');
    const paginationEl = document.getElementById('pagination');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const paginationInfo = document.getElementById('paginationInfo');

    loadingEl.style.display = 'block';
    errorEl.style.display = 'none';
    // Preserve grid height to prevent page jump when clearing (especially on mobile)
    const savedMinHeight = gridEl.offsetHeight;
    if (savedMinHeight > 0) {
        gridEl.style.minHeight = savedMinHeight + 'px';
    }
    gridEl.innerHTML = '';
    paginationEl.style.display = 'none';

    try {
        // Get all images from server
        const allImages = await getImagesList(category, currentSubCategory);
        loadingEl.style.display = 'none';
        
        if (allImages.length > 0) {
            // Shuffle photos for assorted layout
            const shuffledImages = [...allImages].sort(() => Math.random() - 0.5);
            
            // Calculate pagination
            const totalPages = Math.ceil(shuffledImages.length / IMAGES_PER_PAGE);
            const startIndex = (page - 1) * IMAGES_PER_PAGE;
            const endIndex = startIndex + IMAGES_PER_PAGE;
            const photos = shuffledImages.slice(startIndex, endIndex);

            // Build full image list URLs for modal navigation and store globally
            globalImageList = shuffledImages.map(img => {
                const imgData = typeof img === 'string' ? { filename: img, url: null } : img;
                return imgData.url || `photos/${category}/${imgData.filename}`;
            });
            
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
                
                // Find index in full shuffled list
                const globalIndex = globalImageList.indexOf(photoUrl);
                
                return `
                    <div class="photo-item">
                        <img src="${photoUrl}" alt="${photoAlt}" loading="lazy" decoding="async" onclick="openImageModal('${safeUrl}', globalImageList, ${globalIndex})" style="image-rendering: -webkit-optimize-contrast; image-rendering: crisp-edges; image-rendering: high-quality; cursor: pointer;">
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
            gridEl.style.minHeight = '';

            // Show pagination
            if (totalPages > 1) {
                paginationEl.style.display = 'flex';
                const pageText = translations.en?.gallery?.page || 'Page';
                const ofText = translations.en?.gallery?.of || 'of';
                const photosText = translations.en?.gallery?.photos || 'photos';
                paginationInfo.textContent = `${pageText} ${page} ${ofText} ${totalPages} (${shuffledImages.length} ${photosText})`;
                
                prevBtn.disabled = page === 1;
                nextBtn.disabled = page >= totalPages;

                const scrollToGalleryTop = () => {
                    const gallerySection = document.getElementById('gallery');
                    if (gallerySection) {
                        const navHeight = document.querySelector('.main-nav')?.offsetHeight || 0;
                        const top = gallerySection.offsetTop - navHeight;
                        window.scrollTo({ top, behavior: 'auto' });
                    }
                };

                prevBtn.onclick = () => {
                    if (page > 1) {
                        currentPage = page - 1;
                        scrollToGalleryTop();
                        fetchPhotos(category, currentPage);
                    }
                };

                nextBtn.onclick = () => {
                    if (page < totalPages) {
                        currentPage = page + 1;
                        scrollToGalleryTop();
                        fetchPhotos(category, currentPage);
                    }
                };
            }
            if (typeof onRendered === 'function') {
                onRendered();
            }
        } else {
            gridEl.style.minHeight = '';
            const noPhotosText = translations.en?.gallery?.noPhotos || 'No photos available to view';
            gridEl.innerHTML = `<div class="error" style="display: flex; align-items: center; justify-content: center; padding: 40px 20px; text-align: center; color: #8B0000; font-size: 1.2rem; min-height: 200px; width: 100%; margin: 0 auto;">${noPhotosText}</div>`;
        }
    } catch (error) {
        gridEl.style.minHeight = '';
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

    await fetchPhotos(currentCategory, currentPage);
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

// Header Slideshow — images loaded dynamically from photos/header/
const HEADER_IMAGE_FOLDER = 'header';
const HEADER_IMAGE_PATTERN = /\.(jpg|jpeg|png|webp|gif)$/i;

function resolveSitePath(relativePath) {
    const cleanPath = relativePath.replace(/^\//, '');
    if (window.location.protocol === 'file:') {
        return cleanPath;
    }
    return new URL(cleanPath, window.location.href).href;
}

function sortHeaderImageSources(sources) {
    return [...sources].sort((a, b) => {
        const aName = a.split('/').pop() || '';
        const bName = b.split('/').pop() || '';
        const aIsCompact = /^WIN_/i.test(aName);
        const bIsCompact = /^WIN_/i.test(bName);
        if (aIsCompact !== bIsCompact) {
            return aIsCompact ? -1 : 1;
        }
        return aName.localeCompare(bName, undefined, { numeric: true, sensitivity: 'base' });
    });
}

function handleHeaderImageError(img) {
    console.warn('Header image failed to load:', img?.src);
    if (!img) {
        return;
    }

    img.classList.add('header-slide-broken');
    img.style.display = 'none';

    const visibleImages = getVisibleHeaderSlideshowImages();
    if (visibleImages.length === 0) {
        document.querySelector('.header-section')?.classList.remove('header-has-slideshow');
        return;
    }

    if (img.classList.contains('active')) {
        visibleImages.forEach((slide) => slide.classList.remove('active'));
        visibleImages[0].classList.add('active');
        if (visibleImages[0].complete && visibleImages[0].naturalWidth) {
            adjustHeaderImageFit(visibleImages[0]);
            markHeaderHeroReady(visibleImages[0]);
        }
    }
}

window.handleHeaderImageError = handleHeaderImageError;

let currentHeaderImageIndex = 0;
let headerImages = [];
let headerSlideshowInterval = null;
let headerSlideshowStartTimer = null;

function clearHeaderSlideshowTimers() {
    if (headerSlideshowInterval) {
        clearInterval(headerSlideshowInterval);
        headerSlideshowInterval = null;
    }
    if (headerSlideshowStartTimer) {
        clearTimeout(headerSlideshowStartTimer);
        headerSlideshowStartTimer = null;
    }
}

function updateHeaderSlideshowAspectRatio(img) {
    const frame = document.getElementById('headerSlideshowFrame');
    if (!frame || !img?.naturalWidth || !img.naturalHeight) {
        return;
    }
    frame.style.setProperty('--header-slide-aspect', `${img.naturalWidth} / ${img.naturalHeight}`);
}

function adjustHeaderImageFit(img) {
    updateHeaderSlideshowAspectRatio(img);
}

window.adjustHeaderImageFit = adjustHeaderImageFit;

function markHeaderHeroReady(img) {
    const headerSection = document.querySelector('.header-section');
    const frame = document.getElementById('headerSlideshowFrame');
    const activeImg = frame?.querySelector('img.active') || frame?.querySelector('img');

    if (!headerSection || !activeImg || (img && img !== activeImg)) {
        return;
    }

    if (headerSection.classList.contains('header-hero-ready')) {
        return;
    }

    headerSection.classList.remove('header-pending-hero');
    headerSection.classList.add('header-hero-ready');
    replayHeaderTextAnimations();
}

window.markHeaderHeroReady = markHeaderHeroReady;

function populateHeaderSlideshow(imageSources) {
    const slideshowEl = document.getElementById('headerSlideshow');
    const headerSection = document.querySelector('.header-section');
    const sources = (imageSources || []).filter(Boolean);

    if (!slideshowEl || sources.length === 0) {
        clearHeaderSlideshowTimers();
        headerSection?.classList.remove('header-has-slideshow');
        return false;
    }

    clearHeaderSlideshowTimers();

    headerImages = sources.map((src) => src.split('/').pop());

    const sortedSources = sortHeaderImageSources(sources);

    const imagesHtml = sortedSources.map((src, index) => {
        const imageUrl = resolveSitePath(src);
        const fetchPriority = index === 0 ? ' fetchpriority="high"' : '';
        return `<img src="${imageUrl}" alt="Header ${index + 1}" class="${index === 0 ? 'active' : ''}" loading="eager" decoding="async" sizes="100vw"${fetchPriority} onerror="handleHeaderImageError(this)" onload="adjustHeaderImageFit(this); markHeaderHeroReady(this)">`;
    }).join('');

    slideshowEl.innerHTML = `<div class="header-slideshow-frame" id="headerSlideshowFrame">${imagesHtml}</div>`;

    headerSection?.classList.remove('header-hero-ready');
    headerSection?.classList.add('header-has-slideshow');

    const firstImg = slideshowEl.querySelector('.header-slideshow-frame img');
    if (firstImg?.complete && firstImg.naturalWidth) {
        adjustHeaderImageFit(firstImg);
        markHeaderHeroReady(firstImg);
    }

    headerSlideshowStartTimer = setTimeout(() => {
        headerSlideshowStartTimer = null;
        startHeaderSlideshow();
    }, 300);
    return true;
}

function buildHeaderImageSources(folder, filenames) {
    return (filenames || [])
        .filter((file) => typeof file === 'string' && HEADER_IMAGE_PATTERN.test(file))
        .map((file) => `photos/${folder}/${encodeURIComponent(file)}`);
}

async function parseHeaderImagesResponse(response) {
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
        return null;
    }
    return response.json();
}

async function fetchHeaderImagesFromApi() {
    const response = await fetch(resolveSitePath('api/header-images'));
    if (!response.ok) {
        console.warn('Failed to fetch header images:', response.status, response.statusText);
        return [];
    }

    const data = await parseHeaderImagesResponse(response);
    if (!data) {
        console.warn('Header images API did not return JSON. Is the server running?');
        return [];
    }

    const folderName = data.folder || HEADER_IMAGE_FOLDER;
    const sources = buildHeaderImageSources(folderName, data.images);
    if (sources.length > 0 && folderName !== 'none') {
        return sources;
    }
    return [];
}

async function fetchHeaderImagesFromManifest() {
    const manifestResponse = await fetch(resolveSitePath(`photos/${HEADER_IMAGE_FOLDER}/manifest.json`));
    if (!manifestResponse.ok) {
        return [];
    }

    const manifest = await manifestResponse.json();
    const folderName = manifest.folder || HEADER_IMAGE_FOLDER;
    return buildHeaderImageSources(folderName, manifest.images);
}

async function fetchHeaderImageSources() {
    if (window.location.protocol !== 'file:') {
        try {
            const apiSources = await fetchHeaderImagesFromApi();
            if (apiSources.length > 0) {
                return apiSources;
            }
        } catch (error) {
            console.warn('Error loading header images from API:', error.message);
        }
    }

    try {
        const manifestSources = await fetchHeaderImagesFromManifest();
        if (manifestSources.length > 0) {
            return manifestSources;
        }
    } catch (error) {
        console.warn('Error loading header manifest.json:', error.message);
    }

    return [];
}

async function initHeaderSlideshow() {
    const sources = await fetchHeaderImageSources();

    if (sources.length === 0) {
        console.warn('No images found in photos/header/. Add photos and restart the server.');
        document.querySelector('.header-section')?.classList.remove('header-has-slideshow');
        return;
    }

    populateHeaderSlideshow(sources);
    await waitForFirstHeaderImage();
}

function getVisibleHeaderSlideshowImages() {
    return Array.from(document.querySelectorAll('.header-slideshow-frame img')).filter((img) =>
        !img.classList.contains('header-slide-broken') && img.style.display !== 'none'
    );
}

function startHeaderSlideshow() {
    clearHeaderSlideshowTimers();

    const images = getVisibleHeaderSlideshowImages();
    
    if (images.length === 0) {
        document.querySelector('.header-section')?.classList.remove('header-has-slideshow');
        return;
    }
    
    // If only one image, just show it
    if (images.length <= 1) {
        if (images[0]) {
            images[0].classList.add('active');
            if (images[0].complete && images[0].naturalWidth) {
                updateHeaderSlideshowAspectRatio(images[0]);
            }
        }
        return;
    }
    
    if (images[0]?.complete && images[0].naturalWidth) {
        updateHeaderSlideshowAspectRatio(images[0]);
    }
    
    // Ensure first image is visible and others are hidden
    images.forEach((img, idx) => {
        if (idx === 0) {
            img.classList.add('active');
        } else {
            img.classList.remove('active');
        }
    });
    
    currentHeaderImageIndex = 0;
    
    // Start cycling through images
    const advanceHeaderSlide = () => {
        const currentImages = getVisibleHeaderSlideshowImages();

        if (currentImages.length <= 1) {
            clearHeaderSlideshowTimers();
            return;
        }

        const currentActive = document.querySelector('.header-slideshow-frame img.active');
        const currentIndex = currentImages.indexOf(currentActive);
        const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % currentImages.length : 0;

        currentImages.forEach((img) => img.classList.remove('active'));
        currentHeaderImageIndex = nextIndex;

        const nextImage = currentImages[nextIndex];
        if (nextImage) {
            nextImage.classList.add('active');
            if (nextImage.complete && nextImage.naturalWidth) {
                updateHeaderSlideshowAspectRatio(nextImage);
            }
        }
    };

    headerSlideshowInterval = setInterval(advanceHeaderSlide, 4000);
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

        const selectedUrls = selected.map(p => p.url);
        // Store in global variable for modal navigation
        window.engagementPreviewImages = selectedUrls;
        
        previewGrid.innerHTML = selected.map((photo, index) => `
            <div class="gallery-preview-item" onclick="openImageModal('${photo.url}', window.engagementPreviewImages || [], ${index})" style="cursor: pointer;">
                <img src="${photo.url}" alt="${photo.filename}" loading="lazy" decoding="async">
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
                const navHeight = document.querySelector('.main-nav')?.offsetHeight || 0;
                const targetPosition = targetElement.offsetTop - navHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
                
                // Don't hide menu on mobile - keep it always visible
            }
        });
    });
    
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
            }
        });
    }

    // Update active nav link on scroll
    window.addEventListener('scroll', () => {
        const sections = document.querySelectorAll('section[id]');
        const navHeight = document.querySelector('.main-nav')?.offsetHeight || 0;
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
    
    return isMobileDevice;
}

function updateNavHeight() {
    const mainNav = document.getElementById('mainNav');
    if (!mainNav) {
        return;
    }
    const height = Math.ceil(mainNav.getBoundingClientRect().height);
    document.documentElement.style.setProperty('--mobile-nav-height', `${height}px`);
}

function updateMobileNavHeight() {
    updateNavHeight();
}

    // Initialize everything
// Language Translations
const translations = {
    en: {
        nav: {
            details: 'Schedule & details',
            journey: 'Wedding Journey'
        },
        header: {
            coupleNames: 'We Are Getting Married',
            groom: 'Chennai Paiyan',
            weds: 'Weds',
            bride: 'Trichy Ponnu',
            saveTheDate: 'SAVE THE DATE',
            countdownEngagement: 'Counting down to our engagement',
            countdownWedding: 'Counting down to our wedding',
            countdownComplete: 'Thank you for being part of our journey',
            viewPhotos: 'View photos'
        },
        schedule: {
            title: 'Schedule',
            engagementHeading: 'Engagement',
            engagementWhen: '28 January 2026 Â· Hotel Padmavathi, Palpannai, Trichy',
            engagementNote: 'Update this line with muhurtham and reception timings for guests.',
            weddingHeading: 'Wedding',
            weddingWhen: '18 June 2026 Â· Shree Narayana Mahall, Trichy',
            weddingNote: 'Update with your ceremony and reception schedule.'
        },
        guestInfo: {
            title: 'Celebration details',
            practicalTitle: 'For our guests',
            dressCodeTitle: 'Dress code',
            dressCode: 'Traditional Indian festive wear â€” please wear your joyous best.',
            parkingTitle: 'Parking',
            parking: 'Parking is available at both venues; follow signage and volunteer directions.',
            landmarkTitle: 'Landmark',
            landmark: 'Use the map links above for directions; add a well-known nearby place here if it helps elders.',
            contactTitle: 'Contact',
            contact: 'For day-of questions, please contact the families (add phone numbers or WhatsApp).'
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
            paragraph2: 'From romantic dinners at Roof Top Restaurant to exploring the wonders of Birds Park, from thrilling bike rides to cozy car rides, and even trying ice skating togetherâ€”every moment became a cherished memory.',
            paragraph3: 'As we take this beautiful step forward, we invite you to be part of our celebration. Your presence and blessings make our special day even more meaningful.',
            brideName: 'Madhumitha',
            brideIntro: 'With grace and joy, she fills every chapter of our story. We cannot wait to celebrate surrounded by everyone we love.'
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
            title: 'Photo Wall',
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
            openMaps: '\u{1F4CD} Open in Google Maps',
            mapNote: 'Interactive map - Click and drag to explore'
        },
        calendar: {
            title: 'Save the Date',
            subtitle: 'Tap a highlighted date to explore our celebration week',
            hint: 'Tap a date to see event details',
            addToCalendar: 'Add wedding to calendar',
            googleCalendarWeddingTitle: 'Praveenraj and Madhumitha Wedding',
            viewVenue: 'View venue',
            monthNames: ['January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'],
            weekdays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
            eventIcons: {
                dinner: '\u{1F37D}\uFE0F',
                mehendi: '\u{1F4AE}',
                reception: '\u{1F942}',
                wedding: '\u{1F497}',
                postwedding: '\u{1F389}'
            }
        },
        journey: {
            title: 'Wedding Planner',
            subtitle: 'Five beautiful days of love, tradition, and celebration await you.',
            routeTitle: 'Your Route to Celebrate With Us',
            routeTitleNamed: '{name}, Your Route to Us',
            routeGreeting: 'We mapped the way from your city to our four-day celebration in Trichy.',
            routeGreetingNamed: 'Hey {name}! Here is your path from {from} to our wedding week.',
            routeStart: 'You are here',
            routeTravel: 'On the way',
            routeDestination: 'Celebrate with us',
            routeDestVenue: 'Shree Narayana Mahall Â· Trichy',
            routeDestNote: 'Five days of love, music, and moments â€” 15â€“19 June 2026',
            routeOpenMaps: 'Open your route in Google Maps',
            closing: 'Your presence will make our celebration more special, memorable, and complete. We cannot wait to celebrate this beautiful journey with you.',
            events: {
                haldi: {
                    title: 'Haldi',
                    date: '15 June 2026',
                    description: 'An evening filled with colors, laughter, music, turmeric blessings, and joyful moments shared with family and friends.'
                },
                sangeeth: {
                    title: 'Sangeeth Night',
                    date: '16 June 2026',
                    description: 'A night of dance, music, celebration, performances, and unforgettable memories as both families come together in happiness.'
                },
                mehendi: {
                    title: 'Mehandi & Sangeeth Night',
                    date: '16 June 2026',
                    description: 'An evening of beautiful henna artistry, vibrant traditions, music, and joyful moments with family and friends.'
                },
                dinner: {
                    title: 'Dinner Party',
                    date: '15 June 2026',
                    description: 'Join us for a wonderful dinner party with haldi and mehendi celebrations, delicious food, music, and joyful moments with family and friends.'
                },
                reception: {
                    title: 'Wedding Reception',
                    date: '17 June 2026',
                    description: 'Join us for an elegant evening reception filled with love, blessings, heartfelt conversations, delicious dinner, and grand celebrations.'
                },
                wedding: {
                    title: 'Wedding Ceremony',
                    date: '18 June 2026',
                    description: 'The sacred union of two souls, celebrated with traditions, blessings, rituals, and the beginning of a beautiful forever together.'
                },
                postwedding: {
                    title: 'Postwedding Party',
                    date: '19 June 2026',
                    description: 'Celebrate with us after the wedding â€” food, music, laughter, and joyful moments with family and friends.'
                }
            },
        },
        liveStream: {
            title: 'Live Streaming',
            description: 'Watch our live celebration on Facebook.',
            viewLive: 'View Live'
        },
        footer: {
            title: 'Forever & Always',
            madeWithLove: 'MADE WITH LOVE',
            developedBy: 'Designed and Developed by Praveenraj Madhumitha'
        }
    }
};

function replayHeaderTextAnimations() {
    const headerSection = document.querySelector('.header-section.header-has-slideshow');
    if (!headerSection) {
        return;
    }
    headerSection.querySelectorAll('.header-anim').forEach((element) => {
        element.style.animation = 'none';
        void element.offsetWidth;
        element.style.animation = '';
    });
}

// Apply English copy to all data-i18n elements
function applyTranslations() {
    document.documentElement.lang = 'en';
    
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        const keys = key.split('.');
        let translation = translations.en;
        
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

    document.querySelectorAll('[data-i18n-title]').forEach((element) => {
        const key = element.getAttribute('data-i18n-title');
        const keys = key.split('.');
        let translation = translations.en;
        for (const k of keys) {
            translation = translation?.[k];
        }
        if (typeof translation === 'string') {
            element.setAttribute('title', translation);
        }
    });

    updateCountdown();
    renderFriendRouteMap();
    renderWeddingCalendar();
    replayHeaderTextAnimations();
    if (selectedCalendarDay !== null) {
        showCalendarEventPanel(selectedCalendarDay);
    }

    // Refresh gallery to update dynamic text
    if (typeof initGallery === 'function' && document.getElementById('photoGrid')) {
        setTimeout(() => {
            initGallery();
        }, 100);
    }
}

function initLanguage() {
    localStorage.removeItem('language');
    applyTranslations();
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

function getRouteLabelTemplates() {
    const journey = translations.en?.journey || {};
    return {
        en: {
            routeTitle: journey.routeTitle,
            routeTitleNamed: journey.routeTitleNamed,
            routeGreeting: journey.routeGreeting,
            routeGreetingNamed: journey.routeGreetingNamed,
            routeStart: journey.routeStart,
            routeTravel: journey.routeTravel,
            routeDestination: journey.routeDestination,
            routeDestVenue: journey.routeDestVenue,
            routeDestNote: journey.routeDestNote,
            routeOpenMaps: journey.routeOpenMaps
        }
    };
}

function renderFriendRouteMap() {
    const friendRouteApi = window.WeddingInvite?.friendRoute;
    const routeSection = document.getElementById('journeyRoute');
    if (!friendRouteApi || !routeSection) {
        return;
    }

    const routeKey = friendRouteApi.resolveFriendRouteKey(
        new URLSearchParams(window.location.search)
    );
    const view = friendRouteApi.getFriendRouteView(
        routeKey,
        'en',
        getRouteLabelTemplates()
    );

    const setText = (id, text) => {
        const el = document.getElementById(id);
        if (el && text) {
            el.textContent = text;
        }
    };

    setText('journeyRouteTitle', view.title);
    setText('journeyRouteGreeting', view.greeting);
    setText('journeyRouteStartLabel', view.startLabel);
    setText('journeyRouteFromCity', view.fromCity);
    setText('journeyRouteFromNote', view.fromNote);
    setText('journeyRouteTravelLabel', view.travelLabel);
    setText('journeyRouteTravelNote', view.travel);
    setText('journeyRouteDestLabel', view.destinationLabel);
    setText('journeyRouteDestVenue', view.destinationVenue);
    setText('journeyRouteDestNote', view.destinationNote);

    const mapsLink = document.getElementById('journeyRouteMapsLink');
    if (mapsLink) {
        mapsLink.href = view.mapsUrl;
        mapsLink.textContent = view.openMapsLabel;
    }

}

const CALENDAR_EVENT_ORDER = ['dinner', 'mehendi', 'reception', 'wedding', 'postwedding'];
const CALENDAR_EVENT_DAYS = {
    dinner: 15,
    mehendi: 16,
    reception: 17,
    wedding: 18,
    postwedding: 19
};

let selectedCalendarDay = null;
let weddingCalendarBound = false;

function getCalendarCopy() {
    return translations.en.calendar;
}

function getCalendarEventMap() {
    const journeyEvents = translations.en.journey.events;
    const map = {};
    CALENDAR_EVENT_ORDER.forEach((eventKey) => {
        const day = CALENDAR_EVENT_DAYS[eventKey];
        const event = journeyEvents[eventKey];
        if (event && day) {
            map[day] = { key: eventKey, ...event };
        }
    });
    return map;
}

function formatCalendarPanelDate(day, monthIndex, year) {
    const monthNames = getCalendarCopy().monthNames || translations.en.calendar.monthNames;
    return `${day} ${monthNames[monthIndex]} ${year}`;
}

function showCalendarEventPanel(day) {
    const panel = document.getElementById('calendarEventPanel');
    const eventMap = getCalendarEventMap();
    const event = eventMap[day];
    if (!panel || !event) {
        return;
    }

    const weddingDate = new Date(CONFIG.MARRIAGE_DATE);
    const year = weddingDate.getFullYear();
    const month = weddingDate.getMonth();

    document.getElementById('calendarPanelDate').textContent =
        formatCalendarPanelDate(day, month, year);
    document.getElementById('calendarPanelTitle').textContent = event.title || '';
    panel.hidden = false;
    selectedCalendarDay = day;

    document.querySelectorAll('.wedding-calendar-day--event').forEach((cell) => {
        const cellDay = Number(cell.dataset.day);
        cell.classList.toggle('wedding-calendar-day--selected', cellDay === day);
    });
}

function hideCalendarEventPanel() {
    const panel = document.getElementById('calendarEventPanel');
    if (panel) {
        panel.hidden = true;
    }
    selectedCalendarDay = null;
    document.querySelectorAll('.wedding-calendar-day--selected').forEach((cell) => {
        cell.classList.remove('wedding-calendar-day--selected');
    });
}

function getGoogleCalendarWeddingTitle() {
    const calendarCopy = getCalendarCopy();
    return calendarCopy.googleCalendarWeddingTitle
        || translations.en.calendar.googleCalendarWeddingTitle;
}

function buildWeddingGoogleCalendarUrl() {
    const utils = globalThis.WeddingCalendarUtils;
    const weddingDate = new Date(CONFIG.MARRIAGE_DATE);
    const startDate = new Date(weddingDate.getFullYear(), weddingDate.getMonth(), weddingDate.getDate());
    const endDateExclusive = new Date(startDate);
    endDateExclusive.setDate(endDateExclusive.getDate() + 1);
    const event = getCalendarEventMap()[CALENDAR_EVENT_DAYS.wedding];
    const location = CONFIG.LOCATIONS.marriage;
    const calendarTitle = getGoogleCalendarWeddingTitle();

    if (utils && typeof utils.buildGoogleCalendarUrl === 'function') {
        return utils.buildGoogleCalendarUrl({
            title: calendarTitle,
            startDate,
            endDateExclusive,
            details: event?.description || '',
            location: `${location.name}, ${location.address}`
        });
    }

    const pad = (n) => String(n).padStart(2, '0');
    const format = (d) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
    const params = new URLSearchParams({
        action: 'TEMPLATE',
        text: calendarTitle,
        dates: `${format(startDate)}/${format(endDateExclusive)}`,
        details: event?.description || '',
        location: `${location.name}, ${location.address}`
    });
    return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function bindWeddingCalendarInteractions() {
    if (weddingCalendarBound) {
        return;
    }
    weddingCalendarBound = true;

    const container = document.getElementById('weddingCalendar');
    if (container) {
        container.addEventListener('click', (e) => {
            const cell = e.target.closest('.wedding-calendar-day--event');
            if (!cell) {
                return;
            }
            const day = Number(cell.dataset.day);
            if (day) {
                showCalendarEventPanel(day);
            }
        });
    }

    const closeBtn = document.getElementById('calendarPanelClose');
    if (closeBtn) {
        closeBtn.addEventListener('click', hideCalendarEventPanel);
    }

    const addBtn = document.getElementById('addToCalendarBtn');
    if (addBtn) {
        addBtn.addEventListener('click', () => {
            window.open(buildWeddingGoogleCalendarUrl(), '_blank', 'noopener,noreferrer');
        });
    }
}

function renderWeddingCalendar() {
    const container = document.getElementById('weddingCalendar');
    if (!container) {
        return;
    }

    const weddingDate = new Date(CONFIG.MARRIAGE_DATE);
    const year = weddingDate.getFullYear();
    const month = weddingDate.getMonth();
    const weddingDay = weddingDate.getDate();
    const calendarCopy = getCalendarCopy();
    const monthNames = calendarCopy.monthNames || translations.en.calendar.monthNames;
    const weekdays = calendarCopy.weekdays || translations.en.calendar.weekdays;
    const icons = calendarCopy.eventIcons || translations.en.calendar.eventIcons;
    const eventMap = getCalendarEventMap();

    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    let daysHtml = '';
    for (let i = 0; i < firstDayOfMonth; i += 1) {
        daysHtml += '<div class="wedding-calendar-day wedding-calendar-day--empty" aria-hidden="true"></div>';
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
        const event = eventMap[day];
        if (event) {
            const isWeddingDay = day === weddingDay;
            const isSelected = selectedCalendarDay === day;
            const icon = icons[event.key] || '\u{1F4C5}';
            const ariaLabel = `${monthNames[month]} ${day}, ${year} - ${event.title}`;
            const weddingClass = isWeddingDay ? ' wedding-calendar-day--wedding' : '';
            const selectedClass = isSelected ? ' wedding-calendar-day--selected' : '';
            const ariaCurrent = isSelected ? ' aria-current="date"' : '';
            daysHtml += `
                <button type="button" class="wedding-calendar-day wedding-calendar-day--event wedding-calendar-day--${event.key}${weddingClass}${selectedClass}"
                    data-day="${day}" aria-label="${ariaLabel}"${ariaCurrent}>
                    <span class="calendar-day-emoji" aria-hidden="true">${icon}</span>
                    <span class="calendar-day-num">${day}</span>
                </button>`;
        } else {
            daysHtml += `<div class="wedding-calendar-day" role="gridcell">${day}</div>`;
        }
    }

    const weekdaysHtml = weekdays.map((label) =>
        `<div class="wedding-calendar-weekday">${label}</div>`
    ).join('');

    container.innerHTML = `
        <div class="wedding-calendar-header">
            <h3 class="wedding-calendar-month">${monthNames[month]} ${year}</h3>
        </div>
        <div class="wedding-calendar-weekdays" role="row">${weekdaysHtml}</div>
        <div class="wedding-calendar-grid" role="grid">${daysHtml}</div>
    `;
}

function initWeddingCalendar() {
    if (!document.getElementById('weddingCalendar')) {
        return;
    }
    bindWeddingCalendarInteractions();
    renderWeddingCalendar();
    showCalendarEventPanel(CALENDAR_EVENT_DAYS.wedding);
}

function initWeddingJourney() {
    renderFriendRouteMap();

    const animatedItems = document.querySelectorAll('[data-journey-animate]');
    if (!animatedItems.length) {
        return;
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.18,
        rootMargin: '0px 0px -30px 0px'
    });

    animatedItems.forEach((item) => observer.observe(item));
}

document.addEventListener('DOMContentLoaded', async () => {
    pageLoaderStartTime = Date.now();
    document.body.classList.add('is-page-loading');

    try {
        setPageLoaderStatus('Loading celebration details…');
        initLanguage();

        const heroPhotosBtn = document.getElementById('heroPhotosBtn');
        if (heroPhotosBtn) {
            heroPhotosBtn.addEventListener('click', (e) => {
                e.preventDefault();
                scrollToGallery();
            });
        }

        detectDevice();
        updateNavHeight();
        window.addEventListener('load', updateNavHeight);
        window.addEventListener('resize', updateNavHeight);

        const mainNav = document.getElementById('mainNav');
        if (mainNav) {
            mainNav.classList.remove('menu-closed');
            document.body.classList.remove('menu-closed');
        }

        setPageLoaderStatus('Preparing to invite you to the biggest celebration of our lives!🎉');
        await waitWithTimeout(
            Promise.all([
                waitForFontsReady(),
                initHeaderSlideshow()
            ]),
            PAGE_LOADER_MAX_MS,
            'header and fonts'
        );

        setPageLoaderStatus('Preparing to invite you to the biggest celebration of our lives!🎉');
        await waitWithTimeout(initGallery(), PAGE_LOADER_MAX_MS, 'gallery');

        startCountdown();
        initLocationTabs();
        initNavigation();
        initWeddingCalendar();
        initWeddingJourney();
        updateCountdown();
        updateMapLocation('marriage');
        initPhotoUpload();
        initImageModal();

        window.staticEngagementImages = [
            
        ];
    } catch (error) {
        console.error('Error while initializing page:', error);
    } finally {
        await hidePageLoader();
    }

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
            updateNavHeight();
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
    
    // Upload button click
    if (uploadBtn) {
        uploadBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
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
        if (e.target.files && e.target.files.length > 0) {
            handleFileUpload(e.target.files);
        }
        // Reset input value after processing to allow selecting same files again
        setTimeout(() => {
            e.target.value = '';
        }, 100);
    });
    
    async function handleFileUpload(files) {
        // Prevent duplicate uploads
        if (isUploading) {
            return;
        }
        
        if (!files || files.length === 0) {
            showUploadMessage('No files selected. Please try again.', 'error');
            return;
        }
        
        isUploading = true;
        
        const validFiles = Array.from(files).filter(file => {
            // Check MIME type (case-insensitive check)
            const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'];
            const fileType = file.type ? file.type.toLowerCase() : '';
            const hasValidMimeType = validTypes.includes(fileType);
            
            // Also check file extension for mobile browsers that might not set MIME type correctly
            const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.JPG', '.JPEG', '.PNG', '.GIF', '.WEBP', '.BMP'];
            const fileName = file.name || '';
            const hasValidExtension = validExtensions.some(ext => fileName.endsWith(ext));
            
            // If MIME type is empty or not recognized, rely on extension
            return hasValidMimeType || (fileType === '' && hasValidExtension) || hasValidExtension;
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
                    // File upload failed
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
            showUploadMessage(`âœ… Successfully uploaded ${uploadedCount} photo(s)!${failedCount > 0 ? ` (${failedCount} failed)` : ''}`, 'success');
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
            showUploadMessage(`âŒ Failed to upload files. Please try again.`, 'error');
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
                if (xhr.status === 200) {
                    try {
                        const response = JSON.parse(xhr.responseText);
                        progressFill.style.width = '100%';
                        progressText.textContent = 'Upload complete!';
                        
                        showUploadMessage(`âœ… Successfully uploaded ${response.files.length} photo(s)!`, 'success');
                        
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
                        showUploadMessage('âŒ Upload response error', 'error');
                        uploadProgress.style.display = 'none';
                        isUploading = false; // Reset upload flag
                    }
                } else {
                    try {
                        const error = JSON.parse(xhr.responseText);
                        showUploadMessage(`âŒ Upload failed: ${error.error || 'Unknown error'}`, 'error');
                    } catch (parseError) {
                        showUploadMessage(`âŒ Upload failed: Server error (${xhr.status})`, 'error');
                    }
                    uploadProgress.style.display = 'none';
                    isUploading = false; // Reset upload flag
                }
            });
            
            xhr.addEventListener('error', (e) => {
                showUploadMessage('âŒ Network error. Please check your connection and try again.', 'error');
                uploadProgress.style.display = 'none';
                isUploading = false; // Reset upload flag
            });
            
            xhr.addEventListener('abort', () => {
                showUploadMessage('âŒ Upload was cancelled. Please try again.', 'error');
                uploadProgress.style.display = 'none';
                isUploading = false; // Reset upload flag
            });
            
            xhr.addEventListener('timeout', () => {
                console.error('Upload timeout');
                showUploadMessage('âŒ Upload timed out. Please try again with smaller files or better connection.', 'error');
                uploadProgress.style.display = 'none';
                isUploading = false; // Reset upload flag
            });
            
            // Set timeout for mobile (longer timeout for slower connections)
            xhr.timeout = 120000; // 2 minutes
            
            xhr.open('POST', '/api/upload');
            xhr.send(formData);
            
        } catch (error) {
            console.error('Upload error:', error);
            showUploadMessage('âŒ Upload failed. Please try again.', 'error');
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
    } catch (error) {
        console.error('Error downloading image:', error);
        // Fallback: open image in new tab if download fails
        window.open(imageUrl, '_blank');
    }
}

// Make downloadImage available globally
window.downloadImage = downloadImage;

// Image Modal Popup
let currentImageIndex = -1;
let currentImageList = [];
let globalImageList = []; // Store current gallery image list for modal navigation

function openImageModal(imageUrl, imageList = null, currentIndex = -1) {
    const modal = document.getElementById('imageModal');
    const modalImage = document.getElementById('modalImage');
    
    if (!modal || !modalImage) return;
    
    // Set the image source
    modalImage.src = imageUrl;
    
    // Store image list and current index for navigation
    if (imageList && imageList.length > 0) {
        currentImageList = imageList;
        currentImageIndex = currentIndex >= 0 ? currentIndex : imageList.findIndex(img => {
            const imgUrl = typeof img === 'string' ? img : (img.url || img.src);
            return imgUrl === imageUrl;
        });
    } else {
        currentImageList = [imageUrl];
        currentImageIndex = 0;
    }
    
    // Show modal
    modal.classList.add('active');
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
    
    // Update navigation buttons visibility
    updateModalNavigation();
}

function closeImageModal() {
    const modal = document.getElementById('imageModal');
    if (!modal) return;
    
    modal.classList.remove('active');
    document.body.style.overflow = ''; // Restore scrolling
    currentImageList = [];
    currentImageIndex = -1;
}

function showNextImage() {
    if (currentImageList.length === 0 || currentImageIndex < 0) return;
    
    currentImageIndex = (currentImageIndex + 1) % currentImageList.length;
    const nextImage = currentImageList[currentImageIndex];
    const imageUrl = typeof nextImage === 'string' ? nextImage : (nextImage.url || nextImage.src);
    
    const modalImage = document.getElementById('modalImage');
    if (modalImage) {
        modalImage.src = imageUrl;
        updateModalNavigation();
    }
}

function showPrevImage() {
    if (currentImageList.length === 0 || currentImageIndex < 0) return;
    
    currentImageIndex = currentImageIndex === 0 ? currentImageList.length - 1 : currentImageIndex - 1;
    const prevImage = currentImageList[currentImageIndex];
    const imageUrl = typeof prevImage === 'string' ? prevImage : (prevImage.url || prevImage.src);
    
    const modalImage = document.getElementById('modalImage');
    if (modalImage) {
        modalImage.src = imageUrl;
        updateModalNavigation();
    }
}

function updateModalNavigation() {
    const prevBtn = document.getElementById('modalPrev');
    const nextBtn = document.getElementById('modalNext');
    
    // Show navigation buttons only if there are multiple images
    if (currentImageList.length > 1) {
        if (prevBtn) prevBtn.style.display = 'flex';
        if (nextBtn) nextBtn.style.display = 'flex';
    } else {
        if (prevBtn) prevBtn.style.display = 'none';
        if (nextBtn) nextBtn.style.display = 'none';
    }
}

// Initialize modal event listeners
function initImageModal() {
    const modal = document.getElementById('imageModal');
    const modalClose = document.getElementById('modalClose');
    const modalPrev = document.getElementById('modalPrev');
    const modalNext = document.getElementById('modalNext');
    const modalImage = document.getElementById('modalImage');
    
    if (!modal) return;
    
    // Close modal on close button click
    if (modalClose) {
        modalClose.addEventListener('click', closeImageModal);
    }
    
    // Close modal on background click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeImageModal();
        }
    });
    
    // Close modal on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeImageModal();
        }
    });
    
    // Navigation buttons
    if (modalPrev) {
        modalPrev.addEventListener('click', (e) => {
            e.stopPropagation();
            showPrevImage();
        });
    }
    
    if (modalNext) {
        modalNext.addEventListener('click', (e) => {
            e.stopPropagation();
            showNextImage();
        });
    }
    
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (!modal.classList.contains('active')) return;
        
        if (e.key === 'ArrowLeft') {
            e.preventDefault();
            showPrevImage();
        } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            showNextImage();
        }
    });
    
    // Prevent modal image click from closing modal
    if (modalImage) {
        modalImage.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }
}

// Make functions available globally
window.openImageModal = openImageModal;
window.closeImageModal = closeImageModal;

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (timerInterval) clearInterval(timerInterval);
});
