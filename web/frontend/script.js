document.addEventListener('DOMContentLoaded', () => {
    // Инициализация анимаций
    if (typeof AOS !== 'undefined') {
        AOS.init({
            once: true,
            offset: 50,
            duration: 800
        });
    }

    // Navbar Scroll Effect
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });
    }

    // Получаем элементы
    const modal = document.getElementById('leadModal');
    const closeBtn = document.querySelector('.close-modal');
    const openBtns = document.querySelectorAll('.open-modal');
    const form = document.getElementById('leadForm');
    const successMsg = document.getElementById('successMsg');
    const submitBtn = document.getElementById('submitBtn');
    const selectedCourseInput = document.getElementById('selectedCourse');
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('navLinks');

    // Мобильное меню
    if (hamburger && navLinks) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navLinks.classList.toggle('active');
        });

        // Закрытие меню при клике на ссылку
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                navLinks.classList.remove('active');
            });
        });
    }

    // Открытие модального окна
    openBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            // Если кнопка имеет data-course, сохраняем его в скрытое поле
            if (btn.dataset.course) {
                selectedCourseInput.value = btn.dataset.course;
            } else {
                selectedCourseInput.value = '';
            }
            modal.classList.add('active');
        });
    });

    // Закрытие модального окна
    const closeModal = () => {
        modal.classList.remove('active');
        setTimeout(() => {
            form.reset();
            successMsg.style.display = 'none';
            form.style.display = 'block';
        }, 300);
    };

    closeBtn.addEventListener('click', closeModal);

    // Закрытие по клику вне контента
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });

    // FAQ Аккордеон
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        item.addEventListener('click', () => {
            faqItems.forEach(other => {
                if (other !== item) other.classList.remove('active');
            });
            item.classList.toggle('active');
        });
    });

    // Обработка отправки формы
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name   = document.getElementById('leadName').value.trim();
        const phone  = document.getElementById('leadPhone').value.trim();
        const course = selectedCourseInput.value;

        if (!name || !phone) return;

        const originalBtnText = submitBtn.innerText;
        submitBtn.innerText = 'Отправка...';
        submitBtn.disabled = true;

        try {
            const response = await fetch('/api/leads', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: name,
                    phone: phone,
                    notes: course ? `Интерес: ${course}` : null
                })
            });

            if (response.ok) {
                form.style.display = 'none';
                successMsg.style.display = 'block';
                setTimeout(() => { closeModal(); }, 3000);
            } else {
                alert('Произошла ошибка при отправке. Попробуйте позже.');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Ошибка соединения с сервером.');
        } finally {
            submitBtn.innerText = originalBtnText;
            submitBtn.disabled = false;
        }
    });

    // Обработка отправки открытой формы
    const openForm = document.getElementById('openLeadForm');
    if (openForm) {
        openForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const openSubmitBtn = document.getElementById('openSubmitBtn');
            const openSuccessMsg = document.getElementById('openSuccessMsg');
            const name = document.getElementById('openName').value;
            const phone = document.getElementById('openPhone').value;

            const originalBtnText = openSubmitBtn.innerText;
            openSubmitBtn.innerText = 'Отправка...';
            openSubmitBtn.disabled = true;

            try {
                const response = await fetch('/api/leads', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: name, phone: phone })
                });

                if (response.ok) {
                    openSubmitBtn.style.display = 'none';
                    openSuccessMsg.style.display = 'block';
                    setTimeout(() => {
                        openForm.reset();
                        openSubmitBtn.style.display = 'block';
                        openSuccessMsg.style.display = 'none';
                    }, 5000);
                } else {
                    alert('Произошла ошибка при отправке. Попробуйте позже.');
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Ошибка соединения с сервером.');
            } finally {
                openSubmitBtn.innerText = originalBtnText;
                openSubmitBtn.disabled = false;
            }
        });
    }

    // --- Логика Квиза ---
    let quizStep = 0;
    const quizQuestions = [
        {
            q: "Какой язык вы хотите изучать?",
            options: ["Английский", "Японский", "Корейский", "Русский"]
        },
        {
            q: "Какой у вас текущий уровень?",
            options: ["Начинающий (с нуля)", "Базовый (могу немного говорить)", "Средний (понимаю речь)", "Продвинутый"]
        },
        {
            q: "Какая ваша главная цель?",
            options: ["Учеба / Гранты", "Работа / Карьера", "Переезд за границу", "Для себя / Хобби"]
        }
    ];

    window.nextQuizStep = () => {
        const containerEl = document.getElementById('quizContainer');
        const progressEl = document.getElementById('quizProgress');
        
        // Fade out transition
        containerEl.style.opacity = '0';
        
        setTimeout(() => {
            quizStep++;
            const qEl = document.getElementById('quizQuestion');
            const optEl = document.getElementById('quizOptions');
            
            if (quizStep < quizQuestions.length) {
                // Update Progress Bar
                if (progressEl) {
                    const percent = ((quizStep + 1) / quizQuestions.length) * 100;
                    progressEl.style.width = `${percent}%`;
                }

                qEl.innerText = quizQuestions[quizStep].q;
                optEl.innerHTML = '';
                quizQuestions[quizStep].options.forEach(opt => {
                    const btn = document.createElement('button');
                    btn.className = 'quiz-btn magnetic';
                    btn.innerText = opt;
                    btn.style.transition = 'transform 0.1s ease-out';
                    btn.onclick = window.nextQuizStep;
                    optEl.appendChild(btn);
                });

                // Re-apply magnetic effect to new buttons
                document.querySelectorAll('#quizOptions .magnetic').forEach(btn => {
                    btn.addEventListener('mousemove', function(e) {
                        const position = btn.getBoundingClientRect();
                        const x = e.clientX - position.left - position.width / 2;
                        const y = e.clientY - position.top - position.height / 2;
                        btn.style.transform = `translate(${x * 0.15}px, ${y * 0.3}px)`;
                    });
                    btn.addEventListener('mouseout', function(e) {
                        btn.style.transform = 'translate(0px, 0px)';
                    });
                });
                
                // Fade back in
                containerEl.style.opacity = '1';
            } else {
                containerEl.style.display = 'none';
                const resultEl = document.getElementById('quizResult');
                resultEl.style.display = 'block';
                resultEl.style.opacity = '0';
                resultEl.style.transition = 'opacity 0.3s ease';
                setTimeout(() => resultEl.style.opacity = '1', 50);
            }
        }, 300); // match CSS transition duration
    };

    // Отправка формы квиза
    const quizForm = document.getElementById('quizForm');
    if (quizForm) {
        quizForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const quizSubmitBtn = document.getElementById('quizSubmitBtn');
            const quizSuccessMsg = document.getElementById('quizSuccessMsg');
            const phone = document.getElementById('quizPhone').value;

            quizSubmitBtn.innerText = 'Отправка...';
            quizSubmitBtn.disabled = true;

            try {
                const response = await fetch('/api/leads', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: 'Квиз (-10%)', phone: phone })
                });

                if (response.ok) {
                    quizForm.style.display = 'none';
                    quizSuccessMsg.style.display = 'block';
                } else {
                    alert('Ошибка при отправке.');
                }
            } catch (error) {
                console.error('Error:', error);
            } finally {
                quizSubmitBtn.innerText = 'Забрать скидку';
                quizSubmitBtn.disabled = false;
            }
        });
    }

    // ==========================================
    // PREMIUM ANIMATIONS
    // ==========================================

    // 1. Typewriter Effect
    const typewriterEl = document.getElementById('typewriter');
    if (typewriterEl) {
        const words = ['без границ', 'с нуля', 'для учебы', 'для карьеры'];
        let wordIndex = 0;
        let charIndex = words[0].length; // start with first word fully typed
        let isDeleting = true;
        
        function type() {
            const currentWord = words[wordIndex];
            if (isDeleting) {
                charIndex--;
            } else {
                charIndex++;
            }
            typewriterEl.textContent = currentWord.substring(0, charIndex);
            
            let typeSpeed = isDeleting ? 50 : 100;
            
            if (!isDeleting && charIndex === currentWord.length) {
                typeSpeed = 2000; // pause at end
                isDeleting = true;
            } else if (isDeleting && charIndex === 0) {
                isDeleting = false;
                wordIndex = (wordIndex + 1) % words.length;
                typeSpeed = 500; // pause before typing next
            }
            setTimeout(type, typeSpeed);
        }
        setTimeout(type, 3000); // initial delay before deleting
    }

    // 2. Counter Animation on Scroll
    const counters = document.querySelectorAll('.counter');
    if (counters.length > 0) {
        const speed = 100; // lower = faster
        const startCounters = (entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const counter = entry.target;
                    const target = +counter.getAttribute('data-target');
                    const updateCount = () => {
                        const count = +counter.innerText;
                        const inc = target / speed;
                        if (count < target) {
                            counter.innerText = Math.ceil(count + inc);
                            setTimeout(updateCount, 20);
                        } else {
                            counter.innerText = target;
                        }
                    };
                    updateCount();
                    observer.unobserve(counter); // Animate only once
                }
            });
        };
        const counterObserver = new IntersectionObserver(startCounters, { threshold: 0.5 });
        counters.forEach(counter => counterObserver.observe(counter));
    }

    // 3. Magnetic Buttons
    const magnets = document.querySelectorAll('.magnetic');
    magnets.forEach(btn => {
        btn.addEventListener('mousemove', function(e) {
            const position = btn.getBoundingClientRect();
            // Calculate cursor position relative to the center of the button
            const x = e.clientX - position.left - position.width / 2;
            const y = e.clientY - position.top - position.height / 2;
            btn.style.transform = `translate(${x * 0.3}px, ${y * 0.4}px)`;
        });
        btn.addEventListener('mouseout', function(e) {
            btn.style.transform = 'translate(0px, 0px)';
        });
    });

    // 4. Methodology Line Animation
    const methodContainer = document.getElementById('methodContainer');
    const methodLine = document.getElementById('methodLine');
    if (methodContainer && methodLine) {
        const lineObserver = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                // Wait slightly for the step cards to fade up first
                setTimeout(() => {
                    methodLine.style.width = '70%'; // Draws the line across the 3 steps
                }, 400);
                lineObserver.unobserve(methodContainer);
            }
        }, { threshold: 0.3 });
        lineObserver.observe(methodContainer);
    }

});
