import React from 'react';
import { useRef } from 'react';
import { useState } from 'react';
import './Game.css';

const CELL_SIZE = 10;
const WIDTH = 1200;
const HEIGHT = 550;

export const Cell = ({x, y})=> {
    return (
        <div className="Cell" style={{
            left: `${CELL_SIZE * x + 1}px`,
            top: `${CELL_SIZE * y + 1}px`,
            width: `${CELL_SIZE - 1}px`,
            height: `${CELL_SIZE - 1}px`,
        }} />
    );
}

export const Game = () => {  
    const rows = HEIGHT / CELL_SIZE
    const cols = WIDTH / CELL_SIZE
    const interval = 100
    let boardRef = useRef()
    const [board, setBoard] =  useState(makeEmptyBoard())
    const [cells, setCells] = useState([])

    function makeEmptyBoard() {
        let board = [];
        for (let y = 0; y < rows; y++) {
            board[y] = [];
            for (let x = 0; x < cols; x++) {
                board[y][x] = false;
            }
        }

        return board;
    }
    
    function callStep() {
        
    }

    function makeCells() {
        let cells = [];
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                if (board[y][x]) {
                    cells.push({ x, y });
                }
            }
        }

        return cells;
    }

    function getElementOffset() {
        const rect = boardRef.getBoundingClientRect();
        const doc = document.documentElement;

        return {
            x: (rect.left + window.pageXOffset) - doc.clientLeft,
            y: (rect.top + window.pageYOffset) - doc.clientTop,
        };
    }

    const handleClick = (event) => {
        let dummy_board = board
        const elemOffset = getElementOffset();
        const offsetX = event.clientX - elemOffset.x;
        const offsetY = event.clientY - elemOffset.y;
        
        const x = Math.floor(offsetX / CELL_SIZE);
        const y = Math.floor(offsetY / CELL_SIZE);

        if (x >= 0 && x <= cols && y >= 0 && y <= rows) {
            dummy_board[y][x] = !board[y][x];
        }
        setBoard(dummy_board)
        setCells(makeCells());
    }

    return ( 
        <div>
            <div className="Board"
                style={{ width: WIDTH, height: HEIGHT, backgroundSize: `${CELL_SIZE}px ${CELL_SIZE}px`}}
                onClick={handleClick}
                ref={(n) => { boardRef = n; }}>

                {cells.map(cell => (
                    <Cell x={cell.x} y={cell.y} key={`${cell.x},${cell.y}`}/>
                ))}
            </div>

            <div className="controls">
                <button className="button" onClick={callStep}>Step</button>
                <button className='button'>Push</button>
            </div>
        </div> 
    );  
}

