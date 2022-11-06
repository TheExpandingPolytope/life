import { useWeb3React } from '@web3-react/core';
import { Contract } from '@ethersproject/contracts'
import { abi as InputFacetAbi } from './abis/InputFacet.json'
import { ethers } from "ethers"
import React from 'react';
import { useRef } from 'react';
import { useState } from 'react';
import './Game.css';
import { DAPP_ADDRESS } from './const';
import { useMemo } from 'react';
import {default as axios} from "axios"
import { useEffect } from 'react';
import { useBlockNumber } from './hooks';

const CELL_SIZE = 5;
const WIDTH = 500;
const HEIGHT = 500;

export const SERVER_URL = `http://localhost:3002`;

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function makeArray(d1, d2) {
    var arr = new Array(d1), i, l;
    for(i = 0, l = d2; i < l; i++) {
        arr[i] = new Array(d1);
    }
    return arr;
}


export const Cell = ({x, y, address})=> {
    return (
        <div className="Cell" style={{
            left: `${CELL_SIZE * x + 1}px`,
            top: `${CELL_SIZE * y + 1}px`,
            width: `${CELL_SIZE - 1}px`,
            height: `${CELL_SIZE - 1}px`,
            backgroundColor: `"${address ? address.substring(2,8): "#ffffff"}"`
        }} />
    );
}

export const Game = () => {  
    const [rows, setRows] = useState(HEIGHT / CELL_SIZE)
    const [cols, setCols] = useState(WIDTH / CELL_SIZE)
    const interval = 100
    let boardRef = useRef()
    const [board, setBoard] =  useState(makeEmptyBoard())
    const [cells, setCells] = useState([])
    const [cellsToAdd, setCellsToAdd] = useState([])
    const { provider, account, chainId } = useWeb3React()
    const block = useBlockNumber()
    //contracts
    //console.log(cells)
    useEffect(()=>{
        poll()
    },[])
    const contract = useMemo(()=> {
        if(provider){
            console.log("provider and account are defined now")
            return new Contract(DAPP_ADDRESS, InputFacetAbi, provider.getSigner(account).connectUnchecked())
        }
    }, [provider, account])

    async function runMatch(history){
        let inc = 0
        while(inc < history.length()){
            await delay(1000);
            state = history[inc]
            setCells(state.map(([x, y, address]) => {return {x, y, address}}));
            inc++
        }
    }
    
    async function poll() {
        await delay(1000);
        try {
            var instance = axios.create({baseURL: SERVER_URL })
            var input = `{
                "type": "state", 
                "value": ""
            }`
            var response = await instance.get("/inspect/" + input) 
            var payload = response.data.reports[0].payload
            var state = JSON.parse(ethers.utils.toUtf8String(payload))

            //set dimensions
            if(state.dimensions.width && state.dimensions.height){
                setRows(state.dimensions.height)
                setCols(state.dimensions.width)
            }
            var dummy_board = board
            state.grid.forEach(([x, y]) => {
                dummy_board[y][x] = !board[y][x];
            })
            if(state.history.length() > 0){
                runMatch(state.history)
            }
            //setBoard(dummy_board)
            console.log(state.grid)
            setCells(state.grid.map(([x, y, address]) => {return {x, y, address}}));
        } catch (error) {
            console.log(error)
        }
        
        await poll();
    }

    async function push() {
        await contract.addInput(ethers.utils.toUtf8Bytes(`{
            "operation": "set", 
            "value": ${JSON.stringify(cellsToAdd)}
        }`))
    }

    async function step() {
        await contract.addInput(ethers.utils.toUtf8Bytes(`{
            "operation": "step", 
            "value": "hello"
        }`))
    }

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
        setCellsToAdd(makeCells());
    }

    return ( 
        <div>
            <div className="Board"
                style={{ width: WIDTH, height: HEIGHT, backgroundSize: `${CELL_SIZE}px ${CELL_SIZE}px`}}
                onClick={handleClick}
                ref={(n) => { boardRef = n; }}>

                {cells.map(cell => (
                    <Cell x={cell.x} y={cell.y} color={cell.address ? cell.address.substring(2, 8) : "ffffff"}key={`${cell.x},${cell.y}`}/>
                ))}
                {cellsToAdd.map(cell => (
                    <Cell x={cell.x} y={cell.y} color={"ff0000"} key={`cellsToAdd${cell.x},${cell.y}`}/>
                ))}
            </div>

            <div className="controls">
                <button className="button" onClick={step}>Step</button>
                <button className='button' onClick={push}>Push</button>
            </div>
        </div> 
    );  
}

