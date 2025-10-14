// =============================================================
// = Augen folgen der Maus und schliesen sich nach Inaktivität =
// =============================================================

// Scroll blockieren
document.addEventListener('touchmove', (e) => {
    e.preventDefault();
}, { passive: false });

document.addEventListener('touchstart', (e) => {
    e.preventDefault();
    // Touch-Status setzen
    isTouching = true;
    clearTimeout(touchTimer);
    // Augen öffnen bei Touch
    resetIdle();
}, { passive: false });

// Browser Geste blockieren
document.addEventListener('gesturestart', (e) => {
    e.preventDefault();
});

const eyes = Array.from(document.querySelectorAll(".eye")); // alle Augen finden
const pupils = eyes.map(eye => eye.querySelector(".pupil")); // Pupillen holen

window.forcedClosed = false; // merken, ob Augen zu sind
const eyesEls = Array.from(document.querySelectorAll(".eye")); // Liste der Augen

// Touch-Status verfolgen: Augen schließen sich nicht, solange Finger auf dem Bildschirm ist
let isTouching = false;
let touchTimer = null;

function setClosed(on) { // Augen öffnen oder schließen
	if (on === window.forcedClosed) return; // nichts ändern
	if (on && isTouching) return; // NICHT schließen, wenn Finger auf dem Bildschirm ist
	window.forcedClosed = on; // Zustand speichern
	eyesEls.forEach(e => e.classList.toggle("blink", on)); // Klasse "blink" setzen
}

let idleTimer; // Timer für Inaktivität
const IDLE_MS = 3500; // 3.5 Sekunden warten

function resetIdle() { // wenn Bewegung -> wach bleiben
	clearTimeout(idleTimer); // alten Timer löschen
	if (window.forcedClosed) setClosed(false); // Augen öffnen
	// Timer nur starten, wenn Finger nicht auf dem Bildschirm ist
	if (!isTouching) {
		idleTimer = setTimeout(() => setClosed(true), IDLE_MS); // nach Pause schließen
	}
}

window.addEventListener("mousemove", resetIdle, { passive: true }); // Maus bewegt sich
// window.addEventListener("keydown", resetIdle); // Taste gedrückt
// touchstart wird bereits oben behandelt (Scroll-Blockierung + Touch-Status)

window.addEventListener("mouseout", (e) => { // Maus verlässt Fenster
	if (!e.relatedTarget && !e.toElement) setClosed(true); // Augen zu
});

window.addEventListener("blur", () => setClosed(true)); // Fenster inaktiv → zu
document.addEventListener("visibilitychange", () => { // Tab unsichtbar
	if (document.hidden) setClosed(true); // Augen zu
});

let centers = []; // Mitte der Augen speichern
function updateCenters() { // Mitte berechnen
	centers = eyes.map(eye => { // für jedes Auge
		const r = eye.getBoundingClientRect(); // Position holen
		return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; // Mittelpunkt berechnen
	});
}
updateCenters(); // einmal starten
window.addEventListener("resize", updateCenters); // bei Fenstergröße neu
window.addEventListener("scroll", updateCenters, { passive: true }); // bei Scroll neu

// Beim Laden der Seite: Inaktivitäts-Timer starten (wird am Ende des Skripts aufgerufen)

const target = { x: 0, y: 0 }; // Zielposition der Maus
window.addEventListener("mousemove", e => { // Maus bewegt sich
	target.x = e.clientX; // X-Position speichern
	target.y = e.clientY; // Y-Position speichern
});

// Touch: Blick auf die Touch-Position richten
window.addEventListener("touchstart", (e) => {
	const t = e.touches[0] || e.changedTouches && e.changedTouches[0];
	if (!t) return;
	target.x = t.clientX;
	target.y = t.clientY;
}, { passive: true });

window.addEventListener("touchmove", (e) => {
	const t = e.touches[0] || e.changedTouches && e.changedTouches[0];
	if (!t) return;
	target.x = t.clientX;
	target.y = t.clientY;
}, { passive: true });

// Touch-Status verfolgen: Augen offen halten, solange Finger auf dem Bildschirm ist
// (touchstart wird bereits oben behandelt)

document.addEventListener("touchend", (e) => {
	e.preventDefault();
	isTouching = false;
	// Kurze Verzögerung vor möglichem Schließen
	touchTimer = setTimeout(() => {
		if (!isTouching) {
			resetIdle(); // Timer neu starten
		}
	}, 500);
}, { passive: false });

document.addEventListener("touchcancel", (e) => {
	e.preventDefault();
	isTouching = false;
	clearTimeout(touchTimer);
}, { passive: false });

const maxOffset = 25; // maximale Bewegung (px)
const ease = 0.18; // Bewegungsglättung

const state = pupils.map(() => ({ x: 0, y: 0 })); // Startpositionen

function tick() { // Animationsschleife
	pupils.forEach((pupil, i) => { // für jede Pupille
		const c = centers[i]; // Mittelpunkt holen
		if (!c) return; // wenn nicht da → weiter

		const angle = Math.atan2(target.y - c.y, target.x - c.x); // Winkel berechnen
		const tx = Math.cos(angle) * maxOffset; // Ziel x
		const ty = Math.sin(angle) * maxOffset; // Ziel y

		state[i].x += (tx - state[i].x) * ease; // sanfte Bewegung x
		state[i].y += (ty - state[i].y) * ease; // sanfte Bewegung y

		pupil.style.transform = `translate(calc(-50% + ${state[i].x}px), calc(-50% + ${state[i].y}px))`; // neue Position setzen
	});

	requestAnimationFrame(tick); // wiederholen
}
tick(); // starten

(function setupBlinking() { // Blinzeln einstellen
	const eyes = Array.from(document.querySelectorAll(".eye")); // Augen holen

	function blinkOnce() { // einmal blinzeln
		if (window.forcedClosed) return; // wenn zu, nichts tun
		eyes.forEach(e => e.classList.add("blink")); // Augen zu
		setTimeout(() => { // kurz warten
			if (!window.forcedClosed) // wenn wach
				eyes.forEach(e => e.classList.remove("blink")); // wieder auf
		}, 140); // 140ms warten
	}

	function scheduleNextBlink() { // nächstes Blinzeln planen
		const delay = 2000 + Math.random() * 5000; // Zeit zufällig
		setTimeout(() => { // nach der Zeit
			blinkOnce(); // blinzeln
			if (Math.random() < 0.25) setTimeout(blinkOnce, 220); // evtl. doppelt
			scheduleNextBlink(); // wieder planen
		}, delay); // warten
	}

	scheduleNextBlink(); // starten
})();

// Nach dem Laden aller Komponenten: Inaktivitäts-Timer starten
document.addEventListener('DOMContentLoaded', () => {
	resetIdle();
});
