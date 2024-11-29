// TASK: import helper functions from utils
// TASK: import initialData
import { getTasks, createNewTask, putTask, deleteTask } from "./utils/taskFunctions.js";
import { initialData } from "./initialData.js";

/*************************************************************************************************************************************************
 * FIX BUGS!!!
 * **********************************************************************************************************************************************/

// Function checks if local storage already has data, if not it loads initialData to localStorage
function initializeData() {
  const existingTasks = localStorage.getItem('tasks');
  if (!existingTasks) {
    localStorage.setItem('tasks', JSON.stringify(initialData)); 
    localStorage.setItem('showSideBar', 'true')
  } else {
    // Merges new and existing data, avioding duplicates
    const tasksInLocalStorage = JSON.parse(localStorage.getItem('tasks'));
    const taskId = tasksInLocalStorage.map(task => task.id)
    const mergedData = [...tasksInLocalStorage, ...initialData.filter(task => !taskId.includes(task.id))];
    localStorage.setItem('tasks', JSON.stringify(mergedData))
    console.log('Data already exists in localStorage');
  }


}

// TASK: Get elements from the DOM
const elements = {
  sideBar: document.getElementById('side-bar-div'),
  hideSideBarBtn: document.getElementById('hide-side-bar-btn'),
  showSideBarBtn: document.getElementById('show-side-bar-btn'),
  headerBoardName: document.querySelector('.header-board-name'),
  editBoardBtn: document.getElementById('edit-board-btn'),
  deleteBoardDiv: document.getElementById('delete-board-div'),
  columnDiv: document.querySelector('.column-div'),
  filterDiv: document.getElementById('filterDiv'),
  modalWindow: document.getElementById('new-task-modal-window'),
  createNewTaskBtn: document.getElementById('add-new-task-btn'),
  themeSwitch: document.getElementById('switch'),
  editTaskDiv: document.querySelector('.edit-task-div'),
  editTaskModal: document.querySelector('.edit-task-modal-window'),
  editTaskTitle: document.getElementById('edit-task-title-input'),
  editTaskDescription: document.getElementById('edit-task-desc-input'), // Corrected the ID.
  editTaskStatus: document.getElementById('edit-task-status'),
  saveTaskChangesBtn: document.getElementById('save-task-changes-btn'),
  deleteTaskBtn: document.getElementById('delete-task-btn'),
  cancelEditBtn: document.getElementById('cancel-edit-btn'),
  taskDiv: document.querySelector('.task-div'),
  taskTitle: document.querySelector('.task-title-input'),
  tasksContainer: document.querySelector('.tasks-container'),
};



let activeBoard = ""

// Extracts unique board names from tasks
// TASK: FIX BUGS
function fetchAndDisplayBoardsAndTasks() {
  try {
    const tasks = getTasks();
    if (!Array.isArray(tasks)) {
      throw new Error('Invalid tasks data structure');
    }
    const boards = [...new Set(tasks.map(task => task.board).filter(Boolean))];
    displayBoards(boards);
    if (boards.length > 0) {
      const storedActiveBoard = (localStorage.getItem("activeBoard"));
      if (storedActiveBoard) {
        try {
          activeBoard = JSON.parse(storedActiveBoard);
        } catch (error) {
          console.error("Error parsing activeBoard from localStorage:", error);
        }
        activeBoard = storedActiveBoard;
      } else {
        activeBoard = boards[0];
      }
      // Ensure fallback to the first board
      elements.headerBoardName.textContent = activeBoard;
      styleActiveBoard(activeBoard);
      refreshTasksUI();
    }
  } catch (error) {
    console.error('Error fetching tasks:', error);
    // Provide fallback UI or user notification
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
    console.error(`Column for status "${task.status}" not found.`);
    return;
  }

  let tasksContainer = column.querySelector('.tasks-container');
  if (!tasksContainer) {
    tasksContainer = document.createElement('div');
    tasksContainer.className = 'tasks-container';
    column.appendChild(tasksContainer);
  }

  const taskElement = document.createElement('div');
  taskElement.className = 'task-div';
  taskElement.textContent = task.title;
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

  const taskTitle = document.getElementById('title-input').value;
  const taskDescription = document.getElementById('desc-input').value;
  const taskStatus = document.getElementById('select-status').value;

  if (!taskTitle) {
      console.error("Task title is required!");
      return;
  }

  // Create task object
  const task = {
      id: Date.now().toString(), // Unique ID
      title: taskTitle,
      description: taskDescription,
      status: taskStatus,
      board: activeBoard, // Use the current active board
  };

  console.log("New Task:", task);

  // Save to localStorage
  const tasks = getTasks();
  tasks.push(task);
  localStorage.setItem('tasks', JSON.stringify(tasks));

  // Update UI
  addTaskToUI(task);
  toggleModal(false); // Hide the modal
  event.target.reset(); // Clear the form
  refreshTasksUI();
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

function deleteTaskById(taskId) {
  // Logic to delete a task by its ID
  console.log(`Deleting task with ID: ${taskId}`);
  // Example:
  const tasks = getTasks();
  const updatedTasks = tasks.filter(task => task.id !== taskId);
  localStorage.setItem('tasks', JSON.stringify(updatedTasks));
  refreshTasksUI();
}

function openEditTaskModal(task) {
  const titleInput = document.getElementById('edit-task-title-input');
  if (titleInput) titleInput.value = task.title;

  const saveTaskChangesBtn = document.getElementById('save-task-changes-btn');
  const deleteTaskBtn = document.getElementById('delete-task-btn');

  if (saveTaskChangesBtn) {
    saveTaskChangesBtn.addEventListener("click", () => saveTaskChanges(task.id));
  } else {
    console.error("Save Task Changes Button not found.");
  }

  if (deleteTaskBtn) {
    deleteTaskBtn.addEventListener("click", () => deleteTaskById(task.id));
  } else {
    console.error("Delete Task Button not found.");
  }

  toggleModal(true, elements.editTaskModal); // Show the modal
}

function saveTaskChanges(taskId) {
  const updatedTitle = document.getElementById('edit-task-title-input').value.trim();
  if (!updatedTitle || !taskId) {
    console.error('Invalid task data');
    return;
  }

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
  initializeData()
  init(); // init is called after the DOM is fully loaded
  
});

function init() {
  setupEventListeners();
  const showSidebar = localStorage.getItem('showSideBar') === 'true';
  toggleSidebar(showSidebar);
  const isLightTheme = localStorage.getItem('light-theme') === 'enabled';
  document.body.classList.toggle('light-theme', isLightTheme);
  fetchAndDisplayBoardsAndTasks(); // Initial display of boards and tasks
}