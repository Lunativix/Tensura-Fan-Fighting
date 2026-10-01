/** Entrées d'archives. Le texte se débloque via StorySaveSlice.archives. */

export interface StoryArchiveEntry {
  id: string
  title: string
  kind: 'personnage' | 'lieu' | 'competence' | 'evenement' | 'faction'
  text: string
}

export const STORY_ARCHIVES: readonly StoryArchiveEntry[] = [
  { id: 'satoru-mikami', title: 'Satoru Mikami', kind: 'personnage', text: 'Humain de Tokyo. Meurt en protégeant quelqu\'un, puis se réincarne.' },
  { id: 'great-sage', title: 'Great Sage', kind: 'competence', text: 'Compétence Unique. Analyse, calcul, conseil. Voix intérieure de Rimuru.' },
  { id: 'rimuru-slime', title: 'Rimuru', kind: 'personnage', text: 'Slime né de Satoru Mikami dans la Grotte Scellée.' },
  { id: 'sealed-cave', title: 'Grotte Scellée', kind: 'lieu', text: 'Caverne magique où Veldora est scellé. Cristaux, faune, passages.' },
  { id: 'water-blade', title: 'Water Blade', kind: 'competence', text: 'Technique analysée par Great Sage dans la grotte. Premier Skill de Rimuru.' },
  { id: 'veldora-sealed', title: 'Veldora Tempest', kind: 'personnage', text: 'Dragon de la Tempête. Il nomme Rimuru. Rimuru propose Tempest. Predator pour analyser le sceau.' },
  { id: 'goblin-village', title: 'Village gobelin', kind: 'lieu', text: 'Les gobelins viennent après la disparition de l\'aura de Veldora. Ils demandaient la protection du dragon.' },
  { id: 'rigurd', title: 'Rigurd', kind: 'personnage', text: 'Chef gobelin. Premier nommé de la séquence Rigurd → Rigur → Gobta → Ranga.' },
  { id: 'rigur', title: 'Rigur', kind: 'personnage', text: 'Scout gobelin nommé par Rimuru, après Rigurd.' },
  { id: 'gobta', title: 'Gobta', kind: 'personnage', text: 'Gobelin nommé par Rimuru, après Rigur, avant Ranga.' },
  { id: 'direwolves', title: 'Loups de la tempête', kind: 'faction', text: 'Meute qui chassait les gobelins une fois l\'aura de Veldora disparue.' },
  { id: 'ranga', title: 'Ranga', kind: 'personnage', text: 'Chef de la meute. Nom : tempête + croc. Nommé après Rigurd, Rigur et Gobta.' },
  { id: 'ogre-survivors', title: 'Les six ogres', kind: 'evenement', text: 'Survivants du village ogre détruit par l\'armée orc.' },
  { id: 'benimaru', title: 'Benimaru', kind: 'personnage', text: 'Héritier ogre. Katana et flammes. Rejoint Rimuru après la confrontation.' },
  { id: 'shion', title: 'Shion', kind: 'personnage', text: 'Ogresse à l\'arme lourde. Force brute. Nommée par Rimuru.' },
  { id: 'shuna', title: 'Shuna', kind: 'personnage', text: 'Prêtresse ogre. Magie et soutien, pas une brawler générique.' },
  { id: 'souei', title: 'Souei', kind: 'personnage', text: 'Espion ogre. Observation et ombre.' },
  { id: 'hakurou', title: 'Hakurou', kind: 'personnage', text: 'Maître d\'armes ogre. Précision, katana.' },
  { id: 'kurobe', title: 'Kurobe', kind: 'personnage', text: 'Forgeron des six survivants. Pas un combattant de première ligne.' },
  { id: 'orc-war', title: 'Guerre des Orcs', kind: 'evenement', text: 'L\'armée orc, poussée par la famine et Gelmud, dévore Jura.' },
  { id: 'orc-disaster', title: 'Orc Disaster', kind: 'personnage', text: 'Seigneur Orc. Nom magique antérieur lié à Gelmud. Vaincu, puis nommé Geld.' },
  { id: 'geld', title: 'Geld', kind: 'personnage', text: 'Chef des orcs nommé par Rimuru. Construction, pas pillage.' },
  { id: 'gabiru', title: 'Gabiru', kind: 'personnage', text: 'Chef lizardman. D\'abord vaniteux, puis allié après l\'armée orc.' },
  { id: 'gelmud', title: 'Gelmud', kind: 'personnage', text: 'Mage qui a nommé le Seigneur Orc. Contexte de la famine magique, pas un boss joué ici.' },
  { id: 'shizu', title: 'Shizu', kind: 'personnage', text: 'Aventurière. Hôte d\'Ifrit. Rimuru l\'absorbe. Son apparence n\'est disponible qu\'après.' },
  { id: 'ifrit', title: 'Ifrit', kind: 'personnage', text: 'Esprit de flamme. Possession de Shizu. Vaincu par Rimuru.' },
  { id: 'rimuru-shizu-form', title: 'Forme humaine de Rimuru', kind: 'competence', text: 'Mimétisme humain à partir de Shizu. Avant ça, Rimuru est un slime.' },
  { id: 'tempest', title: 'Fédération Tempest', kind: 'lieu', text: 'Cité de Rimuru. Noms, murs, alliances.' },
  { id: 'kaijin', title: 'Kaijin', kind: 'personnage', text: 'Nain forgeron. Lien avec Dwargon.' },
  { id: 'gazel', title: 'Gazel Dwargo', kind: 'personnage', text: 'Roi-héros de Dwargon. Observe Tempest sans l\'écraser.' },
  { id: 'youm', title: 'Youm', kind: 'personnage', text: 'Aventurier proche de Tempest. Voix vers l\'Ouest.' },
  { id: 'fuze', title: 'Fuze', kind: 'personnage', text: 'Blumund. L\'œil diplomatique sur la nouvelle nation.' },
  { id: 'milim-visit', title: 'Visite de Milim', kind: 'evenement', text: 'Milim Nava arrive à Tempest. Amitié, miel, danger maximal.' },
  { id: 'charybdis', title: 'Charybdis', kind: 'evenement', text: 'Phobio plante un germe fourni par la faction de Clayman. Pas une invasion d\'Eurazania.' },
  { id: 'phobio', title: 'Phobio', kind: 'personnage', text: 'Subordonné de Carrion. Invoque Charybdis.' },
  { id: 'carrion', title: 'Carrion', kind: 'personnage', text: 'Demon Lord d\'Eurazania. Roi-bête.' },
  { id: 'albis', title: 'Albis', kind: 'personnage', text: 'L\'une des Trois Bêtes d\'Eurazania. Serpent.' },
  { id: 'suphia', title: 'Suphia', kind: 'personnage', text: 'L\'une des Trois Bêtes d\'Eurazania. Tigre.' },
  { id: 'falmuth', title: 'Farmus', kind: 'faction', text: 'Royaume humain. Envahit Tempest pendant l\'absence de Rimuru à Dwargon.' },
  { id: 'shion-fall', title: 'La chute de Shion', kind: 'evenement', text: 'Shion et plus de cent habitants meurent pendant que Rimuru est à Dwargon. Barrière sainte.' },
  { id: 'edmaris', title: 'Edmaris', kind: 'personnage', text: 'Roi de Farmus. Responsable politique de l\'invasion.' },
  { id: 'rimuru-rage', title: 'Colère de Rimuru', kind: 'evenement', text: 'Seuil vers le Harvest Festival et le siège de Demon Lord.' },
  { id: 'harvest-festival', title: 'Harvest Festival', kind: 'evenement', text: 'Évolution de Rimuru et des nommés. Demon Lord.' },
  { id: 'demon-lord-rimuru', title: 'Rimuru Demon Lord', kind: 'personnage', text: 'Rimuru après le Harvest Festival. Siège parmi les Demon Lords.' },
  { id: 'diablo', title: 'Diablo', kind: 'personnage', text: 'Primordial Noir. Rimuru lui donne le nom Diablo après le Harvest Festival.' },
  { id: 'clayman', title: 'Clayman', kind: 'personnage', text: 'Demon Lord manipulateur. Marionnettes, Eurazania, piège autour de Milim.' },
  { id: 'frey', title: 'Frey', kind: 'personnage', text: 'Demon Lord des harpies. Liée aux événements Milim / Clayman.' },
  { id: 'mjurran', title: 'Mjurran', kind: 'personnage', text: 'Mage liée à Clayman, puis à Youm et Tempest.' },
  { id: 'eurazania-crisis', title: 'Crise d\'Eurazania', kind: 'evenement', text: 'Clayman pousse Eurazania. Carrion, Frey, Milim.' },
  { id: 'walpurgis', title: 'Walpurgis', kind: 'lieu', text: 'Banquet des Demon Lords. Jugement. Sièges.' },
  { id: 'guy', title: 'Guy Crimson', kind: 'personnage', text: 'Demon Lord primordial. Hôte de Walpurgis.' },
  { id: 'ramiris', title: 'Ramiris', kind: 'personnage', text: 'Demon Lord. Labyrinthe. Présente à Walpurgis.' },
  { id: 'leon', title: 'Leon Cromwell', kind: 'personnage', text: 'Demon Lord. Présent au banquet.' },
  { id: 'daggrull', title: 'Daggrull', kind: 'personnage', text: 'Demon Lord imposant. Walpurgis.' },
  { id: 'dino', title: 'Dino', kind: 'personnage', text: 'Demon Lord. Walpurgis.' },
  { id: 'roy', title: 'Roy Valentine', kind: 'personnage', text: 'Demon Lord. Représentation de Walpurgis.' },
  { id: 'clayman-end', title: 'Jugement de Clayman', kind: 'evenement', text: 'Clayman perd son siège. Rimuru reste parmi les Demon Lords.' },
]

export function archiveById(id: string): StoryArchiveEntry | undefined {
  return STORY_ARCHIVES.find((entry) => entry.id === id)
}

export function unlockedArchiveEntries(ids: readonly string[]): StoryArchiveEntry[] {
  return STORY_ARCHIVES.filter((entry) => ids.includes(entry.id))
}
