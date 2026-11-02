// filter.js – event-delegated tag filter for projects & certs with aria-pressed
document.addEventListener('click', e => {
  const btn = e.target.closest('.filter-btn');
  if (!btn) return;
  const filterBar = btn.closest('.filter-bar');
  if (!filterBar) return;

  const tag = btn.dataset.filter;
  filterBar.querySelectorAll('.filter-btn').forEach(b => {
    const isActive = b === btn;
    b.classList.toggle('active', isActive);
    b.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  });

  if (filterBar.classList.contains('filter-bar--certs')) {
    const catGroups = document.querySelectorAll('.cert-cat-group');
    catGroups.forEach(group => {
      const cat = group.dataset.category;
      group.hidden = !(tag === 'all' || cat === tag);
    });
  } else {
    const cards = document.querySelectorAll('.project-card');
    cards.forEach(card => {
      const tags = card.dataset.tags ? card.dataset.tags.split(' ') : [];
      card.hidden = !(tag === 'all' || tags.includes(tag));
    });
    const secondarySection = document.getElementById('projects-secondary-section');
    if (secondarySection) {
      const visibleSecondary = secondarySection.querySelectorAll('.project-card:not([hidden])');
      secondarySection.hidden = visibleSecondary.length === 0;
    }
    const featuredSection = document.getElementById('projects-featured-section');
    if (featuredSection) {
      const visibleFeatured = featuredSection.querySelectorAll('.project-card:not([hidden])');
      featuredSection.hidden = visibleFeatured.length === 0;
    }
  }
});
