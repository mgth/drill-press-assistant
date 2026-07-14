# tool-assistant — Assistant perceuse à colonne

Calcule les vitesses de broche d'une perceuse à colonne à partir de sa transmission
par courroies (poulies étagées), et recommande la position optimale des courroies
pour un diamètre de perçage et un matériau donnés, avec un schéma graphique.

- **Onglet Machine** : décrivez votre transmission — vitesse moteur (tr/min),
  2 ou 3 arbres (poulie intermédiaire à simple ou double cône), diamètres de
  chaque étage, positions de courroie possibles. Plusieurs machines peuvent être
  sauvegardées.
- **Onglet Perçage** : choisissez un matériau (acier, inox, fonte, alu, laiton,
  bois, plastique), un type de foret (HSS / carbure) et un diamètre : l'appli
  calcule la vitesse idéale (`n = Vc × 1000 / (π × D)`), recommande la
  combinaison la plus rapide qui ne la dépasse pas (+5 % toléré), affiche toutes
  les vitesses et dessine la position des courroies à l'échelle.

Stack : [Tauri 2](https://v2.tauri.app) + Svelte 5 + TypeScript. La logique de
calcul vit dans `src/lib/domain/` (TypeScript pur, testé avec vitest) ; le côté
Rust est une coquille minimale. Les machines sont persistées via
`tauri-plugin-store` (fichier `tool-assistant.json` dans le répertoire de
données de l'appli).

## Développement

```bash
npm install
npm run test        # tests unitaires du moteur de calcul (vitest)
npm run check       # svelte-check
npm run tauri dev   # appli desktop (Windows / Linux)
npm run dev         # UI seule dans un navigateur (persistance localStorage)
```

Prérequis Linux : `webkit2gtk-4.1`, `libayatana-appindicator`, `librsvg`
(voir [prérequis Tauri](https://v2.tauri.app/start/prerequisites/)).

## Build desktop

```bash
npm run tauri build   # binaire + paquets dans src-tauri/target/release/
```

## Android

Prérequis (une seule fois) :

1. Android Studio ou command-line tools : SDK Platform 34+, Build-Tools,
   Platform-Tools, **NDK** (side-by-side) et CMake.
2. JDK 17 (celui d'Android Studio convient).
3. Cibles Rust :
   ```bash
   rustup target add aarch64-linux-android armv7-linux-androideabi \
     i686-linux-android x86_64-linux-android
   ```
4. Variables d'environnement : `JAVA_HOME`, `ANDROID_HOME`,
   `NDK_HOME=$ANDROID_HOME/ndk/<version>`.

Puis :

```bash
npm run tauri android init    # génère src-tauri/gen/android (à commiter)
npm run tauri android dev     # émulateur ou appareil USB (adb)
npm run tauri android build -- --apk   # APK dans src-tauri/gen/android/…
```

Pour un APK de release signé, voir la
[documentation Tauri sur la signature Android](https://v2.tauri.app/distribute/sign/android/).
