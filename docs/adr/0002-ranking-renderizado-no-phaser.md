# Ranking renderizado no Phaser

O Ranking do FDP será renderizado pelo adapter Phaser, não por um overlay DOM/HTML em produção. Embora o protótipo tenha usado HTML para validar layout rapidamente, a implementação final permanece no mesmo sistema de cena, input e coordenadas do jogo para manter consistência visual, evitar dois modelos de interface no MVP e preservar o core como TypeScript puro desacoplado da engine.

> Atualização (ver ADR 0004): esta decisão governa a **UI de jogo interativa**. **Conteúdo estático de onboarding** — o tutorial "Como jogar" — é a exceção e usa HTML/DOM, pela fronteira definida no ADR 0004.
