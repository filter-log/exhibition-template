const photoSearchInput = document.querySelector("[data-photo-search]");
const photoCards = Array.from(document.querySelectorAll("[data-photo-card]"));
const photoCountNode = document.querySelector("[data-photo-count]");

if (photoSearchInput && photoCards.length && photoCountNode) {
  const renderVisibleCards = () => {
    const query = photoSearchInput.value.trim().toLowerCase();
    let visibleCount = 0;

    photoCards.forEach((card) => {
      const title = card.dataset.photoTitle || "";
      const artist = card.dataset.photoArtist || "";
      const matches = !query || title.includes(query) || artist.includes(query);
      card.hidden = !matches;
      if (matches) {
        visibleCount += 1;
      }
    });

    photoCountNode.textContent = String(visibleCount);
  };

  photoSearchInput.addEventListener("input", renderVisibleCards);
  renderVisibleCards();
}

