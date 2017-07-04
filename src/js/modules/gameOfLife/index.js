// export default class GameOfLife

class GameOfLife {

  constructor(selector, options = {}) {
		this.itemWidth =  options.itemWidth || 15
		this.gameSize = options.gameSize || 200
		this.state = options.state || this.getInitialState(this.gameSize)
		this.selector = selector
		this.loop = false
		this.ifPlaying = false
		this.generation = 0
		this.interval = 2000
		this.history = []

		this.ctx = this.initCanvas(selector)
		this.renderNavigation()
		this.renderGenerationTitle()
		this.renderItems()
		this.renderHistory()
  }

	/**
	 * Створити початковий стан гри, де всі клітинки будуть пустими
	 * @param {Number} gameSize - число клітинок в довжину і ширину
	 * @return {Array} - двохмірний массив, заповнений нулями
	*/
	getInitialState(gameSize) {
		return Array(gameSize).fill(0).map(() => Array(gameSize).fill(0))
	}

	/**
	 * Створити заповнену(живу) клітинку по координатам
	 * @param {Number} row - координата рядка, в якому знаходиться необхідна клітинка
	 * @param {Number}  cell - координата стовбця клітинки
	*/
	drawFilledCell(row, cell) {
		this.ctx.fillStyle = '#28b929'
		this.ctx.fillRect(cell * this.itemWidth + 2, row * this.itemWidth + 2, this.itemWidth - 2, this.itemWidth - 2)
	}

	/**
	 * Створити пусту(мертву) клітинку по координатам
	 * @param {Number} row - координата рядка, в якому знаходиться необхідна клітинка
	 * @param {Number}  cell - координата стовбця клітинки
	*/
	drawEmptyCell(row, cell) {
		this.ctx.fillStyle = 'black'
		this.ctx.fillRect(cell * this.itemWidth, row * this.itemWidth, this.itemWidth, this.itemWidth)
		this.ctx.clearRect(cell * this.itemWidth + 1, row * this.itemWidth + 1, this.itemWidth - 1, this.itemWidth - 1)
	}

	/**
	 * Почати гру і зберегти setInterval в середині обєкта, щоб в майбутньому можна було його зупинити.
	 * @param {Number} interval - інтервал в ms, через яке буде гереруватись нове покоління
	*/
	startGameLoop(interval) {
		this.ifPlaying = true
		this.selector.classList.add('gol-playing')

		this.loop = setInterval(() => {
			this.makeGeneration()
			this.generation += 1
			this.updateGenerationCounter()
		}, interval)
	}

	/**
	 * Зупинити гру, очистити setInterval.
	*/
	stopGame() {
		this.ifPlaying = false
		this.selector.classList.remove('gol-playing')
		clearInterval(this.loop)
	}

	/**
	 * Створити нове покоління на основі попереднього. Перерендерються тільки ті клітинки,
	 * які поміняли стан.
	*/
	makeGeneration() {
		this.state.forEach((row, rowIndex) => {
			row.forEach((item, cellIndex) => {
				const parents = this.findParendCount(rowIndex, cellIndex)
				const ifStayLive = item && parents === 2 || parents === 3
				const ifAlive = !item && parents === 3

				// якщо клітинка була жива - оживити
				if (ifStayLive || ifAlive) {
					this.drawFilledCell(rowIndex, cellIndex)
					this.state[rowIndex][cellIndex] = 1
				} else {
					// перенаселення
					this.drawEmptyCell(rowIndex, cellIndex)
					this.state[rowIndex][cellIndex] = 0
				}
			})
		})
	}

	/**
	 * Знайти скільки сусідів має клітинка.
	 * @param {Number} row - координата рядка, на якій знаходиться клітинка
	 * @param {Number} cell - координата стовбця
	 * @return {Number} - кількість сусідів клітинки
	*/
	findParendCount(row, cell) {
		const parentChords = [
			{row: row - 1, cell: cell - 1},
			{row: row - 1, cell},
			{row: row - 1, cell: cell + 1},
			{row: row,     cell: cell - 1}, // eslint-disable-line no-multi-spaces
			{row: row,     cell: cell + 1},	// eslint-disable-line no-multi-spaces
			{row: row + 1, cell: cell - 1},
			{row: row + 1, cell},
			{row: row + 1, cell: cell + 1}
		]

		return parentChords.map((coordinate) => {
			try {
				return this.state[coordinate.row][coordinate.cell] || 0
			} catch(err) {
				return 0
			}
		}).reduce((a, b) => a + b)
	}

	// ЕВЕНТ ЛІСТЕНЕРИ

	/**
	 * Лістенер кліка по canvas. Якщо гра не йде, тоді поміняти стан клітинки.
	 * @param {Object} e - івент кліка
	*/
	onGameClick(e) {
		if (this.ifPlaying) return false

		const row = Math.ceil(e.offsetY / this.itemWidth) - 1
		const cell = Math.ceil(e.offsetX / this.itemWidth) - 1

		if (this.state[row][cell]) {
			this.state[row][cell] = 0
			this.drawEmptyCell(row, cell)
		} else {
			this.state[row][cell] = 1
			this.drawFilledCell(row, cell)
		}
	}

	/**
	 * Лістенер кнопки 'start' - запустити гру.
	*/
	onStartGame() {
		if (this.ifPlaying) return false

		this.ifPlaying = true
		this.selector.classList.add('gol-playing')
		this.startGameLoop(this.interval)
	}

	/**
	 * Лістенер кнопки 'pause' - поставити гру на паузу, але лічильник для покоління не обнуляти.
	*/
	onPauseGame() {
		this.stopGame()
	}

	/**
	 * Лістенер кнопки 'stop' - зупинити гру і обнулити покоління.
	*/
	onStopGame() {
		this.stopGame()
		this.generation = 0

		this.updateGenerationCounter()
	}

	/**
	 * Зміна швидкості гри. Зупинити гру, видалити setInterval і почати нову гру з новим інтервалом.
	*/
	onTimeIntervalChange(e) {
		this.interval = e.target.value

		if (this.ifPlaying) {
			this.stopGame()
			this.startGameLoop(this.interval)
		}
	}

	/**
	 * Зміна 'Zoom'. Зупинити гру, заново перерендерити всі елементи з новими розмірами і запустити знову гру.
	*/
	onZoomChange(e) {
		const ifPlaying = this.ifPlaying

		this.stopGame()
		this.itemWidth = e.target.value
		this.renderItems()

		if (ifPlaying) {
			this.startGameLoop(this.interval)
		}
	}

	/**
	 * Додати елемент до історії. Зберігається стан гри і покоління.
	*/
	saveToHistory() {
		this.history.push({
			// клонування this.state.concat() і this.state.slice(0) не працює,
			// тому довелось конвертувати в json і потім назад в массив
			state: JSON.parse(JSON.stringify(this.state)),
			generation: this.generation
		})

		const item = document.createElement('span')
		item.classList.add('gol-snapshot')
		item.setAttribute('data-history-position', this.history.length - 1)
		item.innerHTML = `Snapshot gen${this.generation}`
		item.addEventListener('click', this.onSnapshotClick.bind(this))

		this.historySelector.appendChild(item)
	}

	/**
	 * Відновити стан клітинок і покоління з історії.
	 * @param {Object} e - івент кліка
	*/
	onSnapshotClick(e) {
		this.stopGame()

		const index = e.target.getAttribute('data-history-position')
		this.state = this.history[index].state
		this.generation = this.history[index].generation

		this.updateGenerationCounter()
		this.renderItems()
	}

	// *****************
	// МЕТОДИ РЕНДЕРУ
	// *****************

	/**
	 * Створити тег canvas, добавити його в селектор і повернути контекст.
	 * @param {DOM element} selector - DOM селектор, на якаму був ініціалізований клас
	 * @return {Array} - контекст з canvas
	*/
	initCanvas(selector) {
		const canvasWrapper = document.createElement('div')
		canvasWrapper.classList.add('gol-canvas-wrap')

		const canvas = document.createElement('canvas')
		canvas.width = this.itemWidth * this.gameSize
		canvas.height = this.itemWidth * this.gameSize
		canvas.addEventListener('click', this.onGameClick.bind(this))

		canvasWrapper.appendChild(canvas)
		selector.appendChild(canvasWrapper)

		return canvas.getContext('2d')
	}

	/**
	 * Створити клітинки і добавити в canvas. Використовується для повного перезапису всіх клітинок.
	*/
	renderItems() {
		const size = this.itemWidth * this.gameSize
		const canvas = this.selector.getElementsByTagName('canvas')[0]
		canvas.width = size
		canvas.height = size
		this.ctx.clearRect(0, 0, size, size)

		this.state.forEach((row, rowIndex) => {
			row.forEach((item, cellIndex) => {
				// створити квадрати
				if (item) {
					this.drawFilledCell(rowIndex, cellIndex)
				} else {
					this.drawEmptyCell(rowIndex, cellIndex)
				}
			})
		})
	}

	/**
	 * Створити кнопки навігації: 'play', 'pause', 'start', 'stop', 'zoom', 'interval',
	 * і добавити в DOM.
	*/
	renderNavigation() {
		const wrapper = document.createElement('div')
		wrapper.classList.add('gol-navigation')

		const startBtn = document.createElement('span')
		startBtn.setAttribute('title', 'Start game')
		startBtn.addEventListener('click', this.onStartGame.bind(this))
		startBtn.classList.add('gol-start-btn')

		const pauseBtn = document.createElement('span')
		pauseBtn.setAttribute('title', 'Pause game')
		pauseBtn.addEventListener('click', this.onPauseGame.bind(this))
		pauseBtn.classList.add('gol-pause-btn')

		const stopBtn = document.createElement('span')
		stopBtn.setAttribute('title', 'Stop game')
		stopBtn.addEventListener('click', this.onStopGame.bind(this))
		stopBtn.classList.add('gol-stop-btn')

		const saveHistoryBtn = document.createElement('button')
		saveHistoryBtn.innerHTML = 'Save snapshot'
		saveHistoryBtn.classList.add('gol-save-history')
		saveHistoryBtn.addEventListener('click', this.saveToHistory.bind(this))


		const timeInput = this.renderRangeInput('Speed:', this.onTimeIntervalChange.bind(this), this.interval, 2000, 20000, 2000)
		const zoomInput = this.renderRangeInput('Zoom:', this.onZoomChange.bind(this), this.itemWidth)

		wrapper.appendChild(startBtn)
		wrapper.appendChild(pauseBtn)
		wrapper.appendChild(stopBtn)
		wrapper.appendChild(timeInput)
		wrapper.appendChild(zoomInput)
		wrapper.appendChild(saveHistoryBtn)

		this.selector.insertBefore(wrapper, this.selector.firstChild)
	}

	/** Cтворити DOM елемент з input type="range"
	 * @param {Text} text -назва поля
	 * @param {Function} action - функція, яка буде запускатись на зміну input
	 * @param {Number} value -початкове значення input
	 * @param {Number} min - мінімальне значення
	 * @param {Number} max - максимальне значення
	 * @param {Number} step - крок, за яким буде збільшуватись value
	 * @return {DOM element} - input з заголовком і стилізованими класами
	*/
	renderRangeInput(text, action, value = 1, min = 5, max = 25, step = 1) {
		const timeWrap = document.createElement('div')
		timeWrap.classList.add('gol-range')

		const title = document.createElement('span')
		const titleText = document.createTextNode(text)
		title.appendChild(titleText)
		timeWrap.appendChild(title)

		const timeInput = document.createElement('input')
		timeInput.addEventListener('change', action)
		timeInput.setAttribute('type', 'range')
		timeInput.setAttribute('value', value)
		timeInput.setAttribute('step', step)
		timeInput.setAttribute('min', min)
		timeInput.setAttribute('max', max)

		timeWrap.appendChild(timeInput)

		return timeWrap
	}

	/**
	 * Обновити число з поколіннями на сторінці.
	*/
	updateGenerationCounter() {
		const generationTitle = document.getElementsByClassName('gol-legend-generation')[0]
		generationTitle.innerHTML = `Generation: ${this.generation}`
	}

	/**
	 * Створити елемент, який буде показувати кількість поколінь гри і добавити його в DOM
	*/
	renderGenerationTitle() {
		const legendWrap = document.createElement('div')
		legendWrap.classList.add('gol-legend')

		const generationCounter = document.createElement('span')
		generationCounter.classList.add('gol-legend-generation')

		generationCounter.appendChild(document.createTextNode(`Generation: ${this.generation}`))
		legendWrap.appendChild(generationCounter)

		this.selector.insertBefore(legendWrap, this.selector.firstChild)
	}

	/**
	 * Створити елемент, який буде відображати збережені покоління і добавити його в DOM
	*/
	renderHistory() {
		const historyWrap = document.createElement('div')
		historyWrap.classList.add('gol-history')

		const title = document.createElement('span')
		title.classList.add('gol-history-title')
		title.appendChild(document.createTextNode('Saved history:'))

		const historyItems = document.createElement('div')
		historyItems.classList.add('gol-history-items')

		historyWrap.appendChild(title)
		historyWrap.appendChild(historyItems)

		this.selector.appendChild(historyWrap)
		this.historySelector = historyItems
	}

}
