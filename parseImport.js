// Reading from a file to import the quiz name, description, and questions
const fs = require('fs');
const path = require('path');
const { ipcMain } = require('electron');
const { insertContent, queryAllContent, queryUserContent } = require('./database');

// File format:
// 1st line: quiz name
// 2nd line: description
// 3rd line and onwards: questions in JSON format like [{"question":"answer"},{"question2":"answer2"}]

// Function to read and parse the import file
function parseImportFile(filePath) {
  try {
    // Read the file
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    
    // Split into lines
    const lines = fileContent.split('\n');
    
    if (lines.length < 3) {
      return { error: 'File needs at least 3 lines' };
    }
    
    const name = lines[0].trim();
    
    const description = lines[1].trim();
    
    const questionsText = lines.slice(2).join('\n').trim();
    
    let questions;
    try {
      questions = JSON.parse(questionsText);
    } catch (e) {
      return { error: 'Questions must be valid JSON format' };
    }
    
    if (!Array.isArray(questions)) {
      return { error: 'Questions must be an array' };
    }
    
    return {
      success: true,
      name: name,
      description: description,
      questions: questions
    };
    
  } catch (error) {
    console.error('Error reading file:', error);
    return { error: 'Could not read file' };
  }
}

// Function to handle import from file - returns result for main.js to handle
function importQuizFromFile(db, user, filePath) {
  const result = parseImportFile(filePath);
  
  if (result.error) {
    return { error: result.error };
  }
  
  return {
    success: true,
    name: result.name,
    description: result.description,
    questions: result.questions
  };
}

module.exports = {
  parseImportFile,
  importQuizFromFile
};
