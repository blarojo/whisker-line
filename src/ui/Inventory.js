// Inventory.js
//
// A small always-on-screen row of item slots, in the classic adventure-game
// tradition of a persistent inventory: click a held item to select it
// (highlighted), then click something in the scene to try using it there;
// click the held slot again to put it away. Scoped to a single scene — see
// "Future evolution" in docs/architecture-guide.md for carrying items
// across scenes, which nothing built so far needs yet.

export class Inventory {
  constructor(scene, { x = 16, y = 16, slotSize = 30, maxSlots = 5 } = {}) {
    this.scene = scene;
    this.slotSize = slotSize;
    this.selectedId = null;
    this.container = scene.add.container(x, y).setDepth(900);
    this.slots = [];

    for (let i = 0; i < maxSlots; i += 1) {
      const slotX = i * (slotSize + 6);

      const bg = scene.add
        .rectangle(slotX, 0, slotSize, slotSize, 0x0a0a12, 0.6)
        .setOrigin(0, 0)
        .setStrokeStyle(1, 0x4a4a5a, 0.9)
        .setInteractive({ useHandCursor: true });
      this.container.add(bg);

      const iconLayer = scene.add.container(slotX + slotSize / 2, slotSize / 2);
      this.container.add(iconLayer);

      const highlight = scene.add
        .rectangle(slotX, 0, slotSize, slotSize, 0xffe89a, 0)
        .setOrigin(0, 0)
        .setStrokeStyle(2, 0xffe89a, 0);
      this.container.add(highlight);

      const slot = { bg, iconLayer, highlight, item: null };
      this.slots.push(slot);
      bg.on('pointerdown', () => this._onSlotClicked(slot));
    }
  }

  _onSlotClicked(slot) {
    if (!slot.item) return;
    if (this.selectedId === slot.item.id) {
      this.clearSelection();
    } else {
      this.selectedId = slot.item.id;
      this._refreshHighlights();
    }
  }

  _refreshHighlights() {
    this.slots.forEach((slot) => {
      const isSelected = !!slot.item && slot.item.id === this.selectedId;
      slot.highlight.setStrokeStyle(2, 0xffe89a, isSelected ? 1 : 0);
    });
  }

  clearSelection() {
    this.selectedId = null;
    this._refreshHighlights();
  }

  getSelectedId() {
    return this.selectedId;
  }

  has(id) {
    return this.slots.some((slot) => slot.item && slot.item.id === id);
  }

  /** Add an item (defined in src/data/Items.js) to the first free slot. */
  add(item) {
    if (this.has(item.id)) return;
    const slot = this.slots.find((s) => !s.item);
    if (!slot) return; // no free slots — not a scenario this scope reaches
    slot.item = item;
    item.draw(this.scene, slot.iconLayer, this.slotSize - 10);

    // A little "pop" so picking something up feels like an event.
    slot.iconLayer.setScale(0);
    this.scene.tweens.add({
      targets: slot.iconLayer,
      scale: 1,
      duration: 220,
      ease: 'Back.easeOut',
    });
  }

  remove(id) {
    const slot = this.slots.find((s) => s.item && s.item.id === id);
    if (slot) {
      slot.iconLayer.removeAll(true);
      slot.item = null;
    }
    if (this.selectedId === id) this.clearSelection();
  }
}
