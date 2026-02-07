// Simple calculator logic with keyboard support
const display = document.getElementById("result");
const history = document.getElementById("history");
let current = "0";
let expr = "";

// helpers
function updateDisplay() {
  display.textContent = current;
  history.textContent = expr;
}

function safeEvalExpression(input) {
  // Replace unicode operators with JS operators
  const prepared = input.replace(/×/g, "*").replace(/÷/g, "/").replace(/−/g, "-");
  try {
    // disallow unsafe chars (letters)
    if (/[^0-9+\-*/(). %]/.test(prepared)) throw new Error("Invalid char");
    // eslint-disable-next-line no-eval
    const value = eval(prepared);
    if (!isFinite(value)) throw new Error("Math error");
    return value;
  } catch {
    return "Error";
  }
}

// button clicks
document.querySelectorAll(".btn").forEach(btn=>{
  btn.addEventListener("click", ()=> {
    const num = btn.dataset.number;
    const action = btn.dataset.action;

    if (num !== undefined) {
      // number or dot
      if (current === "0" && num !== ".") current = num;
      else if (num === "." && current.includes(".")) return;
      else current = current + num;
      updateDisplay();
    } else if (action) {
      if (action === "clear") {
        current = "0"; expr = "";
      } else if (action === "back") {
        if (current.length > 1) current = current.slice(0,-1);
        else current = "0";
      } else if (action === "percent") {
        const val = parseFloat(current);
        if (!isNaN(val)) current = (val / 100).toString();
      } else if (action === "=") {
        // compute
        expr = expr + current;
        const result = safeEvalExpression(expr);
        current = String(result);
        expr = "";
      } else {
        // operator (action is + - * /)
        expr = expr + current + action;
        current = "0";
      }
      updateDisplay();
    }
  });
});

// keyboard support
window.addEventListener("keydown", (e) => {
  if ((e.key >= "0" && e.key <= "9") || e.key === ".") {
    // number
    const btn = document.querySelector(`.btn[data-number="${e.key}"]`);
    if (btn) btn.click();
  } else if (e.key === "Enter" || e.key === "=") {
    document.querySelector('.btn.equal').click();
  } else if (e.key === "Backspace") {
    document.querySelector('.btn[data-action="back"]').click();
  } else if (e.key === "Escape") {
    document.querySelector('.btn[data-action="clear"]').click();
  } else if (["+","-","*","/"].includes(e.key)) {
    const opBtn = document.querySelector(`.btn.op[data-action="${e.key}"]`);
    if (opBtn) opBtn.click();
  } else if (e.key === "%") {
    document.querySelector('.btn[data-action="percent"]').click();
  }
});

// init
updateDisplay();
