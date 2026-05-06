export function limparObjetos(objetos: Phaser.GameObjects.GameObject[]): void {
  for (const o of objetos) o.destroy();
  objetos.length = 0;
}
