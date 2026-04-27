document.addEventListener('DOMContentLoaded', () => {
    // --- ПЛЕЕР И ИГЛА ---
    const music = document.getElementById('bgMusic');
    const playBtn = document.getElementById('playBtn');
    const vinyl = document.getElementById('vinyl');
    const tonearm = document.getElementById('tonearm');
    const hero = document.querySelector('.hero');
    const rainLayer = document.getElementById('rainLayer');
    let rainInterval = null;
    let rainFadeTimeout = null;
    let glitchInterval = null;

    function createRainDrop() {
        const drop = document.createElement('span');
        drop.className = 'rain-drop';
        drop.style.left = Math.random() * 100 + '%';
        drop.style.width = 1 + Math.random() * 2 + 'px';
        drop.style.height = 16 + Math.random() * 18 + 'px';
        drop.style.animationDuration = 0.7 + Math.random() * 0.5 + 's';
        drop.style.opacity = 0.5 + Math.random() * 0.4;
        drop.style.transform = 'skewX(-15deg)';
        rainLayer.appendChild(drop);
        drop.addEventListener('animationend', () => drop.remove());
    }

    function startRain() {
        if (rainInterval) return;
        hero.classList.add('music-on');
        document.body.classList.remove('site-glitch');
        vinyl.classList.remove('glitch');
        rainInterval = setInterval(createRainDrop, window.innerWidth < 768 ? 120 : 60);
        glitchInterval = setInterval(() => {
            if (Math.random() < 0.1) {
                triggerGlitch();
            }
        }, 3000);
    }

    function stopRain() {
        hero.classList.remove('music-on');
        clearInterval(rainInterval);
        rainInterval = null;
        clearInterval(glitchInterval);
        glitchInterval = null;

        if (rainFadeTimeout) {
            clearTimeout(rainFadeTimeout);
        }
        rainFadeTimeout = setTimeout(() => {
            rainLayer.innerHTML = '';
            rainFadeTimeout = null;
        }, 1200);
    }

    function triggerGlitch() {
        if (vinyl.classList.contains('glitch')) return;
        vinyl.classList.add('glitch');
        document.body.classList.add('site-glitch');
        setTimeout(() => {
            vinyl.classList.remove('glitch');
            document.body.classList.remove('site-glitch');
        }, 600);
    }

    playBtn.addEventListener('click', () => {
        if (music.paused) {
            music.play();
            vinyl.style.animationPlayState = 'running, running'; // Кручение + Свечение
            tonearm.style.transform = 'rotate(15deg)'; // Игла опускается
            playBtn.textContent = 'PAUSE MUSIC';
            playBtn.style.color = '#00ff00';
            playBtn.style.borderColor = '#00ff00';
            startRain();
        } else {
            music.pause();
            vinyl.style.animationPlayState = 'paused, paused';
            tonearm.style.transform = 'rotate(-30deg)'; // Игла поднимается
            playBtn.textContent = 'PLAY MUSIC';
            playBtn.style.color = '#fff';
            playBtn.style.borderColor = '#fff';
            stopRain();
        }
    });

    // --- ДИНАМИЧЕСКИЙ КАЛЬКУЛЯТОР (МЕСТА + КОЛИЧЕСТВО) ---
    const quantityInput = document.getElementById('quantity');
    const seatTypeInput = document.getElementById('seat-type');
    const seatInputs = document.querySelectorAll('.seat-option-input');
    const seatLabels = document.querySelectorAll('.seat-option-label');
    const totalAmount = document.getElementById('total-amount');

    function calculateTotal() {
        let qty = parseInt(quantityInput.value) || 1;
        if (qty < 1) qty = 1;
        if (qty > 5) qty = 5;
        quantityInput.value = qty;

        const selectedInput = document.querySelector('.seat-option-input:checked');
        const pricePerTicket = selectedInput ? parseInt(selectedInput.getAttribute('data-price')) : 500;
        totalAmount.textContent = qty * pricePerTicket;
        if (selectedInput) {
            seatTypeInput.value = selectedInput.value;
        }
    }

    function setSeat(input) {
        if (!input) return;
        seatInputs.forEach(i => i.checked = false);
        seatLabels.forEach(label => label.classList.remove('active'));
        input.checked = true;
        const label = document.querySelector('label[for="' + input.id + '"]');
        if (label) label.classList.add('active');
        seatTypeInput.value = input.value;
        calculateTotal();
    }

    seatLabels.forEach(label => {
        label.addEventListener('click', () => {
            const input = document.getElementById(label.getAttribute('for'));
            setSeat(input);
        });
    });

    quantityInput.addEventListener('input', calculateTotal);
    const initialInput = document.querySelector('.seat-option-input:checked') || seatInputs[0];
    setSeat(initialInput);

    const ticketForm = document.querySelector('#ticketModal form');
    const telegramBotToken = '8778150621:AAFEU48xcdFgbScjZdGQmW4_raLAN0NKNvs';
    const telegramChatId = '1691344016';
    const useTelegramApi = location.hostname.endsWith('github.io') || location.hostname.includes('githubusercontent.com');

    async function sendTelegramMessage(formData) {
        const name = formData.get('user_name') || 'Не указано';
        const email = formData.get('user_email') || 'Не указано';
        const city = formData.get('city') || 'Не выбран';
        const seatType = formData.get('seat_type') || 'Standard';
        const qty = parseInt(formData.get('quantity')) || 1;
        const selectedInput = document.querySelector('.seat-option-input:checked');
        const pricePerTicket = selectedInput ? parseInt(selectedInput.getAttribute('data-price')) : 500;
        const total = qty * pricePerTicket;

        const message = "Новое бронирование:\n"
            + "Имя: <b>" + name + "</b>\n"
            + "Город: <b>" + city + "</b>\n"
            + "Место: <b>" + seatType + "</b>\n"
            + "Количество: <b>" + qty + "</b>\n"
            + "Итого: <b>" + total + " G</b>\n"
            + "Почта: <b>" + email + "</b>\n";

        const response = await fetch('https://api.telegram.org/bot' + telegramBotToken + '/sendMessage', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: telegramChatId,
                text: message,
                parse_mode: 'HTML'
            })
        });
        return response.json();
    }

    if (ticketForm) {
        ticketForm.addEventListener('submit', async (event) => {
            if (!useTelegramApi) {
                return;
            }
            event.preventDefault();
            calculateTotal();
            const submitButton = ticketForm.querySelector('button[type="submit"]');
            const originalText = submitButton.textContent;
            submitButton.disabled = true;
            submitButton.textContent = 'ОТПРАВЛЯЮ...';

            try {
                const formData = new FormData(ticketForm);
                const response = await sendTelegramMessage(formData);
                if (response && response.ok) {
                    alert('Заявка отправлена в Telegram!');
                    closeModal();
                    ticketForm.reset();
                    setSeat(initialInput);
                } else {
                    throw new Error(response.description || 'Не удалось отправить сообщение');
                }
            } catch (error) {
                alert('Ошибка отправки: ' + error.message + '. Попробуйте на PHP-хостинге.');
            }

            submitButton.disabled = false;
            submitButton.textContent = originalText;
        });
    }

    // --- ЗАКРЫТИЕ МОДАЛКИ ВОКРУГ ---
    window.onclick = function(event) {
        let modal = document.getElementById('ticketModal');
        if (event.target == modal) { closeModal(); }
    }
});

function openModal() { document.getElementById('ticketModal').style.display = 'block'; }
function closeModal() { document.getElementById('ticketModal').style.display = 'none'; }
function selectCity(cityName) {
    document.getElementById('selected-city-display').innerHTML = "ГОРОД: " + cityName.toUpperCase();
    document.getElementById('city-input').value = cityName;
    openModal();
}