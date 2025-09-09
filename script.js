document.addEventListener('DOMContentLoaded', function() {
    // Animate podium cards
    const cards = document.querySelectorAll('.podium-card');
    cards.forEach((card, index) => {
        card.style.opacity = 0;
        card.style.transform = 'translateY(50px)';
        setTimeout(() => {
            card.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
            card.style.opacity = 1;
            card.style.transform = 'translateY(0)';
        }, 300 * index);
    });
    
    // Animate table rows
    const rows = document.querySelectorAll('tbody tr');
    rows.forEach((row, index) => {
        row.style.opacity = 0;
        row.style.transform = 'translateY(20px)';
        setTimeout(() => {
            row.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            row.style.opacity = 1;
            row.style.transform = 'translateY(0)';
        }, 500 + (100 * index));
    });
});