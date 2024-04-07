class Game {
	constructor() {
		// Initialize game variables
		this.board = new Chessboard(this)
		this.state = this.board.boardArray120

		// Initialize audio effects
		this.moveSound = new Audio('/assets/sounds/move.mp3')
		this.captureSound = new Audio('/assets/sounds/capture.mp3')

		// Default game settings
		this.startPosition = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR'
		this.currentTurn = 'white'
		this.gameOver = false

		// Bind event handling method
		this.squareClicked = this.squareClicked.bind(this)
		this.selectedSquare = null
		this.validMoves = []
		this.movesHistory = []
		this.undoneMoves = []
	}

	start() {
		this.movesHistory = []
		this.undoneMoves = []
		this.board.draw(this.startPosition)
	}

	//!-------------- Event Handling Methods --------------

	// Handle square click events
	squareClicked(event) {
		const square = event.currentTarget
		if (!this.selectedSquare) {
			this.onFirstClick(square)
		} else {
			if (square === this.selectedSquare) {
				this.resetSquareSelection()
			} else if (this.isPiecesTurn(square)) {
				this.resetSquareSelection()
				this.onFirstClick(square)
			} else {
				this.onSecondClick(square)
			}
		}
	}

	// Actions on first click
	onFirstClick(square) {
		this.selectedSquare = square
		const piece = this.selectedSquare.querySelector('.piece')
		if (this.isPiecesTurn(this.selectedSquare)) {
			this.validMoves = this.getValidMoves(piece.id, parseInt(this.selectedSquare.getAttribute('index120')))
			this.board.highlightSquares(this.validMoves)
			this.selectedSquare.classList.add('clickedSquare')
		}
	}

	// Actions on second click
	onSecondClick(square) {
		if (this.isPiecesTurn(this.selectedSquare) && this.isMoveInValidMoves(square)) {
			const fromCoord = this.selectedSquare.getAttribute('coordinate')
			const toCoord = square.getAttribute('coordinate')
			const piece = this.board.getSquarePieceObj(fromCoord).name
			const capturedPiece = this.getCapturedPiece(toCoord)
			this.board.move(fromCoord, toCoord)
			if (capturedPiece) {
				this.captureSound.play()
			} else {
				this.moveSound.play()
			}
			const move = new Move(piece, fromCoord, toCoord, capturedPiece)
			this.movesHistory.push(move)
			this.resetSquareSelection()
			this.switchTurn()
			this.undoneMoves = []
		}
	}

	// Reset square selection and valid moves
	resetSquareSelection() {
		if (this.selectedSquare) {
			this.selectedSquare.classList.remove('clickedSquare')
			this.board.unhighlightSquares(this.validMoves)
			this.selectedSquare = null
			this.validMoves = []
		}
	}

	//!-------------- Move Related Methods --------------

	// Undo the last move
	undo() {
		if (this.movesHistory.length === 0) {
			console.log('No moves to undo.')
			return
		}
		const lastMove = this.movesHistory.pop()
		const fromCoord = lastMove.toCoord
		const toCoord = lastMove.fromCoord
		const capturedPiece = lastMove.capturedPiece
		this.board.move(fromCoord, toCoord)
		if (capturedPiece) this.board.place(capturedPiece, fromCoord)
		if (capturedPiece) {
			this.captureSound.play()
		} else {
			this.moveSound.play()
		}
		this.switchTurn()
		this.undoneMoves.push(lastMove)
	}

	// Redo the last undone move
	redo() {
		if (this.undoneMoves.length === 0) {
			console.log('No moves to redo.')
			return
		}
		const lastUndoneMove = this.undoneMoves.pop()
		const fromCoord = lastUndoneMove.fromCoord
		const toCoord = lastUndoneMove.toCoord
		this.board.move(fromCoord, toCoord)
		if (lastUndoneMove.capturedPiece) {
			this.captureSound.play()
		} else {
			this.moveSound.play()
		}
		this.movesHistory.push(lastUndoneMove) // Restore move to history
		this.switchTurn() // Restore turn change
	}

	// Print move history
	printMoveHistory() {
		if (this.movesHistory.length === 0) {
			return 'No moves have been made yet.'
		} else {
			let historyString = 'Move History:\n'
			this.movesHistory.forEach((move, index) => {
				historyString += `${index + 1}. ${move.toChessNotation()} (${move.toString()})\n`
			})
			return historyString
		}
	}

	//!-------------- Utility Methods --------------

	// Switch turn between players
	switchTurn() {
		this.currentTurn = this.currentTurn === 'white' ? 'black' : 'white'
		console.log(this.printMoveHistory())
	}

	// Generate a random FEN string
	makeRandomFEN() {
		// Generate random piece placement for White
		let blackPieces = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r']
		for (let i = blackPieces.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1))
			;[blackPieces[i], blackPieces[j]] = [blackPieces[j], blackPieces[i]]
		}
		let fen = blackPieces.join('') + '/pppppppp/8/8/8/8/PPPPPPPP/'
		let whitePieces = blackPieces
			.map((piece) => {
				return piece.toUpperCase()
			})
			.join('')
		fen += whitePieces
		return fen
	}

	// Method to shuffle an array
	shuffle(array) {
		for (let i = array.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1))
			;[array[i], array[j]] = [array[j], array[i]]
		}
		return array
	}

	// Get captured piece at the destination square
	getCapturedPiece(toCoord) {
		const pieceAtDestination = this.board.getSquarePieceHtml(toCoord)
		return pieceAtDestination ? pieceAtDestination.id : null
	}

	// Check if the clicked square contains the current player's piece
	isPiecesTurn(square) {
		const piece = square.querySelector('.piece')
		return piece && piece.classList.contains(this.currentTurn)
	}

	// Check if the move is within valid moves
	isMoveInValidMoves(square) {
		const toSquare = square.getAttribute('index120')
		return this.validMoves.includes(parseInt(toSquare))
	}

	//!-------------- Move validation Methods --------------

	// Get valid moves for a piece at a given position
	getValidMoves(piece, currentPosition) {
		const colour = piece === piece.toUpperCase() ? 'white' : 'black'
		const pieceType = piece.toLowerCase()
		// prettier-ignore
		switch (pieceType) {
			case 'p': return this.getPawnMoves(currentPosition, colour)
			case 'n': return this.getKnightMoves(currentPosition, colour, [-21, -19, -12, -8, 8, 12, 19, 21])
			case 'b': return this.getSlidingMoves(currentPosition, colour, [-11, -9, 9, 11])
			case 'r': return this.getSlidingMoves(currentPosition, colour, [-10, -1, 1, 10])
			case 'q': return this.getSlidingMoves(currentPosition, colour, [-10, -1, 1, 10, -11, -9, 9, 11])
			case 'k': return this.getKingMoves(currentPosition, colour, [-11, -10, -9, -1, 1, 9, 10, 11])
			default: return [] // No valid moves for unknown pieces
		}
	}

	// Get valid moves for a knight
	getKnightMoves(currentPosition, colour, offsets) {
		let validMoves = []
		for (let offset of offsets) {
			const newPosition = currentPosition + offset
			if (this.board.isBoardIndex(newPosition) && !this.board.isOccupiedByAlly(newPosition, colour)) {
				validMoves.push(newPosition)
			}
		}
		return validMoves
	}

	// Get valid moves for a king
	getKingMoves(currentPosition, colour, offsets) {
		let validMoves = []
		for (let offset of offsets) {
			const newPosition = currentPosition + offset
			if (this.board.isBoardIndex(newPosition) && !this.board.isOccupiedByAlly(newPosition, colour)) {
				validMoves.push(newPosition)
			}
		}
		return validMoves
	}

	// Get valid moves for a pawn
	getPawnMoves(currentPosition, colour) {
		const dir = colour === 'white' ? -1 : 1 // Determines the direction which the pawn moves (white moves upwards, black moves downwards)
		const startingRank = colour === 'white' ? 8 : 3
		const offsets = [10 * dir]
		let validMoves = []

		// If the pawn is on its starting rank, it can move forward two squares
		if (
			Math.floor(currentPosition / 10) === startingRank &&
			!this.board.isOccupied(currentPosition + 10 * dir) && // Check if the square one step forward is unoccupied
			!this.board.isOccupied(currentPosition + 20 * dir) // Check if the square two steps forward is unoccupied
		) {
			offsets.push(20 * dir)
		}

		// Check forward moves
		for (let offset of offsets) {
			const newPosition = currentPosition + offset
			if (this.board.isBoardIndex(newPosition) && !this.board.isOccupied(newPosition)) {
				validMoves.push(newPosition)
			}
		}

		// Check diagonal capture moves
		const captureOffsets = [9 * dir, 11 * dir] // Diagonal capture offsets
		for (let offset of captureOffsets) {
			const newPosition = currentPosition + offset
			if (this.board.isBoardIndex(newPosition) && this.board.isOccupiedByOpponent(newPosition, colour)) {
				validMoves.push(newPosition)
			}
		}

		return validMoves // Returns an array of valid move indices for the pawn
	}

	// Get valid sliding moves (bishop, rook, queen)
	getSlidingMoves(currentPosition, colour, offsets) {
		let validMoves = []
		for (let offset of offsets) {
			let newPosition = currentPosition + offset
			while (this.board.isBoardIndex(newPosition) && !this.board.isOccupiedByAlly(newPosition, colour)) {
				validMoves.push(newPosition)
				if (this.board.isOccupiedByOpponent(newPosition, colour)) break
				newPosition += offset
			}
		}
		return validMoves
	}

	// Get all possible moves of the specified colour
	getAllMoves(colour) {
		let allMoves = []
		for (let i = 21; i <= 98; i++) {
			if (this.board.isOccupiedByAlly(i, colour)) {
				const fromcoord = this.board.index120ToCoordinate(i)
				const piece = this.board.getSquarePieceObj(fromcoord).name
				const validMoves = this.getValidMoves(piece, i)
				allMoves.push(...validMoves.map((move) => [fromcoord, this.board.index120ToCoordinate(move)]))
			}
		}
		return allMoves
	}
}

// Class representing a move in the game
class Move {
	constructor(piece, fromCoord, toCoord, capturedPiece = null) {
		this.piece = piece
		this.fromCoord = fromCoord
		this.toCoord = toCoord
		this.capturedPiece = capturedPiece
	}

	//!-------------- String Conversion Methods --------------

	// Convert move to string representation
	toString() {
		let moveString = `${this.piece} from ${this.fromCoord} to ${this.toCoord}`
		if (this.capturedPiece) moveString += `, capturing ${this.capturedPiece}`
		return moveString
	}

	// Convert move to chess notation
	toChessNotation() {
		const pieceNotation = this.piece
		const toNotation = this.toCoord
		let moveNotation = pieceNotation
		if (this.capturedPiece) moveNotation += 'x'
		moveNotation += toNotation
		return moveNotation
	}
}
