// ============================================================
// MacroPanel.ts - Gene macro script editor UI
// ============================================================

import { MacroEngine } from '../macro/MacroEngine';

export class MacroPanel {
  private container: HTMLElement;
  private textarea!: HTMLTextAreaElement;
  private enableCheckbox!: HTMLInputElement;
  private runBtn!: HTMLButtonElement;
  private logEl!: HTMLElement;
  private macroEngine: MacroEngine;

  constructor(container: HTMLElement, macroEngine: MacroEngine) {
    this.container = container;
    this.macroEngine = macroEngine;
    this.build();
  }

  private build(): void {
    this.container.innerHTML = `
      <div class="macro-panel">
        <div class="macro-header">
          <span>基因宏腳本</span>
          <label class="macro-toggle">
            <input type="checkbox" id="macro-enable" /> 啟用
          </label>
        </div>
        <textarea id="macro-script" rows="5" placeholder="// 輸入巨集腳本...
// 範例:
// IF blue_ratio > 0.4 AND meteor_cooldown == 0 THEN CAST meteor AT highest_density_zone"
          style="width:100%;background:#0d1117;color:#c9d1d9;border:1px solid #30363d;border-radius:4px;padding:8px;font-family:monospace;font-size:11px;resize:vertical;"></textarea>
        <div class="macro-actions">
          <button id="macro-run" style="background:#238636;color:#fff;border:none;padding:4px 12px;border-radius:4px;cursor:pointer;font-size:12px;">解析並執行</button>
          <button id="macro-example" style="background:#1c2333;color:#888;border:1px solid #30363d;padding:4px 12px;border-radius:4px;cursor:pointer;font-size:12px;">載入範例</button>
        </div>
        <div id="macro-log" style="max-height:80px;overflow-y:auto;background:#0d1117;border:1px solid #30363d;border-radius:4px;padding:6px;margin-top:4px;font-family:monospace;font-size:10px;color:#8b949e;"></div>
      </div>
    `;

    this.textarea = this.container.querySelector('#macro-script') as HTMLTextAreaElement;
    this.enableCheckbox = this.container.querySelector('#macro-enable') as HTMLInputElement;
    this.runBtn = this.container.querySelector('#macro-run') as HTMLButtonElement;
    this.logEl = this.container.querySelector('#macro-log') as HTMLElement;

    // Event listeners
    this.enableCheckbox.addEventListener('change', () => {
      this.macroEngine.setEnabled(this.enableCheckbox.checked);
    });

    this.runBtn.addEventListener('click', () => {
      const script = this.textarea.value;
      const success = this.macroEngine.parseScript(script);
      this.updateLog();
      if (success) {
        this.runBtn.textContent = '✓ 已解析';
        this.runBtn.style.background = '#238636';
        setTimeout(() => { this.runBtn.textContent = '解析並執行'; }, 1500);
      } else {
        this.runBtn.textContent = '✗ 解析失敗';
        this.runBtn.style.background = '#da3633';
        setTimeout(() => { this.runBtn.textContent = '解析並執行'; this.runBtn.style.background = '#238636'; }, 1500);
      }
    });

    // Load example button
    const exampleBtn = this.container.querySelector('#macro-example') as HTMLButtonElement;
    exampleBtn.addEventListener('click', () => {
      this.textarea.value = MacroEngine.getExampleScript();
    });
  }

  updateLog(): void {
    const log = this.macroEngine.getLog();
    this.logEl.innerHTML = log.map(l => `<div>${l}</div>`).join('');
    this.logEl.scrollTop = this.logEl.scrollHeight;
  }

  getElement(): HTMLElement {
    return this.container;
  }
}
