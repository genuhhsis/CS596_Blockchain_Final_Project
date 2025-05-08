/* 
 * Genesis Anne Villar (RED ID: 824435476)
 * Connect4 Game Contract 
 * CS596: Cryptography and Blockchain (Prof. Li)
 *
 * This contract implements a decentralized Connect4 game on the blockchain.
 * Features:
 * - Player matchmaking
 * - Game state management
 * - Timeout mechanism
 * - Win detection (horizontal, vertical, diagonal)
 * - Visual representation of the game board
 * - deployed website url: https://gilded-crepe-8a7bda.netlify.app/
  --- NOTE TO IMPROVMEMENT, RE-ENTRY GUARDS?
 */

// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

contract Connect4Game 
{
    // core game struct  - stores all info abt a single game instance
    struct Game 
    {
        address player1; // player that is creator of game
        address player2; // player that joins game
        address currentPlayer;
        address winner;
        uint8[42] board; // a connect4 board is 7x6 board -- flattened 1D (save storage/gas)
        bool isActive;
        uint lastMoveTime; //timestamp of last move (for timeout detect)
        uint timeout; // timeout period (in seconds)
    }

    // constants for board
    uint8 constant COLS = 7; 
    uint8 constant ROWS = 6;
    uint8 constant EMPTY = 0; // value for empty cell
    uint8 constant PLAYER1_PIECE = 1; // player 1 
    uint8 constant PLAYER2_PIECE = 2; // player 2 

    // mapping of gameID to Game
    mapping(uint256 => Game) public games;
    uint256 public gameCounter; //games open for joining
    mapping(uint256 => bool) public availableGames;   // mapping to track available games for matchmaking
    
    // events for game updates
    // NOTE: for frontend integrations with .json/.css files
    event GameCreated(uint256 gameID, address player1);
    event PlayerJoined(uint256 gameID, address player2);
    event MoveMade(uint256 gameID, address player, uint8 column);
    event GameWon(uint256 gameID, address winner);
    event GameDraw(uint256 gameID);
    event GameTimeout(uint256 gameID, address winner);
    event BoardUpdated(uint256 gameID, string boardState);

    

    // -------------------- game creation and setup ---------------------

    /**
     * @dev Creates a new game with the specified timeout period -- timeout must be atleast 60 seconds
     * @param _timeoutInSeconds Timeout period in seconds
     * @return gameID of the newly created game
     */
    function createGame(uint _timeoutInSeconds) public returns (uint256)
    {
        require(_timeoutInSeconds >= 60, "time out must be at least 60 seconds");

        uint256 gameID = gameCounter; //assign next available gameID 
        gameCounter++;

        // initialize game state
        games[gameID].player1 = msg.sender; // player 1 = creator
        games[gameID].currentPlayer = msg.sender; // player 1 ALWAYS goes first
        games[gameID].isActive = true; //set to active game
        games[gameID].lastMoveTime = block.timestamp; // set inital timestamp
        games[gameID].timeout = _timeoutInSeconds; // set timeout period

        // initialize board with all empty cells
        for(uint8 i = 0; i < 42; i++) 
        {
            games[gameID].board[i] = EMPTY;
        }

        availableGames[gameID] = true; // mark game as available for matchmaking

        emit GameCreated(gameID, msg.sender);
        return gameID; 
    }


    /**
     * @dev Allows a player to join an existing game
     * @param _gameID ID of the game to join
     */

    function joinGame(uint256 _gameID) public
    {
        Game storage game = games[_gameID];

        // checks to see if join request is valid
        require(game.player1 != address(0), "game does not exist");
        require(game.player2 == address(0), "game is already full");
        require(game.player1 != msg.sender, "cannot play against yourself");
        require(availableGames[_gameID], "game is not available...");

        game.player2 = msg.sender; //set player 2
        game.lastMoveTime = block.timestamp; //reset timer when player2 joins

        availableGames[_gameID] = false; //remove game from availble games list

        emit PlayerJoined(_gameID, msg.sender);
    }

    

    // --------------------  game mechanic functions ---------------------------

    /**
     * @dev Allows current player to make a move
     * @param _gameID ID of the game
     * @param _column Column where the piece should be dropped (0-6)
     */
    function makeMove(uint256 _gameID, uint8 _column) external 
    {
        Game storage game = games[_gameID];

        // checks to see if move is valid
        require(game.isActive, "game is not active");
        require(msg.sender == game.currentPlayer, "not your turn");
        require(_column < COLS, "invalid column");
        require(!isColumnFull(_gameID, _column), "column is full");
        require(games[_gameID].player1 != address(0), "game does not exist");

        // check for timeout
        if (block.timestamp > game.lastMoveTime + game.timeout) 
        {
            handleTimeout(_gameID); //if timeout occurs, handle it and exit
            return;
        }

        // find the lowest empty row in the selected column (player pieces falling)
        uint8 row = findAvailableRow(_gameID, _column);

        uint8 piece;
        if (msg.sender == game.player1) //determine which player piece to place
        {
            piece = PLAYER1_PIECE;
        }
        else
        {
            piece = PLAYER2_PIECE;
        }

        game.board[row * COLS + _column] = piece; // update board
        game.lastMoveTime = block.timestamp; // update last move time

        emit MoveMade(_gameID, msg.sender, _column);
        emit BoardUpdated(_gameID, getVisualBoard(_gameID)); //update visually

        // check for win
        if (checkWin(_gameID, row, _column)) 
        {
            game.winner = msg.sender;
            game.isActive = false;
            emit GameWon(_gameID, msg.sender);
            return;
        }

        // check for draw (board is full)
        if (isBoardFull(_gameID)) 
        {
            game.isActive = false;
            emit GameDraw(_gameID);
            return;
        }

        // switch turns
        if(msg.sender == game.player1)
        {
            game.currentPlayer = game.player2;
        }
        else
        {
            game.currentPlayer = game.player1;
        }
    }

     /**
     * @dev helper function to find the lowest empty row in a column (pieces stack from bottom)
     * @param _gameID ID of the game
     * @param _column Column to check
     * @return Row index of the first empty cell (bottom-most)
     */
    function findAvailableRow(uint256 _gameID, uint8 _column) internal view returns (uint8) 
    {
        Game storage game = games[_gameID];

        for (uint8 row = 0; row < ROWS; row++) // start from bottom row (0) and go upwards
        {
            if (game.board[row * COLS + _column] == EMPTY) 
            {
                return row; //return successful lowest row
            }
        }
        revert("Column is full"); // ...added this just in case but should never happen because we check if column is full before calling this function
    }

    /**
     * @dev Check if a column is full (no more pieces can be placed)
     * @param _gameID ID of the game
     * @param _column Column to check
     * @return true if column is full, false otherwise
     */
    function isColumnFull(uint256 _gameID, uint8 _column) internal view returns (bool) 
    {
        Game storage game = games[_gameID]; //get reference to game
        
        uint8 topRowIndex = (ROWS - 1); // top row index (5 in a standard board)
        uint8 topCellIndex = topRowIndex * COLS + _column; 
        
        bool isEmpty = (game.board[topCellIndex] == EMPTY); // check if top cell is empty

        // if top cell is empty = column is NOT full
        // if top cell is NOT empty = column IS full
        bool isFull = !isEmpty; 

        return isFull;
    }

    /**
    * @dev Check if the entire board is full (draw condition)
    * @param _gameID ID of the game
    * @return true if board is full, false otherwise
    */
    function isBoardFull(uint256 _gameID) internal view returns (bool) 
    {

        for (uint8 col = 0; col < COLS; col++) //check each column one by one
        {
            bool currentColumnIsFull = isColumnFull(_gameID, col); //for each column, check if its full

            if (!currentColumnIsFull) // if we find any column that is NOT full = board is NOT full
            {
                return false;
            }
        }

        return true;
    }

    // --------- time out handling functions ------------

    /**
     * @dev Internal function to handle game timeout
     * @param _gameID ID of the game
    */
    function handleTimeout(uint256 _gameID) internal 
    {
        Game storage game = games[_gameID];

        // declare non-current player as winner (player who didnt timeout)
        address timeoutWinner;
        if (game.currentPlayer == game.player1)
        {
            timeoutWinner = game.player2;
        }
        else
        {
            timeoutWinner = game.player1;
        }

        game.winner = timeoutWinner; //update the gamestate to a win
        game.isActive = false; // flag that match has concluded (inactive)

        emit GameTimeout(_gameID, timeoutWinner);
    }

    /**
     * @dev External function to check for timeout (can be called by anyone)
     * @param _gameID ID of the game
    */
    function checkTimeout(uint256 _gameID) external
    {
        Game storage game = games[_gameID];

        require(game.isActive, "Game is not active");
        require(block.timestamp > game.lastMoveTime + game.timeout, "Timeout period not reached");

        handleTimeout(_gameID);
    }

    /**
    * @dev External function systematically checks all existing games 
    * and automatically resolves any that have timed out 
    * but haven't been officially closed yet
    * NOTE: This can be called by anyone
    */
    function cleanupTimedOutGames() external 
    {
       for (uint256 i = 0; i < gameCounter; i++) //loop through every game in contract
       {
            // for each game check if game is still active AND timeout period expired since last move 
            if (games[i].isActive && block.timestamp > games[i].lastMoveTime + games[i].timeout) 
            {
                handleTimeout(i);
            }
       }
    }   

    /// ---------------- win condition checking functions -------------

    /**
     * @dev Check for win after a move
     * @param _gameID ID of the game
     * @param _row Row of the last move
     * @param _column Column of the last move
     * @return true if the last move resulted in a win
    */
    function checkWin(uint256 _gameID, uint8 _row, uint8 _column) internal view returns (bool) 
    {
        Game storage game = games[_gameID];
        uint8 piece = game.board[_row * COLS + _column];
        
        //check all possible win patterns FROM THE LAST MOVE..

        // check horizontal win (4 in a row)
        if (checkHorizontal(_gameID, _row, piece)) 
        {
            return true;
        }
        
        // check vertical win (4 in a column)
        if (checkVertical(_gameID, _column, piece)) 
        {
            return true;
        }
        
        // check diagonal wins
        if (checkDiagonal(_gameID, _row, _column, piece)) 
        {
            return true;
        }
        
        return false; // false if no wins were detected
    }
    
    /**
     * @dev Check for horizontal win (4 in a row)
     * @param _gameID ID of the game
     * @param _row Row to check
     * @param _piece Piece type to check (1 for player1, 2 for player2)
     * @return true if 4-in-a-row found
    */
    function checkHorizontal(uint256 _gameID, uint8 _row, uint8 _piece) internal view returns (bool) 
    {
        Game storage game = games[_gameID];
        uint8 count = 0;
        
        for (uint8 col = 0; col < COLS; col++)  //check each cell in the ROW, counting consecutive piece
        {
            if (game.board[_row * COLS + col] == _piece) 
            {
                count++;
                if (count == 4) // 4 in a row HORIZONTALLY found
                {
                    return true;
                }
            } 
            else 
            {
                count = 0; //reset counter if difference piece found
            }
        }
        
        return false;
    }
    
    /**
     * @dev Check for vertical win (4 in a column)
     * @param _gameID ID of the game
     * @param _column Column to check
     * @param _piece Piece type to check (1 for player1, 2 for player2)
     * @return true if 4-in-a-column found
     */
    function checkVertical(uint256 _gameID, uint8 _column, uint8 _piece) internal view returns (bool) 
    {
        Game storage game = games[_gameID];
        uint8 count = 0;
        
        for (uint8 row = 0; row < ROWS; row++)  //check each cell in the COLUMN, counting consecutive piece
        {
            if (game.board[row * COLS + _column] == _piece) 
            {
                count++;
                if (count == 4) // 4 in a row VERTICALLY found
                {
                    return true;
                }
            } 
            else 
            {
                count = 0; //reset counter if diff piece found
            }
        }
        
        return false;
    }
    
    /**
     * @dev Check for diagonal wins (both diagonals)
     * @param _gameID ID of the game
     * @param _row Row of the last move
     * @param _column Column of the last move
     * @param _piece Piece type to check (1 for player1, 2 for player2)
     * @return true if either diagonal has 4-in-a-row
     */
    function checkDiagonal(uint256 _gameID, uint8 _row, uint8 _column, uint8 _piece) internal view returns (bool) 
    {
        // check diagonal (bottom-left to top-right /)
        if (checkDiagonalBottomLeftToTopRight(_gameID, _row, _column, _piece)) 
        {
            return true;
        }
        
        // check diagonal (top-left to bottom-right \)
        if (checkDiagonalTopLeftToBottomRight(_gameID, _row, _column, _piece)) 
        {
            return true;
        }
        
        return false;
    }

    /** 
     * @dev helper function for checkDiagonal win (bottom-left to top-right: /)
     * @param _gameID ID of the game
     * @param _row Row of the last move
     * @param _column Column of the last move
     * @param _piece Piece type to check (1 for player1, 2 for player2)
     * @return true if diagonal has 4-in-a-row
     */
    function checkDiagonalBottomLeftToTopRight(uint256 _gameID, uint8 _row, uint8 _column, uint8 _piece) internal view returns (bool) 
    {
        Game storage game = games[_gameID];

        uint8 min= 0; // find minimum of row + column to determine how far to go diagonally down-left that contains _row + _column
        if( _row < _column)
        {
            min = _row; // if ROW is smaller, can only go down given steps
        }
        else
        {
            min = _column; // if COLUMN is smaller, can only go left given steps
        }

        //calculate starting position at bottom left diagonal by min steps diagonaly down left from current position
        // convert to signed int to account for direction (-/+)
        int8 startRow = int8(_row) - int8(min); //lowest possible row on diagonal 
        int8 startCol = int8(_column) - int8(min); //left most possible column on diagonal

        uint8 count = 0; //consecutive piece count
        uint8 maxSteps = 0; // find max steps available for diagonally up-right (from starting position)
        if(ROWS - uint8(startRow) < COLS - uint8(startCol)) 
        {
            maxSteps = ROWS - uint8(startRow); // top row limits
        }
        else
        {
            maxSteps = COLS - uint8(startCol); // rightmost column limits
        }

        for (uint8 i = 0; i < maxSteps; i++)  // traverse diagonal and check each cell along diagonal for matching pieces
        {
            //calculate current position by moving i steps up-right from starting position
            uint8 r = uint8(startRow) + i; // move up
            uint8 c = uint8(startCol) + i; // move right

            if (game.board[r * COLS + c] == _piece) //check if current cell contains piece looking for
            {
                count++;// if matching piece, increment count

                if (count == 4) 
                {
                    return true; // 4 in a row bottom left top right (/) found
                }
            } 
            else 
            {
                count = 0; // reset counter if diff piece or empty cell
            }
        }
            return false; // NO 4 in a row bottom left top right (/) found
    }


     /**
     * @dev Check for diagonal win (top-left to bottom-right: \)
     * @param _gameID ID of the game
     * @param _row Row of the last move
     * @param _column Column of the last move
     * @param _piece Piece type to check (1 for player1, 2 for player2)
     * @return true if diagonal has 4-in-a-row
     */
    function checkDiagonalTopLeftToBottomRight(uint256 _gameID, uint8 _row, uint8 _column, uint8 _piece) internal view returns (bool) 
    {
        Game storage game = games[_gameID];

        // find how far we can go left and up
        uint8 minCol = _column; // max left steps
        uint8 maxRowSteps = ROWS - 1 - _row; //max up steps before reaching top row

        uint8 min;
        if(minCol < maxRowSteps) // find limit factor
        {
            min = minCol; //limited by leftmost column row
        }
        else 
        {
            min = maxRowSteps; // limited by reaching top row
        }

        //calculate starting position top left from current position by moving min steps diagonally up left from current position
        // convert to signed int to account for direction (-/+)
        int8 startRow = int8(_row) + int8(min); //top most row on this diagonal
        int8 startCol = int8(_column) - int8(min); // left most column on this diagonal

        uint8 count = 0; //consecutive piece count
        uint8 maxSteps; //max steps we can take diagonally down right
        if(uint8(startRow) + 1 < COLS - uint8(startCol)) 
        {
            maxSteps = uint8(startRow) + 1; // bottom row limit
        }
        else 
        {
            maxSteps = COLS - uint8(startCol); //right most column limit
        }

        for (uint8 i = 0; i < maxSteps; i++) // traverse diagonal and check each cell along diagonal for matching pieces
        {
            //calculate current position by moving i steps down-right from starting position
            uint8 r = uint8(startRow) - i; // move down
            uint8 c = uint8(startCol) + i; // move right

            if (game.board[r * COLS + c] == _piece) //check if current cell contains piece looking for
            {
                count++; // if matching piece, increment count
                if (count == 4) 
                {
                    return true; // 4 in a row top left bottom right (\) found
                }
            } 
            else 
            {
                count = 0;  // reset counter if diff piece or empty cell
            }
        }

        return false;  // NO 4 in a row top left bottom right (\) found
    }   

    // -------------------------- matchmaking functions ------------------

    /**
     * @dev Returns array of all available game IDs for matchmaking
     * @return Array of game IDs that are open for players to join
     */
    function getAvailableGames() external view returns (uint256[] memory) 
    {
        uint256 count = 0;

        // count available games
        for (uint256 i = 0; i < gameCounter; i++) 
        {
            if (availableGames[i]) 
            {
                count++; //count for all available games
            }
        }

        uint256[] memory availableGameIDs = new uint256[](count); // create fixed size array of available game IDs

        uint256 index = 0;
        for (uint256 i = 0; i < gameCounter; i++) 
        {
            if (availableGames[i]) 
            {
                availableGameIDs[index] = i; //fill array with gameIDs
                index++;
            }
        }

        return availableGameIDs;
    }

     /**
     * @dev Automatic matchmaking - join existing game or create new one
     * @param _timeoutInSeconds Timeout for new game (if created)
     * @return Game ID of joined or created game
     */
    function autoMatchmaking(uint _timeoutInSeconds) external returns (uint256) 
    {
        // first: try to find an available game
        for (uint256 i = 0; i < gameCounter; i++) 
        {
            if (availableGames[i] && games[i].player1 != msg.sender)  //if available game is found AND user did not create a game
            {
                joinGame(i); //user joins game
                return i;
            }
        }

        // if no available game found... create a new one w/ timeout value given
        return createGame(_timeoutInSeconds);
    }

    // ---------- utility functions --------------------

    function getGameState(uint256 _gameID) external view returns 
        (
        address player1,
        address player2,
        address currentPlayer,
        address winner,
        uint8[42] memory board,
        bool isActive,
        uint lastMoveTime,
        uint timeout
        ) 

        {
            Game storage game = games[_gameID];

            return (
                game.player1,
                game.player2,
                game.currentPlayer,
                game.winner,
                game.board,
               game.isActive,
               game.lastMoveTime,
               game.timeout
            );
        }

    /**
     * @dev Get visual representation of the game board
     * @param _gameID ID of the game
     * @return ASCII string representation of game board
     */
   function getVisualBoard(uint256 _gameID) public view returns (string memory) 
   {
    Game storage game = games[_gameID];

    bytes memory visualBoard = new bytes(1500); // allocate memory for the string
    uint index = 0;

    //title bar
    string memory topLine = "|----- CONNECT 4 GAME -----|";
    for (uint i = 0; i < bytes(topLine).length; i++) //for each char of string topLine
    {
        visualBoard[index++] = bytes(topLine)[i];  // add topLine to visualBoard
    }

    // add column numbers header
    visualBoard[index++] = ' ';
    visualBoard[index++] = 'C';
    visualBoard[index++] = 'O';
    visualBoard[index++] = 'L';
    visualBoard[index++] = ':';
    visualBoard[index++] = ' ';
    for (uint8 col = 0; col < COLS; col++) 
    {
        visualBoard[index++] = bytes1(uint8(col) + 48); // convert digit to ASCII
        visualBoard[index++] = ' ';
    }
    visualBoard[index++] = '|';

    //title bar
    string memory topLine2 = "-------------------------------------------------------------------------------------------------------------------------------------------|";
    for (uint i = 0; i < bytes(topLine2).length; i++) //for each char of string topLine
    {
        visualBoard[index++] = bytes(topLine2)[i];  // add topLine2 to visualBoard
    }

    string[6] memory rowLabels = ["ROW5", "ROW4", "ROW3", "ROW2", "ROW1", "ROW0"]; //top to bottom row labels
    
    for (int8 row = int8(ROWS) - 1; row >= 0; row--) // add board content (from top to bottom)
    {
        string memory rowLabel = rowLabels[uint8(int8(ROWS) - 1 - row)]; 
        for (uint j = 0; j < bytes(rowLabel).length; j++) 
        {
            visualBoard[index++] = bytes(rowLabel)[j]; // add row label to visualBoard
        }
        visualBoard[index++] = ':';
        visualBoard[index++] = ' ';
        
        // add row cells w/ data of player pieces/space available
        for (uint8 col = 0; col < COLS; col++) 
        {
            uint8 piece = game.board[uint8(row) * COLS + col];
            if (piece == EMPTY) 
            {
                visualBoard[index++] = '.'; // empty cell
            } 
            else if (piece == PLAYER1_PIECE) 
            {
                visualBoard[index++] = 'X'; // player 1 pieces
            } 
            else if (piece == PLAYER2_PIECE) 
            {
                visualBoard[index++] = 'O'; // player 2 pieces
            }
            visualBoard[index++] = ' ';
        }
        visualBoard[index++] = '|';

        // add row separator after each row except the last one
        if (row > 0) 
        {
            string memory rowSeparator = "-------------------------------------------------------------------------------------------------------------------------------------------|";
            for (uint i = 0; i < bytes(rowSeparator).length; i++) 
            {
                visualBoard[index++] = bytes(rowSeparator)[i];
            }
        }
    }

    // add a legend
    string memory legend = "-------- LEGEND: X = Player 1, O = Player 2, . = Empty";
    for (uint i = 0; i < bytes(legend).length; i++) 
    {
        visualBoard[index++] = bytes(legend)[i];
    }

    // create the final string with the correct length
    bytes memory result = new bytes(index);
    for (uint i = 0; i < index; i++) 
    {
        result[i] = visualBoard[i];
    }

    return string(result);
    }

     /**
     * @dev getter function for readable game information
     * @param _gameID ID of the game
     * @return String with formatted game info
     */
    function getGameInfo(uint256 _gameID) public view returns (string memory) 
    {
        Game storage game = games[_gameID]; 

        string memory status;
        if (!game.isActive && game.winner != address(0)) // check for game status
        {
            status = "Completed (Winner)"; //if game is complete and there is a winner
        } 
        else if (!game.isActive) 
        {
            status = "Completed (Draw)"; // if game is complete but there is NO winner
        } 
        else if (game.player2 == address(0)) 
        {
            status = "Waiting for player 2 (Need another player)"; //if there is a game, but there is no opponent
        } 
        else 
        {
            status = "In progress"; // there is a game but not completed AND there is an opponent
        }

        string memory currentPlayerText;
        if(game.currentPlayer == game.player1) //check whos turn it
        {
            currentPlayerText = "Player 1";
        }
        else 
        {
            currentPlayerText = "Player 2";
        }

        //format all information together
        return string(abi.encodePacked
        (
            " | Game ID: ", uint2str(_gameID),
            " | Status: ", status,
            " | Current Turn: ", currentPlayerText, 
            " | Time since last move: ", uint2str(block.timestamp - game.lastMoveTime), " seconds|",
            " | Timeout period: ", uint2str(game.timeout), " seconds|"
        ));
    }

    /**
     * @dev helper function to convert uint to string
     * @param _i Integer to convert
     * @return String representation of the integer
     */
    function uint2str(uint _i) internal pure returns (string memory) 
    {
        if (_i == 0) 
        {
            return "0";
        }
        uint j = _i;
        uint len;
        while (j != 0) 
        {
            len++;
            j /= 10;
        }
        bytes memory bstr = new bytes(len);
        uint k = len;
        while (_i != 0) 
        {
            k = k-1;
            uint8 temp = (48 + uint8(_i - _i / 10 * 10));
            bytes1 b1 = bytes1(temp);
            bstr[k] = b1;
            _i /= 10;
        }
        return string(bstr);
    }

    // -------------- debug functions -----------------
    // Note: in a real world scenario, you would not want ANY of these functions public...

    // function will create a game with predefined moves (for testing)
    function createTestGame() public returns (uint256) 
    {
        uint256 gameID = createGame(600); // 10 minute timeout

        // set player2 (normally done through joinGame)
        games[gameID].player2 = address(0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2); // example 2nd account
        availableGames[gameID] = false;

        // make some predefined moves for testing (this mapping is for almost a win for player 1)
        uint8[42] memory testBoard = 
        [
            0, 0, 0, 1, 2, 2, 2,  // bottom row ROW 0
            0, 0, 0, 0, 1, 2, 2,  // ROW 1
            0, 0, 0, 0, 0, 1, 2,  // ROW 2
            0, 0, 0, 0, 0, 0, 0,  // ROW 3
            0, 0, 0, 0, 0, 0, 0,  // ROW 4
            0, 0, 0, 0, 0, 0, 0   // top row ROW 5
        ];

        for (uint8 i = 0; i < 42; i++) 
        {
            games[gameID].board[i] = testBoard[i];
        }

        // reset game state so its playable
        games[gameID].isActive = true;  // flag game as active
        games[gameID].winner = address(0); // no winner
        games[gameID].lastMoveTime = block.timestamp;
        games[gameID].currentPlayer = games[gameID].player1; // set the current player

        return gameID;
    }

    // function lets you manually set a cell (for testing)
    function debugSetCell(uint256 _gameID, uint8 _row, uint8 _col, uint8 _value) public 
    {
        require(_row < ROWS && _col < COLS, "invalid position");
        require(_value <= 2, "invalid piece value");

        Game storage game = games[_gameID];
        game.board[_row * COLS + _col] = _value;

        emit BoardUpdated(_gameID, getVisualBoard(_gameID));
    }

    // function tests the win detection (for testing)
    function debugCheckWin(uint256 _gameID, uint8 _row, uint8 _col) public view returns (bool) 
    {
        return checkWin(_gameID, _row, _col);
    }

}
