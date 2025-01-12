class Calculator extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: inline-block;
                    padding: 20px;
                    background: var(--calc-bg-color);
                    border-radius: 16px;
                    font-family: system-ui, -apple-system, sans-serif;
                    color: var(--calc-text-color);
                    box-shadow: 0 10px 20px rgba(0,0,0,0.12);
                    min-width: 300px;
                }
                .display {
                    background: var(--calc-display-bg-color);
                    padding: 20px;
                    margin-bottom: 20px;
                    text-align: right;
                    font-size: 32px;
                    border-radius: 12px;
                    font-weight: 300;
                    color: var(--calc-text-color);
                    box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);
                    min-height: 50px;
                    display: flex;
                    align-items: center;
                    justify-content: flex-end;
                    overflow: hidden;
                }
                .buttons {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 10px;
                }
                button {
                    padding: 20px;
                    font-size: 20px;
                    border: none;
                    background: var(--calc-button-bg-color);
                    color: var(--calc-text-color);
                    cursor: pointer;
                    border-radius: 12px;
                    transition: all 0.2s ease;
                    font-weight: 500;
                    user-select: none;
                    position: relative;
                    overflow: hidden;
                }
                button:hover {
                    background: var(--calc-button-hover-bg-color);
                    transform: translateY(-1px);
                    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
                }
                button:active {
                    transform: translateY(1px);
                    box-shadow: none;
                }
                .operator {
                    background: var(--calc-operator-bg-color);
                    font-weight: 600;
                }
                .equals {
                    background: var(--calc-equals-bg-color);
                    font-weight: 600;
                }
                button::after {
                    content: '';
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    width: 100%;
                    height: 100%;
                    background: radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 60%);
                    transform: translate(-50%, -50%) scale(0);
                    transition: transform 0.5s;
                    pointer-events: none;
                }
                button:active::after {
                    transform: translate(-50%, -50%) scale(2);
                    opacity: 0;
                }
                .blank {
                    visibility: hidden;
                    pointer-events: none;
                }
                @media (max-width: 380px) {
                    :host {
                        padding: 15px;
                        min-width: 280px;
                    }
                    button {
                        padding: 15px;
                        font-size: 18px;
                    }
                    .display {
                        font-size: 28px;
                        padding: 15px;
                    }
                }
            </style>
            <div class="display">0</div>
            <div class="buttons">
                <button>C</button>
                <button class="blank"></button>
                <button class="blank"></button>
                <button class="operator">÷</button>
                <button>7</button>
                <button>8</button>
                <button>9</button>
                <button class="operator">×</button>
                <button>4</button>
                <button>5</button>
                <button>6</button>
                <button class="operator">-</button>
                <button>1</button>
                <button>2</button>
                <button>3</button>
                <button class="operator">+</button>
                <button>0</button>
                <button>.</button>
                <button class="equals">=</button>
                <button class="operator">+</button>
            </div>
        `;

        this.display = this.shadowRoot.querySelector('.display');
        this.buttons = this.shadowRoot.querySelectorAll('button');
        this.currentValue = '';
        this.previousValue = '';
        this.operation = null;
        this.shouldResetDisplay = false;

        this.buttons.forEach(button => {
            button.addEventListener('click', this.handleButtonClick);
        });

        // Add keyboard support
        window.addEventListener('keydown', this.handleKeyPress);
    }

    disconnectedCallback() {
        this.buttons.forEach(button => {
            button.removeEventListener('click', this.handleButtonClick);
        });
        window.removeEventListener('keydown', this.handleKeyPress);
    }

    handleButtonClick = (event) => {
        this.handleButton(event.target.textContent);
    }

    handleKeyPress = (event) => {
        // Prevent default behavior for calculator keys
        if (event.key.match(/[0-9.+\-*/=]/) || event.key === 'Enter' || event.key === 'Escape') {
            event.preventDefault();
        }

        const key = event.key;
        const button = this.findButtonByKey(key);
        
        if (button) {
            this.animateButton(button);
        }

        // Map keyboard keys to calculator functions
        switch (key) {
            case '0':
            case '1':
            case '2':
            case '3':
            case '4':
            case '5':
            case '6':
            case '7':
            case '8':
            case '9':
            case '.':
                this.handleNumber(key);
                break;
            case '+':
                this.handleOperator('+');
                break;
            case '-':
                this.handleOperator('-');
                break;
            case '*':
                this.handleOperator('×');
                break;
            case '/':
                this.handleOperator('÷');
                break;
            case 'Enter':
            case '=':
                this.calculate();
                break;
            case 'Escape':
                this.clear();
                break;
        }
    }

    findButtonByKey(key) {
        const keyMap = {
            '/': '÷',
            '*': '×',
            'Enter': '=',
            'Escape': 'C'
        };
        const displayKey = keyMap[key] || key;
        return Array.from(this.buttons).find(button => button.textContent === displayKey);
    }

    animateButton(button) {
        button.style.backgroundColor = 'var(--calc-button-hover-bg-color)';
        button.style.transform = 'translateY(1px)';
        
        setTimeout(() => {
            button.style.backgroundColor = '';
            button.style.transform = '';
        }, 100);
    }

    handleButton(value) {
        if (value.match(/[0-9.]/)) {
            this.handleNumber(value);
        } else if (value === 'C') {
            this.clear();
        } else if ('+-×÷'.includes(value)) {
            this.handleOperator(value);
        } else if (value === '=') {
            this.calculate();
        }
    }

    handleNumber(num) {
        if (this.shouldResetDisplay) {
            this.currentValue = '';
            this.shouldResetDisplay = false;
        }
        if (num === '.' && this.currentValue.includes('.')) return;
        this.currentValue += num;
        this.updateDisplay();
    }

    handleOperator(op) {
        if (this.currentValue === '') return;
        if (this.previousValue !== '') {
            this.calculate();
        }
        this.operation = op;
        this.previousValue = this.currentValue;
        this.shouldResetDisplay = true;
    }

    calculate() {
        if (this.previousValue === '' || this.currentValue === '') return;
        
        let result;
        const prev = parseFloat(this.previousValue);
        const current = parseFloat(this.currentValue);

        switch (this.operation) {
            case '+':
                result = prev + current;
                break;
            case '-':
                result = prev - current;
                break;
            case '×':
                result = prev * current;
                break;
            case '÷':
                if (current === 0) {
                    this.display.textContent = 'Error';
                    return;
                }
                result = prev / current;
                break;
            default:
                return;
        }

        this.currentValue = result.toString();
        this.operation = null;
        this.previousValue = '';
        this.updateDisplay();
        this.shouldResetDisplay = true;
    }

    clear() {
        this.currentValue = '';
        this.previousValue = '';
        this.operation = null;
        this.updateDisplay();
    }

    updateDisplay() {
        this.display.textContent = this.currentValue || '0';
    }
}

customElements.define('calculator-app', Calculator);