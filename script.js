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
    const header = translations[currentLanguage]?.header;
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
                const pageText = translations[currentLanguage]?.gallery?.page || 'Page';
                const ofText = translations[currentLanguage]?.gallery?.of || 'of';
                const photosText = translations[currentLanguage]?.gallery?.photos || 'photos';
                paginationInfo.textContent = `${pageText} ${page} ${ofText} ${totalPages} (${shuffledImages.length} ${photosText})`;
                
                prevBtn.disabled = page === 1;
                nextBtn.disabled = page >= totalPages;

                const scrollToGalleryTop = () => {
                    const gallerySection = document.getElementById('gallery');
                    if (gallerySection) {
                        const isMobile = document.body.classList.contains('mobile-device');
                        const navHeight = isMobile ? (document.querySelector('.main-nav')?.offsetHeight || 0) : 0;
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
            const noPhotosText = translations[currentLanguage]?.gallery?.noPhotos || 'No photos available to view';
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

function adjustHeaderImageFit(img) {
    if (!img || window.innerWidth > 767) {
        return;
    }
    const isLandscape = img.naturalWidth > img.naturalHeight;
    img.style.objectPosition = isLandscape ? 'center 35%' : 'center center';
}

async function initHeaderSlideshow() {
    const headerSection = document.querySelector('.header-section');
    if (headerSection) {
        headerSection.style.removeProperty('background');
    }

    try {
        const response = await fetch('/api/header-images');
        
        if (response.ok) {
            const data = await response.json();
            headerImages = data.images || [];
            const folderName = data.folder || 'header'; // Use folder name from server
            
            if (headerImages.length > 0) {
                const slideshowEl = document.getElementById('headerSlideshow');
                if (slideshowEl) {
                    // Create image elements using the folder name from server (simpler innerHTML approach)
                    slideshowEl.innerHTML = headerImages.map((img, index) => {
                        const imgPath = `photos/${folderName}/${img}`;
                        const loadingAttr = index === 0 ? 'eager' : 'lazy';
                        const fetchPriority = index === 0 ? ' fetchpriority="high"' : '';
                        return `<img src="${imgPath}" alt="Header ${index + 1}" class="${index === 0 ? 'active' : ''}" loading="${loadingAttr}" decoding="async" sizes="100vw"${fetchPriority} onerror="this.style.display='none';" onload="adjustHeaderImageFit(this)">`;
                    }).join('');
                    
                    // Wait a bit for images to start loading, then start slideshow
                    setTimeout(() => {
                        startHeaderSlideshow();
                    }, 500);
                } else {
                    console.error('Header slideshow element not found');
                }
            }
        } else {
            console.error('Failed to fetch header images:', response.status, response.statusText);
        }
    } catch (error) {
        console.error('Error loading header images:', error);
        console.error('Make sure the server is running: node server.js');
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
        return;
    }
    
    // If only one image, just show it
    if (images.length <= 1) {
        if (images[0]) {
            images[0].classList.add('active');
        }
        return;
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
    headerSlideshowInterval = setInterval(() => {
        const currentImages = Array.from(document.querySelectorAll('.header-slideshow img')).filter(img => 
            img.style.display !== 'none'
        );
        
        if (currentImages.length === 0) {
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
        }
    }, 4000); // Change image every 4 seconds
    
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
    
    return isMobileDevice;
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
            coupleNames: 'Praveenraj & Madhumitha',
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
            engagementWhen: '28 January 2026 · Hotel Padmavathi, Palpannai, Trichy',
            engagementNote: 'Update this line with muhurtham and reception timings for guests.',
            weddingHeading: 'Wedding',
            weddingWhen: '18 June 2026 · Shree Narayana Mahall, Trichy',
            weddingNote: 'Update with your ceremony and reception schedule.'
        },
        guestInfo: {
            title: 'Celebration details',
            practicalTitle: 'For our guests',
            dressCodeTitle: 'Dress code',
            dressCode: 'Traditional Indian festive wear — please wear your joyous best.',
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
            paragraph2: 'From romantic dinners at Roof Top Restaurant to exploring the wonders of Birds Park, from thrilling bike rides to cozy car rides, and even trying ice skating together—every moment became a cherished memory.',
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
            openMaps: '📍 Open in Google Maps',
            mapNote: 'Interactive map - Click and drag to explore'
        },
        journey: {
            title: 'Wedding Planner',
            subtitle: 'Four beautiful days of love, tradition, and celebration await you.',
            routeTitle: 'Your Route to Celebrate With Us',
            routeTitleNamed: '{name}, Your Route to Us',
            routeGreeting: 'We mapped the way from your city to our four-day celebration in Trichy.',
            routeGreetingNamed: 'Hey {name}! Here is your path from {from} to our wedding week.',
            routeStart: 'You are here',
            routeTravel: 'On the way',
            routeDestination: 'Celebrate with us',
            routeDestVenue: 'Shree Narayana Mahall · Trichy',
            routeDestNote: 'Four days of love, music, and moments — 15–18 June 2026',
            routeOpenMaps: 'Open your route in Google Maps',
            closing: 'Your presence will make our celebration more special, memorable, and complete. We cannot wait to celebrate this beautiful journey with you.',
            events: {
                haldi: {
                    title: 'Haldi & Mehendi',
                    date: '15 June 2026',
                    description: 'An evening filled with colors, laughter, music, turmeric blessings, henna artistry, and joyful moments shared with family and friends.'
                },
                sangeeth: {
                    title: 'Sangeeth Night',
                    date: '16 June 2026',
                    description: 'A night of dance, music, celebration, performances, and unforgettable memories as both families come together in happiness.'
                },
                reception: {
                    title: 'Reception',
                    date: '17 June 2026',
                    description: 'Join us for an elegant evening reception filled with love, blessings, heartfelt conversations, delicious dinner, and grand celebrations.'
                },
                wedding: {
                    title: 'Wedding Ceremony',
                    date: '18 June 2026',
                    description: 'The sacred union of two souls, celebrated with traditions, blessings, rituals, and the beginning of a beautiful forever together.'
                }
            },
        },
        liveStream: {
            title: 'Live Streaming',
            placeholder: 'Live stream will appear here on the day of the wedding'
        },
        footer: {
            title: 'Forever & Always',
            madeWithLove: 'MADE WITH LOVE',
            developedBy: 'Designed and Developed by Praveenraj Madhumitha'
        }
    },
    ta: {
        nav: {
            details: 'நிகழ்ச்சி விவரங்கள்',
            journey: 'திருமண பயணம்'
        },
        header: {
            coupleNames: 'பிரவீன்ராஜ் & மதுமிதா',
            groom: 'சென்னை பையன்',
            weds: 'திருமணம்',
            bride: 'திருச்சி பொண்ணு',
            saveTheDate: 'தேதியை நினைவில் கொள்ளுங்கள்',
            countdownEngagement: 'நிச்சயதார்த்தத்திற்கான எண்ணிக்கை',
            countdownWedding: 'திருமணத்திற்கான எண்ணிக்கை',
            countdownComplete: 'எங்கள் பயணத்தில் பங்கேற்ற அனைவருக்கும் நன்றி',
            viewPhotos: 'புகைப்படங்கள்'
        },
        schedule: {
            title: 'நிகழ்ச்சி அட்டவணை',
            engagementHeading: 'நிச்சயதார்த்தம்',
            engagementWhen: '28 ஜனவரி 2026 · ஹோட்டல் பத்மாவதி, பல்பன்னை, திருச்சி',
            engagementNote: 'முகூர்த்தம் மற்றும் வரவேற்பு நேரங்களை இங்கே புதுப்பிக்கவும்.',
            weddingHeading: 'திருமணம்',
            weddingWhen: '18 ஜூன் 2026 · ஸ்ரீ நாராயண மஹால், திருச்சி',
            weddingNote: 'சடங்கு மற்றும் வரவேற்பு அட்டவணையை இங்கே சேர்க்கவும்.'
        },
        guestInfo: {
            title: 'கொண்டாட்ட விவரங்கள்',
            practicalTitle: 'விருந்தினர்களுக்கு',
            dressCodeTitle: 'உடை',
            dressCode: 'பாரம்பரிய இந்திய கொண்டாட்ட உடை — உங்கள் மகிழ்ச்சியான சிறந்த உடை அணியவும்.',
            parkingTitle: 'பார்க்கிங்',
            parking: 'இரண்டு இடங்களிலும் பார்க்கிங் உள்ளது; அறிவுறுத்தல்களையும் தன்னார்வலர்களையும் பின்பற்றவும்.',
            landmarkTitle: 'அடையாள இடம்',
            landmark: 'திசைகளுக்கு மேலே உள்ள வரைபட இணைப்புகளைப் பயன்படுத்தவும்; மூத்தவர்களுக்கு அருகிலுள்ள அறியப்பட்ட இடத்தை இங்கே சேர்க்கலாம்.',
            contactTitle: 'தொடர்பு',
            contact: 'நாள் தொடர்பான கேள்விகளுக்கு குடும்பத்தினரைத் தொடர்பு கொள்ளவும் (தொலைபேசி அல்லது வாட்ஸ்அப் சேர்க்கவும்).'
        },
        timer: {
            days: 'நாட்கள்',
            hours: 'மணி',
            minutes: 'நிமிடங்கள்',
            seconds: 'வினாடிகள்'
        },
        about: {
            title: 'எங்கள் கதை',
            paragraph1: 'புனிதமான திருவணைகோயில் கோவிலில் நம் கண்கள் முதல் முறையாக சந்தித்தன. அந்த கணத்திலேயே, நாம் முதல் பார்வையிலேயே காதலில் விழுந்தோம். பாரம்பரிய திருமண ஏற்பாட்டாகத் தொடங்கியது, அன்பு, சிரிப்பு, உணர்ச்சிகள் நிறைந்த ஒரு அற்புதமான பயணமாக மாறியது.',
            paragraph2: 'ரெஸ்டாரண்டில் ரொமான்டிக் இரவு உணவிலிருந்து பேர்ட்ஸ் பார்க்கின் அழகுகளை பார்த்தது, உற்சாகமான பைக் சவாரிகள், வசதியான கார் சவாரிகள், ஒன்றாக ஐஸ் ஸ்கேட்டிங் முயற்சித்தது - ஒவ்வொரு கணமும் ஒரு அன்பான நினைவாக மாறியது.',
            paragraph3: 'இந்த அழகான பயணத்தை நாம் தொடர்ந்து செல்லும்போது, எங்கள் கொண்டாட்டத்தில் நீங்களும் பங்கேற்குமாறு அழைக்கிறோம். உங்கள் வருகையும் ஆசீர்வாதமும் எங்கள் சிறப்பு நாளை இன்னும் அர்த்தமுள்ளதாக்கும்.',
            brideName: 'மதுமிதா',
            brideIntro: 'கருணையும் மகிழ்ச்சியும் நிறைந்தவள் — எங்கள் கதையின் ஒவ்வொரு பக்கத்தையும் அழகாக்குகிறாள். நாங்கள் நேசிக்கும் அனைவருடனும் கொண்டாட காத்திருக்கிறோம்.'
        },
        engagement: {
            title: 'நிச்சயதார்த்த கதை',
            paragraph1: 'நாங்கள் மோதிரங்களை பரிமாறிக்கொண்டபோது, நேரம் நிற்கிறது போல் தோன்றியது. அந்த அமைதியான ஆனால் சக்திவாய்ந்த கணத்தில், வாக்குறுதிகள் முத்திரையிடப்பட்டன. எங்களின் என்றென்றும் நடக்கும் பயணம் அன்றே தொடங்கியது.',
            paragraph2: 'கேக் வெட்டுவதுடன் கொண்டாட்டம் இனிமையாக வளர்ந்தது. அதைத் தொடர்ந்து மறக்கமுடியாத ஆச்சரியம்! கேக்கிற்குள் மறைக்கப்பட்டிருந்தது அவளுக்கான சிறப்பு பரிசு - ஒரு ஐஃபோன். அவளின் எதிர்வினை, தூய மகிழ்ச்சியும் உற்சாகமும் நிறைந்தது. அது நாளின் மிகவும் அன்பான தருணங்களில் ஒன்றாக மாறியது.',
            paragraph3: 'இதயத்திலிருந்து வந்த ஒரு அன்பான சைகை. அவள் அவனுக்கு ஒரு வெள்ளி வளையம் பரிசளித்தாள், நம் பெயர்களுடன் நுட்பமாக செதுக்கப்பட்டது. அது அன்பு, சிந்தனை, என்றென்றும் நீடிக்கும் பிணைப்பின் காலமற்ற சின்னம்.',
            paragraph4: 'நீண்ட காலத்திற்குப் பிறகு உறவினர்களுடன் மீண்டும் சேர்வது கொண்டாட்டத்தை உற்சாகமும் சிரிப்பும் நிறைத்தது. முடிவில்லாத செல்ஃபிகள், குழு புகைப்படங்கள், பகிரப்பட்ட கதைகள், மகிழ்ச்சியான தருணங்கள் - கூட்டம் அன்பும் ஒற்றுமையும் நிறைந்த அழகான மறுசந்திப்பாக மாறியது.',
            paragraph5: 'ஒரு கொண்டாட்டத்தை விட, நிச்சயதார்த்தம் எங்களின் என்றென்றும் நடக்கும் பயணத்தின் தொடக்கம். நாங்கள் வாழ்நாள் முழுவதும் வைத்திருப்போம் என்ற நினைவுகளால் நிறைந்த ஒரு நாள்.',
            discoverMore: 'மேலும் பார்க்க'
        },
        gallery: {
            title: 'புகைப்பட சுவர்',
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
            title: 'உங்கள் புகைப்படங்களை பகிரவும்',
            description: 'எங்களுடன் உங்கள் அன்பான தருணங்களை பகிர்ந்து கொள்ளுங்கள்! பதிவேற்றும்போது பொருத்தமான வகையைத் தேர்ந்தெடுக்கவும்.',
            button: 'புகைப்படங்களை பதிவேற்றவும்'
        },
        venue: {
            title: 'இடம்',
            engagement: 'நிச்சயதார்த்தம்',
            wedding: 'திருமணம்',
            openMaps: '📍 கூகிள் மேப்ஸில் திறக்க',
            mapNote: 'ஊடாடும் வரைபடம் - ஆராய கிளிக் செய்து இழுக்கவும்'
        },
        journey: {
            title: 'திருமண திட்டமிடுபவர்',
            subtitle: 'அன்பு, பாரம்பரியம், கொண்டாட்டம் நிறைந்த நான்கு அழகான நாட்கள் உங்களுக்காக காத்திருக்கின்றன.',
            routeTitle: 'எங்களிடம் வரும் உங்கள் பாதை',
            routeTitleNamed: '{name}, எங்களிடம் வரும் பாதை',
            routeGreeting: 'உங்கள் நகரத்திலிருந்து திருச்சியில் நான்கு நாள் கொண்டாட்டத்திற்கான வழியை வரைபடமாகக் காட்டியுள்ளோம்.',
            routeGreetingNamed: 'ஹேய் {name}! {from} இலிருந்து எங்கள் திருமண வாரத்திற்கான உங்கள் பாதை இதோ.',
            routeStart: 'நீங்கள் இங்கே',
            routeTravel: 'வழியில்',
            routeDestination: 'எங்களுடன் கொண்டாடுங்கள்',
            routeDestVenue: 'ஸ்ரீ நாராயண மஹால் · திருச்சி',
            routeDestNote: 'அன்பு, இசை, தருணங்கள் நிறைந்த நான்கு நாட்கள் — 15–18 ஜூன் 2026',
            routeOpenMaps: 'Google Maps இல் உங்கள் பாதையைத் திறக்கவும்',
            closing: 'உங்கள் வருகை எங்கள் கொண்டாட்டத்தை இன்னும் சிறப்பாகவும், நினைவில் நிற்கக்கூடியதாகவும், முழுமையானதாகவும் ஆக்கும். இந்த அழகான பயணத்தை உங்களுடன் கொண்டாடுவதற்கு நாங்கள் ஆவலுடன் காத்திருக்கிறோம்.',
            events: {
                haldi: {
                    title: 'ஹல்தி & மெஹந்தி',
                    date: '15 ஜூன் 2026',
                    description: 'வண்ணங்கள், சிரிப்பு, இசை, மஞ்சள் ஆசீர்வாதங்கள், மெஹந்தி கலை, குடும்பம் மற்றும் நண்பர்களுடன் பகிர்ந்த மகிழ்ச்சியான தருணங்கள் நிறைந்த ஒரு மாலை.'
                },
                sangeeth: {
                    title: 'சங்கீத் இரவு',
                    date: '16 ஜூன் 2026',
                    description: 'நடனம், இசை, கொண்டாட்டம், நிகழ்ச்சிகள், மற்றும் இரு குடும்பங்களும் மகிழ்ச்சியில் ஒன்றிணையும் மறக்க முடியாத நினைவுகளின் இரவு.'
                },
                reception: {
                    title: 'வரவேற்பு',
                    date: '17 ஜூன் 2026',
                    description: 'அன்பு, ஆசீர்வாதங்கள், இதயத்தைத் தொடும் உரையாடல்கள், சுவையான இரவு உணவு, மற்றும் பிரமாண்ட கொண்டாட்டங்கள் நிறைந்த ஒரு நேர்த்தியான வரவேற்பு இரவில் எங்களுடன் சேருங்கள்.'
                },
                wedding: {
                    title: 'திருமண சடங்கு',
                    date: '18 ஜூன் 2026',
                    description: 'இரு ஆத்மாக்களின் புனித ஒன்றிணைவு — பாரம்பரியங்கள், ஆசீர்வாதங்கள், சடங்குகள், மற்றும் அழகான என்றென்றும் தொடக்கத்துடன் கொண்டாடப்படுகிறது.'
                }
            },
        },
        liveStream: {
            title: 'நேரடி ஒளிபரப்பு',
            placeholder: 'நேரடி ஒளிபரப்பு இங்கே தோன்றும்'
        },
        footer: {
            title: 'அன்பிற்கும் உண்டோ அடைக்கும் தாழ்',
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

    document.querySelectorAll('[data-i18n-title]').forEach((element) => {
        const key = element.getAttribute('data-i18n-title');
        const keys = key.split('.');
        let translation = translations[lang];
        for (const k of keys) {
            translation = translation?.[k];
        }
        if (typeof translation === 'string') {
            element.setAttribute('title', translation);
        }
    });
    
    // Update language toggle button text
    const langBtn = document.getElementById('languageText');
    if (langBtn) {
        langBtn.textContent = lang === 'en' ? 'தமிழ்' : 'English';
    }

    updateCountdown();
    renderFriendRouteMap();

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

function getRouteLabelTemplates() {
    const en = translations.en?.journey || {};
    const ta = translations.ta?.journey || {};
    return {
        en: {
            routeTitle: en.routeTitle,
            routeTitleNamed: en.routeTitleNamed,
            routeGreeting: en.routeGreeting,
            routeGreetingNamed: en.routeGreetingNamed,
            routeStart: en.routeStart,
            routeTravel: en.routeTravel,
            routeDestination: en.routeDestination,
            routeDestVenue: en.routeDestVenue,
            routeDestNote: en.routeDestNote,
            routeOpenMaps: en.routeOpenMaps
        },
        ta: {
            routeTitle: ta.routeTitle,
            routeTitleNamed: ta.routeTitleNamed,
            routeGreeting: ta.routeGreeting,
            routeGreetingNamed: ta.routeGreetingNamed,
            routeStart: ta.routeStart,
            routeTravel: ta.routeTravel,
            routeDestination: ta.routeDestination,
            routeDestVenue: ta.routeDestVenue,
            routeDestNote: ta.routeDestNote,
            routeOpenMaps: ta.routeOpenMaps
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
        currentLanguage,
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

    const heroPhotosBtn = document.getElementById('heroPhotosBtn');
    if (heroPhotosBtn) {
        heroPhotosBtn.addEventListener('click', (e) => {
            e.preventDefault();
            scrollToGallery();
        });
    }
    
    // Detect device first
    detectDevice();
    
    // Menu is always visible - never apply menu-closed
    const mainNav = document.getElementById('mainNav');
    if (mainNav) {
        mainNav.classList.remove('menu-closed');
        document.body.classList.remove('menu-closed');
    }

    await initHeaderSlideshow();
    startCountdown();
    await initGallery();
    // Gallery preview now uses static photos in HTML
    initLocationTabs();
    initNavigation();
    initWeddingJourney();
    
    // Initialize footer date dynamically
    updateCountdown(); // This will set the footer date based on current event
    

    // Initialize map with embedded iframe (no API key needed)
    updateMapLocation('marriage');
    
    // Initialize photo upload
    initPhotoUpload();
    
    // Initialize live stream
    initLiveStream();
    
    // Initialize image modal
    initImageModal();
    
    // Set static engagement images for modal navigation
    window.staticEngagementImages = [
        'photos/engagement/WIN_4488.JPG',
        'photos/engagement/WIN_4269.JPG',
        'photos/engagement/WIN_4401.JPG',
        'photos/engagement/WIN_4415.JPG',
        'photos/engagement/WIN_4698.JPG',
        'photos/engagement/WIN_5084.JPG'
    ];
    
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
                if (xhr.status === 200) {
                    try {
                        const response = JSON.parse(xhr.responseText);
                        progressFill.style.width = '100%';
                        progressText.textContent = 'Upload complete!';
                        
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
                        showUploadMessage(`❌ Upload failed: ${error.error || 'Unknown error'}`, 'error');
                    } catch (parseError) {
                        showUploadMessage(`❌ Upload failed: Server error (${xhr.status})`, 'error');
                    }
                    uploadProgress.style.display = 'none';
                    isUploading = false; // Reset upload flag
                }
            });
            
            xhr.addEventListener('error', (e) => {
                showUploadMessage('❌ Network error. Please check your connection and try again.', 'error');
                uploadProgress.style.display = 'none';
                isUploading = false; // Reset upload flag
            });
            
            xhr.addEventListener('abort', () => {
                showUploadMessage('❌ Upload was cancelled. Please try again.', 'error');
                uploadProgress.style.display = 'none';
                isUploading = false; // Reset upload flag
            });
            
            xhr.addEventListener('timeout', () => {
                console.error('Upload timeout');
                showUploadMessage('❌ Upload timed out. Please try again with smaller files or better connection.', 'error');
                uploadProgress.style.display = 'none';
                isUploading = false; // Reset upload flag
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

// Initialize Live Stream
function initLiveStream() {
    // YouTube Live Stream Configuration
    // Option 1: YouTube Video ID (for live streams or regular videos)
    const youtubeVideoId = ''; // Example: 'dQw4w9WgXcQ' (from URL: https://www.youtube.com/watch?v=dQw4w9WgXcQ)
    
    // Option 2: YouTube Live Stream ID (for live broadcasts)
    const youtubeLiveId = ''; // Example: 'jfKfPfyJRdk' (from URL: https://www.youtube.com/live/jfKfPfyJRdk)
    
    // Option 3: Full YouTube embed URL (if you have a custom embed URL)
    const youtubeEmbedUrl = ''; // Example: 'https://www.youtube.com/embed/VIDEO_ID'
    
    const videoContainer = document.getElementById('videoStreamContainer');
    const videoWrapper = document.getElementById('videoWrapper');
    const videoFrame = document.getElementById('videoStreamFrame');
    const placeholder = document.getElementById('videoPlaceholder');
    const pipToggleBtn = document.getElementById('pipToggleBtn');
    
    let embedUrl = '';
    let isPipMode = false;
    let isDragging = false;
    let dragOffset = { x: 0, y: 0 };
    
    // Build YouTube embed URL based on provided configuration
    if (youtubeLiveId) {
        // Use YouTube live stream embed
        embedUrl = `https://www.youtube.com/embed/${youtubeLiveId}?autoplay=1&mute=0`;
    } else if (youtubeVideoId) {
        // Use regular YouTube video embed (works for live streams too)
        embedUrl = `https://www.youtube.com/embed/${youtubeVideoId}?autoplay=1&mute=0`;
    } else if (youtubeEmbedUrl) {
        // Use provided embed URL
        embedUrl = youtubeEmbedUrl;
    }
    
    // Load YouTube embed if URL is available
    if (embedUrl && videoContainer && videoFrame && videoWrapper) {
        if (placeholder) placeholder.style.display = 'none';
        videoWrapper.style.display = 'block';
        videoFrame.src = embedUrl;
        
        // Automatically enable PiP mode when video loads
        setTimeout(() => {
            enablePipMode();
        }, 2000); // Wait 2 seconds for video to start loading
        
        // Toggle PiP mode button
        if (pipToggleBtn) {
            pipToggleBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                togglePipMode();
            });
        }
        
        // Make PiP window draggable
        if (videoContainer) {
            videoContainer.addEventListener('mousedown', startDrag);
            document.addEventListener('mousemove', drag);
            document.addEventListener('mouseup', stopDrag);
            
            // Touch events for mobile
            videoContainer.addEventListener('touchstart', startDrag);
            document.addEventListener('touchmove', drag);
            document.addEventListener('touchend', stopDrag);
        }
    } else {
        // Keep placeholder visible if no URL is configured
        if (placeholder) placeholder.style.display = 'flex';
        if (videoWrapper) videoWrapper.style.display = 'none';
    }
    
    // Enable PiP mode
    function enablePipMode() {
        if (videoContainer && !isPipMode) {
            isPipMode = true;
            videoContainer.classList.add('pip-mode');
        }
    }
    
    // Disable PiP mode
    function disablePipMode() {
        if (videoContainer && isPipMode) {
            isPipMode = false;
            videoContainer.classList.remove('pip-mode');
        }
    }
    
    // Toggle PiP mode
    function togglePipMode() {
        if (isPipMode) {
            disablePipMode();
        } else {
            enablePipMode();
        }
    }
    
    // Drag functionality
    function startDrag(e) {
        if (!isPipMode) return;
        isDragging = true;
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        const rect = videoContainer.getBoundingClientRect();
        dragOffset.x = clientX - rect.left;
        dragOffset.y = clientY - rect.top;
        e.preventDefault();
    }
    
    function drag(e) {
        if (!isDragging || !isPipMode) return;
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        
        const newX = clientX - dragOffset.x;
        const newY = clientY - dragOffset.y;
        
        // Keep within viewport bounds
        const maxX = window.innerWidth - videoContainer.offsetWidth;
        const maxY = window.innerHeight - videoContainer.offsetHeight;
        
        const constrainedX = Math.max(0, Math.min(newX, maxX));
        const constrainedY = Math.max(0, Math.min(newY, maxY));
        
        videoContainer.style.left = constrainedX + 'px';
        videoContainer.style.top = constrainedY + 'px';
        videoContainer.style.right = 'auto';
        videoContainer.style.bottom = 'auto';
        
        e.preventDefault();
    }
    
    function stopDrag() {
        isDragging = false;
    }
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (timerInterval) clearInterval(timerInterval);
});
