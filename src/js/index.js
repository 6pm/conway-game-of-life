{
	const selector = document.getElementsByClassName('gameOfLife')[0]

	const getInitialState = () => {
		const state = Array(200).fill(0).map(() => Array(200).fill(0))

		state[0][1] = 1
		state[0][2] = 1
		state[4][4] = 1
		state[4][6] = 1
		state[5][5] = 1
		state[5][6] = 1
		state[5][7] = 1
		state[5][8] = 1
		state[5][9] = 1
		state[6][6] = 1
		state[6][7] = 1
		state[6][8] = 1
		state[6][9] = 1

		return state
	}

	const options = {
		gameSize: 200,
		itemWidth: 13,
		state: getInitialState()
	}

	new GameOfLife(selector, options)
}