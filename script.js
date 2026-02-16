document.addEventListener('DOMContentLoaded', () => {

    const typeWriterElement = document.getElementById('typewriter');
    const toggle = document.querySelector('.mobile-toggle');
    const nav = document.querySelector('.desktop-nav');
    const cursor = document.querySelector('.custom-cursor');

    const codeSnippet = `int main() {
    // Lexical analysis begins...
    int x = 10;
    int y = 20;
    
    /* 
     Syntactic parsing
     constructs the tree...
    */
    return x + y;
}`;

    let i = 0;

    function typeWriter() {
        if (i < codeSnippet.length) {
            typeWriterElement.textContent += codeSnippet.charAt(i);
            i++;
            const randomSpeed = Math.floor(Math.random() * 50) + 30;
            setTimeout(typeWriter, randomSpeed);
        }
    }

    setTimeout(typeWriter, 1000);

    // Mobile Navigation
    if (toggle) {
        toggle.addEventListener('click', () => {
            toggle.classList.toggle('active');
            nav.classList.toggle('active');
            document.body.style.overflow = nav.classList.contains('active') ? 'hidden' : 'auto';
        });

        // Close nav on link click
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                toggle.classList.remove('active');
                nav.classList.remove('active');
                document.body.style.overflow = 'auto';
            });
        });
    }

    // Custom Cursor Logic
    // Only active on desktop via CSS, but JS tracks position
    document.addEventListener('mousemove', (e) => {
        if (cursor) {
            cursor.style.left = e.clientX + 'px';
            cursor.style.top = e.clientY + 'px';
        }
    });

    // Cursor Hover Effects
    const hoverElements = document.querySelectorAll('a, button, .bento-card');
    hoverElements.forEach(el => {
        el.addEventListener('mouseenter', () => cursor?.classList.add('hovered'));
        el.addEventListener('mouseleave', () => cursor?.classList.remove('hovered'));
    });

    // Tilt Effect
    const cards = document.querySelectorAll('.bento-card'); // Use .bento-card class

    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const rotateX = ((y - centerY) / centerY) * -5;
            const rotateY = ((x - centerX) / centerX) * 5;

            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale(1)';
        });
    });

    // Smooth Scroll
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Intersection Observer
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.bento-card, .hero-text, .terminal-window').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });

    const style = document.createElement('style');
    style.innerHTML = `
        .visible { opacity: 1 !important; transform: translateY(0) !important; }
    `;
    document.head.appendChild(style);

    // Magnetic Buttons
    const btns = document.querySelectorAll('.magnetic-btn'); // Ensure class exists in HTML

    btns.forEach(btn => {
        btn.addEventListener('mousemove', (e) => {
            const rect = btn.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;

            btn.style.transform = `translate(${x / 4}px, ${y / 4}px)`;
        });

        btn.addEventListener('mouseleave', () => {
            btn.style.transform = 'translate(0, 0)';
        });
    });

});
