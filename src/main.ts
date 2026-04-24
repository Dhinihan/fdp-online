import Phaser from 'phaser'

class CenaVazia extends Phaser.Scene {
  constructor() {
    super({ key: 'CenaVazia' })
  }
}

new Phaser.Game({
  width: 800,
  height: 600,
  scene: CenaVazia,
})
