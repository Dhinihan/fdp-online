# Ranking renderizado no Phaser

O Ranking do FDP será renderizado pelo adapter Phaser, não por um overlay DOM/HTML em produção. Embora o protótipo tenha usado HTML para validar layout rapidamente, a implementação final permanece no mesmo sistema de cena, input e coordenadas do jogo para manter consistência visual, evitar dois modelos de interface no MVP e preservar o core como TypeScript puro desacoplado da engine.
