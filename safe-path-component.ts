'use client';

import { useState, useEffect } from 'react';

// Main application component
export default function SafePathLabyrinthApp() {
  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-6xl mx-auto px-4">
        <Header />
        <SafePathLabyrinth />
      </div>
    </div>
  );
}

// Header component with title and problem identifier
function Header() {
  return (
    <header className="mb-8 text-center">
      <h1 className="text-3xl font-bold text-gray-800">Safe Path in the Labyrinth</h1>
      <p className="text-gray-500 mt-2">BLA202a-05</p>
    </header>
  );
}

// Main Safe Path component
function SafePathLabyrinth() {
  const [gridSize, setGridSize] = useState({ N: 3, M: 3 });
  const [radiationLevels, setRadiationLevels] = useState<number[][]>([]);
  const [path, setPath] = useState<[number, number][]>([]);
  const [minMaxRadiation, setMinMaxRadiation] = useState<number | null>(null);
  const [inputError, setInputError] = useState("");
  const [textInput, setTextInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGridMode, setIsGridMode] = useState(true);
  
  // Initialize grid when dimensions change
  useEffect(() => {
    const { N, M } = gridSize;
    const newGrid = Array(N).fill(0).map(() => Array(M).fill(0));
    setRadiationLevels(newGrid);
    setPath([]);
    setMinMaxRadiation(null);
    
    // Generate example input text
    const exampleText = Array(N).fill(0)
      .map(() => Array(M).fill(0)
        .map(() => Math.floor(Math.random() * 9) + 1)
        .join(' '))
      .join('\n');
    setTextInput(exampleText);
  }, [gridSize]);

  // Update radiation level at a specific cell
  const updateRadiationLevel = (rowIndex: number, colIndex: number, value: string) => {
    const newGrid = [...radiationLevels];
    const numValue = parseInt(value) || 0;
    newGrid[rowIndex][colIndex] = numValue;
    setRadiationLevels(newGrid);
    
    // Also update the text representation
    const newTextLines = newGrid.map(row => row.join(' '));
    setTextInput(newTextLines.join('\n'));
  };

  // Handle input for grid dimensions
  const handleSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = parseInt(value);
    if (numValue > 0 && numValue <= 15) {
      setGridSize({ ...gridSize, [name]: numValue });
    }
  };

  // Parse text input for radiation levels
  const handleTextInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setTextInput(text);
    
    const lines = text.trim().split('\n');
    
    if (lines.length !== gridSize.N) {
      setInputError(`Expected ${gridSize.N} lines of input.`);
      return;
    }
    
    try {
      const newGrid: number[][] = [];
      for (let i = 0; i < lines.length; i++) {
        const row = lines[i].trim().split(/\s+/).map(val => parseInt(val));
        if (row.length !== gridSize.M) {
          setInputError(`Expected ${gridSize.M} values in row ${i+1}.`);
          return;
        }
        newGrid.push(row);
      }
      setRadiationLevels(newGrid);
      setInputError("");
    } catch (err) {
      setInputError("Invalid input format. Please check your data.");
    }
  };

  // Algorithm to find the safest path
  const findSafestPath = () => {
    setIsProcessing(true);
    
    setTimeout(() => {
      const { N, M } = gridSize;
      if (N === 0 || M === 0) {
        setIsProcessing(false);
        return;
      }
      
      // Initialize distances array with Infinity
      const distances: number[][] = Array(N).fill(0).map(() => Array(M).fill(Infinity));
      distances[0][0] = radiationLevels[0][0];
      
      // Initialize visited array
      const visited: boolean[][] = Array(N).fill(0).map(() => Array(M).fill(false));
      
      // Priority queue to process cells by lowest max radiation
      const queue: { row: number; col: number; maxRad: number }[] = [
        { row: 0, col: 0, maxRad: radiationLevels[0][0] }
      ];
      
      // Track paths
      const prev: ({ row: number; col: number } | null)[][] = Array(N).fill(0).map(() => Array(M).fill(null));
      
      // Possible moves: right, down, left, up
      const directions: [number, number][] = [[0, 1], [1, 0], [0, -1], [-1, 0]];
      
      while (queue.length > 0) {
        // Sort queue by maxRad (ascending)
        queue.sort((a, b) => a.maxRad - b.maxRad);
        
        // Get cell with minimum maximum radiation
        const { row, col, maxRad } = queue.shift()!;
        
        // Skip if already processed
        if (visited[row][col]) continue;
        
        // Mark as visited
        visited[row][col] = true;
        
        // If we reached the target, reconstruct the path and return
        if (row === N - 1 && col === M - 1) {
          const safePath: [number, number][] = [];
          let current: { row: number; col: number } | null = { row: N - 1, col: M - 1 };
          
          while (current) {
            safePath.unshift([current.row, current.col]);
            current = prev[current.row][current.col];
          }
          
          setPath(safePath);
          setMinMaxRadiation(maxRad);
          setIsProcessing(false);
          return;
        }
        
        // Check adjacent cells
        for (const [dr, dc] of directions) {
          const newRow = row + dr;
          const newCol = col + dc;
          
          // Check if the new cell is within grid boundaries
          if (newRow >= 0 && newRow < N && newCol >= 0 && newCol < M && !visited[newRow][newCol]) {
            const newMaxRad = Math.max(maxRad, radiationLevels[newRow][newCol]);
            
            if (newMaxRad < distances[newRow][newCol]) {
              distances[newRow][newCol] = newMaxRad;
              prev[newRow][newCol] = { row, col };
              queue.push({ row: newRow, col: newCol, maxRad: newMaxRad });
            }
          }
        }
      }
      
      // If no path found
      setMinMaxRadiation(-1);
      setPath([]);
      setIsProcessing(false);
    }, 100); // Small delay to allow UI to update
  };

  // Reset the grid and results
  const handleReset = () => {
    const { N, M } = gridSize;
    const newGrid = Array(N).fill(0).map(() => Array(M).fill(0));
    setRadiationLevels(newGrid);
    setPath([]);
    setMinMaxRadiation(null);
    setInputError("");
    
    // Reset text input to zeros
    const zeroText = Array(N).fill(0)
      .map(() => Array(M).fill('0').join(' '))
      .join('\n');
    setTextInput(zeroText);
  };

  // Load sample inputs
  const loadSample = (sampleNum: number) => {
    if (sampleNum === 1) {
      setGridSize({ N: 3, M: 3 });
      setTextInput("1 3 5\n2 8 2\n4 2 1");
      setRadiationLevels([[1, 3, 5], [2, 8, 2], [4, 2, 1]]);
    } else if (sampleNum === 2) {
      setGridSize({ N: 2, M: 2 });
      setTextInput("10 10\n10 10");
      setRadiationLevels([[10, 10], [10, 10]]);
    }
    setPath([]);
    setMinMaxRadiation(null);
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <div className="mb-6 bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h2 className="text-lg font-semibold mb-2 text-blue-700">Problem Description</h2>
        <p className="text-gray-700">Navigate an N×M grid with radiation levels. Find a path from (0,0) to (N-1,M-1) minimizing the maximum radiation encountered.</p>
        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-medium">Input:</h3>
            <ul className="list-disc pl-5 mt-1 text-sm">
              <li>N, M - grid dimensions</li>
              <li>N lines with M integers (radiation per cell)</li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium">Output:</h3>
            <ul className="list-disc pl-5 mt-1 text-sm">
              <li>Minimum possible maximum radiation on any valid path, or -1 if no path exists</li>
            </ul>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Grid Configuration</h2>
            <div className="flex space-x-2">
              <button
                onClick={() => setIsGridMode(true)}
                className={`px-3 py-1 text-sm rounded ${isGridMode ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
              >
                Grid Mode
              </button>
              <button
                onClick={() => setIsGridMode(false)}
                className={`px-3 py-1 text-sm rounded ${!isGridMode ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
              >
                Text Mode
              </button>
            </div>
          </div>
          
          <div className="p-4 border rounded-lg bg-gray-50 mb-4">
            <div className="flex gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">Rows (N):</label>
                <input
                  type="number"
                  name="N"
                  value={gridSize.N}
                  onChange={handleSizeChange}
                  min="1"
                  max="15"
                  className="border rounded p-2 w-20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Columns (M):</label>
                <input
                  type="number"
                  name="M"
                  value={gridSize.M}
                  onChange={handleSizeChange}
                  min="1"
                  max="15"
                  className="border rounded p-2 w-20"
                />
              </div>
            </div>
          </div>
          
          {isGridMode ? (
            <div className="mb-4 border rounded-lg p-4">
              <h3 className="text-md font-medium mb-3">Input Radiation Levels</h3>
              <div className="overflow-x-auto">
                <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${gridSize.M}, minmax(40px, 1fr))` }}>
                  {radiationLevels.map((row, rowIndex) => (
                    row.map((cell, colIndex) => (
                      <input
                        key={`${rowIndex}-${colIndex}`}
                        type="number"
                        value={cell}
                        onChange={(e) => updateRadiationLevel(rowIndex, colIndex, e.target.value)}
                        min="0"
                        className="w-full p-2 text-center border rounded"
                        style={{ height: '40px', width: '40px', minWidth: '40px' }}
                      />
                    ))
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-4 border rounded-lg p-4">
              <h3 className="text-md font-medium mb-2">Enter Radiation Levels</h3>
              <p className="text-sm text-gray-600 mb-2">Enter {gridSize.N} lines with {gridSize.M} space-separated integers each.</p>
              <textarea
                className="border rounded p-2 w-full h-32 font-mono"
                value={textInput}
                onChange={handleTextInput}
              ></textarea>
              {inputError && <p className="text-red-500 text-sm mt-1">{inputError}</p>}
            </div>
          )}
          
          <div className="mb-4">
            <h3 className="text-md font-medium mb-2">Sample Inputs</h3>
            <div className="flex space-x-2">
              <button
                onClick={() => loadSample(1)}
                className="bg-gray-200 px-3 py-1 rounded hover:bg-gray-300 text-sm"
              >
                Load Sample 1
              </button>
              <button
                onClick={() => loadSample(2)}
                className="bg-gray-200 px-3 py-1 rounded hover:bg-gray-300 text-sm"
              >
                Load Sample 2
              </button>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={findSafestPath}
              disabled={isProcessing}
              className={`bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isProcessing ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                'Find Safest Path'
              )}
            </button>
            <button
              onClick={handleReset}
              className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
            >
              Reset
            </button>
          </div>
        </div>
        
        <div>
          <h2 className="text-xl font-semibold mb-4">Result</h2>
          
          <div className="p-4 border rounded-lg bg-gray-50 mb-4">
            {minMaxRadiation !== null ? (
              <div>
                <p className="text-lg">
                  Minimum possible maximum radiation: <span className="font-bold text-blue-600">{minMaxRadiation}</span>
                </p>
                {path.length > 0 && (
                  <p className="text-sm text-gray-600 mt-2">
                    Path length: {path.length} cells
                  </p>
                )}
              </div>
            ) : (
              <p className="text-gray-500 italic">Run the algorithm to see results</p>
            )}
          </div>
          
          <div className="mb-4 border rounded-lg p-4">
            <h3 className="text-md font-medium mb-3">Visualization</h3>
            <div className="overflow-x-auto">
              <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${gridSize.M}, minmax(45px, 1fr))` }}>
                {radiationLevels.map((row, rowIndex) => (
                  row.map((cell, colIndex) => {
                    const isPath = path.some(([r, c]) => r === rowIndex && c === colIndex);
                    const isStart = rowIndex === 0 && colIndex === 0;
                    const isEnd = rowIndex === gridSize.N - 1 && colIndex === gridSize.M - 1;
                    
                    let bgColor = "bg-gray-100";
                    let textColor = "text-gray-800";
                    
                    if (isPath) {
                      bgColor = "bg-blue-100 border-blue-300";
                      textColor = "text-blue-800";
                    }
                    if (isStart) {
                      bgColor = "bg-green-200 border-green-400";
                      textColor = "text-green-800";
                    }
                    if (isEnd && path.length > 0) {
                      bgColor = "bg-red-200 border-red-400";
                      textColor = "text-red-800";
                    }
                    
                    // Special highlighting for cells with maximum radiation in the path
                    if (isPath && cell === minMaxRadiation) {
                      bgColor = "bg-yellow-200 border-yellow-500";
                      textColor = "text-yellow-800";
                    }
                    
                    return (
                      <div
                        key={`vis-${rowIndex}-${colIndex}`}
                        className={`${bgColor} ${textColor} border h-12 w-12 flex items-center justify-center font-medium rounded`}
                        title={`Position (${rowIndex},${colIndex}): Radiation ${cell}`}
                      >
                        {cell}
                      </div>
                    );
                  })
                ))}
              </div>
            </div>
            
            <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center">
                <div className="w-4 h-4 rounded bg-green-200 border border-green-400 mr-2"></div>
                <span>Start (0,0)</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 rounded bg-red-200 border border-red-400 mr-2"></div>
                <span>End (N-1,M-1)</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 rounded bg-blue-100 border border-blue-300 mr-2"></div>
                <span>Path</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 rounded bg-yellow-200 border border-yellow-500 mr-2"></div>
                <span>Max Radiation on Path</span>
              </div>
            </div>
          </div>
          
          {path.length > 0 && (
            <div className="mb-4 border rounded-lg p-4">
              <h3 className="text-md font-medium mb-2">Path Details</h3>
              <div className="text-sm">
                <p className="mb-2">Path coordinates (row, col):</p>
                <div className="bg-gray-100 p-2 rounded font-mono text-xs">
                  {path.map(([row, col], index) => (
                    <span key={index}>
                      ({row}, {col})
                      {index < path.length - 1 ? ' → ' : ''}
                    </span>
                  ))}
                </div>
                <p className="mt-3 mb-1">Radiation levels along path:</p>
                <div className="bg-gray-100 p-2 rounded font-mono text-xs flex flex-wrap">
                  {path.map(([row, col], index) => (
                    <span key={index} className={radiationLevels[row][col] === minMaxRadiation ? 'text-red-600 font-bold' : ''}>
                      {radiationLevels[row][col]}
                      {index < path.length - 1 ? ' → ' : ''}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-6 border-t pt-4">
        <h2 className="text-lg font-semibold mb-2">Algorithm Explanation</h2>
        <div className="text-sm text-gray-700">
          <p>This application uses a modified Dijkstra's algorithm to find the path with the minimum maximum radiation level:</p>
          <ol className="list-decimal pl-5 mt-2 space-y-1">
            <li>Start at the source cell (0,0) with its radiation level.</li>
            <li>Maintain a priority queue of cells, ordered by their maximum radiation experienced so far.</li>
            <li>For each cell, explore its neighbors (up, down, left, right) and update their maximum radiation if lower.</li>
            <li>The maximum radiation for a path to a cell is the maximum of its current cell's radiation and the maximum radiation to reach that cell.</li>
            <li>Continue until reaching the target cell (N-1, M-1).</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
