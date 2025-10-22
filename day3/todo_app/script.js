document.getElementById("add-btn").addEventListener("click", function() {
  const todoInput = document.getElementById("todo-input");
  const todoText = todoInput.value.trim();
  if (todoText !== "") {
    const li = document.createElement("li");
    li.textContent = todoText;
    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete";
    deleteBtn.className = "delete-btn";
    deleteBtn.addEventListener("click", function() {
      li.remove();
    });
    li.appendChild(deleteBtn);
    li.addEventListener("click", function(e) {
      if (e.target !== deleteBtn) {
        li.classList.toggle("completed");
      }
    });
    document.getElementById("todo-list").appendChild(li);
    todoInput.value = "";
  }
});
