// ============================================================
// SkillPanel.ts - Skill buttons with cooldown display
// ============================================================

import { SkillType, SkillInstance, COLORS, CellState } from '../Types';

export class SkillPanel {
  private container: HTMLElement;
  private buttons: Map<SkillType, HTMLButtonElement> = new Map();
  private cooldownOverlays: Map<SkillType, HTMLDivElement> = new Map();
  private onSkillSelect: (type: SkillType) => void;
  private activeFaction: CellState = CellState.RED;
  private factionBtn!: HTMLButtonElement;

  constructor(container: HTMLElement, onSkillSelect: (type: SkillType) => void) {
    this.container = container;
    this.onSkillSelect = onSkillSelect;
    this.build();
  }

  private build(): void {
    this.container.innerHTML = `
      <div class="skill-panel">
        <div class="skill-header">
          <span>戰術技能</span>
          <button class="faction-toggle" id="faction-toggle" style="background:${COLORS[CellState.RED]};border:none;color:#fff;padding:3px 10px;border-radius:4px;cursor:pointer;font-size:12px;">
            紅軍
          </button>
        </div>
        <div class="skill-buttons" id="skill-buttons"></div>
      </div>
    `;

    const btnContainer = this.container.querySelector('#skill-buttons')!;
    this.factionBtn = this.container.querySelector('#faction-toggle') as HTMLButtonElement;

    const skills: Array<{ type: SkillType; icon: string; name: string }> = [
      { type: SkillType.METEOR, icon: '☄️', name: '隕石' },
      { type: SkillType.GENE_BOOST, icon: '🧬', name: '強化' },
      { type: SkillType.SWAMP_TERRAIN, icon: '🌿', name: '沼澤' },
    ];

    for (const skill of skills) {
      const wrapper = document.createElement('div');
      wrapper.className = 'skill-btn-wrapper';
      wrapper.style.cssText = 'position:relative;display:inline-block;margin:3px;';

      const btn = document.createElement('button');
      btn.className = 'skill-btn';
      btn.innerHTML = `<span class="skill-icon">${skill.icon}</span><span class="skill-name">${skill.name}</span>`;
      btn.style.cssText = `
        background: #1c2333;
        border: 2px solid #2d3748;
        color: #e0e0e0;
        padding: 8px 12px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 13px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 2px;
        min-width: 60px;
        transition: all 0.15s;
      `;
      btn.title = skill.name;

      const overlay = document.createElement('div');
      overlay.className = 'cooldown-overlay';
      overlay.style.cssText = `
        position: absolute;
        top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0,0,0,0.7);
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #ff6b6b;
        font-weight: bold;
        font-size: 14px;
        pointer-events: none;
        display: none;
      `;

      btn.addEventListener('click', () => {
        this.onSkillSelect(skill.type);
        btn.style.borderColor = '#ffd93d';
        setTimeout(() => { btn.style.borderColor = '#2d3748'; }, 300);
      });

      btn.addEventListener('mouseenter', () => {
        btn.style.background = '#2d3748';
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.background = '#1c2333';
      });

      wrapper.appendChild(btn);
      wrapper.appendChild(overlay);
      btnContainer.appendChild(wrapper);

      this.buttons.set(skill.type, btn);
      this.cooldownOverlays.set(skill.type, overlay);
    }

    // Faction toggle
    this.factionBtn.addEventListener('click', () => {
      this.activeFaction = this.activeFaction === CellState.RED ? CellState.BLUE : CellState.RED;
      this.factionBtn.textContent = this.activeFaction === CellState.RED ? '紅軍' : '藍軍';
      this.factionBtn.style.background = COLORS[this.activeFaction];
    });
  }

  getActiveFaction(): CellState {
    return this.activeFaction;
  }

  updateSkills(skills: SkillInstance[]): void {
    for (const skill of skills) {
      const btn = this.buttons.get(skill.type);
      const overlay = this.cooldownOverlays.get(skill.type);
      if (!btn || !overlay) continue;

      if (skill.currentCooldown > 0) {
        overlay.style.display = 'flex';
        overlay.textContent = skill.currentCooldown.toString();
        btn.style.opacity = '0.6';
        btn.style.cursor = 'not-allowed';
      } else {
        overlay.style.display = 'none';
        btn.style.opacity = '1';
        btn.style.cursor = 'pointer';
      }
    }
  }

  getElement(): HTMLElement {
    return this.container;
  }
}
