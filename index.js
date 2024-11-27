// TASK: import helper functions from utils
// TASK: import initialData
import { getTasks, createNewTask, patchTask, deleteTask } from "./utils/taskFunctions.js";
import { initialData } from "./initialData.js";

/*************************************************************************************************************************************************
 * FIX BUGS!!!
 * **********************************************************************************************************************************************/

// Function checks if local storage already has data, if not it loads initialData to localStorage
function initializeData() {
  const tasksInLocalStorage = JSON.parse(localStorage.getItem('tasks'))
  if (!localStorage.getItem('tasks')) {
    localStorage.setItem('tasks', JSON.stringify(initialData)); 
    localStorage.setItem('showSideBar', 'true')
  } else {
    // Merges new and existing data, avioding duplicates
    const mergedData = [...new Set([...tasksInLocalStorage, ...initialData].map(task => task.id))];
    localStorage.setItem('tasks', JSON.stringify(mergedData))
    console.log('Data already exists in localStorage');
  }


}

// TASK: Get elements from the DOM
const elements = {
  sideBar: document.querySelector('#side-bar-div'),
  hideSideBarBtn: document.querySelector('#hide-side-bar-btn'),
  showSideBarBtn: document.querySelector('#show-side-bar-btn'),
  headerBoardName: document.querySelector('.header-board-name'),
  columnDiv: document.querySelector('.column-div'),
  filterDiv: document.querySelector('#filter-overlay'),
  modalWindow: document.querySelector('#new-task-modal-window'),
  createNewTaskBtn: document.querySelector('#add-new-task-btn'), 
  editTaskModal: document.querySelector("add-task-modal")
  
}

// Function to check DOM elements and log warnings if they are missing
function checkDOMElements(elements) {
  Object.keys(elements).forEach(key => {
    if (!elements[key]) {
      console.warn(`Element with key '${key}' not found in the DOM.`);
    }
  });
}

// Check the DOM elements when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  checkDOMElements(elements); // This checks all the elements in the `elements` object.
});


let activeBoard = ""

// Extracts unique board names from tasks
// TASK: FIX BUGS
function fetchAndDisplayBoardsAndTasks() {
  const tasks = getTasks();
  const boards = [...new Set(tasks.map(task => task.board).filter(Boolean))];
  displayBoards(boards);
  if (boards.length > 0) {
    const storedActiveBoard = localStorage.getItem("activeBoard");
    activeBoard = storedActiveBoard || boards[0]; // Ensure fallback to the first board
    elements.headerBoardName.textContent = activeBoard;
    styleActiveBoard(activeBoard);
    refreshTasksUI();
  }
}


// Creates different boards in the DOM
// TASK: Fix Bugs
function displayBoards(boards) {
  const boardsContainer = document.getElementById("boards-nav-links-div");
  boardsContainer.innerHTML = ''; // Clears the container
  boards.forEach(board => {
    const boardElement = document.createElement("button");
    boardElement.textContent = board;
    boardElement.classList.add("board-btn");
    boardElement.addEventListener('click', () => { 
      elements.headerBoardName.textContent = board;
      filterAndDisplayTasksByBoard(board);
      activeBoard = board; // Assign active board
      localStorage.setItem("activeBoard", activeBoard);
      styleActiveBoard(activeBoard);
    });
    boardsContainer.appendChild(boardElement);
  });
}


// Filters tasks corresponding to the board name and displays them on the DOM.
// TASK: Fix Bugs
function filterAndDisplayTasksByBoard(boardName) {
  const tasks = getTasks();
  const filteredTasks = tasks.filter(task => task.board === boardName);
  const columns = document.querySelectorAll('.column-div');  

  columns.forEach(column => {
    const status = column.getAttribute("data-status");
    column.innerHTML = `<div class="column-head-div">
                          <span class="dot" id="${status}-dot"></span>
                          <h4 class="columnHeader">${status.toUpperCase()}</h4>
                        </div>`;

    const tasksContainer = column.querySelector('.tasks-container') || document.createElement('div');
    tasksContainer.classList.add('tasks-container');
    column.appendChild(tasksContainer);

    filteredTasks.filter(task => task.status === status).forEach(task => {
      const taskElement = document.createElement("div");
      taskElement.classList.add("task-div");
      taskElement.textContent = task.title;
      taskElement.setAttribute('data-task-id', task.id);

      taskElement.addEventListener("click", () => {
        openEditTaskModal(task); // Open edit modal when a task is clicked
      });

      tasksContainer.appendChild(taskElement);
    });
  });
}




function refreshTasksUI() {
  filterAndDisplayTasksByBoard(activeBoard);
}

// Styles the active board by adding an active class
// TASK: Fix Bugs
function styleActiveBoard(boardName) {
  document.querySelectorAll('.board-btn').forEach(btn => { 
    if (btn.textContent === boardName) {
      btn.classList.add('active') 
    } else {
      btn.classList.remove('active'); 
    }
  });
}


function addTaskToUI(task) {
  const column = document.querySelector(`.column-div[data-status="${task.status}"]`); 
  if (!column) {
    console.error(`Column not found for status: ${task.status}`);
    return;
  }

  let tasksContainer = column.querySelector('.tasks-container');
  if (!tasksContainer) {
    console.warn(`Tasks container not found for status: ${task.status}, creating one.`);
    tasksContainer = document.createElement('div');
    tasksContainer.className = 'tasks-container';
    column.appendChild(tasksContainer);
  }

  const taskElement = document.createElement('div');
  taskElement.className = 'task-div';
  taskElement.textContent = task.title; // Modify as needed
  taskElement.setAttribute('data-task-id', task.id);
  
  tasksContainer.appendChild(taskElement); 
}



function setupEventListeners() {
  // Cancel editing task event listener
  const cancelEditBtn = document.getElementById('cancel-edit-btn');
  cancelEditBtn.addEventListener ('click' , () => toggleModal(false, elements.editTaskModal));

  // Cancel adding new task event listener
  const cancelAddTaskBtn = document.getElementById('cancel-add-task-btn');
  cancelAddTaskBtn.addEventListener('click', () => {
    toggleModal(false);
    elements.filterDiv.style.display = 'none'; // Also hide the filter overlay
  });

  // Clicking outside the modal to close it
  elements.filterDiv.addEventListener('click', () => {
    toggleModal(false);
    elements.filterDiv.style.display = 'none'; // Also hide the filter overlay
  });

  // Show sidebar event listener
  elements.hideSideBarBtn.addEventListener('click', () => toggleSidebar(false));
  elements.showSideBarBtn.addEventListener('click', () => toggleSidebar(true));


  // Theme switch event listener
  elements.themeSwitch.addEventListener('change', toggleTheme);

  // Show Add New Task Modal event listener
  elements.createNewTaskBtn.addEventListener('click', () => {
    toggleModal(true);
    elements.filterDiv.style.display = 'block'; // Also show the filter overlay
  });

  // Add new task form submission event listener
  elements.modalWindow.addEventListener('submit',  (event) => {
    addTask(event)
  });
}

// Toggles tasks modal
// Task: Fix bugs
function toggleModal(show, modal = elements.modalWindow) {
  if (!modal) return;
  modal.style.display = show ? 'block' : 'none'; 
}

/*************************************************************************************************************************************************
 * COMPLETE FUNCTION CODE
 * **********************************************************************************************************************************************/

function addTask(event) {
  event.preventDefault(); 

  const taskTitle = document.getElementById('task-title-input').value;
  const taskBoard = document.getElementById('task-board-input').value;
  const taskStatus = document.getElementById('task-status-input').value;

  //Assign user input to the task object
    const task = {
      title: taskTitle, board: taskBoard, status: taskStatus
    };
    const newTask = createNewTask(task);
    if (newTask) {
      addTaskToUI(newTask);
      toggleModal(false);
      elements.filterDiv.style.display = 'none'; // Also hide the filter overlay
      event.target.reset();
      refreshTasksUI();
    }
}


function toggleSidebar(show) {
  if (show) {
    elements.sideBar.style.display = "block";
    elements.showSideBarBtn.style.display = "none";
    localStorage.setItem("showSideBar", "true");
  } else {
    elements.sideBar.style.display = "none";
    elements.showSideBarBtn.style.display = "block";
    localStorage.setItem("showSideBar", "false");
  }
}

elements.showSideBarBtn.addEventListener("click", () => toggleSidebar(true));
elements.hideSideBarBtn.addEventListener("click", () => toggleSidebar(false));

document.addEventListener("DOMContentLoaded", () => {
  const showSideBar = localStorage.getItem("showSideBar") === "true";
  toggleSidebar (showSideBar);
})


function toggleTheme() {
 const isLightTheme = document.body.classList.toggle("light-theme");
 localStorage.setItem("light-theme", isLightTheme ? "enabled" : "disabled");
}

// Event Listener for Theme Switch
elements.themeSwitch.addEventListener("change", toggleTheme)

// Applys saved theme when page loads
document.addEventListener("DOMContentLoaded", () => {
  const isLightTheme = localStorage.getItem("light-theme") === "enabled";
  document.body.classList.toggle("light-theme", isLightTheme);
});

function openEditTaskModal(task) {
  // Set task details in modal inputs
  titleInput.value = task.title;

  // Get button elements from the task modal
  const titleInput = document.getElementById('edit-task-title-input')
  const saveChangesBtn = document.getElementById('save-changes-btn');
  const deleteBtn = document.getElementById('delete-task-btn');
  // Call saveTaskChanges upon click of Save Changes button
 
  saveChangesBtn.addEventListener("click", () => saveTaskChanges(task.id));

  // Delete task using a helper function and close the task modal
 
  deleteBtn.addEventListener("click", () => deleteTaskById(task.id))

  toggleModal(true, elements.editTaskModal); // Show the edit task modal
}

function saveTaskChanges(taskId) {
  // Get new user inputs
  const updatedTitle = document.getElementById('edit-task-title-input').value

  // Create an object with the updated task details
  const updatedTask = {id: taskId, title: updatedTitle};

  // Update task using a helper functoin
  putTask(updatedTask);

  // Close the modal and refresh the UI to reflect the changes
  toggleModal(false,elements.editTaskModal);
  refreshTasksUI();
  
}

/*************************************************************************************************************************************************/

document.addEventListener('DOMContentLoaded', function() {
  init(); // init is called after the DOM is fully loaded
  initializeData()
});

function init() {
  setupEventListeners();
  const showSidebar = localStorage.getItem('showSideBar') === 'true';
  toggleSidebar(showSidebar);
  const isLightTheme = localStorage.getItem('light-theme') === 'enabled';
  document.body.classList.toggle('light-theme', isLightTheme);
  fetchAndDisplayBoardsAndTasks(); // Initial display of boards and tasks
}