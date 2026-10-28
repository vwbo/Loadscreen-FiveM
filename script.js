(function () {
	'use strict';

	/* =====================================================================
	   HELPERS
	   ===================================================================== */
	function $(selector, root) {
		return (root || document).querySelector(selector);
	}

	function clamp(value, min, max) {
		return Math.min(max, Math.max(min, value));
	}

	function openUrl(url) {
		if (!url) {
			return;
		}
		if (window.invokeNative) {
			window.invokeNative('openUrl', url);
		} else {
			window.open(url, '_blank');
		}
	}

	/* =====================================================================
	   ESTADO + ELEMENTOS (tudo buscado uma única vez)
	   ===================================================================== */
	var config = null;
	var playlist = [];
	var storeItems = [];
	var socials = [];
	var storeUrl = '';

	var currentSong = 0;
	var currentSlide = 0;
	var slideTimer = null;
	var lastVolume = 0.1;

	var music = $('#music');
	var song = $('#song');
	var artist = $('#artist');
	var image = $('#image');
	var volume = $('#volume');
	var volumeIcon = $('#volumeIcon');
	var visibleVolume = $('.volume-slider-container .volume');
	var playButton = $('#play');
	var pauseButton = $('#pause');
	var nextButton = $('#next');
	var previousButton = $('#previous');
	var playhead = $('#elapsed');
	var player = $('#player');

	// Usado somente se o config.json falhar ao carregar
	var fallbackPlaylist = [
		{
			song: 'Posso Até Não Te Dar Flores',
			artist: 'DJ JAPA NK, MC JACARÉ, MC MENO K, MC RYAN SP & DJ DAVI DOGDOG',
			image: './assets/images/banner_cd.png',
			mp3: './assets/sounds/mc_ryan.mp3',
			volume: 0.1
		},
		{
			song: 'É Ruim Ver os Outros Vivendo',
			artist: 'MC JACARÉ, MC IG, MC Tuto',
			image: './assets/images/banner_cd2.png',
			mp3: './assets/sounds/e_ruim_ver_os_outros_vivendo.mp3',
			volume: 0.1
		},
		{
			song: 'Puxa o Lança',
			artist: 'MC Jvila, KayBlack, Veigh, Vulgo FK',
			image: './assets/images/banner_cd3.png',
			mp3: './assets/sounds/puxa_o_lanca.mp3',
			volume: 0.1
		}
	];

	/* =====================================================================
	   VÍDEO DE FUNDO (nunca deixa a tela preta)
	   ===================================================================== */
	function initVideo() {
		var holder = $('#videoBackground');
		var video = $('#backgroundVideo');

		if (!video || !holder) {
			return;
		}

		video.muted = true;

		// O vídeo só aparece quando realmente começou a tocar; até lá o fundo estático fica visível
		video.addEventListener('playing', function () {
			holder.classList.add('video-ready');
		}, { once: true });

		video.addEventListener('error', function () {
			console.log('Erro ao carregar o vídeo:', video.error);
		});

		var promise = video.play();
		if (promise && promise.catch) {
			promise.catch(function () { /* o fundo estático continua visível */ });
		}
	}

	/* =====================================================================
	   TECLADO (gerado por JS, não precisa de SVG)
	   ===================================================================== */
	// [rótulo, largura relativa, nomes aceitos no config.json]
	var KEY_LAYOUT = [
		[['ESC', 1.5, ['ESC', 'ESCAPE']], ['F1', 1], ['F2', 1], ['F3', 1], ['F4', 1], ['F5', 1], ['F6', 1], ['F7', 1], ['F8', 1], ['F9', 1], ['F10', 1], ['F11', 1], ['F12', 1]],
		[['`', 1], ['1', 1], ['2', 1], ['3', 1], ['4', 1], ['5', 1], ['6', 1], ['7', 1], ['8', 1], ['9', 1], ['0', 1], ['-', 1], ['=', 1], ['BACKSPACE', 2, ['BACKSPACE', 'BKSP']]],
		[['TAB', 1.5], ['Q', 1], ['W', 1], ['E', 1], ['R', 1], ['T', 1], ['Y', 1], ['U', 1], ['I', 1], ['O', 1], ['P', 1], ['[', 1], [']', 1], ['\\', 1.5]],
		[['CAPS', 1.8, ['CAPS', 'CAPSLOCK']], ['A', 1], ['S', 1], ['D', 1], ['F', 1], ['G', 1], ['H', 1], ['J', 1], ['K', 1], ['L', 1], [';', 1], ['\'', 1], ['ENTER', 2.2, ['ENTER', 'RETURN']]],
		[['SHIFT', 2.3, ['SHIFT', 'LSHIFT']], ['Z', 1], ['X', 1], ['C', 1], ['V', 1], ['B', 1], ['N', 1], ['M', 1], [',', 1], ['.', 1], ['/', 1], ['SHIFT', 1.8, ['RSHIFT']], ['↑', 1, ['UP', 'ARROWUP']]],
		[['CTRL', 1.3, ['CTRL', 'CONTROL', 'LCTRL']], ['ALT', 1.3, ['ALT', 'LALT']], ['SPACE', 6.4, ['SPACE', 'SPACEBAR']], ['ALT', 1.3, ['RALT']], ['CTRL', 1.3, ['RCTRL']], ['←', 1, ['LEFT', 'ARROWLEFT']], ['↓', 1, ['DOWN', 'ARROWDOWN']], ['→', 1, ['RIGHT', 'ARROWRIGHT']]]
	];

	var keyboardEl = $('#keyboard');
	var keyboardContainer = $('#keyboardContainer');
	var keyboardExtra = $('#keyboardExtra');
	var keyboardLabel = $('#keyboardLabel');
	var tooltip = null;
	var keyMap = {};

	function buildKeyboard() {
		var fragment = document.createDocumentFragment();

		KEY_LAYOUT.forEach(function (row) {
			var rowEl = document.createElement('div');
			rowEl.className = 'kb-row';

			row.forEach(function (def) {
				var label = def[0];
				var names = def[2] || [label];

				var keyEl = document.createElement('div');
				keyEl.className = 'key';
				keyEl.textContent = label;
				keyEl.style.flex = def[1] + ' 1 0';

				names.forEach(function (name) {
					var id = String(name).toUpperCase();
					(keyMap[id] = keyMap[id] || []).push(keyEl);
				});

				rowEl.appendChild(keyEl);
			});

			fragment.appendChild(rowEl);
		});

		tooltip = document.createElement('div');
		tooltip.className = 'key-tooltip';
		fragment.appendChild(tooltip);

		keyboardEl.appendChild(fragment);

		// Um único par de listeners para o teclado inteiro (em vez de um por tecla)
		keyboardEl.addEventListener('mouseover', function (e) {
			var keyEl = e.target.closest ? e.target.closest('.key.highlighted') : null;
			if (keyEl) {
				showTooltip(keyEl, keyEl.dataset.tip);
			}
		});

		keyboardEl.addEventListener('mouseout', function (e) {
			var to = e.relatedTarget;
			if (!to || !to.closest || !to.closest('.key.highlighted')) {
				hideTooltip();
			}
		});
	}

	function showTooltip(keyEl, text) {
		var keyRect = keyEl.getBoundingClientRect();
		var boxRect = keyboardEl.getBoundingClientRect();

		tooltip.textContent = text;
		tooltip.style.left = (keyRect.left - boxRect.left + keyRect.width / 2) + 'px';
		tooltip.style.top = (keyRect.top - boxRect.top) + 'px';
		tooltip.classList.add('visible');
	}

	function hideTooltip() {
		tooltip.classList.remove('visible');
	}

	function initKeyboard() {
		var shortcuts = config && config.keyboard;

		if (!shortcuts) {
			return;
		}

		var extras = [];

		Object.keys(shortcuts).forEach(function (rawKey) {
			var elements = keyMap[String(rawKey).trim().toUpperCase()];

			if (!elements) {
				extras.push(rawKey);
				return;
			}

			elements.forEach(function (keyEl) {
				keyEl.classList.add('highlighted');
				keyEl.dataset.tip = shortcuts[rawKey];
			});
		});

		// Atalhos que não existem no layout (ex.: botões do mouse) aparecem em uma lista abaixo
		if (extras.length > 0) {
			var fragment = document.createDocumentFragment();

			extras.forEach(function (rawKey) {
				var chip = document.createElement('div');
				chip.className = 'chip';

				var keyName = document.createElement('b');
				keyName.textContent = rawKey;

				var text = document.createElement('span');
				text.textContent = shortcuts[rawKey];

				chip.appendChild(keyName);
				chip.appendChild(text);
				fragment.appendChild(chip);
			});

			keyboardExtra.appendChild(fragment);
			keyboardExtra.hidden = false;
		}
	}

	function toggleKeyboard() {
		var open = keyboardContainer.classList.toggle('open');
		keyboardLabel.textContent = open ? 'OCULTAR ATALHOS' : 'MOSTRAR ATALHOS';
		hideTooltip();
	}

	/* =====================================================================
	   LOJA
	   ===================================================================== */
	function formatPrice(value) {
		return Number(value).toFixed(2).replace('.', ',');
	}

	function storeHtml(item) {
		return (item.discount ? '<p>DE R$' + formatPrice(item.discount) + '</p>' : '') +
			'<b>POR APENAS R$' + formatPrice(item.price) + '</b>';
	}

	function initStore() {
		var slideContainer = $('.store .slide');

		var bannerImg = document.createElement('img');
		bannerImg.className = 'bannerVip';
		bannerImg.alt = '';
		bannerImg.src = storeItems[0].image;

		var storeContent = document.createElement('div');
		storeContent.className = 'store-content';
		storeContent.innerHTML = storeHtml(storeItems[0]);

		var buttonsSlide = document.createElement('div');
		buttonsSlide.className = 'buttons-slide';

		storeItems.forEach(function (item, index) {
			// Pré-carrega os banners para a troca de slide não piscar
			new Image().src = item.image;

			var dot = document.createElement('div');
			dot.className = 'button-circle' + (index === 0 ? ' active' : '');
			dot.addEventListener('click', function () {
				changeSlide(index);
				restartSlideTimer();
			});
			buttonsSlide.appendChild(dot);
		});

		slideContainer.innerHTML = '';
		slideContainer.appendChild(bannerImg);
		slideContainer.appendChild(storeContent);
		slideContainer.appendChild(buttonsSlide);

		restartSlideTimer();
	}

	function restartSlideTimer() {
		clearInterval(slideTimer);

		if (storeItems.length > 1) {
			slideTimer = setInterval(function () {
				changeSlide((currentSlide + 1) % storeItems.length);
			}, 5000);
		}
	}

	function changeSlide(index) {
		currentSlide = index;

		var item = storeItems[index];
		var bannerImg = $('.store .bannerVip');
		var storeContent = $('.store .store-content');
		var dots = document.querySelectorAll('.store .button-circle');

		bannerImg.classList.add('swap');

		setTimeout(function () {
			// Se trocou de slide de novo nesse meio tempo, ignora
			if (currentSlide !== index) {
				return;
			}
			bannerImg.src = item.image;
			storeContent.innerHTML = storeHtml(item);
			bannerImg.classList.remove('swap');
		}, 250);

		Array.prototype.forEach.call(dots, function (dot, idx) {
			dot.classList.toggle('active', idx === index);
		});
	}

	/* =====================================================================
	   REDES SOCIAIS
	   ===================================================================== */
	function initSocials() {
		var socialsContainer = $('.socials');
		var fragment = document.createDocumentFragment();

		socials.forEach(function (social) {
			var link = document.createElement('div');
			link.className = 'social-link';
			link.addEventListener('click', function () {
				openUrl(social.url);
			});

			var img = document.createElement('img');
			img.src = social.image;
			img.alt = 'Rede social';

			link.appendChild(img);
			fragment.appendChild(link);
		});

		socialsContainer.innerHTML = '';
		socialsContainer.appendChild(fragment);
	}

	/* =====================================================================
	   PLAYER DE MÚSICA
	   ===================================================================== */
	function setVolume(value) {
		value = clamp(Number(value), 0, 1);
		music.volume = value;

		if (value > 0) {
			lastVolume = value;
		}

		volume.value = value;
		visibleVolume.style.height = (value * 7.6) + 'vh';
		volumeIcon.classList.toggle('muted', value === 0);
	}

	function loadSong(index) {
		currentSong = index;

		var item = playlist[index];

		playhead.style.transform = 'scaleX(0)';
		song.textContent = item.song || '';
		song.title = item.song || '';
		artist.textContent = item.artist || '';
		artist.title = item.artist || '';

		image.style.visibility = 'visible';
		image.src = item.image || '';

		// encodeURI evita problemas com espaços e acentos no nome do arquivo
		music.src = encodeURI(item.mp3);
		music.load();
	}

	var unlockArmed = false;

	// Navegadores comuns bloqueiam som sem interação. Se isso acontecer,
	// a música começa sozinha no primeiro clique/toque/tecla em qualquer lugar da tela.
	function armAutoplayUnlock() {
		if (unlockArmed) {
			return;
		}
		unlockArmed = true;

		var events = ['pointerdown', 'touchstart', 'keydown'];

		function unlock(e) {
			// Não interfere nos controles do próprio player nem nas teclas Espaço/H
			if (e.type === 'keydown' && (e.code === 'Space' || e.code === 'KeyH')) {
				return;
			}
			if (e.target && e.target.closest && e.target.closest('#player')) {
				return;
			}

			events.forEach(function (name) {
				document.removeEventListener(name, unlock, true);
			});
			unlockArmed = false;

			if (music.paused) {
				playMusic();
			}
		}

		events.forEach(function (name) {
			document.addEventListener(name, unlock, true);
		});
	}

	function playMusic() {
		var promise = music.play();

		if (promise && promise.catch) {
			promise.catch(function () {
				armAutoplayUnlock();
			});
		}
	}

	function toggleMusic() {
		if (music.paused || music.ended) {
			playMusic();
		} else {
			music.pause();
		}
	}

	function goNext() {
		if (playlist.length > 0) {
			loadSong((currentSong + 1) % playlist.length);
			playMusic();
		}
	}

	function goPrevious() {
		if (playlist.length > 0) {
			loadSong((currentSong - 1 + playlist.length) % playlist.length);
			playMusic();
		}
	}

	function initPlayer() {
		loadSong(currentSong);
		setVolume(playlist[currentSong].volume || 0.05);
		playMusic();
	}

	var lastElapsed = -1;

	music.addEventListener('ended', goNext);

	music.addEventListener('timeupdate', function () {
		if (music.duration) {
			var ratio = Math.round((music.currentTime / music.duration) * 1000) / 1000;

			// Só mexe no DOM quando o valor realmente mudou
			if (ratio !== lastElapsed) {
				lastElapsed = ratio;
				playhead.style.transform = 'scaleX(' + ratio + ')';
			}
		}
	});

	music.addEventListener('error', function () {
		console.error('Erro ao carregar a música:', music.src);
	});

	music.addEventListener('play', function () {
		player.classList.add('playing');
	});

	music.addEventListener('pause', function () {
		player.classList.remove('playing');
	});

	playButton.addEventListener('click', function () {
		if (music.paused || music.ended) {
			playMusic();
		}
	});

	pauseButton.addEventListener('click', function () {
		if (!music.paused && !music.ended) {
			music.pause();
		}
	});

	nextButton.addEventListener('click', goNext);
	previousButton.addEventListener('click', goPrevious);

	volume.addEventListener('input', function () {
		setVolume(volume.value);
	});

	// Clique no ícone silencia / reativa o som
	volumeIcon.addEventListener('click', function () {
		setVolume(music.volume > 0 ? 0 : (lastVolume || 0.1));
	});

	/* =====================================================================
	   PROGRESSO DO CARREGAMENTO
	   (o loop de animação só roda enquanto a barra está se movendo)
	   ===================================================================== */
	var progressFill = $('#progressFill');
	var percentEl = $('#percent');
	var statusText = $('#statusText');

	var targetProgress = 0;
	var shownProgress = 0;
	var lastPercent = -1;
	var progressFrame = 0;
	var gotRealProgress = false;

	function animateProgress() {
		progressFrame = 0;

		var diff = targetProgress - shownProgress;
		shownProgress = Math.abs(diff) < 0.0005 ? targetProgress : shownProgress + diff * 0.08;

		progressFill.style.transform = 'scaleX(' + shownProgress + ')';

		var percent = Math.round(shownProgress * 100);
		if (percent !== lastPercent) {
			lastPercent = percent;
			percentEl.textContent = percent + '%';
		}

		if (shownProgress !== targetProgress) {
			progressFrame = requestAnimationFrame(animateProgress);
		}
	}

	function setProgress(fraction) {
		// Nunca volta para trás
		targetProgress = Math.max(targetProgress, clamp(fraction, 0, 1));

		if (!progressFrame) {
			progressFrame = requestAnimationFrame(animateProgress);
		}
	}

	var STAGES = {
		INIT_CORE: 'INICIANDO O <b>NÚCLEO</b> DO JOGO',
		INIT_BEFORE_MAP_LOADED: 'PREPARANDO <b>RECURSOS</b>',
		INIT_AFTER_MAP_LOADED: 'FINALIZANDO <b>CARREGAMENTO</b>',
		INIT_SESSION: 'INICIANDO <b>SESSÃO</b>'
	};

	var currentStage = '';

	function setStatus(html) {
		if (html !== currentStage) {
			currentStage = html;
			statusText.innerHTML = html;
		}
	}

	// Eventos enviados pelo FiveM para a loadscreen
	window.addEventListener('message', function (event) {
		var data = event.data;

		if (!data || !data.eventName) {
			return;
		}

		switch (data.eventName) {
			case 'loadProgress':
				gotRealProgress = true;
				setProgress(data.loadFraction);
				break;

			case 'startInitFunctionOrder':
				if (STAGES[data.type]) {
					setStatus(STAGES[data.type]);
				}
				break;

			case 'startDataFileEntries':
			case 'performMapLoadFunction':
				setStatus('CARREGANDO O <b>MAPA</b>');
				break;
		}
	});

	// Simulação só para testar no navegador (fora do FiveM)
	function simulateProgress() {
		if (window.invokeNative) {
			return;
		}

		var timer = setInterval(function () {
			if (gotRealProgress || targetProgress >= 0.98) {
				clearInterval(timer);
				return;
			}
			setProgress(targetProgress + Math.random() * 0.03);
		}, 350);
	}

	/* =====================================================================
	   CURSOR (atualiza no máximo 1x por frame) E ATALHOS DE TECLADO
	   ===================================================================== */
	var cursorEl = $('#fare');
	var cursorX = window.innerWidth / 2;
	var cursorY = window.innerHeight / 2;
	var cursorQueued = false;

	function drawCursor() {
		cursorQueued = false;
		cursorEl.style.transform = 'translate3d(' + cursorX + 'px,' + cursorY + 'px,0)';
	}

	if (cursorEl) {
		drawCursor();

		document.addEventListener('mousemove', function (e) {
			cursorX = e.clientX;
			cursorY = e.clientY;

			if (!cursorQueued) {
				cursorQueued = true;
				requestAnimationFrame(drawCursor);
			}
		}, { passive: true });
	}

	document.addEventListener('keydown', function (e) {
		if (e.repeat) {
			return;
		}

		if (e.code === 'Space') {
			e.preventDefault();
			toggleMusic();
		} else if (e.code === 'KeyH') {
			toggleKeyboard();
		}
	});

	$('#keyboardToggle').addEventListener('click', toggleKeyboard);
	$('#storeButton').addEventListener('click', function () {
		openUrl(storeUrl);
	});

	/* =====================================================================
	   INICIALIZAÇÃO
	   ===================================================================== */
	function initializeApp() {
		if (storeItems.length > 0) {
			initStore();
		}

		if (socials.length > 0) {
			initSocials();
		}

		if (playlist.length > 0) {
			initPlayer();
		}

		initKeyboard();
	}

	// O que não depende do config.json sobe imediatamente
	buildKeyboard();
	initVideo();
	simulateProgress();

	fetch('./config.json')
		.then(function (response) {
			if (!response.ok) {
				throw new Error('HTTP ' + response.status + ' ao carregar config.json');
			}
			return response.json();
		})
		.then(function (data) {
			config = data;
			playlist = data.playlist || [];
			storeItems = data.store || [];
			socials = data.socials || [];
			storeUrl = data.store_url || '';

			initializeApp();
		})
		.catch(function (error) {
			console.error('Erro ao carregar config.json:', error);
			playlist = fallbackPlaylist;
			initializeApp();
		});
})();