/* =====================================================
   HAMBURGER MENU
===================================================== */
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');

hamburger.addEventListener('click', () => {
  const isOpen = navLinks.classList.toggle('open');
  hamburger.classList.toggle('open', isOpen);
  hamburger.setAttribute('aria-expanded', String(isOpen));
  document.body.style.overflow = isOpen ? 'hidden' : '';
});

navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('open');
    hamburger.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  });
});

/* =====================================================
   SMOOTH SCROLL (offset for sticky nav)
===================================================== */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', e => {
    const id = anchor.getAttribute('href');
    if (id === '#') return;
    const target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    const navH = document.querySelector('.navbar').offsetHeight;
    const top = target.getBoundingClientRect().top + window.pageYOffset - navH - 12;
    window.scrollTo({ top, behavior: 'smooth' });
  });
});

/* =====================================================
   CAROUSEL FACTORY
===================================================== */
function initCarousel({ trackId, nextId, prevId, getVisible }) {
  const track = document.getElementById(trackId);
  const nextBtn = nextId ? document.getElementById(nextId) : null;
  const prevBtn = prevId ? document.getElementById(prevId) : null;
  if (!track) return;

  let index = 0;

  function visible() {
    return getVisible ? getVisible() : 3;
  }

  function maxIndex() {
    return Math.max(0, track.children.length - visible());
  }

  function update() {
    const count = track.children.length;
    if (!count) return;
    const card = track.children[0];
    const cardW = card.getBoundingClientRect().width;
    const gap = parseFloat(getComputedStyle(track).gap) || 0;
    const offset = Math.min(index, maxIndex()) * (cardW + gap);
    track.style.transform = `translateX(-${offset}px)`;

    if (nextBtn) nextBtn.disabled = index >= maxIndex();
    if (prevBtn) prevBtn.disabled = index <= 0;
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      index = index >= maxIndex() ? 0 : index + 1;
      update();
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      index = index <= 0 ? maxIndex() : index - 1;
      update();
    });
  }

  window.addEventListener('resize', () => {
    index = Math.min(index, maxIndex());
    update();
  });

  update();
}

/* =====================================================
   INIT CAROUSELS
===================================================== */
function isMobile() { return window.innerWidth <= 768; }

initCarousel({
  trackId: 'heroTrack',
  nextId: 'heroNext',
  prevId: 'heroPrev',
  getVisible: () => 1
});

initCarousel({
  trackId: 'productsTrack',
  nextId: 'productsNext',
  getVisible: () => {
    if (window.innerWidth <= 480) return 1;
    if (window.innerWidth <= 768) return 2;
    return 4;
  }
});

initCarousel({
  trackId: 'featuredRecipesTrack',
  nextId: 'featuredRecipesNext',
  prevId: 'featuredRecipesPrev',
  getVisible: () => 1
});

initCarousel({
  trackId: 'recipesTrack',
  nextId: 'recipesNext',
  getVisible: () => {
    if (window.innerWidth <= 480) return 1;
    if (window.innerWidth <= 768) return 1;
    return 3;
  }
});

initCarousel({
  trackId: 'articlesTrack',
  nextId: 'articlesNext',
  prevId: 'articlesPrev',
  getVisible: () => 1
});

/* =====================================================
   TOUCH / SWIPE SUPPORT FOR MOBILE CAROUSELS
===================================================== */
function addSwipe(trackId) {
  const track = document.getElementById(trackId);
  if (!track) return;

  let startX = 0;
  let startY = 0;
  let isDragging = false;

  track.addEventListener('touchstart', e => {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    isDragging = true;
  }, { passive: true });

  track.addEventListener('touchend', e => {
    if (!isDragging) return;
    isDragging = false;
    const diffX = startX - e.changedTouches[0].clientX;
    const diffY = startY - e.changedTouches[0].clientY;
    if (Math.abs(diffX) < 40 || Math.abs(diffX) <= Math.abs(diffY)) return;
    if (diffX > 0) {
      track.scrollLeft += track.clientWidth * 0.8;
    } else {
      track.scrollLeft -= track.clientWidth * 0.8;
    }
  }, { passive: true });
}

addSwipe('productsTrack');
addSwipe('heroTrack');
addSwipe('featuredRecipesTrack');
addSwipe('recipesTrack');
addSwipe('articlesTrack');

/* =====================================================
   INTERSECTION OBSERVER — fade-in on scroll
===================================================== */
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll(
  '.product-card, .recipe-card, .article-card, .recipe-featured, .article-featured, .hero-text, .hero-media'
).forEach(el => {
  el.classList.add('fade-in');
  observer.observe(el);
});
